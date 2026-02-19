import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";

// =============================================================================
// GET /api/preview/[jobId]
//
// Public API endpoint for fetching completed carousel job results.
// Used by the preview page to display generated slides.
// No authentication required — job IDs serve as unguessable access tokens.
//
// Results expire after 1 hour (matching the jobs table expiresAt).
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json(
      { error: "Missing job ID" },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check expiry
    if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          error: "This carousel has expired. Carousels are available for 1 hour after generation.",
        },
        { status: 404 }
      );
    }

    // Return status and result
    if (job.status === "completed") {
      return NextResponse.json({
        jobId: job.id,
        status: job.status,
        result: job.result,
      });
    }

    if (job.status === "processing") {
      return NextResponse.json({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
      });
    }

    if (job.status === "failed") {
      return NextResponse.json(
        {
          jobId: job.id,
          status: job.status,
          error: job.error || "Generation failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    console.error("[KodaPost Preview] Error fetching job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
