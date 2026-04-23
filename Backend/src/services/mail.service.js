import nodemailer from "nodemailer";

let transporterPromise = null;

async function getTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("EMAIL_USER and EMAIL_PASS must be configured to send email");
    }

    if (!transporterPromise) {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        transporterPromise = transporter.verify()
            .then(() => {
                console.log("Email transporter is ready to send emails");
                return transporter;
            });
    }

    return transporterPromise;
}

export async function sendEmail({ to, subject, html, text }) {
    const transporter = await getTransporter();
    const from = process.env.EMAIL_USER || process.env.GOOGLE_USER;

    const mailOptions = {
        from,
        to,
        subject,
        html,
        text
    };

    const details = await transporter.sendMail(mailOptions);
    console.log("Email sent:", details);
}
