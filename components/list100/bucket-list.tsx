"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle, Clock, Target } from "lucide-react";
import { marked } from "marked";
import { useEffect, useState } from "react";

interface BucketListItem {
  id: number;
  text: string;
  completedDate?: string;
  status: "completed" | "in-progress" | "pending";
}

interface BucketListData {
  startedDate: string;
  completed: BucketListItem[];
  inProgress: BucketListItem[];
  pending: BucketListItem[];
}

// To update the bucket list:
// 1. Edit config/bucket-list.md
// 2. Move items between sections by changing the section headers
// 3. Add new items to the "Pending" section
// 4. Mark items as completed by moving them to "Completed" section
// 5. Add completion dates if desired
// 6. Changes will be reflected automatically when deployed

export default function BucketList() {
  const [data, setData] = useState<BucketListData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBucketList() {
      try {
        const response = await fetch("/config/bucket-list.md");
        const markdown = await response.text();
        const parsed = parseMarkdown(markdown);
        setData(parsed);
      } catch (error) {
        console.error("Failed to load bucket list:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBucketList();
  }, []);

  function parseMarkdown(markdown: string): BucketListData {
    const lines = markdown.split("\n");
    let currentSection = "";
    const completed: BucketListItem[] = [];
    const inProgress: BucketListItem[] = [];
    const pending: BucketListItem[] = [];
    let startedDate = "";

    lines.forEach((line, index) => {
      if (line.startsWith("Started:")) {
        startedDate = line.replace("Started:", "").trim();
      } else if (line.includes("## ✅ Completed")) {
        currentSection = "completed";
      } else if (line.includes("## 🚧 In Progress")) {
        currentSection = "in-progress";
      } else if (line.includes("## 📋 Pending")) {
        currentSection = "pending";
      } else if (
        currentSection &&
        line.trim() !== "" &&
        (line.includes("**") || line.match(/^\d+\./))
      ) {
        // This is a list item - auto-number based on section position
        let match;
        if (line.match(/^\d+\./)) {
          // Old format with numbers
          match = line.match(/^\d+\.\s*\*\*(.*?)\*\*\s*-\s*(.*)$/);
        } else {
          // New format without numbers (starts with **)
          match = line.match(/^\*\*(.*?)\*\*(\s*-\s*(.*))?$/);
        }

        if (match) {
          const [, title, , description] = match;
          const item: BucketListItem = {
            id: 0, // Will be auto-generated based on position
            text: description
              ? `**${title}** - ${description}`
              : `**${title}**`,
            status: currentSection as "completed" | "in-progress" | "pending",
          };

          if (currentSection === "completed") {
            completed.push(item);
          } else if (currentSection === "in-progress") {
            inProgress.push(item);
          } else if (currentSection === "pending") {
            pending.push(item);
          }
        }
      }
    });

    // Auto-generate IDs based on position in each section
    return {
      startedDate,
      completed: completed.map((item, index) => ({ ...item, id: index + 1 })),
      inProgress: inProgress.map((item, index) => ({ ...item, id: index + 1 })),
      pending: pending.map((item, index) => ({ ...item, id: index + 1 })),
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading bucket list...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive">Failed to load bucket list</div>
      </div>
    );
  }

  const total =
    data.completed.length + data.inProgress.length + data.pending.length;
  const completedPercentage =
    total > 0 ? (data.completed.length / total) * 100 : 0;

  const getSectionIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-accent" />;
      case "pending":
        return <Target className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getSectionColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary/5 border-primary/20";
      case "in-progress":
        return "bg-accent/10 border-accent/20";
      case "pending":
        return "bg-muted/50 border-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Started: {data.startedDate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {data.completed.length} / {total} completed
              </span>
            </div>
            <Progress value={completedPercentage} className="h-2" />
            <div className="flex gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20"
              >
                ✅ {data.completed.length} Completed
              </Badge>
              <Badge
                variant="secondary"
                className="bg-accent/10 text-accent-foreground border-accent/20"
              >
                🚧 {data.inProgress.length} In Progress
              </Badge>
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground border-muted-foreground/20"
              >
                📋 {data.pending.length} Pending
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Section */}
      {data.completed.length > 0 && (
        <Card className={getSectionColor("completed")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getSectionIcon("completed")}
              Completed ({data.completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.completed.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 bg-card rounded-lg border"
                >
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20"
                    >
                      #{item.id}
                    </Badge>
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  </div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: marked.parseInline(item.text),
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress Section */}
      {data.inProgress.length > 0 && (
        <Card className={getSectionColor("in-progress")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getSectionIcon("in-progress")}
              In Progress ({data.inProgress.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.inProgress.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 bg-card rounded-lg border"
                >
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-1 bg-accent/10 text-accent border-accent/20"
                    >
                      #{item.id}
                    </Badge>
                    <Clock className="w-5 h-5 text-accent mt-0.5" />
                  </div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: marked.parseInline(item.text),
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Section */}
      <Card className={getSectionColor("pending")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getSectionIcon("pending")}
            Pending ({data.pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.pending.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-card rounded-lg border"
              >
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1 bg-muted/50 text-muted-foreground border-muted-foreground/20"
                  >
                    #{item.id}
                  </Badge>
                  <Target className="w-5 h-5 text-muted-foreground mt-0.5" />
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: marked.parseInline(item.text),
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-primary mb-2">
              Have Recommendations?
            </h3>
            <p className="text-primary/80 mb-4">
              Think there&apos;s something I should add to my bucket list?
              I&apos;d love to hear your suggestions!
            </p>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30"
            >
              Contact me through the contact page
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
