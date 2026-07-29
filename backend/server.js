require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const ordersRouter = require("./routes/orders");
const paymentRouter = require("./routes/payment");
const catalogRouter = require("./routes/catalog");
const couponsRouter = require("./routes/coupons");
const adminRouter = require("./routes/admin");

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin(origin, callback) {
      const allowed = (process.env.CLIENT_ORIGIN || "http://localhost:8080,http://localhost:8081")
        .split(",")
        .map((value) => value.trim());
      if (!origin || allowed.includes(origin)) return callback(null, true);
      callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "100kb" }));

app.use("/api/orders", ordersRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/admin", adminRouter);

app.get("/", (_req, res) => res.send("PEHER API running"));

app.use((error, _req, res, _next) => {
  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Images must be smaller than 10 MB." });
  }
  if (error?.name === "MulterError") {
    return res.status(400).json({ error: "The uploaded file could not be processed." });
  }
  res.status(400).json({ error: "Request could not be processed." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
