import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Font,
  Preview
} from '@react-email/components';

interface PasswordChangedEmailProps {
  firstName?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export const PasswordChangedEmail = ({
  firstName = 'User',
  timestamp,
  ipAddress,
  userAgent
}: PasswordChangedEmailProps) => {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>Your LabSync password has been changed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>
              <span style={labSyncText}>LabSync</span>
            </Text>
            <Text style={tagline}>Making Science Easier</Text>
          </Section>

          <Section style={content}>
            <Section style={successIcon}>
              <Text style={checkmark}>✓</Text>
            </Section>

            <Text style={heading}>Password Successfully Changed</Text>
            
            <Text style={paragraph}>
              Hi {firstName},
            </Text>
            
            <Text style={paragraph}>
              This is a confirmation that your LabSync account password has been 
              successfully changed.
            </Text>

            <Section style={detailsSection}>
              <Text style={detailsHeading}>Change Details:</Text>
              <Text style={detailItem}>
                <strong>Date & Time:</strong> {timestamp}
              </Text>
              {ipAddress && (
                <Text style={detailItem}>
                  <strong>IP Address:</strong> {ipAddress}
                </Text>
              )}
              {userAgent && (
                <Text style={detailItem}>
                  <strong>Device:</strong> {userAgent}
                </Text>
              )}
            </Section>

            <Hr style={hr} />

            <Section style={securitySection}>
              <Text style={securityHeading}>🔒 Security Notice</Text>
              <Text style={paragraph}>
                If you did not make this change, please contact your lab administrator 
                immediately and consider the following steps:
              </Text>
              
              <Text style={securityItem}>• Check for any unauthorized access to your account</Text>
              <Text style={securityItem}>• Review recent activity in your LabSync account</Text>
              <Text style={securityItem}>• Change your password again if needed</Text>
              <Text style={securityItem}>• Report any suspicious activity</Text>
            </Section>

            <Hr style={hr} />

            <Text style={smallText}>
              This is an automated security notification. Please do not reply to this email.
            </Text>
          </Section>

          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              This email was sent by LabSync - Medical Research Lab Management
            </Text>
            <Text style={footerText}>
              © 2025 LabSync. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const logoSection = {
  padding: '32px 0',
  textAlign: 'center' as const,
};

const logoText = {
  fontSize: '32px',
  fontWeight: '600',
  margin: '0',
  background: 'linear-gradient(135deg, #4C9A92 0%, #5DD5E6 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  textAlign: 'center' as const,
};

const labSyncText = {
  fontSize: '32px',
  fontWeight: '600',
  background: 'linear-gradient(135deg, #4C9A92 0%, #5DD5E6 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const tagline = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '8px 0 0 0',
  textAlign: 'center' as const,
};

const content = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '32px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const successIcon = {
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const checkmark = {
  fontSize: '48px',
  color: '#10b981',
  margin: '0',
  fontWeight: 'bold',
};

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  margin: '0 0 16px 0',
};

const detailsSection = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const detailsHeading = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151',
  margin: '0 0 12px 0',
};

const detailItem = {
  fontSize: '14px',
  color: '#4b5563',
  margin: '4px 0',
  lineHeight: '20px',
};

const securitySection = {
  backgroundColor: '#fef3f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const securityHeading = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#dc2626',
  margin: '0 0 12px 0',
};

const securityItem = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#7f1d1d',
  margin: '4px 0',
};

const smallText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '16px 0 0 0',
  lineHeight: '20px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  padding: '20px 0 0 0',
};

const footerText = {
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '4px 0',
};

export default PasswordChangedEmail;