import { Router } from 'express';
import { Resend } from 'resend';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Simple direct email test route
router.post('/send-direct', isAuthenticated, async (req, res) => {
  try {
    const { email, subject } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.FROM_EMAIL || 'noreply@labsync.app';

    console.log(`📧 Attempting to send test email to: ${email}`);
    console.log(`📧 From: ${fromEmail}`);
    console.log(`📧 API Key present: ${process.env.RESEND_API_KEY ? 'Yes' : 'No'}`);

    const result = await resend.emails.send({
      from: `LabSync Test <${fromEmail}>`,
      to: [email],
      subject: subject || 'LabSync Email System Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4C9A92; margin-bottom: 20px;">LabSync Email System Test</h2>
          <p style="margin-bottom: 15px;">This is a test email to verify that your LabSync email system is working correctly.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">Test Configuration:</h3>
            <ul style="margin-bottom: 0;">
              <li><strong>From Address:</strong> ${fromEmail}</li>
              <li><strong>Domain:</strong> clif-icu.org</li>
              <li><strong>API Status:</strong> ${process.env.RESEND_API_KEY ? 'Configured ✅' : 'Missing ❌'}</li>
              <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If you receive this email, your task notifications, reminders, and other LabSync email features will work correctly.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            This email was sent from LabSync Email System
          </p>
        </div>
      `
    });

    if (result.error) {
      console.error('❌ Resend API error:', result.error);
      return res.status(500).json({ 
        error: 'Email send failed', 
        details: result.error,
        apiKeyPresent: !!process.env.RESEND_API_KEY
      });
    }

    console.log(`✅ Email sent successfully! ID: ${result.data?.id}`);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: result.data?.id,
      sentTo: email,
      from: fromEmail
    });

  } catch (error) {
    console.error('❌ Email send error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error',
      apiKeyPresent: !!process.env.RESEND_API_KEY
    });
  }
});

export { router as emailTestRoutes };