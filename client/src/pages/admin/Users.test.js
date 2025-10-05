import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Users from "./Users";

// Mock Layout and AdminMenu since they are child components
jest.mock("../../components/Layout", () => ({ children, title }) => (
    <div data-testid="mock-layout">
        <h2 data-testid="layout-title">{title}</h2>
        {children}
    </div>
));

jest.mock("../../components/AdminMenu", () => () => (
    <div data-testid="mock-admin-menu">Admin Menu</div>
));

describe("Users Component", () => {
    it("renders without crashing and shows layout title", () => {
        const { getByTestId } = render(
            <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
                <Routes>
                    <Route path="/dashboard/admin/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByTestId("layout-title")).toHaveTextContent(
            "Dashboard - All Users"
        );
    });

    it("renders AdminMenu and Users heading", () => {
        const { getByText, getByTestId } = render(
            <MemoryRouter>
                <Users />
            </MemoryRouter>
        );

        expect(getByTestId("mock-admin-menu")).toHaveTextContent("Admin Menu");
        expect(getByText("All Users")).toBeInTheDocument();
    });

    it("should always render Layout with the correct title prop", () => {
        const { getByTestId } = render(
            <MemoryRouter>
                <Users />
            </MemoryRouter>
        );

        // We mocked Layout to show its title in data-testid="layout-title"
        expect(getByTestId("layout-title")).toHaveTextContent(
            "Dashboard - All Users"
        );
    });

});
