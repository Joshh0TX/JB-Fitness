# Email Setup (Forgot Password)

Password reset emails are sent via **nodemailer** using SMTP. Configure these environment variables:

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FRONTEND_URL` | Your frontend base URL (for reset links) | `http://localhost:5173` or `https://jbfitness.vercel.app` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port (usually 587 for TLS) | `587` |
| `SMTP_USER` | SMTP username / email | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP password or app password | Your app password |

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_FROM` | Sender address shown in emails | Uses `SMTP_USER` |
| `SMTP_SECURE` | Use SSL (port 465) | `false` |

## Provider Examples

### Gmail
1. Enable 2FA on your Google account
2. Create an [App Password](https://myaccount.google.com/apppasswords)
3. Set:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### SendGrid
1. Create a SendGrid account and get API credentials
2. Set:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

### Resend
1. Create a Resend account
2. Use their SMTP: `smtp.resend.com` with your Resend API key as password

## Development (No SMTP)

If SMTP vars are not set, the backend will:
- Still create the reset token and save it
- Log the reset URL to the console instead of sending email
- Return the same success message to the user (for security)

Use the logged URL to test the reset flow locally.
