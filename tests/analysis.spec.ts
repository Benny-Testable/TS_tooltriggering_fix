import { expect } from "chai";
import { classifyOrder, auditTrail, isBulkTier, tierDiscount } from "../src/analysis/complexity-sample";
import { intakeOrder, reconcile } from "../src/analysis/call-graph-sample";
import {
  settleLegacyInvoice,
  unreachableAfterReturn,
  LEGACY_TAX_TABLE,
} from "../src/analysis/dead-code";
import {
  looseCompare,
  swallowsEverything,
  shadowing,
  untyped,
  classify,
} from "../src/analysis/lint-violations";
import { matchSku, lookupRate, checkSecret } from "../src/analysis/sast-fixture";

// These specs run the planted analysis fixtures with real inputs, so every tool that
// measures execution (path, branch, condition, data-flow, mutation) has a trace to read.
// Only the pure functions are called. The fixture functions that run a shell command,
// evaluate code or touch the file system are deliberately left alone.

describe("analysis fixtures: classifyOrder branches", () => {
  const cases: Array<[Parameters<typeof classifyOrder>, string]> = [
    [["retail", "gold", 200, 20000, true, "us"], "retail-gold-bulk-priority"],
    [["retail", "gold", 200, 20000, false, "us"], "retail-gold-bulk"],
    [["retail", "gold", 200, 2000, false, "emea"], "retail-gold-mid-emea"],
    [["retail", "gold", 200, 2000, false, "us"], "retail-gold-mid"],
    [["retail", "gold", 200, 100, false, "us"], "retail-gold-small"],
    [["retail", "gold", 50, 900, true, "us"], "retail-gold-priority"],
    [["retail", "gold", 50, 900, false, "us"], "retail-gold"],
    [["retail", "gold", 5, 100, false, "us"], "retail-gold-minimal"],
    [["retail", "silver", 200, 6000, false, "us"], "retail-silver-bulk"],
    [["retail", "silver", 200, 4000, false, "us"], "retail-silver-mid"],
    [["retail", "silver", 50, 100, false, "apac"], "retail-silver-apac"],
    [["retail", "silver", 50, 100, false, "us"], "retail-silver"],
    [["retail", "silver", 5, 100, false, "us"], "retail-silver-minimal"],
    [["retail", "bronze", 80, 100, false, "us"], "retail-standard-bulk"],
    [["retail", "bronze", 20, 100, false, "us"], "retail-standard"],
    [["wholesale", "gold", 600, 60000, true, "us"], "wholesale-mega-priority"],
    [["wholesale", "gold", 600, 60000, false, "us"], "wholesale-mega"],
    [["wholesale", "gold", 600, 100, false, "us"], "wholesale-bulk"],
    [["wholesale", "gold", 200, 100, false, "us"], "wholesale-gold"],
    [["wholesale", "silver", 200, 100, false, "us"], "wholesale-mid"],
    [["wholesale", "silver", 20, 100, false, "us"], "wholesale-small"],
    [["partner", "gold", 200, 100, false, "emea"], "partner-intl-bulk"],
    [["partner", "gold", 20, 100, false, "apac"], "partner-intl"],
    [["partner", "gold", 200, 100, false, "us"], "partner-dom-bulk"],
    [["partner", "gold", 20, 100, false, "us"], "partner-dom"],
  ];

  for (const [args, bucket] of cases) {
    it(`classifies ${args.join(" / ")} as ${bucket}`, () => {
      expect(classifyOrder(...args)).to.equal(bucket);
    });
  }

  it("keeps the thresholds exclusive at the boundaries", () => {
    expect(classifyOrder("retail", "gold", 100, 100, false, "us")).to.equal("retail-gold");
    expect(classifyOrder("retail", "gold", 10, 100, false, "us")).to.equal("retail-gold-minimal");
    expect(classifyOrder("wholesale", "gold", 500, 100, false, "us")).to.equal("wholesale-gold");
    expect(classifyOrder("wholesale", "gold", 100, 100, false, "us")).to.equal("wholesale-small");
  });
});

describe("analysis fixtures: audit trail and call graph", () => {
  it("builds a five entry audit trail", () => {
    expect(auditTrail({ id: "A1", tier: "gold" })).to.deep.equal([
      "id:A1",
      "tier:gold",
      "sum:2064",
      "ts:1970-01-01T00:00:00.000Z",
      "region:emea",
    ]);
  });

  it("walks the five level call chain", () => {
    expect(intakeOrder("  ab ")).to.equal("AB:2211");
  });

  it("reconciles an amount through six collaborators", () => {
    expect(reconcile(100)).to.deep.equal({
      net: 100,
      fee: 1.9,
      levy: 0.4,
      rebate: 0.25,
      rounding: 0,
      reference: "REC-54993",
    });
    expect(reconcile(250.5)).to.deep.equal({
      net: 250.5,
      fee: 4.76,
      levy: 1,
      rebate: 0.63,
      rounding: 0.5,
      reference: "REC-57940",
    });
  });
});

describe("analysis fixtures: dead code and lint fixtures", () => {
  it("settles a legacy invoice per channel", () => {
    expect(settleLegacyInvoice(100, "retail")).to.equal(107);
    expect(settleLegacyInvoice(100, "wholesale")).to.equal(105);
    expect(LEGACY_TAX_TABLE["legacy-retail"]).to.equal(0.07);
  });

  it("returns the value for a positive input and zero otherwise", () => {
    expect(unreachableAfterReturn(5)).to.equal(5);
    expect(unreachableAfterReturn(0)).to.equal(0);
    expect(unreachableAfterReturn(-3)).to.equal(0);
  });

  it("compares loosely", () => {
    expect(looseCompare(1, "1")).to.equal(true);
    expect(looseCompare(1, 2)).to.equal(false);
  });

  it("swallows a parse error without throwing", () => {
    expect(() => swallowsEverything()).to.not.throw();
  });

  it("returns the shadowed value", () => {
    expect(shadowing(4)).to.equal(8);
  });

  it("passes a payload through untouched", () => {
    const payload = { a: 1 };
    expect(untyped(payload)).to.equal(payload);
  });

  it("falls through from case one to case two", () => {
    expect(classify(1)).to.equal("one-or-two");
    expect(classify(2)).to.equal("one-or-two");
    expect(classify(9)).to.equal("other");
  });
});

describe("analysis fixtures: pure helpers of the SAST fixture", () => {
  it("matches a SKU pattern", () => {
    expect(matchSku("^SKU-[0-9]+$", "SKU-42")).to.equal(true);
    expect(matchSku("^SKU-[0-9]+$", "ABC-42")).to.equal(false);
  });

  it("looks up a rate and returns undefined for a missing key", () => {
    expect(lookupRate({ gold: 0.15 }, "gold")).to.equal(0.15);
    expect(lookupRate({ gold: 0.15 }, "none")).to.equal(undefined);
  });

  it("compares secrets by equality", () => {
    expect(checkSecret("a", "a")).to.equal(true);
    expect(checkSecret("a", "b")).to.equal(false);
  });
});

describe("analysis fixtures: bulk tier", () => {
  it("treats gold and silver as bulk tiers", () => {
    expect(isBulkTier("gold")).to.equal(true);
    expect(isBulkTier("silver")).to.equal(true);
    expect(isBulkTier("bronze")).to.equal(false);
  });
});

describe("analysis fixtures: tier discount", () => {
  it("returns the discount per tier", () => {
    expect(tierDiscount("gold")).to.equal(0.15);
    expect(tierDiscount("silver")).to.equal(0.1);
    expect(tierDiscount("bronze")).to.equal(0);
  });
});
