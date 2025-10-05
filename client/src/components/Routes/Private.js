import React, { useState,useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from 'axios';
// import { set } from "mongoose";
import Spinner from "../Spinner";

export default function PrivateRoute(){
    const [ok,setOk] = useState(false)
    const [auth,setAuth] = useAuth()

    useEffect(()=> {
        const authCheck = async() => {
            try {
                /* BEFORE: If network fails (WiFi down, server crash), user gets stuck on spinner forever */
                /* AFTER: Network errors are caught and handled gracefully */
                /* FIX: Added try-catch block to handle network errors */
                const res = await axios.get("/api/v1/auth/user-auth");
                if(res.data.ok){
                    setOk(true);
                } else {
                    setOk(false);
                }
            } catch (error) {
                console.log("Network error during auth check:", error);
                setOk(false); // Deny access on network error
            }
        };
        if (auth?.token) authCheck();
    }, [auth?.token]);

    return ok ? <Outlet /> : <Spinner path=""/>;
}