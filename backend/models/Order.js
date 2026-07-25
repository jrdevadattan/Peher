const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  image: String,
  material: String,
  size: String,
  qty: Number,
}, { _id: false });

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  items: { type: [orderItemSchema], required: true },
  address: { type: addressSchema, required: true },
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { type: String, default: "pending" }, // pending, confirmed, paid, shipped, delivered, cancelled
  paymentStatus: { type: String, default: "unpaid" }, // unpaid, paid
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
