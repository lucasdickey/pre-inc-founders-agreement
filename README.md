# Pre-Incorporation Founders Agreement Tool

A conversational tool to help co-founders align on key decisions before incorporating their company. Built as a prototype for Stripe Atlas.

## Features

- **AI-Driven Interview**: Claude guides each founder through important topics
- **Async Collaboration**: Share a code with co-founders; each completes their own interview
- **Topics Covered**:
  - Equity split & vesting schedules
  - IP & contributions
  - Decision-making framework
  - Exit scenarios
  - Custom terms
- **Multiple Export Formats**:
  - YAML (machine-readable for Atlas ingestion)
  - Markdown (human-readable summary)
  - Legal-style document (with disclaimer)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API
- **Deployment**: Vercel

## Getting Started

### 1. Clone and Install

```bash
git clone <repo-url>
cd pre-inc
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `lib/supabase.ts` (see `SCHEMA_SQL` export)
3. Copy your project URL and anon key from Settings > API

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/pre-inc)

### Option 2: CLI Deploy

```bash
npm i -g vercel
vercel
```

### Environment Variables in Vercel

Add these in your Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`

## Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Create agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(8) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_description TEXT,
  founders JSONB DEFAULT '[]'::jsonb,
  decision_making JSONB,
  exit_scenarios JSONB,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'draft',
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on code for fast lookups
CREATE INDEX IF NOT EXISTS idx_agreements_code ON agreements(code);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_agreements_updated_at ON agreements;
CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Allow all operations (tighten for production)
CREATE POLICY "Allow all operations on agreements" ON agreements
  FOR ALL USING (true) WITH CHECK (true);
```

## Project Structure

```
pre-inc/
├── app/
│   ├── layout.tsx          # Root layout with nav
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global styles
│   ├── agreement/
│   │   ├── new/page.tsx    # Create new agreement
│   │   ├── [id]/page.tsx   # Main agreement view
│   │   └── join/[code]/    # Join existing agreement
│   └── api/
│       ├── agreement/      # CRUD operations
│       ├── chat/           # Claude interview API
│       └── export/         # Generate exports
├── components/
│   ├── Chat.tsx            # Interview chat UI
│   ├── ExportPreview.tsx   # Document preview
│   └── FounderStatus.tsx   # Founder progress
├── lib/
│   ├── supabase.ts         # Database client
│   ├── claude.ts           # AI interview logic
│   ├── prompts.ts          # Interview prompts
│   └── templates.ts        # Export templates
└── types/
    └── agreement.ts        # TypeScript types
```

## User Flow

1. **First Founder**: Creates agreement, completes interview
2. **Share Code**: Gets 6-character code to share with co-founders
3. **Co-Founders Join**: Use code to access agreement, complete their interviews
4. **Export**: When all founders complete, export in multiple formats
5. **Atlas Import**: YAML can be imported into Stripe Atlas during incorporation

## Disclaimer

This tool provides a framework for founder discussions. It is not legal advice. Consult an attorney before finalizing any agreements.

## License

MIT
