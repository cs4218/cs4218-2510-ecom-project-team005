// HOU QINGSHAN TEST CODE
/* When I open is page on the website, I found that there is actually no any admin order. (I think it is the backend's problem)
I create a test file to mock the axios request and response, and test the main logic of this page.
*/

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import axios from "axios";
import AdminOrders from "./AdminOrders";
import userEvent from "@testing-library/user-event";

// Mock axios
jest.mock("axios");

// Mock useAuth to provide a token so useEffect triggers getOrders()
jest.mock("../../context/auth", () => ({
  useAuth: () => [{ token: "test-token" }, jest.fn()],
}));

// Keep Layout/AdminMenu simple so we only test AdminOrders logic
jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">AdminMenu</div>
));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

// Mock Ant Design Select to a native <select>, and expose Select.Option
jest.mock("antd", () => {
  const Select = ({ defaultValue, onChange, children, bordered, ..._rest }) => {
    // strip non-DOM props like `bordered`
    return (
      <select
        data-testid="status-select-test" // mocking AntD Select with native select and test the value at test 1
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {children}
      </select>
    );
  };
  Select.Option = ({ value, children }) => (
    <option value={value}>{children}</option>
  );
  return { Select };
});


const mockOrders = [
  {
    _id: "order_1",
    status: "Processing",
    buyer: { name: "Alice" },
    createAt: new Date().toISOString(),
    payment: { success: true },
    products: [
      {
        _id: "p1",
        name: "Phone",
        description: "A very nice phone",
        price: 699,
      },
      {
        _id: "p2",
        name: "Case",
        description: "Protective case",
        price: 19,
      },
    ],
  },
  {
    _id: "order_2",
    status: "Not Process",
    buyer: { name: "Bob" },
    createAt: new Date().toISOString(),
    payment: { success: false },
    products: [
      {
        _id: "p3",
        name: "Laptop",
        description: "Fast laptop",
        price: 1499,
      },
    ],
  },
];

describe("AdminOrders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches orders via axios.get and renders them", async () => {
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    // axios.get called with the expected endpoint
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders")
    );

    // Page heading
    expect(screen.getByText(/All Orders/i)).toBeInTheDocument();

    // Renders buyer names
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(await screen.findByText("Bob")).toBeInTheDocument();

    // Renders payment status
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();

    // Count orders
    const orderBlocks = screen.getAllByTestId("admin-orders-test");
    expect(orderBlocks).toHaveLength(2);

    // Each order's products container
    const allProductCards = screen.getAllByTestId("admin-orders-products-container-test");
    expect(allProductCards).toHaveLength(2); // 2 orders, so 2 product containers

    // Check number of products in each order
    const firstOrderProducts = within(allProductCards[0]).getAllByTestId(
      "admin-orders-product-test"
    );
    expect(firstOrderProducts).toHaveLength(2); // Alice has 2 products

    const secondOrderProducts = within(allProductCards[1]).getAllByTestId(
      "admin-orders-product-test"
    );
    expect(secondOrderProducts).toHaveLength(1); // Bob has 1 product

    // The Select should default to each order's status, because we mocked it to <select/>
    const allSelects = screen.getAllByTestId("status-select-test");
    expect(allSelects).toHaveLength(2);
    expect(allSelects[0]).toHaveValue("Processing");
    expect(allSelects[1]).toHaveValue("Not Process");
  });



  test("changing status triggers axios.put and refreshes orders", async () => {
    // initial fetch
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    // PUT status change
    axios.put.mockResolvedValueOnce({ data: { ok: true } });
    // refetch with updated status

    const updatedOrders = [{ ...mockOrders[0], status: "Shipped" }, mockOrders[1]];
    axios.get.mockResolvedValueOnce({ data: updatedOrders });

    render(<AdminOrders />);

    // wait for initial fetch to be called
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders")
    );

    // wait until selects are rendered, then change the first one
    const selects = await screen.findAllByTestId("status-select-test");
    await userEvent.selectOptions(selects[0], "Shipped");

    // PUT called with correct args
    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/order-status/order_1",
        { status: "Shipped" }
      )
    );

    // refetch after PUT
    await waitFor(() =>
      expect(axios.get).toHaveBeenLastCalledWith("/api/v1/auth/all-orders")
    );

    // verify updated select value
    const selectsAfter = await screen.findAllByTestId("status-select-test");
    expect(selectsAfter[0]).toHaveValue("Shipped");
  });
});