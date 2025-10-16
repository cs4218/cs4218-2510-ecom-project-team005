import React, { useState, useEffect } from "react";
import UserMenu from "../../components/UserMenu";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useAuth } from "../../context/auth";
import moment from "moment";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [auth, setAuth] = useAuth();
  const getOrders = async () => {
    try {
      const { data } = await axios.get("/api/v1/auth/orders");
      setOrders(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (auth?.token) getOrders();
  }, [auth?.token]);
  return (
    <Layout title={"Your Orders"}>
      <div className="container-flui p-3 m-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <UserMenu />
          </div>
          <div className="col-md-9">
            <h1 className="text-center" data-testid="orders-title">All Orders</h1>
            {orders?.map((o, i) => {
              return (
                <div className="border shadow" key={o._id} data-testid={`order-${i}`}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Status</th>
                        <th scope="col">Buyer</th>
                        <th scope="col"> date</th>
                        <th scope="col">Payment</th>
                        <th scope="col">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td data-testid={`order-number-${i}`}>{i + 1}</td>
                        <td data-testid={`order-status-${i}`}>{o?.status}</td>
                        <td data-testid={`order-buyer-${i}`}>{o?.buyer?.name}</td>
                        <td data-testid={`order-date-${i}`}>{moment(o?.createAt).fromNow()}</td>
                        <td data-testid={`order-payment-${i}`}>{o?.payment.success ? "Success" : "Failed"}</td>
                        <td data-testid={`order-quantity-${i}`}>{o?.products?.length}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="container">
                    {o?.products?.map((p, j) => (
                      <div className="row mb-2 p-3 card flex-row" key={p._id} data-testid={`order-${i}-product-${j}`}>
                        <div className="col-md-4">
                          <img
                            src={`/api/v1/product/product-photo/${p._id}`}
                            className="card-img-top"
                            alt={p.name}
                            width="100px"
                            height={"100px"}
                          />
                        </div>
                        <div className="col-md-8">
                          <p data-testid={`order-${i}-product-${j}-name`}>{p.name}</p>
                          <p data-testid={`order-${i}-product-${j}-description`}>{p.description.substring(0, 30)}</p>
                          <p data-testid={`order-${i}-product-${j}-price`}>Price : {p.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Orders;