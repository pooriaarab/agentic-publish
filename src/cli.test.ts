import { describe, expect, test } from "vitest";
import { parseArgs, runCli, UsageError, type CliIo } from "./cli.js";
import { VendorError } from "./core.js";
import {
  AllowAllApprovalHook,
  MemoryQueueStore,
  type PublishReceipt,
  type SocialPost,
} from "./publish.js";

function testIo(overrides: Partial<CliIo> = {}): CliIo & { outLines: string[]; errLines: string[] } {
  const outLines: string[] = [];
  const errLines: string[] = [];
  return {
    outLines,
    errLines,
    out: (line) => outLines.push(line),
    err: (line) => errLines.push(line),
    readFile: (path) => `file:${path}`,
    adapters: [
      {
        name: "private-repo-c4e6",
        publish: async (post: SocialPost): Promise<PublishReceipt> => ({
          adapter: "private-repo-c4e6",
          id: "cr_1",
          targets: post.targets,
          at: "now",
        }),
      },
      {
        name: "zernio",
        publish: async (): Promise<PublishReceipt> => {
          throw new VendorError("zernio: down");
        },
      },
    ],
    queueStore: new MemoryQueueStore(),
    approval: new AllowAllApprovalHook(),
    ...overrides,
  };
}

const PUB = ["publish", "--text", "hello", "--targets", "x,linkedin"];

describe("parseArgs", () => {
  test("empty args print help", () => {
    expect(parseArgs([]).command).toBe("help");
  });

  test("publish parses targets, media, and brand", () => {
    const request = parseArgs([
      ...PUB,
      "--media",
      "https://a.example/x.png, https://a.example/y.png",
      "--brand",
      "acme",
      "--adapter",
      "x",
    ]);
    expect(request).toMatchObject({
      command: "publish",
      targets: ["x", "linkedin"],
      media: ["https://a.example/x.png", "https://a.example/y.png"],
      brand: "acme",
      adapters: ["x"],
    });
  });

  test("publish needs text and targets", () => {
    expect(() => parseArgs(["publish", "--targets", "x"])).toThrow(UsageError);
    expect(() => parseArgs(["publish", "--text", "hi"])).toThrow(UsageError);
  });

  test("queue parses its subcommands", () => {
    expect(parseArgs(["queue", "list", "--brand", "acme"])).toMatchObject({
      command: "queue",
      sub: "list",
      brand: "acme",
    });
    expect(() => parseArgs(["queue", "nonsense"])).toThrow(UsageError);
    expect(() => parseArgs(["queue", "drain"])).toThrow(/--brand/);
    expect(() => parseArgs(["queue", "remove"])).toThrow(/--id/);
  });

  test("unknown command and flag fail", () => {
    expect(() => parseArgs(["fax"])).toThrow(UsageError);
    expect(() => parseArgs([...PUB, "--nope", "1"])).toThrow(UsageError);
  });
});

describe("runCli", () => {
  test("publish dry-runs by default", async () => {
    const io = testIo();
    const code = await runCli(PUB, io);
    expect(code).toBe(0);
    expect(JSON.parse(io.outLines[0])).toMatchObject({ dryRun: true, targets: ["x", "linkedin"] });
  });

  test("publish --live posts and reports the receipt", async () => {
    const io = testIo();
    const code = await runCli([...PUB, "--live"], io);
    expect(code).toBe(0);
    const result = JSON.parse(io.outLines[0]);
    expect(result.dryRun).toBe(false);
    expect(result.receipt).toMatchObject({ adapter: "private-repo-c4e6", id: "cr_1" });
  });

  test("publish --live without approval fails", async () => {
    const io = testIo({ approval: undefined });
    const code = await runCli([...PUB, "--live"], io);
    expect(code).toBe(1);
    expect(io.errLines.join("\n")).toMatch(/approval hook/);
  });

  test("publish --live --auto-approve posts without env approval", async () => {
    const io = testIo({ approval: undefined });
    const code = await runCli([...PUB, "--live", "--auto-approve"], io);
    expect(code).toBe(0);
    expect(JSON.parse(io.outLines[0]).dryRun).toBe(false);
  });

  test("publish reports a failed chain", async () => {
    const io = testIo();
    const code = await runCli([...PUB, "--live", "--adapter", "zernio"], io);
    expect(code).toBe(1);
    expect(io.errLines.join("\n")).toMatch(/every adapter failed/);
  });

  test("queue enqueue, list, drain, and remove round-trip", async () => {
    const io = testIo();
    expect(await runCli(["queue", "enqueue", "--brand", "acme", "--text", "hi", "--targets", "x"], io)).toBe(0);
    const entry = JSON.parse(io.outLines[0]);
    expect(entry.brand).toBe("acme");

    expect(await runCli(["queue", "list", "--brand", "acme"], io)).toBe(0);
    expect(JSON.parse(io.outLines[1])).toHaveLength(1);

    expect(await runCli(["queue", "drain", "--brand", "acme", "--live"], io)).toBe(0);
    const drained = JSON.parse(io.outLines[2]);
    expect(drained.sent).toEqual([entry.id]);

    expect(await runCli(["queue", "remove", "--id", entry.id], io)).toBe(1);
  });

  test("queue drain dry-runs by default", async () => {
    const io = testIo();
    await runCli(["queue", "enqueue", "--brand", "acme", "--text", "hi", "--targets", "x"], io);
    const code = await runCli(["queue", "drain", "--brand", "acme"], io);
    expect(code).toBe(0);
    const result = JSON.parse(io.outLines[1]);
    expect(result.planned).toHaveLength(1);
    expect(result.sent).toEqual([]);
  });

  test("pacing prints limits", async () => {
    const io = testIo();
    expect(await runCli(["pacing"], io)).toBe(0);
    expect(JSON.parse(io.outLines[0]).limits.x.maxChars).toBe(280);
  });

  test("costs prints a report", async () => {
    const io = testIo();
    expect(await runCli(["costs"], io)).toBe(0);
    expect(JSON.parse(io.outLines[0])).toHaveProperty("dispatches");
  });

  test("bad usage exits 2", async () => {
    const io = testIo();
    expect(await runCli(["fax"], io)).toBe(2);
  });
});
