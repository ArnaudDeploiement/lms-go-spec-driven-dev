"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, type ContentResponse, type ModuleRequest, type ModuleResponse } from "@/lib/api/client";
import { uploadFileToSignedUrl } from "@/lib/uploads";
import { cn } from "@/lib/utils";

type ModuleType = "pdf" | "video" | "article" | "audio" | "document" | "scorm" | "quiz";

const MODULE_OPTIONS: { value: ModuleType; label: string }[] = [
  { value: "pdf", label: "📄 PDF" },
  { value: "video", label: "🎬 Vidéo" },
  { value: "audio", label: "🎵 Audio" },
  { value: "article", label: "📰 Article" },
  { value: "document", label: "📎 Document" },
  { value: "quiz", label: "🧠 Quiz" },
  { value: "scorm", label: "📦 SCORM" },
];

type ModuleContentMode = "select" | "upload";

interface ModuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  courseId: string;
  onModuleCreated: (module: ModuleResponse) => void;
}

interface ModuleFormState {
  title: string;
  moduleType: ModuleType;
  durationMinutes: string;
  mode: ModuleContentMode;
  selectedContentId: string;
  contentName: string;
}

const initialFormState: ModuleFormState = {
  title: "",
  moduleType: "article",
  durationMinutes: "",
  mode: "select",
  selectedContentId: "",
  contentName: "",
};

export function CourseModuleDialog({ isOpen, onClose, organizationId, courseId, onModuleCreated }: ModuleDialogProps) {
  const [form, setForm] = useState<ModuleFormState>(initialFormState);
  const [contents, setContents] = useState<ContentResponse[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [moduleFile, setModuleFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setError(null);
    setUploadProgress(0);
    setIsLoadingContents(true);
    void apiClient
      .listContents(organizationId)
      .then(setContents)
      .catch((err: any) => {
        console.error(err);
        setError(err?.error || "Impossible de charger les contenus disponibles");
      })
      .finally(() => setIsLoadingContents(false));
  }, [isOpen, organizationId]);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialFormState);
      setModuleFile(null);
      setUploadProgress(0);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!moduleFile) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      contentName: prev.contentName || moduleFile.name,
      moduleType: detectModuleType(moduleFile.type) ?? prev.moduleType,
    }));
  }, [moduleFile]);

  const filteredContents = useMemo(
    () => [...contents].sort((a, b) => (a.created_at > b.created_at ? -1 : 1)),
    [contents],
  );

  const selectClass =
    "w-full rounded-[24px] border-0 bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] shadow-[var(--soft-shadow-inset)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]";

  const handleChange = (field: keyof ModuleFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setModuleFile(file);
    if (file) {
      setForm((prev) => ({
        ...prev,
        contentName: prev.contentName || file.name,
      }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!form.title.trim()) {
      setError("Le titre du module est obligatoire");
      return;
    }
    if (form.mode === "select" && !form.selectedContentId) {
      setError("Sélectionnez un contenu existant ou téléversez un fichier");
      return;
    }
    if (form.mode === "upload" && !moduleFile) {
      setError("Choisissez un fichier à téléverser");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let contentId: string | undefined;

      if (form.mode === "select") {
        contentId = form.selectedContentId;
      } else if (moduleFile) {
        const finalName = (form.contentName || moduleFile.name).trim() || moduleFile.name;
        const upload = await apiClient.createContent(organizationId, {
          name: finalName,
          mime_type: moduleFile.type || "application/octet-stream",
          size_bytes: moduleFile.size,
        });

        await uploadFileToSignedUrl(upload.upload_url, moduleFile, setUploadProgress);

        await apiClient.finalizeContent(organizationId, upload.content.id, {
          name: finalName,
          mime_type: moduleFile.type || "application/octet-stream",
          size_bytes: moduleFile.size,
        });

        contentId = upload.content.id;
        setContents((prev) => [upload.content, ...prev]);
      }

      const payload: ModuleRequest = {
        title: form.title.trim(),
        module_type: form.moduleType,
      };

      if (contentId) {
        payload.content_id = contentId;
      }
      if (form.durationMinutes) {
        const minutes = parseInt(form.durationMinutes, 10);
        if (!Number.isNaN(minutes) && minutes > 0) {
          payload.duration_seconds = minutes * 60;
        }
      }

      const created = await apiClient.createModule(organizationId, courseId, payload);
      onModuleCreated(created);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.error || err?.message || "Impossible de créer le module");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.25)] px-4 py-8 backdrop-blur-sm">
      <div className="neo-surface w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Nouveau module</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Configurez le module à ajouter à ce cours.</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && <div className="neo-surface-inset rounded-3xl border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--muted-foreground)]">Titre</label>
              <Input required value={form.title} onChange={handleChange("title")} placeholder="Titre du module" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--muted-foreground)]">Type de module</label>
              <select className={selectClass} value={form.moduleType} onChange={handleChange("moduleType")}>
                {MODULE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted-foreground)]">Durée estimée (minutes)</label>
            <Input type="number" min="1" value={form.durationMinutes} onChange={handleChange("durationMinutes")} placeholder="Ex: 15" />
          </div>

          <div className="space-y-3 neo-surface-inset p-4">
            <div className="flex gap-3">
              <button
                type="button"
                className={cn("neo-pill-item flex-1 justify-center", form.mode === "select" && "neo-pill-item-active")}
                onClick={() => setForm((prev) => ({ ...prev, mode: "select" }))}
              >
                Utiliser un contenu existant
              </button>
              <button
                type="button"
                className={cn("neo-pill-item flex-1 justify-center", form.mode === "upload" && "neo-pill-item-active")}
                onClick={() => setForm((prev) => ({ ...prev, mode: "upload" }))}
              >
                Téléverser un fichier
              </button>
            </div>

            {form.mode === "select" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--muted-foreground)]">Contenu</label>
                {isLoadingContents ? (
                  <p className="text-xs text-[var(--muted-foreground)]">Chargement des contenus…</p>
                ) : filteredContents.length === 0 ? (
                  <p className="neo-surface-inset rounded-3xl border border-dashed border-[rgba(176,184,200,0.4)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                    Aucun contenu n'est disponible pour le moment.
                  </p>
                ) : (
                  <select className={selectClass} value={form.selectedContentId} onChange={handleChange("selectedContentId")}>
                    <option value="">Sélectionnez un contenu…</option>
                    {filteredContents.map((content) => (
                      <option key={content.id} value={content.id}>
                        {content.name} • {content.mime_type}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">Fichier</label>
                  <Input type="file" accept="video/*,audio/*,application/pdf,text/*,application/zip" onChange={handleFileChange} />
                </div>

                {moduleFile && (
                  <div className="neo-surface flex items-center justify-between px-3 py-2 text-sm text-[var(--foreground)]">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{moduleFile.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {(moduleFile.size / 1024 / 1024).toFixed(2)} MB • {moduleFile.type || "Type inconnu"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setModuleFile(null);
                        setForm((prev) => ({ ...prev, contentName: "" }));
                      }}
                    >
                      Retirer
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">Nom du contenu</label>
                  <Input placeholder={moduleFile?.name ?? "Nom du contenu"} value={form.contentName} onChange={handleChange("contentName")} />
                </div>

                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="neo-surface-inset h-3 w-full rounded-full">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#92a1ff] to-[#6dd5fa] transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs font-medium text-[var(--accent-primary)]">Téléversement en cours : {uploadProgress}%</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || (form.mode === "upload" && !moduleFile)}>
              {isSubmitting ? "Ajout en cours…" : "Ajouter le module"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function detectModuleType(mime: string): ModuleType | null {
  const lower = mime.toLowerCase();
  if (lower.includes("video")) return "video";
  if (lower.includes("audio")) return "audio";
  if (lower.includes("pdf")) return "pdf";
  if (lower.includes("html") || lower.includes("text")) return "article";
  if (lower.includes("zip")) return "scorm";
  return null;
}
