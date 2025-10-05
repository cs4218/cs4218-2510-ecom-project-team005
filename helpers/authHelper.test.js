import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper.js";

describe('authHelper', () => {
    describe('hashPassword', () => {
        let hashSpy;

        beforeEach(() => {
            hashSpy = jest.spyOn(bcrypt, 'hash');
        });

        afterEach(() => {
            hashSpy.mockRestore();
        });

        it('hashes the password with 10 salt rounds', async () => {
            //arrange
            hashSpy.mockResolvedValue("hashed-value");

            //act 
            const result = await hashPassword("password123");

            //assert
            expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
            expect(result).toBe("hashed-value");
        });

        it('handles empty string input and still hashes it', async () => {
            //arrange
            hashSpy.mockResolvedValue("hash-empty");

            //act
            const result = await hashPassword("");

            //assert
            expect(bcrypt.hash).toHaveBeenCalledWith("", 10);
            expect(result).toBe("hash-empty");
        });

        it('returns undefined on error and logs it', async () => {
            //arrange
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            const error = new Error("error");
            hashSpy.mockRejectedValue(error);

            //act
            const result = await hashPassword("x");

            //assert
            expect(bcrypt.hash).toHaveBeenCalledWith("x", 10);
            expect(consoleSpy).toHaveBeenCalledWith(error);
            expect(result).toBeUndefined();

            consoleSpy.mockRestore();
        });
    });

    describe('comparePassword', () => {

        let compareSpy;

        beforeEach(() => {
            compareSpy = jest.spyOn(bcrypt, 'compare');
        });

        afterEach(() => {
            compareSpy.mockRestore();
        });

        it('returns true if the password is correct', async () => {
            //arrange
            compareSpy.mockResolvedValue(true);

            //act
            const result = await comparePassword("password123", "correct-hashed-value");

            //assert
            expect(result).toBe(true);
        });

        it('returns false if the password is incorrect', async () => {
            //arrange
            compareSpy.mockResolvedValue(false);

            //act
            const result = await comparePassword("password123", "incorrect-hashed-value");

            //assert
            expect(result).toBe(false);
        });

        it('return a rejected promise on error', async () => {
            //arrange
            const error = new Error("error");
            compareSpy.mockRejectedValue(error);

            //act and assert
            expect(comparePassword("password123", "incorrect-hashed-value")).rejects.toThrow(error);
        });
    })
});