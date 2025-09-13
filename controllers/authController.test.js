process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";


import {
    registerController,
    loginController,
    forgotPasswordController,
    testController,
} from "./authController";

import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

// Mock modules to avoid DB/JWT operations
jest.mock("../models/userModel.js", () => {
    const mUserModel = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({
            _id: "fakeid123",
            name: "Alice",
            email: "alice@example.com",
            phone: "1234567890",
            address: "123 Street",
            answer: "Blue",
        }),
    }));

    // static methods
    mUserModel.findOne = jest.fn();
    mUserModel.findById = jest.fn();
    mUserModel.findByIdAndUpdate = jest.fn();

    return mUserModel;
});
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

describe('Auth controllers tests', () => {
    describe('registerController_Tests', () => {
        let req;
        let res;


        beforeEach(() => {
            jest.clearAllMocks();

            // ensure common mocked model methods exist (defensive)
            if (!userModel.findOne) userModel.findOne = jest.fn();
            if (!userModel.findById) userModel.findById = jest.fn();
            if (!userModel.findByIdAndUpdate) userModel.findByIdAndUpdate = jest.fn();

            userModel.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue({
                    _id: "fakeid123",
                    name: "Alice",
                    email: "alice@example.com",
                    phone: "1234567890",
                    address: "123 Street",
                    answer: "Blue"
                })
            }));


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
                status: jest.fn(() => res), // chainable
                send: jest.fn(),
                json: jest.fn(),
            };
        });

        test("missing name", async () => {
            req.body.name = "";
            await registerController(req, res);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ error: "Name is Required" })
            );
        });

        test("missing email", async () => {
            req.body.email = "";
            await registerController(req, res);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Email is Required" })
            );
        });

        test("missing password", async () => {
            req.body.password = "";
            await registerController(req, res);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Password is Required" })
            );
        });

        test("missing phone", async () => {
            req.body.phone = "";
            await registerController(req, res);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Phone no is Required" })
            );
        });

        test("missing address", async () => {
            req.body.address = "";
            await registerController(req, res);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Address is Required" })
            );
        });

        test("missing answer", async () => {
            req.body.answer = "";
            await registerController(req, res);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Answer is Required" })
            );
        });


        test('duplicate Registration', async () => {
            // Arrange: DB returns an existing user
            userModel.findOne.mockResolvedValueOnce({ email: "alice@example.com" });

            // Act
            await registerController(req, res);

            // Assert: correct HTTP semantics -> 409 Conflict
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({success: false, message: expect.any(String)})
            );
        });


        test("Unexpected error", async () => {
            // Arrange: make the DB call throw an error
            const fakeError = new Error("DB is down");
            userModel.findOne.mockImplementationOnce(() => {
                throw fakeError;
            });

            // Act
            await registerController(req, res);

            // Assert: 500 status code and correct response
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error in Registration",
                    error: fakeError
                })
            );
        });

        test("successful registration", async () => {
            // Arrange: mock DB to return no existing user
            userModel.findOne.mockResolvedValueOnce(null); // No duplicate
            hashPassword.mockResolvedValueOnce("hashedPassword"); // Mock hashing

            // req.body already has valid user info from beforeEach
            // Act
            await registerController(req, res);

            // Assert: user should be created and response should indicate success
            expect(userModel.findOne).toHaveBeenCalledWith({ email: "alice@example.com" });
            expect(hashPassword).toHaveBeenCalledWith("password123");

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: "User Register Successfully",
                    user: expect.objectContaining({
                        name: "Alice",
                        email: "alice@example.com",
                        phone: "1234567890",
                        address: "123 Street",
                        answer: "Blue"
                    })
                })
            );
        });
    });

    describe('loginController_tests', () => {
        let req;
        let res;

        beforeEach(() => {
            // reset mocks & test state
            jest.clearAllMocks();

            // default request used in many tests (individual tests may overwrite)
            req = {
                body: {
                    email: "alice@example.com",
                    password: "password123",
                },
            };

            // mock response object (chainable status)
            res = {
                status: jest.fn(() => res),
                send: jest.fn(),
                json: jest.fn(),
            };

            // defensive: ensure static model methods exist as jest functions
            if (!userModel.findOne) userModel.findOne = jest.fn();
            if (!userModel.findById) userModel.findById = jest.fn();
            if (!userModel.findByIdAndUpdate) userModel.findByIdAndUpdate = jest.fn();

            // IMPORTANT: spy on JWT.sign and return a predictable token
            // This records arguments and returns a token string for assertions.
            JWT.sign = jest.fn().mockReturnValue("mocked-jwt-token");
        });

        test('missing email', async () => {
            req.body = { password: "password123" }; // no email
            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Invalid email or password"
                })
            );
        });

        test('missing password', async () => {
            req.body = { email: "alice@example.com" }; // no password
            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Invalid email or password"
                })
            );
        });

        test('user not found', async () => {
            // controller should look up by email and get null -> generic 400
            userModel.findOne.mockResolvedValueOnce(null);

            req.body = { email: "alice@example.com", password: "password123" };
            await loginController(req, res);

            expect(userModel.findOne).toHaveBeenCalledWith({ email: "alice@example.com" });
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Invalid email or password"
                })
            );
        });

        test('password mismatch', async () => {
            // controller finds a user but password compare fails
            const fakeUser = {
                _id: "fakeid123",
                email: "alice@example.com",
                password: "hashedPassword" // whatever your DB stores
            };
            userModel.findOne.mockResolvedValueOnce(fakeUser);
            comparePassword.mockResolvedValueOnce(false);

            req.body = { email: "alice@example.com", password: "wrongpassword" };
            await loginController(req, res);

            expect(userModel.findOne).toHaveBeenCalledWith({ email: "alice@example.com" });
            expect(comparePassword).toHaveBeenCalledWith("wrongpassword", "hashedPassword");
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Invalid email or password"
                })
            );
        });

        test('successful login', async () => {
            // Arrange: DB returns a user with _id and hashed password
            const mockUser = {
                _id: "fakeid123",
                name: "Alice",
                email: "alice@example.com",
                password: "hashedPassword",
                phone: "1234567890",
                address: "123 Street",
                role: "user"
            };
            userModel.findOne.mockResolvedValueOnce(mockUser);
            comparePassword.mockResolvedValueOnce(true); // password matches

            // req.body with correct credentials
            req.body = { email: "alice@example.com", password: "password123" };

            // Act
            await loginController(req, res);

            // Assert DB and password comparisons
            expect(userModel.findOne).toHaveBeenCalledWith({ email: "alice@example.com" });
            expect(comparePassword).toHaveBeenCalledWith("password123", "hashedPassword");

            // Assert JWT was called with (payload, secret-string, options)
            expect(JWT.sign).toHaveBeenCalledWith(
                { _id: "fakeid123" },
                expect.any(String),
                { expiresIn: "7d" }
            );

            // Assert response
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.any(String),
                    token: "mocked-jwt-token",
                    user: expect.objectContaining({
                        _id: "fakeid123",
                        email: "alice@example.com",
                        name: "Alice"
                    })
                })
            );
        });

        test('unexpected error', async () => {
            // simulate DB throwing
            const fakeError = new Error("DB is down");
            userModel.findOne.mockImplementationOnce(() => { throw fakeError; });

            req.body = { email: "alice@example.com", password: "password123" };
            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.any(String),
                    error: fakeError
                })
            );
        });
    });


});







