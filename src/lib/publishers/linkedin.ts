/**
 * LinkedIn Posts API — Document Carousel Publishing
 *
 * LinkedIn carousels are actually multi-page PDF documents.
 *
 * Flow:
 * 1. Generate a PDF from slide images using jsPDF
 * 2. Register a document upload with LinkedIn
 * 3. Upload the PDF binary
 * 4. Create a post referencing the uploaded document
 */

import { jsPDF } from "jspdf";

const LINKEDIN_API = "https://api.linkedin.com";

export interface LinkedInPublishResult {
  success: boolean;
  postUrn?: string;
  error?: string;
}

/**
 * Publish a document carousel (PDF) to LinkedIn.
 *
 * @param images - Composited slide images as Buffers
 * @param caption - Post text
 * @param accessToken - LinkedIn OAuth access token
 * @param authorUrn - LinkedIn member URN (e.g., "urn:li:person:abc123")
 */
export async function publishToLinkedIn(
  images: Buffer[],
  caption: string,
  accessToken: string,
  authorUrn: string
): Promise<LinkedInPublishResult> {
  try {
    if (images.length === 0) {
      return { success: false, error: "No images provided for LinkedIn post" };
    }

    if (!authorUrn) {
      return { success: false, error: "LinkedIn author URN is missing. Please reconnect in Settings." };
    }

    // 1. Generate PDF from slide images
    const pdfBuffer = await generatePdf(images);

    // 2. Register document upload
    const registerRes = await fetch(`${LINKEDIN_API}/rest/documents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        data: {
          owner: authorUrn,
        },
      }),
    });

    if (!registerRes.ok) {
      const err = await registerRes.text();
      return { success: false, error: `LinkedIn document registration failed: ${err}` };
    }

    const registerData = await registerRes.json();
    const uploadUrl = registerData.value?.uploadUrl;
    const documentUrn = registerData.value?.document;

    if (!uploadUrl || !documentUrn) {
      return {
        success: false,
        error: "LinkedIn did not return an upload URL or document URN",
      };
    }

    // 3. Upload the PDF
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/pdf",
      },
      body: new Uint8Array(pdfBuffer),
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return { success: false, error: `LinkedIn PDF upload failed: ${err}` };
    }

    // 4. Create the post with document
    const postRes = await fetch(`${LINKEDIN_API}/rest/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: caption,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          media: {
            title: "Carousel",
            id: documentUrn,
          },
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });

    if (!postRes.ok) {
      const err = await postRes.text();
      return { success: false, error: `LinkedIn post creation failed: ${err}` };
    }

    // LinkedIn returns the post URN in the x-restli-id header
    const postUrn = postRes.headers.get("x-restli-id") || undefined;

    return { success: true, postUrn };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "LinkedIn publish failed",
    };
  }
}

/**
 * Detect image format from buffer magic bytes.
 */
function detectImageFormat(buf: Buffer): { mime: string; ext: string } {
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    return { mime: "image/jpeg", ext: "JPEG" };
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { mime: "image/png", ext: "PNG" };
  }
  // Default to PNG if unknown
  return { mime: "image/png", ext: "PNG" };
}

/**
 * Generates a multi-page PDF from slide image buffers.
 * Each image becomes a full page at 1080x1350 (4:5 aspect ratio).
 */
async function generatePdf(images: Buffer[]): Promise<Buffer> {
  if (images.length === 0) {
    throw new Error("No images provided for PDF generation");
  }

  // LinkedIn carousel slides at 4:5 ratio
  // jsPDF uses mm by default, so convert from px at 72dpi
  const widthMm = 190; // ~A4 width with margins
  const heightMm = widthMm * (1350 / 1080); // Maintain 4:5 ratio

  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [widthMm, heightMm],
    });

    for (let i = 0; i < images.length; i++) {
      if (i > 0) {
        doc.addPage([widthMm, heightMm], "portrait");
      }

      // Detect actual image format from magic bytes
      const format = detectImageFormat(images[i]);
      const base64 = images[i].toString("base64");
      const dataUrl = `data:${format.mime};base64,${base64}`;

      doc.addImage(dataUrl, format.ext, 0, 0, widthMm, heightMm);
    }

    // Get PDF as ArrayBuffer and convert to Node.js Buffer
    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw new Error(
      `PDF generation failed (jsPDF may not be compatible with this server environment): ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
