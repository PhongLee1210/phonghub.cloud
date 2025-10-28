"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Target } from "lucide-react";
import { marked } from "marked";
import { useState } from "react";

interface BucketItemCardProps {
  id: number;
  text: string;
  status: "completed" | "in-progress" | "pending";
  index: number;
  reducedMotion?: boolean;
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    badgeText: "✅ Completed",
  },
  "in-progress": {
    icon: Clock,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20",
    badgeText: "🚧 In Progress",
  },
  pending: {
    icon: Target,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-muted-foreground/20",
    badgeText: "📋 Pending",
  },
};

export function BucketItemCard({
  id,
  text,
  status,
  index,
  reducedMotion = false,
}: BucketItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const containerVariants = reducedMotion
    ? {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0 },
      }
    : {
        initial: { opacity: 0, y: 20 },
        animate: {
          opacity: 1,
          y: 0,
          transition: {
            delay: index * 0.05,
            duration: 0.4,
            ease: "easeOut",
          },
        },
      };

  const hoverVariants = reducedMotion
    ? {}
    : {
        whileHover: {
          scale: 1.02,
          transition: { type: "spring", stiffness: 400, damping: 10 },
        },
        whileTap: { scale: 0.98 },
      };

  const flipVariants = reducedMotion
    ? {
        initial: { rotateY: 0 },
        animate: { rotateY: 0 },
      }
    : {
        initial: { rotateY: 0 },
        animate: { rotateY: isExpanded ? 180 : 0 },
      };

  return (
    <motion.div
      className="relative"
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-50px" }}
    >
      <motion.div
        className={`relative rounded-lg border cursor-pointer overflow-hidden transition-colors ${config.bgColor} ${config.borderColor}`}
        {...hoverVariants}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
      >
        {/* Animated background gradient on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 pointer-events-none"
          initial={{ x: "-100%" }}
          whileHover={!reducedMotion ? { x: "100%" } : {}}
          transition={{ duration: 0.6 }}
        />

        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="collapsed"
              className="flex items-start gap-3 p-4 relative z-10"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                <motion.div
                  whileHover={!reducedMotion ? { scale: 1.1, rotate: 5 } : {}}
                  whileTap={!reducedMotion ? { scale: 0.95 } : {}}
                >
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1 bg-background text-muted-foreground border-muted-foreground/30"
                  >
                    #{id}
                  </Badge>
                </motion.div>
                <motion.div
                  animate={!reducedMotion ? { y: [0, -2, 0] } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.1,
                  }}
                >
                  <StatusIcon className={`w-5 h-5 ${config.color}`} />
                </motion.div>
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: marked.parseInline(text),
                  }}
                />
              </div>
              <motion.div
                className="text-xs text-muted-foreground flex-shrink-0 pl-2"
                animate={!reducedMotion ? { rotate: isExpanded ? 180 : 0 } : {}}
                transition={{ duration: 0.3 }}
              >
                ▼
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              className="p-4 relative z-10"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-3">
                <Badge className={config.bgColor}>
                  {config.badgeText}
                </Badge>
              </div>
              <div className="flex items-start gap-3">
                <StatusIcon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-1`} />
                <div className="flex-1">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(text),
                    }}
                  />
                  <motion.div
                    className="mt-3 text-xs text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Click to collapse
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
