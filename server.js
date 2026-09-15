// NOVARA Store Demo — Day 2 learning backend
// A minimal Express server. No database, no auth, no payments yet.

require("dotenv").config();
const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Lets Express automatically parse incoming JSON request bodies
// (needed so req.body works on POST requests)
app.use(express.json());

// Serve the frontend files by explicit route rather than express.static(__dirname),
// so only these three files are reachable over HTTP — server.js, .env, package.json,
// and node_modules stay private.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});
app.get("/script.js", (req, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});

// Product and hero images live under images/ — served as static files.
// This folder only contains media, so exposing it directly is safe
// (unlike serving the whole project root, which would leak server.js/.env).
app.use("/images", express.static(path.join(__dirname, "images")));

// ---------- Product data ----------
// Premium 12-product catalog with real photography (see images/products/).
// All products and prices are fictional — no real brands.
const PRODUCTS = [
  { id: 1, name: "Luxury Wireless Headphones", desc: "Over-ear headphones with active noise cancellation and a hand-stitched leather finish.", price: 249.99, image: "/images/products/headphones.png", category: "Technology" },
  { id: 2, name: "Luxury Smartwatch", desc: "A refined smartwatch with a sapphire-finish display and genuine leather band.", price: 329.99, image: "/images/products/smartwatch.png", category: "Technology" },
  { id: 3, name: "Premium Flagship Smartphone", desc: "Our flagship smartphone with a pro-grade camera system and all-day battery life.", price: 999.99, image: "/images/products/smartphone.png", category: "Technology" },
  { id: 4, name: "Premium Leather Wallet", desc: "Slim bifold wallet crafted from full-grain leather with card slots and a cash pocket.", price: 89.99, image: "/images/products/wallet.png", category: "Accessories" },
  { id: 5, name: "Luxury Sunglasses", desc: "Polarized square-frame sunglasses with a brushed gold-tone finish.", price: 159.99, image: "/images/products/sunglasses.png", category: "Fashion" },
  { id: 6, name: "Premium Smart Speaker", desc: "Voice-activated smart speaker with rich, room-filling sound.", price: 199.99, image: "/images/products/smart-speaker.png", category: "Technology" },
  { id: 7, name: "Luxury Minimalist Backpack", desc: "Water-resistant leather backpack designed for the modern commute.", price: 219.99, image: "/images/products/backpack.png", category: "Accessories" },
  { id: 8, name: "Premium Insulated Water Bottle", desc: "Double-wall insulated bottle that keeps drinks cold for 24 hours.", price: 44.99, image: "/images/products/water-bottle.png", category: "Lifestyle" },
  { id: 9, name: "Luxury Desk Lamp", desc: "Adjustable LED desk lamp with warm-to-cool lighting and a matte black finish.", price: 129.99, image: "/images/products/desk-lamp.png", category: "Lifestyle" },
  { id: 10, name: "Premium Wireless Earbuds", desc: "True wireless earbuds with active noise cancellation and a compact charging case.", price: 179.99, image: "/images/products/earbuds.png", category: "Technology" },
  { id: 11, name: "Luxury Travel Duffel Bag", desc: "Spacious leather duffel bag built for weekend getaways and business travel.", price: 259.99, image: "/images/products/duffel-bag.png", category: "Accessories" },
  { id: 12, name: "NOVARA Signature Outfit Set", desc: "A complete tailored look: premium shirt, full-length trouser, and luxury leather shoes.", price: 349.99, image: "/images/products/outfit-set.png", category: "Fashion" }
];

// GET /api/hello — simplest possible endpoint, just returns JSON
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the NOVARA backend!" });
});

// POST /api/test — accepts JSON in the request body and echoes it back
app.post("/api/test", (req, res) => {
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Request body is empty or not valid JSON." });
  }

  res.json({
    message: "Data received successfully!",
    youSent: data
  });
});

// GET /api/products — the product catalog the frontend renders
app.get("/api/products", (req, res) => {
  res.json(PRODUCTS);
});

// POST /api/orders — accepts a demo order (customer info + cart items) and
// returns a generated confirmation. Nothing is persisted yet (no database yet)
// and this is not a real transaction (no payment processing yet).
app.post("/api/orders", (req, res) => {
  const { customer, items } = req.body || {};

  if (!customer || !customer.name || !customer.email) {
    return res.status(400).json({ error: "Missing required customer information." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order must include at least one item." });
  }

  const orderId = "NOV-" + Date.now().toString(36).toUpperCase();

  res.status(201).json({
    message: "Demo order received (not a real transaction).",
    orderId,
    receivedAt: new Date().toISOString(),
    customer,
    items
  });
});

// POST /api/payments/charge — creates a Moyasar TEST-mode payment.
// This endpoint never receives card numbers, expiry dates, or CVC — only a
// pre-tokenized "source" produced by Moyasar.js in the browser (Step 3+).
// The secret key lives only in process.env, is never sent to the frontend,
// and is never logged.
app.post("/api/payments/charge", async (req, res) => {
  const { amount, source } = req.body || {};

  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: "amount must be a positive integer, in halalas." });
  }
  if (typeof source !== "string" || !/^token_/.test(source.trim())) {
    return res.status(400).json({ error: "source must be a valid Moyasar payment token (starts with 'token_')." });
  }

  const secretKey = process.env.MOYASAR_SECRET_KEY_TEST;
  if (!secretKey) {
    return res.status(500).json({ error: "Payment gateway is not configured. Set MOYASAR_SECRET_KEY_TEST in .env (test mode only)." });
  }

  const callbackUrl = `${req.protocol}://${req.get("host")}/`;

  try {
    const moyasarResponse = await fetch("https://api.moyasar.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(secretKey + ":").toString("base64")
      },
      body: JSON.stringify({
        amount,
        currency: "SAR",
        description: "NOVARA Store Demo — test order",
        callback_url: callbackUrl,
        source: { type: "token", token: source }
      })
    });

    const result = await moyasarResponse.json();

    if (!moyasarResponse.ok) {
      // Relay Moyasar's own validation message only — never the secret key.
      return res.status(moyasarResponse.status).json({
        error: "Payment request was rejected by the gateway.",
        message: result.message || "Unknown error.",
        details: result.errors || null
      });
    }

    res.json({
      status: result.status,
      id: result.id,
      amount: result.amount,
      currency: result.currency
    });
  } catch (err) {
    console.error("Moyasar payment request failed:", err.message);
    res.status(502).json({ error: "Could not reach the payment gateway. Please try again." });
  }
});

// Catch-all error handler — runs if any route above calls next(err)
// or throws, so the server never crashes silently.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`NOVARA backend running at http://localhost:${PORT}`);
});
