import { Metadata } from "next";

import PageContainer from "@/components/common/page-container";
import BucketList from "@/components/list100/bucket-list";
import { pagesConfig } from "@/config/pages";

export const metadata: Metadata = {
  title: pagesConfig.list100.metadata.title,
  description: pagesConfig.list100.metadata.description,
};

export default function List100Page() {
  return (
    <PageContainer
      title={pagesConfig.list100.title}
      description={pagesConfig.list100.description}
    >
      <BucketList />
    </PageContainer>
  );
}
