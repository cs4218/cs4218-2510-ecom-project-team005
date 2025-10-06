// HOU QINGSHAN testing Header component

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "./Header";

// Mocks

// Router => plain anchors
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  NavLink: ({ to, children, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

// Auth and Cart contexts: export mock fns we can configure later
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

// Categories hook
jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Toast default export with success()
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn() },
}));

// Child component stub
jest.mock("./Form/SearchInput", () => () => (
  <div data-testid="search-input-stub" />
));

// antd Badge => minimal wrapper exposing count
jest.mock("antd", () => ({
  Badge: ({ count, showZero, children }) => (
    <div data-testid="badge" data-count={count} data-showzero={!!showZero}>
      {children}
    </div>
  ),
}));

// Get handles to the mocked functions so we can configure them per test
const { useAuth } = require("../context/auth");
const { useCart } = require("../context/cart");
const useCategory = require("../hooks/useCategory").default;
const toast = require("react-hot-toast").default;

// Spy for localStorage.removeItem
const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");

beforeEach(() => {
  jest.clearAllMocks();

  // Sensible defaults
  useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
  useCart.mockReturnValue([[]]);
  useCategory.mockReturnValue([]);
});

describe("<Header /> unit tests", () => {
  test("renders brand and search input stub", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: /virtual vault/i })).toHaveAttribute("href", "/");
    expect(screen.getByTestId("search-input-stub")).toBeInTheDocument();
  });

  test("when not authenticated: shows Register and Login links", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: /register/i })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: /login/i })).toHaveAttribute("href", "/login");
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });

  test("when authenticated (user): name visible, Dashboard => /dashboard/user, Logout exists", () => {
    const setAuth = jest.fn();
    useAuth.mockReturnValue([{ user: { name: "Alice", role: 0 }, token: "t" }, setAuth]);

    render(<Header />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard/user");
    expect(screen.getByRole("link", { name: /logout/i })).toHaveAttribute("href", "/login");
  });

  test("when authenticated (admin): Dashboard => /dashboard/admin", () => {
    useAuth.mockReturnValue([{ user: { name: "Bob", role: 1 }, token: "t" }, jest.fn()]);

    render(<Header />);

    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard/admin");
  });

  test("logout resets auth, clears localStorage, and toasts success", () => {
    const setAuth = jest.fn();
    useAuth.mockReturnValue([{ user: { name: "Alice", role: 0 }, token: "t" }, setAuth]);

    render(<Header />);
    fireEvent.click(screen.getByRole("link", { name: /logout/i }));

    expect(setAuth).toHaveBeenCalledTimes(1);
    const newState = setAuth.mock.calls[0][0];
    expect(newState.user).toBeNull();
    expect(newState.token).toBe("");

    expect(removeItemSpy).toHaveBeenCalledWith("auth");
    expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
  });

  test("categories: renders All Categories + dynamic category links", () => {
    useCategory.mockReturnValue([
      { name: "Phones", slug: "phones" },
      { name: "Laptops", slug: "laptops" },
    ]);

    render(<Header />);

    expect(screen.getByRole("link", { name: /all categories/i })).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("link", { name: /phones/i })).toHaveAttribute("href", "/category/phones");
    expect(screen.getByRole("link", { name: /laptops/i })).toHaveAttribute("href", "/category/laptops");
  });

  test("cart badge reflects cart length and keeps Cart link", () => {
    useCart.mockReturnValue([[{ id: 1 }, { id: 2 }, { id: 3 }]]);

    render(<Header />);

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveAttribute("data-count", "3");
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart");
  });

  test("always renders Home link", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
  });
});