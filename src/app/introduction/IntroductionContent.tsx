"use client";

import { useTranslation } from "@/i18n/context";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { TableOfContents } from "@/components/legal/TableOfContents";

export default function IntroductionContent() {
  const { t } = useTranslation("introduction");

  const sections = [
    { id: t("toc.0.id"), title: t("toc.0.title") },
    { id: t("toc.1.id"), title: t("toc.1.title") },
    { id: t("toc.2.id"), title: t("toc.2.title") },
    { id: t("toc.3.id"), title: t("toc.3.title") },
    { id: t("toc.4.id"), title: t("toc.4.title") },
    { id: t("toc.5.id"), title: t("toc.5.title") },
  ];

  const roleFeatures = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    label: t(`roleOfKoda.features.${i}.label`),
    text: t(`roleOfKoda.features.${i}.text`),
  }));

  const createFeatures = [0, 1, 2, 3].map((i) => ({
    label: t(`whatYouCanCreate.features.${i}.label`),
    text: t(`whatYouCanCreate.features.${i}.text`),
  }));

  const audiences = [0, 1, 2, 3].map((i) => ({
    label: t(`whoIsItFor.audiences.${i}.label`),
    text: t(`whoIsItFor.audiences.${i}.text`),
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

        <h2 id="our-philosophy">{t("philosophy.heading")}</h2>
        <p>
          {t("philosophy.p1.before")}
          <strong>{t("philosophy.p1.bold")}</strong>
          {t("philosophy.p1.after")}
        </p>
        <p>{t("philosophy.p2")}</p>

        <h2 id="human-first-creativity">{t("humanFirst.heading")}</h2>
        <p>
          {t("humanFirst.p1.before")}
          <strong>{t("humanFirst.p1.bold")}</strong>
          {t("humanFirst.p1.after")}
        </p>
        <p>
          {t("humanFirst.p2.before")}
          <em>{t("humanFirst.p2.emphasis")}</em>
          {t("humanFirst.p2.after")}
        </p>

        <h2 id="role-of-ai">{t("roleOfKoda.heading")}</h2>
        <p>{t("roleOfKoda.intro")}</p>
        <ul>
          {roleFeatures.map((feature) => (
            <li key={feature.label}>
              <strong>{feature.label}</strong> {feature.text}
            </li>
          ))}
        </ul>
        <p>{t("roleOfKoda.conclusion")}</p>

        <h2 id="what-you-can-create">{t("whatYouCanCreate.heading")}</h2>
        <p>{t("whatYouCanCreate.intro")}</p>
        <ul>
          {createFeatures.map((feature) => (
            <li key={feature.label}>
              <strong>{feature.label}</strong> {feature.text}
            </li>
          ))}
        </ul>

        <h2 id="who-is-kodapost-for">{t("whoIsItFor.heading")}</h2>
        <p>{t("whoIsItFor.intro")}</p>
        <ul>
          {audiences.map((audience) => (
            <li key={audience.label}>
              <strong>{audience.label}</strong> {audience.text}
            </li>
          ))}
        </ul>

        <h2 id="get-started">{t("getStarted.heading")}</h2>
        <p>{t("getStarted.p1")}</p>
        <p>
          <a href="/">{t("getStarted.cta")} &rarr;</a>
        </p>
      </article>
      <TableOfContents sections={sections} />
    </div>
  );
}
