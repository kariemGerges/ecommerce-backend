// utils/emailService.js
const brevo = require('@getbrevo/brevo');

// Configure Brevo API key
const client = brevo.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Send order confirmation email
const sendOrderConfirmationEmail = async (toEmail, toName, orderDetails) => {

    console.log('Sending order confirmation email...');
    console.log('Order details:', orderDetails, 'to:', toEmail, toName, 'from:', process.env.EMAIL);

    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = 'Order Confirmation';
    sendSmtpEmail.htmlContent =
    `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Confirmation</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: 'Helvetica Neue', Arial, sans-serif;
                            background: #f7f7f7;
                            color: #1a1a1a;
                            -webkit-font-smoothing: antialiased;
                        }

                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background: #000000;
                            color: #ffffff;
                        }

                        .header {
                            padding: 60px 40px;
                            text-align: center;
                            background: #000000;
                        }

                        .header h1 {
                            font-size: 42px;
                            margin: 0;
                            font-weight: 900;
                            letter-spacing: -1px;
                        }

                        .order-number {
                            font-size: 14px;
                            letter-spacing: 2px;
                            text-transform: uppercase;
                            margin-top: 20px;
                            color: #666;
                        }

                        .content {
                            background: #ffffff;
                            color: #000000;
                            padding: 60px 40px;
                        }

                        .section-title {
                            font-size: 12px;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            margin-bottom: 20px;
                            color: #666;
                        }

                        .order-table {
                            width: 100%;
                            margin: 40px 0;
                            border-collapse: collapse;
                        }

                        .order-table th {
                            font-weight: normal;
                            color: #666;
                            font-size: 12px;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            padding: 15px 0;
                            border-bottom: 1px solid #eee;
                        }

                        .order-table td {
                            padding: 20px 0;
                            font-size: 16px;
                            border-bottom: 1px solid #eee;
                        }

                        .total {
                            font-size: 24px;
                            font-weight: bold;
                            margin: 40px 0;
                            padding-top: 40px;
                            border-top: 1px solid #eee;
                        }

                        .pickup {
                            margin: 40px 0;
                            padding: 40px;
                            background: #f8f8f8;
                        }

                        .accent-text {
                            font-size: 24px;
                            font-weight: bold;
                            margin-bottom: 10px;
                        }

                        .footer {
                            background: #000000;
                            color: #ffffff;
                            padding: 60px 40px;
                            text-align: center;
                            font-size: 14px;
                        }

                        .footer a {
                            color: #ffffff;
                            text-decoration: underline;
                        }

                        @media only screen and (max-width: 600px) {
                            .header, .content, .footer {
                                padding: 30px 20px;
                            }

                            .header h1 {
                                font-size: 32px;
                            }

                            .pickup {
                                padding: 20px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Order Confirmed</h1>
                            <div class="order-number">#ORD-2024-{{orderNumber}}</div>
                        </div>
                        
                        <div class="content">
                            <div class="section-title">Order Details</div>
                            
                            <table class="order-table">
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                </tr>
                                ${orderDetails
                                    .map(
                                    (item) =>
                                        `<tr>
                                        <td>${item.name}</td>
                                        <td>${item.quantity}</td>
                                        <td>$${item.price.toFixed(2)}</td>
                                        </tr>`
                                    )
                                    .join('')}
                            </table>

                            <div class="total">
                                Total: $${orderDetails.reduce(
                                    (total, item) => total + item.price * item.quantity,
                                    0
                                ).toFixed(2)}
                            </div>

                            <div class="pickup">
                                <div class="section-title">Pickup Location</div>
                                <div class="accent-text">123 Your Store Address</div>
                                <div>Your order will be ready for pickup at our store.</div>
                            </div>
                        </div>

                        <div class="footer">
                            Need help? <a href="mailto:support@yourstore.com">Contact Support</a>
                        </div>
                    </div>
                </body>
            </html>
    `;
    sendSmtpEmail.sender = { name: 'GRO store', email: process.env.EMAIL };
    sendSmtpEmail.to = [{ email: toEmail, name: toName }];

    try {

        const apiInstance = new brevo.TransactionalEmailsApi();
        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully:', response.messageId);

    } catch (error) {
        console.error('Failed to send email:', error.message);
    }
};

// Send payment confirmation email
const sendPaymentConfirmationEmail = async (toEmail, toName, orderNumber) => {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = 'Payment Confirmation';
    sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>Payment Confirmation</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 16px;
                        line-height: 1.5;
                        color: #333;
                        background-color: #f5f5f5;
                        padding: 20px;
                    }
                    h1 {
                        font-size: 24px;
                        margin-bottom: 20px;
                    }
                    p {
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <h1>Payment Confirmation</h1>
                <p>Thank you for your payment! Your order has been confirmed.</p>
                <p>Order Number: #ORD-2024-${orderNumber}</p>
                <p>Order Total: $${orderTotal.toFixed(2)}</p>
                <p>Payment Method: ${paymentMethod}</p>
                <p>Payment Status: ${paymentStatus}</p>
            </body>
        </html>
    `;
    sendSmtpEmail.sender = { name: 'GRO store', email: process.env.EMAIL };
    sendSmtpEmail.to = [{ email: toEmail, name: toName }];

    try {

        const apiInstance = new brevo.TransactionalEmailsApi();
        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully:', response.messageId);

    } catch (error) {
        console.error('Failed to send email:', error.message);
    }
};


module.exports = {
    sendOrderConfirmationEmail,
    sendPaymentConfirmationEmail,
};
