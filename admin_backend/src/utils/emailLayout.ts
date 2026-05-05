export function renderEmailLayout(
  body: string,
  sitename: string ,
  logoUrl: string,
  ): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${sitename}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#d9d9d9; font-family: Arial, sans-serif; color:#222;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:30px 0;">
        <tr>
          <td align="center">
            <!-- Card -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" 
                   style="background-color:#fff; border-radius:16px; border:1px solid #e5e5e5; box-shadow:0 10px 30px rgba(0,0,0,0.1); overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background-color:#ffffff; padding:10px 30px; border-bottom:1px solid #e5e5e5;">
                  <img src="${logoUrl}" alt="Logo" style="width:60px; height:60px; display:block; margin:0 auto;" />
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:30px; background-color:#ffffff; color:#000; line-height:1.6; text-align:center;">
                   ${body}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="padding:16px 30px; background-color:#ffffff; border-top:1px solid #e5e5e5; font-size:13px; color:#888;">
                  &copy; ${sitename} ${new Date().getFullYear()}. All rights reserved.
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
