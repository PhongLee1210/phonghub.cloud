import React from "react";
import { ClientPageWrapper } from "./client-page-wrapper";
import PageHeader from "./page-header";

interface PageContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function PageContainer({
  title,
  description,
  children,
}: PageContainerProps) {
  return (
    <ClientPageWrapper>
      <main className="container mx-auto px-4 pb-4 pt-[calc(var(--safe-top,0px)+4.5rem)]">
        {description ? (
          <>
            <PageHeader title={title} description={description} />
            <div className="mx-6">{children}</div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-6 capitalize">{title}</h1>
            {children}
          </>
        )}
      </main>
    </ClientPageWrapper>
  );
}
