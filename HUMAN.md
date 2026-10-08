# Pitch

Tired of doing yoga in a cramped room with the same instructors using the same routines? YoFlow is the answer. All you need is a mat and an wifi. YoFlow will handle the rest. Our application will customize the yoga routine, instructor, and music to your exact liking. 

# Core User Story
- I as a new user want to log in to the app in the most convenient way possible. 
- I as an authenticated user, want to be presented with a search bar, time filter, and a list of popular yoga flows below. 
- When I click on a yoga flow, I want to set the vibe: chill, ambient, uplifting, etc. When I set the vibe, I will hear different sounds and the screen will change color based on the vibe. 
- When I configure the flow, then I should be presented with instructor voices. I choose the voice the matches my preference.
- When I choose the voice that matches my preference. I see a loading screen that rotates between: “cleaning up the audio,” “enhancing quality,” “setting the vibes”. During this time I see a loader go from 0% to 100%. Then my session starts. I see a timer start and a hear the voice start off the class. 
- The instructor is aware of how long we should hold each pose and when to transition from one pose into another. The instructor repeats helpful tips on how to position the body to do the pose correctly.
- I can pause/resume/exit the class at any time.

# Content Generation

## Overal Architecture
User -> (prompt) -> Opus -> (transcript) -> ElevenLabs -> (mp3) -> Media Store
User -> (prompt) -> ElevenLabs -> (mp3) -> Media Store

User -> Browser MediaPlayer <--- MediaStore


## Transcript Generation
This is the crux of what we are offering. We need to generate high-quality yoga transcripts that sound realistic and include pauses that you would encounter in a real class. Luckily, ElevnLabs allows you to insert tags, which will induce the pause for you. This simplifies our application code a lot. It delegates the pausing to the transcript generation.

We don't have time to test LLMS, so I will use claude opus 5 to do the transcript generation with pauses.

## Voice Generation
We will use ElevenLabs for voice generation. We will have to either generate this up front or stream through a websocket depending on latency. Ideally we save it to object store that we control so that we can build a catalogue over time. The input to the Voic generation will be the opus 5 transcript.

## Music Generation
We will also generate music using ElevenLabs. The music file will be streamed to the media storage blob and then read from the browser's MediaPlyer. There will be pills in the frontend that the user can choose to simplify music curation. We will ideally extend on this to add sub pills. For instance, a user could pick chill, but then may want tropical, ambient, etc.

# Infrastructure

## Hosting
We will be deploying on Vercel as there is an existing integration with REMIX and it handles connecting github to deployments quickly. We will use supabase as the managed pg database and the native Vercel Object storage since it is simple to set up and is cost-efficient. The Vercel object store will be the media store.

## Authentication
We will do oauth for now as it is simple to set up and does not require rolling out a whole authentication system. We should allow for basic username/password sign up using an existing library that uses a hashing function and salt for the password. We don't want to roll our own auth out. We should also include convenient OIDC options as well like sign in with google, since they are easier for the user.

# UI
We will be following this design system: https://claude.ai/artifact/6ABRNjQeiAh2ffaTPMZqHB
