import {
  CHAIN_ADAPTERS,
  CHANNEL_LIMITS,
  normalizeTargets,
  validatePost,
  type SocialPost,
} from "./publish.js";
import { VERSION } from "./version.js";

export interface WorkerEnv {
  PACK_NAME?: string;
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, pack: env.PACK_NAME ?? "agentic-publish", version: VERSION });
    }
    if (request.method === "GET" && url.pathname === "/limits") {
      return json({ limits: CHANNEL_LIMITS, chain: [...CHAIN_ADAPTERS] });
    }
    if (request.method === "POST" && url.pathname === "/preview") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({ error: "body must be JSON" }, 400);
      }
      if (!isRecord(body)) {
        return json({ error: "body must be an object" }, 400);
      }
      try {
        const post = body as unknown as SocialPost;
        validatePost(post);
        return json({
          dryRun: true,
          targets: normalizeTargets(post.targets),
          adapters: [...CHAIN_ADAPTERS],
        });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : String(error) }, 400);
      }
    }
    return json({ error: "not found" }, 404);
  },
};
