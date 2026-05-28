import nodemailer from "nodemailer";

export const prerender = false;

const packageOptions = new Set([
  "Purely Ceylon",
  "Island Treasures",
  "Best of Ceylon",
  "Pearl Island Journey",
  "Hidden Sri Lanka",
  "Adventure & Explore",
  "Custom trip",
]);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const getEnv = (key) => import.meta.env[key] ?? process.env[key];

const readField = (formData, field) =>
  String(formData.get(field) ?? "")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const stripHeaderBreaks = (value) => value.replace(/[\r\n]+/g, " ").trim();

const buildEmailHtml = ({ fields, htmlRows, logoUrl }) => `
  <div style="margin: 0; padding: 0; background: #eef6fb; font-family: Arial, Helvetica, sans-serif; color: #0d1b2a;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
      New travel inquiry from ${escapeHtml(fields.name)} for ${escapeHtml(fields.packageName)}.
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background: #eef6fb;">
      <tr>
        <td align="center" style="padding: 28px 14px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 680px; border-collapse: collapse; overflow: hidden; border: 1px solid #d7e7f0; background: #ffffff;">
            <tr>
              <td style="padding: 0; background: #105598;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                  <tr>
                    <td style="padding: 22px 24px; background: linear-gradient(135deg, #105598 0%, #0d1b2a 62%, #1b9c50 100%);">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                        <tr>
                          <td style="vertical-align: middle;">
                            <img src="${escapeHtml(logoUrl)}" width="74" alt="Explore Asia Travels" style="display: block; width: 74px; max-width: 74px; height: auto; border: 0;" />
                          </td>
                          <td align="right" style="vertical-align: middle; color: #ffffff;">
                            <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; color: #d8b65a;">Explore Asia Travels</p>
                            <h1 style="margin: 0; font-size: 24px; line-height: 1.2; font-weight: 700; color: #ffffff;">New Travel Inquiry</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="height: 5px; background: linear-gradient(90deg, #1b9c50 0%, #d8b65a 50%, #105598 100%); font-size: 0; line-height: 0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 28px 24px 8px;">
                <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.7px; color: #1b9c50;">Inquiry Details</p>
                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #334155;">
                  A traveler submitted the contact form and is interested in
                  <strong style="color: #105598;">${escapeHtml(fields.packageName)}</strong>.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 14px 24px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate; border-spacing: 0 10px;">
                  ${htmlRows
                    .map(
                      ([label, value]) => `
                        <tr>
                          <td style="width: 150px; padding: 14px 16px; border-top: 1px solid #dbe7ef; border-bottom: 1px solid #dbe7ef; border-left: 4px solid #1b9c50; background: #f7fbfd; color: #105598; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; vertical-align: top;">
                            ${escapeHtml(label)}
                          </td>
                          <td style="padding: 14px 16px; border-top: 1px solid #dbe7ef; border-right: 1px solid #dbe7ef; border-bottom: 1px solid #dbe7ef; background: #ffffff; color: #0f172a; font-size: 15px; line-height: 1.6; vertical-align: top;">
                            ${escapeHtml(value).replace(/\n/g, "<br>")}
                          </td>
                        </tr>
                      `,
                    )
                    .join("")}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 0 24px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; background: #0d1b2a;">
                  <tr>
                    <td style="padding: 18px 20px; border-left: 5px solid #d8b65a;">
                      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.4px; color: #d8b65a;">Reply directly</p>
                      <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #ffffff;">
                        Replying to this email will respond to ${escapeHtml(fields.name)} at ${escapeHtml(fields.email)}.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const getSmtpErrorDetails = (error, config) => {
  const code = error?.code;
  const command = error?.command;
  const responseCode = error?.responseCode;
  const response = error?.response;
  const smtpTarget = `${config.host}:${config.port}`;

  if (code === "EAUTH" || responseCode === 535 || responseCode === 534) {
    return {
      type: "smtp_auth",
      reason: `Connected to the SMTP server, but authentication was rejected${response ? ` (${response})` : ""}. Check SMTP_USER and SMTP_PASS.`,
    };
  }

  if (code === "EENVELOPE" || command === "RCPT TO" || responseCode === 550 || responseCode === 553) {
    return {
      type: "smtp_recipient",
      reason: "The SMTP server rejected the sender or recipient address. Check CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL.",
    };
  }

  if (
    code === "ECONNECTION" ||
    code === "ESOCKET" ||
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    responseCode === 421
  ) {
    return {
      type: "smtp_connection",
      reason: `Could not connect to the SMTP server at ${smtpTarget}. This is a mail server, DNS, firewall, port, or SSL setting issue, not a contact form validation issue.`,
    };
  }

  return {
    type: "smtp_unknown",
    reason: `The SMTP server returned an unexpected error${response ? `: ${response}` : "."}`,
  };
};

const validateInquiry = (fields) => {
  const errors = {};

  if (fields.name.length < 2 || fields.name.length > 100) {
    errors.name = "Please enter a name between 2 and 100 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(fields.email) || fields.email.length > 160) {
    errors.email = "Please enter a valid email address.";
  }

  if (fields.phone && !/^[+()\d\s.-]{7,30}$/.test(fields.phone)) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (!packageOptions.has(fields.packageName)) {
    errors.package = "Please select a valid package.";
  }

  if (fields.message.length < 10 || fields.message.length > 1500) {
    errors.message = "Please enter trip details between 10 and 1500 characters.";
  }

  return errors;
};

export async function POST({ request }) {
  let formData;

  try {
    formData = await request.formData();
  } catch {
    return json(
      {
        ok: false,
        message: "Please submit the contact form again.",
      },
      400,
    );
  }

  const fields = {
    name: readField(formData, "name"),
    email: readField(formData, "email"),
    phone: readField(formData, "phone"),
    packageName: readField(formData, "package"),
    message: String(formData.get("message") ?? "").trim(),
  };

  const errors = validateInquiry(fields);

  if (Object.keys(errors).length > 0) {
    return json(
      {
        ok: false,
        message: Object.values(errors)[0],
        errors,
      },
      400,
    );
  }

  const smtpHost = getEnv("SMTP_HOST");
  const smtpPort = Number(getEnv("SMTP_PORT") ?? 465);
  const smtpUser = getEnv("SMTP_USER");
  const smtpPass = getEnv("SMTP_PASS");
  const smtpSecure = String(getEnv("SMTP_SECURE") ?? "true") === "true";
  const smtpFamily = Number(getEnv("SMTP_FAMILY") ?? 4);
  const fromEmail = getEnv("CONTACT_FROM_EMAIL") ?? smtpUser;
  const toEmail = getEnv("CONTACT_TO_EMAIL");
  const logoUrl = getEnv("CONTACT_LOGO_URL") ?? "https://www.exploreasiatravels.com/favicon.png";

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail || !toEmail) {
    console.error("Contact form SMTP environment variables are missing.");

    return json(
      {
        ok: false,
        message: "Email is not configured yet. Please call or WhatsApp us for urgent help.",
      },
      500,
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    family: smtpFamily,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const safeName = stripHeaderBreaks(fields.name);
  const safeEmail = stripHeaderBreaks(fields.email);
  const subject = `New travel inquiry from ${safeName}`;
  const htmlRows = [
    ["Name", fields.name],
    ["Email", fields.email],
    ["Phone", fields.phone || "Not provided"],
    ["Package", fields.packageName],
    ["Trip details", fields.message],
  ];

  try {
    await transporter.sendMail({
      from: `"Explore Asia Travels" <${fromEmail}>`,
      to: toEmail,
      replyTo: `"${safeName}" <${safeEmail}>`,
      subject,
      text: [
        `Name: ${fields.name}`,
        `Email: ${fields.email}`,
        `Phone: ${fields.phone || "Not provided"}`,
        `Package: ${fields.packageName}`,
        "",
        "Trip details:",
        fields.message,
      ].join("\n"),
      html: buildEmailHtml({ fields, htmlRows, logoUrl }),
    });

    return json({
      ok: true,
      message: "Thank you. Your inquiry was sent successfully.",
    });
  } catch (error) {
    const smtpError = getSmtpErrorDetails(error, {
      host: smtpHost,
      port: smtpPort,
    });

    console.error("Contact form email failed:", {
      type: smtpError.type,
      reason: smtpError.reason,
      code: error?.code,
      command: error?.command,
      responseCode: error?.responseCode,
      response: error?.response,
      address: error?.address,
      port: error?.port,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpFamily,
    });

    return json(
      {
        ok: false,
        type: smtpError.type,
        message: "Message failed. Please contact us on WhatsApp.",
      },
      500,
    );
  }
}
