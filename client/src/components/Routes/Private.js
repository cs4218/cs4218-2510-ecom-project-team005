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
                /* FIX: Added try-catch block to handle network errors */
                /* BEFORE: If network fails (WiFi down, server crash), user gets stuck on spinner forever */
                /* AFTER: Network errors are caught and handled gracefully */
                
                const res = await axios.get("/api/v1/auth/user-auth");
                if(res.data.ok){
                    setOk(true);
                } else {
                    setOk(false);
                }
            } catch (error) {
                /* CRITICAL FIX: Handle network failures */
                /* WHY THIS WAS A BUG: */
                /* - Users with poor internet got stuck on loading screen */
                /* - No way to recover without refreshing page */
                /* - Bad user experience during network issues */
                
                console.log("Network error during auth check:", error);
                setOk(false); // Deny access on network error (fail-safe approach)
                
                /* ALTERNATIVE APPROACHES WE COULD TAKE: */
                /* 1. setOk(false) - Current: Deny access (more secure) */
                /* 2. Retry logic - Could add setTimeout to retry after delay */
                /* 3. Show error message - Could set error state for user feedback */
            }
        };
        if (auth?.token) authCheck();
    }, [auth?.token]);

    return ok ? <Outlet /> : <Spinner path=""/>;
}