# Agentic publish

Route social posts across Content Rabbit, Zernio, Ayrshare, and direct APIs.

Post a launch note to X and LinkedIn at once.
Queue a week of posts per brand, then drain each queue.
Fall back to Zernio when Content Rabbit fails.
Pin one channel with a direct API call.

## Start

Use Node 18 or later. Install and check the pack:

```sh
npm install
npm run build
npm run typecheck
npm test
node dist/cli.js --help
node dist/cli.js publish --text "Hello" --targets x,linkedin
node dist/cli.js queue enqueue --brand acme --text "Hello" --targets x
node dist/cli.js queue list --brand acme
node dist/cli.js pacing
node dist/cli.js costs
```

Publish defaults to a dry run. It calls no vendor and records no cost.
Add `--live` to post for real. A live post walks the chain in order:
Content Rabbit first, then Zernio, then Ayrshare. The first win ends
the walk. Each failed adapter is reported. When every adapter fails,
the CLI exits 1. Bad usage exits 2.

Live posts need approval. Pass `--auto-approve`, set
`AGENTIC_PUBLISH_AUTO_APPROVE=1`, or point `AGENTIC_APPROVE_URL` at an
approval service. A denied post stays denied and exits 1.

Cost entries count posts, not currency.
Reports stay in the current process and reset when it exits.

## Adapters

| Adapter | Setup | Posts through |
| --- | --- | --- |
| content-rabbit | CONTENT_RABBIT_API_KEY | Content Rabbit drafts plus publish |
| zernio | ZERNIO_API_KEY | Zernio posts API |
| ayrshare | AYRSHARE_API_KEY | Ayrshare post API |
| x | X_BEARER_TOKEN | X API v2 tweets |
| linkedin | LINKEDIN_ACCESS_TOKEN plus LINKEDIN_AUTHOR_URN | LinkedIn UGC posts |
| tiktok | TIKTOK_ACCESS_TOKEN plus TIKTOK_OPEN_ID | TikTok content posting |
| instagram | INSTAGRAM_ACCESS_TOKEN plus INSTAGRAM_USER_ID | Instagram content publishing |

Keys also accept `apiKey` in adapter constructors.
Network adapters accept `fetchFn` and `timeoutMs`.
Select adapters with `--adapter`, or use `all` for the default chain.
Direct X and LinkedIn posts take text (LinkedIn also takes a link).
Direct TikTok needs a video URL. Direct Instagram needs a media URL.
Route mixed media posts through the chain instead.

## Pacing and queues

Each channel keeps a gap between posts: 90 seconds for X, 3 minutes
for LinkedIn, 5 minutes for TikTok and Instagram. A jitter of up to
15 seconds keeps posts off a fixed beat. The pacer waits before a
live post and marks each target after a win.

Each brand holds its own queue. Enqueue per brand, list per brand,
and drain one brand at a time. Draining previews by default; add
`--live` to post. Sent entries leave the queue. Failed entries stay
with a raised attempt count. The queue lives in
`.agentic-publish-queue.json`, or in `AGENTIC_PUBLISH_QUEUE`.

## SDK

```js
import { publishPost, defaultAdapters, AllowAllApprovalHook } from "agentic-publish";

const preview = await publishPost(
  { text: "Hello", targets: ["x", "linkedin"] },
  { adapters: defaultAdapters() },
);
console.log(preview);
```

publishPost accepts adapters, guards, logger, dryRun, approval, and
pacer. It checks guards before any adapter call and walks the chain
on live sends. Each live adapter call records a publish entry,
including zero units on failure. Dry run is the default. Pass
`dryRun: false` with an approval hook to post for real.

## MCP

Start the server with `agentic-publish mcp` or `npx agentic-publish mcp`.

| Tool | Use it for |
| --- | --- |
| publish_post | Publish one post. Dry run is the default. |
| queue_enqueue | Add one post to a brand queue. |
| queue_list | List queued posts. |
| queue_remove | Drop one queued post. |
| queue_drain | Publish one brand queue in order. Dry run is the default. |
| pacing_status | Read pacing gaps and char limits. |
| get_cost_report | Read session cost totals. |

## Worker

The pack ships a worker face with three routes: `GET /health`,
`GET /limits`, and `POST /preview`. Preview checks a post and
returns the dry run plan. Deploy with wrangler:

```sh
npx wrangler deploy
```

## Rules

- Preview each post with a dry run first.
- Approve each live post. Report denials as failures.
- Respect pacing. Never bypass the wait to post faster.
- Report guard denials and adapter errors as failures.
- Read the cost report at the end.

## Docs

- Core contract: https://github.com/pooriaarab/agentic-publish/blob/main/docs/agentic-core.md
- Onboarding: https://github.com/pooriaarab/agentic-publish/blob/main/docs/onboarding.md
- License: MIT
