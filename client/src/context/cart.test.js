import React from "react";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";

// helper buat inject provider ke renderHook
const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

describe("Cart Context", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("should provide empty cart by default", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const [cart, setCart] = result.current;

    // default cart kosong
    expect(cart).toEqual([]);
    expect(typeof setCart).toBe("function");
  });

  test("should load existing cart from localStorage", () => {
    const storedCart = JSON.stringify([{ _id: "1", name: "Laptop" }]);
    localStorage.setItem("cart", storedCart);

    const { result } = renderHook(() => useCart(), { wrapper });
    const [cart] = result.current;

    expect(cart).toEqual(JSON.parse(storedCart));
  });

  test("should update cart using setCart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      const [, setCart] = result.current;
      setCart([{ _id: "2", name: "Phone" }]);
    });

    const [cart] = result.current;
    expect(cart).toEqual([{ _id: "2", name: "Phone" }]);
  });
});
