# n8n-nodes-ratelimiter

A utility node that sits between any two nodes in an n8n workflow and throttles the flow of items to prevent hitting API rate limits. Drop it in anywhere you're getting 429 errors — no credentials or external APIs required.

## Installation

In n8n: **Settings → Community Nodes → Install** → enter `n8n-nodes-ratelimiter`

## Why you need it

Most APIs enforce rate limits — for example, OpenAI allows 60 requests per minute on the free tier. When n8n processes a list of 200 items, it fires all 200 requests almost instantly, which triggers a flood of `429 Too Many Requests` errors and failed executions. The Rate Limiter node solves this by inserting a calculated pause between batches of items, spreading the load over time so you stay under the limit.

## Modes

| Mode | Parameter | Example | Delay Inserted |
|------|-----------|---------|----------------|
| **Fixed Delay** | Delay (ms) | `500` | 500ms between every item |
| **Requests Per Second** | Max RPS | `5` | 200ms between items |
| **Requests Per Minute** | Max RPM | `60` | 1000ms between items |

**Batch Size** lets you process multiple items before each pause. If an API allows bursts of 10, set Batch Size to `10` — the delay fires after every 10 items instead of every 1.

**Add Metadata** appends a `_rateLimiter` field to each item's JSON for debugging:
```json
{
  "_rateLimiter": {
    "itemIndex": 3,
    "batchNumber": 2,
    "delayApplied": 1000,
    "mode": "requestsPerMinute",
    "processedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Example Workflow

```
OpenAI Batch Processor → Rate Limiter (60 req/min) → HTTP Request → Google Sheets
```

Configure the Rate Limiter with:
- Mode: `Requests Per Minute`
- Max Requests Per Minute: `60`
- Batch Size: `1`

This ensures you never exceed 60 API calls per minute, eliminating 429 errors entirely.

## License

MIT
