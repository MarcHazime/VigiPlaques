// Email Service using Brevo (Sendinblue) API v3
// Solves Railway SMTP blocking issues by using standard HTTP (Port 443)
import axios from 'axios';

export const sendEmail = async (to: string, subject: string, text: string) => {
    // 1. Dev Mode (No API Key)
    const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS; // Fallback to SMTP_PASS if user put key there

    if (!apiKey || !apiKey.startsWith('xkeysib-')) {
        console.log('=============================================');
        console.log(`[EMAIL DEV MODE] (No valid Brevo API Key found)`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('=============================================');
        return;
    }

    // 2. Production Mode (Brevo API)
    try {
        const senderEmail = process.env.SMTP_FROM || 'no-reply@plaqup.com';
        const senderName = "Plaq'Up";

        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: { name: senderName, email: senderEmail },
                to: [{ email: to }],
                subject: subject,
                textContent: text,
            },
            {
                headers: {
                    'accept': 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json'
                }
            }
        );
        console.log(`[Email Service] Sent to ${to} via Brevo API`);
    } catch (error: any) {
        console.error('[Email Service] Error sending email via Brevo API:', error.response?.data || error.message);
        throw new Error(`Email failed: ${JSON.stringify(error.response?.data || error.message)}`);
    }
};
