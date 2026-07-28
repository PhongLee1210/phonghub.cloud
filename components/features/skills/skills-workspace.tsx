"use client";

import { useMemo, useState } from "react";

import Rating from "@/components/skills/rating";
import { ISkill, SkillCategory } from "@/config/skills";
import { getSkillIcon } from "@/lib/get-skill-icon";
import { cn } from "@/lib/utils";

interface SkillsWorkspaceProps {
  categories: SkillCategory[];
}

export default function SkillsWorkspace({ categories }: SkillsWorkspaceProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedSkillKey, setSelectedSkillKey] = useState<string | null>(
    null
  );

  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((category) => !activeCategory || category.title === activeCategory)
      .map((category) => ({
        ...category,
        skills: category.skills.filter((skill) =>
          q ? skill.name.toLowerCase().includes(q) : true
        ),
      }))
      .filter((category) => category.skills.length > 0);
  }, [categories, activeCategory, query]);

  const selectedSkill: ISkill | null = useMemo(() => {
    if (!selectedSkillKey) return null;
    for (const category of categories) {
      const match = category.skills.find(
        (skill) => skill.key === selectedSkillKey
      );
      if (match) return match;
    }
    return null;
  }, [categories, selectedSkillKey]);

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr_18rem]">
      {/* Left rail: query + category filters */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border bg-background p-4">
          <label htmlFor="skills-search" className="sr-only">
            Search skills
          </label>
          <input
            id="skills-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search skills..."
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Categories
          </h2>
          <div className="flex flex-wrap gap-2 lg:flex-col">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={cn(
                "rounded-md px-3 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.title}
                type="button"
                onClick={() => setActiveCategory(category.title)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeCategory === category.title
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Center: skill grid grouped by category */}
      <div className="space-y-10">
        {visibleCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No skills match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          visibleCategories.map((category) => (
            <section key={category.title} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {category.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {category.skills.map((skill) => {
                  const IconComponent = getSkillIcon(skill.icon);
                  const isSelected = skill.key === selectedSkillKey;
                  return (
                    <button
                      key={skill.key}
                      type="button"
                      data-agent-id={`skill:${skill.key}`}
                      onClick={() => setSelectedSkillKey(skill.key)}
                      aria-pressed={isSelected}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg border bg-background p-3 text-left transition-all hover:shadow-md hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected && "border-primary ring-1 ring-primary"
                      )}
                    >
                      <IconComponent
                        size={28}
                        className="shrink-0 text-primary transition-colors group-hover:text-primary/80"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {skill.name}
                        </div>
                        <Rating stars={skill.rating} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Right rail: detail panel */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border bg-background p-4">
          {selectedSkill ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const IconComponent = getSkillIcon(selectedSkill.icon);
                  return (
                    <IconComponent size={32} className="text-primary" />
                  );
                })()}
                <h3 className="text-lg font-bold text-foreground">
                  {selectedSkill.name}
                </h3>
              </div>
              <Rating stars={selectedSkill.rating} />
              <p className="text-sm text-muted-foreground">
                {selectedSkill.description}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a skill to see details.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
