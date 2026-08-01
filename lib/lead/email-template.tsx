import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import { LEAD_TOPIC_LABELS } from "@/config/contact";
import { LeadTopic } from "@/lib/lead/schema";

interface LeadEmailProps {
  name: string;
  email: string;
  topic: LeadTopic;
  message: string;
  source: "form" | "chat";
}

export function LeadEmail({
  name,
  email,
  topic,
  message,
  source,
}: LeadEmailProps) {
  const topicLabel = LEAD_TOPIC_LABELS[topic];

  return (
    <Html>
      <Head />
      <Preview>
        New lead from {name} — {topicLabel}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>New Lead</Heading>
          <Section>
            <Text style={label}>Name</Text>
            <Text style={value}>{name}</Text>

            <Text style={label}>Email</Text>
            <Text style={value}>{email}</Text>

            <Text style={label}>Topic</Text>
            <Text style={value}>{topicLabel}</Text>

            <Text style={label}>Message</Text>
            <Text style={value}>{message}</Text>

            <Hr style={hr} />

            <Text style={footer}>
              Source: {source === "chat" ? "Chat widget" : "Contact form"} |{" "}
              {new Date().toISOString()}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "560px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  marginBottom: "24px",
};

const label = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: "4px",
};

const value = {
  fontSize: "15px",
  color: "#1a1a1a",
  marginTop: "0",
  marginBottom: "16px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer = {
  fontSize: "12px",
  color: "#9ca3af",
};
