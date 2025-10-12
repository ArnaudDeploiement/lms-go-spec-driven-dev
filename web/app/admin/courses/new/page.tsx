"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { apiClient, type ContentResponse } from "@/lib/api/client";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Plus,
  X,
  Trash2,
  Link as LinkIcon,
  UploadCloud,
  PlayCircle,
  FileText,
} from "lucide-react";
import { uploadFileToSignedUrl } from "@/lib/uploads";

type ModuleType = "pdf" | "video" | "article" | "audio" | "document";

type ModuleContentMode = "select" | "upload" | "youtube" | "text";

interface ModuleData {
  id: string;
  title: string;
  module_type: ModuleType;
  content_id?: string;
  content_name?: string;
  duration_minutes?: number;
  data?: Record<string, any>;
}

const MODULE_TYPE_OPTIONS = [
  { value: "pdf" as ModuleType, label: "📄 PDF" },
  { value: "video" as ModuleType, label: "🎬 Vidéo" },
  { value: "audio" as ModuleType, label: "🎵 Audio" },
  { value: "document" as ModuleType, label: "📝 Document" },
  { value: "article" as ModuleType, label: "📰 Article" },
];

const getModuleIcon = (type: ModuleType) => {
  switch (type) {
    case "pdf": return "📄";
    case "video": return "🎬";
    case "audio": return "🎵";
    case "document": return "📝";
    case "article": return "📰";
    default: return "📎";
  }
};

function CourseWizardContent() {
  const router = useRouter();
  const { organization, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [contents, setContents] = useState<ContentResponse[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleType, setModuleType] = useState<ModuleType>("pdf");
  const [selectedContentId, setSelectedContentId] = useState("");
  const [moduleDuration, setModuleDuration] = useState("");
  const [moduleContentMode, setModuleContentMode] = useState<ModuleContentMode>("select");
  const [moduleFile, setModuleFile] = useState<File | null>(null);
  const [moduleContentName, setModuleContentName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [richTextHtml, setRichTextHtml] = useState("<p></p>");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const richTextRef = useRef<HTMLDivElement | null>(null);
  const richTextIsEmpty = !richTextHtml || richTextHtml.replace(/<[^>]+>/g, "").trim() === "";

  useEffect(() => {
    if (organization && !authLoading) {
      loadContents();
    }
  }, [organization, authLoading]);

  useEffect(() => {
    if (!moduleFile) return;

    setModuleContentName((current) => current || moduleFile.name);
    setModuleTitle((current) => {
      if (current.trim()) return current;
      const nameWithoutExtension = moduleFile.name.replace(/\.[^/.]+$/, "");
      return nameWithoutExtension;
    });

    const mime = moduleFile.type?.toLowerCase() || "";
    if (mime.includes("video")) {
      setModuleType("video");
    } else if (mime.includes("audio")) {
      setModuleType("audio");
    } else if (mime.includes("pdf")) {
      setModuleType("pdf");
    } else if (mime.includes("html") || mime.includes("text")) {
      setModuleType("article");
    } else if (mime) {
      setModuleType("document");
    }
  }, [moduleFile]);

  const handleContentModeChange = (mode: ModuleContentMode) => {
    setModuleContentMode(mode);
    setError(null);

    if (mode !== "select") {
      setSelectedContentId("");
    }
    if (mode !== "upload") {
      setModuleFile(null);
      setModuleContentName("");
      setUploadProgress(0);
    }
    if (mode !== "youtube") {
      setYoutubeUrl("");
    } else {
      setModuleType("video");
    }
    if (mode !== "text") {
      setRichTextHtml("<p></p>");
    } else {
      setModuleType("article");
    }
  };

  const loadContents = async () => {
    if (!organization) return;
    setLoadingContents(true);
    try {
      const data = await apiClient.listContents(organization.id);
      setContents(data);
    } catch (err: any) {
      console.error("Failed to load contents:", err);
      setError("Impossible de charger les contenus");
    } finally {
      setLoadingContents(false);
    }
  };

  const handleModuleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      setModuleFile(file);
      setModuleContentName((current) => current || file.name);
    }
    event.target.value = "";
  };

  const handleRichTextCommand = (command: string, value?: string) => {
    if (!richTextRef.current) return;
    document.execCommand(command, false, value ?? "");
    setRichTextHtml(richTextRef.current.innerHTML);
  };

  const handleRichTextInput = () => {
    if (!richTextRef.current) return;
    setRichTextHtml(richTextRef.current.innerHTML);
  };

  const normalizeYoutubeEmbedUrl = (raw: string) => {
    try {
      const url = new URL(raw.trim());
      let videoId = "";
      if (url.hostname.includes("youtu.be")) {
        videoId = url.pathname.replace("/", "");
      } else if (url.hostname.includes("youtube.com")) {
        if (url.pathname.startsWith("/embed/")) {
          videoId = url.pathname.split("/").pop() ?? "";
        } else {
          videoId = url.searchParams.get("v") ?? "";
        }
      }
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}`;
    } catch (error) {
      return null;
    }
  };

  const getFilteredContents = () => {
    return contents.filter((content) => {
      const mime = content.mime_type.toLowerCase();
      switch (moduleType) {
        case "pdf": return mime.includes("pdf");
        case "video": return mime.includes("video") || mime.includes("mp4") || mime.includes("webm");
        case "audio": return mime.includes("audio") || mime.includes("mp3") || mime.includes("wav");
        case "document": return mime.includes("word") || mime.includes("document") || mime.includes("text");
        case "article": return mime.includes("html") || mime.includes("text");
        default: return true;
      }
    });
  };

  const handleNext = () => {
    if (step === 1 && !title.trim()) {
      setError("Veuillez saisir un titre pour le cours");
      return;
    }
    if (step === 2 && modules.length === 0) {
      setError("Veuillez ajouter au moins un module");
      return;
    }
    setError(null);
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addModule = async () => {
    if (!moduleTitle.trim()) {
      setError("Veuillez saisir un titre pour le module");
      return;
    }
    if (moduleContentMode === "select" && !selectedContentId) {
      setError("Veuillez sélectionner un contenu pour ce module");
      return;
    }
    if (moduleContentMode === "upload" && !moduleFile) {
      setError("Veuillez choisir un fichier à téléverser");
      return;
    }
    if (moduleContentMode === "youtube" && !youtubeUrl.trim()) {
      setError("Veuillez ajouter l'URL de la vidéo YouTube");
      return;
    }
    if (moduleContentMode === "text" && richTextIsEmpty) {
      setError("Veuillez saisir un contenu texte pour ce module");
      return;
    }

    setIsSavingModule(true);
    setError(null);

    try {
      let contentId: string | undefined = moduleContentMode === "select" ? selectedContentId : undefined;
      let contentName = "";
      let data: Record<string, any> | undefined;
      let finalModuleType: ModuleType = moduleType;

      if (moduleContentMode === "select") {
        const selectedContent = contents.find((c) => c.id === selectedContentId);
        if (!selectedContent) {
          throw new Error("Contenu introuvable");
        }
        contentName = selectedContent.name;
      } else if (moduleContentMode === "upload" && moduleFile && organization) {
        const finalName = moduleContentName.trim() || moduleFile.name;
        const upload = await apiClient.createContent(organization.id, {
          name: finalName,
          mime_type: moduleFile.type || "application/octet-stream",
          size_bytes: moduleFile.size,
        });

        await uploadFileToSignedUrl(upload.upload_url, moduleFile, setUploadProgress);

        await apiClient.finalizeContent(organization.id, upload.content.id, {
          name: finalName,
          mime_type: moduleFile.type || "application/octet-stream",
          size_bytes: moduleFile.size,
        });

        await loadContents();
        contentId = upload.content.id;
        contentName = finalName;
      } else if (moduleContentMode === "youtube") {
        const embedUrl = normalizeYoutubeEmbedUrl(youtubeUrl);
        if (!embedUrl) {
          setError("URL YouTube invalide");
          return;
        }
        finalModuleType = "video";
        data = {
          kind: "youtube",
          url: youtubeUrl.trim(),
          embed_url: embedUrl,
        };
        contentName = "Vidéo YouTube";
        contentId = undefined;
      } else if (moduleContentMode === "text") {
        finalModuleType = "article";
        data = {
          kind: "richtext",
          html: richTextHtml,
        };
        contentName = "Contenu texte personnalisé";
        contentId = undefined;
      }

      if ((moduleContentMode === "select" || moduleContentMode === "upload") && !contentId) {
        throw new Error("Contenu introuvable");
      }

      const newModule: ModuleData = {
        id: `temp-${Date.now()}`,
        title: moduleTitle.trim(),
        module_type: finalModuleType,
        content_id: contentId,
        content_name: contentName || undefined,
        duration_minutes: moduleDuration ? parseInt(moduleDuration, 10) : undefined,
        data,
      };

      setModules([...modules, newModule]);
      setModuleTitle("");
      setSelectedContentId("");
      setModuleDuration("");
      handleContentModeChange("select");
      setShowModuleForm(false);
      setSuccessMessage("Module ajouté avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || err?.error || "Impossible d'ajouter le module");
    } finally {
      setIsSavingModule(false);
      setUploadProgress(0);
    }
  };

  const removeModule = (id: string) => {
    setModules(modules.filter((m) => m.id !== id));
  };

  const handleSubmit = async () => {
    if (!organization) {
      setError("Organisation introuvable");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s_]+/g, "-");
      const course = await apiClient.createCourse(organization.id, {
        title: title.trim(),
        slug,
        description: description.trim(),
      });

      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        await apiClient.createModule(organization.id, course.id, {
          title: module.title,
          module_type: module.module_type,
          content_id: module.content_id ?? undefined,
          duration_seconds: module.duration_minutes ? module.duration_minutes * 60 : undefined,
          data: module.data,
        });
      }

      if (autoPublish) {
        await apiClient.publishCourse(organization.id, course.id);
      }

      router.push(`/admin?msg=${encodeURIComponent("Cours créé avec succès !")}`);
    } catch (err: any) {
      console.error("Error creating course:", err);
      setError(err?.error || "Impossible de créer le cours. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-slate-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <Card className="p-8 text-center max-w-md">
            <p className="text-slate-600 mb-4">Vous devez être connecté à une organisation</p>
            <Button onClick={() => router.push("/admin")}>Retour</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Créer un nouveau cours</h1>
            <p className="mt-1 text-sm text-slate-600">Assistant guidé en {step}/3 étapes</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin")} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Annuler
          </Button>
        </div>

        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s, idx) => (
              <div key={s} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors ${s < step ? "bg-green-600 text-white" : s === step ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {s < step ? <Check className="h-5 w-5" /> : s}
                  </div>
                  <span className={`text-sm font-medium ${s === step ? "text-blue-600" : s < step ? "text-green-600" : "text-slate-500"}`}>
                    {s === 1 ? "Informations" : s === 2 ? "Modules" : "Révision"}
                  </span>
                </div>
                {idx < 2 && <div className={`mx-4 h-1 flex-1 transition-colors ${s < step ? "bg-green-600" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
        </Card>

        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {successMessage && <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

        <Card className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Informations du cours</h2>
                <p className="text-sm text-slate-600">Donnez un titre et une description à votre cours</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Titre du cours <span className="text-red-500">*</span></label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Introduction au Marketing Digital" className="text-base" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Décrivez les objectifs et le contenu de ce cours..." />
              </div>
              <div className="flex justify-end pt-6 border-t">
                <Button onClick={handleNext} className="flex items-center gap-2">Suivant : Ajouter des modules <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-1">Modules du cours</h2>
                  <p className="text-sm text-slate-600">{modules.length} module(s) • Chaque module doit être lié à un contenu</p>
                </div>
                {!showModuleForm && (
                  <Button
                    onClick={() => {
                      setShowModuleForm(true);
                      handleContentModeChange("select");
                      setSelectedContentId("");
                      setModuleTitle("");
                      setModuleDuration("");
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />Ajouter un module
                  </Button>
                )}
              </div>

              {showModuleForm && (
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Nouveau module</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowModuleForm(false);
                        setError(null);
                        setSelectedContentId("");
                        setModuleTitle("");
                        setModuleDuration("");
                        handleContentModeChange("select");
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Titre du module <span className="text-red-500">*</span></label>
                      <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="Ex: Introduction générale" autoFocus />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Type de module <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {MODULE_TYPE_OPTIONS.map((option) => {
                          const isDisabled =
                            (moduleContentMode === "youtube" && option.value !== "video") ||
                            (moduleContentMode === "text" && option.value !== "article");
                          return (
                            <button
                              key={option.value}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                if (isDisabled) return;
                                setModuleType(option.value);
                                setSelectedContentId("");
                              }}
                              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                                moduleType === option.value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                              } ${isDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                            >
                              <div className="font-medium text-sm">{option.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Source du contenu <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handleContentModeChange("select")}
                            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${moduleContentMode === "select" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}
                          >
                            <LinkIcon className="h-4 w-4" />Contenu existant
                          </button>
                          <button
                            type="button"
                            onClick={() => handleContentModeChange("upload")}
                            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${moduleContentMode === "upload" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}
                          >
                            <UploadCloud className="h-4 w-4" />Téléverser un fichier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleContentModeChange("youtube")}
                            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${moduleContentMode === "youtube" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}
                          >
                            <PlayCircle className="h-4 w-4" />Vidéo YouTube
                          </button>
                          <button
                            type="button"
                            onClick={() => handleContentModeChange("text")}
                            className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${moduleContentMode === "text" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-300"}`}
                          >
                            <FileText className="h-4 w-4" />Contenu texte
                          </button>
                        </div>
                      </div>

                      {moduleContentMode === "select" ? (
                        loadingContents ? (
                          <div className="text-sm text-slate-500 py-4">Chargement des contenus...</div>
                        ) : getFilteredContents().length === 0 ? (
                          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                            <p className="text-sm text-slate-600 mb-3">Aucun contenu de type "{moduleType}" disponible</p>
                            <p className="text-xs text-slate-500">Téléversez un fichier directement depuis ce formulaire pour créer un nouveau contenu.</p>
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                            <div className="p-2 space-y-1">
                              {getFilteredContents().map((content) => (
                                <label
                                  key={content.id}
                                  className={`flex items-start gap-3 rounded-lg border-2 p-3 transition-colors ${selectedContentId === content.id ? "border-blue-500 bg-blue-50" : "border-transparent hover:border-blue-200 hover:bg-slate-50"}`}
                                >
                                  <input
                                    type="radio"
                                    name="content"
                                    value={content.id}
                                    checked={selectedContentId === content.id}
                                    onChange={(e) => setSelectedContentId(e.target.value)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-slate-900 truncate">{content.name}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                      {content.mime_type}
                                      {content.size_bytes && ` • ${(content.size_bytes / 1024 / 1024).toFixed(2)} MB`}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      ) : moduleContentMode === "upload" ? (
                        <div className="space-y-4">
                          <div className="rounded-lg border-2 border-dashed border-blue-300 bg-white p-6 text-center">
                            <label className="flex flex-col items-center gap-2 text-sm text-slate-600" htmlFor="module-file-input">
                              <UploadCloud className="h-6 w-6 text-blue-500" />
                              <span className="font-medium text-slate-700">Choisir un fichier à téléverser</span>
                              <span className="text-xs text-slate-500">Formats supportés : PDF, vidéo, audio, documents…</span>
                              <input
                                id="module-file-input"
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleModuleFileChange}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={(event) => {
                                  event.preventDefault();
                                  fileInputRef.current?.click();
                                }}
                              >
                                Sélectionner un fichier
                              </Button>
                            </label>
                          </div>

                          {moduleFile && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
                                <div>
                                  <p className="font-medium text-slate-900">{moduleFile.name}</p>
                                  <p className="text-xs text-slate-600">{(moduleFile.size / 1024 / 1024).toFixed(2)} MB • {moduleFile.type || "Type inconnu"}</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setModuleFile(null);
                                    setModuleContentName("");
                                    setUploadProgress(0);
                                  }}
                                >
                                  Retirer
                                </Button>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nom du contenu</label>
                                <Input
                                  value={moduleContentName}
                                  onChange={(event) => setModuleContentName(event.target.value)}
                                  placeholder={moduleFile.name}
                                />
                              </div>

                              {uploadProgress > 0 && (
                                <div className="space-y-2">
                                  <div className="h-2 w-full rounded-full bg-blue-100">
                                    <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                                  </div>
                                  <p className="text-xs font-medium text-blue-600">Téléversement en cours : {uploadProgress}%</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : moduleContentMode === "youtube" ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">URL de la vidéo YouTube <span className="text-red-500">*</span></label>
                            <Input
                              value={youtubeUrl}
                              onChange={(event) => setYoutubeUrl(event.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <p className="text-xs text-slate-500 mt-1">L'URL sera transformée automatiquement en lecteur intégré.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Contenu texte <span className="text-red-500">*</span></label>
                            <div className="rounded-lg border border-slate-200 bg-white">
                              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 text-sm text-slate-600">
                                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleRichTextCommand("bold")}>Gras</button>
                                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleRichTextCommand("italic")}>Italique</button>
                                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleRichTextCommand("underline")}>Souligner</button>
                                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleRichTextCommand("insertUnorderedList")}>Liste</button>
                                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleRichTextCommand("formatBlock", "h2")}>Titre</button>
                              </div>
                              <div
                                ref={richTextRef}
                                className="min-h-[160px] px-4 py-3 text-sm text-slate-700 focus:outline-none"
                                contentEditable
                                suppressContentEditableWarning
                                onInput={handleRichTextInput}
                                dangerouslySetInnerHTML={{ __html: richTextHtml }}
                              />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Utilisez les options de mise en forme pour structurer votre contenu.</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Durée estimée (minutes)</label>
                      <Input type="number" value={moduleDuration} onChange={(e) => setModuleDuration(e.target.value)} placeholder="Ex: 15" min="1" />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowModuleForm(false);
                          setSelectedContentId("");
                          setModuleTitle("");
                          setModuleDuration("");
                          setError(null);
                          handleContentModeChange("select");
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={() => void addModule()}
                        disabled={
                          isSavingModule ||
                          (moduleContentMode === "upload" && !moduleFile) ||
                          (moduleContentMode === "youtube" && !youtubeUrl.trim()) ||
                          (moduleContentMode === "text" && richTextIsEmpty)
                        }
                        className="min-w-[160px]"
                      >
                        {isSavingModule ? "Ajout en cours..." : "Ajouter le module"}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {modules.length === 0 && !showModuleForm && (
                <Card className="p-12 bg-slate-50 border-dashed border-2">
                  <div className="text-center">
                    <div className="text-5xl mb-4">📚</div>
                    <p className="text-slate-600 font-medium mb-2">Aucun module ajouté</p>
                    <p className="text-sm text-slate-500">Cliquez sur "Ajouter un module" pour commencer</p>
                  </div>
                </Card>
              )}

              {modules.length > 0 && (
                <div className="space-y-3">
                  {modules.map((module, index) => (
                    <Card key={module.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 shrink-0">{index + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            <span className="text-xl">{getModuleIcon(module.module_type)}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900">{module.title}</h4>
                              <p className="text-sm text-slate-600 mt-1">Type: {module.module_type}{module.duration_minutes && ` • ${module.duration_minutes} min`}</p>
                              <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                <span>Contenu :</span>
                                <span>
                                  {module.content_name ??
                                    (module.data?.kind === "youtube"
                                      ? "Vidéo YouTube intégrée"
                                      : module.data?.kind === "richtext"
                                      ? "Contenu texte personnalisé"
                                      : "Aucun contenu associé")}
                                </span>
                                {module.data?.kind === "youtube" && typeof module.data.url === "string" && (
                                  <span className="truncate text-xs text-slate-400 max-w-[220px]">
                                    ({module.data.url})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => removeModule(module.id)} className="text-red-600 border-red-200 hover:bg-red-50 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={handleBack} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Retour</Button>
                <Button onClick={handleNext} className="flex items-center gap-2" disabled={modules.length === 0}>Suivant : Révision<ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Révision et publication</h2>
                <p className="text-sm text-slate-600">Vérifiez les informations avant de créer le cours</p>
              </div>
              <Card className="p-6 bg-slate-50">
                <h3 className="font-semibold text-slate-900 mb-4">Résumé du cours</h3>
                <dl className="space-y-3">
                  <div><dt className="text-sm text-slate-600">Titre</dt><dd className="font-medium text-slate-900 mt-1">{title}</dd></div>
                  {description && <div><dt className="text-sm text-slate-600">Description</dt><dd className="text-slate-900 mt-1">{description}</dd></div>}
                  <div><dt className="text-sm text-slate-600">Nombre de modules</dt><dd className="font-medium text-slate-900 mt-1">{modules.length} module(s)</dd></div>
                </dl>
              </Card>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Modules</h3>
                <div className="space-y-2">
                  {modules.map((module, index) => (
                    <Card key={module.id} className="p-4 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold shrink-0">{index + 1}</span>
                      <span className="text-xl">{getModuleIcon(module.module_type)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{module.title}</div>
                        <div className="text-sm text-slate-600">
                          {module.module_type} •{" "}
                          {module.content_name ??
                            (module.data?.kind === "youtube"
                              ? "Vidéo YouTube intégrée"
                              : module.data?.kind === "richtext"
                              ? "Contenu texte personnalisé"
                              : "Aucun contenu associé")}
                        </div>
                        {module.data?.kind === "youtube" && typeof module.data.url === "string" && (
                          <div className="text-xs text-slate-500">URL : {module.data.url}</div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-slate-900 mb-3">Options de publication</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" checked={!autoPublish} onChange={() => setAutoPublish(false)} className="mt-0.5" />
                    <div><div className="font-medium text-slate-900">Enregistrer en brouillon</div><div className="text-sm text-slate-600">Le cours ne sera pas visible par les apprenants (recommandé)</div></div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" checked={autoPublish} onChange={() => setAutoPublish(true)} className="mt-0.5" />
                    <div><div className="font-medium text-slate-900">Publier immédiatement</div><div className="text-sm text-slate-600">Le cours sera accessible aux apprenants inscrits</div></div>
                  </label>
                </div>
              </Card>
              <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={handleBack} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Retour</Button>
                <Button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  {isLoading ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Création en cours...</> : <><CheckCircle className="h-4 w-4" />Créer le cours</>}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

export default function CourseWizardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-4" /><p className="text-sm text-slate-600">Chargement...</p></div></div>}>
      <CourseWizardContent />
    </Suspense>
  );
}
