// HOU QINGSHAN test file for Spinner
import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Spinner from "./Spinner";

// Mocking useNavigate and useLocation from react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { pathname: "/current" };

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

beforeEach(() => {
  jest.useFakeTimers();   // control setInterval
  jest.clearAllMocks();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("<Spinner /> unit tests", () => {
  test("renders initial count and spinner UI", () => {
    render(<Spinner path="login" />);
    expect(screen.getByRole("heading", { name: /redirecting to you in 3 second/i }))
      .toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument(); // the spinner div with role="status"
  });

  test("decrements countdown every second", () => {
    render(<Spinner />);
    // initial
    expect(screen.getByText(/3 second/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/2 second/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/1 second/i)).toBeInTheDocument();
  });

  test("navigates after countdown reaches 0", () => {
    render(<Spinner path="login" />);
    // fast-forward 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(mockNavigate).toHaveBeenCalledWith("/login", {
      state: "/current",
    });
  });

  test("navigates to custom path if given", () => {
    render(<Spinner path="dashboard" />);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
      state: "/current",
    });
  });
});