import { describe, test, expect } from "@jest/globals";
import mongoose from "mongoose";

import Product from "./productModel.js";
//AI was used to write parts of this file. Tool: Cursor, Prompt: How can I evaluate the structure of a Mongoose model?
describe("Product Model", () => {
  describe("Schema definition", () => {
    test("should expose expected paths with correct types", () => {
      const paths = Product.schema.paths;

      expect(paths.name).toBeDefined();
      expect(paths.slug).toBeDefined();
      expect(paths.description).toBeDefined();
      expect(paths.price).toBeDefined();
      expect(paths.category).toBeDefined();
      expect(paths.quantity).toBeDefined();

      expect(paths.name.instance).toBe("String");
      expect(paths.slug.instance).toBe("String");
      expect(paths.description.instance).toBe("String");
      expect(paths.price.instance).toBe("Number");
      expect(paths.category.instance).toBe("ObjectID");
      expect(paths.quantity.instance).toBe("Number");
      expect(paths.shipping.instance).toBe("Boolean");
    });
  });

  describe("Validation", () => {
    test("should reject documents missing required fields", () => {
      const product = new Product({});
      const err = product.validateSync();

      expect(err).toBeDefined();
      expect(err.errors).toHaveProperty("name");
      expect(err.errors).toHaveProperty("slug");
      expect(err.errors).toHaveProperty("description");
      expect(err.errors).toHaveProperty("price");
      expect(err.errors).toHaveProperty("category");
      expect(err.errors).toHaveProperty("quantity");
    });

    test("should accept a document with all required data", () => {
      const productData = {
        name: "Phone",
        slug: "phone",
        description: "Latest smartphone",
        price: 999,
        category: new mongoose.Types.ObjectId(),
        quantity: 5,
        shipping: true,
        photo: {
          data: Buffer.from("photo-bytes"),
          contentType: "image/jpeg",
        },
      };

      const product = new Product(productData);
      const err = product.validateSync();

      expect(err).toBeUndefined();
      expect(product.name).toBe("Phone");
      expect(product.category).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });

  describe("Model export", () => {
    test("should export a configured mongoose model", () => {
      expect(Product).toBeDefined();
      expect(typeof Product).toBe("function");
      expect(Product.modelName).toBe("Products");
    });
  });
});

