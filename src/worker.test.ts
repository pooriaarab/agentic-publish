import { describe, expect, test } from "vitest";
import worker from "./worker.js";

describe("worker", () => {
  test("GET /health reports ok", async () => {
    const response = await worker.fetch(new Request("https://pack.test/health"), {
      PACK_NAME: "probe",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, pack: "probe" });
  });

  test("GET /limits reports channels and the chain", async () => {
    const response = await worker.fetch(new Request("https://pack.test/limits"), {});
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      limits: { x: { maxChars: 280 } },
      chain: ["private-repo-c4e6", "zernio", "ayrshare", "postiz"],
    });
  });

  test("POST /preview shapes a dry run", async () => {
    const response = await worker.fetch(
      new Request("https://pack.test/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hi", targets: ["x", "linkedin"] }),
      }),
      {},
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ dryRun: true, targets: ["x", "linkedin"] });
  });

  test("POST /preview rejects a bad post", async () => {
    const response = await worker.fetch(
      new Request("https://pack.test/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "" }),
      }),
      {},
    );
    expect(response.status).toBe(400);
  });

  test("unknown routes 404", async () => {
    const response = await worker.fetch(new Request("https://pack.test/nope"), {});
    expect(response.status).toBe(404);
  });
});
