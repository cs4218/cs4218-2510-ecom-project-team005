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

});







