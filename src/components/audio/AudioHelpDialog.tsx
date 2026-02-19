"use client";

import {
  Mic,
  Upload,
  Music,
  Package,
  Scissors,
  Lightbulb,
  FileAudio,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AudioHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AudioHelpDialog({ open, onOpenChange }: AudioHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="h-5 w-5 text-purple-400" />
            Audio Guide
          </DialogTitle>
          <DialogDescription>
            Add audio to create richer, more engaging posts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* What is Audio */}
          <div>
            <h3 className="text-sm font-semibold mb-2">What Does Audio Do?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Adding audio transforms your carousel from a set of static images
              into a <span className="font-medium text-foreground">Nano-Cast package</span> &mdash;
              a bundle containing your images, audio track, and a manifest file.
              This package can be used to create video reels, narrated
              slideshows, or audio-visual posts on platforms that support them.
            </p>
          </div>

          {/* Audio Sources */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Audio Sources</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                  <Mic className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Record Voice</p>
                  <p className="text-xs text-muted-foreground">
                    Narrate your carousel with a voiceover recorded directly in
                    your browser. Supports optional transcription for
                    accessibility.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <Upload className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Upload Audio</p>
                  <p className="text-xs text-muted-foreground">
                    Use your own music or audio file. Supports MP3, WAV, M4A,
                    OGG, WebM, and AAC up to 50 MB.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                  <Music className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Music Library</p>
                  <p className="text-xs text-muted-foreground">
                    Browse royalty-free tracks from Jamendo and Audius. Filter by
                    genre, search by mood, and preview before selecting.
                    Attribution is added to your caption automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What Changes */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              What Changes When You Add Audio?
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <Package className="h-4 w-4 mt-0.5 shrink-0 text-purple-400" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Export format changes</span>{" "}
                  &mdash; your download becomes a Nano-Cast package (ZIP with
                  images, audio file, and manifest.json) instead of a plain
                  image ZIP.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Music className="h-4 w-4 mt-0.5 shrink-0 text-purple-400" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Auto attribution</span>{" "}
                  &mdash; library tracks automatically append artist credit to
                  your caption.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Scissors className="h-4 w-4 mt-0.5 shrink-0 text-purple-400" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Trim to fit</span>{" "}
                  &mdash; use the trim handles to match your audio length to
                  your carousel scroll time.
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Tips
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/50 mt-1">&bull;</span>
                Aim for 3&ndash;5 seconds of audio per slide for comfortable
                scroll pacing.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/50 mt-1">&bull;</span>
                Voice recordings can include transcription for accessibility and
                SEO.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/50 mt-1">&bull;</span>
                Library tracks are royalty-free but require attribution, which is
                automatically added to your caption.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/50 mt-1">&bull;</span>
                No audio? No problem &mdash; your export will be a standard
                image-only ZIP.
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
