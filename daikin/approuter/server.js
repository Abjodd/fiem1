const approuter = require("@sap/approuter");
const axios = require("axios");

const app = approuter();

const IDP_BASE_URL = "https://ayss8kvrs.accounts.ondemand.com";
const APP_URL = "https://fiem-industries-limited-fiem-quality-xb13yr5m-quality-d781add47.cfapps.in30.hana.ondemand.com";
const XSUAA_URL = "https://fiem-quality-xb13yr5m.authentication.in30.hana.ondemand.com";

const SCIM_URL = "https://ayss8kvrs.accounts.ondemand.com";
const SCIM_USER = "sakthivels1@kpmg.com";
const SCIM_PASSWORD = "KPMG@123";


app.beforeRequestHandler.use("/do/logout", (req, res, next) => {
  res.setHeader("Set-Cookie", [
    "locationAfterLogin=; Max-Age=0; Path=/; HttpOnly",
    "fragmentAfterLogin=; Max-Age=0; Path=/; HttpOnly",
    "__VCAP_ID__=; Max-Age=0; Path=/; HttpOnly",
  ]);

  const postLogoutUri = encodeURIComponent(APP_URL);
  const idpLogoutUrl = `${IDP_BASE_URL}/oauth2/logout?post_logout_redirect_uri=${postLogoutUri}`;
  const xsuaaLogoutUrl = XSUAA_URL + `/logout.do?returnTo=${encodeURIComponent(idpLogoutUrl)}`;

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

    const response = await axios.get(
      `${SCIM_URL}/scim/Users?filter=emails.value eq "${email}"`,
      {
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${SCIM_USER}:${SCIM_PASSWORD}`).toString("base64"),
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