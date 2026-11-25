import { expect } from "chai";
import {
  isOrderLine,
  OrderValidationError,
  validateOrder,
  type OrderRecord,
} from "../src/models/order-record";

function order(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "ORD-1",
    channel: "retail",
    tier: "standard",
    lines: [{ sku: "SKU-A", quantity: 2, unitPrice: 50 }],
    placedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("order record validation", () => {
  it("recognizes structurally valid order lines", () => {
    expect(isOrderLine({ sku: "SKU-A", quantity: 2, unitPrice: 10 })).to.equal(true);
  });

  it("rejects non-object order-line values", () => {
    expect(isOrderLine(null)).to.equal(false);
    expect(isOrderLine(undefined)).to.equal(false);
    expect(isOrderLine("SKU-A")).to.equal(false);
    expect(isOrderLine(2)).to.equal(false);
  });

  it("rejects order lines with an invalid field", () => {
    expect(isOrderLine({ sku: 1, quantity: 2, unitPrice: 10 })).to.equal(false);
    expect(isOrderLine({ sku: "SKU-A", quantity: "2", unitPrice: 10 })).to.equal(false);
    expect(isOrderLine({ sku: "SKU-A", quantity: 2, unitPrice: "10" })).to.equal(false);
  });

  it("rejects an empty order id", () => {
    expect(() => validateOrder(order({ id: "" }))).to.throw(OrderValidationError, /id is required/);
  });

  it("rejects orders without lines", () => {
    expect(() => validateOrder(order({ lines: [] }))).to.throw(
      OrderValidationError,
      /at least one line/,
    );
  });

  it("rejects non-positive quantities and negative prices", () => {
    expect(() =>
      validateOrder(order({ lines: [{ sku: "SKU-A", quantity: 0, unitPrice: 10 }] })),
    ).to.throw(OrderValidationError, /quantity must be positive/);
    expect(() =>
      validateOrder(order({ lines: [{ sku: "SKU-A", quantity: 1, unitPrice: -1 }] })),
    ).to.throw(OrderValidationError, /unitPrice must not be negative/);
  });

  it("rejects non-finite quantities and prices", () => {
    expect(() =>
      validateOrder(order({ lines: [{ sku: "SKU-A", quantity: Number.NaN, unitPrice: 10 }] })),
    ).to.throw(OrderValidationError, /quantity must be finite/);
    expect(() =>
      validateOrder(
        order({
          lines: [{ sku: "SKU-A", quantity: 1, unitPrice: Number.POSITIVE_INFINITY }],
        }),
      ),
    ).to.throw(OrderValidationError, /unitPrice must be finite/);
  });

  it("validates each line in a multi-line order", () => {
    expect(() =>
      validateOrder(
        order({
          lines: [
            { sku: "SKU-A", quantity: 1, unitPrice: 10 },
            { sku: "SKU-B", quantity: 3, unitPrice: 5 },
          ],
        }),
      ),
    ).to.not.throw();
  });
});
