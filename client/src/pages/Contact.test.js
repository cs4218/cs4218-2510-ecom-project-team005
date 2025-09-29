import React from "react";
import { render, screen } from "@testing-library/react";
import Contact from "./Contact";

jest.mock("./../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("react-icons/bi", () => ({
  BiMailSend: () => <span data-testid="icon-mail" />,
  BiPhoneCall: () => <span data-testid="icon-phone" />,
  BiSupport: () => <span data-testid="icon-support" />,
}));

describe("Contact", () => {
  test("renders without crashing", () => {
    expect(() => render(<Contact />)).not.toThrow();
  });

  test("displays contact information", () => {
    // Arrange
    render(<Contact />);

    // Act
    const title = screen.getByRole("heading", { name: /contact us/i });
    const email = screen.getByText(/www.help@ecommerceapp.com/i);
    const phone = screen.getByText(/012-3456789/);
    const support = screen.getByText(/1800-0000-0000/i);

    // Assert
    expect(title).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(phone).toBeInTheDocument();
    expect(support).toBeInTheDocument();
  });
});

