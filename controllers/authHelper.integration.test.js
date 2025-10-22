import { hashPassword, comparePassword } from "../helpers/authHelper.js";


/*
The Integration test strategy is self-made and given to the AI.
OpenAi's ChatGPT was used to generate some of the code. The prompts varied from giving the test cases which it should write code for to actually asking for more test cases.
 */

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
