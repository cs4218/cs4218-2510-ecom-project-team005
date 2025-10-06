import React from "react";
import Layout from "./../components/Layout";

const About = () => {
  return (
    <Layout title={"About us - Ecommerce app"}>
      <div className="row contactus " data-testid="about-row-test"> {/* Added data-testid for testing */}
        <div className="col-md-6 " data-testid="about-image-col-test"> {/* Added data-testid for testing */}
          <img
            src="/images/about.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4" data-testid="about-text-col-test"> {/* Added data-testid for testing */}
          <p className="text-justify mt-2">
            Add text
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;