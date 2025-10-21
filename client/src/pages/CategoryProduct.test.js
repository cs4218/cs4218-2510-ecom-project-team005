import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import CategoryProduct from "./CategoryProduct"

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
    _id: "68da4e47c6cb656147a1738f",
    name: "Laptop",
    slug: "laptop",
    description: "A powerful laptop",
    price: 1499.99,
    quantity: 30,
    shipping: true,
}

const category = {
    _id: "66db427fdb0119d9234b27ed",
    name: "Electronics",
    slug: "electronics",
}
const countResponse = {
    success: true,
    total: 8
}

const slug = "electronics"

describe("CategoryProduct", () => {
    const mockSetCart = jest.fn();

    const renderComponent = () => render(<CategoryProduct />);
    const setupInitialSuccess = ({ products = [productResponse], total = countResponse.total } = {}) => {
        axios.get
            .mockResolvedValueOnce({ data: { ...countResponse, total } })
            .mockResolvedValueOnce({ data: { products, category } });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useParams.mockReturnValue({ slug});
        useCart.mockReturnValue([[], mockSetCart]);
    });

    describe("when initial requests succeed", () => {
        beforeEach(() => {
            // Arrange
            setupInitialSuccess();
        });

        it("Category title should render correctly", async () => {
            // Act
            renderComponent();

            // Assert
            await waitFor(() =>
                expect(screen.getByTestId("category-title")).toHaveTextContent(category.name)
            );
            expect(screen.getByText(/result found/i)).toHaveTextContent(`${countResponse.total} result found`);
            expect(axios.get).toHaveBeenNthCalledWith(1, `/api/v1/product/product-category-count/${slug}`);
            expect(axios.get).toHaveBeenNthCalledWith(2, `/api/v1/product/product-category/${slug}/1`);
        });

        it("More details button should open details page", async () => {
            // Act
            renderComponent();
            await screen.findByText(productResponse.name);
            await userEvent.click(screen.getByRole("button", { name: /more details/i }));

            // Assert
            expect(mockNavigate).toHaveBeenCalledWith(`/product/${productResponse.slug}`);
        });

        it("Add to cart button should add item to cart", async () => {
            // Arrange
            const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

            // Act
            renderComponent();
            await screen.findByText(productResponse.name);
            await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));

            // Assert
            expect(mockSetCart).toHaveBeenCalledWith([productResponse]);
            expect(setItemSpy).toHaveBeenCalledWith("cart", JSON.stringify([productResponse]));
            expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
            setItemSpy.mockRestore();
        });

        it("Image should load with correct alt text", async () => {
            // Act
            renderComponent();
            const image = await screen.findByAltText(productResponse.name);

            // Assert
            expect(image.getAttribute("src")).toContain(`/api/v1/product/product-photo/${productResponse._id}`);
        });
    });

    describe("error handling", () => {
        it("should handle getTotal error", async () => {
            // Arrange
            const error = new Error("Failed to fetch total");
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
            axios.get.mockRejectedValueOnce(error);
            axios.get.mockResolvedValueOnce({ data: { products: [productResponse], category } });

            // Act
            renderComponent();

            // Assert
            await waitFor(() =>
                expect(logSpy).toHaveBeenCalledWith(error)
            );
            logSpy.mockRestore();
        });

        it("should handle getPrductsByCat error", async () => {
            // Arrange
            const error = new Error("Failed to fetch products");
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
            axios.get.mockResolvedValueOnce({ data: countResponse });
            axios.get.mockRejectedValueOnce(error);

            // Act
            renderComponent();

            // Assert
            await waitFor(() =>
                expect(logSpy).toHaveBeenCalledWith(error)
            );
            logSpy.mockRestore();
        });
    });

    describe("pagination", () => {
        describe("when more items remain", () => {
            beforeEach(() => {
                // Arrange
                setupInitialSuccess();
            });

            it("should display button if more items can be loaded", async () => {
                // Act
                renderComponent();
                await screen.findByText(productResponse.name);

                // Assert
                expect(screen.getByRole("button", { name: /loadmore/i })).toBeInTheDocument();
            });
        });

        describe("when all items are displayed", () => {
            beforeEach(() => {
                // Arrange
                setupInitialSuccess({ total: 1 });
            });

            it("should hide button if all items are displayed", async () => {
                // Act
                renderComponent();
                await screen.findByText(productResponse.name);

                // Assert
                expect(screen.queryByRole("button", { name: /loadmore/i })).not.toBeInTheDocument();
            });
        });

        describe("when loading additional products", () => {
            const secondProductResponse = {
                _id: "second-product",
                name: "Tablet",
                slug: "tablet",
                description: "A handy tablet",
                price: 899.99,
                quantity: 15,
                shipping: true,
            };

            beforeEach(() => {
                // Arrange
                setupInitialSuccess();
                axios.get.mockResolvedValueOnce({ data: { products: [secondProductResponse], category } });
            });

            it("should load more products on request", async () => {
                // Act
                renderComponent();
                await screen.findByText(productResponse.name);
                await userEvent.click(screen.getByRole("button", { name: /loadmore/i }));

                // Assert
                await waitFor(() => {
                    expect(axios.get).toHaveBeenNthCalledWith(3, `/api/v1/product/product-category/${slug}/2`);
                });
                expect(await screen.findByText(secondProductResponse.name)).toBeInTheDocument();
                expect(screen.getAllByRole("button", { name: /add to cart/i })).toHaveLength(2);
            });
        });
    });


})