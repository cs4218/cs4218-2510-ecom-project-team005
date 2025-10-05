import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import ProductDetails from "./ProductDetails";

jest.mock("axios");
jest.mock("./../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../context/cart", () => ({ useCart: jest.fn() }));
jest.mock("react-hot-toast", () => ({ success: jest.fn() }));

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useParams: jest.fn(),
    useNavigate: () => mockNavigate,
}));

const { useParams } = jest.requireMock("react-router-dom");
const { useCart } = jest.requireMock("../context/cart");
const toast = jest.requireMock("react-hot-toast");

const productResponse = {
    product: {
        _id: "prod-id",
        name: "Test Product",
        description: "Test Description",
        price: 123,
        category: { _id: "cat-id", name: "Test Category" },
        slug: "test-product",
    },
};

const relatedProduct = {
    _id: "rel-id",
    name: "Related Product",
    description: "Related description that is sufficiently long",
    price: 45,
    slug: "related-product",
};

const relatedResponse = { products: [relatedProduct] };

describe("ProductDetails", () => {
    const mockSetCart = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useParams.mockReturnValue({ slug: "test-slug" });
        useCart.mockReturnValue([[], mockSetCart]);
    });

    describe("loading state", () => {
        test("shows spinner before product data loads", () => {
            // Arrange
            axios.get.mockReturnValue(new Promise(() => { }));

            // Act
            render(<ProductDetails />);

            // Assert
            expect(screen.getByRole("status")).toBeInTheDocument();
        });
    });

    describe("successful fetch", () => {
        test("renders product information and similar products", async () => {
            // Arrange
            axios.get.mockResolvedValueOnce({ data: productResponse });
            axios.get.mockResolvedValueOnce({ data: relatedResponse });

            // Act
            render(<ProductDetails />);

            // Assert
            await screen.findByText((content) => content.includes("Test Product"));
             expect(screen.getByText((content) => content.includes("Test Description"))).toBeInTheDocument();
             expect(screen.getByText((content) => content.includes("Category :") && content.includes("Test Category"))).toBeInTheDocument();
             expect(screen.getByText((content) => content.includes("$123.00"))).toBeInTheDocument();
            expect(screen.getByText("Related Product")).toBeInTheDocument();
            expect(axios.get).toHaveBeenNthCalledWith(1, "/api/v1/product/get-product/test-slug");
            expect(axios.get).toHaveBeenNthCalledWith(2, "/api/v1/product/related-product/prod-id/cat-id");
        });
    });

    describe("error handling", () => {
        test("logs errors when product fetch fails", async () => {
            // Arrange
            const error = new Error("Network error");
            axios.get.mockRejectedValueOnce(error);
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

            // Act
            render(<ProductDetails />);

            // Assert
            await waitFor(() => expect(logSpy).toHaveBeenCalledWith(error));
            logSpy.mockRestore();
        });
    });

    describe("cart interactions", () => {
        test("adds main product to cart and persists it", async () => {
            // Arrange
            const emptyRelatedResponse = { products: [] };
            axios.get.mockResolvedValueOnce({ data: productResponse });
            axios.get.mockResolvedValueOnce({ data: emptyRelatedResponse });
            const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

            // Act
            render(<ProductDetails />);
            await screen.findByText((content) => content.includes("Test Product"));
            await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));

            // Assert
            expect(mockSetCart).toHaveBeenCalledWith([productResponse.product]);
            expect(setItemSpy).toHaveBeenCalledWith("cart", JSON.stringify([productResponse.product]));
            expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
            setItemSpy.mockRestore();
        });

        test("adds related product to cart when its button is clicked", async () => {
            // Arrange
            axios.get.mockResolvedValueOnce({ data: productResponse });
            axios.get.mockResolvedValueOnce({ data: relatedResponse });
            const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

            // Act
            render(<ProductDetails />);
            await screen.findByText("Related Product");
            const relatedButton = screen.getAllByRole("button", { name: /add to cart/i })[1];
            await userEvent.click(relatedButton);

            // Assert
            expect(mockSetCart).toHaveBeenCalledWith([relatedProduct]);
            expect(setItemSpy).toHaveBeenCalledWith("cart", JSON.stringify([relatedProduct]));
            expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
            setItemSpy.mockRestore();
        });
    });

    describe("navigation", () => {
        test("navigates to product details when more details is clicked", async () => {
            // Arrange
            axios.get.mockResolvedValueOnce({ data: productResponse });
            axios.get.mockResolvedValueOnce({ data: relatedResponse });

            // Act
            render(<ProductDetails />);
            await screen.findByText("Related Product");
            await userEvent.click(screen.getByRole("button", { name: /more details/i }));

            // Assert
            expect(mockNavigate).toHaveBeenCalledWith("/product/related-product");
        });
    });
});