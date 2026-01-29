import { createClient } from "@supabase/supabase-js";
import type { Agreement, Founder } from "@/types/agreement";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Agreement CRUD operations
export async function createAgreement(
  agreement: Omit<Agreement, "id" | "createdAt" | "updatedAt">
): Promise<Agreement | null> {
  const { data, error } = await supabase
    .from("agreements")
    .insert({
      code: agreement.code,
      company_name: agreement.companyName,
      company_description: agreement.companyDescription,
      founders: agreement.founders,
      decision_making: agreement.decisionMaking,
      exit_scenarios: agreement.exitScenarios,
      custom_fields: agreement.customFields,
      status: agreement.status,
      created_by: agreement.createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating agreement:", error);
    return null;
  }

  return transformDbAgreement(data);
}

export async function getAgreementById(id: string): Promise<Agreement | null> {
  const { data, error } = await supabase
    .from("agreements")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching agreement:", error);
    return null;
  }

  return transformDbAgreement(data);
}

export async function getAgreementByCode(
  code: string
): Promise<Agreement | null> {
  const { data, error } = await supabase
    .from("agreements")
    .select("*")
    .eq("code", code)
    .single();

  if (error) {
    console.error("Error fetching agreement by code:", error);
    return null;
  }

  return transformDbAgreement(data);
}

export async function updateAgreement(
  id: string,
  updates: Partial<Agreement>
): Promise<Agreement | null> {
  const dbUpdates: Record<string, unknown> = {};

  if (updates.companyName) dbUpdates.company_name = updates.companyName;
  if (updates.companyDescription)
    dbUpdates.company_description = updates.companyDescription;
  if (updates.founders) dbUpdates.founders = updates.founders;
  if (updates.decisionMaking)
    dbUpdates.decision_making = updates.decisionMaking;
  if (updates.exitScenarios) dbUpdates.exit_scenarios = updates.exitScenarios;
  if (updates.customFields) dbUpdates.custom_fields = updates.customFields;
  if (updates.status) dbUpdates.status = updates.status;

  const { data, error } = await supabase
    .from("agreements")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating agreement:", error);
    return null;
  }

  return transformDbAgreement(data);
}

export async function addFounderToAgreement(
  agreementId: string,
  founder: Founder
): Promise<Agreement | null> {
  const agreement = await getAgreementById(agreementId);
  if (!agreement) return null;

  const updatedFounders = [...agreement.founders, founder];

  return updateAgreement(agreementId, { founders: updatedFounders });
}

export async function updateFounderInAgreement(
  agreementId: string,
  founderId: string,
  updates: Partial<Founder>
): Promise<Agreement | null> {
  const agreement = await getAgreementById(agreementId);
  if (!agreement) return null;

  const updatedFounders = agreement.founders.map((f) =>
    f.id === founderId ? { ...f, ...updates } : f
  );

  return updateAgreement(agreementId, { founders: updatedFounders });
}

// Transform database record to Agreement type
function transformDbAgreement(data: Record<string, unknown>): Agreement {
  return {
    id: data.id as string,
    code: data.code as string,
    companyName: data.company_name as string,
    companyDescription: data.company_description as string | undefined,
    founders: (data.founders as Founder[]) || [],
    decisionMaking: data.decision_making as Agreement["decisionMaking"],
    exitScenarios: data.exit_scenarios as Agreement["exitScenarios"],
    customFields: (data.custom_fields as Agreement["customFields"]) || [],
    status: data.status as Agreement["status"],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    createdBy: data.created_by as string,
  };
}

// SQL for creating the table (run in Supabase SQL editor)
export const SCHEMA_SQL = `
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

-- Enable RLS (Row Level Security)
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for MVP - tighten in production)
CREATE POLICY "Allow all operations on agreements" ON agreements
  FOR ALL
  USING (true)
  WITH CHECK (true);
`;
