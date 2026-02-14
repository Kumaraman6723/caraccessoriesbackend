exports.enquiryAutoReplyEmail = (name, contactPhone) => {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>We received your enquiry - Banty Car Accessories</title>
    <style>
        body { background-color: #f5f5f5; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #0f172a, #1e293b); color: #fff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; }
        .content { padding: 30px; }
        .message { font-size: 16px; color: #334155; margin-bottom: 20px; }
        .highlight { font-weight: bold; color: #0f172a; }
        .phone { display: inline-block; background: #f97316; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 16px 0; letter-spacing: 1px; }
        .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>Banty Car Accessories</h1></div>
        <div class="content">
            <p class="message">Dear ${name || "Customer"},</p>
            <p class="message">Thank you for your enquiry. We have received your request and our team will get back to you shortly.</p>
            <p class="message">If your enquiry is urgent, you can call us directly on:</p>
            <p class="phone">${contactPhone || "9876543210"}</p>
            <p class="message">We look forward to assisting you with your car accessories needs.</p>
        </div>
        <div class="footer">
            <p>Banty Car Accessories – Premium car accessories for enthusiasts</p>
        </div>
    </div>
</body>
</html>`;
};
