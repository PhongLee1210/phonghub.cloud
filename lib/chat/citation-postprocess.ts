import { CitationTarget } from "@/types/chat";
import { parseEntityId } from "@/lib/chat/protocol";

export interface CitationMapping {
  normalizedText: string;
  orderedTargets: CitationTarget[];
}

function isValidTarget(
  marker: string,
  knownTargets: Set<CitationTarget>
): marker is CitationTarget {
  if (marker === "resume") return knownTargets.has("resume");
  if (!parseEntityId(marker)) return false;
  return knownTargets.has(marker as CitationTarget);
}

/**
 * Replaces agentId-based citation markers (e.g. [skill:react]) with
 * sequential numeric markers ([1], [2], ...) in first-mention order.
 *
 * Returns the normalized text and an ordered array of CitationTargets
 * matching the assigned numbers.
 *
 * Fallback: if no agentId markers found, returns text unchanged with
 * empty orderedTargets — caller falls back to Set-based resolution.
 */
export function normalizeCitationMarkers(
  rawText: string,
  knownTargets: Set<CitationTarget>
): CitationMapping {
  const orderMap = new Map<string, number>();
  const orderedTargets: CitationTarget[] = [];
  let foundAny = false;

  const allMarkersRe = /\[([a-z]+:[^\]]+|resume)\]/g;

  const normalizedText = rawText.replace(allMarkersRe, (match, marker: string) => {
    if (!isValidTarget(marker, knownTargets)) return "";

    foundAny = true;

    let number = orderMap.get(marker);
    if (number === undefined) {
      number = orderedTargets.length + 1;
      orderMap.set(marker, number);
      orderedTargets.push(marker as CitationTarget);
    }

    return `[${number}]`;
  });

  if (!foundAny) {
    return { normalizedText: rawText, orderedTargets: [] };
  }

  return { normalizedText, orderedTargets };
}
