// HOU QINGSHAN test for db.js

// Mock mongoose.connect
jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

// Mock 'colors':
// The module augments String.prototype with chained getters.
// We replicate just enough so calling those chains returns the original string.
jest.mock("colors", () => {
  const addGetter = (name) => {
    if (!Object.getOwnPropertyDescriptor(String.prototype, name)) {
      Object.defineProperty(String.prototype, name, {
        get() {
          return this.toString(); // return plain string so chaining still works
        },
        configurable: true,
      });
    }
  };
  addGetter("bgMagenta");
  addGetter("bgRed");
  addGetter("white");
  return {};
});

import connectDB from "./db.js";
import mongoose from "mongoose";

describe("connectDB (db.js)", () => {
  const OLD_ENV = process.env;
  let logSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, MONGO_URL: "mongodb://localhost:27017/testdb" }; // set a test MONGO_URL
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    process.env = OLD_ENV;
  });

  test("calls mongoose.connect with MONGO_URL and logs success host", async () => {
    // Arrange
    mongoose.connect.mockResolvedValue({
      connection: { host: "cluster0.local" },
    });

    // Act
    await connectDB();

    // Assert
    expect(mongoose.connect).toHaveBeenCalledWith(
      process.env.MONGO_URL
    );
    expect(logSpy).toHaveBeenCalledTimes(1);

    // Don't depend on ANSI styling—just assert meaningful text
    const msg = logSpy.mock.calls[0][0] || "";
    expect(msg).toContain("Connected To Mongodb Database");
    expect(msg).toContain("cluster0.local");
  });

  test("logs an error message when mongoose.connect rejects", async () => {
    mongoose.connect.mockRejectedValue(new Error("boom"));

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      process.env.MONGO_URL
    );
    expect(logSpy).toHaveBeenCalledTimes(1);
    const msg = logSpy.mock.calls[0][0] || "";
    expect(msg).toContain("Error in Mongodb");
    expect(msg).toContain("boom");
  });
});