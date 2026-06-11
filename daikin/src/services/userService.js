import axios from "axios";


const getUserInfo = async () => {
  const response = await axios.get("/user-api/attributes", {
    withCredentials: true,
  });
  return response.data;
};

const getGroupsByEmail = async (email) => {
  // Hits your approuter's custom /scim-proxy route
  const response = await axios.get(`/scim-proxy?email=${encodeURIComponent(email)}`, {
    withCredentials: true,
  });

  const user = response.data?.Resources?.[0];
  console.log("Raw SCIM user:", JSON.stringify(user, null, 2));
  if (!user) {
    console.warn("No SCIM user found for email:", email);
    return { groups: [], userType: "unknown", userUuid: "", loginName: "" };
  }

  const sapExt = user["urn:ietf:params:scim:schemas:extension:sap:2.0:User"];

  return {
    groups:    user.groups?.map((g) => g.display) || [],
    userType:  user.userType  || "unknown",
    userUuid:  sapExt?.userUuid || "",
    loginName: user.userName  || "",
  };
};

export const getUserAttributes = async () => {
  try {
    const userInfo = await getUserInfo();
    console.log("Step 1 - XSUAA user info:", userInfo);

    const email = userInfo.email;
    if (!email) throw new Error("No email found in XSUAA response");

    const { groups, userType, userUuid, loginName } = await getGroupsByEmail(email);
    console.log("Step 2 - SCIM groups fetched:", groups, userType, userUuid, loginName);

    return {
      data: {
        firstname:  userInfo.firstname,
        lastname:   userInfo.lastname,
        email:      userInfo.email,
        name:       userInfo.name,
        scopes:     userInfo.scopes,
        user_uuid:  [userUuid],
        login_name: [loginName],
        Groups:     groups,
        type:       [userType],
      },
    };
  } catch (error) {
    console.error("getUserAttributes failed:", error);
    throw error;
  }
};