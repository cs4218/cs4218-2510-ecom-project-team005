// HOU QINGSHAN test for About
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import About from "./About";

// Stub Layout so we don’t pull in head/meta/Footer/Header complexity
jest.mock("./../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout-stub" data-title={title}>
    {children}
  </div>
));

describe("<About /> unit tests", () => {
  test("renders within Layout with correct title", () => {
    render(<About />);
    const layout = screen.getByTestId("layout-stub");
    expect(layout).toHaveAttribute("data-title", "About us - Ecommerce app");
  });

  test("renders the about image with correct src and alt", () => {
    render(<About />);
    const img = screen.getByRole("img", { name: /contactus/i });
    expect(img).toHaveAttribute("src", "/images/about.jpeg");
    expect(img).toHaveAttribute("alt", "contactus");
  });

  test("renders the about description text", () => {
    render(<About />);
    expect(screen.getByText(/add text/i)).toBeInTheDocument();
  });

  test("renders two column divs with correct classes", () => {
    render(<About />);

    const imgCol = screen.getByTestId("about-image-col-test");
    const textCol = screen.getByTestId("about-text-col-test");

    expect(imgCol).toHaveClass("col-md-6");
    expect(textCol).toHaveClass("col-md-4");
  });

  test("wraps columns inside a row with contactus class", () => {
    render(<About />);
    const row = screen.getByTestId("about-row-test");
    expect(row).toHaveClass("row", "contactus");
  });
});