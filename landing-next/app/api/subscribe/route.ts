import { google } from "googleapis";
import { NextResponse } from "next/server";

/** Parse GOOGLE_SHEETS_CREDENTIALS_JSON : gère guillemets, échappement et BOM. */
function parseCredentialsJson(value: string): object {
  let trimmed = value.trim().replace(/^\uFEFF/, ""); // BOM
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    trimmed = trimmed.slice(1, -1);
  }
  // Certains .env donnent {\"type\":\"service_account\",...} → remplacer \" par "
  const jsonStr = trimmed.replace(/\\"/g, '"');
  return JSON.parse(jsonStr) as object;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS_JSON;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!credentialsJson || !spreadsheetId) {
      console.warn(
        "GOOGLE_SHEETS_CREDENTIALS_JSON ou GOOGLE_SPREADSHEET_ID manquant. Voir .env.example.",
      );
      return NextResponse.json(
        { error: "Configuration serveur manquante" },
        { status: 503 },
      );
    }

    const credentials = parseCredentialsJson(credentialsJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetName = process.env.GOOGLE_SHEET_NAME || "Pré-inscriptions";

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${sheetName}'!A:B`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[email, new Date().toISOString()]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Subscribe API error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 },
    );
  }
}
