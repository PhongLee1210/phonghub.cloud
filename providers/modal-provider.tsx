"use client";

import { useSyncExternalStore } from "react";

import { CustomModal } from "@/components/modals/custom-modal";

const emptySubscribe = () => () => {};

export const ModalProvider = () => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <CustomModal />
    </>
  );
};
