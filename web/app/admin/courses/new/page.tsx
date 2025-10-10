"use client";

import { useState, useEffect, Suspense } from "react";
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
} from "lucide-react";

type ModuleType = "pdf" | "video" | "article" | "audio" | "document";

interface ModuleData {
  id: string;
  title: string;
  module_type: ModuleType;
  content_id: string;
  content_name: string;
  duration_minutes?: number;
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
  const [autoPublish, setAutoPublish] = useState(false);

  useEffect(() => {
    if (organization && !authLoading) {
      loadContents();
    }
  }, [organization, authLoading]);

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

  const addModule = () => {
    if (!moduleTitle.trim()) {
      setError("Veuillez saisir un titre pour le module");
      return;
    }
    if (!selectedContentId) {
      setError("Veuillez sélectionner un contenu pour ce module");
      return;
    }

    const selectedContent = contents.find((c) => c.id === selectedContentId);
    if (!selectedContent) {
      setError("Contenu introuvable");
      return;
    }

    const newModule: ModuleData = {
      id: `temp-${Date.now()}`,
      title: moduleTitle.trim(),
      module_type: moduleType,
      content_id: selectedContentId,
      content_name: selectedContent.name,
      duration_minutes: moduleDuration ? parseInt(moduleDuration) : undefined,
    };

    setModules([...modules, newModule]);
    setModuleTitle("");
    setSelectedContentId("");
    setModuleDuration("");
    setShowModuleForm(false);
    setError(null);
    setSuccessMessage("Module ajouté avec succès");
    setTimeout(() => setSuccessMessage(null), 3000);
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
          content_id: module.content_id,
          duration_seconds: module.duration_minutes ? module.duration_minutes * 60 : undefined,
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
                {!showModuleForm && <Button onClick={() => setShowModuleForm(true)} className="flex items-center gap-2"><Plus className="h-4 w-4" />Ajouter un module</Button>}
              </div>

              {showModuleForm && (
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Nouveau module</h3>
                    <Button variant="outline" size="sm" onClick={() => { setShowModuleForm(false); setError(null); }}>Annuler</Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Titre du module <span className="text-red-500">*</span></label>
                      <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="Ex: Introduction générale" autoFocus />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Type de module <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {MODULE_TYPE_OPTIONS.map((option) => (
                          <button key={option.value} type="button" onClick={() => { setModuleType(option.value); setSelectedContentId(""); }} className={`p-3 rounded-lg border-2 text-left transition-colors ${moduleType === option.value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}>
                            <div className="font-medium text-sm">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Sélectionner un contenu <span className="text-red-500">*</span></label>
                      {loadingContents ? (
                        <div className="text-sm text-slate-500 py-4">Chargement des contenus...</div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                          {getFilteredContents().length === 0 ? (
                            <div className="p-8 text-center">
                              <p className="text-sm text-slate-600 mb-3">Aucun contenu de type "{moduleType}" disponible</p>
                              <Button variant="outline" size="sm" onClick={() => router.push("/admin")} className="flex items-center gap-2 mx-auto"><LinkIcon className="h-4 w-4" />Aller uploader des contenus</Button>
                            </div>
                          ) : (
                            <div className="p-2 space-y-1">
                              {getFilteredContents().map((content) => (
                                <label key={content.id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedContentId === content.id ? "bg-blue-50 border-2 border-blue-500" : "border-2 border-transparent hover:bg-slate-50"}`}>
                                  <input type="radio" name="content" value={content.id} checked={selectedContentId === content.id} onChange={(e) => setSelectedContentId(e.target.value)} className="mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-slate-900 truncate">{content.name}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{content.mime_type}{content.size_bytes && ` • ${(content.size_bytes / 1024 / 1024).toFixed(2)} MB`}</div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Durée estimée (minutes)</label>
                      <Input type="number" value={moduleDuration} onChange={(e) => setModuleDuration(e.target.value)} placeholder="Ex: 15" min="1" />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => setShowModuleForm(false)}>Annuler</Button>
                      <Button onClick={addModule}>Ajouter le module</Button>
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
                              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><LinkIcon className="h-3 w-3" />Contenu: {module.content_name}</p>
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
                        <div className="text-sm text-slate-600">{module.module_type} • {module.content_name}</div>
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
