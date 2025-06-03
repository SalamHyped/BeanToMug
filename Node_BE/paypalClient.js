const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");

function environment() {
  let clientId =
    process.env.PAYPAL_CLIENT_ID ||
    "ASYxqqlQIs3DTA9fGu--Z7orwRlDRgc1eEz6V9e3D4LqJy9yM18Hp2RH5-LkOXrYxLhR8RRlLPoMoS-_";
  let clientSecret =
    process.env.PAYPAL_CLIENT_SECRET ||
    "EJHMAanJfE4n6u49bSGQAC1jsLHg2VWO6XuQ-ZYt8ADJzRg5xdj67qHOsjM1Z6p-cgjuiifE-Xe0qA0W";

  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

module.exports = { paypalClient: client() };
