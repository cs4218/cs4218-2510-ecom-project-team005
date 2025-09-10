import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { requireSignIn, isAdmin } from './authMiddleware.js';
import JWT from "jsonwebtoken";
import userModel from '../models/userModel.js';


describe('authMiddleware', () => {
    describe('requireSignIn', () => {
        let consoleSpy;
        let verifySpy;

        beforeEach(() => {
            consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            verifySpy = jest.spyOn(JWT, 'verify');
        });

        afterEach(() => {
            consoleSpy.mockRestore();
            verifySpy.mockRestore();
        });

        it('should log and return a 401 error if the token is invalid', () => {
            //arrange
            const req = { headers: { authorization: 'invalid-token' } };
            const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
            const next = jest.fn();
            const error = new Error("Invalid token");
            verifySpy.mockImplementation(() => { throw error });

            //act
            requireSignIn(req, res, next);

            //assert
            expect(consoleSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: expect.any(Error),
                message: 'Unauthorized Access',
            });
            expect(next).not.toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });

        it('should set the req.user to the decoded token and call next() if the token is valid', () => {
            //arrange
            const req = { headers: { authorization: 'valid-token' } };
            const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
            const next = jest.fn();
            const decoded = { id: '1234567890' };
            verifySpy.mockReturnValue(decoded);

            //act
            requireSignIn(req, res, next);

            //assert
            expect(verifySpy).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
            expect(req.user).toEqual(decoded);
            expect(next).toHaveBeenCalled();
        });

        it('should handle missing authorization header', () => {
            //arrange
            const req = { headers: {} };
            const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
            const next = jest.fn();
            const error = new Error('jwt must be provided');
            verifySpy.mockImplementation(() => { throw error });

            //act
            requireSignIn(req, res, next);

            //assert
            expect(verifySpy).toHaveBeenCalledWith(undefined, process.env.JWT_SECRET);
            expect(consoleSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: expect.any(Error),
                message: 'Unauthorized Access',
            });
            expect(next).not.toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });
    });

    describe('isAdmin', () => {
        let consoleSpy;
        let findByIdSpy;
        const id = '1234567890';

        beforeEach(() => {
            consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            findByIdSpy = jest.spyOn(userModel, 'findById');
        });

        afterEach(() => {
            consoleSpy.mockRestore();
            findByIdSpy.mockRestore();
        });

        it('should call next() if user has admin role (role = 1)', async () => {
            //arrange
            const req = { user: { _id: id } };
            const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
            const next = jest.fn();
            const mockUser = { _id: id, role: 1, name: 'Admin User' };
            findByIdSpy.mockResolvedValue(mockUser);

            //act
            await isAdmin(req, res, next);

            //assert
            expect(findByIdSpy).toHaveBeenCalledWith(id);
            expect(next).toHaveBeenCalled();
        });

        it('should return 401 error if user does not have admin role (role = 0)', async () => {
            //arrange
            const req = { user: { _id: id } };
            const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
            const next = jest.fn();
            const mockUser = { _id: id, role: 0, name: 'Regular User' };
            findByIdSpy.mockResolvedValue(mockUser);

            //act
            await isAdmin(req, res, next);

            //assert
            expect(findByIdSpy).toHaveBeenCalledWith(id);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Unauthorized Access",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle database error when finding user', async () => {
            //arrange
            const req = { user: { _id: '1234567890' } };
            const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
            const next = jest.fn();
            const error = new Error('Database connection failed');
            findByIdSpy.mockRejectedValue(error);

            //act
            await isAdmin(req, res, next);

            //assert
            expect(findByIdSpy).toHaveBeenCalledWith('1234567890');
            expect(consoleSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error,
                message: "Error in admin middleware",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle case when user is not found', async () => {
            //arrange
            const req = { user: { _id: '1234567890' } };
            const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
            const next = jest.fn();
            findByIdSpy.mockResolvedValue(null);

            //act
            await isAdmin(req, res, next);

            //assert
            expect(findByIdSpy).toHaveBeenCalledWith('1234567890');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Unauthorized Access",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle missing req.user', async () => {
            //arrange
            const req = {};
            const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
            const next = jest.fn();

            //act
            await isAdmin(req, res, next);

            //assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Unauthorized Access",
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
})