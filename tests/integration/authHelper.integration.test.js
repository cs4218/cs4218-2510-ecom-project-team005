import { hashPassword, comparePassword } from "../../helpers/authHelper.js";


describe("Auth Helpers Integration Tests", () => {
    test("hashPassword should return a hashed string different from original", async () => {
        const password = "mySecret123";
        const hashed = await hashPassword(password);
        expect(hashed).not.toBe(password);
        expect(typeof hashed).toBe("string");
    });

    test("comparePassword should return true for correct password", async () => {
        const password = "mySecret123";
        const hashed = await hashPassword(password);
        const match = await comparePassword(password, hashed);
        expect(match).toBe(true);
    });

    test("comparePassword should return false for wrong password", async () => {
        const password = "mySecret123";
        const hashed = await hashPassword(password);
        const match = await comparePassword("wrongPassword", hashed);
        expect(match).toBe(false);
    });
});
