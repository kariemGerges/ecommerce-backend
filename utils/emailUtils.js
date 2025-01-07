// utils/emailService.js
const brevo = require('@getbrevo/brevo');

// Configure Brevo API key
const client = brevo.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const sendOrderConfirmationEmail = async (toEmail, toName, orderDetails) => {

    console.log('Sending order confirmation email...');
    console.log('Order details:', orderDetails, 'to:', toEmail, toName, 'from:', process.env.EMAIL);

    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = 'Order Confirmation';
    sendSmtpEmail.htmlContent = `
        <h1>Thank you for shopping with [Your Store Name]!</h1>
        <p>Dear {{toName}},</p>
        <p>We’ve received your order and it’s being processed. Here are the details:</p>
            <table>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
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
        <p><strong>Total:</strong> $${orderDetails.reduce(
        (total, item) => total + item.price * item.quantity,
        0
        ).toFixed(2)}</p>
        <p>Pickup Location: 123 Your Store Address</p>
        <p>If you have any questions, contact us at support@yourstore.com.</p>
        <p>Thank you for shopping with us!</p>        
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
};
