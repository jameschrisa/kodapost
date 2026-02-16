"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { FileSpreadsheet, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CSVRow {
  primary: string;
  secondary?: string;
}

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slideCount: number;
  onImport: (data: CSVRow[]) => void;
}

// Flexible column matching — accepts common names for headline and subtitle
const PRIMARY_ALIASES = ["headline", "primary", "title", "heading", "text"];
const SECONDARY_ALIASES = ["caption", "subtitle", "secondary", "description", "subtext"];

function findColumn(headers: string[], aliases: string[]): string | null {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

export function CSVImportDialog({
  open,
  onOpenChange,
  slideCount,
  onImport,
}: CSVImportDialogProps) {
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const primaryCol = findColumn(headers, PRIMARY_ALIASES);

        if (!primaryCol) {
          setError(
            `Could not find a headline column. Expected one of: ${PRIMARY_ALIASES.join(", ")}. ` +
            `Found columns: ${headers.join(", ")}`
          );
          setParsedData([]);
          return;
        }

        const secondaryCol = findColumn(headers, SECONDARY_ALIASES);

        const rows: CSVRow[] = [];
        for (const row of results.data as Record<string, string>[]) {
          const primary = row[primaryCol]?.trim();
          if (!primary) continue;
          rows.push({
            primary,
            secondary: secondaryCol ? row[secondaryCol]?.trim() || undefined : undefined,
          });
        }

        if (rows.length === 0) {
          setError("CSV has no valid rows with headline text.");
          setParsedData([]);
          return;
        }

        setParsedData(rows);
      },
      error: () => {
        setError("Failed to parse CSV file. Please check the format.");
        setParsedData([]);
      },
    });
  }

  function handleApply() {
    if (parsedData.length === 0) return;
    onImport(parsedData);
    toast.success("CSV imported", {
      description: `Applied text to ${Math.min(parsedData.length, slideCount)} slides.`,
    });
    handleClose();
  }

  function handleClose() {
    setParsedData([]);
    setFileName(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Headlines from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with headline and optional subtitle columns.
            Rows map to slides in order (row 1 = slide 1).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File input */}
          <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {fileName ? fileName : "Choose a CSV file"}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              {fileName ? "Choose Different File" : "Select File"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Columns: headline (or title/primary) + caption (or subtitle/secondary)
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Preview table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Preview ({parsedData.length} rows, {slideCount} slides)
              </p>
              <div className="max-h-48 overflow-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="w-10 px-2 py-1.5 text-left font-medium">#</th>
                      <th className="px-2 py-1.5 text-left font-medium">Headline</th>
                      <th className="px-2 py-1.5 text-left font-medium">Subtitle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, i) => (
                      <tr
                        key={i}
                        className={i >= slideCount ? "opacity-40" : ""}
                      >
                        <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-1 truncate max-w-[200px]">{row.primary}</td>
                        <td className="px-2 py-1 truncate max-w-[200px] text-muted-foreground">
                          {row.secondary || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > slideCount && (
                <p className="text-xs text-muted-foreground">
                  Only the first {slideCount} rows will be applied (matching your slide count).
                </p>
              )}
              {parsedData.length < slideCount && (
                <p className="text-xs text-muted-foreground">
                  CSV has {parsedData.length} rows but you have {slideCount} slides.
                  Remaining slides will keep their current text.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={parsedData.length === 0}>
            Apply to Slides
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
