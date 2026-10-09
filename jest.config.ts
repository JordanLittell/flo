import type { Config } from "jest";
import nextJest from "next/jest.js";

// Loads next.config, tsconfig paths and .env files into the test environment.
const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "node",
  passWithNoTests: true,
  // *.test.e2e.ts files call paid APIs, so they only run through `npm run test:e2e`.
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "\\.test\\.e2e\\.ts$"],
};

export default createJestConfig(config);
