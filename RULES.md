# agentic-publish rules

These rules bind every run of agentic-publish. They also bind
agents that drive this pack over MCP.

1. Preview before you act. Run each publish and each drain with dry run first.
2. Approve before you post. A live post carries an approval decision.
   A denied post stays denied.
3. Respect guards and pacing. A denied call stays denied. Never skip
   the pacer wait to post faster.
4. Report failures as failures. Adapters throw, and callers surface
   the error. No silent success follows a failed call.
5. Count the cost. Read the cost report before you close a task.
6. Keep brands apart. Drain one brand queue at a time.

Pack: Route social posts across Content Rabbit, Zernio, Ayrshare, and direct APIs. Keywords: social, publish, private-repo-c4e6, zernio, ayrshare.
