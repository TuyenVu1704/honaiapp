import { verify } from 'crypto'

const baseTemplate = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{{title}}</title>
  <style type="text/css">
    /* Reset styles */
    body, #bodyTable, #bodyCell { height: 100% !important; margin: 0; padding: 0; width: 100% !important; }
    table { border-collapse: collapse; }
    img, a img { border: 0; outline: none; text-decoration: none; }
    h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
    p { margin: 1em 0; }

    /* Client-specific styles */
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    #outlook a { padding: 0; }
    img { -ms-interpolation-mode: bicubic; }
    body, table, td, p, a, li, blockquote { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }

    /* General styles */
    #bodyCell { padding: 20px; }
    #templateContainer { width: 600px; }
    body, #bodyTable { background-color: #F5F5F5; }
    #bodyCell { border-top: 4px solid #BBBBBB; }
    #templateContainer { border: 1px solid #BBBBBB; }
    h1 { color: #202020 !important; font-family: Helvetica; font-size: 26px; font-weight: bold; line-height: 100%; text-align: left; }
    h2 { color: #404040 !important; font-family: Helvetica; font-size: 20px; font-weight: bold; line-height: 100%; text-align: left; }
    span { color: #5460ff; font-family: Helvetica; font-size: 18px; line-height: 100%; text-align: left;}
    #templateBody { background-color: #F5F5F5; border-top: 1px solid #FFFFFF; border-bottom: 1px solid #CCCCCC; }
    .bodyContent { color: #505050; font-family: Helvetica; font-size: 14px; line-height: 150%; padding: 20px; }
    .bodyContent a:link, .bodyContent a:visited, .bodyContent a .yshortcuts { color: #EB4102; font-weight: normal; text-decoration: underline; }
    .bodyContent img { display: inline; height: auto; max-width: 560px; }
    
    /* Button styles */
    
    .buttonContent a { color: #FFFFFF; display: block; font-family: Helvetica; font-size: 18px; font-weight: bold; line-height: 100%; padding: 15px; text-decoration: none; }

    /* Mobile styles */
    @media only screen and (max-width: 480px) {
      body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: none !important; }
      body { width: 100% !important; min-width: 100% !important; }
      #bodyCell { padding: 10px !important; }
      #templateContainer { max-width: 600px !important; width: 100% !important; }
      h1 { font-size: 24px !important; line-height: 100% !important; }
      h2 { font-size: 20px !important; line-height: 100% !important; }
      span { font-size: 18px !important; line-height: 100% !important; }
      .bodyContent { font-size: 18px !important; line-height: 125% !important; }
      .bodyContent img { height: auto !important; max-width: 560px !important; width: 100% !important; }
      .buttonContent { max-width: 600px !important; width: 100% !important; }
      .buttonContent a { font-size: 20px !important; padding: 15px !important; }
    }
  </style>
</head>
<body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0">
  <center>
    <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
      <tr>
        <td align="center" valign="top" id="bodyCell">
          <table border="0" cellpadding="0" cellspacing="0" id="templateContainer">
            <tr>
              <td align="center" valign="top">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateBody">
                  <tr>
                    <td valign="top" class="bodyContent">
                      {{content}}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`

const templates: Record<string, string> = {
  verifyDevice: `
    <h1>New Device Login Detected</h1>
    <p>Hello {{name}},</p>
    <p>We detected a login attempt from a new device. If this was you, please verify your device by clicking the button below:</p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="buttonContent">
      <tr>
        <td align="center" valign="middle">
          <a href="{{verificationUrl}}" target="_blank">Verify Device</a>
        </td>
      </tr>
    </table>
    <p>If you didn't attempt to log in, please change your password immediately.</p>
    <span>This link will expire in {{expirationTime}}.</span>
    <p>Best regards,<br>Your App Team</p>
  `,
  // Thêm các mẫu email khác ở đây
  verifyEmail: `
    <h1>Verify Your Email Address</h1>
    <p>Hello {{name}},</p>
    <p>Congratulations on being a member of Ho Nai Company Limited! Please click the button below, and then change your password:</p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="buttonContent">
      <tr>
        <td align="center" valign="middle">
          <a href="{{verificationUrl}}" target="_blank">Verify Email</a>
        </td>
      </tr>
    </table>
    <span>This link will expire in {{expirationTime}}.</span>
    <p>Best regards,<br>Your App Team</p>
  `
}

export const generateEmailTemplate = (templateName: string, dynamicFields: Record<string, string>): string => {
  let template = templates[templateName]
  if (!template) {
    throw new Error(`Template "${templateName}" not found`)
  }

  // Thay thế các trường động trong nội dung template
  Object.keys(dynamicFields).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    template = template.replace(regex, dynamicFields[key])
  })

  // Đưa nội dung template vào base template
  let fullTemplate = baseTemplate.replace('{{content}}', template)

  // Thay thế tiêu đề email
  fullTemplate = fullTemplate.replace('{{title}}', dynamicFields.title || 'Email Notification')

  return fullTemplate
}
