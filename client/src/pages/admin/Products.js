import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/AdminMenu";
import Layout from "./../../components/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

/* XSS Prevention Function */
/* BEFORE: Script executes in admin panel, could steal admin credentials */
/* AFTER: Script tags removed, only safe text displayed */
const sanitizeProductData = (input) => {
  if (!input || typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
};

const Products = () => {
  const [products, setProducts] = useState([]);

  //getall products
  const getAllProducts = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/get-product");
      setProducts(data.products);
    } catch (error) {
      console.log(error);
      /* FIX: Improved error message and specificity */
      /* BEFORE: Generic typo "Someething Went Wrong" */
      /* AFTER: Clear, professional error message */
      toast.error("Failed to load products. Please check your connection and try again.");
    }
  };

  //lifecycle method
  useEffect(() => {
    getAllProducts();
  }, []);
  return (
    <Layout>
      <div className="row">
        <div className="col-md-3">
          <AdminMenu />
        </div>
        <div className="col-md-9 ">
          <h1 className="text-center">All Products List</h1>
          
          {/* FIX: Empty state handling */}
          {/* BEFORE: Shows nothing when no products exist */}
          {/* AFTER: Helpful message with action button */}
          {products.length === 0 ? (
            <div className="text-center mt-5">
              <h3>No Products Available</h3>
              <p>Start building your catalog by adding your first product.</p>
              <Link to="/dashboard/admin/create-product" className="btn btn-primary">
                Add Product
              </Link>
            </div>
          ) : (
            <div className="d-flex flex-wrap">
              {products?.map((p) => (
                <Link
                  key={p._id}
                  to={`/dashboard/admin/product/${p.slug}`}
                  className="product-link"
                >
                  <div className="card m-2" style={{ width: "18rem" }}>
                    {/* FIX: Image fallback for broken images */}
                    {/* BEFORE: Shows broken image icon if photo fails to load */}
                    {/* AFTER: Shows placeholder image on error */}
                    <img
                      src={`/api/v1/product/product-photo/${p._id}`}
                      className="card-img-top"
                      alt={sanitizeProductData(p.name)}
                      onError={(e) => {
                        e.target.src = '/images/placeholder-product.png';
                        e.target.onerror = null; // Prevent infinite loop
                      }}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <div className="card-body">
                      {/* FIX: Sanitize product data to prevent XSS */}
                      {/* BEFORE: Raw product data could contain malicious scripts */}
                      {/* AFTER: HTML tags stripped, only safe text displayed */}
                      <h5 className="card-title">{sanitizeProductData(p.name)}</h5>
                      <p className="card-text">{sanitizeProductData(p.description)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Products;