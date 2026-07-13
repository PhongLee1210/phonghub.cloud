import { EXPERIENCES, ExperienceInterface } from "@/config/experience";

function compareExperienceRecency(
  a: ExperienceInterface,
  b: ExperienceInterface
): number {
  const aCurrent = a.endDate === "Present";
  const bCurrent = b.endDate === "Present";
  if (aCurrent !== bCurrent) return aCurrent ? -1 : 1;
  return b.startDate.getTime() - a.startDate.getTime();
}

export function findMostRecentExperience(): ExperienceInterface {
  return [...EXPERIENCES].sort(compareExperienceRecency)[0];
}

export function getCareerTimeline(): ExperienceInterface[] {
  return [...EXPERIENCES].sort(compareExperienceRecency);
}

export function findCurrentCompany(): ExperienceInterface | undefined {
  return EXPERIENCES.find((experience) => experience.endDate === "Present");
}

export function getPreviousCompanies(): ExperienceInterface[] {
  return EXPERIENCES.filter((experience) => experience.endDate !== "Present");
}
