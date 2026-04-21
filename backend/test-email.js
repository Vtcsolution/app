require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing SMTP connection with:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Try sending a test email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'test@example.com', // Change to your email
      subject: 'Test Email',
      text: 'This is a test email'
    });
    console.log('✅ Test email sent:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
  }
}

testEmail();