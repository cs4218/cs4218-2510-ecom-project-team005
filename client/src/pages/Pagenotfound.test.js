// HOU QINGSHAN tests for Pagenotfound
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Pagenotfound from "./Pagenotfound";

// Stub Layout
jest.mock("./../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout-stub" data-title={title}>
    {children}
  </div>
));

// Stub Link
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe("<Pagenotfound /> unit tests", () => {
  test("renders Layout with correct title", () => {
    render(<Pagenotfound />);
    const layout = screen.getByTestId("layout-stub");
    expect(layout).toHaveAttribute("data-title", "go back- page not found");
  });

  test("renders the 404 title and heading", () => {
    render(<Pagenotfound />);
    expect(screen.getByText("404")).toHaveClass("pnf-title");
    expect(screen.getByText(/oops ! page not found/i)).toHaveClass("pnf-heading");
  });

  test("renders a Go Back link pointing to home", () => {
    render(<Pagenotfound />);
    const link = screen.getByRole("link", { name: /go back/i });
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveClass("pnf-btn");
  });
});