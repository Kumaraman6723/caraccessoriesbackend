exports.enquiryToAdminEmail = (name, email, address, phone, productName, productId) => {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Product Enquiry - Banty Car Accessories</title>
    <style>
        body { background-color: #f5f5f5; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #f97316, #ef4444); color: #fff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; }
        .content { padding: 30px; }
        .field { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { color: #555; margin-top: 4px; font-size: 15px; }
        .product-box { background: #f9fafb; padding: 12px; border-radius: 6px; border-left: 4px solid #f97316; margin-top: 8px; }
        .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>New Product Enquiry</h1></div>
        <div class="content">
            <div class="field">
                <span class="label">Customer name</span>
                <div class="value">${name || "Not provided"}</div>
            </div>
            <div class="field">
                <span class="label">Email</span>
                <div class="value"><a href="mailto:${email}">${email || "Not provided"}</a></div>
            </div>
            <div class="field">
                <span class="label">Phone</span>
                <div class="value"><a href="tel:${phone}">${phone || "Not provided"}</a></div>
            </div>
            <div class="field">
                <span class="label">Address</span>
                <div class="value">${address || "Not provided"}</div>
            </div>
            <div class="field">
                <span class="label">Product enquiry</span>
                <div class="product-box value">${productName || "General enquiry"}${productId ? ` (ID: ${productId})` : ""}</div>
            </div>
        </div>
        <div class="footer">
            <p>Banty Car Accessories – Enquiry from website</p>
            <p>Received on ${new Date().toLocaleString("en-IN")}</p>
        </div>
    </div>
</body>
</html>`;
};
