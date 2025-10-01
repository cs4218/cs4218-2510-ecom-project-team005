import React from "react";
global.React = React;

import { render, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import SearchInput from "./SearchInput";
import { SearchProvider } from "../../context/search";

jest.mock("axios");

const Wrapper = ({ children }) => (
    <SearchProvider>
        <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
    </SearchProvider>
);

describe("SearchInput", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders input and button", () => {
        const { getByPlaceholderText, getByText } = render(
            <Wrapper>
                <SearchInput />
            </Wrapper>
        );

        expect(getByPlaceholderText("Search")).toBeInTheDocument();
        expect(getByText("Search")).toBeInTheDocument();
    });

    it("updates keyword when typing", () => {
        const { getByPlaceholderText } = render(
            <Wrapper>
                <SearchInput />
            </Wrapper>
        );

        const input = getByPlaceholderText("Search");
        fireEvent.change(input, { target: { value: "laptop" } });
        expect(input.value).toBe("laptop");
    });

    it("submits search, updates results and navigates", async () => {
        axios.get.mockResolvedValueOnce({ data: [{ _id: "1", name: "TestProduct" }] });

        const { getByPlaceholderText, getByText } = render(
            <Wrapper>
                <Routes>
                    <Route path="/" element={<SearchInput />} />
                    <Route path="/search" element={<div>Search Page</div>} />
                </Routes>
            </Wrapper>
        );

        fireEvent.change(getByPlaceholderText("Search"), { target: { value: "laptop" } });
        fireEvent.click(getByText("Search"));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/laptop");
            expect(getByText("Search Page")).toBeInTheDocument();
        });
    });

    it("handles API errors gracefully", async () => {
        console.log = jest.fn(); // prevent actual console output
        axios.get.mockRejectedValueOnce(new Error("Network error"));

        const { getByPlaceholderText, getByText } = render(
            <Wrapper>
                <SearchInput />
            </Wrapper>
        );

        fireEvent.change(getByPlaceholderText("Search"), { target: { value: "laptop" } });
        fireEvent.click(getByText("Search"));

        await waitFor(() => expect(axios.get).toHaveBeenCalled());
    });
});
