import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "./HomePage";
import axios from "axios";

// mock axios biar ga call API beneran
jest.mock("axios");

// mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));

// mock cart context
const mockSetCart = jest.fn();
jest.mock("../context/cart", () => ({
  useCart: () => [[{ _id: "old" }], mockSetCart],
}));

// mock Layout biar ga ribet
jest.mock("./../components/Layout", () => {
  return ({ children }) => <div>{children}</div>;
});

// mock antd (kita gak tes antd-nya, cuma mau komponen jalan)
jest.mock("antd", () => ({
  Checkbox: ({ children, onChange }) => (
    <label>
      <input type="checkbox" onChange={(e) => onChange && onChange(e)} />
      {children}
    </label>
  ),
  Radio: ({ children }) => <div>{children}</div>,
  RadioGroup: ({ children }) => <div>{children}</div>,
  RadioButton: ({ children }) => <div>{children}</div>,
  Radio: {
    Group: ({ children, onChange }) => (
      <div onChange={onChange}>{children}</div>
    ),
  },
}));

describe("HomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders banner and title", async () => {
    // stub respon API
    axios.get.mockImplementation((url) => {
      if (url.includes("/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: [{ _id: "c1", name: "Laptop" }] },
        });
      }
      if (url.includes("/product/product-count")) {
        return Promise.resolve({ data: { total: 1 } });
      }
      if (url.includes("/product/product-list/1")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p1",
                name: "Macbook",
                price: 1000,
                description: "Nice",
                slug: "macbook",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // cek judul
    expect(
      await screen.findByText(/All Products/i)
    ).toBeInTheDocument();

    // cek kategori muncul
    expect(await screen.findByText(/Laptop/i)).toBeInTheDocument();

    // cek produk muncul
    expect(await screen.findByText(/Macbook/i)).toBeInTheDocument();
  });

  test("adds product to cart when clicking ADD TO CART", async () => {
    const { default: toast } = require("react-hot-toast");

    axios.get.mockImplementation((url) => {
      if (url.includes("/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: [] },
        });
      }
      if (url.includes("/product/product-count")) {
        return Promise.resolve({ data: { total: 1 } });
      }
      if (url.includes("/product/product-list/1")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p1",
                name: "Macbook",
                price: 1000,
                description: "Nice",
                slug: "macbook",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const addBtn = await screen.findByText(/ADD TO CART/i);
    fireEvent.click(addBtn);

    // pastikan setCart dipanggil
    expect(mockSetCart).toHaveBeenCalled();

    // pastikan toast dipanggil
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("shows loadmore button when products less than total", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: [] },
        });
      }
      if (url.includes("/product/product-count")) {
        return Promise.resolve({ data: { total: 5 } }); // total lebih besar
      }
      if (url.includes("/product/product-list/1")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p1",
                name: "Macbook",
                price: 1000,
                description: "Nice",
                slug: "macbook",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const loadMoreBtn = await screen.findByText(/Loadmore/i);
    expect(loadMoreBtn).toBeInTheDocument();
  });
});
