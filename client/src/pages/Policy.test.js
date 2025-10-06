// HOU QINGSHAN test for Policy.js
// This page is quite simple, so the tests are straightforward.
// Mock the Layout component to isolate the test to Policy only.
// We will check that the Layout is used with the correct title prop,
// and that the main elements are rendered correctly.

import React from "react";
import { render, screen } from "@testing-library/react";
import Policy from "./Policy";

// Mock Layout without referencing any out-of-scope vars inside the factory
jest.mock("./../components/Layout", () => {
  return ({ children, title }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  );
});

describe("Policy page", () => {
  test("renders inside Layout with the correct title", () => {
    render(<Policy />);
    const layout = screen.getByTestId("layout");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("data-title", "Privacy Policy");
  });

  test("renders the contact image with correct src and alt", () => {
    render(<Policy />);
    const img = screen.getByAltText(/contactus/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/contactus.jpeg");
  });

  test("renders exactly 7 policy lines", () => {
    render(<Policy />);
    const lines = screen.getAllByText(/add privacy policy/i);
    expect(lines).toHaveLength(7);
  });
});