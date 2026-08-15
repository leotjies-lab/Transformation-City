import express from "express";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { Readable } from "stream";

const app = express();
const PORT = 3000;

app.use(express.json());

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

async function createTransporter(customPort?: number) {
  const creds = getSmtpCredentials();
  const port = customPort || creds.port;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: creds.host,
    port: port,
    secure: isSecure, // true for 465, false for 587
    auth: {
      user: creds.user,
      pass: creds.pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents certificate verification failures on custom domains
    },
  });
}

// API Health & SMTP Status Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/smtp-status", (req, res) => {
  const creds = getSmtpCredentials();
  res.json({
    configured: true,
    host: creds.host,
    user: creds.user,
    from: creds.from,
    recipients: ["admin@transformationcitychurch.org", "leonandalouw@outlook.com"]
  });
});

// Helper to fetch files from Google Drive folder
async function getDriveFolderFiles(folderId: string = "1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM"): Promise<any[]> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const driveFolderUrl = `https://drive.google.com/drive/folders/${folderId}`;
  let files: any[] = [];

  if (apiKey) {
    try {
      const queryStr = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const fields = encodeURIComponent('files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink)');
      const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${queryStr}&fields=${fields}&key=${apiKey}`;

      const driveRes = await fetch(driveUrl);
      if (driveRes.ok) {
        const driveData = await driveRes.json();
        if (Array.isArray(driveData.files) && driveData.files.length > 0) {
          files = driveData.files;
        }
      }
    } catch (e) {
      console.warn("Drive API Key fetch error:", e);
    }
  }

  if (files.length === 0) {
    try {
      const resHtml = await fetch(driveFolderUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (resHtml.ok) {
        const html = await resHtml.text();
        const fileMap = new Map();

        const rowRegex = /<tr[^>]*data-id=["']([a-zA-Z0-9_-]{25,})["'][^>]*>([\s\S]*?)<\/tr>/g;
        let rowMatch;
        while ((rowMatch = rowRegex.exec(html)) !== null) {
          const fileId = rowMatch[1];
          const rowContent = rowMatch[2];

          const nameMatch = rowContent.match(/aria-label=["']([^"']+)["']/) ||
                            rowContent.match(/["']>([^<]+\.(?:mp3|m4a|wav|aac|ogg|wma|pdf|docx?|txt|jpg|png))</i) ||
                            rowContent.match(/([^\s<>]+\.(?:mp3|m4a|wav|aac|ogg|wma))/i);

          let rawName = nameMatch ? nameMatch[1] : '';
          let cleanName = rawName
            .replace(/\s*(Audio|Shared|File|Video|Document|Folder)+\s*/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (!cleanName) {
            cleanName = `Sermon Recording (${fileId.substring(0, 8)})`;
          }

          let createdTime = new Date().toISOString();
          const dateMatch = cleanName.match(/(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])/);
          if (dateMatch) {
            createdTime = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T10:00:00.000Z`;
          }

          if (fileId && !fileMap.has(fileId)) {
            fileMap.set(fileId, {
              id: fileId,
              name: cleanName,
              mimeType: cleanName.toLowerCase().endsWith('.mp3') ? 'audio/mpeg' : 'audio/m4a',
              createdTime,
              webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
              webContentLink: `https://docs.google.com/uc?export=download&id=${fileId}`
            });
          }
        }

        const driveItemsRegex = /\[["']([a-zA-Z0-9_-]{28,35})["']\s*,\s*\[?["']([^"']+\.(?:mp3|m4a|wav|aac|ogg|wma|mp4|mov))["']/gi;
        let itemMatch;
        while ((itemMatch = driveItemsRegex.exec(html)) !== null) {
          const fileId = itemMatch[1];
          let rawName = itemMatch[2];
          let cleanName = rawName
            .replace(/\s*(Audio|Shared|File|Video|Document|Folder)+\s*/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          let createdTime = new Date().toISOString();
          const dateMatch = cleanName.match(/(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])/);
          if (dateMatch) {
            createdTime = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T10:00:00.000Z`;
          }

          if (!fileMap.has(fileId)) {
            fileMap.set(fileId, {
              id: fileId,
              name: cleanName,
              mimeType: cleanName.toLowerCase().endsWith('.mp3') ? 'audio/mpeg' : 'audio/m4a',
              createdTime,
              webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
              webContentLink: `https://docs.google.com/uc?export=download&id=${fileId}`
            });
          }
        }

        files = Array.from(fileMap.values());
      }
    } catch (err) {
      console.warn("Public Drive HTML parser error:", err);
    }
  }

  return files;
}

// Google Drive Folder Files Listing Endpoint
app.get("/api/drive/files", async (req, res) => {
  const folderId = (req.query.folderId as string) || "1qi4li-RY2flBnRt6wLfnpXpu4JeY_yVM";
  const driveFolderUrl = `https://drive.google.com/drive/folders/${folderId}`;

  try {
    const files = await getDriveFolderFiles(folderId);

    return res.json({
      success: true,
      folderId,
      folderUrl: driveFolderUrl,
      account: "tccmedia123@gmail.com",
      files,
      message: files.length > 0 ? `Loaded ${files.length} audio file(s) from Google Drive` : "Connected to Google Drive folder"
    });
  } catch (err: any) {
    return res.json({
      success: true,
      folderId,
      folderUrl: driveFolderUrl,
      account: "tccmedia123@gmail.com",
      files: [],
      error: err.message
    });
  }
});

// Helper to fetch Google Drive audio stream robustly
async function fetchDriveAudioStream(fileId: string, rangeHeader?: string) {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const forwardHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };
  if (rangeHeader) {
    forwardHeaders['Range'] = rangeHeader;
  }

  const candidateUrls = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    `https://docs.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    ...(apiKey ? [`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`] : [])
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { headers: forwardHeaders });
      const cType = res.headers.get("content-type") || "";
      if (res.ok && !cType.includes("text/html")) {
        return res;
      }
    } catch (e) {
      console.warn(`Failed to fetch Drive stream candidate URL (${url}):`, e);
    }
  }
  return null;
}

// Helper to normalize audio MIME types for HTML5 audio elements
function normalizeAudioMimeType(filename: string, rawMimeType?: string | null): string {
  if (rawMimeType && !rawMimeType.includes("octet-stream") && !rawMimeType.includes("text/html") && rawMimeType.startsWith("audio/")) {
    return rawMimeType;
  }
  const lower = (filename || "").toLowerCase();
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".m4a")) return "audio/m4a";
  if (lower.endsWith(".aac")) return "audio/aac";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".ogg") || lower.endsWith(".oga")) return "audio/ogg";
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".flac")) return "audio/flac";
  if (lower.endsWith(".mp4")) return "audio/mp4";
  return "audio/mpeg"; // Standard default for web audio player
}

// Google Drive Stream Proxy by Exact Filename
app.get("/api/drive/stream-by-name", async (req, res) => {
  const fileName = req.query.filename as string;
  if (!fileName) {
    return res.status(400).send("Filename parameter required");
  }

  try {
    const files = await getDriveFolderFiles();
    const cleanQueryName = fileName.trim().toLowerCase();

    const targetFile = files.find(f => {
      const name = f.name.trim().toLowerCase();
      return name === cleanQueryName || 
             name.replace(/\.[^/.]+$/, "") === cleanQueryName.replace(/\.[^/.]+$/, "");
    });

    if (targetFile && targetFile.id) {
      const audioRes = await fetchDriveAudioStream(targetFile.id, req.headers.range as string);
      if (audioRes) {
        const rawContentType = audioRes.headers.get("content-type");
        const contentType = normalizeAudioMimeType(targetFile.name || fileName, rawContentType);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Accept-Ranges", "bytes");

        if (audioRes.headers.get("content-length")) {
          res.setHeader("Content-Length", audioRes.headers.get("content-length")!);
        }
        if (audioRes.headers.get("content-range")) {
          res.setHeader("Content-Range", audioRes.headers.get("content-range")!);
        }

        res.status(audioRes.status);
        if (audioRes.body) {
          return Readable.fromWeb(audioRes.body as any).pipe(res);
        } else {
          return res.end();
        }
      }
    }

    return res.status(404).json({ error: `Audio file "${fileName}" not found in Google Drive folder` });
  } catch (err: any) {
    console.error("Stream by name error:", err);
    return res.status(500).send("Server audio stream error");
  }
});

// Google Drive Direct Download Proxy by Exact Filename
app.get("/api/drive/download-by-name", async (req, res) => {
  const fileName = req.query.filename as string;
  const customTitle = (req.query.title as string) || "sermon-recording.mp3";

  if (!fileName) {
    return res.status(400).send("Filename parameter required");
  }

  try {
    const files = await getDriveFolderFiles();
    const cleanQueryName = fileName.trim().toLowerCase();

    const targetFile = files.find(f => {
      const name = f.name.trim().toLowerCase();
      return name === cleanQueryName || 
             name.replace(/\.[^/.]+$/, "") === cleanQueryName.replace(/\.[^/.]+$/, "");
    });

    if (targetFile && targetFile.id) {
      const audioRes = await fetchDriveAudioStream(targetFile.id);
      if (audioRes) {
        const contentType = audioRes.headers.get("content-type") || "audio/mpeg";
        if (contentType.includes("html")) {
          return res.status(404).send("Google Drive returned HTML instead of audio media file");
        }

        const rawDownloadName = targetFile.name || fileName || customTitle;
        const sanitizedFilename = rawDownloadName.replace(/[^\w\s.-]/g, "").trim();
        const finalFilename = sanitizedFilename.endsWith(".mp3") ? sanitizedFilename : `${sanitizedFilename}.mp3`;

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${finalFilename}"`);
        res.setHeader("Access-Control-Allow-Origin", "*");

        if (audioRes.headers.get("content-length")) {
          res.setHeader("Content-Length", audioRes.headers.get("content-length")!);
        }

        if (audioRes.body) {
          return Readable.fromWeb(audioRes.body as any).pipe(res);
        } else {
          return res.end();
        }
      }
    }

    return res.status(404).send(`Audio file "${fileName}" not found in Google Drive folder`);
  } catch (err: any) {
    console.error("Download by name error:", err);
    return res.status(500).send("Server audio download error");
  }
});

// Google Drive Stream Proxy
app.get("/api/drive/stream/:fileId", async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    return res.status(400).send("File ID required");
  }

  try {
    const audioRes = await fetchDriveAudioStream(fileId, req.headers.range as string);

    if (!audioRes) {
      return res.status(404).json({ error: "Unable to stream audio file from Google Drive" });
    }

    const rawContentType = audioRes.headers.get("content-type");
    if (rawContentType && rawContentType.includes("html")) {
      return res.status(404).json({ error: "Google Drive returned an HTML page instead of audio" });
    }

    const filenameHint = (req.query.filename as string) || "file.mp3";
    const contentType = normalizeAudioMimeType(filenameHint, rawContentType);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Accept-Ranges", "bytes");

    if (audioRes.headers.get("content-length")) {
      res.setHeader("Content-Length", audioRes.headers.get("content-length")!);
    }
    if (audioRes.headers.get("content-range")) {
      res.setHeader("Content-Range", audioRes.headers.get("content-range")!);
    }

    res.status(audioRes.status);
    if (audioRes.body) {
      Readable.fromWeb(audioRes.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error("Audio stream proxy error:", err);
    return res.status(500).send("Server audio stream error");
  }
});

// Google Drive Direct Download Proxy
app.get("/api/drive/download/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const fileName = (req.query.filename as string) || "sermon-recording.mp3";

  if (!fileId) {
    return res.status(400).send("File ID required");
  }

  try {
    const audioRes = await fetchDriveAudioStream(fileId);

    if (!audioRes) {
      return res.status(404).send("Unable to download audio file from Google Drive");
    }

    const contentType = audioRes.headers.get("content-type") || "audio/mpeg";
    if (contentType.includes("html")) {
      return res.status(404).send("Google Drive returned HTML instead of audio media file");
    }

    const sanitizedFilename = fileName.replace(/[^\w\s.-]/g, "").trim();
    const finalFilename = sanitizedFilename.endsWith(".mp3") ? sanitizedFilename : `${sanitizedFilename}.mp3`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${finalFilename}"`);
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (audioRes.headers.get("content-length")) {
      res.setHeader("Content-Length", audioRes.headers.get("content-length")!);
    }

    if (audioRes.body) {
      return Readable.fromWeb(audioRes.body as any).pipe(res);
    } else {
      return res.end();
    }
  } catch (err: any) {
    console.error("Audio download proxy error:", err);
    return res.status(500).send("Server audio download error");
  }
});

// General Audio Proxy Endpoint for external MP3/Audio links
app.get("/api/audio-proxy", async (req, res) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    return res.status(400).send("URL parameter is required");
  }

  try {
    const driveMatch = rawUrl.match(/(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (driveMatch && driveMatch[1]) {
      return res.redirect(`/api/drive/stream/${driveMatch[1]}`);
    }

    const audioRes = await fetch(rawUrl);
    if (!audioRes.ok) {
      return res.status(audioRes.status).send("Failed to fetch audio stream");
    }

    const contentType = audioRes.headers.get("content-type") || "audio/mpeg";
    if (contentType.includes("html")) {
      return res.status(404).send("Requested URL returned HTML page instead of audio file");
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Accept-Ranges", "bytes");

    const arrayBuffer = await audioRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error("Audio proxy error:", err);
    return res.status(500).send("Error proxying audio file");
  }
});

// General Direct Audio Download Proxy
app.get("/api/audio-download", async (req, res) => {
  const rawUrl = req.query.url as string;
  const fileName = (req.query.filename as string) || "sermon-recording.mp3";

  if (!rawUrl) {
    return res.status(400).send("URL parameter is required");
  }

  try {
    const driveMatch = rawUrl.match(/(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (driveMatch && driveMatch[1]) {
      return res.redirect(`/api/drive/download/${driveMatch[1]}?filename=${encodeURIComponent(fileName)}`);
    }

    const audioRes = await fetch(rawUrl);
    if (!audioRes.ok) {
      return res.status(audioRes.status).send("Failed to download audio file");
    }

    const contentType = audioRes.headers.get("content-type") || "audio/mpeg";
    if (contentType.includes("html")) {
      return res.status(404).send("Requested URL returned HTML page instead of audio file");
    }

    const sanitizedFilename = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const finalFilename = sanitizedFilename.endsWith(".mp3") ? sanitizedFilename : `${sanitizedFilename}.mp3`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${finalFilename}"`);
    res.setHeader("Access-Control-Allow-Origin", "*");

    const arrayBuffer = await audioRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error("Audio download proxy error:", err);
    return res.status(500).send("Error downloading audio file");
  }
});

// Endpoint to receive form submission and dispatch email to administrator
app.post("/api/submit-form", async (req, res) => {
  try {
    const { formTitle, ownerEmail, answers, destination, createdAt, formId } = req.body;

    // Collect all admin recipients (ensuring admin@transformationcitychurch.org is included)
    const rawRecipients = [
      "admin@transformationcitychurch.org",
      ownerEmail,
      "leonandalouw@outlook.com"
    ];
    const recipientsList = Array.from(new Set(rawRecipients.filter(Boolean)));
    const recipientString = recipientsList.join(", ");

    const title = formTitle || "Transformation City Church Form";
    const submittedTime = createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString();

    // Format fields into clean HTML table and text format
    let fieldsText = "";
    let fieldsHtml = "";

    if (answers && typeof answers === "object") {
      Object.entries(answers).forEach(([key, value]) => {
        const displayVal = Array.isArray(value) ? value.join(", ") : String(value ?? "");
        fieldsText += `- ${key}: ${displayVal}\n`;
        fieldsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; font-weight: bold; color: #1e293b; background-color: #f8fafc; width: 35%; border-right: 1px solid #e2e8f0;">${key}</td>
            <td style="padding: 10px 14px; color: #334155;">${displayVal || '<em style="color:#94a3b8">N/A</em>'}</td>
          </tr>
        `;
      });
    } else {
      fieldsText = "No response answers provided.";
      fieldsHtml = '<tr><td colspan="2" style="padding: 12px; text-align: center; color: #64748b;">No response answers provided.</td></tr>';
    }

    const emailSubject = `[TCC Form Submission] ${title}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
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
              <h2 style="margin: 0 0 4px 0; font-size: 16px; color: #881337;">${title}</h2>
              <p style="margin: 0; font-size: 12px; color: #9f1239;">Submitted on ${submittedTime}</p>
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
NEW FORM SUBMISSION: ${title}
Submitted at: ${submittedTime}
Recipients: ${recipientString}

---------------------------------------------------
RESPONSES:
${fieldsText}
---------------------------------------------------
Transformation City Church Form System
    `;

    const creds = getSmtpCredentials();
    const fromAddress = creds.from;

    const mailOptions = {
      from: fromAddress,
      to: recipientString,
      subject: emailSubject,
      text: plainTextBody,
      html: htmlBody,
    };

    let info: any = null;
    try {
      // Try primary port (465 SSL)
      const primaryTransporter = await createTransporter(creds.port);
      info = await primaryTransporter.sendMail(mailOptions);
    } catch (primaryErr: any) {
      console.warn(`[Form Dispatch Warning] Port ${creds.port} failed (${primaryErr.message}). Retrying with STARTTLS on port 587...`);
      // Fallback to port 587 STARTTLS
      const fallbackTransporter = await createTransporter(587);
      info = await fallbackTransporter.sendMail(mailOptions);
    }

    console.log(`[Form Dispatch] Sent email for "${title}" to [${recipientString}]. MessageId:`, info.messageId || "N/A");

    return res.status(200).json({
      success: true,
      message: `Form submitted and email dispatched via Hostinger SMTP to ${recipientString}`,
      recipients: recipientsList,
      smtpConfigured: true,
      messageId: info.messageId || null,
    });
  } catch (err: any) {
    console.error("[Form Submission API Error]:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error submitting form",
    });
  }
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
        return next();
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
    app.use(express.static(distPath));
    app.use((req, res) => {
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
