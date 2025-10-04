import React from "react";
global.React = React;

import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Search from "./Search";
import { SearchProvider, useSearch } from "../context/search";

// Mock Layout so we don't need the full layout system
jest.mock("../components/Layout", () => ({ children, title }) => (
    <div data-testid="mock-layout">
        <h2 data-testid="layout-title">{title}</h2>
        {children}
    </div>
));

describe("Search Page", () => {
    it("shows 'No Products Found' when results are empty", () => {
        const { getByText } = render(
            <SearchProvider>
                <Search />
            </SearchProvider>
        );

        expect(getByText("No Products Found")).toBeInTheDocument();
    });

    it("shows product cards when results are present", () => {
        const TestWrapper = ({ children, state }) => {
            const [, setValues] = useSearch();
            React.useEffect(() => {
                setValues(state);
            }, [state, setValues]);
            return children;
        };

        const mockState = {
            keyword: "phone",
            results: [
                {
                    _id: "1",
                    name: "iPhone",
                    description: "A smartphone",
                    price: 999,
                },
            ],
        };

        const { getByText, getByAltText } = render(
            <SearchProvider>
                <TestWrapper state={mockState}>
                    <Search />
                </TestWrapper>
            </SearchProvider>
        );

        expect(getByText("Found 1")).toBeInTheDocument();
        expect(getByText("iPhone")).toBeInTheDocument();
        expect(getByText(/\$ 999/)).toBeInTheDocument();
        expect(getByAltText("iPhone")).toBeInTheDocument();
        expect(getByText("More Details")).toBeInTheDocument();
        expect(getByText("ADD TO CART")).toBeInTheDocument();
    });

    it("renders multiple products correctly", () => {
        const TestWrapper = ({ children, state }) => {
            const [, setValues] = useSearch();
            React.useEffect(() => setValues(state), [state, setValues]);
            return children;
        };

        const mockState = {
            keyword: "phone",
            results: [
                { _id: "1", name: "iPhone", description: "A smartphone", price: 999 },
                { _id: "2", name: "Samsung", description: "Another phone", price: 799 },
            ],
        };

        const { getByText } = render(
            <SearchProvider>
                <TestWrapper state={mockState}>
                    <Search />
                </TestWrapper>
            </SearchProvider>
        );

        expect(getByText("Found 2")).toBeInTheDocument();
        expect(getByText("iPhone")).toBeInTheDocument();
        expect(getByText("Samsung")).toBeInTheDocument();
    });

    it("renders Layout with correct title", () => {
        const { getByTestId } = render(
            <SearchProvider>
                <Search />
            </SearchProvider>
        );

        expect(getByTestId("layout-title").textContent).toBe("Search results");
    });



    it("shows truncated product description", () => {
        const TestWrapper = ({ children, state }) => {
            const [, setValues] = useSearch();
            React.useEffect(() => setValues(state), [state, setValues]);
            return children;
        };

        const mockState = {
            keyword: "phone",
            results: [
                { _id: "1", name: "iPhone", description: "12345678901234567890123456789012345", price: 999 },
            ],
        };

        const { getByText } = render(
            <SearchProvider>
                <TestWrapper state={mockState}>
                    <Search />
                </TestWrapper>
            </SearchProvider>
        );

        expect(getByText("123456789012345678901234567890...")).toBeInTheDocument();
    });

    it("should display the correct heading text", () => {
        const { getByText } = render(
            <SearchProvider>
                <Search />
            </SearchProvider>
        );

        // This assertion will fail if the heading has a typo
        expect(getByText("Search Results")).toBeInTheDocument();
    });


});
