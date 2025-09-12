import React, { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        token: "",
    });

    useEffect(() => {
       const data = localStorage.getItem("auth");
       if (data) {
        let parseData;
        try {
        parseData = JSON.parse(data);
        } catch (error) {
            console.error("Error parsing auth data:", error);
        }
        setAuth({
            ...auth,
            user: parseData?.user,
            token: parseData?.token,
        });
       }
       //eslint-disable-next-line
    }, []);

    useEffect(() => {
        axios.defaults.headers.common["Authorization"] = auth?.token || "";
    }, [auth?.token]);

    
    return (
        <AuthContext.Provider value={[auth, setAuth]}>
            {children}
        </AuthContext.Provider>
    );
};

// custom hook
const useAuth = () => useContext(AuthContext);

export {useAuth, AuthProvider};