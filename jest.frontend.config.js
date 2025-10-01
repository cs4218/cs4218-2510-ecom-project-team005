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
    transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

    // only run these tests
    testMatch: [
        "<rootDir>/client/src/pages/Auth/*.test.js", // Register & Login
        "<rootDir>/client/src/pages/admin/Users.test.js", // Users
        "<rootDir>/client/src/context/search.test.js", // SearchContext
        "<rootDir>/client/src/components/Form/SearchInput.test.js", // SearchInput
        "<rootDir>/client/src/pages/Search.test.js" // Search Page
    ], // changed so all frontend files get tested

    // jest code coverage
    collectCoverage: true,
    collectCoverageFrom: [
        "client/src/pages/Auth/**",  // Register & Login
        "client/src/pages/admin/Users.js", // Users page only
        "client/src/context/search.js",
        "client/src/components/Form/SearchInput.js",
        "client/src/pages/Search.js"
    ],

    // exclude generated/site files that caused parser errors previously
    coveragePathIgnorePatterns: [
        "client/src/_site/",
    ],

    coverageThreshold: {
        global: {
            lines: 100,
            functions: 100,
        },
    },
    setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
