/**
 * Echo Prompts
 *
 * Central location for all Echo persona and mode-specific prompts.
 * These are used by the API routes to configure the AI responses.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory of this file in Next.js server context
const __dirname = dirname(fileURLToPath(import.meta.url));

// Prompts are in the same directory as this file
const PROMPTS_DIR = __dirname;

function readPromptFile(filename: string): string {
  try {
    return readFileSync(join(PROMPTS_DIR, filename), "utf-8");
  } catch (err) {
    console.error(`Failed to read ${filename}:`, err);
    return "";
  }
}

// ─── Core Persona (shared foundation) ────────────────────────────────
export const CORE_PERSONA = readPromptFile("echo-core-persona.md");

// ─── Text Mode Prompt ────────────────────────────────────────────────
export const TEXT_MODE_PROMPT = readPromptFile("text-mode-prompt.md");

// ─── Realtime Voice Prompt ───────────────────────────────────────────
export const REALTIME_VOICE_PROMPT = readPromptFile("realtime-voice-prompt.md");

// ─── Combined Prompts ────────────────────────────────────────────────
/**
 * Text mode: Core persona + text-specific rules
 */
export const TEXT_MODE_SYSTEM = `${CORE_PERSONA}\n\n${TEXT_MODE_PROMPT}`;

/**
 * Voice mode: Core persona + voice-specific rules
 */
export const REALTIME_VOICE_SYSTEM = `${CORE_PERSONA}\n\n${REALTIME_VOICE_PROMPT}`;

/**
 * Text mode API prompt - simplified version for API calls
 */
export const TEXT_MODE_API = TEXT_MODE_PROMPT;
