import { Metadata } from "next";

import PageContainer from "@/components/common/page-container";
import { ContactForm } from "@/components/contact/contact-form";
import { ProfileCard } from "@/components/contact/profile-card";
import { pagesConfig } from "@/config/pages";

export const metadata: Metadata = {
  title: pagesConfig.contact.metadata.title,
  description: pagesConfig.contact.metadata.description,
};

export default function ContactPage() {
  return (
    <PageContainer
      title={pagesConfig.contact.title}
      description={pagesConfig.contact.description}
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <ProfileCard />
        <ContactForm />
      </div>
    </PageContainer>
  );
}
