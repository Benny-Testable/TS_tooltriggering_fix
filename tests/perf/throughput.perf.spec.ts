import { expect } from "chai";
import { buildCube, pairUp, sumCube, pairCount, chunk } from "../../src/analysis/perf-fixture";
import { classifyOrder } from "../../src/analysis/complexity-sample";

// Performance tests: they exercise the performance-critical fixtures under a time budget,
// so the performance test code coverage row has real performance test code to measure.

describe("performance: throughput budgets", () => {
  it("builds a 40 x 40 x 40 cube within two seconds", () => {
    const started = Date.now();
    const cells = buildCube(40);
    expect(cells.length).to.equal(64000);
    expect(Date.now() - started).to.be.lessThan(2000);
  });

  it("pairs two 300 element lists within two seconds", () => {
    const left = Array.from({ length: 300 }, (_, i) => i);
    const right = Array.from({ length: 300 }, (_, i) => i * 2);
    const started = Date.now();
    expect(pairUp(left, right).length).to.equal(90000);
    expect(Date.now() - started).to.be.lessThan(2000);
  });

  it("classifies 50000 orders within one second", () => {
    const started = Date.now();
    for (let i = 0; i < 50000; i++) {
      classifyOrder("retail", "gold", i % 700, i, i % 2 === 0, "us");
    }
    expect(Date.now() - started).to.be.lessThan(1000);
  });
});

describe("performance: cube sum", () => {
  it("sums a 20 x 20 x 20 cube", () => {
    expect(sumCube(20)).to.equal(228000);
  });
});

describe("performance: pair count", () => {
  it("counts pairs without building them", () => {
    expect(pairCount([1, 2, 3], [4, 5])).to.equal(6);
  });
});

describe("performance: chunking", () => {
  it("splits a list into groups", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).to.deep.equal([[1, 2], [3, 4], [5]]);
  });
});
