import { NextResponse } from "next/server";
import {
  createAgreement,
  getAgreementById,
  getAgreementByCode,
  updateAgreement,
  addFounderToAgreement,
} from "@/lib/supabase";
import type { Agreement, Founder } from "@/types/agreement";
import { nanoid } from "nanoid";
import { createStubFounder } from "@/lib/stubData";

// Generate a human-friendly join code
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST: Create new agreement
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { founderName, founderEmail, companyName } = body;

    if (!founderName || !founderEmail) {
      return NextResponse.json(
        { error: "Founder name and email are required" },
        { status: 400 }
      );
    }

    const founderId = nanoid();
    const founder: Founder = {
      id: founderId,
      name: founderName,
      email: founderEmail,
      role: "",
      equityPercentage: null,
      vestingSchedule: null,
      contributions: [],
      interviewCompleted: false,
      interviewData: {
        messages: [],
        extractedData: {},
        currentTopic: "introduction",
        completedTopics: [],
      },
      joinedAt: new Date().toISOString(),
    };

    // For prototype demo: automatically add a stub co-founder with completed interview
    // This allows demonstrating the full flow without needing a second person
    const stubFounder = createStubFounder();

    const agreement = await createAgreement({
      code: generateJoinCode(),
      companyName: companyName || "Untitled Company",
      founders: [founder, stubFounder],
      decisionMaking: null,
      exitScenarios: null,
      customFields: [],
      status: "draft",
      createdBy: founderId,
    });

    if (!agreement) {
      return NextResponse.json(
        { error: "Failed to create agreement" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      agreement,
      founderId,
    });
  } catch (error) {
    console.error("Error creating agreement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Get agreement by ID or code
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const code = searchParams.get("code");

  try {
    let agreement: Agreement | null = null;

    if (id) {
      agreement = await getAgreementById(id);
    } else if (code) {
      agreement = await getAgreementByCode(code);
    } else {
      return NextResponse.json(
        { error: "ID or code is required" },
        { status: 400 }
      );
    }

    if (!agreement) {
      return NextResponse.json(
        { error: "Agreement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ agreement });
  } catch (error) {
    console.error("Error fetching agreement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update agreement or add founder
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { agreementId, action, ...data } = body;

    if (!agreementId) {
      return NextResponse.json(
        { error: "Agreement ID is required" },
        { status: 400 }
      );
    }

    let result: Agreement | null = null;

    if (action === "addFounder") {
      const { founderName, founderEmail } = data;
      if (!founderName || !founderEmail) {
        return NextResponse.json(
          { error: "Founder name and email are required" },
          { status: 400 }
        );
      }

      const founderId = nanoid();
      const founder: Founder = {
        id: founderId,
        name: founderName,
        email: founderEmail,
        role: "",
        equityPercentage: null,
        vestingSchedule: null,
        contributions: [],
        interviewCompleted: false,
        interviewData: {
          messages: [],
          extractedData: {},
          currentTopic: "introduction",
          completedTopics: [],
        },
        joinedAt: new Date().toISOString(),
      };

      result = await addFounderToAgreement(agreementId, founder);

      if (result) {
        return NextResponse.json({ agreement: result, founderId });
      }
    } else {
      // Regular update
      result = await updateAgreement(agreementId, data);
    }

    if (!result) {
      return NextResponse.json(
        { error: "Failed to update agreement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ agreement: result });
  } catch (error) {
    console.error("Error updating agreement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
