import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { authenticateApiKey } from "@/lib/api/auth";
import { getDb } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";

/**
 * GET /api/v1/jobs/:id
 *
 * Retrieves the status and result of a generation job.
 * Authenticated — only the API key that created the job can access it.
 *
 * Returns:
 *   - pending/processing: status + progress info
 *   - completed: status + full result (composited images + caption)
 *   - failed: status + error message
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authentication
  const auth = await authenticateApiKey(request);
  if (!auth.success) return auth.response;

  const { id: jobId } = params;

  if (!jobId) {
    return NextResponse.json(
      { error: "Missing job ID", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // Look up the job, ensuring it belongs to this API key
  const db = getDb();
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.apiKeyId, auth.data.apiKeyId)))
    .limit(1);

  if (!job) {
    return NextResponse.json(
      { error: "Job not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Check expiry
  if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
    return NextResponse.json(
      {
        error: "Job result has expired (results are available for 1 hour after creation)",
        code: "NOT_FOUND",
      },
      { status: 404 }
    );
  }

  // Build response based on status
  const response: Record<string, unknown> = {
    jobId: job.id,
    status: job.status,
    createdAt: job.createdAt,
  };

  if (job.status === "processing" || job.status === "pending") {
    response.currentStep = job.currentStep;
    response.progress = job.progress;
  }

  if (job.status === "completed") {
    response.result = job.result;
    response.completedAt = job.completedAt;
  }

  if (job.status === "failed") {
    response.error = job.error;
    response.completedAt = job.completedAt;
  }

  return NextResponse.json(response);
}
