import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Force IPv4 to avoid IPv6 issues on some cloud providers
    family: 4,
    logger: true,
    debug: true,
} as any);

export const sendEmail = async (to: string, subject: string, text: string) => {
    // If no SMTP credentials, fallback to console (Dev Mode)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('=============================================');
        console.log(`[EMAIL DEV MODE] To: ${to}`);
        console.log(`[EMAIL DEV MODE] Subject: ${subject}`);
        console.log(`[EMAIL DEV MODE] Body: ${text}`);
        console.log('=============================================');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Plaq\'Up" <no-reply@plaqup.com>',
            to,
            subject,
            text,
        });
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
