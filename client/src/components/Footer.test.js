// HOU QINGSHAN testing Footer component
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "./Footer";

// mock Link to a plain <a>
jest.mock("react-router-dom", () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

describe("<Footer /> tests", () => {
  test("renders the rights message as an h4", () => {
    render(<Footer />);
    expect(
      screen.getByRole("heading", {
        level: 4,
        name: /all rights reserved .* testingcomp/i,
      })
    ).toBeInTheDocument();
  });

  test("exposes three links with correct labels and hrefs", () => {
    render(<Footer />);

    const about = screen.getByRole("link", { name: /about/i });
    const contact = screen.getByRole("link", { name: /contact/i });
    const policy = screen.getByRole("link", { name: /privacy policy/i });

    expect(about).toHaveAttribute("href", "/about");
    expect(contact).toHaveAttribute("href", "/contact");
    expect(policy).toHaveAttribute("href", "/policy");
  });

  test("renders exactly three links", () => {
    render(<Footer />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});