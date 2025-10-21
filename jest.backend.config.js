export default {
    // display name
    displayName: "backend",

    // when testing backend
    testEnvironment: "node",

    transform: {},                    // <- disable Babel for ESM files
  //  moduleNameMapper: {
   //     "^(\\.{1,2}/.*)\\.js$": "$1",  // <- optional: fixes relative imports in ESM
  //  },

    globalSetup: "<rootDir>/tests/globalSetup.js",
    globalTeardown: "<rootDir>/tests/globalTeardown.js",
    setupFilesAfterEnv: [
        "<rootDir>/tests/setupFile.js"
    ],

    // which test to run
    testMatch: [
        "<rootDir>/controllers/**/*.test.js",
        "<rootDir>/controllers/**/*.integration.test.js",
        "<rootDir>/helpers/**/*.test.js",
        "<rootDir>/middlewares/**/*.test.js",
        "<rootDir>/models/**/*.test.js",
        "<rootDir>/config/**/*.test.js",
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
    maxWorkers: 1,
    testTimeout: 30000,


    // jest code coverage
    collectCoverage: true,
    coverageDirectory: "coverage/backend",
    collectCoverageFrom: [
        "controllers/**/*.js",
        "helpers/**/*.js",
        "middlewares/**/*.js",
        "models/**/*.js",
        "config/**/*.js",
        "!**/*.test.js",
        "!**/*.unit.test.js",
        "!**/*.integration.test.js",
        "!**/__testutils__/**",
        "!**/node_modules/**"
    ],
    coverageThreshold: {
        global: {
            lines: 10,
            functions: 10,
        },
    },
};