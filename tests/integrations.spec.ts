import { expect } from "chai";
import { describeExportStack, parseOptions, snapshot } from "../src/platform/integrations";
import type { OrderRecord } from "../src/models/order-record";

describe("platform integrations", () => {
  it("uses documented defaults for CLI options", () => {
    expect(parseOptions([])).to.deep.equal({
      channel: "retail",
      limit: 25,
      verbose: false,
    });
  });

  it("parses supplied CLI options", () => {
    expect(parseOptions(["--channel", "wholesale", "--limit", "8", "--verbose"])).to.deep.equal({
      channel: "wholesale",
      limit: 8,
      verbose: true,
    });
  });

  it("returns an independent deep snapshot of orders", () => {
    const source: OrderRecord[] = [
      {
        id: "ORD-1",
        channel: "retail",
        tier: "standard",
        lines: [{ sku: "SKU-A", quantity: 1, unitPrice: 10 }],
        placedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const copy = snapshot(source);

    expect(copy).to.not.equal(source);
    expect(copy[0]).to.not.equal(source[0]);
    expect(copy[0].lines).to.not.equal(source[0].lines);
    expect(copy[0].lines[0]).to.not.equal(source[0].lines[0]);
    expect(copy).to.deep.equal(source);
  });

  it("loads the export stack dependencies", async () => {
    expect(await describeExportStack()).to.deep.equal({
      axios: "loaded",
      nodeFetch: "loaded",
      tar: "loaded",
    });
  });
});
