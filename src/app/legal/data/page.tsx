import type { Metadata } from "next";
import { TableOfContents } from "@/components/legal/TableOfContents";

export const metadata: Metadata = {
  title: "Data Policy - KodaPost",
  description:
    "KodaPost data policy covering image ownership, data protection, and user rights.",
};

const sections = [
  { id: "image-ownership", title: "Image Ownership" },
  { id: "how-images-are-processed", title: "How Images Are Processed" },
  { id: "personal-information-protection", title: "Personal Information" },
  { id: "data-retention", title: "Data Retention" },
  { id: "right-to-deletion", title: "Right to Deletion" },
  { id: "data-sharing", title: "Data Sharing" },
  { id: "security-measures", title: "Security Measures" },
  { id: "changes-to-this-policy", title: "Changes to This Policy" },
  { id: "contact-us", title: "Contact Us" },
];

export default function DataPolicyPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Data Policy</h1>
        <p className="border-l-4 border-foreground/20 pl-4 text-muted-foreground !mt-2">
          Effective Date: February 2026
        </p>

        <p>
          This Data Policy explains how KodaPost handles your data, protects
          your uploaded images, and ensures your personal information remains
          private. We are committed to transparency about our data practices.
        </p>

        <h2 id="image-ownership">1. Image Ownership</h2>
        <p>
          <strong>
            You retain full and exclusive ownership of all images you upload to
            KodaPost.
          </strong>{" "}
          We do not claim any rights, title, or interest in your original
          photographs. Your images remain your intellectual property at all
          times.
        </p>
        <p>
          Carousels generated using your images are also owned by you. KodaPost
          does not claim any license over the finished carousels you create,
          whether they include AI-generated text overlays, filters, or camera
          emulation effects.
        </p>

        <h2 id="how-images-are-processed">2. How Images Are Processed</h2>
        <ul>
          <li>
            <strong>In-Browser Storage:</strong> Uploaded images are stored in
            your browser&rsquo;s memory during your session. When saved to local
            storage for auto-save, image data is stripped to stay within browser
            storage limits.
          </li>
          <li>
            <strong>AI Processing:</strong> During carousel generation, your
            images are sent to our AI processing pipeline (powered by Anthropic
            Claude) for analysis, filter application, and text overlay
            generation. Images are processed in-memory and are not permanently
            stored on our servers.
          </li>
          <li>
            <strong>Export and Publishing:</strong> When you export or publish
            your carousel, the final composite images are generated server-side
            using Sharp image processing. These generated images are provided to
            you for download or transmitted to your connected social media
            platforms. They are not retained by KodaPost after delivery.
          </li>
        </ul>

        <h2 id="personal-information-protection">3. Personal Information Protection</h2>
        <p>
          KodaPost is designed with a privacy-first architecture:
        </p>
        <ul>
          <li>
            <strong>No PII Extraction:</strong> We do not extract, analyze, or
            store personally identifiable information (PII) from your uploaded
            images. Our AI processing focuses solely on visual composition,
            mood, and content for carousel generation purposes.
          </li>
          <li>
            <strong>No Face Recognition:</strong> We do not perform facial
            recognition, face detection, or biometric analysis on uploaded
            images.
          </li>
          <li>
            <strong>No User Profiles:</strong> We do not build user profiles,
            behavioral models, or tracking dossiers based on your usage of the
            service.
          </li>
          <li>
            <strong>No Data Selling:</strong> We never sell, rent, or trade your
            data, images, or any information derived from them to third parties.
          </li>
        </ul>

        <h2 id="data-retention">4. Data Retention</h2>
        <table>
          <thead>
            <tr>
              <th>Data Type</th>
              <th>Storage Location</th>
              <th>Retention Period</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Project configuration</td>
              <td>Browser localStorage</td>
              <td>Until you clear it or start a new project</td>
            </tr>
            <tr>
              <td>Uploaded images</td>
              <td>Browser memory (session only)</td>
              <td>Current browser session only</td>
            </tr>
            <tr>
              <td>OAuth tokens</td>
              <td>Encrypted HTTP-only cookies</td>
              <td>Until token expiration or disconnection</td>
            </tr>
            <tr>
              <td>Theme preference</td>
              <td>Browser localStorage</td>
              <td>Until you change it or clear storage</td>
            </tr>
            <tr>
              <td>Server-side image data</td>
              <td>Not stored</td>
              <td>Processed in-memory only, not retained</td>
            </tr>
          </tbody>
        </table>

        <h2 id="right-to-deletion">5. Right to Deletion</h2>
        <p>You can delete all your data at any time through these methods:</p>
        <ul>
          <li>
            <strong>New Project:</strong> Starting a new project clears your
            previous carousel data from local storage.
          </li>
          <li>
            <strong>Browser Storage:</strong> Clear your browser&rsquo;s local
            storage and cookies to remove all KodaPost data from your device.
          </li>
          <li>
            <strong>Disconnect Accounts:</strong> Use the Settings dialog to
            disconnect social media accounts, which immediately deletes stored
            OAuth tokens.
          </li>
        </ul>
        <p>
          Because we do not store your data on our servers, deletion is
          immediate and complete.
        </p>

        <h2 id="data-sharing">6. Data Sharing</h2>
        <p>
          Your images and data are never shared with third parties except in
          the following limited circumstances:
        </p>
        <ul>
          <li>
            <strong>AI Processing:</strong> Images are sent to Anthropic&rsquo;s
            API for carousel generation processing, governed by their data
            handling policies.
          </li>
          <li>
            <strong>Publishing:</strong> When you explicitly choose to publish,
            your carousel images and caption are transmitted to the social media
            platforms you select.
          </li>
        </ul>
        <p>
          In both cases, data is shared only when you initiate the action, and
          only the minimum necessary data is transmitted.
        </p>

        <h2 id="security-measures">7. Security Measures</h2>
        <ul>
          <li>All data transmission uses HTTPS/TLS encryption.</li>
          <li>OAuth tokens are encrypted at rest using AES-256-GCM encryption.</li>
          <li>
            No server-side database means no risk of centralized data breaches.
          </li>
          <li>
            HTTP-only cookies prevent client-side JavaScript from accessing
            OAuth tokens.
          </li>
        </ul>

        <h2 id="changes-to-this-policy">8. Changes to This Policy</h2>
        <p>
          We may update this Data Policy to reflect changes in our practices or
          for legal compliance. We will notify users by updating the
          &ldquo;Effective Date&rdquo; at the top of this page.
        </p>

        <h2 id="contact-us">9. Contact Us</h2>
        <p>
          If you have questions about this Data Policy or our data practices,
          please contact us at{" "}
          <a href="mailto:privacy@kodapost.app">
            privacy@kodapost.app
          </a>
          .
        </p>
      </article>
      <TableOfContents sections={sections} />
    </div>
  );
}
