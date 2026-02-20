import type { Metadata } from "next";
import { TableOfContents } from "@/components/legal/TableOfContents";

export const metadata: Metadata = {
  title: "Privacy Policy - KodaPost",
  description: "KodaPost privacy policy and data handling practices.",
};

const sections = [
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "how-we-use-your-information", title: "How We Use Information" },
  { id: "third-party-services", title: "Third-Party Services" },
  { id: "data-storage-and-retention", title: "Data Storage & Retention" },
  { id: "cookies", title: "Cookies" },
  { id: "your-rights", title: "Your Rights" },
  { id: "data-security", title: "Data Security" },
  { id: "childrens-privacy", title: "Children's Privacy" },
  { id: "changes-to-this-policy", title: "Changes to This Policy" },
  { id: "contact-us", title: "Contact Us" },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Privacy Policy</h1>
        <p className="border-l-4 border-foreground/20 pl-4 text-muted-foreground !mt-2">
          Effective Date: February 2026
        </p>

        <p>
          KodaPost (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;)
          is committed to protecting your privacy. This Privacy Policy explains
          how we collect, use, and safeguard your information when you use our
          carousel creation service.
        </p>

        <h2 id="information-we-collect">1. Information We Collect</h2>

        <h3>Images You Upload</h3>
        <p>
          When you upload photos, they are stored temporarily in your
          browser&rsquo;s local memory for carousel generation. Images are sent
          to our Koda processing pipeline solely for the purpose of creating your
          carousel slides. We do not permanently store your uploaded images on
          our servers.
        </p>

        <h3>Configuration Preferences</h3>
        <p>
          Your carousel settings (theme, camera style, filter selections, text
          overlays, and slide configurations) are saved in your browser&rsquo;s
          local storage to enable auto-save functionality. This data never
          leaves your device unless you initiate carousel generation.
        </p>

        <h3>Social Media OAuth Tokens</h3>
        <p>
          If you connect social media accounts for publishing, we store
          encrypted OAuth access tokens in secure, HTTP-only cookies. These
          tokens are used exclusively to publish carousels on your behalf and
          are never shared with third parties.
        </p>

        <h3>Theme Preference</h3>
        <p>
          We store your light/dark mode preference in local storage to provide
          a consistent visual experience across sessions.
        </p>

        <h2 id="how-we-use-your-information">2. How We Use Your Information</h2>
        <ul>
          <li>
            <strong>Carousel Generation:</strong> Your images and configuration
            are processed through our Koda pipeline to create carousel slides with
            applied filters, text overlays, and camera emulation effects.
          </li>
          <li>
            <strong>Publishing:</strong> When you choose to publish, we use your
            stored OAuth tokens to post carousels to your connected social media
            platforms.
          </li>
          <li>
            <strong>Auto-Save:</strong> Project state is saved locally in your
            browser to prevent work loss.
          </li>
        </ul>

        <h2 id="third-party-services">3. Third-Party Services</h2>
        <p>We use the following third-party services during carousel generation:</p>
        <ul>
          <li>
            <strong>Anthropic (Claude):</strong> For image analysis, text
            overlay generation, and caption creation. Images are sent to
            Anthropic&rsquo;s API for processing and are subject to{" "}
            <a
              href="https://www.anthropic.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic&rsquo;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Social Media Platforms:</strong> When publishing, carousel
            images are transmitted to the respective platform (Instagram,
            TikTok, LinkedIn, YouTube, Reddit, or Lemon8) via their official
            APIs.
          </li>
        </ul>

        <h2 id="data-storage-and-retention">4. Data Storage and Retention</h2>
        <ul>
          <li>
            <strong>Browser Local Storage:</strong> Project data, settings, and
            preferences are stored locally on your device. We have no access to
            this data.
          </li>
          <li>
            <strong>OAuth Cookies:</strong> Encrypted tokens are stored as
            HTTP-only cookies and expire according to each platform&rsquo;s
            token lifetime policy.
          </li>
          <li>
            <strong>Server-Side:</strong> We do not maintain a database of user
            data. Images and project configurations are processed in-memory
            during generation and are not retained afterward.
          </li>
        </ul>

        <h2 id="cookies">5. Cookies</h2>
        <p>
          We use only essential cookies required for the service to function:
        </p>
        <ul>
          <li>
            <strong>OAuth Token Cookies:</strong> Encrypted social media access
            tokens for publishing functionality.
          </li>
          <li>
            <strong>Theme Preference:</strong> Your selected light/dark mode
            preference.
          </li>
        </ul>
        <p>
          We do not use advertising cookies, tracking cookies, or analytics
          cookies.
        </p>

        <h2 id="your-rights">6. Your Rights</h2>
        <ul>
          <li>
            <strong>Delete Your Data:</strong> You can delete all locally stored
            data at any time by clearing your browser storage or starting a new
            project.
          </li>
          <li>
            <strong>Disconnect Accounts:</strong> You can disconnect any social
            media account at any time through the Settings dialog, which
            immediately removes the stored OAuth token.
          </li>
          <li>
            <strong>Data Portability:</strong> Your carousel images can be
            exported at any time as a downloadable ZIP file.
          </li>
        </ul>

        <h2 id="data-security">7. Data Security</h2>
        <p>
          We implement appropriate security measures to protect your information:
        </p>
        <ul>
          <li>OAuth tokens are encrypted before storage in cookies.</li>
          <li>All communication with third-party APIs uses HTTPS encryption.</li>
          <li>No sensitive data is stored in server-side databases.</li>
        </ul>

        <h2 id="childrens-privacy">8. Children&rsquo;s Privacy</h2>
        <p>
          KodaPost is not intended for use by individuals under the age of 13.
          We do not knowingly collect personal information from children.
        </p>

        <h2 id="changes-to-this-policy">9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          users of significant changes by updating the &ldquo;Effective Date&rdquo;
          at the top of this page.
        </p>

        <h2 id="contact-us">10. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at{" "}
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
