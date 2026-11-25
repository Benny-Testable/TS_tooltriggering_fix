/**
 * Planted performance anti-patterns for the semgrep-perf-static rules
 * (shared/whitebox/analyzer-assets/shared/semgrep-perf-static.yaml). One function per category:
 * n_plus_one, nested_loop, alloc_in_loop, concurrency. The functions are real code and are run
 * by tests/analysis-extra.spec.ts and tests/perf/throughput.perf.spec.ts.
 *
 * The classic loops declare their counter BEFORE the loop (`let x: number; for (x = 0; ...)`).
 * The rules match `for ($A = $B; $C; $D)`, an assignment in the loop header; a declaration in the
 * header (`for (let x = 0; ...)`) does not match it, so those loops produced no Big-O or memory
 * allocation hits. Checked with semgrep 1.173 against the rule pack.
 */

/** nested_loop (testable.perf.ts-triple-for): three nested classic for statements */
export function buildCube(size: number): number[] {
  const cells: number[] = [];
  let x: number;
  let y: number;
  let z: number;
  for (x = 0; x < size; x++) {
    for (y = 0; y < size; y++) {
      for (z = 0; z < size; z++) {
        cells[x * size * size + y * size + z] = x + y + z;
      }
    }
  }
  return cells;
}

/** alloc_in_loop (testable.perf.ts-push-nested-loop): array push inside two nested classic for loops */
export function pairUp(left: number[], right: number[]): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  let i: number;
  let j: number;
  for (i = 0; i < left.length; i++) {
    for (j = 0; j < right.length; j++) {
      pairs.push([left[i] as number, right[j] as number]);
    }
  }
  return pairs;
}

/** n_plus_one (testable.perf.ts-fetch-in-for-await): one network call per element, for...of */
export async function loadPrices(skus: string[]): Promise<string[]> {
  const bodies: string[] = [];
  for (const sku of skus) {
    const response = await fetch("https://pricing.internal.example/api/price/" + sku);
    bodies.push(await response.text());
  }
  return bodies;
}

/** n_plus_one: classic for loop variant */
export async function loadStock(skus: string[]): Promise<number> {
  let total = 0;
  let i: number;
  for (i = 0; i < skus.length; i++) {
    const response = await fetch("https://stock.internal.example/api/stock/" + skus[i]);
    total += Number(await response.text());
  }
  return total;
}

/** concurrency (testable.perf.ts-shared-mutation-async): shared array and object mutated inside Promise.all */
export async function collectTotals(items: number[]): Promise<{ list: number[]; sum: number }> {
  const list: number[] = [];
  const shared = { sum: 0 };
  await Promise.all(
    items.map(async (item) => {
      await Promise.resolve();
      list.push(item * 2);
      shared.sum = shared.sum + item;
    }),
  );
  return { list, sum: shared.sum };
}

/** sums the cells of a cube built by buildCube */
export function sumCube(size: number): number {
  return buildCube(size).reduce((total, cell) => total + cell, 0);
}

/** how many pairs pairUp would build */
export function pairCount(left: number[], right: number[]): number {
  return left.length * right.length;
}

/** batches the lookups of loadPrices into groups to cut round trips */
export function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

