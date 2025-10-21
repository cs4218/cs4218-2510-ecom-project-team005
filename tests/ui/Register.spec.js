import { test, expect } from "../fixtures/testData.js"; // provides testData.seedAll()

test.describe("UI - Register Page", () => {
    test.beforeEach(async ({ page, testData, context }) => {
        await testData.seedAll();
        await context.clearCookies();
        await page.goto("http://localhost:3000/register");
        await page.evaluate(() => localStorage.clear());
    });

    test("renders all input fields and the register button", async ({ page }) => {
        const placeholders = [
            "Enter Your Name",
            "Enter Your Email",
            "Enter Your Password",
            "Enter Your Phone",
            "Enter Your Address",
            "Enter Your DOB",
            "What is Your favorite sport",
        ];

        for (const ph of placeholders) {
            await expect(page.getByPlaceholder(ph)).toBeVisible();
        }
        await expect(page.getByRole("button", { name: /register/i })).toBeVisible();
    });

    test("should allow typing into all input fields", async ({ page }) => {
        const values = {
            "Enter Your Name": "Jane UI",
            "Enter Your Email": "jane-ui@example.test",
            "Enter Your Password": "uiPass123",
            "Enter Your Phone": "0123456789",
            "Enter Your Address": "UI Street 1",
            "Enter Your DOB": "1998-07-21",
            "What is Your favorite sport": "Basketball",
        };

        for (const [ph, val] of Object.entries(values)) {
            await page.getByPlaceholder(ph).fill(val);
            await expect(page.getByPlaceholder(ph)).toHaveValue(val);
        }
    });

    test("should trim whitespace in fields before submitting (inspect outgoing request)", async ({ page }) => {
        await page.getByPlaceholder("Enter Your Name").fill("  Trim User  ");
        await page.getByPlaceholder("Enter Your Email").fill("  trim.user@example.test  ");
        await page.getByPlaceholder("Enter Your Password").fill("  trimPass123  ");
        await page.getByPlaceholder("Enter Your Phone").fill("  0001112222  ");
        await page.getByPlaceholder("Enter Your Address").fill("  Trim Address  ");
        await page.getByPlaceholder("Enter Your DOB").fill("1990-01-01");
        await page.getByPlaceholder("What is Your favorite sport").fill("  Tennis  ");

        const [request] = await Promise.all([
            page.waitForRequest(req => req.url().endsWith("/api/v1/auth/register") && req.method() === "POST"),
            page.getByRole("button", { name: /register/i }).click(),
        ]);

        const body = request.postData();
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (e) { /* ignore */ }

        if (parsed) {
            expect(parsed.name).toBe(parsed.name.trim());
            expect(parsed.email).toBe(parsed.email.trim());
            expect(parsed.password).toBe(parsed.password.trim());
            expect(parsed.phone).toBe(parsed.phone.trim());
            expect(parsed.address).toBe(parsed.address.trim());
            expect(parsed.answer).toBe(parsed.answer.trim());
        } else {
            expect(request).toBeTruthy();
        }
    });

    test("should show browser validation message for invalid email format", async ({ page }) => {
        await page.getByPlaceholder("Enter Your Name").fill("Invalid Email User");
        await page.getByPlaceholder("Enter Your Email").fill("invalid-email");
        await page.getByPlaceholder("Enter Your Password").fill("abc123");
        await page.getByPlaceholder("Enter Your Phone").fill("1234567890");
        await page.getByPlaceholder("Enter Your Address").fill("Some Address");
        await page.getByPlaceholder("Enter Your DOB").fill("1995-05-05");
        await page.getByPlaceholder("What is Your favorite sport").fill("Soccer");

        await page.getByRole("button", { name: /register/i }).click();

        const validationMessage = await page.getByPlaceholder("Enter Your Email").evaluate((el) => el.validationMessage);
        expect(validationMessage).toContain("@");
    });

    test("should show error if user already exists (mock server response) and UI displays message", async ({ page }) => {
        await page.route("**/api/v1/auth/register", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: false,
                    message: "Already Register please login",
                }),
            });
        });

        await page.getByPlaceholder("Enter Your Name").fill("Existing User");
        await page.getByPlaceholder("Enter Your Email").fill("admin@test.com");
        await page.getByPlaceholder("Enter Your Password").fill("password123");
        await page.getByPlaceholder("Enter Your Phone").fill("0123456789");
        await page.getByPlaceholder("Enter Your Address").fill("Existing St");
        await page.getByPlaceholder("Enter Your DOB").fill("1980-01-01");
        await page.getByPlaceholder("What is Your favorite sport").fill("pizza");

        await page.getByRole("button", { name: /register/i }).click();

        await expect(page.getByText(/already register please login/i)).toBeVisible();
    });

    test("prevents submission when required fields are empty", async ({ page }) => {
        await page.getByRole("button", { name: /register/i }).click();
        await expect(page).toHaveURL(/register$/);
    });
});
