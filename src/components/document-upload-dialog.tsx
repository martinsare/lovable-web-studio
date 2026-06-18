import { useEffect, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDocumentSize, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/document-storage";

type UploadPayload = {
  title: string;
  documentType: string;
  description: string;
  versionLabel?: string;
  visibility?: string;
  file: File;
};

type DocumentUploadDialogProps = {
  buttonLabel: string;
  title: string;
  description: string;
  documentTypes: string[];
  onSubmit: (payload: UploadPayload) => Promise<void>;
  visibilityOptions?: Array<{ label: string; value: string }>;
  includeVersionLabel?: boolean;
};

export function DocumentUploadDialog({
  buttonLabel,
  title,
  description,
  documentTypes,
  onSubmit,
  visibilityOptions,
  includeVersionLabel = false,
}: DocumentUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    documentType: documentTypes[0] ?? "General document",
    description: "",
    versionLabel: "",
    visibility: visibilityOptions?.[0]?.value ?? "investors",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) {
      setForm({
        title: "",
        documentType: documentTypes[0] ?? "General document",
        description: "",
        versionLabel: "",
        visibility: visibilityOptions?.[0]?.value ?? "investors",
      });
      setFile(null);
      setSubmitting(false);
    }
  }, [documentTypes, open, visibilityOptions]);

  async function handleSubmit() {
    if (!file) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim() || file.name,
        documentType: form.documentType,
        description: form.description.trim(),
        versionLabel: includeVersionLabel ? form.versionLabel.trim() || undefined : undefined,
        visibility: visibilityOptions ? form.visibility : undefined,
        file,
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  const fileSummary = file
    ? `${file.name} · ${formatDocumentSize(file.size)}`
    : `Accepted: PDF, JPG, PNG, WEBP, DOCX · Max ${formatDocumentSize(MAX_DOCUMENT_SIZE_BYTES)}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-brand rounded-xl text-white shadow-brand">
          <UploadCloud className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="document-file">Document file</Label>
            <Input
              id="document-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">{fileSummary}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="document-title">Title</Label>
            <Input
              id="document-title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Investor term sheet - June 2026"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="document-type">Document type</Label>
              <select
                id="document-type"
                value={form.documentType}
                onChange={(event) => setForm((current) => ({ ...current, documentType: event.target.value }))}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {documentTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {visibilityOptions ? (
              <div className="grid gap-2">
                <Label htmlFor="document-visibility">Visibility</Label>
                <select
                  id="document-visibility"
                  value={form.visibility}
                  onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {visibilityOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {includeVersionLabel ? (
            <div className="grid gap-2">
              <Label htmlFor="document-version">Version label</Label>
              <Input
                id="document-version"
                value={form.versionLabel}
                onChange={(event) => setForm((current) => ({ ...current, versionLabel: event.target.value }))}
                placeholder="v1.0"
              />
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="document-description">Description</Label>
            <Textarea
              id="document-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="What this file is, why it matters, and who should review it."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || !file}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {submitting ? "Uploading..." : "Upload document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
