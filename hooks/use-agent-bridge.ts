"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";

import { Icons } from "@/components/common/icons";
import { CITATION_KIND_ICON, HIGHLIGHT_DURATION_MS } from "@/config/chat";
import { SKILLS } from "@/config/skills";
import { useChatStore } from "@/hooks/use-chat-store";
import { useModalStore } from "@/hooks/use-modal-store";
import { resolveEntity } from "@/lib/chat/entity-dom";
import { parseEntityId } from "@/lib/chat/protocol";
import { AgentEntityId } from "@/types/chat";

/**
 * Applies the agent-highlight ring to an entity and auto-clears after
 * HIGHLIGHT_DURATION_MS. Scrolls into view ONLY when the element isn't already
 * on-screen — this absorbs the old separate "focus" (no-scroll) behavior, so
 * the page never re-centers something the visitor is already looking at.
 */
function useEntityEmphasis(
  target: AgentEntityId | undefined,
  setActive: (id: AgentEntityId | undefined) => void,
  clear: () => void,
  reducedMotion: boolean
) {
  useEffect(() => {
    if (!target) return;

    const el = resolveEntity(target);
    if (!el) {
      clear();
      return;
    }

    setActive(target);
    el.classList.add("agent-highlighted");
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
    if (!inViewport) {
      el.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }

    const timer = setTimeout(() => {
      el.classList.remove("agent-highlighted");
      setActive(undefined);
      clear();
    }, HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(timer);
      el.classList.remove("agent-highlighted");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reducedMotion]);
}

/**
 * Bridges chat tool-call results to real page effects — one small handler
 * per effect the model can produce (reveal → highlight / skills graph,
 * open_detail → modal, navigate_to → route change). Each is an independent
 * effect keyed off its own pending* store field rather than a single dynamic
 * dispatch table, since React's rules of hooks don't allow looping over a
 * dynamic set of hooks — this is the closest a fixed-hook-count component
 * gets to "keyed by effect."
 */
export function useAgentBridge() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const status = useChatStore((s) => s.status);

  const pendingNavigate = useChatStore((s) => s.pendingNavigate);
  const clearNavigate = useChatStore((s) => s.clearNavigate);

  const pendingHighlight = useChatStore((s) => s.pendingHighlight);
  const clearHighlight = useChatStore((s) => s.clearHighlight);
  const setActiveHighlight = useChatStore((s) => s.setActiveHighlight);

  const pendingOpenModal = useChatStore((s) => s.pendingOpenModal);
  const clearOpenModal = useChatStore((s) => s.clearOpenModal);
  const modalOnOpen = useModalStore((s) => s.onOpen);

  const pendingSkillSelect = useChatStore((s) => s.pendingSkillSelect);
  const clearSkillSelect = useChatStore((s) => s.clearSkillSelect);
  const setGraphCenterSkill = useChatStore((s) => s.setGraphCenterSkill);

  useEffect(() => {
    if (!pendingNavigate) return;
    router.push(pendingNavigate);
    clearNavigate();
  }, [pendingNavigate, router, clearNavigate]);

  useEntityEmphasis(
    pendingHighlight,
    setActiveHighlight,
    clearHighlight,
    Boolean(reducedMotion)
  );

  useEffect(() => {
    if (!pendingOpenModal) return;
    modalOnOpen({
      title: pendingOpenModal.title,
      description: pendingOpenModal.description,
      icon: Icons[CITATION_KIND_ICON[pendingOpenModal.type]],
    });
    clearOpenModal();
  }, [pendingOpenModal, modalOnOpen, clearOpenModal]);

  useEffect(() => {
    if (!pendingSkillSelect) return;
    const parsed = parseEntityId(pendingSkillSelect);
    const skill =
      parsed?.kind === "skill"
        ? SKILLS.find((s) => s.key === parsed.id)
        : undefined;
    if (skill) setGraphCenterSkill(skill.key, skill.category);
    clearSkillSelect();
  }, [pendingSkillSelect, setGraphCenterSkill, clearSkillSelect]);

  return { pendingNavigate, pendingHighlight, status };
}
