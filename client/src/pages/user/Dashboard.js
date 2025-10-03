import React from "react";
import Layout from "../../components/Layout";
import UserMenu from "../../components/UserMenu";
import { useAuth } from "../../context/auth";

/* SECURITY FIX: XSS Prevention Function */
/* WHY WE NEED THIS: Malicious users could inject JavaScript in their profile */
/* EXAMPLE ATTACK: User sets name to '<script>alert("Stolen data!")</script>' */
/* WITHOUT THIS: Script executes, steals user data, redirects to phishing sites */
/* WITH THIS: Script tags removed, only safe text displayed */
const sanitizeUserInput = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  // Remove all HTML tags including <script>, <img>, <iframe> etc.
  // This prevents XSS attacks while preserving normal text
  return input.replace(/<[^>]*>/g, '').trim();
  
  /* ALTERNATIVE APPROACHES: */
  /* 1. Use DOMPurify library for more advanced sanitization */
  /* 2. Escape HTML entities (&lt; instead of <) */
  /* 3. Use React's built-in text rendering (which we already do, but extra safety) */
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
              {/* FIX: Added fallback values to prevent "undefined" display */}
              {/* BEFORE: {auth?.user?.name} would show "undefined" if name missing */}
              {/* AFTER: Shows "Name not provided" for better user experience */}
              
              {/* SECURITY FIX: Prevent XSS (Cross-Site Scripting) attacks */}
              {/* BEFORE: Raw user data could contain <script>alert('hack')</script> */}
              {/* AFTER: Sanitize user input to remove dangerous HTML/JavaScript */}
              <h3>{sanitizeUserInput(auth?.user?.name) || "Name not provided"}</h3>
              <h3>{sanitizeUserInput(auth?.user?.email) || "Email not provided"}</h3>
              <h3>{sanitizeUserInput(auth?.user?.address) || "Address not provided"}</h3>
              
              {/* WHY THIS MATTERS: */}
              {/* - Users see friendly messages instead of confusing "undefined" text */}
              {/* - Improves user experience for incomplete profiles */}
              {/* - Makes the app look more professional and polished */}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;