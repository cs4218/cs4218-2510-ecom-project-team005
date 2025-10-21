import { test, expect } from "../fixtures/testData.js";


/*
OpenAi's ChatGPT was used to generate some of the code. The prompts varied from giving the test cases which it should write code for to actually asking for more test cases.
 */
test.describe.configure({ mode: "serial" }); // serial to preserve memory server state

test.describe("E2E - Auth Flow", () => {
    const baseUrl = "http://localhost:3000";

    const adminUser = {
        email: "admin@test.com",
        password: "password123", // matches seeded user
    };

    const normalUser = {
        email: "user@test.com",
        password: "password123", // seeded user
    };

    const noAddressUser = {
        email: "noaddress@test.com",
        password: "password123",
    };

    // Generate a unique user each run
    const timestamp = Date.now();


    async function fillRegisterForm(page) {
        await page.getByPlaceholder("Enter Your Name").fill("Alice Doe");
        await page.getByPlaceholder("Enter Your Email").fill(`alice@example.com`);
        await page.getByPlaceholder("Enter Your Password").fill("test1234");
        await page.getByPlaceholder("Enter Your Phone").fill("5551234567");
        await page.getByPlaceholder("Enter Your Address").fill("123 City");
        await page.getByPlaceholder("Enter Your DOB").fill("2001-02-03");
        await page.getByPlaceholder("What is Your favorite sport").fill("Football");


    }

    test.beforeEach(async ({ testData, page }) => {
        await testData.seedAll(); // reset memory server and seed data
        await page.goto(baseUrl);
    });

    // -------------------------------
    // REGISTER FLOWS
    // -------------------------------



    test("should register a new user and redirect to login", async ({ page }) => {
        await page.goto("/register");
        await fillRegisterForm(page);

        await page.getByRole("button", { name: "REGISTER" }).click();
        await expect(page.getByText(/Registered Successfully/i)).toBeVisible();
        await expect(page).toHaveURL(/login$/);
    });

    test("should login newly registered user and persist auth", async ({ page }) => {
        await page.goto("/register");
        await fillRegisterForm(page);

        await page.getByRole("button", { name: "REGISTER" }).click();
        await expect(page.getByText(/Registered Successfully/i)).toBeVisible();
        await expect(page).toHaveURL(/login$/);


        await page.getByPlaceholder("Enter Your Email").fill(`alice@example.com`);
        await page.getByPlaceholder("Enter Your Password").fill("test1234");
        await page.getByRole('button', { name: 'LOGIN' }).click();

        await expect(page).toHaveURL('http://localhost:3000/');

        const authRaw = await page.evaluate(() => localStorage.getItem("auth"));
        const auth = JSON.parse(authRaw);
        expect(auth.user.email).toBe("alice@example.com");
        expect(auth.token).toBeTruthy();
    });

    test("registering same user twice shows error", async ({ page }) => {
        await page.goto(`${baseUrl}/register`);

        // using seeded user
        await page.getByPlaceholder("Enter Your Name").fill("Alice Doe");
        await page.getByPlaceholder("Enter Your Email").fill("user@test.com"); //seeded email
        await page.getByPlaceholder("Enter Your Password").fill("password123"); //seeded pw
        await page.getByPlaceholder("Enter Your Phone").fill("5551234567");
        await page.getByPlaceholder("Enter Your Address").fill("123 City");
        await page.getByPlaceholder("Enter Your DOB").fill("2001-02-03");
        await page.getByPlaceholder("What is Your favorite sport").fill("Football");


        await page.getByRole("button", { name: /register/i }).click();

        await expect(page.getByText(/already register|user exists|email taken/i)).toBeVisible({ timeout: 5000 });
    });

    // -------------------------------
    // LOGIN FLOWS
    // -------------------------------

    test("login with wrong password shows error", async ({ page }) => {
        await page.goto(`${baseUrl}/login`);
        await page.getByPlaceholder("Enter Your Email").fill("user@test.com"); //seeded user
        await page.getByPlaceholder("Enter Your Password").fill("WrongPassword123");
        await page.getByRole('button', { name: 'LOGIN' }).click();

        await expect(page.getByText("Invalid email or password")).toBeVisible();
        await expect(page).toHaveURL(/login$/);
    });

    test("login with non-existent user shows error", async ({ page }) => {
        await page.goto(`${baseUrl}/login`);
        await page.getByPlaceholder("Enter Your Email").fill("doesnotexist@example.test");
        await page.getByPlaceholder("Enter Your Password").fill("AnyPass123");
        await page.getByRole('button', { name: 'LOGIN' }).click();

        await expect(page.getByText("Invalid email or password")).toBeVisible();
    });

    test("login as seeded admin redirects correctly", async ({ page }) => {
        await page.goto(`${baseUrl}/login`);
        await page.getByPlaceholder("Enter Your Email").fill(adminUser.email);
        await page.getByPlaceholder("Enter Your Password").fill(adminUser.password);
        await page.getByRole("button", { name: /login/i }).click();

        // Depending on app routing
        await expect(page).toHaveURL(/(\/admin|\/dashboard|\/)$/);

        const authRaw = await page.evaluate(() => localStorage.getItem("auth"));
        const auth = JSON.parse(authRaw);
        expect(auth.user.role).toBe(1); // admin
    });

    test("login as seeded normal user redirects to home", async ({ page }) => {
        await page.goto(`${baseUrl}/login`);
        await page.getByPlaceholder("Enter Your Email").fill(normalUser.email);
        await page.getByPlaceholder("Enter Your Password").fill(normalUser.password);
        await page.getByRole("button", { name: /login/i }).click();

        await expect(page).toHaveURL(`${baseUrl}/`);
        const authRaw = await page.evaluate(() => localStorage.getItem("auth"));
        const auth = JSON.parse(authRaw);
        expect(auth.user.email).toBe(normalUser.email);
    });

    // -------------------------------
    // PERSISTENCE & LOGOUT
    // -------------------------------

    test("logged in user stays logged in after page refresh", async ({ page }) => {
        await page.goto(`${baseUrl}/login`);
        await page.getByPlaceholder("Enter Your Email").fill(normalUser.email);
        await page.getByPlaceholder("Enter Your Password").fill(normalUser.password);
        await page.getByRole("button", { name: /login/i }).click();

        await expect(page).toHaveURL('http://localhost:3000/');
        await page.reload();
        await expect(page).toHaveURL('http://localhost:3000/');

        await expect(page.getByRole('list')).toContainText('Test User');
    });

    test("logout clears auth and redirects to login", async ({ page }) => {

            // login first
            await page.goto(`${baseUrl}/login`);
            await page.getByPlaceholder("Enter Your Email").fill(normalUser.email);
            await page.getByPlaceholder("Enter Your Password").fill(normalUser.password);
            await page.getByRole("button", { name: /login/i }).click();

            await page.getByRole('button', { name: 'Test User'}).click();
            await page.getByRole('link', { name: 'Logout' }).click();

        await expect(page.getByText(/Logout Successfully/i)).toBeVisible({ timeout: 5000 });


        // assert auth is removed
            const auth = await page.evaluate(() => localStorage.getItem("auth"));
            expect(auth).toBeNull();

            // assert redirected to login
            await expect(page).toHaveURL(/login$/);

    });

    // -------------------------------
    // PRIVATE ROUTE ACCESS
    // -------------------------------

    test("unauthenticated user redirected from private route", async ({ page }) => {
        await page.goto("http://localhost:3000/dashboard/admin");
        await expect(page).toHaveURL(/login$/);
    });

});
