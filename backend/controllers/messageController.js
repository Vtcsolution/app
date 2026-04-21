const Message = require("../models/Message");
const transporter = require("../config/mailer");

exports.sendMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Save to DB
    const newMessage = await Message.create({ 
      name, 
      email, 
      message, 
      user: req.user?._id 
    });

    // Send email to admin
    await transporter.sendMail({
      from: `"Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: "New message received via contact form",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Message - Spiritueel Chatten</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; max-width: 600px;">
          
          <!-- Website Header -->
          <div style="text-align: center; padding: 30px 0 20px 0; border-bottom: 3px solid #3B5EB7; margin-bottom: 30px;">
            <h1 style="color: #3B5EB7; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 1px;">Spiritueel Chatten</h1>
            <p style="color: #666666; margin: 5px 0 0 0; font-size: 16px; font-weight: 500;">New Contact Form Submission</p>
          </div>

          <!-- Message Content - Full Width -->
          <div style="margin-bottom: 30px;">
            <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #555555;">
              From: ${name}
            </p>
            <p style="margin: 0 0 15px 0; font-size: 16px; color: #3B5EB7;">
              <a href="mailto:${email}" style="color: #3B5EB7; text-decoration: none;">${email}</a>
            </p>
            <div style="border-left: 4px solid #3B5EB7; padding-left: 20px; margin: 20px 0; background: #f9f9f9; padding: 20px; border-radius: 5px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; white-space: pre-wrap; color: #333333;">
                ${message}
              </p>
            </div>
          </div>

          <!-- Date -->
          <div style="text-align: right; margin-bottom: 40px; padding: 10px 0; border-top: 1px solid #eeeeee; color: #999999;">
            <p style="margin: 0; font-size: 14px;">
              📅 ${new Date().toLocaleString('nl-NL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>

          <!-- Footer - Best Regards -->
          <div style="text-align: center; padding: 30px 0; border-top: 2px solid #3B5EB7; color: #666666;">
            <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #3B5EB7;">
              Best regards,
            </p>
            <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">
              <a href="https://spiritueelchatten.nl" style="color: #3B5EB7; text-decoration: none; font-weight: 600;">
                The Spiritueel Chatten Team
              </a>
            </p>
            <p style="margin: 0; font-size: 14px; color: #999999;">
              This message was received through our contact form
            </p>
          </div>

        </body>
        </html>
      `,
    });

    res.status(200).json({ 
      success: true, 
      message: "Message sent and saved successfully.",
      data: newMessage 
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// controllers/messageController.js
exports.getAllMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .lean();

    const totalMessages = await Message.countDocuments();

    const messagesWithStatus = messages.map(message => ({
      ...message,
      hasReplied: message.replied,
      repliedAt: message.repliedAt,
      replyContent: message.replyContent
    }));

    res.status(200).json({
      success: true,
      data: messagesWithStatus,
      pagination: {
        total: totalMessages,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalMessages / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};
exports.getRepliesStatus = async (req, res) => {
  try {
    const messages = await Message.find({ replied: true })
      .select('_id replied repliedAt replyContent replySubject')
      .lean();

    const repliesStatus = messages.reduce((acc, msg) => {
      acc[msg._id] = {
        replied: msg.replied,
        repliedAt: msg.repliedAt,
        replyContent: msg.replyContent,
        replySubject: msg.replySubject
      };
      return acc;
    }, {});

    res.status(200).json(repliesStatus);
  } catch (error) {
    console.error("Error fetching replies status:", error);
    res.status(500).json({ error: "Failed to fetch reply status" });
  }
};

// Delete a message (Admin)
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findByIdAndDelete(id);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

// Send reply to user
exports.sendReply = async (req, res) => {
  try {
    const { toEmail, subject, message, messageId } = req.body;

    if (!toEmail || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Send reply email
    await transporter.sendMail({
      from: `"Spiritueel Chatten" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Re: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reply from Spiritueel Chatten</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; max-width: 600px;">
          
          <!-- Website Header -->
          <div style="text-align: center; padding: 30px 0 20px 0; border-bottom: 3px solid #3B5EB7; margin-bottom: 30px;">
            <h1 style="color: #3B5EB7; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 1px;">Spiritueel Chatten</h1>
            <p style="color: #666666; margin: 5px 0 0 0; font-size: 16px; font-weight: 500;">Response to Your Message</p>
          </div>

          <!-- Reply Content - Full Width -->
          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.7; color: #333333;">
              ${message}
            </p>
            
            <div style="background: #f0f8f0; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin-top: 20px;">
             
              <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.5;">
                <strong>Subject:</strong> ${subject}
              </p>
            </div>
          </div>

          <!-- Footer - Best Regards -->
          <div style="text-align: center; padding: 30px 0; border-top: 2px solid #3B5EB7; color: #666666;">
            <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #3B5EB7;">
              Best regards,
            </p>
            <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">
              <a href="https://spiritueelchatten.nl" style="color: #3B5EB7; text-decoration: none; font-weight: 600;">
                The Spiritueel Chatten Team
              </a>
            </p>
            <p style="margin: 0; font-size: 14px; color: #999999;">
              Thank you for connecting with us
            </p>
          </div>

        </body>
        </html>
      `,
    });

    // Update message with reply status
    if (messageId) {
      await Message.findByIdAndUpdate(messageId, {
        replied: true,
        repliedAt: new Date(),
        replyContent: message,
        replySubject: `Re: ${subject}`
      });
    }

    console.log(`Reply sent to ${toEmail}: ${subject} (Message ID: ${messageId})`);

    res.status(200).json({
      success: true,
      message: "Reply sent successfully"
    });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ error: "Failed to send reply" });
  }
};

// Quick send email to any user
exports.quickSendEmail = async (req, res) => {
  try {
    const { toEmail, subject, message } = req.body;

    console.log('=== QUICK EMAIL DEBUG ===');
    console.log('To:', toEmail);
    console.log('Subject:', subject);
    console.log('========================');

    if (!toEmail || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Send email
    await transporter.sendMail({
      from: `"Spiritueel Chatten" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject} - Spiritueel Chatten</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; max-width: 600px;">
          
          <!-- Website Header -->
          <div style="text-align: center; padding: 30px 0 20px 0; border-bottom: 3px solid #3B5EB7; margin-bottom: 30px;">
            <h1 style="color: #3B5EB7; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 1px;">Spiritueel Chatten</h1>
            <p style="color: #666666; margin: 5px 0 0 0; font-size: 16px; font-weight: 500;">Message from Our Team</p>
          </div>

          <!-- Message Content - Full Width -->
          <div style="margin-bottom: 40px;">
            <h2 style="color: #3B5EB7; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">${subject}</h2>
            
            <div style="line-height: 1.7; font-size: 16px; color: #333333; white-space: pre-wrap;">
              ${message}
            </div>
          </div>

          <!-- Footer - Best Regards -->
          <div style="text-align: center; padding: 30px 0; border-top: 2px solid #3B5EB7; color: #666666;">
            <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #3B5EB7;">
              Best regards,
            </p>
            <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">
              <a href="https://spiritueelchatten.nl" style="color: #3B5EB7; text-decoration: none; font-weight: 600;">
                The Spiritueel Chatten Team
              </a>
            </p>
            <p style="margin: 0; font-size: 14px; color: #999999;">
              Thank you for being part of our community
            </p>
          </div>

        </body>
        </html>
      `,
    });

    console.log(`Quick email sent to ${toEmail}: ${subject}`);

    res.status(200).json({
      success: true,
      message: "Email sent successfully"
    });
  } catch (error) {
    console.error("Error sending quick email:", error);
    res.status(500).json({ error: "Failed to send email. Please check the email address and try again." });
  }
};