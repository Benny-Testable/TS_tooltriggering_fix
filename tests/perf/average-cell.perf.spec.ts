import { expect } from "chai";
import { averageCell } from "../../packages/domain/src/analysis/perf-fixture";

describe("averageCell", () => {
  it("divides the cube sum by the number of cells", () => {
    // a 2x2x2 cube: cells x+y+z sum to 12 over 8 cells
    expect(averageCell(2)).to.equal(1.5);
  });

  it("is zero for an empty cube", () => {
    expect(averageCell(0)).to.equal(0);
  });
});
