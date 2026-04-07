# Echo Realtime Prototype - Project Guide

## Project Goal

This project is a mobile-first prototype of Echo, an emotionally supportive chatbot for international graduate students.

The prototype should support two interaction modes:

### 1. Voice Mode
- user taps microphone and speaks in real time
- Echo responds with voice in real time
- no transcript should be shown on screen during live voice interaction
- the UI should feel immersive, calm, and minimal

### 2. Text Mode
- user types into the input field
- Echo responds in visible chat bubbles
- this should behave like a normal chatbot chat screen

---

## Echo Language Behavior — CRITICAL RULE

**Echo always responds in the same language the user is currently speaking.**

- **Default language is English.** Echo speaks English unless the user speaks Chinese first.
- If the user speaks Chinese → respond in Chinese.
- If the user switches languages mid-conversation → switch immediately.
- NEVER respond in Chinese when the user is speaking English.
- NEVER mix languages in a single response.

This rule applies to both voice mode and text mode. It must be reflected in all system prompts under `app/prompts/`. When editing any prompt file, do not remove this rule.

---

## Core Product Principles

Echo is not a productivity tool or a clinical mental health system.

Echo should feel:
- warm
- validating
- low-pressure
- emotionally safe
- gentle
- mobile-first

The product should support emotional expression, contextual resonance, and light reflective support.

---

## Technical Direction

### Frontend
Use this Next.js project as the main frontend app.

### Realtime Voice
The long-term direction is:
- realtime voice conversation
- voice-only visible output in voice mode
- text + bubbles in text mode

### n8n
n8n should not be the main realtime voice engine.

n8n should be used for:
- simple memory
- summary generation
- post-conversation processing
- future weekly snapshot support

---

## Current Priorities

When editing this project, prioritize the following order:

1. create a clean mobile-first UI shell
2. implement text mode layout
3. implement voice mode layout
4. add mode switching behavior
5. later connect realtime voice
6. later connect memory / summary

Do not try to build everything at once.

---

## File Usage Rules

- Follow all visual and component rules defined in `design.md`.
- Keep the UI consistent with the Echo visual system.
- Prefer reusable components over one-off styling.
- Do not introduce random new colors, shadows, or spacing systems.
- Do not make the UI visually noisy.

---

## Design Rules Reference

Always follow `design.md` when creating or updating:
- pages
- buttons
- cards
- chat bubbles
- navigation
- input fields
- voice mode UI

If there is a conflict between an old page and `design.md`, follow `design.md`.

---

## Implementation Rules

- Build mobile-first layouts.
- Keep the app visually coherent across screens.
- Use a single recurring design language.
- Use voice mode and text mode as distinct UI states.
- Voice mode should be minimal and not show transcript.
- Text mode should show messages clearly.

---

## Near-Term Scope

The first usable prototype should include:
- a mobile-style entry or home screen
- a text chat screen
- a voice chat screen
- simple mode switching

The next layer can include:
- simple memory
- summary card
- additional pages from Figma

---

## Things to Avoid

- avoid turning this into a generic SaaS dashboard
- avoid harsh black shadows
- avoid cluttered UI
- avoid mixing too many visual styles
- avoid showing transcript in live voice mode
- avoid making the UI feel like a clinical therapy tool

---

## Working Style

When generating code:
- keep components clean and modular
- prefer maintainable React structure
- prefer readable Tailwind classes
- implement one stable step at a time
- do not overbuild features before the UI shell is stable