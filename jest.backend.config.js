export default {
  displayName: "backend",
  testEnvironment: "node",
  transform: {},
  globalSetup: "<rootDir>/tests/globalSetup.js",
  globalTeardown: "<rootDir>/tests/globalTeardown.js",
  setupFilesAfterEnv: ["<rootDir>/tests/setupFile.js"],
  testMatch: [
    "<rootDir>/controllers/**/*.test.js",
    "<rootDir>/controllers/**/*.integration.test.js",
    "<rootDir>/helpers/**/*.test.js",
    "<rootDir>/middlewares/**/*.test.js",
    "<rootDir>/models/**/*.test.js",
    "<rootDir>/tests/**/*.test.js",
    "<rootDir>/tests/**/*.int.test.js",
    "<rootDir>/tests/**/*.integration.test.js",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/client/",
    "<rootDir>/node_modules/",
    "<rootDir>/controllers/auth.update.unit.test.js",
    "<rootDir>/controllers/auth.controller.test.js",
    "<rootDir>/controllers/health.test.js",
    "<rootDir>/controllers/orders.controller.test.js",
    "<rootDir>/controllers/orders.controllers.unit.test.js",
  ],
  maxWorkers: 1,
  testTimeout: 30000,
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**",
    "helpers/**",
    "middlewares/**",
    "models/**",
    "!**/*.test.js",
    "!**/*.unit.test.js",
    "!**/node_modules/**"
  ],
  coverageThreshold: {
    global: { lines: 0, functions: 0 } 
  },
};
