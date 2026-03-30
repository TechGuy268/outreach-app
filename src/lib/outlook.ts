import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";

let msalClient: ConfidentialClientApplication | null = null;

function getMsalClient() {
  if (!msalClient) {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("Outlook credentials not configured. Set OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET in .env");
    }
    msalClient = new ConfidentialClientApplication({
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID || "common"}`,
      },
    });
  }
  return msalClient;
}

export const OUTLOOK_SCOPES = [
  "https://graph.microsoft.com/Mail.Send",
  "https://graph.microsoft.com/Mail.ReadWrite",
  "https://graph.microsoft.com/User.Read",
  "offline_access",
];

export function getAuthUrl(redirectUri: string) {
  return getMsalClient().getAuthCodeUrl({
    scopes: OUTLOOK_SCOPES,
    redirectUri,
  });
}

export async function getTokenFromCode(code: string, redirectUri: string) {
  return getMsalClient().acquireTokenByCode({
    code,
    scopes: OUTLOOK_SCOPES,
    redirectUri,
  });
}

export async function refreshAccessToken(refreshToken: string) {
  return getMsalClient().acquireTokenByRefreshToken({
    refreshToken,
    scopes: OUTLOOK_SCOPES,
  });
}

function getGraphClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  trackingPixelUrl?: string;
}

export async function sendEmail(accessToken: string, payload: EmailPayload) {
  const client = getGraphClient(accessToken);

  let bodyContent = payload.body;
  if (payload.trackingPixelUrl) {
    bodyContent += `<img src="${payload.trackingPixelUrl}" width="1" height="1" style="display:none" />`;
  }

  const message = {
    message: {
      subject: payload.subject,
      body: {
        contentType: payload.isHtml !== false ? "HTML" : "Text",
        content: bodyContent,
      },
      toRecipients: [
        {
          emailAddress: { address: payload.to },
        },
      ],
    },
    saveToSentItems: true,
  };

  return client.api("/me/sendMail").post(message);
}

export async function getUserProfile(accessToken: string) {
  const client = getGraphClient(accessToken);
  return client.api("/me").get();
}
