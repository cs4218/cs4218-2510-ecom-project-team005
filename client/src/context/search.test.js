// client/src/context/search.test.js
// NOTE: React wird hier explizit global gesetzt, damit vorhandener Source-Code
// mit klassischer JSX-Runtime ohne Änderung der Quelldatei getestet werden kann.
import React from "react";
global.React = React;

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";

/**
 * Tests for SearchContext (robust, no source changes required).
 */

describe("SearchContext", () => {
    it("provides default values (keyword empty, results empty)", () => {
        const TestComponent = () => {
            const [values] = useSearch();
            return (
                <>
                    <p data-testid="keyword">{values.keyword}</p>
                    <p data-testid="results">{values.results.length}</p>
                </>
            );
        };

        render(
            <SearchProvider>
                <TestComponent />
            </SearchProvider>
        );

        expect(screen.getByTestId("keyword")).toHaveTextContent("");
        expect(screen.getByTestId("results")).toHaveTextContent("0");
    });

    it("allows updating values via setValues (state update reflected in DOM)", async () => {
        const TestComponent = () => {
            const [values, setValues] = useSearch();
            return (
                <>
                    <button
                        onClick={() =>
                            setValues({ keyword: "laptop", results: ["mockProduct"] })
                        }
                    >
                        Update
                    </button>
                    <p data-testid="keyword">{values.keyword}</p>
                    <p data-testid="results">{values.results.length}</p>
                </>
            );
        };

        render(
            <SearchProvider>
                <TestComponent />
            </SearchProvider>
        );

        fireEvent.click(screen.getByText("Update"));

        // warte auf das Re-Render nach State-Update
        await waitFor(() =>
            expect(screen.getByTestId("keyword")).toHaveTextContent("laptop")
        );
        await waitFor(() =>
            expect(screen.getByTestId("results")).toHaveTextContent("1")
        );
    });


});
