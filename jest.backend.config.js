export default {
  // display name
  displayName: "backend",



  // when testing backend
  testEnvironment: "node",

 transform: {},                    // <- disable Babel for ESM files
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",  // <- optional: fixes relative imports in ESM
    },

  // which test to run
    testMatch: [
        "<rootDir>/controllers/**/*.test.js",
        "<rootDir>/helpers/**/*.test.js",
        "<rootDir>/middlewares/**/*.test.js",
        "<rootDir>/models/**/*.test.js",
    ],
  // jest code coverage
  collectCoverage: true,
    collectCoverageFrom: ["controllers/**", "helpers/**", "middlewares/**", "models/**"],
    coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};