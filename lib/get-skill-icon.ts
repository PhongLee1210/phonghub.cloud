import { Icons } from "@/components/common/icons";

export function getSkillIcon(iconName: string) {
  const key = iconName as keyof typeof Icons;
  return Icons[key] ?? Icons.settings;
}
