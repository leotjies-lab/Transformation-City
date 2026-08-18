import express from "express";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { Readable } from "stream";

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for custom domain & hosting compatibility
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Transporter configuration helper for Hostinger SMTP
function getSmtpCredentials() {
  return {
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER || "admin@transformationcitychurch.org",
    pass: process.env.SMTP_PASS || "jxaiET4!",
    from: process.env.SMTP_FROM || `"Transformation City Church" <admin@transformationcitychurch.org>`,
  };
}

async function createTransporter(customPort?: number, customSecure?: boolean) {
  const creds = getSmtpCredentials();
  const port = customPort || creds.port;
  const isSecure = customSecure !== undefined ? customSecure : port === 465;

  return nodemailer.createTransport({
    host: creds.host,
    port: port,
    secure: isSecure, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: creds.user,
      pass: creds.pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents certificate verification failures on custom domains
    },
    connectionTimeout: 10000, // 10 seconds connection timeout
    greetingTimeout: 10000,   // 10 seconds greeting timeout
    socketTimeout: 15000,     // 15 seconds socket timeout
  });
}

// API Health & SMTP Status Check
app.get("/api/health", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/smtp-status", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const creds = getSmtpCredentials();
  res.json({
    configured: true,
    host: creds.host,
    port: creds.port,
    user: creds.user,
    from: creds.from,
    recipients: ["admin@transformationcitychurch.org", "leonandalouw@outlook.com"]
  });
});

// Dedicated SMTP Live Test & Diagnostic Route (Supports both GET and POST)
async function handleTestSmtp(req: express.Request, res: express.Response) {
  res.setHeader("Content-Type", "application/json");
  const testRecipient = req.body?.testRecipient || (req.query?.recipient as string) || (req.query?.testRecipient as string);
  const sendActualEmail = Boolean(req.body?.sendActualEmail || req.query?.sendEmail === "true" || req.query?.sendActualEmail === "true");
  const creds = getSmtpCredentials();
  const diagnosticLogs: string[] = [];

  const recipientList = ["admin@transformationcitychurch.org", "leonandalouw@outlook.com"];
  if (testRecipient && !recipientList.includes(testRecipient)) {
    recipientList.push(testRecipient);
  }
  const recipient = recipientList.join(", ");

  try {
    diagnosticLogs.push(`Testing Hostinger SMTP server at ${creds.host}...`);
    diagnosticLogs.push(`Authenticating user: ${creds.user}`);

    let activeTransporter: nodemailer.Transporter | null = null;
    let workingPort = creds.port;
    let authVerified = false;

    // Test primary port (465 SSL)
    try {
      diagnosticLogs.push(`Attempt 1: Verifying SSL connection on port ${creds.port}...`);
      const trans465 = await createTransporter(creds.port, creds.port === 465);
      await trans465.verify();
      diagnosticLogs.push(`[SUCCESS] Port ${creds.port} verified and authenticated successfully!`);
      activeTransporter = trans465;
      workingPort = creds.port;
      authVerified = true;
    } catch (err465: any) {
      diagnosticLogs.push(`[WARN] Port ${creds.port} verification failed: ${err465.message}`);

      // Fallback: Test alternative port 587 (STARTTLS)
      try {
        const altPort = creds.port === 465 ? 587 : 465;
        diagnosticLogs.push(`Attempt 2: Trying alternative port ${altPort}...`);
        const transAlt = await createTransporter(altPort, altPort === 465);
        await transAlt.verify();
        diagnosticLogs.push(`[SUCCESS] Port ${altPort} verified and authenticated successfully!`);
        activeTransporter = transAlt;
        workingPort = altPort;
        authVerified = true;
      } catch (errAlt: any) {
        diagnosticLogs.push(`[FAIL] Port ${creds.port === 465 ? 587 : 465} also failed: ${errAlt.message}`);
        throw new Error(`SMTP Authentication failed on all tested ports: ${err465.message}`);
      }
    }

    let messageId: string | null = null;
    if (sendActualEmail && activeTransporter) {
      diagnosticLogs.push(`Dispatching live test email to: ${recipient}...`);
      const info = await activeTransporter.sendMail({
        from: creds.from,
        to: recipient,
        subject: `[TCC System Test] Hostinger SMTP Email Verification - ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
            <div style="background: #111827; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Transformation City Church</h2>
              <p style="color: #d1d5db; margin: 4px 0 0 0; font-size: 13px;">Hostinger SMTP Live Test Notification</p>
            </div>
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">
              This is a test notification confirming that the outgoing email integration for <strong>tcchurch.co.za</strong> is operational.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">SMTP Server:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">${creds.host}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Working Port:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">${workingPort} (${workingPort === 465 ? 'SSL' : 'STARTTLS'})</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Sender:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">${creds.user}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Timestamp:</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">${new Date().toISOString()}</td>
              </tr>
            </table>
            <div style="padding: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; color: #065f46; font-size: 14px; margin-top: 16px;">
              &#10003; <strong>Status:</strong> SMTP connection and delivery verified successfully.
            </div>
          </div>
        `,
      });
      messageId = info.messageId || null;
      diagnosticLogs.push(`[SUCCESS] Test email dispatched! MessageId: ${messageId}`);
    }

    return res.status(200).json({
      success: true,
      authVerified: true,
      workingPort,
      host: creds.host,
      sender: creds.user,
      recipient,
      sentEmail: sendActualEmail,
      messageId,
      logs: diagnosticLogs,
    });
  } catch (error: any) {
    console.error("[SMTP Live Test Error]:", error);
    return res.status(500).json({
      success: false,
      authVerified: false,
      error: error.message || "Failed to verify SMTP credentials",
      host: creds.host,
      port: creds.port,
      user: creds.user,
      logs: diagnosticLogs,
    });
  }
}

app.get("/api/test-smtp", handleTestSmtp);
app.post("/api/test-smtp", handleTestSmtp);

// Helper to determine file category and MIME types
function getFileCategoryAndMime(fileName: string, rawMime?: string | null): { category: 'audio' | 'notes' | 'video' | 'other'; mimeType: string; isAudio: boolean; isNotes: boolean } {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  
  if (['mp3', 'm4a', 'wav', 'aac', 'ogg', 'flac', 'opus'].includes(ext) || rawMime?.startsWith('audio/')) {
    const mime = ext === 'mp3' ? 'audio/mpeg' : ext === 'm4a' ? 'audio/mp4' : ext === 'wav' ? 'audio/wav' : rawMime || 'audio/mpeg';
    return { category: 'audio', mimeType: mime, isAudio: true, isNotes: false };
  }
  
  if (['pdf', 'docx', 'doc', 'txt', 'rtf', 'odt', 'ppt', 'pptx'].includes(ext) || rawMime?.includes('pdf') || rawMime?.includes('word') || rawMime?.includes('document')) {
    const mime = ext === 'pdf' ? 'application/pdf' : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : ext === 'doc' ? 'application/msword' : ext === 'txt' ? 'text/plain' : rawMime || 'application/pdf';
    return { category: 'notes', mimeType: mime, isAudio: false, isNotes: true };
  }

  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || rawMime?.startsWith('video/')) {
    return { category: 'video', mimeType: rawMime || 'video/mp4', isAudio: false, isNotes: false };
  }

  return { category: 'other', mimeType: rawMime || 'application/octet-stream', isAudio: false, isNotes: false };
}

// Google Drive API proxy & collateral listing
app.get("/api/drive/files", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const folderId = (req.query.folderId as string) || "1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM";

  try {
    const driveFolderUrl = `https://drive.google.com/drive/folders/${folderId}`;
    const response = await fetch(driveFolderUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = await response.text();
    const files: any[] = [];
    const seenIds = new Set<string>();

    const jsonMatches = html.matchAll(/\["([a-zA-Z0-9_-]{25,})",\["([^"]+)"/g);
    for (const match of jsonMatches) {
      const id = match[1];
      let name = match[2];
      try { name = decodeURIComponent(JSON.parse(`"${name}"`)); } catch {}

      if (id && name && !seenIds.has(id)) {
        seenIds.add(id);
        const { category, mimeType, isAudio, isNotes } = getFileCategoryAndMime(name);
        files.push({
          id,
          name,
          mimeType,
          category,
          isAudio,
          isNotes,
          webViewLink: `https://drive.google.com/file/d/${id}/view`,
          streamUrl: isAudio ? `/api/drive/stream/${id}` : undefined,
          downloadUrl: `/api/drive/download/${id}?filename=${encodeURIComponent(name)}`,
          notesViewUrl: isNotes ? `/api/drive/notes/view/${id}?filename=${encodeURIComponent(name)}` : undefined,
        });
      }
    }

    return res.json({
      success: true,
      folderId,
      totalFiles: files.length,
      files,
    });
  } catch (err: any) {
    console.error("[Drive Files API Error]:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch Drive files",
    });
  }
});

// Google Drive Stream Proxy
app.get("/api/drive/stream/:fileId", async (req, res) => {
  const { fileId } = req.params;
  try {
    const driveUrl = `https://docs.google.com/uc?export=open&id=${fileId}`;
    const response = await fetch(driveUrl, {
      headers: req.headers.range ? { Range: req.headers.range } : undefined,
    });

    if (!response.ok && response.status !== 206) {
      return res.redirect(`https://drive.google.com/uc?export=download&id=${fileId}`);
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    const contentLength = response.headers.get("content-length");
    const contentRange = response.headers.get("content-range");
    const acceptRanges = response.headers.get("accept-ranges") || "bytes";

    res.status(response.status);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Accept-Ranges", acceptRanges);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (contentRange) res.setHeader("Content-Range", contentRange);

    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error("[Stream API Error]:", err);
    res.redirect(`https://drive.google.com/uc?export=download&id=${fileId}`);
  }
});

// Google Drive Download Proxy
app.get("/api/drive/download/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const filename = (req.query.filename as string) || "file";
  try {
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const response = await fetch(driveUrl);

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/octet-stream");

    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error("[Download API Error]:", err);
    res.redirect(`https://drive.google.com/uc?export=download&id=${fileId}`);
  }
});

// Audio proxy & general download routes
app.get("/api/audio-proxy", async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).send("Missing url parameter");
  try {
    const response = await fetch(url, {
      headers: req.headers.range ? { Range: req.headers.range } : undefined,
    });
    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") || "audio/mpeg");
    res.setHeader("Accept-Ranges", "bytes");
    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    res.redirect(url);
  }
});

app.get("/api/audio-download", async (req, res) => {
  const url = req.query.url as string;
  const filename = (req.query.filename as string) || "sermon.mp3";
  if (!url) return res.status(400).send("Missing url parameter");
  try {
    const response = await fetch(url);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("Content-Type", response.headers.get("content-type") || "audio/mpeg");
    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    res.redirect(url);
  }
});

// Endpoint to receive form submission and dispatch email to administrator
app.post("/api/submit-form", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const {
      formTitle,
      title,
      formType,
      ownerEmail,
      answers,
      data,
      destination,
      createdAt,
      submittedAt,
      formId,
    } = req.body || {};

    const rawData = answers || data;
    if (!rawData || typeof rawData !== "object") {
      return res.status(400).json({
        success: false,
        error: "Invalid request payload: 'answers' or 'data' object is required.",
      });
    }

    // Collect all admin recipients
    const rawRecipients = [
      "admin@transformationcitychurch.org",
      ownerEmail,
      "leonandalouw@outlook.com",
    ];
    const recipientsList = Array.from(new Set(rawRecipients.filter(Boolean)));
    const recipientString = recipientsList.join(", ");

    const displayTitle = formTitle || title || formType || "Transformation City Church Form";
    const timestamp = createdAt || submittedAt || new Date().toISOString();
    const formattedDate = new Date(timestamp).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

    // Format fields into clean HTML table and plain text
    let fieldsText = "";
    let fieldsHtml = "";

    Object.entries(rawData).forEach(([key, value]) => {
      const displayKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      const displayVal = Array.isArray(value) ? value.join(", ") : String(value ?? "");
      fieldsText += `- ${displayKey}: ${displayVal}\n`;
      fieldsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 14px; font-weight: bold; color: #1e293b; background-color: #f8fafc; width: 35%; border-right: 1px solid #e2e8f0;">${displayKey}</td>
          <td style="padding: 10px 14px; color: #334155;">${displayVal || '<em style="color:#94a3b8">N/A</em>'}</td>
        </tr>
      `;
    });

    const emailSubject = `[TCC Form Submission] ${displayTitle}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${displayTitle}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          <div style="background-color: #a52424; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
              Transformation City Church
            </h1>
            <p style="color: #fecdd3; margin: 4px 0 0 0; font-size: 13px;">Form Submission Notification</p>
          </div>
          <div style="padding: 24px;">
            <div style="margin-bottom: 20px; padding: 12px 16px; background-color: #fff1f2; border-left: 4px solid #a52424; border-radius: 4px;">
              <h2 style="margin: 0 0 4px 0; font-size: 16px; color: #881337;">${displayTitle}</h2>
              <p style="margin: 0; font-size: 12px; color: #9f1239;">Submitted on ${formattedDate}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #0f172a; color: #ffffff;">
                  <th style="padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase;">Field</th>
                  <th style="padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase;">Submitted Response</th>
                </tr>
              </thead>
              <tbody>
                ${fieldsHtml}
              </tbody>
            </table>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
              Target Admin Recipients: <strong>${recipientString}</strong><br/>
              Transformation City Church Automated Form Notification
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const plainTextBody = `
NEW FORM SUBMISSION: ${displayTitle}
Submitted at: ${formattedDate}
Recipients: ${recipientString}

---------------------------------------------------
RESPONSES:
${fieldsText}
---------------------------------------------------
Transformation City Church Form System
    `;

    const creds = getSmtpCredentials();
    const mailOptions = {
      from: creds.from,
      to: recipientString,
      subject: emailSubject,
      text: plainTextBody,
      html: htmlBody,
      replyTo: (rawData as any).email || (rawData as any)['Email Address'] || (rawData as any)['Email'] || undefined,
    };

    let info: any = null;
    try {
      // Try primary port (465 SSL)
      const primaryTransporter = await createTransporter(creds.port, creds.port === 465);
      info = await primaryTransporter.sendMail(mailOptions);
    } catch (primaryErr: any) {
      console.warn(`[Form Dispatch Warning] Port ${creds.port} failed (${primaryErr.message}). Retrying with STARTTLS on port 587...`);
      // Fallback to port 587 STARTTLS
      const fallbackTransporter = await createTransporter(587, false);
      info = await fallbackTransporter.sendMail(mailOptions);
    }

    console.log(`[Form Dispatch] Sent email for "${displayTitle}" to [${recipientString}]. MessageId:`, info?.messageId || "N/A");

    return res.status(200).json({
      success: true,
      message: `Form submitted and email dispatched via Hostinger SMTP to ${recipientString}`,
      recipients: recipientsList,
      smtpConfigured: true,
      messageId: info?.messageId || null,
    });
  } catch (err: any) {
    console.error("[Form Submission API Error]:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error submitting form",
    });
  }
});

// Explicit API 404 handler - prevents any unhandled /api/* request from falling through to SPA HTML
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.use(async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({ success: false, error: "API route not found" });
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { maxAge: "1d", index: false }));
    app.use((req, res) => {
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({ success: false, error: "API route not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Transformation City Church server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
