import { expect } from "chai";
import { buildCube, pairUp, collectTotals } from "../src/analysis/perf-fixture";
import {
  maskPii,
  authorize,
  purgeExportAuthorized,
  legacyDigest,
  sameToken,
  renderBanner,
  insecureAgentOptions,
} from "../src/analysis/sensitive-data-fixture";
import { describeCycleA } from "../src/analysis/cycle-a";
import { cycleBName } from "../src/analysis/cycle-b";
import { databasePassword, legacyConfig } from "../src/analysis/secrets-fixture";

// Runs only the pure functions of the planted fixtures (perf, sensitive data, cycles, secrets).
// The functions that call the network, the shell or the file system are not executed.

describe("analysis fixtures: performance patterns", () => {
  it("fills a cube of cells", () => {
    expect(buildCube(2)).to.deep.equal([0, 1, 1, 2, 1, 2, 2, 3]);
  });

  it("pairs every left value with every right value", () => {
    expect(pairUp([1, 2], [3, 4])).to.deep.equal([
      [1, 3],
      [1, 4],
      [2, 3],
      [2, 4],
    ]);
  });

  it("collects doubled values and their sum from parallel callbacks", async () => {
    const result = await collectTotals([1, 2, 3]);
    expect(result.sum).to.equal(6);
    expect(result.list.sort((a, b) => a - b)).to.deep.equal([2, 4, 6]);
  });
});

describe("analysis fixtures: sensitive data helpers", () => {
  it("masks all but the last two characters", () => {
    expect(maskPii("abcdef")).to.equal("****ef");
  });

  it("allows an admin and rejects any other role", () => {
    expect(() => authorize("admin")).to.not.throw();
    expect(() => authorize("guest")).to.throw("forbidden");
    expect(() => purgeExportAuthorized("guest", "none.txt")).to.throw("forbidden");
  });

  it("hashes with md5", () => {
    expect(legacyDigest("a")).to.equal("0cc175b9c0f1b6a831c399e269772661");
  });

  it("compares two tokens", () => {
    expect(sameToken("x", "x")).to.equal(true);
    expect(sameToken("x", "y")).to.equal(false);
  });

  it("writes a banner into an element", () => {
    const element = { innerHTML: "" };
    renderBanner(element, "hello");
    expect(element.innerHTML).to.equal("hello");
    expect(insecureAgentOptions.keepAlive).to.equal(true);
  });
});

describe("analysis fixtures: cycle and secret constants", () => {
  it("walks the two-module cycle", () => {
    expect(describeCycleA()).to.equal("cycle-a>cycle-b<cycle-a");
    expect(cycleBName()).to.equal("cycle-b<cycle-a");
  });

  it("exposes the fake credentials", () => {
    expect(databasePassword.length).to.be.greaterThan(10);
    expect(legacyConfig.password.length).to.be.greaterThan(10);
  });
});
