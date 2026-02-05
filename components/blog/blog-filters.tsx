"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { BlogPostSummary } from "@/lib/blog/service";
import { useMemo } from "react";

interface BlogFiltersProps {
  posts: BlogPostSummary[];
  filters: {
    category: string;
    tag: string;
    search: string;
  };
  onChange: (filters: {
    category: string;
    tag: string;
    search: string;
  }) => void;
}

export default function BlogFilters({
  posts,
  filters,
  onChange,
}: BlogFiltersProps) {
  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category));
    return Array.from(set).sort();
  }, [posts]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const categoryOptions: SelectOption[] = [
    { value: "", label: "All Categories" },
    ...categories.map((cat) => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
    })),
  ];

  const tagOptions: SelectOption[] = [
    { value: "", label: "All Tags" },
    ...tags.map((tag) => ({
      value: tag,
      label: `#${tag}`,
    })),
  ];

  return (
    <form
      className="flex flex-col md:flex-row gap-4 items-center mb-6"
      role="search"
      aria-label="Blog post filters"
      onSubmit={(e) => e.preventDefault()}
    >
      <Input
        type="search"
        className="w-full md:w-64"
        placeholder="Search blog posts..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        aria-label="Search blog posts"
      />
      <Select
        options={categoryOptions}
        value={filters.category}
        onValueChange={(value) => onChange({ ...filters, category: value })}
        placeholder="All Categories"
        className="w-full md:w-48"
      />
      <Select
        options={tagOptions}
        value={filters.tag}
        onValueChange={(value) => onChange({ ...filters, tag: value })}
        placeholder="All Tags"
        className="w-full md:w-48"
      />
      {(filters.category || filters.tag || filters.search) && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => onChange({ category: "", tag: "", search: "" })}
          aria-label="Clear filters"
        >
          Clear
        </Button>
      )}
    </form>
  );
}
