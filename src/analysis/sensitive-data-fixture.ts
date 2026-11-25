/**
 * Planted sensitive-data flows for the platform's TypeScript rules:
 *  - semgrep-pii-logging (pii-log-ts-js-contact-auth-student): PII-named values passed to console/logger calls
 *  - semgrep-derivation-rules (sensitive_source, taint_leak, sensitive_operation, unprotected_operation)
 *  - semgrep-ruleset (wb-ts-sql-concatenation, wb-ts-tls-verification-off, wb-ts-weak-hash, wb-ts-weak-random,
 *    wb-ts-spawn-shell, wb-ts-innerhtml, wb-ts-timing-comparison)
 * All values are made up. Nothing here is called by the application.
 */
import * as fs from "fs";
import { createHash } from "crypto";
import { spawn } from "child_process";

export interface CustomerRecord {
  id: string;
  email: string;
  ssn: string;
  cardNumber: string;
  password: string;
  passphrase: string;
  apiToken: string;
}

export interface StudentRecord {
  student_id: string;
  dob: string;
  tax_id: string;
}

const logger = {
  info: (..._args: unknown[]): void => undefined,
  warn: (..._args: unknown[]): void => undefined,
};

/** PII in log statements: console and logger sinks with PII-named arguments */
export function logCustomer(customer: CustomerRecord): void {
  console.log("customer email", customer.email);
  console.info("customer ssn", customer.ssn);
  console.warn("login password", customer.password);
  console.debug("card on file", customer.cardNumber);
  logger.info("api token", customer.apiToken);
  logger.warn("passphrase", customer.passphrase);
}

export function logStudent(student: StudentRecord): void {
  console.error("student", student.student_id);
  console.log("born", student.dob);
  logger.info("tax", student.tax_id);
}

/** sensitive source reaching an unprotected output (taint_leak) */
export function exportCustomer(customer: CustomerRecord, target: string): void {
  console.log(customer.email);
  process.stdout.write(customer.ssn);
  fs.writeFileSync(target, customer.cardNumber);
  fs.appendFileSync(target, customer.password);
}

/** sensitive environment variables reaching an output */
export function dumpEnvironment(): void {
  console.log(process.env.DATABASE_PASSWORD);
  process.stderr.write(String(process.env.SERVICE_API_TOKEN));
  fs.writeFileSync("env-dump.txt", String(process.env.SIGNING_SECRET_KEY));
}

/** the same flows, sanitized: the platform's sanitizers are maskPii() and createHash().update().digest() */
export function maskPii(value: string): string {
  return value.replace(/.(?=.{2})/g, "*");
}

export function exportCustomerSafely(customer: CustomerRecord): void {
  console.log(maskPii(customer.email));
  console.log(createHash("sha256").update(customer.ssn).digest("hex"));
}

/** sensitive operation with and without an authorize() call in the same function */
export function authorize(role: string): void {
  if (role !== "admin") {
    throw new Error("forbidden");
  }
}

export function purgeExport(target: string): void {
  fs.rmSync(target, { force: true });
}

export function purgeExportAuthorized(role: string, target: string): void {
  authorize(role);
  fs.rmSync(target, { force: true });
}

/** wb-ts-sql-concatenation */
export function findOrders(db: { query: (sql: string) => unknown }, customerId: string): unknown {
  return db.query("SELECT * FROM orders WHERE customer_id = '" + customerId + "'");
}

export function findOrdersTemplate(db: { execute: (sql: string) => unknown }, status: string): unknown {
  return db.execute(`SELECT * FROM orders WHERE status = '${status}'`);
}

/** wb-ts-tls-verification-off */
export const insecureAgentOptions = { rejectUnauthorized: false, keepAlive: true };

/** wb-ts-weak-hash and wb-ts-weak-random */
export function legacyDigest(value: string): string {
  return createHash("md5").update(value).digest("hex");
}

export function legacyDigestSha1(value: string): string {
  return createHash("sha1").update(value).digest("hex");
}

export function guessableToken(): string {
  return String(Math.random()).slice(2);
}

/** wb-ts-spawn-shell */
export function runShellCommand(command: string): void {
  spawn(command, [], { shell: true });
}

/** wb-ts-innerhtml */
export function renderBanner(element: { innerHTML: string }, banner: string): void {
  element.innerHTML = banner;
}

/** wb-ts-timing-comparison */
export function sameToken(providedToken: string, expectedToken: string): boolean {
  return providedToken === expectedToken;
}
