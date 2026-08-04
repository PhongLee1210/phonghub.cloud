"use client";

import dynamic from "next/dynamic";

const CustomModal = dynamic(
  () =>
    import("@/components/modals/custom-modal").then((m) => ({
      default: m.CustomModal,
    })),
  { ssr: false }
);

export const ModalProvider = () => <CustomModal />;
