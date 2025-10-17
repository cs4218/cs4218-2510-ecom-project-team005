import { jest, describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.JWT_SECRET = "test_jwt_secret"; // <-- must be set before importing controller

import userModel from "../../models/userModel.js";
import { hashPassword, comparePassword } from "../../helpers/authHelper.js";
import {
    registerController,
    loginController,
    forgotPasswordController,
    testController
} from "../../controllers/authController.js";

// ----------------------
// Setup in-memory MongoDB
// ----------------------
let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// ----------------------
// Register Controller Tests
// ----------------------
describe("registerController - full DB", () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                name: "Alice",
                email: "alice@example.com",
                password: "password123",
                phone: "1234567890",
                address: "123 Street",
                answer: "Blue"
            }
        };
        res = {
            status: jest.fn(() => res),
            send: jest.fn(),
            json: jest.fn()
        };
    });

    test("successful registration", async () => {
        await registerController(req, res);

        const created = await userModel.findOne({ email: "alice@example.com" });
        expect(created).toBeTruthy();
        expect(created.name).toBe("Alice");

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "User Registered Successfully",
                user: expect.objectContaining({ email: "alice@example.com" })
            })
        );
    });

    test("duplicate registration", async () => {
        await userModel.create({ ...req.body, password: await hashPassword("password123") });

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Already Register please login"
            })
        );
    });

    // one representative tests just to see if nothing breaks even if there is no direct db interaction
    test("fails registration when email is missing", async () => {
        req.body = {
            name: "Alice",
            email: "",          // missing
            password: "password123",
            phone: "1234567890",
            address: "123 Street",
            answer: "Blue"
        };

        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Email is Required" })
        );
    });

});

// ----------------------
// Login Controller Tests
// ----------------------
describe("loginController - full DB", () => {
    let req, res;

    beforeEach(async () => {
        res = {
            status: jest.fn(() => res),
            send: jest.fn(),
            json: jest.fn()
        };

        // Create a user in DB
        const passwordHash = await hashPassword("password123");
        await userModel.create({
            name: "Alice",
            email: "alice@example.com",
            password: passwordHash,
            phone: "1234567890",
            address: "123 Street",
            answer: "Blue"
        });
    });

    test("successful login", async () => {
        req = { body: { email: "alice@example.com", password: "password123" } };
        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                token: expect.any(String),
                user: expect.objectContaining({ email: "alice@example.com" })
            })
        );
    });

    test("wrong password", async () => {
        req = { body: { email: "alice@example.com", password: "wrong" } };
        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: "Invalid email or password" })
        );
    });

    test("fails login when user does not exist", async () => {
        req = { body: { email: "nouser@example.com", password: "password123" } };
        await loginController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Invalid email or password" })
        );
    });
});

// ----------------------
// Forgot Password Controller Tests
// ----------------------
describe("forgotPasswordController - full DB", () => {
    let req, res;

    beforeEach(async () => {
        res = {
            status: jest.fn(() => res),
            send: jest.fn(),
            json: jest.fn()
        };

        // Create a user in DB
        const passwordHash = await hashPassword("password123");
        await userModel.create({
            name: "Alice",
            email: "alice@example.com",
            password: passwordHash,
            phone: "1234567890",
            address: "123 Street",
            answer: "Blue",
        });


    });

    test("reset password successfully", async () => {
        req = { body: { email: "alice@example.com", answer: "Blue", newPassword: "newPass123" } };
        await forgotPasswordController(req, res);

        const updatedUser = await userModel.findOne({ email: "alice@example.com" });
        expect(await comparePassword("newPass123", updatedUser.password)).toBe(true);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, message: "Password Reset Successfully" })
        );
    });

    test("fails reset with wrong email or answer", async () => {
        req = { body: { email: "wrong@example.com", answer: "Blue", newPassword: "newPass123" } };
        await forgotPasswordController(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({ success: false, message: "Wrong Email Or Answer" })
        );
    });

    test("fails reset when required fields are missing", async () => {
        req = { body: { email: "", answer: "", newPassword: "" } };
        await forgotPasswordController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

// ----------------------
// Test Controller
// ----------------------
describe("testController", () => {
    test("returns protected message", () => {
        const req = {};
        const res = { send: jest.fn() };
        testController(req, res);
        expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });
});
