const approuter = require("@sap/approuter");
const axios = require("axios");

const app = approuter();

app.beforeRequestHandler.use("/do/logout", (req, res, next) => {
  // Clear cookies
  res.setHeader("Set-Cookie", [
    "locationAfterLogin=; Max-Age=0; Path=/; HttpOnly",
    "fragmentAfterLogin=; Max-Age=0; Path=/; HttpOnly",
    "__VCAP_ID__=; Max-Age=0; Path=/; HttpOnly",
  ]);

  const idpBaseUrl = process.env.IDP_BASE_URL;
  const appUrl = process.env.APP_URL;

  const postLogoutUri = encodeURIComponent(appUrl + '/');
  const idpLogoutUrl = `${idpBaseUrl}/oauth2/logout?post_logout_redirect_uri=${postLogoutUri}`;

  // Redirect through XSUAA logout first, then to IDP
  const xsuaaLogoutUrl = process.env.XSUAA_URL + `/logout.do?returnTo=${encodeURIComponent(idpLogoutUrl)}`;

  res.statusCode = 302;
  res.setHeader("Location", xsuaaLogoutUrl);
  res.end();
});
app.beforeRequestHandler.use("/scim-proxy", async (req, res, next) => {
  try {
    const email = req.query["email"];

    if (!email) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Email is required" }));
      return;
    }

    const SCIM_URL  = process.env.SCIM_URL;
    const SCIM_USER = process.env.SCIM_USER;
    const SCIM_PASS = process.env.SCIM_PASSWORD;

    const response = await axios.get(
      `${SCIM_URL}/scim/Users?filter=emails.value eq "${email}"`,
      {
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${SCIM_USER}:${SCIM_PASS}`).toString("base64"),
        },
      }
    );

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response.data));

  } catch (err) {
    console.error("SCIM proxy error:", err.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "SCIM call failed", detail: err.message }));
  }
});

app.start();