import type { ComponentType } from "react";
import { create } from "zustand";

/** Every entry in components/common/icons.tsx's Icons map fits this shape. */
export type ModalIcon = ComponentType<{ className?: string }>;

interface ModalDataProps {
  title: string;
  description: string;
  icon: ModalIcon | null;
}

interface ModalStoreProps {
  isOpen: boolean;
  title: string;
  description: string;
  icon: ModalIcon | null;
  onOpen: (data: ModalDataProps) => void;
  onClose: () => void;
}

export const useModalStore = create<ModalStoreProps>((set) => ({
  isOpen: false,
  title: "",
  description: "",
  icon: null,
  onOpen: (data: ModalDataProps) =>
    set({
      isOpen: true,
      title: data.title,
      description: data.description,
      icon: data.icon,
    }),
  onClose: () => set({ isOpen: false }),
}));
