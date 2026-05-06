/**
 * useRealtimeVoice — hook for OpenAI Realtime voice via WebRTC
 *
 * Handles:
 * 1. Fetching ephemeral session token from /api/realtime-session
 * 2. Setting up WebRTC peer connection
 * 3. Capturing microphone audio and sending to OpenAI
 * 4. Playing back AI audio response (single audio path - WebRTC only)
 * 5. Capturing transcripts via data channel events
 * 6. Clean disconnection of all resources
 */
"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export type VoiceStatus = "idle" | "connecting" | "connected" | "error";

interface UseRealtimeVoiceOptions {
  onTranscript?: (role: "user" | "echo", text: string) => void;
  onTextDelta?: (delta: string) => void;
  onResponseStart?: () => void;
  userId?: string;
}

interface UseRealtimeVoiceReturn {
  status: VoiceStatus;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  commitAudio: () => void;
  isSpeaking: boolean;
  isConnected: boolean;
}

export function useRealtimeVoice(options?: UseRealtimeVoiceOptions): UseRealtimeVoiceReturn {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const isConnectingRef = useRef(false);
  const hasConnectedRef = useRef(false);

  // Keep callbacks and latest values in refs so closures always see current data
  const onTranscriptRef = useRef(options?.onTranscript);
  const onTextDeltaRef = useRef(options?.onTextDelta);
  const onResponseStartRef = useRef(options?.onResponseStart);
  useEffect(() => {
    onTranscriptRef.current = options?.onTranscript;
    onTextDeltaRef.current = options?.onTextDelta;
    onResponseStartRef.current = options?.onResponseStart;
  }, [options?.onTranscript, options?.onTextDelta, options?.onResponseStart]);

  const cleanup = useCallback(() => {
    console.log("[RealtimeVoice] Cleaning up resources...");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("[RealtimeVoice] Stopped mic track");
      });
      streamRef.current = null;
    }

    if (dataChannelRef.current) {
      try { dataChannelRef.current.close(); } catch { /* ignore */ }
      dataChannelRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current.load();
      audioRef.current = null;
      console.log("[RealtimeVoice] Audio element cleaned up");
    }

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.onnegotiationneeded = null;
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });
      pcRef.current.close();
      pcRef.current = null;
      console.log("[RealtimeVoice] Peer connection closed");
    }

    setIsConnected(false);
    setIsSpeaking(false);
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
    if (isConnectingRef.current) {
      console.log("[RealtimeVoice] Already connecting, skipping...");
      return;
    }

    if (pcRef.current || streamRef.current) {
      console.log("[RealtimeVoice] Cleaning up existing connection before new connect");
      cleanup();
    }

    isConnectingRef.current = true;
    setStatus("connecting");
    setError(null);

    try {
      console.log("[RealtimeVoice] Step 1: Fetching session token...");
      const tokenRes = await fetch("/api/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: options?.userId }),
      });
      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create session");
      }
      const sessionData = await tokenRes.json();
      const clientSecret = sessionData.client_secret?.value;
      if (!clientSecret) throw new Error("No client secret returned from server");

      console.log("[RealtimeVoice] Step 2: Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      console.log("[RealtimeVoice] Microphone access granted");

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audio = new Audio();
      audio.autoplay = true;
      audio.volume = 1.0;
      audioRef.current = audio;

      pc.ontrack = (event) => {
        console.log("[RealtimeVoice] Received remote audio track");
        if (audioRef.current) audioRef.current.srcObject = event.streams[0];
      };

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        pc.addTrack(audioTrack, stream);
        console.log("[RealtimeVoice] Added local audio track");
      }

      const dataChannel = pc.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.log("[RealtimeVoice] Data channel opened");
        dataChannel.send(JSON.stringify({
          type: "session.update",
          session: {
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 600,
            },
          },
        }));

      };

      dataChannel.onerror = (err) => {
        console.error("[RealtimeVoice] Data channel error:", err);
      };

      dataChannel.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "input_audio_buffer.speech_started") {
            setIsSpeaking(true);
          } else if (msg.type === "input_audio_buffer.speech_stopped") {
            setIsSpeaking(false);
          } else if (msg.type === "response.created") {
            onResponseStartRef.current?.();
          } else if (msg.type === "response.audio_transcript.delta" && msg.delta) {
            onTextDeltaRef.current?.(msg.delta);
          } else if (
            msg.type === "conversation.item.input_audio_transcription.completed" &&
            msg.transcript?.trim()
          ) {
            onTranscriptRef.current?.("user", msg.transcript.trim());
          } else if (
            msg.type === "response.audio_transcript.done" &&
            msg.transcript?.trim()
          ) {
            onTranscriptRef.current?.("echo", msg.transcript.trim());
          }
        } catch {
          // Ignore parse errors from non-JSON messages
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("[RealtimeVoice] Created and set local offer");

      const model = sessionData.model || "gpt-4o-realtime-preview-2024-12-17";
      console.log("[RealtimeVoice] Step 8: Connecting to OpenAI Realtime...");

      const sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        const errorText = await sdpRes.text();
        console.error("[RealtimeVoice] OpenAI SDP error:", sdpRes.status, errorText);
        throw new Error(`OpenAI error: ${sdpRes.status}`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      console.log("[RealtimeVoice] Set remote description");

      pc.onconnectionstatechange = () => {
        const newState = pc.connectionState;
        console.log("[RealtimeVoice] Connection state changed:", newState);

        if (newState === "connected") {
          setStatus("connected");
          setIsConnected(true);
          isConnectingRef.current = false;
          hasConnectedRef.current = true;
        } else if (newState === "disconnected" || newState === "failed" || newState === "closed") {
          setStatus("idle");
          setIsConnected(false);
          isConnectingRef.current = false;
          if (newState === "failed") setError("Connection failed");
        }
      };

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

  // Kept for potential future use (e.g. force-interrupt)
  const commitAudio = useCallback(() => {
    const dc = dataChannelRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify({ type: "response.cancel" }));
    dc.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    dc.send(JSON.stringify({ type: "response.create" }));
  }, []);

  useEffect(() => {
    return () => {
      console.log("[RealtimeVoice] Component unmounting, cleaning up");
      cleanup();
    };
  }, [cleanup]);

  return { status, error, connect, disconnect, commitAudio, isSpeaking, isConnected };
}
