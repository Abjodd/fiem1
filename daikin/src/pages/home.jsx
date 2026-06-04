import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAttributes } from "../services/userService";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const response = await getUserAttributes();
      const userData = response.data;

      // ✅ Log everything here
      console.log("SAP USER FULL RESPONSE:", userData);
      console.log("Groups:", userData.Groups);
      console.log("User Type:", userData.type?.[0]);
      console.log("Login Name:", userData.login_name?.[0]);
      console.log("Email:", userData.email);

      // Derive role from groups
      const role = userData.type?.[0] === "employee" ? "employee" : "partner";

      // Save to localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          role: role,
          data: userData,
        })
      );

      // Redirect to landing
      navigate("/landing");

    } catch (err) {
      console.error("AUTH ERROR:", err);
      navigate("/login");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
        fontSize: "20px",
        background: "#f5f7fb",
      }}
    >
      Authenticating with SAP...
    </div>
  );
}

export default Home;