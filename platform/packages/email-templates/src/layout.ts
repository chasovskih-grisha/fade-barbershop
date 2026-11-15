export const baseEmailLayout = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>{{subject}}</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
  /* Reset & Client-Specific Styles */
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: 100% !important;
    width: 100% !important;
    background-color: #f3f4f6;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  * {
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
  }
  table, td {
    mso-table-lspace: 0pt !important;
    mso-table-rspace: 0pt !important;
    border-collapse: collapse !important;
  }
  img {
    -ms-interpolation-mode: bicubic;
    border: 0;
    height: auto;
    line-height: 100%;
    outline: none;
    text-decoration: none;
  }
  table {
    border-spacing: 0 !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    margin: 0 auto !important;
  }
  
  /* Typography & Core Styling */
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1f2937;
    background-color: #f3f4f6;
  }
  
  .email-wrapper {
    width: 100%;
    table-layout: fixed;
    background-color: #f3f4f6;
    padding: 40px 0;
  }
  
  .email-content {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
  }
  
  .email-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 36px 32px;
    text-align: center;
    border-bottom: 3px solid #2563eb;
  }
  
  .email-header h1 {
    color: #ffffff;
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 0.75px;
    text-transform: uppercase;
  }
  
  .email-header .tagline {
    color: #94a3b8;
    font-size: 13px;
    margin: 6px 0 0 0;
    letter-spacing: 0.5px;
  }
  
  .email-body {
    padding: 40px 36px;
    background-color: #ffffff;
  }
  
  .email-body h2 {
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 0;
    margin-bottom: 16px;
    letter-spacing: -0.2px;
  }
  
  .email-body p {
    font-size: 16px;
    line-height: 1.65;
    color: #4b5563;
    margin: 0 0 20px 0;
  }
  
  /* Modern Card Components */
  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 24px;
    margin: 28px 0;
  }
  
  .card-item {
    font-size: 15px;
    color: #334155;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
  }
  
  .card-item:last-child {
    margin-bottom: 0;
  }
  
  .card-label {
    font-weight: 600;
    color: #0f172a;
  }
  
  .card-value {
    color: #475569;
    text-align: right;
  }

  .badge {
    display: inline-block;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 9999px;
    background-color: #dbeafe;
    color: #1e40af;
  }
  
  /* Action Buttons */
  .button-container {
    text-align: center;
    margin: 36px 0;
  }
  
  .btn {
    background-color: #2563eb;
    color: #ffffff !important;
    padding: 14px 32px;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    border-radius: 8px;
    display: inline-block;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    transition: background-color 0.2s ease;
  }
  
  .btn:hover {
    background-color: #1d4ed8;
  }
  
  .btn-secondary {
    background-color: #f1f5f9;
    color: #334155 !important;
    box-shadow: none;
    border: 1px solid #cbd5e1;
  }

  .divider {
    height: 1px;
    background-color: #e2e8f0;
    margin: 28px 0;
    border: none;
  }
  
  /* Footer Styling */
  .email-footer {
    background-color: #f8fafc;
    padding: 28px 32px;
    text-align: center;
    border-top: 1px solid #e2e8f0;
    font-size: 13px;
    color: #64748b;
  }
  
  .email-footer a {
    color: #475569;
    text-decoration: underline;
  }
  
  .social-links {
    margin: 16px 0;
  }
  
  .social-links a {
    display: inline-block;
    margin: 0 8px;
    color: #64748b;
    text-decoration: none;
    font-weight: 500;
    font-size: 12px;
  }

  /* Responsive Adjustments */
  @media screen and (max-width: 600px) {
    .email-wrapper {
      padding: 10px !important;
    }
    .email-content {
      border-radius: 8px !important;
      width: 100% !important;
    }
    .email-header {
      padding: 24px 20px !important;
    }
    .email-body {
      padding: 24px 20px !important;
    }
    .email-footer {
      padding: 20px !important;
    }
    .btn {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 14px 0 !important;
    }
  }
</style>
</head>
<body>
  <div class="email-wrapper">
    <table role="presentation" class="email-content" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="email-header">
          <h1>{{brandName | default: "Fade Barbershop"}}</h1>
          <p class="tagline">{{brandTagline | default: "Premium Grooming & Traditional Barbering"}}</p>
        </td>
      </tr>
      <tr>
        <td class="email-body">
          {{contentHtml}}
        </td>
      </tr>
      <tr>
        <td class="email-footer">
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #475569; font-weight: 500;">&copy; {{year | default: "2026"}} {{brandName | default: "Fade Barbershop"}}. All rights reserved.</p>
          <div class="social-links">
            <a href="{{instagramUrl | default: "https://instagram.com"}}">Instagram</a> &bull; 
            <a href="{{websiteUrl | default: "https://fadebarbershop.com"}}">Website</a> &bull; 
            <a href="{{supportUrl | default: "https://fadebarbershop.com/support"}}">Support</a>
          </div>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">You received this email because you have an account or active booking with us. <a href="{{unsubscribeUrl | default: "#"}}" style="color: #64748b;">Unsubscribe</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
