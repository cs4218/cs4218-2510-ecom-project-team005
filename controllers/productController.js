import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";

import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";

dotenv.config();

//payment gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity } =
      req.fields;
    const { photo } = req.files;
    //validation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is required" });
      case !description:
        return res.status(500).send({ error: "Description is required" });
      case !price:
        return res.status(500).send({ error: "Price is required" });
      case !category:
        return res.status(500).send({ error: "Category is required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is required" });
      case !photo || photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "Photo is required and must be less than 1MB" }); // We assume photos are required
    }

    /* File Type Validation */
    /* BEFORE: Any file type accepted, potential code execution */
    /* AFTER: Only safe image types allowed */
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(photo.type)) {
      return res.status(400).send({
        error: "Only image files are allowed"
      });
    }

    const products = new productModel({ ...req.fields, slug: slugify(name) });
    products.photo.data = fs.readFileSync(photo.path);
    products.photo.contentType = photo.type;

    await products.save();
    res.status(201).send({
      success: true,
      message: "Product created successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    /* Error Object Format Consistency */
    /* BEFORE: error object passed directly (inconsistent format) */
    /* AFTER: error.message passed for consistent format */
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error creating product", // fix error message
    });
  }
};

// get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      countTotal: products.length,
      message: "All Products",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting products",
      error: error.message,
    });
  }
};

// get single product
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    if(product){
        res.status(200).send({
      success: true,
      message: "Single product fetched",
      product,
    });
    } else {
      res.status(404).send({
        success: false,
        message: "No product found with this slug",
        product,
    })
  }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error fetching single product",
      error: error.message,
    });
  }
};

// get photo
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (!product || !product.photo || !product.photo.data) {
      return res.status(404).send({
        success: false,
        message: "Photo not found",
      });
    }
    res.set("Content-Type", product.photo.contentType);
    return res.status(200).send(product.photo.data);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error: error.message,
    });
  }
};

// delete controller
export const deleteProductController = async (req, res) => {

  try {
    /* ObjectId Format Check */
    /* Invalid IDs crash the database query */
    /* BEFORE: Server returns 500 error for malformed IDs */
    /* AFTER: Clear 400 error for invalid ID format (no crash)*/
    const mongoose = await import('mongoose');
    if (!mongoose.default.Types.ObjectId.isValid(req.params.pid)) {
      return res.status(400).send({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await productModel
      .findByIdAndDelete(req.params.pid)
      .select("-photo");

    if (!product) { // we need to check if the product acutally exists
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).send({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// update products
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //validation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is required" });
      case !description:
        return res.status(500).send({ error: "Description is required" });
      case !price:
        return res.status(500).send({ error: "Price is required" });
      case !category:
        return res.status(500).send({ error: "Category is required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is required" });
      case photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "Photo is required and must be less than 1MB" });
    }

    /* Price Range Check */
    /* BEFORE: Products could have negative prices like -$50 */
    /* AFTER: Only positive prices allowed */
    if (price < 0) {
      return res.status(400).send({
        error: "Price must be positive"
      });
    }

    /* Quantity Range Check */
    /* BEFORE: Products could have -10 items in stock */
    /* AFTER: Only non-negative quantities allowed */
    if (quantity < 0) {
      return res.status(400).send({
        error: "Quantity cannot be negative"
      });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );

    /* Product Existence Check */
    /* Updating non-existent products should return 404 */
    /* BEFORE: Null product causes crash when accessing .photo */
    /* AFTER: Clear 404 error for missing products */
    if (!products) {
      return res.status(404).send({
        success: false,
        message: "Product not found"
      });
    }

    /* Photo Null Safety */
    /* products.photo might be undefined/null */
    /* BEFORE: "Cannot set properties of undefined" error */
    /* AFTER: Initialize photo object if it doesn't exist */
    if (photo) {
      if (!products.photo) {
        products.photo = {};
      }
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product updated successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error updating product",
    });
  }
};

// filters
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args).limit(12);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error filtering products",
      error: error.message,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error counting products",
      error: error.message,
      success: false,
    });
  }
};

export const productCategoryCountController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    if(!category) {
      res.status(404).send({
        success: false,
        message: "There is no category with the requested slug"
      });
      return;
    }
    const total = await productModel
      .find({ category: category._id })
      .countDocuments();

    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error counting category products",
      error: error.message,
    });
  }
};

// product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    const page = Math.max(1, parseInt(req.params.page) || 1);
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error listing products",
      error: error.message,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");
    res.json(results);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error searching products",
      error: error.message,
    });
  }
};

// similar products
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error fetching related products",
      error: error.message,
    });
  }
};

// get products by catgory
export const productCategoryController = async (req, res) => {
  try {
    const perPage = 6;
    const page = Math.max(1, parseInt(req.params.page) || 1);

    const category = await categoryModel.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }
    const products = await productModel
      .find({ category: category._id })
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error fetching category products",
    });
  }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        console.log(err);
        return res.status(500).send({
          success: false,
          message: "Error generating payment token",
          error: err instanceof Error ? err.message : '',
        });
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error generating payment token",
      error: error.message,
    });
  }
};

//payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    
    // Input validation
    if (!nonce) {
      return res.status(400).send({
        success: false,
        message: "Payment nonce is required",
      });
    }
    
    if (!cart) {
      return res.status(400).send({
        success: false,
        message: "Shopping cart is required",
      });
    }
    
    if (cart.length == 0) {
      return res.status(400).send({
        success: false,
        message: "Shopping cart cannot be empty",
      });
    }
    
    // Calculate total using reduce (not map)
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    
    let newTransaction = gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      async function (error, result) {
        if (result) {
          try {
            // Properly await order save
            const order = await new orderModel({
              products: cart,
              payment: result,
              buyer: req.user._id,
            }).save();
            return res.status(200).send({
              success: true,
              message: "Payment done",
            });
            //res.json({ok: true})
          } catch (saveError) {
            console.log(saveError);
            res.status(500).send({
              success: false,
              message: "Error processing payment",
              error: saveError.message,
            });
          }
        } else {
          console.log(error);
          res.status(500).send({
            success: false,
            message: "Error processing payment",
            error: error instanceof Error ? error.message : 'sale error',
          });
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error processing payment",
      error: error.message,
    });
  }
};