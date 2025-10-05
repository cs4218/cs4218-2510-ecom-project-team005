// jest.frontend.config.js
export default {
  displayName: "frontend",

  // Environment browser untuk React
  testEnvironment: "jest-environment-jsdom",

  // Transform JSX/JS via Babel
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },

  // Mock CSS modules saat test
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
    // optional kalau kamu impor asset gambar:
    // "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/client/src/__mocks__/fileMock.js",
  },

  // Hindari transform node_modules
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // Tes yang dijalankan (pakai pola umum biar semua test frontend ketemu)
  testMatch: ["<rootDir>/client/src/**/*.test.@(js|jsx)"],

  // Coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "client/src/**/*.{js,jsx}",
    "!client/src/**/*.test.{js,jsx}",
    "!client/src/index.js",
    "!client/src/**/__mocks__/**",
  ],
  coverageDirectory: "client/coverage",
  coverageReporters: ["lcov", "text", "html"],

  // Setup RTL matcher
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],

  // Optional: biar Jest fokus hanya ke src frontend
  roots: ["<rootDir>/client/src"],
  moduleFileExtensions: ["js", "jsx", "json"],
};
