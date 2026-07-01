export const packageOptions = new Set([
  "Purely Ceylon",
  "Island Treasures",
  "Best of Ceylon",
  "Pearl Island Journey",
  "Hidden Sri Lanka",
  "Adventure & Explore",
  "Custom trip",
]);

const normalizeField = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

export const isHoneypotTriggered = (payload) => Boolean(normalizeField(payload.company));

export const parseInquiryPayload = (payload) => ({
  name: normalizeField(payload.name),
  email: normalizeField(payload.email),
  phone: normalizeField(payload.phone),
  packageName: normalizeField(payload.package ?? payload.packageName),
  message: String(payload.message ?? "").trim(),
});

export const validateInquiry = (fields) => {
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

export const buildEmailText = (fields) =>
  [
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    `Phone: ${fields.phone || "Not provided"}`,
    `Package: ${fields.packageName}`,
    "",
    "Trip details:",
    fields.message,
  ].join("\n");

export const buildEmailHtml = ({ fields, logoUrl }) => {
  const htmlRows = [
    ["Name", fields.name],
    ["Email", fields.email],
    ["Phone", fields.phone || "Not provided"],
    ["Package", fields.packageName],
    ["Trip details", fields.message],
  ];

  return `
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
};
