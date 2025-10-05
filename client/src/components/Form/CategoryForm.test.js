// HOU QINGSHAN test file for CategoryForm component
import React from "react";
import { render, screen, fireEvent, rerender } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryForm from "./CategoryForm";


describe("<CategoryForm /> unit tests", () => {
  test("renders a text input with the given value and placeholder", () => {
    // Mock functions for props
    const handleSubmit = jest.fn();
    const setValue = jest.fn();

    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value="Electronics"
        setValue={setValue}
      />
    );

    const input = screen.getByPlaceholderText(/enter new category/i);
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("Electronics");

    // Submit button present
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  test("calls setValue on change with the new text", () => {
    const handleSubmit = jest.fn();
    const setValue = jest.fn();

    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value=""
        setValue={setValue}
      />
    );

    const input = screen.getByPlaceholderText(/enter new category/i);
    fireEvent.change(input, { target: { value: "Books" } });

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith("Books");
  });

  test("calls handleSubmit when the form is submitted (via button click)", () => {
    const handleSubmit = jest.fn((e) => e && e.preventDefault && e.preventDefault());
    const setValue = jest.fn();

    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value="Sports"
        setValue={setValue}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  test("reflects controlled value updates from parent on re-render", () => {
    const handleSubmit = jest.fn();
    const setValue = jest.fn();

    const { rerender } = render(
      <CategoryForm handleSubmit={handleSubmit} value="Phone" setValue={setValue} />
    );
    const input = screen.getByPlaceholderText(/enter new category/i);
    expect(input).toHaveValue("Phone");

    rerender(
      <CategoryForm handleSubmit={handleSubmit} value="Laptop" setValue={setValue} />
    );
    expect(input).toHaveValue("Laptop");
  });
});