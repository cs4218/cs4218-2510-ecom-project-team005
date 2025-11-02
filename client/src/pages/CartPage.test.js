import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CartPage from "./CartPage";
import axios from "axios";

jest.mock("axios");

// mock layout biar simple
jest.mock("./../components/Layout", () => ({ children }) => <div>{children}</div>);

// mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
}));

// kita mau bisa gonta-ganti return dari useAuth dan useCart
const mockSetCart = jest.fn();
const mockNavigate = jest.fn();

// mock useCart
jest.mock("../context/cart", () => ({
  useCart: () => [
    [
      {
        _id: "p1",
        name: "Product 1",
        price: 100,
        description: "lorem",
        slug: "product-1",
      },
      {
        _id: "p2",
        name: "Product 2",
        price: 200,
        description: "ipsum",
        slug: "product-2",
      },
    ],
    mockSetCart,
  ],
}));

// kita perlu bisa atur user. Jadi kita bikin variable yang bisa berubah.
let mockAuthValue = [
  {
    user: null,
    token: "",
  },
  jest.fn(),
];

jest.mock("../context/auth", () => ({
  useAuth: () => mockAuthValue,
}));

// mock router
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// mock DropIn
jest.mock("braintree-web-drop-in-react", () => {
  return ({ onInstance }) => {
    // kita kasih fake instance
    onInstance &&
      onInstance({
        requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: "fake" }),
      });
    return <div data-testid="dropin-mock" />;
  };
});

describe("CartPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default: guest
    mockAuthValue = [
      {
        user: null,
        token: "",
      },
      jest.fn(),
    ];

    // default axios get token
    axios.get.mockResolvedValue({
      data: { clientToken: "fake-token" },
    });
  });

  test("renders guest message when not logged in", async () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const header = await screen.findByTestId("cart-header");
    expect(header).toHaveTextContent("Hello Guest");

    const msg = screen.getByTestId("cart-message");
    expect(msg).toHaveTextContent("You Have 2 items in your cart please login to checkout !");
  });

  test("renders cart items list", async () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    // 2 item dari mock useCart
    const item1 = await screen.findByTestId("cart-item-product-1");
    const item2 = await screen.findByTestId("cart-item-product-2");

    expect(item1).toBeInTheDocument();
    expect(item2).toBeInTheDocument();
  });

  test("remove button removes item from cart", async () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const removeBtn = await screen.findByTestId("remove-item-product-1");
    fireEvent.click(removeBtn);

    // cek setCart dipanggil
    expect(mockSetCart).toHaveBeenCalled();
  });

  test("shows total price", async () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    const total = await screen.findByTestId("cart-total");
    // 100 + 200 = 300
    expect(total).toHaveTextContent("300");
  });

  test("when user logged in but no address, show update/login button", async () => {
    // ubah auth ke logged in tapi tanpa address
    mockAuthValue = [
      {
        user: { name: "Riza" },
        token: "abc",
      },
      jest.fn(),
    ];

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    // karena ga ada address, harus muncul section no-address
    const noAddr = await screen.findByTestId("no-address-section");
    expect(noAddr).toBeInTheDocument();
  });

  test("when user logged in with address and cart has item, show payment section", async () => {
    // user ada address
    mockAuthValue = [
      {
        user: { name: "Riza", address: "Jl. Surabaya" },
        token: "abc",
      },
      jest.fn(),
    ];

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    // tunggu token ke-load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // karena token ada, user login, dan cart punya item, DropIn harus muncul
    expect(screen.getByTestId("dropin-mock")).toBeInTheDocument();

    // tombol pembayaran harus ada
    const payBtn = screen.getByTestId("make-payment-button");
    expect(payBtn).toBeInTheDocument();
  });
});
