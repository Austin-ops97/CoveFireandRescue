export type CpanelConnectivityProbe = {
  configured: boolean;
  ok: boolean;
  code: string | null;
  message: string | null;
  host: string | null;
  emailDomain: string | null;
  mailboxCount: number | null;
};
