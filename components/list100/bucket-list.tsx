"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle, Clock, Target, Trophy, Star } from "lucide-react";
import { marked } from "marked";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BucketItemCard } from "./bucket-item-card";
import { AnimatedProgressRing } from "./animated-progress-ring";
import { ConfettiEffect } from "./confetti-effect";

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

interface Achievement {
  id: string;
  name: string;
  description: string;
  threshold: number;
  unlocked: boolean;
  icon: React.ReactNode;
}

export default function BucketList() {
  const [data, setData] = useState<BucketListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [prevUnlockedCount, setPrevUnlockedCount] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    async function loadBucketList() {
      try {
        const response = await fetch("/config/bucket-list.md");
        const markdown = await response.text();
        const parsed = parseMarkdown(markdown);
        setData(parsed);

        const totalItems =
          parsed.completed.length +
          parsed.inProgress.length +
          parsed.pending.length;
        const percentage = (parsed.completed.length / totalItems) * 100;

        setAchievements([
          {
            id: "first_step",
            name: "First Step",
            description: "Complete your first bucket list item",
            threshold: 1,
            unlocked: parsed.completed.length >= 1,
            icon: <Star className="w-5 h-5" />,
          },
          {
            id: "momentum",
            name: "Building Momentum",
            description: "Complete 5 items",
            threshold: 5,
            unlocked: parsed.completed.length >= 5,
            icon: <Trophy className="w-5 h-5" />,
          },
          {
            id: "quarter_way",
            name: "Quarter Way",
            description: "Reach 25% completion",
            threshold: 25,
            unlocked: percentage >= 25,
            icon: <CheckCircle className="w-5 h-5" />,
          },
          {
            id: "halfway",
            name: "Halfway There",
            description: "Reach 50% completion",
            threshold: 50,
            unlocked: percentage >= 50,
            icon: <Trophy className="w-5 h-5" />,
          },
          {
            id: "almost_done",
            name: "Almost Done",
            description: "Reach 75% completion",
            threshold: 75,
            unlocked: percentage >= 75,
            icon: <Star className="w-5 h-5" />,
          },
          {
            id: "legendary",
            name: "Legendary",
            description: "Complete all 100 items",
            threshold: 100,
            unlocked: percentage >= 100,
            icon: <Trophy className="w-5 h-5" />,
          },
        ]);
      } catch (error) {
        console.error("Failed to load bucket list:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBucketList();
  }, []);

  useEffect(() => {
    if (data && data.completed.length > 0 && data.completed.length % 5 === 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [data?.completed.length]);

  function parseMarkdown(markdown: string): BucketListData {
    const lines = markdown.split("\n");
    let currentSection = "";
    const completed: BucketListItem[] = [];
    const inProgress: BucketListItem[] = [];
    const pending: BucketListItem[] = [];
    let startedDate = "";

    lines.forEach((line) => {
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
        let match;
        if (line.match(/^\d+\./)) {
          match = line.match(/^\d+\.\s*\*\*(.*?)\*\*\s*-\s*(.*)$/);
        } else {
          match = line.match(/^\*\*(.*?)\*\*(\s*-\s*(.*))?$/);
        }

        if (match) {
          const [, title, , description] = match;
          const item: BucketListItem = {
            id: 0,
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
        <motion.div
          animate={!reducedMotion ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-muted-foreground"
        >
          Loading bucket list...
        </motion.div>
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

  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-8">
      {showConfetti && <ConfettiEffect />}

      {/* Parallax Background */}
      <motion.div
        className="absolute inset-0 pointer-events-none -z-10"
        initial={{ y: 0 }}
        animate={!reducedMotion ? { y: -20 } : { y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={!reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-0 bg-gradient-to-br from-primary to-accent pointer-events-none"
            whileHover={!reducedMotion ? { opacity: 0.1 } : {}}
          />
          <CardHeader>
            <motion.div
              className="flex items-center gap-2"
              initial={!reducedMotion ? { x: -20, opacity: 0 } : { x: 0, opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <motion.div
                animate={!reducedMotion ? { rotate: 360 } : {}}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Calendar className="w-5 h-5" />
              </motion.div>
              <CardTitle>Started: {data.startedDate}</CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={!reducedMotion ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-1 flex items-center justify-center p-4"
                >
                  <AnimatedProgressRing
                    percentage={completedPercentage}
                    size={140}
                    strokeWidth={6}
                    completed={data.completed.length}
                    total={total}
                    reducedMotion={reducedMotion}
                  />
                </motion.div>

                <motion.div
                  initial={!reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center p-4 rounded-lg bg-background/50 border border-primary/20"
                >
                  <div className="text-3xl font-bold text-primary">
                    {data.completed.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </motion.div>

                <motion.div
                  initial={!reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-center p-4 rounded-lg bg-background/50 border border-accent/20"
                >
                  <div className="text-3xl font-bold text-accent">
                    {data.inProgress.length}
                  </div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </motion.div>

                <motion.div
                  initial={!reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center p-4 rounded-lg bg-background/50 border border-muted-foreground/20"
                >
                  <div className="text-3xl font-bold text-muted-foreground">
                    {data.pending.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </motion.div>
              </div>

              {/* Animated Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <motion.span
                    className="text-sm text-muted-foreground font-semibold"
                    key={data.completed.length}
                    initial={!reducedMotion ? { scale: 1.5, opacity: 0 } : { scale: 1, opacity: 1 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {data.completed.length} / {total}
                  </motion.span>
                </div>
                <div className="relative h-3 rounded-full overflow-hidden bg-muted/30">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completedPercentage}%` }}
                    transition={
                      !reducedMotion
                        ? { duration: 1.5, ease: "easeOut", delay: 0.3 }
                        : {}
                    }
                  />
                </div>
              </div>

              {/* Status Badges with Animation */}
              <div className="flex flex-wrap gap-2">
                <motion.div
                  initial={!reducedMotion ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Badge className="bg-primary/10 text-primary border-primary/20 cursor-pointer">
                    ✅ {data.completed.length} Completed
                  </Badge>
                </motion.div>
                <motion.div
                  initial={!reducedMotion ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <Badge className="bg-accent/10 text-accent-foreground border-accent/20 cursor-pointer">
                    🚧 {data.inProgress.length} In Progress
                  </Badge>
                </motion.div>
                <motion.div
                  initial={!reducedMotion ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Badge className="bg-muted text-muted-foreground border-muted-foreground/20 cursor-pointer">
                    📋 {data.pending.length} Pending
                  </Badge>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements Section */}
      <AnimatePresence>
        {achievements.some((a) => a.unlocked) && (
          <motion.div
            initial={!reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={!reducedMotion ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-amber-200/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    animate={!reducedMotion ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 0.5,
                    }}
                  >
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </motion.div>
                  Achievements Unlocked ({unlockedAchievements}/{achievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={!reducedMotion ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                      animate={
                        achievement.unlocked
                          ? { opacity: 1, scale: 1 }
                          : { opacity: 0.5, scale: 0.95 }
                      }
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border transition-colors ${
                        achievement.unlocked
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-muted/50 border-muted-foreground/20"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <motion.div
                          animate={
                            achievement.unlocked && !reducedMotion
                              ? { y: [0, -2, 0] }
                              : {}
                          }
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: index * 0.1,
                          }}
                          className={achievement.unlocked ? "text-amber-500" : "text-muted-foreground"}
                        >
                          {achievement.icon}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm line-clamp-1">
                            {achievement.name}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {achievement.description}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed Section */}
      {data.completed.length > 0 && (
        <motion.div
          initial={!reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <motion.div
                className="flex items-center gap-2"
                initial={!reducedMotion ? { x: -20, opacity: 0 } : { x: 0, opacity: 1 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <CheckCircle className="w-5 h-5 text-primary" />
                <CardTitle>
                  Completed ({data.completed.length})
                </CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.completed.map((item, index) => (
                  <BucketItemCard
                    key={item.id}
                    {...item}
                    index={index}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* In Progress Section */}
      {data.inProgress.length > 0 && (
        <motion.div
          initial={!reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <motion.div
                className="flex items-center gap-2"
                initial={!reducedMotion ? { x: -20, opacity: 0 } : { x: 0, opacity: 1 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <Clock className="w-5 h-5 text-accent" />
                <CardTitle>
                  In Progress ({data.inProgress.length})
                </CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.inProgress.map((item, index) => (
                  <BucketItemCard
                    key={item.id}
                    {...item}
                    index={index}
                    reducedMotion={reducedMotion}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pending Section */}
      <motion.div
        initial={!reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-muted-foreground/20">
          <CardHeader>
            <motion.div
              className="flex items-center gap-2"
              initial={!reducedMotion ? { x: -20, opacity: 0 } : { x: 0, opacity: 1 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <Target className="w-5 h-5 text-muted-foreground" />
              <CardTitle>
                Pending ({data.pending.length})
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.pending.map((item, index) => (
                <BucketItemCard
                  key={item.id}
                  {...item}
                  index={index}
                  reducedMotion={reducedMotion}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={!reducedMotion ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/20 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/0 via-accent/10 to-primary/0"
            animate={!reducedMotion ? { x: ["-100%", "100%"] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <CardContent className="pt-6 relative z-10">
            <div className="text-center">
              <motion.h3
                className="text-lg font-semibold text-primary mb-2"
                initial={!reducedMotion ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                Have Recommendations?
              </motion.h3>
              <motion.p
                className="text-primary/80 mb-4"
                initial={!reducedMotion ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.65 }}
              >
                Think there&apos;s something I should add to my bucket list?
                I&apos;d love to hear your suggestions!
              </motion.p>
              <motion.div
                initial={!reducedMotion ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                whileHover={!reducedMotion ? { scale: 1.05 } : {}}
              >
                <Badge className="bg-primary/10 text-primary border-primary/30 cursor-pointer px-4 py-2">
                  Contact me through the contact page
                </Badge>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
