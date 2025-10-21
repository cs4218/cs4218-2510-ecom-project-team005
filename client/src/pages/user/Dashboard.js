import React from "react";
import Layout from "../../components/Layout";
import UserMenu from "../../components/UserMenu";
import { useAuth } from "../../context/auth";

/* XSS Prevention Function */
const sanitizeUserInput = (input) => {
  // BUG: Should return '' for non-strings to prevent React crash - fix later
  if (!input || typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
};

const Dashboard = () => {
  const [auth] = useAuth();
  return (
    <Layout title={"Dashboard - Ecommerce App"}>
      {/* bug: className was container-flui */}
      <div className="container-fluid m-3 p-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <UserMenu />
          </div>
          <div className="col-md-9">
            <div className="card w-75 p-3">       
              {/* BEFORE: Raw user data could contain <script>alert('hack')</script>
                          {auth?.user?.name} would show "undefined" if name missing */}
              {/* AFTER: Sanitize user input to remove dangerous HTML/JavaScript 
                          Shows "Name not provided" for better user experience*/}
              {/* FIX: Prevent XSS (Cross-Site Scripting) attacks
                        Added fallback values to prevent "undefined" display */}
              <h3>{sanitizeUserInput(auth?.user?.name) || "Name not provided"}</h3>
              <h3>{sanitizeUserInput(auth?.user?.email) || "Email not provided"}</h3>
              <h3>{sanitizeUserInput(auth?.user?.address) || "Address not provided"}</h3>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;