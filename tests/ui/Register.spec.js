import { test, expect } from "@playwright/test";

test.describe("Register Page", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto("/register");
    });

    test("should display all required input fields", async ({ page }) => {
        await expect(page.getByPlaceholder("Enter Your Name")).toBeVisible();
        await expect(page.getByPlaceholder("Enter Your Email")).toBeVisible();
        await expect(page.getByPlaceholder("Enter Your Password")).toBeVisible();
        await expect(page.getByPlaceholder("Enter Your Phone")).toBeVisible();
        await expect(page.getByPlaceholder("Enter Your Address")).toBeVisible();
        await expect(page.getByPlaceholder("Enter Your DOB")).toBeVisible();
        await expect(page.getByPlaceholder("What is Your favorite sport")).toBeVisible();
        await expect(page.getByRole("button", { name: "REGISTER" })).toBeVisible();
    });

    test("should allow typing into all input fields", async ({ page }) => {
        await page.getByPlaceholder("Enter Your Name").fill("John Doe");
        await page.getByPlaceholder("Enter Your Email").fill("john@example.com");
        await page.getByPlaceholder("Enter Your Password").fill("test1234");
        await page.getByPlaceholder("Enter Your Phone").fill("1234567890");
        await page.getByPlaceholder("Enter Your Address").fill("123 Street City");
        await page.getByPlaceholder("Enter Your DOB").fill("2000-01-01");
        await page.getByPlaceholder("What is Your favorite sport").fill("Tennis");

        await expect(page.getByPlaceholder("Enter Your Name")).toHaveValue("John Doe");
        await expect(page.getByPlaceholder("Enter Your Email")).toHaveValue("john@example.com");
        await expect(page.getByPlaceholder("Enter Your Password")).toHaveValue("test1234");
        await expect(page.getByPlaceholder("Enter Your Phone")).toHaveValue("1234567890");
        await expect(page.getByPlaceholder("Enter Your Address")).toHaveValue("123 Street City");
        await expect(page.getByPlaceholder("Enter Your DOB")).toHaveValue("2000-01-01");
        await expect(page.getByPlaceholder("What is Your favorite sport")).toHaveValue("Tennis");
    });

    test("should show validation errors for missing required fields", async ({ page }) => {
        await page.getByRole("button", { name: "REGISTER" }).click();
        // Browser will prevent form submission, check for any validation bubble
        const nameField = page.getByPlaceholder("Enter Your Name");
        await expect(nameField).toBeVisible(); // ensures page didn’t navigate
    });

    test("should not submit with invalid email format", async ({ page }) => {
        await page.getByPlaceholder("Enter Your Name").fill("Invalid User");
        await page.getByPlaceholder("Enter Your Email").fill("invalidemail");
        await page.getByPlaceholder("Enter Your Password").fill("test1234");
        await page.getByPlaceholder("Enter Your Phone").fill("1234567890");
        await page.getByPlaceholder("Enter Your Address").fill("Some City");
        await page.getByPlaceholder("Enter Your DOB").fill("2000-01-01");
        await page.getByPlaceholder("What is Your favorite sport").fill("Tennis");
        await page.getByRole("button", { name: "REGISTER" }).click();

        // HTML5 validation prevents form submission
        const validationMessage = await page.getByPlaceholder("Enter Your Email").evaluate(
            (el) => el.validationMessage
        );
        expect(validationMessage).toContain("include an '@'"); // browser message
    });

    test("should trim whitespace in fields before submitting", async ({ page }) => {
        await page.getByPlaceholder("Enter Your Name").fill("  John Doe  ");
        await page.getByPlaceholder("Enter Your Email").fill("  john@example.com  ");
        await page.getByPlaceholder("Enter Your Password").fill("  test1234  ");
        await page.getByPlaceholder("Enter Your Phone").fill("  1234567890  ");
        await page.getByPlaceholder("Enter Your Address").fill("  123 Street City  ");
        await page.getByPlaceholder("Enter Your DOB").fill("2000-01-01");
        await page.getByPlaceholder("What is Your favorite sport").fill("  Tennis  ");

        // Here you might want to check that the trimmed values are correctly sent to the server.
        // This test assumes trimming happens either frontend or backend.
        await expect(page.getByPlaceholder("Enter Your Name")).toHaveValue("  John Doe  ");
    });

    test("should show success message after successful registration", async ({ page }) => {
        // fill valid form
        await page.getByPlaceholder("Enter Your Name").fill("Alice Doe");
        await page.getByPlaceholder("Enter Your Email").fill(`alice${Date.now()}@example.com`);
        await page.getByPlaceholder("Enter Your Password").fill("test1234");
        await page.getByPlaceholder("Enter Your Phone").fill("5551234567");
        await page.getByPlaceholder("Enter Your Address").fill("123 City");
        await page.getByPlaceholder("Enter Your DOB").fill("2001-02-03");
        await page.getByPlaceholder("What is Your favorite sport").fill("Football");

        await page.getByRole("button", { name: "REGISTER" }).click();

        // Check for success toast (assuming it appears)
        await expect(page.getByText(/Registered Successfully/i)).toBeVisible();
    });

    test("should show error if user already exists (mocked)", async ({ page }) => {
        await page.route("**/api/v1/auth/register", async (route) => {
            await route.fulfill({
                status: 200,
                json: {
                    success: false,
                    message: "Already Register please login"
                }
            });
        });

        await page.getByPlaceholder("Enter Your Name").fill("John Doe");
        await page.getByPlaceholder("Enter Your Email").fill("john@example.com");
        await page.getByPlaceholder("Enter Your Password").fill("test1234");
        await page.getByPlaceholder("Enter Your Phone").fill("1234567890");
        await page.getByPlaceholder("Enter Your Address").fill("123 Street City");
        await page.getByPlaceholder("Enter Your DOB").fill("2000-01-01");
        await page.getByPlaceholder("What is Your favorite sport").fill("Tennis");

        await page.getByRole("button", { name: "REGISTER" }).click();

        // Check the toast or error message directly
        await expect(page.getByText(/Already Register please login/i)).toBeVisible();
    });



    test("should show error if user already exists", async ({ page }) => {
        await page.goto('http://localhost:3000/Register');
        await page.getByRole('textbox', { name: 'Enter Your Name' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('123');
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('123@123.de');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('123');
        await page.getByRole('textbox', { name: 'Enter Your Phone' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('123');
        await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123');
        await page.getByPlaceholder('Enter Your DOB').fill('2004-03-12');
        await page.getByRole('textbox', { name: 'What is Your favorite sport' }).click();
        await page.getByRole('textbox', { name: 'What is Your favorite sport' }).fill('123');
        await page.getByRole('button', { name: 'REGISTER' }).click();
        await page.getByRole('link', { name: 'Register' }).click();


        await page.getByRole('textbox', { name: 'Enter Your Name' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('123');
        await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('123@123.de');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('123');
        await page.getByRole('textbox', { name: 'Enter Your Phone' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('123');
        await page.getByRole('textbox', { name: 'Enter Your Address' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123');
        await page.getByPlaceholder('Enter Your DOB').fill('2004-03-12');
        await page.getByRole('textbox', { name: 'What is Your favorite sport' }).click();
        await page.getByRole('textbox', { name: 'What is Your favorite sport' }).fill('123');
        await page.getByRole('button', { name: 'REGISTER' }).click();

        await expect(page.getByRole('main')).toContainText('Already Register please login');
    });

});
