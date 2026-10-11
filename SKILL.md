---
name: agentic-publish
description: Route social posts across Content Rabbit, Zernio, Ayrshare, and direct APIs. Keywords: social, publish, content-rabbit, zernio, ayrshare.
---

# agentic-publish

Route social posts across Content Rabbit, Zernio, Ayrshare, and direct APIs.

## Use the SDK

```js
import { publishPost, defaultAdapters } from "agentic-publish";

await publishPost({ text: "Hello", targets: ["x"] }, { adapters: defaultAdapters() });
```

## Use the CLI

```sh
agentic-publish publish --text "Hello" --targets x,linkedin
agentic-publish publish --text "Hello" --targets x --live --auto-approve
agentic-publish queue enqueue --brand acme --text "Hello" --targets x
agentic-publish queue drain --brand acme --live
```

## Use the MCP server

Start the server with `agentic-publish mcp`. Call `publish_post`
to post, `queue_enqueue` and `queue_drain` for brand queues,
`pacing_status` for gaps, `get_cost_report` for costs.

## Rules

- Preview each post with dry run first.
- Approve each live post. A denied post stays denied.
- Respect pacing gaps. Report guard denials as failures.
- Read the cost report at the end.
