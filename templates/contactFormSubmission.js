exports.contactFormSubmissionEmail = (name, email, company, message) => {
  return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>New Contact Form Submission</title>
        <style>
            body {
                background-color: #f5f5f5;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background-color: #031D33;
                color: #ffffff;
                padding: 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 30px;
            }
            .field {
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #e0e0e0;
            }
            .field:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: bold;
                color: #031D33;
                margin-bottom: 5px;
                display: block;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .value {
                color: #555555;
                font-size: 16px;
                margin-top: 5px;
            }
            .message-box {
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 5px;
                border-left: 4px solid #F5C242;
                margin-top: 10px;
            }
            .footer {
                background-color: #f5f5f5;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #999999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Contact Form Submission</h1>
            </div>
            <div class="content">
                <div class="field">
                    <span class="label">Name</span>
                    <div class="value">${name || 'Not provided'}</div>
                </div>
                <div class="field">
                    <span class="label">Email</span>
                    <div class="value">${email || 'Not provided'}</div>
                </div>
                <div class="field">
                    <span class="label">Company/Organization</span>
                    <div class="value">${company || 'Not provided'}</div>
                </div>
                <div class="field">
                    <span class="label">Message</span>
                    <div class="message-box value">${message || 'No message provided'}</div>
                </div>
            </div>
            <div class="footer">
                <p>This email was sent from the LostFound contact form.</p>
                <p>Submitted on: ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>`;
};
