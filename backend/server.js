require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");
const paymentRouter = require("./routes/payment");
const authRouter = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/auth", authRouter);

app.get("/", (req, res) => res.send("PEHER API running"));

const PORT = process.env.PORT || 5000;

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err.message));
} else {
  console.warn("MONGODB_URI not configured. Server starting without database connection.");
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


