// jest.backend.config.js (ESM)
export default {
  displayName: "backend",

  // Environment backend
  testEnvironment: "node",

  // File test yang dijalankan
  testMatch: [
    "<rootDir>/controllers/*.unit.test.js",
    "<rootDir>/tests/*.test.js"
  ],

  // Abaikan folder ini
  testPathIgnorePatterns: ["<rootDir>/client/", "<rootDir>/node_modules/"],

  // Coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "routes/**/*.js",
    "helpers/**/*.js",
    "models/**/*.js",
    "server.js",
    "!**/*.test.js",
    "!**/*.unit.test.js",
    "!**/node_modules/**"
  ],
  coverageDirectory: "server/coverage",
  coverageReporters: ["lcov", "text", "html"]
};
