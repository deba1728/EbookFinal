"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight leading-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">{children}</div>
      )}
    </motion.div>
  );
}
