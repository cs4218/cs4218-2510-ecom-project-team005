// HOU QINGSHAN test file for Layout
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Helmet } from "react-helmet";
import Layout from "./Layout";

// Stubs
jest.mock("./Header", () => () => <div data-testid="header-stub" />);
jest.mock("./Footer", () => () => <div data-testid="footer-stub" />);
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  Toaster: () => <div data-testid="toaster-stub" />,
}));

// Helper functions to read Helmet state
const headState = () => Helmet.peek();
const metaContent = (name) =>
  headState().metaTags?.find((m) => m.name === name)?.content ?? null;

describe("<Layout />", () => {
  test("renders Header, Toaster, children, and Footer", () => {
    render(
      <Layout>
        <div data-testid="child">CONTENT</div>
      </Layout>
    );
    expect(screen.getByTestId("header-stub")).toBeInTheDocument();
    expect(screen.getByTestId("toaster-stub")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toHaveTextContent("CONTENT");
    expect(screen.getByTestId("footer-stub")).toBeInTheDocument();
  });

  test("default head tags", () => {
    render(<Layout />);
    // title
    expect(headState().title).toBe("Ecommerce app - shop now");
    // metas
    expect(metaContent("description")).toBe("mern stack project");
    expect(metaContent("keywords")).toBe("mern,react,node,mongodb");
    expect(metaContent("author")).toBe("Techinfoyt");
  });

  test("custom head tags", () => {
    render(
      <Layout
        title="Custom Title"
        description="Custom description"
        keywords="k1,k2"
        author="Alice"
      />
    );
    expect(headState().title).toBe("Custom Title");
    expect(metaContent("description")).toBe("Custom description");
    expect(metaContent("keywords")).toBe("k1,k2");
    expect(metaContent("author")).toBe("Alice");
  });
});