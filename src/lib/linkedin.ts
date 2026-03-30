/**
 * LinkedIn API Client
 *
 * Uses LinkedIn's internal API via session cookies.
 * Note: This approach is against LinkedIn TOS. Use at your own risk.
 * For production, consider using a third-party service like Phantombuster.
 */

const LINKEDIN_API_BASE = "https://www.linkedin.com/voyager/api";

function getHeaders(cookie: string): Record<string, string> {
  const csrfToken = cookie.match(/JSESSIONID="?([^";]+)/)?.[1] || "";
  return {
    Cookie: cookie,
    "csrf-token": csrfToken,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/vnd.linkedin.normalized+json+2.1",
    "x-restli-protocol-version": "2.0.0",
  };
}

export async function getProfile(cookie: string, profileId: string) {
  const headers = getHeaders(cookie);
  const res = await fetch(
    `${LINKEDIN_API_BASE}/identity/profiles/${profileId}`,
    { headers }
  );
  if (!res.ok) throw new Error(`LinkedIn API error: ${res.status}`);
  return res.json();
}

export async function sendConnectionRequest(
  cookie: string,
  profileUrn: string,
  message?: string
) {
  const headers = getHeaders(cookie);
  const body: Record<string, unknown> = {
    trackingId: crypto.randomUUID(),
    invitations: [],
    excludeInvitations: [],
    invitee: {
      "com.linkedin.voyager.growth.invitation.InviteeProfile": {
        profileId: profileUrn,
      },
    },
  };

  if (message) {
    body.message = message;
  }

  const res = await fetch(
    `${LINKEDIN_API_BASE}/growth/normInvitations`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`LinkedIn connection request failed: ${res.status}`);
  return res.json();
}

export async function sendMessage(
  cookie: string,
  profileUrn: string,
  messageText: string
) {
  const headers = getHeaders(cookie);

  const body = {
    keyVersion: "LEGACY_INBOX",
    conversationCreate: {
      eventCreate: {
        value: {
          "com.linkedin.voyager.messaging.create.MessageCreate": {
            attributedBody: {
              text: messageText,
              attributes: [],
            },
          },
        },
      },
      recipients: [profileUrn],
      subtype: "MEMBER_TO_MEMBER",
    },
  };

  const res = await fetch(
    `${LINKEDIN_API_BASE}/messaging/conversations`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`LinkedIn message failed: ${res.status}`);
  return res.json();
}

export async function searchPeople(
  cookie: string,
  keywords: string,
  start = 0,
  count = 10
) {
  const headers = getHeaders(cookie);
  const params = new URLSearchParams({
    keywords,
    start: start.toString(),
    count: count.toString(),
    origin: "GLOBAL_SEARCH_HEADER",
  });

  const res = await fetch(
    `${LINKEDIN_API_BASE}/search/dash/clusters?${params}`,
    { headers }
  );

  if (!res.ok) throw new Error(`LinkedIn search failed: ${res.status}`);
  return res.json();
}
