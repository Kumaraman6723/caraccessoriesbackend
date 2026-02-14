const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const mailSender = require("./utils/mailSender");
const { uploadToCloudinary, uploadMultipleToCloudinary } = require("./utils/cloudinary");
const { OAuth2Client } = require("google-auth-library");
const multer = require("multer");

const { contactFormSubmissionEmail } = require("./templates/contactFormSubmission");
const { enquiryToAdminEmail } = require("./templates/enquiryToAdmin");
const { enquiryAutoReplyEmail } = require("./templates/enquiryAutoReply");

const app = express();

// Admin whitelist – set ADMIN_EMAILS and ADMIN_GMAIL in .env (comma-separated emails)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_GMAIL = process.env.ADMIN_GMAIL || "";
const BANTY_CONTACT_PHONE = process.env.BANTY_CONTACT_PHONE || "";

// On Vercel, filesystem is read-only except /tmp; use /tmp for writes
const IS_VERCEL = !!process.env.VERCEL;
const PRODUCTS_PATH = IS_VERCEL
  ? path.join("/tmp", "data", "products.json")
  : path.join(__dirname, "data", "products.json");

// Multer for product images (save to tmp, then upload to Cloudinary)
const TMP_DIR = IS_VERCEL ? path.join("/tmp", "uploads") : path.join(__dirname, "tmp");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
    cb(null, TMP_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `product-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname) || ".jpg"}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/i.test(path.extname(file.originalname) || file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

const CORS_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://caraccessories-gray.vercel.app",
  "https://www.caraccessories-gray.vercel.app",
  ...(process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
];
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Token"],
  })
);
app.use(express.json());

// ============ Helpers ============
function loadProducts() {
  try {
    // On Vercel: copy from read-only deployed file to /tmp on first load if needed
    if (IS_VERCEL) {
      const dir = path.dirname(PRODUCTS_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(PRODUCTS_PATH)) {
        const src = path.join(__dirname, "data", "products.json");
        if (fs.existsSync(src)) fs.copyFileSync(src, PRODUCTS_PATH);
        else fs.writeFileSync(PRODUCTS_PATH, "[]", "utf8");
      }
    }
    const raw = fs.readFileSync(PRODUCTS_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveProducts(products) {
  if (IS_VERCEL) {
    const dir = path.dirname(PRODUCTS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), "utf8");
}

async function verifyGoogleToken(idToken) {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  return payload;
}

function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(String(email).trim().toLowerCase());
}

// ============ Routes ============

app.get("/api", (req, res) => {
  res.json({ status: "OK", message: "Banty Car Accessories API", docs: "Use /api/health, /api/products, etc." });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Banty Car Accessories API", timestamp: new Date().toISOString() });
});

// Google login: verify id_token and detect admin vs customer
app.post("/api/auth/admin", async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(400).json({ success: false, message: "id_token is required" });
    }
    const payload = await verifyGoogleToken(id_token);
    const email = payload.email;
    const isAdmin = isAdminEmail(email);
    res.json({
      success: true,
      message: "User verified",
      user: {
        email,
        name: payload.name,
        isAdmin,
      },
    });
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please sign in again.",
    });
  }
});

// Get all products (public)
app.get("/api/products", (req, res) => {
  const products = loadProducts();
  res.json({ success: true, products });
});

// Create product (admin only - verify via body.adminToken from frontend after Google sign-in)
app.post("/api/products", upload.array("images", 10), async (req, res) => {
  try {
    const { adminToken, name, price, category, tagline } = req.body;
    if (!adminToken) {
      return res.status(401).json({ success: false, message: "Admin token required" });
    }
    let payload;
    try {
      payload = await verifyGoogleToken(adminToken);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid admin token" });
    }
    if (!isAdminEmail(payload.email)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!name || !price) {
      return res.status(400).json({ success: false, message: "name and price are required" });
    }

    const productId = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      const paths = req.files.map((f) => f.path);
      const results = await uploadMultipleToCloudinary(paths);
      imageUrls = results.map((r) => r.secure_url);
      req.files.forEach((f) => {
        try {
          fs.unlinkSync(f.path);
        } catch (e) {
          console.warn("Could not delete tmp file:", f.path);
        }
      });
    }

    const product = {
      id: productId,
      name: String(name).trim(),
      price: Number(price) || 0,
      category: String(category || "General").trim(),
      tagline: String(tagline || "").trim(),
      images: imageUrls,
      createdAt: new Date().toISOString(),
    };

    const products = loadProducts();
    products.unshift(product);
    saveProducts(products);

    res.json({ success: true, product });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ success: false, message: "Failed to create product" });
  }
});

// Update product (admin only)
app.put("/api/products/:id", upload.array("images", 10), async (req, res) => {
  try {
    const { adminToken, name, price, category, tagline, existingImages } = req.body;
    if (!adminToken) {
      return res.status(401).json({ success: false, message: "Admin token required" });
    }
    let payload;
    try {
      payload = await verifyGoogleToken(adminToken);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid admin token" });
    }
    if (!isAdminEmail(payload.email)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!name || !price) {
      return res.status(400).json({ success: false, message: "name and price are required" });
    }

    const products = loadProducts();
    const idx = products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let keptUrls = [];
    try {
      const parsed = JSON.parse(existingImages || "[]");
      keptUrls = Array.isArray(parsed) ? parsed : [];
    } catch {
      keptUrls = [];
    }

    let newUrls = [];
    if (req.files && req.files.length > 0) {
      const paths = req.files.map((f) => f.path);
      const results = await uploadMultipleToCloudinary(paths);
      newUrls = results.map((r) => r.secure_url);
      req.files.forEach((f) => {
        try {
          fs.unlinkSync(f.path);
        } catch (e) {
          console.warn("Could not delete tmp file:", f.path);
        }
      });
    }

    const imageUrls = [...keptUrls, ...newUrls];
    if (imageUrls.length === 0) {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    const updated = {
      ...products[idx],
      name: String(name).trim(),
      price: Number(price) || 0,
      category: String(category || "General").trim(),
      tagline: String(tagline || "").trim(),
      images: imageUrls,
    };

    products[idx] = updated;
    saveProducts(products);
    res.json({ success: true, product: updated });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
});

// Delete product (admin only)
app.delete("/api/products/:id", async (req, res) => {
  try {
    const adminToken = req.headers["x-admin-token"] || req.body?.adminToken;
    if (!adminToken) {
      return res.status(401).json({ success: false, message: "Admin token required" });
    }
    let payload;
    try {
      payload = await verifyGoogleToken(adminToken);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid admin token" });
    }
    if (!isAdminEmail(payload.email)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const products = loadProducts();
    const filtered = products.filter((p) => p.id !== req.params.id);
    if (filtered.length === products.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    saveProducts(filtered);
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
});

// Enquiry: send to admin + auto-reply to customer
app.post("/api/enquiry", async (req, res) => {
  try {
    const { name, email, address, phone, productId, productName } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const adminHtml = enquiryToAdminEmail(name, email, address || "Not provided", phone, productName || "General enquiry", productId);

    await mailSender(
      ADMIN_GMAIL,
      `[Banty] New enquiry from ${name} - ${productName || "General"}`,
      adminHtml
    );

    const customerHtml = enquiryAutoReplyEmail(name, BANTY_CONTACT_PHONE);
    await mailSender(email, "We received your enquiry - Banty Car Accessories", customerHtml);

    res.json({
      success: true,
      message: "Enquiry sent. We will contact you shortly.",
    });
  } catch (error) {
    console.error("Enquiry error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send enquiry. Please try again.",
    });
  }
});

// Legacy contact form (if still used)
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, company, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required fields",
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }
    const emailHTML = contactFormSubmissionEmail(name, email, company, message);
    await mailSender(ADMIN_GMAIL, `New Contact from ${name}`, emailHTML);
    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
    });
  } catch (error) {
    console.error("Contact error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later.",
    });
  }
});

app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Export for Vercel serverless; listen for local development
module.exports = app;
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Banty Car Accessories API running on port ${PORT}`);
  });
}
