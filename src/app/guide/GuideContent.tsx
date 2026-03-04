"use client";

import { useTranslation } from "@/i18n/context";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { TableOfContents } from "@/components/legal/TableOfContents";

export default function GuideContent() {
  const { t } = useTranslation("guide");

  const sections = [
    { id: t("toc.0.id"), title: t("toc.0.title") },
    { id: t("toc.1.id"), title: t("toc.1.title") },
    { id: t("toc.2.id"), title: t("toc.2.title") },
    { id: t("toc.3.id"), title: t("toc.3.title") },
    { id: t("toc.4.id"), title: t("toc.4.title") },
    { id: t("toc.5.id"), title: t("toc.5.title") },
    { id: t("toc.6.id"), title: t("toc.6.title") },
    { id: t("toc.7.id"), title: t("toc.7.title") },
    { id: t("toc.8.id"), title: t("toc.8.title") },
    { id: t("toc.9.id"), title: t("toc.9.title") },
    { id: t("toc.10.id"), title: t("toc.10.title") },
    { id: t("toc.11.id"), title: t("toc.11.title") },
    { id: t("toc.12.id"), title: t("toc.12.title") },
  ];

  const overviewMethods = [0, 1].map((i) => ({
    label: t(`overview.methods.${i}.label`),
    text: t(`overview.methods.${i}.text`),
  }));

  const createInAppSteps = [0, 1, 2, 3, 4].map((i) => ({
    label: t(`createInApp.steps.${i}.label`),
    text: t(`createInApp.steps.${i}.text`),
  }));

  const telegramGettingStartedSteps = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    t(`createOnTelegram.gettingStarted.steps.${i}`)
  );

  const flowTableRows = [0, 1, 2, 3, 4].map((i) => ({
    step: t(`theFlow.table.${i}.step`),
    whatYouDo: t(`theFlow.table.${i}.whatYouDo`),
    whatHappens: t(`theFlow.table.${i}.whatHappens`),
  }));

  const styleTemplateRows = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
    name: t(`styleTemplates.available.${i}.name`),
    style: t(`styleTemplates.available.${i}.style`),
  }));

  const howToUseSteps = [0, 1, 2, 3].map((i) =>
    t(`styleTemplates.howToUse.steps.${i}`)
  );

  const audioWays = [0, 1, 2].map((i) => ({
    label: t(`audioAndMusic.threeWays.${i}.label`),
    text: t(`audioAndMusic.threeWays.${i}.text`),
  }));

  const settingsTabs = [0, 1, 2].map((i) => ({
    label: t(`settings.tabs.${i}.label`),
    text: t(`settings.tabs.${i}.text`),
  }));

  const tips = [0, 1, 2, 3, 4, 5].map((i) => ({
    label: t(`tips.${i}.label`),
    text: t(`tips.${i}.text`),
  }));

  const provenanceHowItWorksSteps = [0, 1, 2, 3].map((i) =>
    t(`creatorProvenance.howItWorks.steps.${i}`)
  );

  const whatGetsEmbeddedFields = [0, 1, 2, 3].map((i) => ({
    label: t(`creatorProvenance.whatGetsEmbedded.fields.${i}.label`),
    text: t(`creatorProvenance.whatGetsEmbedded.fields.${i}.text`),
  }));

  const watermarkModes = [0, 1, 2, 3].map((i) => ({
    label: t(`creatorProvenance.watermarkModes.${i}.label`),
    text: t(`creatorProvenance.watermarkModes.${i}.text`),
  }));

  const brandLogoSetupSteps = [0, 1, 2, 3, 4].map((i) =>
    t(`brandLogoWatermark.setup.steps.${i}`)
  );

  const logoGuidelines = [0, 1, 2, 3].map((i) => ({
    label: t(`brandLogoWatermark.guidelines.${i}.label`),
    text: t(`brandLogoWatermark.guidelines.${i}.text`),
  }));

  const positionOptions = [0, 1, 2, 3, 4].map((i) => ({
    position: t(`brandLogoWatermark.positionOptions.${i}.position`),
    where: t(`brandLogoWatermark.positionOptions.${i}.where`),
  }));

  const platformNotes = [0, 1, 2, 3, 4, 5].map((i) => ({
    platform: t(`platformNotes.${i}.platform`),
    details: t(`platformNotes.${i}.details`),
  }));

  const telegramCommands = [0, 1, 2, 3].map((i) => ({
    command: t(`commands.telegramBot.${i}.command`),
    description: t(`commands.telegramBot.${i}.description`),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <div className="flex items-center justify-between not-prose mb-4">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <LanguageSwitcher compact />
        </div>
        <p className="border-l-4 border-foreground/20 pl-4 text-muted-foreground !mt-2">
          {t("subtitle")}
        </p>

        <h2 id="overview">{t("overview.heading")}</h2>
        <p>{t("overview.p1")}</p>
        <p>{t("overview.p2")}</p>
        <ul>
          {overviewMethods.map((method) => (
            <li key={method.label}>
              <strong>{method.label}</strong> {method.text}
            </li>
          ))}
        </ul>
        <p>{t("overview.conclusion")}</p>

        <h2 id="quick-start">{t("quickStart.heading")}</h2>
        <p>
          {t("quickStart.description")}
        </p>

        <h2 id="create-in-app">{t("createInApp.heading")}</h2>
        <p>{t("createInApp.intro")}</p>
        <ol>
          {createInAppSteps.map((step) => (
            <li key={step.label}>
              <strong>{step.label}</strong> {step.text}
            </li>
          ))}
        </ol>

        <h2 id="create-on-telegram">{t("createOnTelegram.heading")}</h2>
        <p>
          {t("createOnTelegram.intro")}
        </p>
        <h3>{t("createOnTelegram.gettingStarted.heading")}</h3>
        <ol>
          {telegramGettingStartedSteps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <p>{t("createOnTelegram.previewDescription")}</p>

        <h2 id="the-flow">{t("theFlow.heading")}</h2>
        <p>{t("theFlow.intro")}</p>
        <table>
          <thead>
            <tr>
              <th>{t("theFlow.table.header.step")}</th>
              <th>{t("theFlow.table.header.whatYouDo")}</th>
              <th>{t("theFlow.table.header.whatHappens")}</th>
            </tr>
          </thead>
          <tbody>
            {flowTableRows.map((row) => (
              <tr key={row.step}>
                <td>
                  <strong>{row.step}</strong>
                </td>
                <td>{row.whatYouDo}</td>
                <td>{row.whatHappens}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="style-templates">{t("styleTemplates.heading")}</h2>
        <p>{t("styleTemplates.intro")}</p>
        <h3>{t("styleTemplates.available.heading")}</h3>
        <table>
          <thead>
            <tr>
              <th>{t("styleTemplates.available.header.template")}</th>
              <th>{t("styleTemplates.available.header.style")}</th>
            </tr>
          </thead>
          <tbody>
            {styleTemplateRows.map((row) => (
              <tr key={row.name}>
                <td><strong>{row.name}</strong></td>
                <td>{row.style}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>{t("styleTemplates.howToUse.heading")}</h3>
        <ol>
          {howToUseSteps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <p>{t("styleTemplates.howToUse.note")}</p>

        <h2 id="audio-and-music">{t("audioAndMusic.heading")}</h2>
        <p>{t("audioAndMusic.intro")}</p>
        <h3>{t("audioAndMusic.threeWays.heading")}</h3>
        <ul>
          {audioWays.map((way) => (
            <li key={way.label}>
              <strong>{way.label}</strong> {way.text}
            </li>
          ))}
        </ul>
        <h3>{t("audioAndMusic.goldilocksAutoTrim.heading")}</h3>
        <p>{t("audioAndMusic.goldilocksAutoTrim.p1")}</p>
        <p>{t("audioAndMusic.goldilocksAutoTrim.p2")}</p>
        <h3>{t("audioAndMusic.trimHandles.heading")}</h3>
        <p>{t("audioAndMusic.trimHandles.text")}</p>
        <h3>{t("audioAndMusic.applying.heading")}</h3>
        <p>{t("audioAndMusic.applying.text")}</p>

        <h2 id="settings">{t("settings.heading")}</h2>
        <p>{t("settings.intro")}</p>
        <ul>
          {settingsTabs.map((tab) => (
            <li key={tab.label}>
              <strong>{tab.label}</strong> {tab.text}
            </li>
          ))}
        </ul>

        <h2 id="tips">{t("tips.heading")}</h2>
        <ul>
          {tips.map((tip) => (
            <li key={tip.label}>
              <strong>{tip.label}</strong> {tip.text}
            </li>
          ))}
        </ul>

        <h2 id="creator-provenance">{t("creatorProvenance.heading")}</h2>
        <p>{t("creatorProvenance.intro")}</p>
        <h3>{t("creatorProvenance.howItWorks.heading")}</h3>
        <ol>
          {provenanceHowItWorksSteps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <h3>{t("creatorProvenance.whatGetsEmbedded.heading")}</h3>
        <p>{t("creatorProvenance.whatGetsEmbedded.intro")}</p>
        <ul>
          {whatGetsEmbeddedFields.map((field) => (
            <li key={field.label}>
              <strong>{field.label}</strong> {field.text}
            </li>
          ))}
        </ul>
        <h3>{t("creatorProvenance.verification.heading")}</h3>
        <p>{t("creatorProvenance.verification.p1")}</p>
        <p>{t("creatorProvenance.verification.p2")}</p>
        <h3>{t("creatorProvenance.watermarkModes.heading")}</h3>
        <p>{t("creatorProvenance.watermarkModes.intro")}</p>
        <ul>
          {watermarkModes.map((mode) => (
            <li key={mode.label}>
              <strong>{mode.label}</strong> {mode.text}
            </li>
          ))}
        </ul>
        <h3>{t("creatorProvenance.availability.heading")}</h3>
        <p>{t("creatorProvenance.availability.text")}</p>

        <h2 id="brand-logo-watermark">{t("brandLogoWatermark.heading")}</h2>
        <p>{t("brandLogoWatermark.intro")}</p>
        <h3>{t("brandLogoWatermark.setup.heading")}</h3>
        <ol>
          {brandLogoSetupSteps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <h3>{t("brandLogoWatermark.usingAtExport.heading")}</h3>
        <p>{t("brandLogoWatermark.usingAtExport.p1")}</p>
        <p>{t("brandLogoWatermark.usingAtExport.p2")}</p>
        <h3>{t("brandLogoWatermark.guidelines.heading")}</h3>
        <ul>
          {logoGuidelines.map((guideline) => (
            <li key={guideline.label}>
              <strong>{guideline.label}</strong> {guideline.text}
            </li>
          ))}
        </ul>
        <h3>{t("brandLogoWatermark.positionOptions.heading")}</h3>
        <table>
          <thead>
            <tr>
              <th>{t("brandLogoWatermark.positionOptions.header.position")}</th>
              <th>{t("brandLogoWatermark.positionOptions.header.where")}</th>
            </tr>
          </thead>
          <tbody>
            {positionOptions.map((opt) => (
              <tr key={opt.position}>
                <td>{opt.position}</td>
                <td>{opt.where}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>{t("brandLogoWatermark.opacityAndScale.heading")}</h3>
        <p>{t("brandLogoWatermark.opacityAndScale.opacity")}</p>
        <p>{t("brandLogoWatermark.opacityAndScale.scale")}</p>

        <h2 id="platform-notes">{t("platformNotes.heading")}</h2>
        <p>{t("platformNotes.intro")}</p>
        <table>
          <thead>
            <tr>
              <th>{t("platformNotes.header.platform")}</th>
              <th>{t("platformNotes.header.details")}</th>
            </tr>
          </thead>
          <tbody>
            {platformNotes.map((note) => (
              <tr key={note.platform}>
                <td><strong>{note.platform}</strong></td>
                <td>{note.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>{t("platformNotes.errorNote")}</p>

        <h2 id="commands">{t("commands.heading")}</h2>
        <h3>{t("commands.telegramBot.heading")}</h3>
        <table>
          <thead>
            <tr>
              <th>{t("commands.telegramBot.header.command")}</th>
              <th>{t("commands.telegramBot.header.whatItDoes")}</th>
            </tr>
          </thead>
          <tbody>
            {telegramCommands.map((cmd) => (
              <tr key={cmd.command}>
                <td>{cmd.command}</td>
                <td>{cmd.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p>
          {t("cta.readyToTry")}{" "}
          <a href="/">{t("cta.startCreating")}</a>{" "}
          or message{" "}
          <a
            href="https://t.me/kodacontentbot"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("cta.telegramLink")}
          </a>
          .
        </p>
      </article>
      <TableOfContents sections={sections} />
    </div>
  );
}
