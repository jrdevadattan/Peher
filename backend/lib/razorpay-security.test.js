const crypto = require("crypto");
const { describe, expect, test } = require("bun:test");
const {
  checkoutDisplayConfig,
  keyMatchesMode,
  verifyPaymentSignature,
} = require("./razorpay-security");

describe("Razorpay security", () => {
  test("verifies a valid checkout signature", () => {
    const secret = "test_secret";
    const orderId = "order_123";
    const paymentId = "pay_123";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(verifyPaymentSignature(orderId, paymentId, signature, secret)).toBe(true);
  });

  test("rejects a tampered checkout signature", () => {
    expect(
      verifyPaymentSignature("order_123", "pay_123", "invalid_signature", "test_secret"),
    ).toBe(false);
  });

  test("keeps test and live database modes aligned with the API key", () => {
    expect(keyMatchesMode("rzp_test_example", true)).toBe(true);
    expect(keyMatchesMode("rzp_live_example", false)).toBe(true);
    expect(keyMatchesMode("rzp_live_example", true)).toBe(false);
    expect(keyMatchesMode("rzp_test_example", false)).toBe(false);
  });

  test("hides payment methods disabled in the admin panel", () => {
    const config = checkoutDisplayConfig({
      allow_cards: true,
      allow_upi: true,
      allow_netbanking: false,
      allow_wallets: false,
    });

    expect(config.display.hide).toEqual([
      { method: "netbanking" },
      { method: "wallet" },
    ]);
  });
});
