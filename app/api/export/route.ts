import { NextResponse } from "next/server";
import { getAgreementById } from "@/lib/supabase";
import { generateExport } from "@/lib/templates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agreementId = searchParams.get("id");
  const format = searchParams.get("format") || "all"; // yaml, markdown, legal, all

  if (!agreementId) {
    return NextResponse.json(
      { error: "Agreement ID is required" },
      { status: 400 }
    );
  }

  try {
    const agreement = await getAgreementById(agreementId);

    if (!agreement) {
      return NextResponse.json(
        { error: "Agreement not found" },
        { status: 404 }
      );
    }

    const exports = generateExport(agreement);

    if (format === "yaml") {
      return new NextResponse(exports.yaml, {
        headers: {
          "Content-Type": "text/yaml",
          "Content-Disposition": `attachment; filename="${agreement.companyName.replace(/[^a-z0-9]/gi, "_")}_agreement.yaml"`,
        },
      });
    }

    if (format === "markdown") {
      return new NextResponse(exports.markdown, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${agreement.companyName.replace(/[^a-z0-9]/gi, "_")}_agreement.md"`,
        },
      });
    }

    if (format === "legal") {
      return new NextResponse(exports.legalDocument, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="${agreement.companyName.replace(/[^a-z0-9]/gi, "_")}_founders_agreement.txt"`,
        },
      });
    }

    // Return all formats as JSON
    return NextResponse.json({
      agreement: {
        id: agreement.id,
        code: agreement.code,
        companyName: agreement.companyName,
        status: agreement.status,
        foundersCount: agreement.founders.length,
        completedInterviews: agreement.founders.filter((f) => f.interviewCompleted).length,
      },
      exports,
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
