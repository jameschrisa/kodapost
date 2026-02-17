"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ImagePlus,
  Mic,
  MicOff,
  Square,
  Loader2,
  User,
  CheckCircle,
  AlertCircle,
  Edit3,
} from "lucide-react";
import { AutomationIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { generateCarousel, transcribeAudio } from "@/app/actions";
import {
  buildProjectFromInput,
  createMessageId,
  type AssistantInput,
  type ChatMessage,
} from "@/lib/assistant/process-message";
import type { CarouselProject, UploadedImage } from "@/lib/types";

// -----------------------------------------------------------------------------
// Chat State Reducer
// -----------------------------------------------------------------------------

type ChatAction =
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "UPDATE_LAST_ASSISTANT"; updates: Partial<ChatMessage> }
  | { type: "CLEAR" };

function chatReducer(state: ChatMessage[], action: ChatAction): ChatMessage[] {
  switch (action.type) {
    case "ADD_MESSAGE":
      return [...state, action.message];
    case "UPDATE_LAST_ASSISTANT": {
      const lastIdx = state.findLastIndex((m) => m.role === "assistant");
      if (lastIdx === -1) return state;
      const updated = [...state];
      updated[lastIdx] = { ...updated[lastIdx], ...action.updates };
      return updated;
    }
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

interface AssistantChatProps {
  /** Called when user approves and wants to publish */
  onApproveToPublish: (project: CarouselProject) => void;
  /** Called when user wants to edit the generated carousel */
  onEditCarousel: (project: CarouselProject) => void;
}

export function AssistantChat({
  onApproveToPublish,
  onEditCarousel,
}: AssistantChatProps) {
  const [messages, dispatch] = useReducer(chatReducer, []);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingImages, setPendingImages] = useState<UploadedImage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isRecording,
    startRecording,
    stopRecording,
    transcription: audioTranscription,
    duration,
    error: audioError,
    reset: resetAudio,
  } = useAudioRecorder();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show audio errors
  useEffect(() => {
    if (audioError) {
      toast.error(audioError);
    }
  }, [audioError]);

  // Process audio transcription after recording stops
  useEffect(() => {
    if (audioTranscription && !isRecording) {
      handleAudioSubmit(audioTranscription);
    }
  }, [audioTranscription, isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add initial greeting
  useEffect(() => {
    dispatch({
      type: "ADD_MESSAGE",
      message: {
        id: createMessageId(),
        role: "assistant",
        content:
          "Hi! I'm your Production Assistant. Send me your photos, record a voice message, or type what you'd like. I'll create a carousel for you to review before posting.",
        timestamp: Date.now(),
      },
    });
  }, []);

  // -- Handlers --

  const processInput = useCallback(
    async (input: AssistantInput) => {
      setIsProcessing(true);

      // Add assistant "thinking" message
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          id: createMessageId(),
          role: "assistant",
          content: "Let me work on that...",
          status: "thinking",
          timestamp: Date.now(),
        },
      });

      try {
        // Build the project from the input
        const images =
          input.type === "image" ? input.images : pendingImages;
        const project = buildProjectFromInput(input, images);

        // Step 1: Analyzing
        dispatch({
          type: "UPDATE_LAST_ASSISTANT",
          updates: {
            content: "Analyzing your images and building the carousel...",
            status: "generating",
          },
        });

        // Step 2: Generate carousel via the existing pipeline
        const result = await generateCarousel(project);

        if (!result.success) {
          dispatch({
            type: "UPDATE_LAST_ASSISTANT",
            updates: {
              content: `Sorry, I ran into an issue: ${result.error}. Try again with different photos or a clearer description.`,
              status: "error",
            },
          });
          setIsProcessing(false);
          return;
        }

        // Step 3: Preview ready
        dispatch({
          type: "UPDATE_LAST_ASSISTANT",
          updates: {
            content:
              "Your carousel is ready! Preview the slides below and choose to publish or edit.",
            status: "preview-ready",
            project: result.data,
          },
        });

        setPendingImages([]);
      } catch (err) {
        dispatch({
          type: "UPDATE_LAST_ASSISTANT",
          updates: {
            content: `Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
            status: "error",
          },
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [pendingImages]
  );

  const handleTextSubmit = useCallback(async () => {
    const text = inputText.trim();
    if (!text && pendingImages.length === 0) return;

    // Add user message
    dispatch({
      type: "ADD_MESSAGE",
      message: {
        id: createMessageId(),
        role: "user",
        content: text || "Create a carousel with these photos",
        images: pendingImages.length > 0 ? [...pendingImages] : undefined,
        timestamp: Date.now(),
      },
    });

    setInputText("");

    if (pendingImages.length > 0) {
      await processInput({
        type: "image",
        images: [...pendingImages],
        message: text,
      });
    } else {
      await processInput({ type: "text", content: text });
    }
  }, [inputText, pendingImages, processInput]);

  const handleAudioSubmit = useCallback(
    async (rawTranscription: string) => {
      // Add user message showing what was transcribed
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          id: createMessageId(),
          role: "user",
          content: rawTranscription,
          audioDuration: duration,
          timestamp: Date.now(),
        },
      });

      setIsProcessing(true);

      // Add assistant "thinking" message
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          id: createMessageId(),
          role: "assistant",
          content: "Processing your voice message...",
          status: "analyzing",
          timestamp: Date.now(),
        },
      });

      try {
        // Clean up transcription via Claude
        const result = await transcribeAudio(rawTranscription);

        const cleanTranscription = result.success
          ? result.data
          : rawTranscription;

        // Show the cleaned transcription
        dispatch({
          type: "UPDATE_LAST_ASSISTANT",
          updates: {
            content: `Got it: "${cleanTranscription}"\n\nNow creating your carousel...`,
            status: "generating",
          },
        });

        // Process as audio input
        await processInput({
          type: "audio",
          transcription: cleanTranscription,
        });
      } catch (err) {
        dispatch({
          type: "UPDATE_LAST_ASSISTANT",
          updates: {
            content: `Failed to process audio: ${err instanceof Error ? err.message : "Unknown error"}`,
            status: "error",
          },
        });
        setIsProcessing(false);
      }

      resetAudio();
    },
    [duration, processInput, resetAudio]
  );

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files?.length) return;

      const newImages: UploadedImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const url = URL.createObjectURL(file);
        newImages.push({
          id: `img_${Date.now()}_${i}`,
          url,
          filename: file.name,
          uploadedAt: new Date().toISOString(),
          usedInSlides: [],
        });
      }

      if (newImages.length > 0) {
        setPendingImages((prev) => [...prev, ...newImages]);
        toast.success(
          `${newImages.length} image${newImages.length > 1 ? "s" : ""} attached`
        );
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleTextSubmit();
      }
    },
    [handleTextSubmit]
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col rounded-xl border bg-card">
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <AutomationIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Production Assistant</h3>
            <p className="text-[11px] text-muted-foreground">
              Send photos, audio, or text to create a carousel
            </p>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex h-[400px] flex-col gap-3 overflow-y-auto p-4 sm:h-[480px]">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex gap-2.5",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    msg.role === "user"
                      ? "bg-foreground/10"
                      : "bg-primary/10"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="h-3.5 w-3.5 text-foreground/60" />
                  ) : (
                    <AutomationIcon className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {/* Image thumbnails */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {msg.images.map((img) => (
                        <div
                          key={img.id}
                          className="h-16 w-16 overflow-hidden rounded-md bg-black/10"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.filename}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Audio indicator */}
                  {msg.audioDuration && (
                    <div className="mb-1 flex items-center gap-1.5 text-xs opacity-70">
                      <Mic className="h-3 w-3" />
                      {msg.audioDuration}s audio
                    </div>
                  )}

                  {/* Status indicator for assistant */}
                  {msg.role === "assistant" && msg.status && (
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs">
                      {msg.status === "error" ? (
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      ) : msg.status === "preview-ready" ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      <span className="capitalize">{msg.status.replace("-", " ")}</span>
                    </div>
                  )}

                  {/* Message content */}
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Preview actions for completed carousels */}
                  {msg.status === "preview-ready" && msg.project && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 gap-1 text-xs"
                        onClick={() => onEditCarousel(msg.project!)}
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => onApproveToPublish(msg.project!)}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Approve & Publish
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Pending images preview */}
        {pendingImages.length > 0 && (
          <div className="border-t px-4 py-2">
            <div className="flex flex-wrap gap-1.5">
              {pendingImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="group relative h-12 w-12 overflow-hidden rounded-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPendingImages((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Remove ${img.filename}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            {/* Image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              aria-label="Attach images"
            >
              <ImagePlus className="h-4 w-4" />
            </Button>

            {/* Audio recording */}
            <Button
              type="button"
              variant={isRecording ? "destructive" : "ghost"}
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing && !isRecording}
              aria-label={isRecording ? "Stop recording" : "Record audio"}
            >
              {isRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <MicOff className="h-3 w-3 animate-pulse" />
                {duration}s
              </div>
            )}

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? "Recording..."
                  : "Describe your carousel or add photos..."
              }
              disabled={isProcessing || isRecording}
              rows={1}
              className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />

            {/* Send button */}
            <Button
              type="button"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleTextSubmit}
              disabled={
                isProcessing ||
                isRecording ||
                (!inputText.trim() && pendingImages.length === 0)
              }
              aria-label="Send message"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
