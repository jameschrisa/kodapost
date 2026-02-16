import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir, stat } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * GET /api/media/[filename]
 *
 * Serves temporary images from /tmp/ for Instagram's carousel upload.
 * Only serves files from nf-media-* directories for security.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  // Security: reject path traversal attempts
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  // Security: only allow alphanumeric, single dashes, single dots
  if (!/^[a-zA-Z0-9]+(?:[-_.][a-zA-Z0-9]+)*\.[a-zA-Z]+$/.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  // Security: filename must contain our session prefix pattern
  if (!filename.startsWith("slide-")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Search through nf-media-* directories in /tmp (async)
  const tmpDir = "/tmp";
  let filePath: string | null = null;

  try {
    const entries = await readdir(tmpDir);
    for (const entry of entries) {
      if (entry.startsWith("nf-media-")) {
        const candidate = path.join(tmpDir, entry, filename);
        // Verify resolved path is still within /tmp/nf-media-*
        const resolved = path.resolve(candidate);
        if (!resolved.startsWith(path.join(tmpDir, "nf-media-"))) {
          continue;
        }
        try {
          const fileStat = await stat(resolved);
          if (fileStat.isFile() && fileStat.size <= MAX_FILE_SIZE) {
            filePath = resolved;
            break;
          }
        } catch {
          // File doesn't exist in this directory, continue searching
        }
      }
    }
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!filePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
