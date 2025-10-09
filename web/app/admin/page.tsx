"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type ContentResponse,
  type CourseResponse,
  type EnrollmentResponse,
  type GroupResponse,
  type ModuleResponse,
  type OrganizationResponse,
  type UserResponse,
} from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  FileStack,
  GraduationCap,
  Layers,
  LayoutGrid,
  PlusCircle,
  UploadCloud,
  Users,
} from "lucide-react";

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const moduleTypes = [
  { value: "video", label: "Vidéo" },
  { value: "article", label: "Article" },
  { value: "pdf", label: "PDF" },
  { value: "quiz", label: "Quiz" },
  { value: "scorm", label: "SCORM" },
];

type CourseFormState = {
  title: string;
  slug: string;
  description: string;
  metadata: string;
};

type ModuleFormState = {
  title: string;
  module_type: string;
  content_id: string;
  duration_seconds: string;
  data: string;
};

type UserFormState = {
  email: string;
  password: string;
  role: string;
};

type GroupFormState = {
  name: string;
  description: string;
};

type ContentFormState = {
  name: string;
  mime_type: string;
  metadata: string;
};

const emptyCourseForm: CourseFormState = {
  title: "",
  slug: "",
  description: "",
  metadata: "",
};

const emptyModuleForm: ModuleFormState = {
  title: "",
  module_type: moduleTypes[0].value,
  content_id: "",
  duration_seconds: "",
  data: "",
};

const emptyUserForm: UserFormState = {
  email: "",
  password: "",
  role: "learner",
};

const emptyGroupForm: GroupFormState = {
  name: "",
  description: "",
};

const emptyContentForm: ContentFormState = {
  name: "",
  mime_type: "",
  metadata: "",
};

function parseJsonInput(value: string) {
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("Le JSON fourni est invalide");
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { session, user, organization, loading } = useAuth();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [modules, setModules] = useState<ModuleResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [contents, setContents] = useState<ContentResponse[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const [courseForm, setCourseForm] = useState<CourseFormState>(emptyCourseForm);
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(emptyModuleForm);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [groupForm, setGroupForm] = useState<GroupFormState>(emptyGroupForm);
  const [contentForm, setContentForm] = useState<ContentFormState>(emptyContentForm);

  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);

  const [contentFile, setContentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUploadUrl, setLastUploadUrl] = useState<string | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? null,
    [modules, selectedModuleId],
  );

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace("/auth");
        return;
      }
      if (organization) {
        void loadWorkspace();
      } else {
        setIsBootstrapping(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, organization?.id]);

  useEffect(() => {
    if (selectedCourseId && organization) {
      void loadModules(selectedCourseId, organization.id);
    } else {
      setModules([]);
      setSelectedModuleId(null);
    }
  }, [selectedCourseId, organization]);

  const loadWorkspace = async () => {
    if (!organization) return;
    setIsBootstrapping(true);
    setError(null);
    try {
      const [coursesData, usersData, groupsData, enrollmentsData, contentsData] = await Promise.all([
        apiClient.getCourses(organization.id),
        apiClient.listUsers(organization.id),
        apiClient.listGroups(organization.id),
        apiClient.getEnrollments(organization.id),
        apiClient.listContents(organization.id),
      ]);

      setCourses(coursesData);
      setUsers(usersData);
      setGroups(groupsData);
      setEnrollments(enrollmentsData);
      setContents(contentsData);

      if (coursesData.length > 0) {
        setSelectedCourseId(coursesData[0].id);
        setCourseForm({
          title: coursesData[0].title,
          slug: coursesData[0].slug,
          description: coursesData[0].description,
          metadata: coursesData[0].metadata ? JSON.stringify(coursesData[0].metadata, null, 2) : "",
        });
      } else {
        setSelectedCourseId(null);
        setCourseForm(emptyCourseForm);
      }

      if (user?.role === "super_admin") {
        const orgs = await apiClient.listOrganizations();
        setOrganizations(orgs);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de charger l'espace administrateur");
    } finally {
      setIsBootstrapping(false);
    }
  };

  const loadModules = async (courseId: string, orgId: string) => {
    setIsLoadingModules(true);
    setError(null);
    try {
      const moduleData = await apiClient.listModules(orgId, courseId);
      setModules(moduleData);
      if (moduleData.length > 0) {
        setSelectedModuleId(moduleData[0].id);
        const module = moduleData[0];
        setModuleForm({
          title: module.title,
          module_type: module.module_type,
          content_id: module.content_id || "",
          duration_seconds: module.duration_seconds ? String(module.duration_seconds) : "",
          data: module.data ? JSON.stringify(module.data, null, 2) : "",
        });
      } else {
        setSelectedModuleId(null);
        setModuleForm(emptyModuleForm);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de charger les modules");
    } finally {
      setIsLoadingModules(false);
    }
  };

  useEffect(() => {
    if (!selectedModule) {
      setModuleForm((prev) => ({ ...emptyModuleForm, module_type: prev.module_type }));
      return;
    }
    setModuleForm({
      title: selectedModule.title,
      module_type: selectedModule.module_type,
      content_id: selectedModule.content_id || "",
      duration_seconds: selectedModule.duration_seconds ? String(selectedModule.duration_seconds) : "",
      data: selectedModule.data ? JSON.stringify(selectedModule.data, null, 2) : "",
    });
  }, [selectedModule]);

  const stats = useMemo(() => {
    const publishedCourses = courses.filter((course) => course.status === "published").length;
    const draftCourses = courses.length - publishedCourses;
    const activeLearners = enrollments.filter((enrollment) => enrollment.status === "active").length;
    const completedCourses = enrollments.filter((enrollment) => enrollment.status === "completed").length;
    return {
      publishedCourses,
      draftCourses,
      activeLearners,
      completedCourses,
    };
  }, [courses, enrollments]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSelectCourse = (course: CourseResponse) => {
    setSelectedCourseId(course.id);
    setCourseForm({
      title: course.title,
      slug: course.slug,
      description: course.description,
      metadata: course.metadata ? JSON.stringify(course.metadata, null, 2) : "",
    });
  };

  const handleCourseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;

    setIsSavingCourse(true);
    setError(null);
    try {
      const metadata = parseJsonInput(courseForm.metadata || "");
      let course: CourseResponse;

      if (selectedCourseId) {
        course = await apiClient.updateCourse(organization.id, selectedCourseId, {
          title: courseForm.title,
          description: courseForm.description,
          metadata,
        });
        setCourses((prev) => prev.map((item) => (item.id === course.id ? course : item)));
      } else {
        course = await apiClient.createCourse(organization.id, {
          title: courseForm.title,
          slug: courseForm.slug,
          description: courseForm.description,
          metadata,
        });
        setCourses((prev) => [course, ...prev]);
        setSelectedCourseId(course.id);
      }

      showFeedback(`Cours "${course.title}" enregistré`);
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible d'enregistrer le cours");
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleCreateNewCourse = () => {
    setSelectedCourseId(null);
    setModules([]);
    setCourseForm(emptyCourseForm);
    setModuleForm(emptyModuleForm);
  };

  const handlePublishCourse = async (courseId: string) => {
    if (!organization) return;
    try {
      await apiClient.publishCourse(organization.id, courseId);
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId ? { ...course, status: "published", published_at: new Date().toISOString() } : course,
        ),
      );
      showFeedback("Cours publié");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de publier le cours");
    }
  };

  const handleUnpublishCourse = async (courseId: string) => {
    if (!organization) return;
    try {
      await apiClient.unpublishCourse(organization.id, courseId);
      setCourses((prev) => prev.map((course) => (course.id === courseId ? { ...course, status: "draft" } : course)));
      showFeedback("Cours dépublié");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de dépublier le cours");
    }
  };

  const handleArchiveCourse = async (courseId: string) => {
    if (!organization) return;
    try {
      await apiClient.archiveCourse(organization.id, courseId);
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      if (selectedCourseId === courseId) {
        setSelectedCourseId(null);
        setModules([]);
      }
      showFeedback("Cours archivé");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible d'archiver le cours");
    }
  };

  const handleModuleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !selectedCourseId) return;

    setIsSavingModule(true);
    setError(null);
    try {
      const payload = {
        title: moduleForm.title,
        module_type: moduleForm.module_type,
        content_id: moduleForm.content_id || undefined,
        duration_seconds: moduleForm.duration_seconds ? Number(moduleForm.duration_seconds) : undefined,
        data: moduleForm.data ? parseJsonInput(moduleForm.data) : undefined,
      };

      let module: ModuleResponse;
      if (selectedModuleId) {
        module = await apiClient.updateModule(organization.id, selectedModuleId, payload);
        setModules((prev) => prev.map((item) => (item.id === module.id ? module : item)));
      } else {
        module = await apiClient.createModule(organization.id, selectedCourseId, payload);
        setModules((prev) => [module, ...prev]);
      }

      setSelectedModuleId(module.id);
      showFeedback(`Module "${module.title}" enregistré`);
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible d'enregistrer le module");
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!organization) return;
    try {
      await apiClient.deleteModule(organization.id, moduleId);
      setModules((prev) => prev.filter((module) => module.id !== moduleId));
      if (selectedModuleId === moduleId) {
        setSelectedModuleId(null);
        setModuleForm(emptyModuleForm);
      }
      showFeedback("Module supprimé");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de supprimer le module");
    }
  };

  const handleUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;

    setIsSavingUser(true);
    setError(null);
    try {
      const created = await apiClient.createUser(organization.id, {
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
      });
      setUsers((prev) => [created, ...prev]);
      setUserForm(emptyUserForm);
      showFeedback("Utilisateur créé");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de créer l'utilisateur");
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    if (!organization) return;
    try {
      await apiClient.activateUser(organization.id, userId);
      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, status: "active" } : item)));
      showFeedback("Utilisateur activé");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible d'activer l'utilisateur");
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!organization) return;
    try {
      await apiClient.deactivateUser(organization.id, userId);
      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, status: "inactive" } : item)));
      showFeedback("Utilisateur désactivé");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de désactiver l'utilisateur");
    }
  };

  const handleGroupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;

    setIsSavingGroup(true);
    setError(null);
    try {
      const created = await apiClient.createGroup(organization.id, {
        name: groupForm.name,
        description: groupForm.description,
      });
      setGroups((prev) => [created, ...prev]);
      setGroupForm(emptyGroupForm);
      showFeedback("Groupe créé");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de créer le groupe");
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!organization) return;
    try {
      await apiClient.cancelEnrollment(organization.id, enrollmentId);
      setEnrollments((prev) => prev.filter((item) => item.id !== enrollmentId));
      showFeedback("Inscription annulée");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible d'annuler l'inscription");
    }
  };

  const handleContentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !contentFile) {
      setError("Merci de sélectionner un fichier");
      return;
    }

    setIsSavingContent(true);
    setUploadProgress(0);
    setError(null);
    try {
      const metadata = parseJsonInput(contentForm.metadata || "");
      const upload = await apiClient.createContent(organization.id, {
        name: contentForm.name || contentFile.name,
        mime_type: contentForm.mime_type || contentFile.type,
        size_bytes: contentFile.size,
        metadata,
      });

      setUploadProgress(30);
      await fetch(upload.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": contentFile.type || "application/octet-stream",
        },
        body: contentFile,
      });

      setUploadProgress(80);
      await apiClient.finalizeContent(organization.id, upload.content.id, {
        name: contentForm.name || contentFile.name,
        mime_type: contentForm.mime_type || contentFile.type,
        size_bytes: contentFile.size,
        metadata,
      });

      setUploadProgress(100);
      const updatedContents = await apiClient.listContents(organization.id);
      setContents(updatedContents);
      setContentFile(null);
      setContentForm(emptyContentForm);
      setLastUploadUrl(upload.upload_url);
      showFeedback("Contenu téléversé");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de téléverser le contenu");
    } finally {
      setIsSavingContent(false);
      setUploadProgress(0);
    }
  };

  const handleArchiveContent = async (contentId: string) => {
    if (!organization) return;
    try {
      await apiClient.archiveContent(organization.id, contentId);
      setContents((prev) => prev.filter((content) => content.id !== contentId));
      showFeedback("Contenu archivé");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible d'archiver le contenu");
    }
  };

  const handleActivateOrganization = async (orgId: string) => {
    try {
      await apiClient.activateOrganization(orgId);
      setOrganizations((prev) => prev.map((org) => (org.id === orgId ? { ...org, status: "active" } : org)));
      showFeedback("Organisation activée");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible d'activer l'organisation");
    }
  };

  const handleArchiveOrganization = async (orgId: string) => {
    try {
      await apiClient.archiveOrganization(orgId);
      setOrganizations((prev) => prev.filter((org) => org.id !== orgId));
      showFeedback("Organisation archivée");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible d'archiver l'organisation");
    }
  };

  if (loading || isBootstrapping) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-slate-600">Chargement de l'espace administrateur…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !organization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="container-custom px-4 pb-12 pt-24 sm:px-6">
        <header className="mb-8 flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administration</p>
              <h1 className="text-2xl font-semibold text-slate-900">{organization.name}</h1>
              <p className="text-sm text-slate-500">Pilotez vos formations, utilisateurs et contenus en toute simplicité.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 rounded-full border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              onClick={() => router.push("/learn")}
            >
              <ArrowLeft className="h-4 w-4" /> Retourner sur Learn
            </Button>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {user.email?.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-sm leading-tight text-slate-600">
                <p className="font-medium text-slate-900">{user.email}</p>
                <p className="text-xs capitalize text-slate-500">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {feedback && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm">
            {feedback}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <LayoutGrid className="h-4 w-4 text-blue-500" /> Cours publiés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{stats.publishedCourses}</p>
              <p className="mt-1 text-xs text-slate-500">Formations actives pour vos équipes</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <GraduationCap className="h-4 w-4 text-blue-500" /> Brouillons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{stats.draftCourses}</p>
              <p className="mt-1 text-xs text-slate-500">Cours en préparation</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Users className="h-4 w-4 text-blue-500" /> Apprenants actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{stats.activeLearners}</p>
              <p className="mt-1 text-xs text-slate-500">Suivi en cours de vos apprenants</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Layers className="h-4 w-4 text-blue-500" /> Cours terminés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{stats.completedCourses}</p>
              <p className="mt-1 text-xs text-slate-500">Parcours finalisés</p>
            </CardContent>
          </Card>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <TabsList className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1">
            <TabsTrigger value="overview" className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <LayoutGrid className="h-4 w-4" /> Aperçu
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <BookOpen className="h-4 w-4" /> Cours & Modules
            </TabsTrigger>
            <TabsTrigger value="learners" className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <Users className="h-4 w-4" /> Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="content" className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <FileStack className="h-4 w-4" /> Contenus
            </TabsTrigger>
            {user.role === "super_admin" && (
              <TabsTrigger value="organizations" className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
                <Building2 className="h-4 w-4" /> Organisations
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border border-slate-200 bg-slate-50/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">Guide rapide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <p>• Commencez par créer ou sélectionner un cours, puis ajoutez vos modules.</p>
                  <p>• Téléversez les contenus multimédias depuis l'onglet Contenus et rattachez-les à vos modules.</p>
                  <p>• Créez vos utilisateurs et attribuez-les à des groupes pour gérer les accès.</p>
                  <p>• Publiez vos cours quand ils sont prêts : ils seront immédiatement disponibles dans Learn.</p>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-slate-50/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">Activité récente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                  {courses.slice(0, 3).map((course) => (
                    <div key={course.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{course.title}</p>
                        <p className="text-xs text-slate-500">{course.status === "published" ? "Publié" : "Brouillon"}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-xs"
                        onClick={() => {
                          setActiveTab("courses");
                          handleSelectCourse(course);
                        }}
                      >
                        Ouvrir
                      </Button>
                    </div>
                  ))}
                  {courses.length === 0 && <p>Aucun cours pour le moment. Créez votre premier programme !</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr,1.8fr]">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <BookOpen className="h-5 w-5 text-blue-500" /> Catalogue
                  </CardTitle>
                  <Button type="button" onClick={handleCreateNewCourse} className="bg-blue-600 text-white hover:bg-blue-700">
                    <PlusCircle className="mr-2 h-4 w-4" /> Nouveau cours
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className={`rounded-xl border px-4 py-3 transition-colors ${
                        selectedCourseId === course.id
                          ? "border-blue-500/40 bg-blue-50"
                          : "border-slate-200 bg-slate-50 hover:border-blue-400/40 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{course.title}</p>
                          <p className="text-xs text-slate-500">{course.description || "Pas de description"}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-white px-3 py-1 text-slate-600">{course.status}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-200"
                            onClick={() => handleSelectCourse(course)}
                          >
                            Modifier
                          </Button>
                          {course.status === "published" ? (
                            <Button variant="outline" size="sm" className="border-slate-200" onClick={() => handleUnpublishCourse(course.id)}>
                              Dépublier
                            </Button>
                          ) : (
                            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => handlePublishCourse(course.id)}>
                              Publier
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleArchiveCourse(course.id)}
                          >
                            Archiver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Aucun cours enregistré. Cliquez sur "Nouveau cours" pour démarrer.
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900">
                      {selectedCourse ? `Éditer "${selectedCourse.title}"` : "Créer un cours"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCourseSubmit} className="grid gap-4">
                      {!selectedCourse && (
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Slug (URL)</label>
                          <Input
                            value={courseForm.slug}
                            onChange={(event) => setCourseForm((prev) => ({ ...prev, slug: event.target.value }))}
                            className="bg-white"
                            required
                          />
                        </div>
                      )}
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Titre</label>
                        <Input
                          value={courseForm.title}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
                          className="bg-white"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <textarea
                          value={courseForm.description}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))}
                          className={`${fieldClass} min-h-[120px]`}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Métadonnées (JSON)</label>
                        <textarea
                          value={courseForm.metadata}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, metadata: event.target.value }))}
                          className={`${fieldClass} min-h-[120px] font-mono text-xs`}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSavingCourse} className="bg-blue-600 text-white hover:bg-blue-700">
                          {isSavingCourse ? "Enregistrement…" : "Enregistrer"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <Layers className="h-5 w-5 text-blue-500" /> Modules du cours
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-200"
                      onClick={() => {
                        setSelectedModuleId(null);
                        setModuleForm(emptyModuleForm);
                      }}
                      disabled={!selectedCourseId}
                    >
                      Nouveau module
                    </Button>
                  </CardHeader>
                  <CardContent className="grid gap-6 lg:grid-cols-[1.1fr,1.2fr]">
                    <div className="space-y-3">
                      {isLoadingModules && (
                        <p className="text-sm text-slate-500">Chargement des modules…</p>
                      )}
                      {modules.map((module) => (
                        <div
                          key={module.id}
                          className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                            selectedModuleId === module.id
                              ? "border-blue-500/40 bg-blue-50"
                              : "border-slate-200 bg-slate-50 hover:border-blue-400/40 hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{module.title}</p>
                              <p className="text-xs text-slate-500">{module.module_type}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-200 text-xs"
                                onClick={() => {
                                  setSelectedModuleId(module.id);
                                }}
                              >
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-xs text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteModule(module.id)}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {modules.length === 0 && (
                        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                          Aucun module pour le moment. Créez votre première séquence.
                        </p>
                      )}
                    </div>
                    <form onSubmit={handleModuleSubmit} className="grid gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Titre du module</label>
                        <Input
                          value={moduleForm.title}
                          onChange={(event) => setModuleForm((prev) => ({ ...prev, title: event.target.value }))}
                          className="bg-white"
                          disabled={!selectedCourseId}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Type</label>
                        <select
                          value={moduleForm.module_type}
                          onChange={(event) => setModuleForm((prev) => ({ ...prev, module_type: event.target.value }))}
                          className={fieldClass}
                          disabled={!selectedCourseId}
                        >
                          {moduleTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">ID du contenu associé</label>
                        <Input
                          value={moduleForm.content_id}
                          onChange={(event) => setModuleForm((prev) => ({ ...prev, content_id: event.target.value }))}
                          className="bg-white"
                          disabled={!selectedCourseId}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Durée (secondes)</label>
                        <Input
                          type="number"
                          value={moduleForm.duration_seconds}
                          onChange={(event) => setModuleForm((prev) => ({ ...prev, duration_seconds: event.target.value }))}
                          className="bg-white"
                          min="0"
                          disabled={!selectedCourseId}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Données (JSON)</label>
                        <textarea
                          value={moduleForm.data}
                          onChange={(event) => setModuleForm((prev) => ({ ...prev, data: event.target.value }))}
                          className={`${fieldClass} min-h-[120px] font-mono text-xs`}
                          disabled={!selectedCourseId}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSavingModule || !selectedCourseId} className="bg-blue-600 text-white hover:bg-blue-700">
                          {isSavingModule ? "Enregistrement…" : "Enregistrer le module"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="learners" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr,1.2fr]">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <Users className="h-5 w-5 text-blue-500" /> Utilisateurs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {users.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{item.email}</p>
                          <p className="text-xs text-slate-500">{item.role}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-white px-3 py-1 text-slate-600">{item.status}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-200"
                            onClick={() => (item.status === "active" ? handleDeactivateUser(item.id) : handleActivateUser(item.id))}
                          >
                            {item.status === "active" ? "Désactiver" : "Activer"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Aucun utilisateur enregistré. Créez vos premiers accès depuis le formulaire ci-contre.
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900">Nouvel utilisateur</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUserSubmit} className="grid gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <Input
                          type="email"
                          value={userForm.email}
                          onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                          className="bg-white"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                        <Input
                          type="password"
                          value={userForm.password}
                          onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                          className="bg-white"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Rôle</label>
                        <select
                          value={userForm.role}
                          onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
                          className={fieldClass}
                        >
                          <option value="learner">Apprenant</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSavingUser} className="bg-blue-600 text-white hover:bg-blue-700">
                          {isSavingUser ? "Création…" : "Créer l'utilisateur"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900">Groupes & inscriptions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleGroupSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-700">Créer un groupe</p>
                      <Input
                        value={groupForm.name}
                        onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Nom du groupe"
                        className="bg-white"
                        required
                      />
                      <textarea
                        value={groupForm.description}
                        onChange={(event) => setGroupForm((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder="Description"
                        className={`${fieldClass} min-h-[80px]`}
                      />
                      <Button type="submit" disabled={isSavingGroup} className="self-end bg-blue-600 text-white hover:bg-blue-700">
                        {isSavingGroup ? "Création…" : "Créer le groupe"}
                      </Button>
                    </form>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700">Inscriptions actives</p>
                      {enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{enrollment.course_id}</p>
                              <p className="text-xs text-slate-500">Utilisateur : {enrollment.user_id}</p>
                              <p className="text-xs text-slate-500">Statut : {enrollment.status}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleCancelEnrollment(enrollment.id)}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ))}
                      {enrollments.length === 0 && <p className="text-sm text-slate-500">Aucune inscription en cours.</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr,1.2fr]">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <FileStack className="h-5 w-5 text-blue-500" /> Médiathèque
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contents.map((content) => (
                    <div key={content.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{content.name}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleArchiveContent(content.id)}
                          >
                            Archiver
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">{content.mime_type}</p>
                        <p className="text-xs text-slate-500">{(content.size_bytes / 1024 / 1024).toFixed(2)} Mo</p>
                      </div>
                    </div>
                  ))}
                  {contents.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Aucun contenu pour le moment. Téléversez vos ressources pour alimenter les modules.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <UploadCloud className="h-5 w-5 text-blue-500" /> Nouveau contenu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContentSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Nom</label>
                      <Input
                        value={contentForm.name}
                        onChange={(event) => setContentForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="bg-white"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Type MIME</label>
                      <Input
                        value={contentForm.mime_type}
                        onChange={(event) => setContentForm((prev) => ({ ...prev, mime_type: event.target.value }))}
                        className="bg-white"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Fichier</label>
                      <input
                        type="file"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setContentFile(file);
                          if (file) {
                            setContentForm((prev) => ({
                              ...prev,
                              name: prev.name || file.name,
                              mime_type: prev.mime_type || file.type,
                            }));
                          }
                        }}
                        className={`${fieldClass} cursor-pointer file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-1 file:text-xs file:font-medium file:text-white`}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Métadonnées (JSON)</label>
                      <textarea
                        value={contentForm.metadata}
                        onChange={(event) => setContentForm((prev) => ({ ...prev, metadata: event.target.value }))}
                        className={`${fieldClass} min-h-[100px] font-mono text-xs`}
                      />
                    </div>
                    {isSavingContent && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                        Téléversement en cours…
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                    {lastUploadUrl && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        Dernier lien de téléversement :
                        <br />
                        <span className="break-all text-blue-600">{lastUploadUrl}</span>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSavingContent} className="bg-blue-600 text-white hover:bg-blue-700">
                        {isSavingContent ? "Téléversement…" : "Envoyer"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {user.role === "super_admin" && (
            <TabsContent value="organizations" className="mt-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1.2fr,1.2fr]">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <Building2 className="h-5 w-5 text-blue-500" /> Organisations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {organizations.map((org) => (
                      <div key={org.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{org.name}</p>
                            <p className="text-xs text-slate-500">{org.slug}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-white px-3 py-1 text-slate-600">{org.status}</span>
                            <Button variant="outline" size="sm" className="border-slate-200" onClick={() => handleActivateOrganization(org.id)}>
                              Activer
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleArchiveOrganization(org.id)}
                            >
                              Archiver
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {organizations.length === 0 && (
                      <p className="text-sm text-slate-500">Aucune autre organisation.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900">Créer une organisation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget as HTMLFormElement);
                        const name = String(formData.get("name") || "");
                        const slug = String(formData.get("slug") || "");
                        const settingsText = String(formData.get("settings") || "");
                        try {
                          const settings = parseJsonInput(settingsText || "");
                          const org = await apiClient.createOrganization({ name, slug, settings });
                          setOrganizations((prev) => [org, ...prev]);
                          showFeedback(`Organisation ${org.name} créée`);
                          (event.currentTarget as HTMLFormElement).reset();
                        } catch (err: any) {
                          console.error(err);
                          setError(err?.error || "Impossible de créer l'organisation");
                        }
                      }}
                      className="grid gap-4"
                    >
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Nom</label>
                        <Input name="name" className="bg-white" required />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Slug</label>
                        <Input name="slug" className="bg-white" required />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Paramètres (JSON)</label>
                        <textarea name="settings" className={`${fieldClass} min-h-[120px] font-mono text-xs`} />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                          Créer
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
