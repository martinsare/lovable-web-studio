import { supabase } from "@/integrations/supabase/client";

export const DOCUMENT_BUCKETS = {
  businessEntity: "business-entity-documents",
  offering: "offering-documents",
  investorStatement: "investor-statements",
} as const;

export const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024;

export type DocumentBucket = (typeof DOCUMENT_BUCKETS)[keyof typeof DOCUMENT_BUCKETS];

type UploadDocumentInput = {
  bucket: DocumentBucket;
  scopeId: string;
  file: File;
};

export type UploadedDocumentFile = {
  bucket: DocumentBucket;
  path: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
};

export function validateDocumentFile(file: File) {
  if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number])) {
    throw new Error("Unsupported file type. Upload PDF, JPG, PNG, WEBP, or DOCX files.");
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("That file is too large. Keep uploads under 15 MB.");
  }
}

export async function uploadDocumentFile({ bucket, scopeId, file }: UploadDocumentInput): Promise<UploadedDocumentFile> {
  validateDocumentFile(file);

  const path = `${scopeId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) throw error;

  return {
    bucket,
    path,
    originalFilename: file.name,
    mimeType: file.type,
    fileSize: file.size,
  };
}

export async function getDocumentSignedUrl(bucket: DocumentBucket, path: string, filename?: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10, {
    download: filename ?? true,
  });

  if (error) throw error;
  return data.signedUrl;
}

export async function removeStoredDocument(bucket: DocumentBucket, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export function formatDocumentSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeFilename(filename: string) {
  return filename.trim().toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
}
