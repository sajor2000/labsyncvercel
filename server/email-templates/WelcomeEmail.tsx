import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Font,
  Preview
} from '@react-email/components';

interface WelcomeEmailProps {
  firstName: string;
  email: string;
  resetUrl: string;
  labName?: string;
}

export const WelcomeEmail = ({
  firstName,
  email,
  resetUrl,
  labName = 'your research lab'
}: WelcomeEmailProps) => {
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
      <Preview>Welcome to LabSync - Set up your account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>
              <span style={labSyncText}>LabSync</span>
            </Text>
            <Text style={tagline}>Making Science Easier</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Welcome to LabSync! 🎉</Text>
            
            <Text style={paragraph}>
              Hi {firstName},
            </Text>
            
            <Text style={paragraph}>
              You've been added to {labName} on LabSync! We're excited to have you join our 
              platform for streamlining research workflows and enhancing scientific collaboration.
            </Text>

            <Text style={paragraph}>
              To get started, you'll need to set up your password by clicking the button below:
            </Text>

            <Section style={buttonContainer}>
              <Button href={resetUrl} style={button}>
                Set Up Password
              </Button>
            </Section>

            <Text style={paragraph}>
              <strong>Your login email:</strong> {email}
            </Text>

            <Hr style={hr} />

            <Text style={featuresHeading}>What you can do with LabSync:</Text>
            
            <Text style={featureItem}>• Manage studies and research projects</Text>
            <Text style={featureItem}>• Track tasks and deadlines</Text>
            <Text style={featureItem}>• Collaborate with team members</Text>
            <Text style={featureItem}>• Generate AI-powered meeting summaries</Text>
            <Text style={featureItem}>• Organize research ideas and workflows</Text>

            <Hr style={hr} />

            <Text style={smallText}>
              This setup link will expire in 1 hour for security reasons. If you need assistance, 
              please contact your lab administrator.
            </Text>

            <Text style={smallText}>
              If you're having trouble clicking the button, copy and paste the URL below into your web browser:
            </Text>
            
            <Text style={linkText}>
              {resetUrl}
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

// Styles (reusing many from PasswordResetEmail)
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

const featuresHeading = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#374151',
  margin: '16px 0 12px 0',
};

const featureItem = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#4b5563',
  margin: '4px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#4C9A92',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const smallText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '16px 0 0 0',
  lineHeight: '20px',
};

const linkText = {
  fontSize: '12px',
  color: '#4C9A92',
  wordBreak: 'break-all' as const,
  margin: '8px 0 0 0',
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

export default WelcomeEmail;