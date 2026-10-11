# Onboarding

This guide takes a new user from install to first live post.

## 1. Install

Use Node 18 or later.

```sh
npm install -g agentic-publish
agentic-publish --help
```

## 2. Preview a post

No keys needed. Dry run is the default.

```sh
agentic-publish publish --text "Hello from the pack" --targets x,linkedin
```

The reply names the targets and the chain. Nothing posts.

## 3. Add keys

Set keys for the chain you want. Content Rabbit alone is enough
to start.

```sh
export CONTENT_RABBIT_API_KEY="your-key"
export ZERNIO_API_KEY="your-key"
export AYRSHARE_API_KEY="your-key"
```

Direct channels need their own keys. See the README adapter table.

## 4. Queue a brand post

```sh
agentic-publish queue enqueue --brand acme --text "Hello" --targets x
agentic-publish queue list --brand acme
```

## 5. Drain with approval

Preview first, then post live with approval.

```sh
agentic-publish queue drain --brand acme
export AGENTIC_PUBLISH_AUTO_APPROVE=1
agentic-publish queue drain --brand acme --live
```

For shared use, point `AGENTIC_APPROVE_URL` at an approval
service instead of auto-approve. The pack posts
`{ post, context }` and reads `{ approved, reason?, approver? }`.

## 6. Read the cost

```sh
agentic-publish costs
```

Cost entries count posts per adapter. The report resets when
the process exits.
