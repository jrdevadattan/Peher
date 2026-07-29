const { describe, expect, test } = require("bun:test");
const { calculateCheckoutTotal, calculateShippingCost } = require("./pricing-rules");

describe("checkout pricing rules", () => {
  test("charges Rs 99 below the free-delivery threshold", () => {
    expect(
      calculateShippingCost(1499, {
        enabled: true,
        rate: 99,
        freeThreshold: 1500,
      }),
    ).toBe(99);
  });

  test("delivery is free at Rs 1,500 and above", () => {
    const shipping = {
      enabled: true,
      rate: 99,
      freeThreshold: 1500,
    };

    expect(calculateShippingCost(1500, shipping)).toBe(0);
    expect(calculateShippingCost(2500, shipping)).toBe(0);
  });

  test("does not charge delivery when shipping charges are disabled", () => {
    expect(
      calculateShippingCost(500, {
        enabled: false,
        rate: 99,
        freeThreshold: 1500,
      }),
    ).toBe(0);
  });

  test("never adds tax to the payable total", () => {
    expect(
      calculateCheckoutTotal({
        subtotal: 1000,
        shippingCost: 99,
        discountAmount: 100,
        shippingDiscount: 0,
        taxAmount: 46.6,
      }),
    ).toBe(999);
  });
});
