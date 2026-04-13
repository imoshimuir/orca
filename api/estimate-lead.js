/**
 * POST JSON body: email, phone?, postcode, bill, discountPercent, orcaBill, saving, consent
 *
 * Configure at least one destination (Vercel → Environment Variables):
 *
 * Email (Resend):
 *   RESEND_API_KEY, LEAD_NOTIFICATION_EMAIL
 *   optional: RESEND_FROM_EMAIL (default onboarding@resend.dev for testing)
 *
 * Google Sheet:
 *   GOOGLE_SHEET_ID          — from the sheet URL
 *   GOOGLE_SERVICE_ACCOUNT_JSON — full JSON of a GCP service account key (single line in Vercel is fine)
 *   optional: GOOGLE_SHEET_TAB (default "Sheet1"), GOOGLE_SHEET_RANGE (default "A:H")
 *
 * Share the spreadsheet with the service account email (client_email in the JSON) as Editor.
 * Row 1 on that tab should be headers, e.g.:
 *   Timestamp | Email | Phone | Postcode | Annual bill | Discount % | Est. Orca bill | Est. saving
 */

import { google } from "googleapis";

function getServiceAccountCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  try {
    const c = JSON.parse(raw);
    if (!c.client_email || !c.private_key) return null;
    const privateKey = String(c.private_key).replace(/\\n/g, "\n");
    return { ...c, private_key: privateKey };
  } catch {
    return null;
  }
}

async function appendLeadToSheet(row, sheetId, credentials) {
  const tab = process.env.GOOGLE_SHEET_TAB || "Sheet1";
  const colRange = process.env.GOOGLE_SHEET_RANGE || "A:H";
  const range = `${tab}!${colRange}`;

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

async function sendLeadEmail({ apiKey, notifyTo, from, email, phone, postcode, bill, discountPercent, orcaBill, saving }) {
  const text = [
    "New Orca estimate lead",
    "",
    `Email: ${email}`,
    `Phone: ${phone || "(none)"}`,
    `Postcode: ${postcode}`,
    `Annual bill: £${bill.toFixed(2)}`,
    "",
    `Discount (postcode-based): ${Number.isFinite(discountPercent) ? discountPercent : "?"}%`,
    `Est. Orca bill: £${Number.isFinite(orcaBill) ? orcaBill.toFixed(2) : "?"}`,
    `Est. saving: £${Number.isFinite(saving) ? saving.toFixed(2) : "?"}`,
  ].join("\n");

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [notifyTo],
      reply_to: email,
      subject: `Orca estimate — ${postcode} — ${email}`,
      text,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text();
    throw new Error(`Resend ${resendRes.status}: ${detail}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.LEAD_NOTIFICATION_EMAIL;
  const hasResend = Boolean(apiKey && notifyTo);

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const googleCreds = getServiceAccountCredentials();
  const hasSheets = Boolean(sheetId && googleCreds);

  if (!hasResend && !hasSheets) {
    console.error("Configure Resend and/or Google Sheets (GOOGLE_SHEET_ID + GOOGLE_SERVICE_ACCOUNT_JSON).");
    return res.status(503).json({ error: "Lead capture not configured" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : null;
  if (!body) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const email = String(body.email ?? "").trim();
  const postcode = String(body.postcode ?? "").trim();
  const bill = Number(body.bill);
  const consent = Boolean(body.consent);
  const phone = body.phone != null ? String(body.phone).trim() : "";
  const discountPercent = Number(body.discountPercent);
  const orcaBill = Number(body.orcaBill);
  const saving = Number(body.saving);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }
  if (!postcode) {
    return res.status(400).json({ error: "Invalid postcode" });
  }
  if (!Number.isFinite(bill) || bill <= 0) {
    return res.status(400).json({ error: "Invalid bill" });
  }
  if (!consent) {
    return res.status(400).json({ error: "Consent required" });
  }

  const from = process.env.RESEND_FROM_EMAIL || "Orca Leads <onboarding@resend.dev>";

  const sheetRow = [
    new Date().toISOString(),
    email,
    phone || "",
    postcode,
    bill.toFixed(2),
    Number.isFinite(discountPercent) ? String(discountPercent) : "",
    Number.isFinite(orcaBill) ? orcaBill.toFixed(2) : "",
    Number.isFinite(saving) ? saving.toFixed(2) : "",
  ];

  let sheetsOk = false;
  let emailOk = false;

  if (hasSheets) {
    try {
      await appendLeadToSheet(sheetRow, sheetId, googleCreds);
      sheetsOk = true;
    } catch (err) {
      console.error("Google Sheets error", err);
    }
  }

  if (hasResend) {
    try {
      await sendLeadEmail({
        apiKey,
        notifyTo,
        from,
        email,
        phone,
        postcode,
        bill,
        discountPercent,
        orcaBill,
        saving,
      });
      emailOk = true;
    } catch (err) {
      console.error("Resend error", err);
    }
  }

  const succeeded = (sheetsOk ? 1 : 0) + (emailOk ? 1 : 0);

  if (succeeded === 0) {
    return res.status(502).json({ error: "Lead delivery failed" });
  }

  return res.status(200).json({ ok: true, sheets: sheetsOk, email: emailOk });
}
