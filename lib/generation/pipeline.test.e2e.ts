import { generateTranscript, SegmentSchema, TranscriptSchema, type Transcript, type TranscriptGenerationEvent } from "./transcript";

// Calls the real Claude API, so it's slow and costs credit. Run with `npm run test:e2e`.
const withApiKey = process.env.ANTHROPIC_API_KEY ? test : test.skip;

describe("generation pipeline (e2e)", () => {
  withApiKey(
    "generates a step and content blocks as they stream",
    async () => {
      const events: TranscriptGenerationEvent[] = [];
      const generator = generateTranscript({ prompt: "A gentle neck and shoulder stretch", minutes: 1, level: "Beginner" });
      for await (const event of generator) {
        if (event.type === "step") {
          expect(event).toMatchObject({ type: "step", step: "script", status: "active" });
        } else {
          expect(event).toMatchObject({ type: "content", content: expect.any(String) });
        }
      }
    },
    5 * 60_000,
  );

  withApiKey(
    "generates a full transcript when content blocks are assembled",
    async () => {
      let transcript = "";
      const events: TranscriptGenerationEvent[] = [];
      const generator = generateTranscript({ prompt: "A gentle neck and shoulder stretch", minutes: 1, level: "Beginner" });
      for await (const event of generator) {
        if (event.type === "content") {
          transcript += event.content.text;
        }
      }
      console.log(transcript);
    },
    5 * 60_000,
  );
});
