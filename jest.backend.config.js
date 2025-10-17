export default {
    // display name
    displayName: "backend",



    // when testing backend
    testEnvironment: "node",

    transform: {},                    // <- disable Babel for ESM files
  //  moduleNameMapper: {
   //     "^(\\.{1,2}/.*)\\.js$": "$1",  // <- optional: fixes relative imports in ESM
  //  },

    // which test to run
    testMatch: [
        "<rootDir>/controllers/**/*.test.js",
        "<rootDir>/helpers/**/*.test.js",
        "<rootDir>/middlewares/**/*.test.js",
        "<rootDir>/models/**/*.test.js",
        "<rootDir>/tests/integration/**/*.test.js", // integration
    ],


    testPathIgnorePatterns: [
        "<rootDir>/client/",
        "<rootDir>/node_modules/",
        "<rootDir>/controllers/auth.update.unit.test.js",
        "<rootDir>/controllers/auth.controller.test.js",
        "<rootDir>/controllers/health.test.js",
        "<rootDir>/controllers/orders.controller.test.js",
        "<rootDir>/controllers/orders.controllers.unit.test.js"
    ],


    // jest code coverage
    collectCoverage: true,
    collectCoverageFrom: ["controllers/**", "helpers/**", "middlewares/**", "models/**", "!**/*.test.js",
        "!**/*.unit.test.js",
        "!**/node_modules/**"],
    coverageThreshold: {
        global: {
            lines: 10,
            functions: 10,
        },
    },
};