import { Icons } from "@/components/common/icons";
import Rating from "@/components/skills/rating";
import { SkillCategory } from "@/config/skills";

function getSkillIcon(iconName: string) {
  const key = iconName as keyof typeof Icons;
  return Icons[key] ?? Icons.settings;
}

interface SkillsSectionProps {
  categories: SkillCategory[];
}

export default function SkillsSection({ categories }: SkillsSectionProps) {
  return (
    <div className="space-y-12">
      {categories.map((category, categoryIndex) => (
        <section key={categoryIndex} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {category.title}
            </h2>
            <p className="text-muted-foreground">{category.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.skills.map((skill, skillIndex) => {
              const IconComponent = getSkillIcon(skill.icon);
              return (
                <div
                  key={skillIndex}
                  data-agent-id={`skill:${skill.key}`}
                  className="group relative overflow-hidden rounded-lg border bg-background p-2 transition-all hover:shadow-md hover:shadow-primary/5"
                >
                  <div className="flex h-[230px] flex-col justify-between rounded-md p-6 sm:h-[230px]">
                    <IconComponent
                      size={50}
                      className="text-primary transition-colors group-hover:text-primary/80"
                    />
                    <div className="space-y-2">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {skill.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {skill.description}
                      </p>
                      <Rating stars={skill.rating} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
