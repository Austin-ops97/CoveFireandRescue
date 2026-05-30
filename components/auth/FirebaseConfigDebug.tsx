"use client";

import { getFirebaseClientDebugInfo } from "@/lib/firebase/config";

const isDev = process.env.NODE_ENV === "development";

export function FirebaseConfigDebug() {
  const info = getFirebaseClientDebugInfo();

  return (
    <details
      className="mt-4 rounded-lg border border-gray-200 bg-gray-50/80 text-sm text-brand-charcoal"
      open={isDev}
    >
      <summary className="cursor-pointer select-none px-4 py-3 font-medium text-brand-charcoal/90">
        Debug configuration
      </summary>
      <dl className="space-y-2 border-t border-gray-200 px-4 py-3 text-xs leading-relaxed">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold">Project ID:</dt>
          <dd className="font-mono">{info.projectId}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold">Auth Domain:</dt>
          <dd className="font-mono">{info.authDomain}</dd>
        </div>
        {isDev && (
          <>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold">API key present:</dt>
              <dd>{info.hasApiKey ? "true" : "false"}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-semibold">App ID present:</dt>
              <dd>{info.hasAppId ? "true" : "false"}</dd>
            </div>
          </>
        )}
      </dl>
    </details>
  );
}
