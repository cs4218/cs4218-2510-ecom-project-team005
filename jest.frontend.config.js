export default {
    // name displayed during tests
    displayName: "frontend",

    // simulates browser environment in jest
    // e.g., using document.querySelector in your tests
    testEnvironment: "jest-environment-jsdom",

    // jest does not recognise jsx files by default, so we use babel to transform any jsx files
    transform: {
        "^.+\\.jsx?$": "babel-jest",
    },

    // tells jest how to handle css/scss imports in your tests
    moduleNameMapper: {
        "\\.(css|scss)$": "identity-obj-proxy",
    },

    // ignore all node_modules except styleMock (needed for css imports)
    testPathIgnorePatterns: [
        "<rootDir>/node_modules/",
    ],

    // only run these tests
    testMatch: ["<rootDir>/client/src/**/*.test.js"],

    // jest code coverage
    collectCoverage: true,
    coverageDirectory: "coverage/frontend",
    collectCoverageFrom: [
        "client/src/**/*.{js,jsx}",
        "!client/src/**/*.test.js",
        "!client/src/**/*.test.jsx",
        "!client/src/__tests__/**",
        "!client/src/setupTests.js",
        "!client/src/index.js",
        "!client/src/_site/**",
        "!client/src/reportWebVitals.js"
    ],
    coverageThreshold: {
        global: {
            lines: 100,
            functions: 100,
        },
    },
    setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};