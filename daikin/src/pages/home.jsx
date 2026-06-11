import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAttributes } from "../services/userService";
import { useUser } from "../context/UserContext";

function Home() {
  const navigate = useNavigate();
  const { setUser } = useUser();  // ✅ get setUser from context

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const response = await getUserAttributes();
      const userData = response.data;

      console.log("SAP USER FULL RESPONSE:", userData);
      console.log("Groups:", userData.Groups);
      console.log("User Type:", userData.type?.[0]);
      console.log("Login Name:", userData.login_name?.[0]);
      console.log("Email:", userData.email);

      setUser(userData);  // ✅ store in context instead of localStorage

      navigate("/landing");

    } catch (err) {
      console.error("AUTH ERROR:", err);
      navigate("/login");
    }
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "sans-serif",
      fontSize: "20px",
      background: "#f5f7fb",
    }}>
      Authenticating with SAP...
    </div>
  );
}

export default Home;