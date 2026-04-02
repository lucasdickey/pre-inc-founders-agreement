# Pre-Incorporation Founders Agreement — MCP Skill

## Overview

This skill conducts a structured interview to help co-founders align on key decisions before incorporating their company. It is delivered as an **MCP (Model Context Protocol) server** that any MCP-compatible client can consume.

## How It Works

1. **Connect** — The user adds this MCP server to their client (Claude Code, Claude Desktop, or any MCP host).
2. **Start the interview** — Invoke the `founders-agreement-interview` prompt. The host AI walks the user through 7 topics conversationally, one question at a time.
3. **Generate the document** — When all topics are covered, the AI calls the `generate_agreement_document` tool, which produces a formatted Markdown agreement.

## MCP Server Components

### Prompt: `founders-agreement-interview`

Provides the host AI with a complete interview script covering:

| # | Topic | Key Data Collected |
|---|-------|--------------------|
| 1 | Introduction & Company Info | Company name, description, stage, co-founder names |
| 2 | Founder Details | Name, email, role, commitment for each founder |
| 3 | Equity & Vesting | Ownership %, vesting period, cliff, acceleration |
| 4 | Contributions | IP, capital, equipment, sweat equity, relationships |
| 5 | Decision Making | Unanimous decisions, day-to-day authority, deadlock resolution |
| 6 | Exit Scenarios | Voluntary/involuntary departure, non-compete, company sale |
| 7 | Custom Terms | Side projects, moonlighting, IP exceptions |

The prompt instructs the AI to:
- Ask **one question at a time** in a conversational tone
- **Extract data eagerly** if the user volunteers future-topic information
- **Never re-ask** questions already answered
- Provide **guidance on standard practices** without being prescriptive
- **Summarize and confirm** all data before generating the document

### Tool: `generate_agreement_document`

Accepts structured interview data and returns a formatted Markdown document containing:

- Company information
- Founder profiles with equity, vesting, and contributions
- Equity summary table
- Decision-making governance
- Exit scenario terms
- Custom terms
- Next steps checklist
- Legal disclaimer

## Installation

### Claude Code (via settings)

Add to your MCP server configuration (`~/.claude/settings.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "founders-agreement": {
      "command": "node",
      "args": ["/path/to/pre-inc-founders-agreement/mcp-server/dist/index.js"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "founders-agreement": {
      "command": "node",
      "args": ["/path/to/pre-inc-founders-agreement/mcp-server/dist/index.js"]
    }
  }
}
```

### npx (after publishing)

```json
{
  "mcpServers": {
    "founders-agreement": {
      "command": "npx",
      "args": ["founders-agreement-mcp"]
    }
  }
}
```

## Development

```bash
cd mcp-server
npm install
npm run build    # compile TypeScript
npm run dev      # watch mode
npm start        # run server
```

## Interview Conversation Style

- Professional but friendly
- Short messages (2-4 sentences), bullet points for options
- One question at a time
- Provides examples and standard practices as guidance
- Not legal advice — reminds user to consult an attorney

## Output

The generated `.md` file follows this structure:

```
# Pre-Incorporation Founders Agreement
## [Company Name]
## Founders (with equity, vesting, contributions)
## Equity Summary (table)
## Decision Making
## Exit Scenarios
## Additional Terms
## Next Steps (checklist)
## Disclaimer
```
