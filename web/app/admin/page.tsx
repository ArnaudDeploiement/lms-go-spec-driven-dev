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
  LineChart,
  PlusCircle,
  ShieldCheck,
  UploadCloud,
  UserPlus,
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
  tags: string;
  duration_hours: string;
  level: string;
  visibility: string;
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

type EnrollmentFormState = {
  course_id: string;
  user_id: string;
  group_id: string;
  metadata: string;
};

type OrganizationFormState = {
  name: string;
  slug: string;
  settings: string;
};

const createEmptyCourseForm = (): CourseFormState => ({
  title: "",
  slug: "",
  description: "",
  tags: "",
  duration_hours: "",
  level: "beginner",
  visibility: "private",
  metadata: "",
});

const createEmptyModuleForm = (): ModuleFormState => ({
  title: "",
  module_type: moduleTypes[0]?.value ?? "video",
  content_id: "",
  duration_seconds: "",
  data: "",
});

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

const emptyEnrollmentForm: EnrollmentFormState = {
  course_id: "",
  user_id: "",
  group_id: "",
  metadata: "",
};

const emptyOrganizationForm: OrganizationFormState = {
  name: "",
  slug: "",
  settings: "",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function parseJsonInput(value: string): Record<string, any> | undefined {
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("Le JSON fourni est invalide");
  }
}

async function uploadFileToSignedUrl(
  url: string,
  file: File,
  onProgress: (progress: number) => void,
) {
  if (typeof window !== "undefined" && typeof XMLHttpRequest !== "undefined") {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve();
        } else {
          reject(new Error("Le téléversement a échoué"));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Impossible de téléverser le fichier"));
      };

      xhr.send(file);
    });
  }

  onProgress(0);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Le téléversement a échoué");
  }

  onProgress(100);
}

export default function AdminPage() {
  const router = useRouter();
  const { user, organization, isLoading, isAuthenticated } = useAuth();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [modules, setModules] = useState<ModuleResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [contents, setContents] = useState<ContentResponse[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<ModuleResponse | null>(null);

  const [courseForm, setCourseForm] = useState<CourseFormState>(createEmptyCourseForm());
  const [moduleForm, setModuleForm] = useState<ModuleFormState>(createEmptyModuleForm());
  const [moduleEditForm, setModuleEditForm] = useState<ModuleFormState>(createEmptyModuleForm());
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [groupForm, setGroupForm] = useState<GroupFormState>(emptyGroupForm);
  const [enrollmentForm, setEnrollmentForm] = useState<EnrollmentFormState>(emptyEnrollmentForm);
  const [contentForm, setContentForm] = useState<ContentFormState>(emptyContentForm);
  const [organizationForm, setOrganizationForm] = useState<OrganizationFormState>(emptyOrganizationForm);

  const [contentFile, setContentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUploadUrl, setLastUploadUrl] = useState<string | null>(null);

  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [isSavingEnrollment, setIsSavingEnrollment] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? null,
    [modules, selectedModuleId],
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }

    if (organization) {
      void loadWorkspace();
    } else {
      setIsBootstrapping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, organization?.id]);

  useEffect(() => {
    if (!organization || !selectedCourseId) {
      setModules([]);
      setSelectedModuleId(null);
      return;
    }

    setIsLoadingModules(true);
    setError(null);
    void apiClient
      .listModules(organization.id, selectedCourseId)
      .then((moduleData) => {
        setModules(moduleData);
        setSelectedModuleId(moduleData[0]?.id ?? null);
      })
      .catch((err: any) => {
        console.error(err);
        setError(err?.error || "Impossible de charger les modules");
      })
      .finally(() => setIsLoadingModules(false));
  }, [organization, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourse) {
      setCourseForm(createEmptyCourseForm());
      return;
    }

    const metadata = selectedCourse.metadata ?? {};
    const tags = Array.isArray((metadata as any).tags) ? (metadata as any).tags.join(", ") : "";
    const duration = (metadata as any).duration_hours ? String((metadata as any).duration_hours) : "";
    const level = (metadata as any).level ?? "beginner";
    const visibility = (metadata as any).visibility ?? "private";

    setCourseForm({
      title: selectedCourse.title,
      slug: selectedCourse.slug,
      description: selectedCourse.description,
      tags,
      duration_hours: duration,
      level,
      visibility,
      metadata: JSON.stringify(metadata, null, 2),
    });
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedModule) {
      setModuleForm((prev) => ({ ...createEmptyModuleForm(), module_type: prev.module_type }));
      return;
    }

    setModuleForm({
      title: selectedModule.title,
      module_type: selectedModule.module_type,
      content_id: selectedModule.content_id ?? "",
      duration_seconds: selectedModule.duration_seconds ? String(selectedModule.duration_seconds) : "",
      data: selectedModule.data ? JSON.stringify(selectedModule.data, null, 2) : "",
    });
  }, [selectedModule]);

  useEffect(() => {
    if (!editingModule) {
      setModuleEditForm(createEmptyModuleForm());
      return;
    }

    setModuleEditForm({
      title: editingModule.title,
      module_type: editingModule.module_type,
      content_id: editingModule.content_id ?? "",
      duration_seconds: editingModule.duration_seconds ? String(editingModule.duration_seconds) : "",
      data: editingModule.data ? JSON.stringify(editingModule.data, null, 2) : "",
    });
  }, [editingModule]);

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
      } else {
        setSelectedCourseId(null);
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

  const handleSelectCourse = (course: CourseResponse) => {
    setSelectedCourseId(course.id);
    setActiveTab("courses");
  };

  const handleCreateNewCourse = () => {
    setSelectedCourseId(null);
    setModules([]);
    setEditingModule(null);
    setModuleForm(createEmptyModuleForm());
    setCourseForm(createEmptyCourseForm());
  };

  const handleCourseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;

    setIsSavingCourse(true);
    setError(null);

    try {
      const baseMetadata = parseJsonInput(courseForm.metadata || "") ?? {};
      const tags = courseForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (tags.length) {
        (baseMetadata as any).tags = tags;
      }
      if (courseForm.level) (baseMetadata as any).level = courseForm.level;
      if (courseForm.visibility) (baseMetadata as any).visibility = courseForm.visibility;
      if (courseForm.duration_hours) {
        const durationValue = Number(courseForm.duration_hours);
        if (!Number.isNaN(durationValue)) {
          (baseMetadata as any).duration_hours = durationValue;
        }
      }

      let course: CourseResponse;
      if (selectedCourseId) {
        course = await apiClient.updateCourse(organization.id, selectedCourseId, {
          title: courseForm.title,
          description: courseForm.description,
          metadata: baseMetadata,
        });
        setCourses((prev) => prev.map((item) => (item.id === course.id ? course : item)));
      } else {
        course = await apiClient.createCourse(organization.id, {
          title: courseForm.title,
          slug: courseForm.slug || slugify(courseForm.title),
          description: courseForm.description,
          metadata: baseMetadata,
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
      setCourses((prev) =>
        prev.map((course) => (course.id === courseId ? { ...course, status: "draft", published_at: null } : course)),
      );
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
      const data = parseJsonInput(moduleForm.data || "");
      const duration = moduleForm.duration_seconds ? Number(moduleForm.duration_seconds) : undefined;
      const created = await apiClient.createModule(organization.id, selectedCourseId, {
        title: moduleForm.title,
        module_type: moduleForm.module_type,
        content_id: moduleForm.content_id || undefined,
        duration_seconds: duration && !Number.isNaN(duration) ? duration : undefined,
        data,
      });

      setModules((prev) => [...prev, created]);
      setModuleForm(createEmptyModuleForm());
      showFeedback(`Module "${created.title}" créé`);
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible d'ajouter le module");
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleStartModuleEdit = (module: ModuleResponse) => {
    setEditingModule(module);
  };

  const handleCancelModuleEdit = () => {
    setEditingModule(null);
  };

  const handleModuleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !editingModule) return;

    setIsUpdatingModule(true);
    setError(null);

    try {
      const data = parseJsonInput(moduleEditForm.data || "");
      const duration = moduleEditForm.duration_seconds ? Number(moduleEditForm.duration_seconds) : undefined;
      const updated = await apiClient.updateModule(organization.id, editingModule.id, {
        title: moduleEditForm.title,
        module_type: moduleEditForm.module_type,
        content_id: moduleEditForm.content_id || undefined,
        duration_seconds: duration && !Number.isNaN(duration) ? duration : undefined,
        data,
      });

      setModules((prev) => prev.map((module) => (module.id === updated.id ? updated : module)));
      setEditingModule(null);
      showFeedback(`Module "${updated.title}" mis à jour`);
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de modifier le module");
    } finally {
      setIsUpdatingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!organization) return;
    try {
      await apiClient.deleteModule(organization.id, moduleId);
      setModules((prev) => prev.filter((module) => module.id !== moduleId));
      if (selectedModuleId === moduleId) {
        setSelectedModuleId(null);
      }
      if (editingModule?.id === moduleId) {
        setEditingModule(null);
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

  const handleEnrollmentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;

    setIsSavingEnrollment(true);
    setError(null);

    try {
      const metadata = parseJsonInput(enrollmentForm.metadata || "");
      const created = await apiClient.createEnrollment(organization.id, {
        course_id: enrollmentForm.course_id,
        user_id: enrollmentForm.user_id,
        group_id: enrollmentForm.group_id || undefined,
        metadata,
      });
      setEnrollments((prev) => [created, ...prev]);
      setEnrollmentForm(emptyEnrollmentForm);
      showFeedback("Inscription créée");
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de créer l'inscription");
    } finally {
      setIsSavingEnrollment(false);
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

      await uploadFileToSignedUrl(upload.upload_url, contentFile, setUploadProgress);
      await apiClient.finalizeContent(organization.id, upload.content.id, {
        name: contentForm.name || contentFile.name,
        mime_type: contentForm.mime_type || contentFile.type,
        size_bytes: contentFile.size,
        metadata,
      });

      const refreshed = await apiClient.listContents(organization.id);
      setContents(refreshed);
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

  const handleOrganizationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingOrganization(true);
    setError(null);

    try {
      const settings = parseJsonInput(organizationForm.settings || "");
      const created = await apiClient.createOrganization({
        name: organizationForm.name,
        slug: organizationForm.slug || slugify(organizationForm.name),
        settings,
      });
      setOrganizations((prev) => [created, ...prev]);
      setOrganizationForm(emptyOrganizationForm);
      showFeedback(`Organisation ${created.name} créée`);
    } catch (err: any) {
      console.error(err);
      setError(err?.error || "Impossible de créer l'organisation");
    } finally {
      setIsSavingOrganization(false);
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

  if (isLoading || isBootstrapping) {
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
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administration</p>
              <h1 className="text-2xl font-semibold text-slate-900">{organization.name}</h1>
              <p className="text-sm text-slate-500">Pilotez vos cours, utilisateurs et contenus depuis un espace centralisé.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2 border-slate-200 text-sm text-slate-600"
            onClick={() => router.push("/learn")}
          >
            <ArrowLeft className="h-4 w-4" /> Retour Learn
          </Button>
        </header>

        {(error || feedback) && (
          <div className="space-y-2">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {feedback && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <TabsList className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <LayoutGrid className="h-4 w-4" /> Aperçu
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <BookOpen className="h-4 w-4" /> Cours
            </TabsTrigger>
            <TabsTrigger value="learners" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <Users className="h-4 w-4" /> Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <Layers className="h-4 w-4" /> Inscriptions
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
              <FileStack className="h-4 w-4" /> Contenus
            </TabsTrigger>
            {user.role === "super_admin" && (
              <TabsTrigger value="organizations" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
                <ShieldCheck className="h-4 w-4" /> Organisations
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border border-slate-200 bg-slate-50/80 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Cours publiés</CardTitle>
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-slate-900">{stats.publishedCourses}</p>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-slate-50/80 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Cours brouillons</CardTitle>
                  <PlusCircle className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-slate-900">{stats.draftCourses}</p>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-slate-50/80 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Apprenants actifs</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-slate-900">{stats.activeLearners}</p>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-slate-50/80 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Cours terminés</CardTitle>
                  <LineChart className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-slate-900">{stats.completedCourses}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-slate-200 bg-slate-50/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Activité récente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                {courses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{course.title}</p>
                      <p className="text-xs text-slate-500">{course.status === "published" ? "Publié" : "Brouillon"}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-slate-200 text-xs"
                      onClick={() => handleSelectCourse(course)}
                    >
                      Ouvrir
                    </Button>
                  </div>
                ))}
                {courses.length === 0 && <p>Aucun cours pour le moment. Créez votre premier programme.</p>}
              </CardContent>
            </Card>
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
                          <Button variant="outline" size="sm" className="border-slate-200" onClick={() => handleSelectCourse(course)}>
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
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Aucun cours disponible. Lancez-vous en créant un nouveau programme.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">
                    {selectedCourse ? `Modifier le cours : ${selectedCourse.title}` : "Créer un cours"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleCourseSubmit}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">Titre</label>
                      <Input
                        required
                        value={courseForm.title}
                        onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">Slug</label>
                      <Input
                        value={courseForm.slug}
                        onChange={(event) => setCourseForm((prev) => ({ ...prev, slug: event.target.value }))}
                        placeholder="automatique si vide"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">Description</label>
                      <textarea
                        className={fieldClass}
                        rows={3}
                        value={courseForm.description}
                        onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Tags</label>
                        <Input
                          value={courseForm.tags}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, tags: event.target.value }))}
                          placeholder="séparés par une virgule"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Durée (heures)</label>
                        <Input
                          value={courseForm.duration_hours}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, duration_hours: event.target.value }))}
                          placeholder="ex: 12"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Niveau</label>
                        <select
                          className={fieldClass}
                          value={courseForm.level}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, level: event.target.value }))}
                        >
                          <option value="beginner">Débutant</option>
                          <option value="intermediate">Intermédiaire</option>
                          <option value="advanced">Avancé</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Visibilité</label>
                        <select
                          className={fieldClass}
                          value={courseForm.visibility}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, visibility: event.target.value }))}
                        >
                          <option value="private">Privé</option>
                          <option value="public">Public</option>
                          <option value="restricted">Restreint</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">Métadonnées (JSON)</label>
                      <textarea
                        className={fieldClass}
                        rows={5}
                        value={courseForm.metadata}
                        onChange={(event) => setCourseForm((prev) => ({ ...prev, metadata: event.target.value }))}
                        placeholder={'{\n  "lang": "fr"\n}'}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isSavingCourse}>
                      {isSavingCourse ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <FileStack className="h-5 w-5 text-blue-500" /> Modules du cours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-[1.3fr,1.7fr]">
                  <div className="space-y-3">
                    {isLoadingModules && <p className="text-sm text-slate-500">Chargement des modules…</p>}
                    {!isLoadingModules && modules.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        Aucun module pour ce cours. Ajoutez votre premier module via le formulaire.
                      </div>
                    )}
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className={`rounded-lg border px-4 py-3 transition-colors ${
                          selectedModuleId === module.id
                            ? "border-blue-500/40 bg-blue-50"
                            : "border-slate-200 bg-slate-50 hover:border-blue-400/40 hover:bg-blue-50"
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">{module.title}</p>
                            <span className="text-xs capitalize text-slate-500">{module.module_type}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-slate-200"
                              onClick={() => {
                                setSelectedModuleId(module.id);
                                handleStartModuleEdit(module);
                              }}
                            >
                              Éditer
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteModule(module.id)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <form className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4" onSubmit={handleModuleSubmit}>
                      <h3 className="text-sm font-semibold text-slate-700">Ajouter un module</h3>
                      <Input
                        required
                        placeholder="Titre du module"
                        value={moduleForm.title}
                        onChange={(event) => setModuleForm((prev) => ({ ...prev, title: event.target.value }))}
                      />
                      <select
                        className={fieldClass}
                        value={moduleForm.module_type}
                        onChange={(event) => setModuleForm((prev) => ({ ...prev, module_type: event.target.value }))}
                      >
                        {moduleTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="Identifiant contenu (optionnel)"
                        value={moduleForm.content_id}
                        onChange={(event) => setModuleForm((prev) => ({ ...prev, content_id: event.target.value }))}
                      />
                      <Input
                        placeholder="Durée en secondes"
                        value={moduleForm.duration_seconds}
                        onChange={(event) => setModuleForm((prev) => ({ ...prev, duration_seconds: event.target.value }))}
                      />
                      <textarea
                        className={fieldClass}
                        rows={3}
                        placeholder="Métadonnées JSON"
                        value={moduleForm.data}
                        onChange={(event) => setModuleForm((prev) => ({ ...prev, data: event.target.value }))}
                      />
                      <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isSavingModule}>
                        {isSavingModule ? "Ajout…" : "Ajouter le module"}
                      </Button>
                    </form>

                    {editingModule && (
                      <form className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4" onSubmit={handleModuleUpdate}>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-blue-700">Modifier le module</h3>
                          <Button type="button" variant="outline" size="sm" onClick={handleCancelModuleEdit}>
                            Annuler
                          </Button>
                        </div>
                        <Input
                          required
                          value={moduleEditForm.title}
                          onChange={(event) => setModuleEditForm((prev) => ({ ...prev, title: event.target.value }))}
                        />
                        <select
                          className={fieldClass}
                          value={moduleEditForm.module_type}
                          onChange={(event) => setModuleEditForm((prev) => ({ ...prev, module_type: event.target.value }))}
                        >
                          {moduleTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          value={moduleEditForm.content_id}
                          onChange={(event) => setModuleEditForm((prev) => ({ ...prev, content_id: event.target.value }))}
                          placeholder="Identifiant contenu"
                        />
                        <Input
                          value={moduleEditForm.duration_seconds}
                          onChange={(event) => setModuleEditForm((prev) => ({ ...prev, duration_seconds: event.target.value }))}
                          placeholder="Durée en secondes"
                        />
                        <textarea
                          className={fieldClass}
                          rows={3}
                          value={moduleEditForm.data}
                          onChange={(event) => setModuleEditForm((prev) => ({ ...prev, data: event.target.value }))}
                        />
                        <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isUpdatingModule}>
                          {isUpdatingModule ? "Mise à jour…" : "Mettre à jour"}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="learners" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr,1.9fr]">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <UserPlus className="h-5 w-5 text-blue-500" /> Nouvel utilisateur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleUserSubmit}>
                    <Input
                      required
                      type="email"
                      placeholder="email@exemple.com"
                      value={userForm.email}
                      onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                    <Input
                      required
                      type="password"
                      placeholder="Mot de passe temporaire"
                      value={userForm.password}
                      onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                    />
                    <select
                      className={fieldClass}
                      value={userForm.role}
                      onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
                    >
                      <option value="learner">Apprenant</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isSavingUser}>
                      {isSavingUser ? "Création…" : "Créer l'utilisateur"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900">Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {users.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.email}</p>
                        <p className="text-xs text-slate-500">
                          {item.role} • {item.status}
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        {item.status === "active" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeactivateUser(item.id)}
                          >
                            Désactiver
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-slate-200"
                            onClick={() => handleActivateUser(item.id)}
                          >
                            Activer
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-sm text-slate-500">Aucun utilisateur pour le moment.</p>}
                </CardContent>
              </Card>
            </div>

            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <Users className="h-5 w-5 text-blue-500" /> Groupes
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1.1fr,1.9fr]">
                <form className="space-y-4" onSubmit={handleGroupSubmit}>
                  <Input
                    required
                    placeholder="Nom du groupe"
                    value={groupForm.name}
                    onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <textarea
                    className={fieldClass}
                    rows={3}
                    placeholder="Description"
                    value={groupForm.description}
                    onChange={(event) => setGroupForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                  <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isSavingGroup}>
                    {isSavingGroup ? "Création…" : "Créer le groupe"}
                  </Button>
                </form>

                <div className="space-y-3">
                  {groups.map((group) => (
                    <div key={group.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="text-xs text-slate-500">{group.description || "Pas de description"}</p>
                    </div>
                  ))}
                  {groups.length === 0 && <p className="text-sm text-slate-500">Aucun groupe enregistré.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments" className="mt-6 space-y-6">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <Layers className="h-5 w-5 text-blue-500" /> Gérer les inscriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1.1fr,1.9fr]">
                <form className="space-y-4" onSubmit={handleEnrollmentSubmit}>
                  <select
                    className={fieldClass}
                    required
                    value={enrollmentForm.course_id}
                    onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, course_id: event.target.value }))}
                  >
                    <option value="">Sélectionnez un cours</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  <select
                    className={fieldClass}
                    required
                    value={enrollmentForm.user_id}
                    onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, user_id: event.target.value }))}
                  >
                    <option value="">Sélectionnez un utilisateur</option>
                    {users.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.email}
                      </option>
                    ))}
                  </select>
                  <select
                    className={fieldClass}
                    value={enrollmentForm.group_id}
                    onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, group_id: event.target.value }))}
                  >
                    <option value="">Groupe (optionnel)</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className={fieldClass}
                    rows={3}
                    placeholder="Métadonnées JSON"
                    value={enrollmentForm.metadata}
                    onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, metadata: event.target.value }))}
                  />
                  <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isSavingEnrollment}>
                    {isSavingEnrollment ? "Création…" : "Créer l'inscription"}
                  </Button>
                </form>

                <div className="space-y-3">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {courses.find((course) => course.id === enrollment.course_id)?.title || "Cours"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {users.find((item) => item.id === enrollment.user_id)?.email || "Utilisateur"} • {enrollment.status}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Progression : {Math.round(enrollment.progress ?? 0)}%</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleCancelEnrollment(enrollment.id)}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ))}
                  {enrollments.length === 0 && <p className="text-sm text-slate-500">Aucune inscription enregistrée.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6 space-y-6">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <UploadCloud className="h-5 w-5 text-blue-500" /> Téléverser un contenu
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1.1fr,1.9fr]">
                <form className="space-y-4" onSubmit={handleContentSubmit}>
                  <Input
                    placeholder="Nom"
                    value={contentForm.name}
                    onChange={(event) => setContentForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <Input
                    placeholder="Type MIME"
                    value={contentForm.mime_type}
                    onChange={(event) => setContentForm((prev) => ({ ...prev, mime_type: event.target.value }))}
                  />
                  <input
                    type="file"
                    className={fieldClass}
                    onChange={(event) => setContentFile(event.target.files?.[0] ?? null)}
                  />
                  <textarea
                    className={fieldClass}
                    rows={3}
                    placeholder="Métadonnées JSON"
                    value={contentForm.metadata}
                    onChange={(event) => setContentForm((prev) => ({ ...prev, metadata: event.target.value }))}
                  />
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full bg-blue-500" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isSavingContent}>
                    {isSavingContent ? "Téléversement…" : "Téléverser"}
                  </Button>
                  {lastUploadUrl && (
                    <p className="text-xs text-slate-500">Lien de téléversement généré : {lastUploadUrl}</p>
                  )}
                </form>

                <div className="space-y-3">
                  {contents.map((content) => (
                    <div key={content.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{content.name}</p>
                      <p className="text-xs text-slate-500">{content.mime_type}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-3 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleArchiveContent(content.id)}
                      >
                        Archiver
                      </Button>
                    </div>
                  ))}
                  {contents.length === 0 && <p className="text-sm text-slate-500">Aucun contenu téléversé.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === "super_admin" && (
            <TabsContent value="organizations" className="mt-6 space-y-6">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <ShieldCheck className="h-5 w-5 text-blue-500" /> Organisations
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-[1.1fr,1.9fr]">
                  <form className="space-y-4" onSubmit={handleOrganizationSubmit}>
                    <Input
                      required
                      placeholder="Nom de l'organisation"
                      value={organizationForm.name}
                      onChange={(event) => setOrganizationForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                    <Input
                      placeholder="Slug"
                      value={organizationForm.slug}
                      onChange={(event) => setOrganizationForm((prev) => ({ ...prev, slug: event.target.value }))}
                    />
                    <textarea
                      className={fieldClass}
                      rows={4}
                      placeholder="Paramètres JSON"
                      value={organizationForm.settings}
                      onChange={(event) => setOrganizationForm((prev) => ({ ...prev, settings: event.target.value }))}
                    />
                    <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isSavingOrganization}>
                      {isSavingOrganization ? "Création…" : "Créer l'organisation"}
                    </Button>
                  </form>

                  <div className="space-y-3">
                    {organizations.map((org) => (
                      <div key={org.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{org.name}</p>
                        <p className="text-xs text-slate-500">{org.slug} • {org.status}</p>
                        <div className="mt-3 flex gap-2 text-xs">
                          {org.status === "active" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleArchiveOrganization(org.id)}
                            >
                              Archiver
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-slate-200"
                              onClick={() => handleActivateOrganization(org.id)}
                            >
                              Activer
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {organizations.length === 0 && <p className="text-sm text-slate-500">Aucune organisation disponible.</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
