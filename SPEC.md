# YoFlow Spec

Decisions that refine the vision in [HUMAN.md](HUMAN.md). Where the two conflict, this doc wins.

## Stack

- **Framework:** Next.js 16 (App Router), deployed on Vercel. Remix is not used.
- **Auth:** Supabase Auth with Google sign-in.
- **Database:** Supabase Postgres (users, templates, catalog sessions).
- **Media store:** Vercel Blob (voice and music mp3s).
- **Transcript generation:** Claude Opus 5.5 (`claude-opus-5-5`), called directly through the Anthropic API (not AI Gateway).
- **Voice and music generation:** ElevenLabs.

## Design System

All UI follows the YoFlow design system: https://claude.ai/artifact/6ABRNjQeiAh2ffaTPMZqHB (start with its `project/README.md` and `project/tokens.json`). It has been updated to match this spec: `PromptField` (not search), Community flows on the home screen, a `PrepareLoader` driven by the real generation steps, and Google-only sign-in.

## Home Screen

Shown to authenticated users.

- **Prompt box:** a text input where the user describes the session they want (e.g. "20 minutes of hip openers for tight hamstrings"). Opus creates a new session from it. There is no search of existing flows.
- **Time filter:** sets the session length. If the prompt names a length, the prompt wins.
- **Popular flows:** curated, pre-written templates. Each template has a name, duration, level, and an ordered list of poses with hold times.
- **Community flows:** sessions generated from earlier user prompts, replayable by anyone. Each one shows only its Opus-generated title: no user name, no prompt text.

## Session Setup

Templates and prompts go through the same path:

1. **Vibe:** pills such as chill, ambient or uplifting. Tapping one plays a pre-made sample loop and changes the screen color. Sub-pills (e.g. chill → tropical) are a later extension.
2. **Voice:** the user picks an ElevenLabs instructor voice.
3. **Loading:** the progress bar follows the real generation steps, with user-friendly labels:
   - "Designing your flow": Opus writes the script
   - "Recording your instructor": ElevenLabs turns the script into speech
   - "Composing your music": ElevenLabs generates the music (depends only on the vibe and length, so it can run at the same time as the voice)
   - "Getting everything ready": saving to Blob and preparing playback

   The whole session is generated before playback starts. That latency is acceptable.
4. **Session:** a timer starts and the instructor begins the class.

## Transcript Rules

- The instructor knows how long to hold each pose and when to transition.
- Holds are never silent. During a hold the instructor gives position pointers and breathing cues, spaced out with short ElevenLabs pause tags.
- The instructor repeats helpful positioning tips.

## Playback

- Voice and music play as two tracks in the browser, read from Vercel Blob.
- Pause, resume and exit control both tracks and the timer together.

## Catalog

- Every prompt-generated session is saved: generated title, script, length, vibe, voice, and audio URLs.
- Catalog sessions appear under Community flows on the home screen.
- Tapping a Community flow plays it right away: no vibe, voice or loading steps. Its saved vibe and voice can't be changed, and the saved files play without generating anything again.
