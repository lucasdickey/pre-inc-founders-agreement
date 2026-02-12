# Founders Agreement CLI

A terminal-based version of the Pre-Incorporation Founders Agreement tool.

## Quick Start

```bash
cd cli
npm install
npm start
```

## Features

- Interactive interview flow through all agreement topics
- Pre-populated demo co-founder (Jamie Chen) for prototype testing
- Export to Markdown or YAML formats
- No external dependencies (database, API keys, etc.)

## Interview Topics

1. **Company Information** - Name and description
2. **Founder Details** - Your name, email, role
3. **Equity & Vesting** - Ownership percentages and vesting schedules
4. **Contributions** - IP, capital, equipment contributions
5. **Decision Making** - Unanimous consent requirements, deadlock resolution
6. **Exit Scenarios** - Departure terms, non-compete, acceleration
7. **Custom Terms** - Any special arrangements

## Export Formats

- **Markdown (.md)** - Human-readable document
- **YAML (.yaml)** - Machine-readable, suitable for Stripe Atlas integration

## Demo Mode

This CLI includes a stub co-founder "Jamie Chen (CTO)" with pre-completed interview data, allowing you to demonstrate the full flow without needing a second person.
