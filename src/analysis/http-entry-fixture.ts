/**
 * Planted HTTP entry points for the TypeScript attack-surface rules
 * (shared/whitebox/analyzer-assets/typescript/semgrep-derivation-rules.yml, wb-entry-http) and the
 * path-traversal rule (semgrep-ruleset.yml, wb-ts-path-traversal).
 *
 * The router is a small typed local stub, so no web framework is added as a dependency. Routes are
 * registered as `app.get("/...", handler)` / `app.post("/...", handler)` and read `req.query`,
 * `req.params` and `req.body`, which is the shape the entry-point rule matches.
 */
import * as fs from "fs";
import * as path from "path";

export interface Request {
  readonly query: Record<string, string>;
  readonly params: Record<string, string>;
  readonly body: Record<string, unknown>;
}

export interface Response {
  status: number;
  payload: unknown;
  json(payload: unknown): void;
}

type Handler = (req: Request, res: Response) => void;

/** Minimal router: records handlers by method and path, and dispatches to them. */
export class Router {
  private readonly routes = new Map<string, Handler>();

  public get(route: string, handler: Handler): void {
    this.routes.set(`GET ${route}`, handler);
  }

  public post(route: string, handler: Handler): void {
    this.routes.set(`POST ${route}`, handler);
  }

  public dispatch(method: string, route: string, req: Request): Response {
    const res: Response = {
      status: 200,
      payload: undefined,
      json(payload: unknown) {
        this.payload = payload;
      },
    };
    const handler = this.routes.get(`${method} ${route}`);
    if (!handler) {
      res.status = 404;
      return res;
    }
    handler(req, res);
    return res;
  }
}

/** Builds the planted app. `reportDir` is where the report download route reads files from. */
export function createApp(reportDir: string): Router {
  const app = new Router();

  // entry point: query string
  app.get("/orders", (req, res) => {
    const limit = Number(req.query.limit ?? "10");
    res.json({ limit, orders: [] });
  });

  // entry point: request body
  app.post("/orders", (req, res) => {
    res.json({ received: Object.keys(req.body).length });
  });

  // entry point + path traversal: a route parameter becomes part of a file path unchecked
  app.get("/reports/:name", (req, res) => {
    const requested = reportDir + "/" + req.params.name;
    res.json({ content: fs.readFileSync(requested, "utf8") });
  });

  // the same download, sanitized: path.basename strips any directory part of the parameter
  app.get("/safe-reports/:name", (req, res) => {
    const safeName = path.basename(String(req.params.name));
    res.json({ content: fs.readFileSync(path.join(reportDir, safeName), "utf8") });
  });

  return app;
}
