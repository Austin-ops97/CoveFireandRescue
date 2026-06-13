"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import {
  formatMailSetupQrPayload,
  formatMailSetupText,
  type MailClientSettings,
} from "@/lib/email-provisioning/mail-settings";

type EmailSetupShareCardProps = {
  emailAddress: string;
  mailSettings: MailClientSettings;
  onDismiss?: () => void;
  compact?: boolean;
};

export function EmailSetupShareCard({
  emailAddress,
  mailSettings,
  onDismiss,
  compact = false,
}: EmailSetupShareCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const setupText = useMemo(
    () => formatMailSetupText(emailAddress, mailSettings),
    [emailAddress, mailSettings]
  );

  const qrPayload = useMemo(
    () => formatMailSetupQrPayload(emailAddress, mailSettings),
    [emailAddress, mailSettings]
  );

  useEffect(() => {
    let cancelled = false;

    void QRCode.toDataURL(qrPayload, {
      width: compact ? 200 : 240,
      margin: 2,
      color: {
        dark: "#1a1a1a",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
          setQrError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrError("Could not generate QR code.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [qrPayload, compact]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(setupText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-brand-charcoal">Share email setup</h3>
          <p className="mt-1 text-sm text-brand-gray">
            Scan the QR code or copy the secure mail settings for{" "}
            <span className="font-medium text-brand-charcoal">{emailAddress}</span>.
          </p>
        </div>
        {onDismiss && (
          <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl border border-brand-gray/15 bg-white p-4 shadow-sm">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`Email setup QR code for ${emailAddress}`}
                width={compact ? 200 : 240}
                height={compact ? 200 : 240}
                className="h-auto w-full max-w-[240px]"
              />
            ) : (
              <div
                className={`flex items-center justify-center bg-brand-charcoal/[0.03] text-sm text-brand-gray ${
                  compact ? "h-[200px] w-[200px]" : "h-[240px] w-[240px]"
                }`}
              >
                {qrError ?? "Generating QR code…"}
              </div>
            )}
          </div>
          <p className="text-center text-xs text-brand-gray">
            Member can scan this with a phone camera to view setup details.
          </p>
        </div>

        <div className="rounded-xl border border-sky-200/80 bg-sky-50/70 p-4 sm:p-5">
          <p className="text-sm font-semibold text-sky-950">
            Secure SSL/TLS Settings (Recommended)
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium text-brand-charcoal">Username</dt>
              <dd className="mt-0.5 break-all text-brand-gray">{emailAddress}</dd>
            </div>
            <div>
              <dt className="font-medium text-brand-charcoal">Password</dt>
              <dd className="mt-0.5 text-brand-gray">
                Use the email password provided by your administrator
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-charcoal">Incoming Server</dt>
              <dd className="mt-0.5 text-brand-gray">
                {mailSettings.incomingServer}
                <span className="block text-xs text-brand-gray/90">
                  IMAP Port: {mailSettings.imapPortSsl} · POP3 Port:{" "}
                  {mailSettings.pop3PortSsl}
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-charcoal">Outgoing Server</dt>
              <dd className="mt-0.5 text-brand-gray">
                {mailSettings.outgoingServer}
                <span className="block text-xs text-brand-gray/90">
                  SMTP Port: {mailSettings.smtpPortSsl}
                </span>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-brand-gray">
            IMAP, POP3, and SMTP require authentication.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()}>
          {copied ? "Copied" : "Copy setup details"}
        </Button>
      </div>
    </Card>
  );
}
