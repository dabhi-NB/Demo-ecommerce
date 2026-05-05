import { getAllSettings } from './settingsHelper';

export async function renderEmailLayout(
  body: string,
  sitename: string = "App",
  sitelogo: string = "App Logo"
): Promise<string> {
  let logoSrc = sitelogo;

  // Fetch settings to get logo URL
  const settings = await getAllSettings();
  const baseUrl = process.env.APP_URL || 'http://127.0.0.1:5000';

  if (settings['setting.app_logo']) {
    logoSrc = `${baseUrl}/${settings['setting.app_logo']}`;
  } else if (!logoSrc || logoSrc === "App Logo") {
    logoSrc = sitename;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${sitename}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:30px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#fff; border-radius:8px; overflow:hidden;">
                
                <!-- Header -->
                <tr>
                  <td style=" padding:20px 30px;  font-size:24px; font-weight:bold; text-align:center;">
                    <img src="${logoSrc}" alt="${sitename}" style="max-width:100px; height:50px;" />

                  </td>
                </tr>
 <tr>
                <td style="height:4px; background-color:#85b33a;"></td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:20px; font-family: Arial, sans-serif; font-size:16px; color:#333;">
                    ${body}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f0f0f0; padding:20px 30px; text-align:center; color:#888; font-size:13px;">
                    &copy; ${new Date().getFullYear()}. All rights reserved.
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
