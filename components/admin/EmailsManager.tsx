"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmailTemplateType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EMAIL_TEMPLATE_ORDER } from "@/lib/email/constants";
import { escapeHtml, renderTemplate } from "@/lib/email/render";
import { formatMessage, getMessages } from "@/lib/i18n/messages";

type EmailTemplateItem = {
  id: string;
  type: EmailTemplateType;
  locale: string;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  enabled: boolean;
  fromName: string | null;
  replyTo: string | null;
  updatedAt: string;
};

type EmailLogItem = {
  id: string;
  type: EmailTemplateType;
  locale: string;
  toEmail: string;
  subject: string;
  status: "SENT" | "FAILED";
  error: string | null;
  createdAt: string;
};

type EmailsManagerProps = {
  lang: string;
  tenantSlug: string;
  locale: string;
  templates: EmailTemplateItem[];
  logs: EmailLogItem[];
  canManageSettings: boolean;
};

type TemplateLabel = {
  title: string;
  description: string;
  audience: string;
};

type FormState = {
  subject: string;
  htmlBody: string;
  textBody: string;
  fromName: string;
  replyTo: string;
  enabled: boolean;
};

type StatusState =
  | { type: "idle" }
  | { type: "saving" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type TestStatusState =
  | { type: "idle" }
  | { type: "sending" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const statusClassNames = {
  SENT: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-amber-100 text-amber-700",
} as const;

const initialFormState: FormState = {
  subject: "",
  htmlBody: "",
  textBody: "",
  fromName: "",
  replyTo: "",
  enabled: true,
};

export default function EmailsManager({
  lang,
  tenantSlug,
  locale,
  templates,
  logs,
  canManageSettings,
}: EmailsManagerProps) {
  const [items, setItems] = useState<EmailTemplateItem[]>(templates);
  const [selectedType, setSelectedType] = useState<EmailTemplateType | null>(
    templates[0]?.type ?? null,
  );
  const [form, setForm] = useState<FormState>(initialFormState);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<TestStatusState>({ type: "idle" });
  const [activeField, setActiveField] = useState<
    "subject" | "htmlBody" | "textBody" | null
  >(null);
  const messages = getMessages(lang);
  const copy = messages.admin.emails;
  const localizedTemplateLabels = copy.templateLabels as Record<
    EmailTemplateType,
    TemplateLabel
  >;
  const localizedTemplateTokens = copy.templateTokens;

  const templateMap = useMemo(() => {
    const map = new Map<EmailTemplateType, EmailTemplateItem>();
    items.forEach((template) => map.set(template.type, template));
    return map;
  }, [items]);

  useEffect(() => {
    if (!selectedType) {
      return;
    }

    const template = templateMap.get(selectedType);
    if (!template) {
      setForm(initialFormState);
      return;
    }

    setForm({
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody ?? "",
      fromName: template.fromName ?? "",
      replyTo: template.replyTo ?? "",
      enabled: template.enabled,
    });
    setStatus({ type: "idle" });
  }, [selectedType, templateMap]);

  useEffect(() => {
    if (!selectedType && items.length > 0) {
      setSelectedType(items[0].type);
    }
  }, [items, selectedType]);

  const sampleContext = useMemo(
    () => ({
      ...copy.sampleContext,
      propertyName: tenantSlug,
      tenantName: tenantSlug,
      siteUrl: `https://${tenantSlug}.example.com/${locale}`,
      adminBookingUrl: `https://app.example.com/${locale}/bookings`,
      docsTermsUrl: `https://${tenantSlug}.example.com/${locale}/docs/terms`,
      docsPrivacyUrl: `https://${tenantSlug}.example.com/${locale}/docs/privacy`,
    }),
    [tenantSlug, locale, copy.sampleContext],
  );

  const previewSubject = useMemo(
    () => renderTemplate(form.subject || "", sampleContext),
    [form.subject, sampleContext],
  );
  const previewHtml = useMemo(
    () =>
      renderTemplate(form.htmlBody || "", sampleContext, {
        escape: escapeHtml,
      }),
    [form.htmlBody, sampleContext],
  );
  const previewText = useMemo(
    () => renderTemplate(form.textBody || "", sampleContext),
    [form.textBody, sampleContext],
  );

  const orderedTypes = useMemo(() => {
    const available = items.map((item) => item.type);
    return EMAIL_TEMPLATE_ORDER.filter((type) => available.includes(type));
  }, [items]);

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    if (!selectedType || status.type === "saving") {
      return;
    }

    if (!canManageSettings) {
      setStatus({
        type: "error",
        message: copy.permissionDeniedTemplates,
      });
      return;
    }

    setStatus({ type: "saving" });

    try {
      const response = await fetch("/api/admin/email-templates/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          locale,
          subject: form.subject,
          htmlBody: form.htmlBody,
          textBody: form.textBody || undefined,
          enabled: form.enabled,
          fromName: form.fromName || undefined,
          replyTo: form.replyTo || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || copy.templateSaveError);
      }

      setItems((prev) => {
        const next = prev.filter((item) => item.type !== selectedType);
        next.push(payload.template as EmailTemplateItem);
        next.sort(
          (left, right) =>
            EMAIL_TEMPLATE_ORDER.indexOf(left.type) -
            EMAIL_TEMPLATE_ORDER.indexOf(right.type),
        );
        return next;
      });
      setStatus({ type: "success", message: copy.templateSaved });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : copy.templateSaveError,
      });
    }
  };

  const handleSendTest = async () => {
    if (!selectedType || testStatus.type === "sending") {
      return;
    }

    if (!canManageSettings) {
      setTestStatus({
        type: "error",
        message: copy.permissionDeniedTests,
      });
      return;
    }

    if (!testEmail.trim()) {
      setTestStatus({ type: "error", message: copy.enterTestEmail });
      return;
    }

    setTestStatus({ type: "sending" });

    try {
      const response = await fetch("/api/admin/email-templates/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          locale,
          toEmail: testEmail.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || copy.testSendError);
      }

      setTestStatus({ type: "success", message: copy.testSent });
    } catch (error) {
      setTestStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : copy.testSendError,
      });
    }
  };

  const handleTokenInsert = (token: string) => {
    const targetField = activeField ?? "htmlBody";
    setForm((prev) => {
      const currentValue = prev[targetField] ?? "";
      const spacer = currentValue && !currentValue.endsWith(" ") ? " " : "";
      return {
        ...prev,
        [targetField]: `${currentValue}${spacer}{{${token}}}`,
      };
    });
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="border-b border-slate-200/70 bg-white">
        <div className="container mx-auto px-6 py-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            {copy.title}
          </h1>
          <p className="mt-2 text-slate-600">
            {copy.description}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {copy.activeTenant}: {tenantSlug} | {copy.locale}: {lang.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="container mx-auto space-y-8 px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <Card>
            <CardContent className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700">
                {copy.templateTypesTitle}
              </h2>
              <div className="space-y-2">
                {orderedTypes.map((type) => {
                  const meta = localizedTemplateLabels[type];
                  const isActive = type === selectedType;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        isActive
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-100"
                      }`}
                    >
                      <div className="font-semibold">{meta.title}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {meta.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {copy.templateEditorTitle}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatMessage(copy.editingTemplate, {
                        title: selectedType
                          ? localizedTemplateLabels[selectedType].title
                          : copy.templateFallback,
                      })}
                    </p>
                  </div>
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      name="enabled"
                      checked={form.enabled}
                      onChange={handleFormChange}
                      disabled={!canManageSettings}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    {copy.enabled}
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="fromName">
                      {copy.fromNameLabel}
                    </label>
                    <input
                      id="fromName"
                      name="fromName"
                      value={form.fromName}
                      onChange={handleFormChange}
                      disabled={!canManageSettings}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                      placeholder={copy.fromNamePlaceholder}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="replyTo">
                      {copy.replyToLabel}
                    </label>
                    <input
                      id="replyTo"
                      name="replyTo"
                      type="email"
                      value={form.replyTo}
                      onChange={handleFormChange}
                      disabled={!canManageSettings}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                      placeholder={copy.replyToPlaceholder}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="subject">
                    {copy.subjectLabel}
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleFormChange}
                    onFocus={() => setActiveField("subject")}
                    disabled={!canManageSettings}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="htmlBody">
                    {copy.htmlBodyLabel}
                  </label>
                  <textarea
                    id="htmlBody"
                    name="htmlBody"
                    value={form.htmlBody}
                    onChange={handleFormChange}
                    onFocus={() => setActiveField("htmlBody")}
                    disabled={!canManageSettings}
                    rows={8}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="textBody">
                    {copy.textBodyLabel}
                  </label>
                  <textarea
                    id="textBody"
                    name="textBody"
                    value={form.textBody}
                    onChange={handleFormChange}
                    onFocus={() => setActiveField("textBody")}
                    disabled={!canManageSettings}
                    rows={4}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={!canManageSettings || status.type === "saving"}
                  >
                    {status.type === "saving" ? copy.saving : copy.saveTemplate}
                  </Button>
                  {status.type === "success" ? (
                    <span className="text-sm text-emerald-600">
                      {status.message}
                    </span>
                  ) : null}
                  {status.type === "error" ? (
                    <span className="text-sm text-amber-600">{status.message}</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <Card>
                <CardContent className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {copy.previewTitle}
                  </h2>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {copy.subjectHeading}
                    </div>
                    <div className="mt-2 font-semibold">
                      {previewSubject || copy.emptyPreview}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <div
                      className="space-y-3 text-sm text-slate-700"
                      dangerouslySetInnerHTML={{
                        __html: previewHtml || `<em>${copy.noHtmlBody}</em>`,
                      }}
                    />
                  </div>
                  {form.textBody ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        {copy.textHeading}
                      </div>
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-slate-600">
                        {previewText}
                      </pre>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardContent className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {copy.templateTokensTitle}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {copy.templateTokensHint}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {localizedTemplateTokens.map((token) => (
                        <button
                          key={token.token}
                          type="button"
                          onClick={() => handleTokenInsert(token.token)}
                          title={token.label}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-blue-200 hover:text-blue-700"
                        >
                          {`{{${token.token}}}`}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {copy.sendTestTitle}
                    </h2>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="testEmail">
                        {copy.testRecipientLabel}
                      </label>
                      <input
                        id="testEmail"
                        value={testEmail}
                        onChange={(event) => setTestEmail(event.target.value)}
                        disabled={!canManageSettings}
                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                        placeholder={copy.testRecipientPlaceholder}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleSendTest}
                      disabled={!canManageSettings || testStatus.type === "sending"}
                    >
                      {testStatus.type === "sending" ? copy.sending : copy.sendTestButton}
                    </Button>
                    {testStatus.type === "success" ? (
                      <span className="text-sm text-emerald-600">
                        {testStatus.message}
                      </span>
                    ) : null}
                    {testStatus.type === "error" ? (
                      <span className="text-sm text-amber-600">
                        {testStatus.message}
                      </span>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {copy.emailLogTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {copy.emailLogHint}
              </p>
            </div>
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                {copy.emailLogEmpty}
              </div>
            ) : (
              <div className="grid gap-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[log.status]}`}
                      >
                        {copy.logStatusLabels[log.status]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      {localizedTemplateLabels[log.type].title}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {copy.toLabel}: {log.toEmail} \u2022 {copy.subjectShort}: {log.subject}
                    </div>
                    {log.error ? (
                      <div className="mt-2 text-xs text-amber-600">
                        {log.error}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
