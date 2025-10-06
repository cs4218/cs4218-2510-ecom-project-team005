// HOU QINGSHAN test for CreateCategory component

// In the test, I don't know how to avoid using multiple assertions within `waitFor`
// If I separate them, the console will show act warnings
// so I just left them as is.

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateCategory from "./CreateCategory";
import axios from "axios";
import toast from "react-hot-toast";

// Mock dependencies
jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));
jest.mock("./../../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("./../../components/AdminMenu", () => () => <div>AdminMenu</div>);
jest.mock("../../components/Form/CategoryForm", () => ({ handleSubmit, value, setValue }) => (
  <form onSubmit={handleSubmit} data-testid="category-form">
    <input
      data-testid="category-input"
      value={value}
      onChange={e => setValue(e.target.value)}
    />
    <button type="submit">Submit</button>
  </form>
));
jest.mock("antd", () => ({
  Modal: ({ open, children, onCancel }) =>
    open ? (
      <div data-testid="modal">
        {children}
        <button onClick={onCancel}>Close</button>
      </div>
    ) : null,
}));

const mockCategories = [
  { _id: "1", name: "Electronics" },
  { _id: "2", name: "Books" },
];

describe("CreateCategory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
  });

  test("renders category list after fetching", async () => {
    render(<CreateCategory />);
    expect(screen.getByText("Manage Category")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Books")).toBeInTheDocument();
    });
  });

  test("submits new category and clears input", async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    render(<CreateCategory />);
    const input = screen.getByTestId("category-input");
    fireEvent.change(input, { target: { value: "NewCat" } });
    fireEvent.submit(screen.getByTestId("category-form"));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/category/create-category", { name: "NewCat" });
      expect(toast.success).toHaveBeenCalledWith("NewCat is created");
      expect(input.value).toBe("");
    });
  });

  test("shows error toast on failed category creation", async () => {
    axios.post.mockResolvedValue({ data: { success: false, message: "Error" } });
    render(<CreateCategory />);
    fireEvent.change(screen.getByTestId("category-input"), { target: { value: "FailCat" } });
    fireEvent.submit(screen.getByTestId("category-form"));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error");
    });
  });

  test("opens modal and updates category", async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    render(<CreateCategory />);
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText("Edit")[0]);
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    // Find all forms and inputs by test id
    const modalInput = screen.getAllByTestId("category-input")[1];
    const modalForm = screen.getAllByTestId("category-form")[1];

    fireEvent.change(modalInput, { target: { value: "UpdatedCat" } });
    fireEvent.submit(modalForm);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/1",
        { name: "UpdatedCat" }
      );
      expect(toast.success).toHaveBeenCalledWith("UpdatedCat is updated");
    });
  });

  test("shows error toast on failed category update", async () => {
    axios.put.mockResolvedValue({ data: { success: false, message: "UpdateError" } });
    render(<CreateCategory />);
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.submit(screen.getAllByTestId("category-form")[0]);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error");
    });
  });

  test("deletes category and shows success toast", async () => {
    axios.delete.mockResolvedValue({ data: { success: true } });
    render(<CreateCategory />);
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText("Delete")[0]);
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith("/api/v1/category/delete-category/1");
      expect(toast.success).toHaveBeenCalledWith("category is deleted");
    });
  });

  test("shows error toast on failed category delete", async () => {
    axios.delete.mockResolvedValue({ data: { success: false, message: "DeleteError" } });
    render(<CreateCategory />);
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText("Delete")[0]);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("DeleteError");
    });
  });


  test("shows error toast when create category throws", async () => {
    axios.post.mockRejectedValue(new Error("Network Error"));
    render(<CreateCategory />);
    fireEvent.change(screen.getByTestId("category-input"), { target: { value: "ErrCat" } });
    fireEvent.submit(screen.getByTestId("category-form"));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong in input form");
    });
  });

  test("shows error toast when getAllCategory throws", async () => {
    axios.get.mockRejectedValue(new Error("Network Error"));
    render(<CreateCategory />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category");
    });
  });

  test("shows error toast when update category throws", async () => {
    axios.put.mockRejectedValue(new Error("Network Error"));
    render(<CreateCategory />);
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText("Edit")[0]);
    const modalForm = screen.getAllByTestId("category-form")[1];
    fireEvent.submit(modalForm);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  test("shows error toast when delete category throws", async () => {
    axios.delete.mockRejectedValue(new Error("Network Error"));
    render(<CreateCategory />);
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText("Delete")[0]);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

});