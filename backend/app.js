const path = require("path");

function loadDotenv(options) {
  try {
    require("dotenv").config(options);
  } catch (error) {
    if (error?.code !== "MODULE_NOT_FOUND") throw error;
  }
}

loadDotenv();
const appDirectory = typeof __dirname === "string" ? __dirname : process.cwd();
loadDotenv({ path: path.join(appDirectory, ".env"), override: false });
loadDotenv({ path: path.join(process.cwd(), "backend", ".env"), override: false });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const ordersRouter = require("./routes/orders");
const paymentRouter = require("./routes/payment");
const catalogRouter = require("./routes/catalog");
const couponsRouter = require("./routes/coupons");
const adminRouter = require("./routes/admin");
const authRouter = require("./routes/auth");

const app = express();
const defaultOrigins = [
  "https://peher.studio",
  "https://www.peher.studio",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const configuredOrigins = [
  ...defaultOrigins,
  ...(process.env.CLIENT_ORIGIN || "").split(","),
]
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => {
    try {
      return new URL(value).origin;
    } catch {
      throw new Error(`CLIENT_ORIGIN contains an invalid origin: ${value}`);
    }
  });
const allowedOrigins = new Set(configuredOrigins);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "100kb" }));

app.post("/api/create-order", ...paymentRouter.createOrderMiddlewares);
app.post("/api/verify-payment", ...paymentRouter.verifyPaymentMiddlewares);
app.use("/api/orders", ordersRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

app.get("/", (_req, res) => res.send("PEHER API running"));
app.get("/api", (_req, res) => res.json({ ok: true, service: "PEHER API" }));

app.use((error, _req, res, _next) => {
  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Images must be smaller than 10 MB." });
  }
  if (error?.name === "MulterError") {
    return res.status(400).json({ error: "The uploaded file could not be processed." });
  }
  res.status(400).json({ error: error?.message || "Request could not be processed." });
});

module.exports = app;
