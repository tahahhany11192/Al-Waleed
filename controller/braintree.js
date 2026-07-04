const braintree = require("braintree");
require("dotenv").config();

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

class BrainTree {
  ganerateToken(req, res) {
    gateway.clientToken.generate({}, (err, response) => {
      if (err) {
        console.error("Braintree token error:", err);
        return res.status(500).json({ error: "Failed to generate payment token" });
      }
      return res.json(response);
    });
  }

  paymentProcess(req, res) {
    const { amountTotal, paymentMethod } = req.body;
    if (!amountTotal || !paymentMethod) {
      return res.status(400).json({ error: "Amount and payment method are required" });
    }

    gateway.transaction.sale(
      {
        amount: amountTotal,
        paymentMethodNonce: paymentMethod,
        options: { submitForSettlement: true },
      },
      (err, result) => {
        if (err) {
          console.error("Braintree payment error:", err);
          return res.status(500).json({ error: "Payment failed" });
        }

        if (result.success) {
          return res.json(result);
        }

        return res.status(400).json({ error: result.message || "Payment was not approved" });
      }
    );
  }
}

const brainTreeController = new BrainTree();
module.exports = brainTreeController;
