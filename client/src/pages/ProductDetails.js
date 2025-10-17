import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/ProductDetailsStyles.css";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";

const ProductDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [product, setProduct] = useState({});
  const [relatedProducts, setRelatedProducts] = useState([]);

  //initial details
  useEffect(() => {
    if (params?.slug) getProduct();
  }, [params?.slug]);
  //getProduct
  const getProduct = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/get-product/${params.slug}`
      );
      setProduct(data?.product);
      getSimilarProduct(data?.product._id, data?.product.category._id);
    } catch (error) {
      console.log(error);
    }
  };
  //get similar product
  const getSimilarProduct = async (pid, cid) => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/related-product/${pid}/${cid}`
      );
      setRelatedProducts(data?.products);
    } catch (error) {
      console.log(error);
    }
  };
  return ( // I added a loading animation as before that there was a bug, that the image load would fail as it would create a request to the backend with an undefined product id
    <Layout> 
      <div className="row container product-details"> 
        <div className="col-md-6 d-flex align-items-center justify-content-center" style={{ minHeight: "300px" }}>
          {!product._id ? (
            <div className="d-flex justify-content-center align-items-center" style={{ width: "350px", height: "300px" }}>
              <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <img // made the image not streched anymore
              src={`/api/v1/product/product-photo/${product._id}`}
              className="card-img-top"
              alt={product.name}
              data-testid="product-image"
              style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain" }}
            />
          )}
        </div>
        <div className="col-md-6 product-details-info">
          <h1 className="text-center">Product Details</h1>
          <hr />
          <h6 data-testid="product-name">Name : {product.name}</h6>
          <h6 data-testid="product-description">Description : {product.description}</h6>
          <h6 data-testid="product-price">
            Price :
            {product?.price?.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </h6>
          <h6 data-testid="product-category">Category : {product?.category?.name}</h6>
          <button
            className="btn btn-secondary ms-1"
            data-testid="add-to-cart-button"
            disabled={!product?._id}
            onClick={() => {
              if (!product?._id) return;
              setCart([...cart, product]);
              localStorage.setItem(
                "cart",
                JSON.stringify([...cart, product])
              );
              toast.success("Item Added to cart");
            }}
          >
            ADD TO CART
          </button>
        </div>
      </div>
      <hr />
      <div className="row container similar-products" data-testid="related-products">
        <h4>Similar Products ➡️</h4>
        {relatedProducts.length < 1 && (
          <p className="text-center" data-testid="no-similar-products">No Similar Products found</p>
        )}
        <div className="d-flex flex-wrap">
          {relatedProducts?.map((p) => (
            <div className="card m-2" key={p._id} data-testid={`related-product-card-${p.slug}`}>
              <img
                src={`/api/v1/product/product-photo/${p._id}`}
                className="card-img-top"
                alt={p.name}
              />
              <div className="card-body">
                <div className="card-name-price">
                  <h5 className="card-title">{p.name}</h5>
                  <h5 className="card-title card-price">
                    {p.price.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </h5>
                </div>
                <p className="card-text ">
                  {p.description.substring(0, 60)}...
                </p>
                <div className="card-name-price">
                  <button
                    className="btn btn-info ms-1"
                    data-testid={`related-more-details-${p.slug}`}
                    onClick={() => navigate(`/product/${p.slug}`)}
                  >
                    More Details
                  </button>
                  { <button
                      className="btn btn-dark ms-1"
                      data-testid={`related-add-to-cart-${p.slug}`}
                      onClick={() => {
                        setCart([...cart, p]);
                        localStorage.setItem(
                          "cart",
                          JSON.stringify([...cart, p])
                        );
                        toast.success("Item Added to cart");
                      }}
                    >
                      ADD TO CART
                    </button>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;