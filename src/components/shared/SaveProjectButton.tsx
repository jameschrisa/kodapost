"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Save } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { iconSwapVariants, springSnappy } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { saveProject, saveProjectName, loadProjectName } from "@/lib/storage";
import type { CarouselProject } from "@/lib/types";

interface SaveProjectButtonProps {
  project: CarouselProject;
}

export function SaveProjectButton({ project }: SaveProjectButtonProps) {
  const [showNameInput, setShowNameInput] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load existing project name on mount
  useEffect(() => {
    const saved = loadProjectName();
    if (saved) setProjectName(saved);
  }, []);

  const handleSave = useCallback(() => {
    const name = projectName.trim() || "Untitled Project";
    const updatedProject = { ...project, projectName: name };
    saveProject(updatedProject);
    saveProjectName(name);
    setProjectName(name);
    setShowNameInput(false);
    setIsSaved(true);

    toast.success(`Project saved`, {
      description: `"${name}" has been saved.`,
    });

    // Reset saved indicator after 2s
    setTimeout(() => setIsSaved(false), 2000);
  }, [project, projectName]);

  const handleClick = useCallback(() => {
    if (projectName.trim()) {
      // Already has a name — save directly
      handleSave();
    } else {
      // First time — show name input
      setShowNameInput(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [projectName, handleSave]);

  return (
    <Popover open={showNameInput} onOpenChange={setShowNameInput}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          aria-label="Save project"
          className="relative"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isSaved ? (
              <motion.div
                key="check"
                variants={iconSwapVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", ...springSnappy }}
              >
                <Check className="h-5 w-5 text-green-500" />
              </motion.div>
            ) : (
              <motion.div
                key="save"
                variants={iconSwapVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", ...springSnappy }}
              >
                <Save className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium">Name your project</p>
          <Input
            ref={inputRef}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Untitled Project"
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
          <Button
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleSave}
          >
            Save Project
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
