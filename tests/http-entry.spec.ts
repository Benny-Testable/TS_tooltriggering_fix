import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createApp } from "../packages/domain/src/analysis/http-entry-fixture";

describe("http entry fixture", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "http-entry-"));
  fs.writeFileSync(path.join(dir, "summary.txt"), "ok");
  const app = createApp(dir);

  it("serves the order list with the requested limit", () => {
    const res = app.dispatch("GET", "/orders", { query: { limit: "5" }, params: {}, body: {} });
    expect(res.status).to.equal(200);
    expect(res.payload).to.deep.equal({ limit: 5, orders: [] });
  });

  it("defaults the limit when the query has none", () => {
    const res = app.dispatch("GET", "/orders", { query: {}, params: {}, body: {} });
    expect(res.payload).to.deep.equal({ limit: 10, orders: [] });
  });

  it("counts the fields of a posted order", () => {
    const res = app.dispatch("POST", "/orders", { query: {}, params: {}, body: { id: "A", qty: 2 } });
    expect(res.payload).to.deep.equal({ received: 2 });
  });

  it("reads a report by name, unchecked and sanitized", () => {
    const req = { query: {}, params: { name: "summary.txt" }, body: {} };
    expect(app.dispatch("GET", "/reports/:name", req).payload).to.deep.equal({ content: "ok" });
    expect(app.dispatch("GET", "/safe-reports/:name", req).payload).to.deep.equal({ content: "ok" });
  });

  it("answers 404 for an unknown route", () => {
    expect(app.dispatch("GET", "/missing", { query: {}, params: {}, body: {} }).status).to.equal(404);
  });
});
