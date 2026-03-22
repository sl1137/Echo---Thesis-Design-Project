/**
 * useRealtimeVoice — hook for OpenAI Realtime voice via WebRTC
 *
 * Handles:
 * 1. Fetching ephemeral session token from /api/realtime-session
 * 2. Setting up WebRTC peer connection
 * 3. Capturing microphone audio and sending to OpenAI
 * 4. Playing back AI audio response (single audio path - WebRTC only)
 * 5. Clean disconnection of all resources
 */
"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export type VoiceStatus = "idle" | "connecting" | "connected" | "error";

interface UseRealtimeVoiceReturn {
  status: VoiceStatus;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

export function useRealtimeVoice(): UseRealtimeVoiceReturn {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use refs for values that change frequently to avoid stale closures
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const isConnectingRef = useRef(false);
  const hasConnectedRef = useRef(false);

  // Cleanup function that ensures all resources are released
  const cleanup = useCallback(() => {
    console.log("[RealtimeVoice] Cleaning up resources...");

    // Stop all microphone tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("[RealtimeVoice] Stopped mic track");
      });
      streamRef.current = null;
    }

    // Close data channel
    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close();
      } catch (e) {
        // Ignore errors on close
      }
      dataChannelRef.current = null;
    }

    // Remove audio element completely
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current.load(); // Reset the audio element
      audioRef.current = null;
      console.log("[RealtimeVoice] Audio element cleaned up");
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.onnegotiationneeded = null;

      // Close all senders first
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });

      pcRef.current.close();
      pcRef.current = null;
      console.log("[RealtimeVoice] Peer connection closed");
    }

    setIsConnected(false);
  }, []);

  const disconnect = useCallback(() => {
    console.log("[RealtimeVoice] Disconnecting...");
    isConnectingRef.current = false;
    hasConnectedRef.current = false;
    cleanup();
    setStatus("idle");
    setError(null);
  }, [cleanup]);

  const connect = useCallback(async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log("[RealtimeVoice] Already connecting, skipping...");
      return;
    }

    // Clean up any existing connection first
    if (pcRef.current || streamRef.current) {
      console.log("[RealtimeVoice] Cleaning up existing connection before new connect");
      cleanup();
    }

    isConnectingRef.current = true;
    setStatus("connecting");
    setError(null);

    try {
      console.log("[RealtimeVoice] Step 1: Fetching session token...");
      // Step 1: Get ephemeral session token from our server
      const tokenRes = await fetch("/api/realtime-session", { method: "POST" });
      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create session");
      }
      const sessionData = await tokenRes.json();
      const clientSecret = sessionData.client_secret?.value;
      if (!clientSecret) {
        throw new Error("No client secret returned from server");
      }

      console.log("[RealtimeVoice] Step 2: Requesting microphone access...");
      // Step 2: Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;
      console.log("[RealtimeVoice] Microphone access granted");

      // Step 3: Create WebRTC peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Step 4: Set up remote audio playback - SINGLE AUDIO PATH
      // Only create ONE audio element and attach it to the peer connection
      const audio = new Audio();
      audio.autoplay = true;
      audio.volume = 1.0;
      audioRef.current = audio;

      // CRITICAL: Only set ontrack ONCE. This is the ONLY audio output path.
      pc.ontrack = (event) => {
        console.log("[RealtimeVoice] Received remote audio track");
        // Make absolutely sure we don't create multiple audio elements
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
        }
      };

      // Step 5: Add microphone track to peer connection (ONE sender)
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        pc.addTrack(audioTrack, stream);
        console.log("[RealtimeVoice] Added local audio track");
      }

      // Step 6: Create data channel (required by OpenAI Realtime)
      const dataChannel = pc.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.log("[RealtimeVoice] Data channel opened");
      };

      dataChannel.onerror = (err) => {
        console.error("[RealtimeVoice] Data channel error:", err);
      };

      // Step 7: Create offer and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("[RealtimeVoice] Created and set local offer");

      // Step 8: Send offer to OpenAI Realtime and get answer
      const model = sessionData.model || "gpt-4o-realtime-preview-2024-12-17";
      console.log("[RealtimeVoice] Step 8: Connecting to OpenAI Realtime...");

      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime?model=${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${clientSecret}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpRes.ok) {
        const errorText = await sdpRes.text();
        console.error("[RealtimeVoice] OpenAI SDP error:", sdpRes.status, errorText);
        throw new Error(`OpenAI error: ${sdpRes.status}`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });
      console.log("[RealtimeVoice] Set remote description");

      // Step 9: Monitor connection state
      pc.onconnectionstatechange = () => {
        const newState = pc.connectionState;
        console.log("[RealtimeVoice] Connection state changed:", newState);

        if (newState === "connected") {
          setStatus("connected");
          setIsConnected(true);
          isConnectingRef.current = false;
          hasConnectedRef.current = true;
        } else if (
          newState === "disconnected" ||
          newState === "failed" ||
          newState === "closed"
        ) {
          setStatus("idle");
          setIsConnected(false);
          isConnectingRef.current = false;

          if (newState === "failed") {
            setError("Connection failed");
          }
        }
      };

      // Handle case where connection is already established
      if (pc.connectionState === "connected") {
        setStatus("connected");
        setIsConnected(true);
        isConnectingRef.current = false;
      }

    } catch (err) {
      console.error("[RealtimeVoice] Connection error:", err);
      isConnectingRef.current = false;
      setError(err instanceof Error ? err.message : "Connection failed");
      setStatus("error");
      cleanup();
    }
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[RealtimeVoice] Component unmounting, cleaning up");
      cleanup();
    };
  }, [cleanup]);

  return { status, error, connect, disconnect, isConnected };
}
