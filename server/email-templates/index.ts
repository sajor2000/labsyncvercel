import { render } from '@react-email/render';
import * as React from 'react';
import PasswordResetEmail from './PasswordResetEmail';
import WelcomeEmail from './WelcomeEmail';
import PasswordChangedEmail from './PasswordChangedEmail';

// Re-export all email templates
export { PasswordResetEmail, WelcomeEmail, PasswordChangedEmail };

// Email rendering utility
export class EmailTemplateService {
  /**
   * Render password reset email
   */
  static async renderPasswordResetEmail(props: {
    firstName?: string;
    resetUrl: string;
  }): Promise<{ html: string; text: string }> {
    const emailElement = React.createElement(PasswordResetEmail, props);
    
    const html = await render(emailElement);
    const text = await render(emailElement, { plainText: true });
    
    return { html, text };
  }

  /**
   * Render welcome email for new users
   */
  static async renderWelcomeEmail(props: {
    firstName: string;
    email: string;
    resetUrl: string;
    labName?: string;
  }): Promise<{ html: string; text: string }> {
    const emailElement = React.createElement(WelcomeEmail, props);
    
    const html = await render(emailElement);
    const text = await render(emailElement, { plainText: true });
    
    return { html, text };
  }

  /**
   * Render password changed confirmation email
   */
  static async renderPasswordChangedEmail(props: {
    firstName?: string;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ html: string; text: string }> {
    const emailElement = React.createElement(PasswordChangedEmail, props);
    
    const html = await render(emailElement);
    const text = await render(emailElement, { plainText: true });
    
    return { html, text };
  }

  /**
   * Send email using Resend
   */
  static async sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    text: string;
    from?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY2);
      
      const fromEmail = params.from || (process.env.FROM_EMAIL || 'noreply@labsync.app').trim();
      
      const response = await resend.emails.send({
        from: `LabSync <${fromEmail}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send password reset email (convenience method)
   */
  static async sendPasswordResetEmail(params: {
    to: string;
    firstName?: string;
    resetUrl: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { html, text } = await this.renderPasswordResetEmail({
      firstName: params.firstName,
      resetUrl: params.resetUrl,
    });

    return this.sendEmail({
      to: params.to,
      subject: 'Reset Your LabSync Password',
      html,
      text,
    });
  }

  /**
   * Send welcome email (convenience method)
   */
  static async sendWelcomeEmail(params: {
    to: string;
    firstName: string;
    email: string;
    resetUrl: string;
    labName?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { html, text } = await this.renderWelcomeEmail({
      firstName: params.firstName,
      email: params.email,
      resetUrl: params.resetUrl,
      labName: params.labName,
    });

    return this.sendEmail({
      to: params.to,
      subject: 'Welcome to LabSync - Set Up Your Account',
      html,
      text,
    });
  }

  /**
   * Send password changed confirmation email (convenience method)
   */
  static async sendPasswordChangedEmail(params: {
    to: string;
    firstName?: string;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { html, text } = await this.renderPasswordChangedEmail({
      firstName: params.firstName,
      timestamp: params.timestamp,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return this.sendEmail({
      to: params.to,
      subject: 'Your LabSync Password Has Been Changed',
      html,
      text,
    });
  }
}

export default EmailTemplateService;