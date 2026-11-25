/**
 * Planted SAST fixture for eslint-plugin-security 2.1.1.
 * Each function below trips one named rule. The file-level eslint-disable that used to
 * sit above this comment is removed: the Testable ts-eslint-security run does not
 * pass --no-inline-config, so it would hide every finding. The repository's own
 * lint run skips this file (eslint.config.mjs ignores).
 */
import { execSync } from "child_process";
import * as fs from "fs";
import * as crypto from "crypto";

/** security/detect-child-process */
export function runReport(reportName: string): string {
  return execSync("generate-report --name " + reportName).toString();
}

/** security/detect-non-literal-fs-filename */
export function readManifest(pathFromCaller: string): string {
  return fs.readFileSync(pathFromCaller, "utf8");
}

/** security/detect-non-literal-regexp */
export function matchSku(pattern: string, sku: string): boolean {
  const re = new RegExp(pattern);
  return re.test(sku);
}

/** security/detect-eval-with-expression */
export function evaluateRule(expression: string): unknown {
  return eval(expression);
}

/** security/detect-object-injection */
export function lookupRate(table: Record<string, number>, key: string): number {
  return table[key];
}

/** security/detect-pseudoRandomBytes */
export function weakToken(): string {
  return crypto.pseudoRandomBytes(16).toString("hex");
}

/** security/detect-unsafe-regex -- catastrophic backtracking */
export function validateCode(code: string): boolean {
  return /^(a+)+$/.test(code);
}

/** security/detect-new-buffer */
export function legacyBuffer(input: string): Buffer {
  return new Buffer(input);
}

/** security/detect-possible-timing-attacks */
export function checkSecret(provided: string, expected: string): boolean {
  return provided === expected;
}
