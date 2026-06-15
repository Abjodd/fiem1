import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function Home() {
  const navigate = useNavigate();
  const { user, role, loginId, loginType, loading, error } = useUser();

  useEffect(() => {
    if (loading) return;

    if (error) {
      console.error("AUTH ERROR:", error);
      navigate("/login");
      return;
    }

    if (user) {
      // ✅ Log everything for debugging
      console.log("SAP USER FULL RESPONSE:", user);
      console.log("Groups:", user.Groups);
      console.log("User Type:", user.type?.[0]);
      console.log("Login Name:", loginId);
      console.log("Email:", user.email);
      console.log("Role:", role);
      console.log("SAP Login Type:", loginType);

      navigate("/landing", { replace: true });
    }
  }, [user, loading, error]);

  
  return null;
}

export default Home;