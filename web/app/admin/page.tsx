"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  apiClient,
  CourseResponse,
  ModuleResponse,
  UserResponse,
  EnrollmentResponse,
  GroupResponse,
  ContentResponse,
  OrganizationResponse,
} from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutGrid,
  GraduationCap,
  Users,
  Layers,
  LineChart,
  PlusCircle,
  Rocket,
  ShieldCheck,
  BookOpen,
  UserPlus,
  FileStack,
  UploadCloud,
  Building2,
  ArrowLeft,
} from "lucide-react";

const baseNavItems = [
  { id: "overview", label: "Aperçu", icon: LayoutGrid },
  { id: "courses", label: "Cours", icon: GraduationCap },
  { id: "learners", label: "Apprenants", icon: Users },
  { id: "enrollments", label: "Inscriptions", icon: Layers },
  { id: "content", label: "Contenus", icon: FileStack },
  { id: "back-to-learn", label: "Retour Learn", icon: ArrowLeft, href: "/learn" },
];

const moduleTypes = [
  { value: "video", label: "Vidéo" },
  { value: "article", label: "Article" },
  { value: "pdf", label: "Document" },
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

type CourseEditFormState = {
  title: string;
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

const createEmptyCourseEditForm = (): CourseEditFormState => ({
  title: "",
  description: "",
  tags: "",
  duration_hours: "",
  level: "beginner",
  visibility: "private",
  metadata: "",
});

const createEmptyModuleForm = (): ModuleFormState => ({
  title: "",
  module_type: moduleTypes[0].value,
  content_id: "",
  duration_seconds: "",
  data: "",
});

const baseFieldClasses =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

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

function parseJsonInput(input: string): Record<string, any> | undefined {
  if (!input.trim()) return undefined;
  try {
    return JSON.parse(input);
  } catch (error) {
    console.error("Invalid JSON", error);
    throw new Error("Le champ métadonnées doit contenir du JSON valide");
  }
}

async function uploadFileToSignedUrl(url: string, file: File, onProgress: (value: number) => void) {
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
  const { user, organization, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [activeSection, setActiveSection] = useState<string>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(null);
  const [modules, setModules] = useState<ModuleResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [contents, setContents] = useState<ContentResponse[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);

  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [isSubmittingModule, setIsSubmittingModule] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [isSubmittingEnrollment, setIsSubmittingEnrollment] = useState(false);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [isSubmittingContent, setIsSubmittingContent] = useState(false);
  const [isSubmittingOrganization, setIsSubmittingOrganization] = useState(false);
  const [lastUploadLink, setLastUploadLink] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [courseForm, setCourseForm] = useState<CourseFormState>(createEmptyCourseForm());
  const [courseEditForm, setCourseEditForm] = useState<CourseEditFormState>(createEmptyCourseEditForm());
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);

  const [moduleForm, setModuleForm] = useState<ModuleFormState>(createEmptyModuleForm());
  const [moduleEditForm, setModuleEditForm] = useState<ModuleFormState>(createEmptyModuleForm());
  const [editingModule, setEditingModule] = useState<ModuleResponse | null>(null);
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);

  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    role: "learner",
    status: "active",
    metadata: "",
  });

  const [enrollmentForm, setEnrollmentForm] = useState({
    course_id: "",
    user_id: "",
    group_id: "",
    metadata: "",
  });

  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    capacity: "",
    course_id: "",
    metadata: "",
  });

  const [contentForm, setContentForm] = useState({
    name: "",
    mime_type: "application/pdf",
    metadata: "",
  });
  const [contentFile, setContentFile] = useState<File | null>(null);

  const [organizationForm, setOrganizationForm] = useState({
    name: "",
    slug: "",
    settings: "",
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (!organization || !isAuthenticated) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [coursesData, usersData, enrollmentsData, groupsData, contentsData] = await Promise.all([
          apiClient.getCourses(organization.id),
          apiClient.listUsers(organization.id),
          apiClient.getEnrollments(organization.id),
          apiClient.listGroups(organization.id),
          apiClient.listContents(organization.id),
        ]);

        setCourses(coursesData);
        setUsers(usersData);
        setEnrollments(enrollmentsData);
        setGroups(groupsData);
        setContents(contentsData);

        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0]);
        }

        if (user?.role === "super_admin") {
          const orgs = await apiClient.listOrganizations();
          setOrganizations(orgs);
        }
      } catch (err: any) {
        console.error("Dashboard loading error", err);
        setError(err?.error || "Impossible de charger les données du LMS");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [organization, isAuthenticated, user]);

  useEffect(() => {
    if (!organization || !selectedCourse) return;
    const loadModules = async () => {
      try {
        const data = await apiClient.listModules(organization.id, selectedCourse.id);
        setModules(data);
      } catch (err) {
        console.error("Module loading error", err);
      }
    };
    loadModules();
  }, [organization, selectedCourse]);

  useEffect(() => {
    if (!selectedCourse) {
      setCourseEditForm(createEmptyCourseEditForm());
      setEditingModule(null);
      setModuleEditForm(createEmptyModuleForm());
      return;
    }

    const metadata = { ...(selectedCourse.metadata ?? {}) } as Record<string, any>;
    const tags = Array.isArray(metadata.tags) ? (metadata.tags as string[]) : [];
    const durationValue =
      metadata.duration_hours !== undefined && metadata.duration_hours !== null
        ? String(metadata.duration_hours)
        : "";
    const levelValue =
      typeof metadata.level === "string" ? (metadata.level as string) : "beginner";
    const visibilityValue =
      typeof metadata.visibility === "string" ? (metadata.visibility as string) : "private";

    const extraMetadata = { ...metadata };
    delete extraMetadata.tags;
    delete extraMetadata.duration_hours;
    delete extraMetadata.level;
    delete extraMetadata.visibility;

    setCourseEditForm({
      title: selectedCourse.title,
      description: selectedCourse.description,
      tags: tags.join(", "),
      duration_hours: durationValue,
      level: levelValue,
      visibility: visibilityValue,
      metadata: Object.keys(extraMetadata).length > 0 ? JSON.stringify(extraMetadata, null, 2) : "",
    });

    setEditingModule(null);
    setModuleEditForm(createEmptyModuleForm());
  }, [selectedCourse]);

  const stats = useMemo(() => {
    const completed = enrollments.filter((enrollment) => enrollment.status === "completed").length;
    const total = enrollments.length;
    const activeLearners = users.filter((u) => u.status === "active").length;
    const publishedCourses = courses.filter((c) => c.status === "published").length;
    const progressPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      completed,
      total,
      activeLearners,
      publishedCourses,
      progressPercentage,
    };
  }, [courses, enrollments, users]);

  const navItems = useMemo(() => {
    if (user?.role === "super_admin") {
      return [...baseNavItems, { id: "organizations", label: "Organisations", icon: Building2 }];
    }
    return baseNavItems;
  }, [user]);

  const handleCourseSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organization) return;
    try {
      setIsSubmittingCourse(true);
      setError(null);
      setFeedback(null);
      const baseMetadata = parseJsonInput(courseForm.metadata || "") || {};
      const tags = courseForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const durationHours = courseForm.duration_hours ? Number(courseForm.duration_hours) : undefined;
      const newCourse = await apiClient.createCourse(organization.id, {
        title: courseForm.title,
        slug: courseForm.slug || slugify(courseForm.title),
        description: courseForm.description,
        metadata: {
          ...baseMetadata,
          tags,
          level: courseForm.level,
          visibility: courseForm.visibility,
          duration_hours: durationHours,
        },
      });
      setCourses((prev) => [newCourse, ...prev]);
      setCourseForm(createEmptyCourseForm());
      setSelectedCourse(newCourse);
      setFeedback(`Cours "${newCourse.title}" créé avec succès`);
    } catch (err: any) {
      setError(err?.error || "Impossible de créer le cours");
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleCourseUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organization || !selectedCourse) return;
    try {
      setIsUpdatingCourse(true);
      setError(null);
      const baseMetadata = parseJsonInput(courseEditForm.metadata || "") || {};
      const tags = courseEditForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const durationHours = courseEditForm.duration_hours
        ? Number(courseEditForm.duration_hours)
        : undefined;
      const metadata: Record<string, any> = {
        ...baseMetadata,
        tags,
        level: courseEditForm.level,
        visibility: courseEditForm.visibility,
      };

      if (durationHours !== undefined && !Number.isNaN(durationHours)) {
        metadata.duration_hours = durationHours;
      }

      const updatedCourse = await apiClient.updateCourse(organization.id, selectedCourse.id, {
        title: courseEditForm.title,
        description: courseEditForm.description,
        metadata,
      });

      setCourses((prev) => prev.map((course) => (course.id === updatedCourse.id ? updatedCourse : course)));
      setSelectedCourse(updatedCourse);
      setFeedback(`Cours "${updatedCourse.title}" mis à jour`);
    } catch (err: any) {
      setError(err?.error || "Impossible de modifier le cours");
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  const handleModuleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organization || !selectedCourse) return;
    try {
      setIsSubmittingModule(true);
      const metadata = parseJsonInput(moduleForm.data || "");
      const duration = moduleForm.duration_seconds ? Number(moduleForm.duration_seconds) : undefined;
      const module = await apiClient.createModule(organization.id, selectedCourse.id, {
        title: moduleForm.title,
        module_type: moduleForm.module_type,
        content_id: moduleForm.content_id ? moduleForm.content_id : undefined,
        duration_seconds: duration,
        data: metadata,
      });
      setModules((prev) => [...prev, module]);
      setModuleForm(createEmptyModuleForm());
      setFeedback(`Module "${module.title}" ajouté`);
    } catch (err: any) {
      setError(err?.error || "Impossible d'ajouter le module");
    } finally {
      setIsSubmittingModule(false);
    }
  };

  const handleModuleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organization || !editingModule) return;
    try {
      setIsUpdatingModule(true);
      setError(null);
      const metadata = parseJsonInput(moduleEditForm.data || "");
      const duration = moduleEditForm.duration_seconds ? Number(moduleEditForm.duration_seconds) : undefined;
      const updatedModule = await apiClient.updateModule(organization.id, editingModule.id, {
        title: moduleEditForm.title,
        module_type: moduleEditForm.module_type,
        content_id: moduleEditForm.content_id ? moduleEditForm.content_id : undefined,
        duration_seconds: duration,
        data: metadata,
      });

      setModules((prev) => prev.map((module) => (module.id === updatedModule.id ? updatedModule : module)));
      setEditingModule(null);
      setModuleEditForm(createEmptyModuleForm());
      setFeedback(`Module "${updatedModule.title}" mis à jour`);
    } catch (err: any) {
      setError(err?.error || "Impossible de modifier le module");
    } finally {
      setIsUpdatingModule(false);
    }
  };

  const handleCancelModuleEdit = () => {
    setEditingModule(null);
    setModuleEditForm(createEmptyModuleForm());
  };

  const handleStartModuleEdit = (module: ModuleResponse) => {
    setEditingModule(module);
    setModuleEditForm({
      title: module.title,
      module_type: module.module_type,
      content_id: module.content_id || "",
      duration_seconds: module.duration_seconds ? String(module.duration_seconds) : "",
      data: module.data ? JSON.stringify(module.data, null, 2) : "",
    });
  };

  const handlePublishCourse = async (course: CourseResponse) => {
    if (!organization) return;
    try {
      await apiClient.publishCourse(organization.id, course.id);
      setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, status: "published" } : c)));
      setFeedback(`Cours "${course.title}" publié`);
    } catch (err: any) {
      setError(err?.error || "Impossible de publier le cours");
    }
  };

  const handleUnpublishCourse = async (course: CourseResponse) => {
    if (!organization) return;
    try {
      await apiClient.unpublishCourse(organization.id, course.id);
      setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, status: "draft" } : c)));
      setFeedback(`Cours "${course.title}" remis en brouillon`);
    } catch (err: any) {
      setError(err?.error || "Impossible de dépublier le cours");
    }
  };

  const handleArchiveCourse = async (course: CourseResponse) => {
    if (!organization) return;
    try {
      await apiClient.archiveCourse(organization.id, course.id);
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      if (selectedCourse?.id === course.id) {
        setSelectedCourse(null);
      }
      setFeedback(`Cours "${course.title}" archivé`);
    } catch (err: any) {
      setError(err?.error || "Impossible d'archiver le cours");
    }
  };

  const handleUserSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organization) return;
    try {
      setIsSubmittingUser(true);
      const metadata = parseJsonInput(userForm.metadata || "");
      const created = await apiClient.createUser(organization.id, {
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        status: userForm.status,
        metadata,
      });
      setUsers((prev) => [created, ...prev]);
      setUserForm({ email: "", password: "", role: "learner", status: "active", metadata: "" });
      setFeedback(`Utilisateur ${created.email} créé`);
    } catch (err: any) {
      setError(err?.error || "Impossible de créer l'utilisateur");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleEnrollmentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organization) return;
    try {
      setIsSubmittingEnrollment(true);
      const metadata = parseJsonInput(enrollmentForm.metadata || "");
      const created = await apiClient.createEnrollment(organization.id, {
        course_id: enrollmentForm.course_id,
        user_id: enrollmentForm.user_id,
        group_id: enrollmentForm.group_id ? enrollmentForm.group_id : undefined,
        metadata,
      });
      setEnrollments((prev) => [created, ...prev]);
      setEnrollmentForm({ course_id: "", user_id: "", group_id: "", metadata: "" });
      setFeedback("Inscription créée");
    } catch (err: any) {
      setError(err?.error || "Impossible de créer l'inscription");
    } finally {
      setIsSubmittingEnrollment(false);
    }
  };

  const handleGroupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organization) return;
    try {
      setIsSubmittingGroup(true);
      const metadata = parseJsonInput(groupForm.metadata || "");
      const capacity = groupForm.capacity ? Number(groupForm.capacity) : undefined;
      const created = await apiClient.createGroup(organization.id, {
        name: groupForm.name,
        description: groupForm.description,
        capacity,
        course_id: groupForm.course_id ? groupForm.course_id : undefined,
        metadata,
      });
      setGroups((prev) => [created, ...prev]);
      setGroupForm({ name: "", description: "", capacity: "", course_id: "", metadata: "" });
      setFeedback(`Groupe ${created.name} créé`);
    } catch (err: any) {
      setError(err?.error || "Impossible de créer le groupe");
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleContentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organization) return;
    if (!contentFile) {
      setError("Veuillez sélectionner un fichier à téléverser");
      return;
    }
    try {
      setIsSubmittingContent(true);
      setError(null);
      setFeedback(null);
      setUploadProgress(0);
      const metadata = parseJsonInput(contentForm.metadata || "") || {};
      const response = await apiClient.createContent(organization.id, {
        name: contentForm.name || contentFile.name,
        mime_type: contentForm.mime_type || contentFile.type || "application/octet-stream",
        size_bytes: contentFile.size,
        metadata,
      });
      await uploadFileToSignedUrl(response.upload_url, contentFile, setUploadProgress);
      await apiClient.finalizeContent(organization.id, response.content.id, {});
      setContents((prev) => [response.content, ...prev]);
      setContentForm({ name: "", mime_type: "application/pdf", metadata: "" });
      setContentFile(null);
      setLastUploadLink(response.upload_url);
      setFeedback(`Contenu "${response.content.name}" téléversé avec succès.`);
    } catch (err: any) {
      setError(err?.error || err?.message || "Impossible de créer le contenu");
    } finally {
      setIsSubmittingContent(false);
    }
  };

  const handleDownloadLink = async (contentId: string) => {
    if (!organization) return;
    try {
      const link = await apiClient.getDownloadLink(organization.id, contentId);
      setFeedback(`Lien de téléchargement généré (expire ${new Date(link.expires_at).toLocaleString()})`);
      if (typeof window !== "undefined") {
        window.open(link.download_url, "_blank");
      }
    } catch (err: any) {
      setError(err?.error || "Impossible de récupérer le lien de téléchargement");
    }
  };

  const handleArchiveContent = async (contentId: string) => {
    if (!organization) return;
    try {
      await apiClient.archiveContent(organization.id, contentId);
      setContents((prev) => prev.filter((item) => item.id !== contentId));
      setFeedback("Contenu archivé");
    } catch (err: any) {
      setError(err?.error || "Impossible d'archiver le contenu");
    }
  };

  const handleFinalizeContent = async (contentId: string) => {
    if (!organization) return;
    try {
      const finalized = await apiClient.finalizeContent(organization.id, contentId, {});
      setContents((prev) => prev.map((item) => (item.id === finalized.id ? finalized : item)));
      setFeedback(`Contenu "${finalized.name}" finalisé`);
    } catch (err: any) {
      setError(err?.error || "Impossible de finaliser le contenu");
    }
  };

  const handleActivateUser = async (userId: string) => {
    if (!organization) return;
    try {
      await apiClient.activateUser(organization.id, userId);
      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, status: "active" } : item)));
      setFeedback("Utilisateur réactivé");
    } catch (err: any) {
      setError(err?.error || "Impossible de réactiver l'utilisateur");
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!organization) return;
    try {
      await apiClient.deactivateUser(organization.id, userId);
      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, status: "inactive" } : item)));
      setFeedback("Utilisateur désactivé");
    } catch (err: any) {
      setError(err?.error || "Impossible de désactiver l'utilisateur");
    }
  };

  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!organization) return;
    try {
      await apiClient.cancelEnrollment(organization.id, enrollmentId);
      setEnrollments((prev) => prev.filter((item) => item.id !== enrollmentId));
      setFeedback("Inscription annulée");
    } catch (err: any) {
      setError(err?.error || "Impossible d'annuler l'inscription");
    }
  };

  const handleActivateOrganization = async (orgId: string) => {
    try {
      await apiClient.activateOrganization(orgId);
      setOrganizations((prev) => prev.map((item) => (item.id === orgId ? { ...item, status: "active" } : item)));
      setFeedback("Organisation activée");
    } catch (err: any) {
      setError(err?.error || "Impossible d'activer l'organisation");
    }
  };

  const handleArchiveOrganization = async (orgId: string) => {
    try {
      await apiClient.archiveOrganization(orgId);
      setOrganizations((prev) => prev.filter((item) => item.id !== orgId));
      setFeedback("Organisation archivée");
    } catch (err: any) {
      setError(err?.error || "Impossible d'archiver l'organisation");
    }
  };

  const handleOrganizationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsSubmittingOrganization(true);
      const settings = parseJsonInput(organizationForm.settings || "");
      const created = await apiClient.createOrganization({
        name: organizationForm.name,
        slug: organizationForm.slug,
        settings,
      });
      setOrganizations((prev) => [created, ...prev]);
      setOrganizationForm({ name: "", slug: "", settings: "" });
      setFeedback(`Organisation ${created.name} créée`);
    } catch (err: any) {
      setError(err?.error || "Impossible de créer l'organisation");
    } finally {
      setIsSubmittingOrganization(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex min-h-screen items-center justify-center pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-blue-500 border-t-transparent"
            />
            <p className="text-sm text-slate-600">Chargement de votre espace administrateur…</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <header className="mt-16 border-b border-slate-200 bg-white">
        <div className="container-custom flex flex-wrap items-center justify-between gap-6 px-4 py-6 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administration</p>
              <h1 className="text-2xl font-semibold text-slate-900">{organization?.name || "Organisation"}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {user?.email?.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-sm leading-tight text-slate-600">
              <p className="font-medium text-slate-900">{user?.email}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom flex flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-start">
        <aside className="lg:w-64">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <nav className="flex flex-col gap-1 p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isLink = Boolean(item.href);
                const isActive = !isLink && activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.href) {
                        router.push(item.href);
                        return;
                      }
                      setActiveSection(item.id);
                    }}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isLink
                        ? "text-blue-600 hover:bg-blue-50"
                        : isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isLink ? "text-blue-500" : isActive ? "text-white" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 space-y-8">
          {feedback && (
            <motion.div
              key={feedback}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 shadow-sm"
            >
              {feedback}
            </motion.div>
          )}

          {error && (
            <motion.div
              key={error}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid gap-6 lg:grid-cols-[2fr,1fr]"
          >
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-lg text-slate-900">
                  <span>Vision d'ensemble</span>
                  <LineChart className="h-5 w-5 text-blue-500" />
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Suivez la progression globale de votre catalogue de formations.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm font-medium text-slate-600">Cours terminés</p>
                  <div className="mt-4 flex items-end justify-between">
                    <h2 className="text-3xl font-semibold text-slate-900">
                      {stats.completed}/{stats.total || 1}
                    </h2>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                      {stats.progressPercentage}%
                    </span>
                  </div>
                  <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${stats.progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cours publiés
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.publishedCourses}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Apprenants actifs
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.activeLearners}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <Rocket className="h-5 w-5 text-blue-500" />
                  Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button
                  type="button"
                  onClick={() => setActiveSection("courses")}
                  className="justify-between bg-blue-600 text-white hover:bg-blue-700"
                >
                  <span>Créer un cours</span>
                  <PlusCircle className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveSection("learners")}
                  variant="outline"
                  className="justify-between border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  <span>Inviter un apprenant</span>
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveSection("content")}
                  variant="outline"
                  className="justify-between border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  <span>Déposer un contenu</span>
                  <UploadCloud className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.section>

          <AnimatePresence mode="wait">
            {activeSection === "overview" && (
              <motion.section
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid gap-6 lg:grid-cols-3"
              >
                {courses.slice(0, 3).map((course) => (
                  <motion.div
                    key={course.id}
                    whileHover={{ translateY: -6 }}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">{course.title}</h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {course.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{course.description}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>Créé le {new Date(course.created_at).toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourse(course);
                          setActiveSection("courses");
                        }}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        Gérer
                      </button>
                    </div>
                  </motion.div>
                ))}
                {courses.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                    Aucun cours pour le moment. Créez votre première formation.
                  </div>
                )}
              </motion.section>
            )}

            {activeSection === "courses" && (
              <motion.section
                key="courses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid gap-6 lg:grid-cols-[1.6fr,1fr]"
              >
                <div className="space-y-6">
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg text-slate-900">
                        <span>Catalogue des cours</span>
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {courses.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => setSelectedCourse(course)}
                          className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                            selectedCourse?.id === course.id
                              ? "border-blue-300 bg-blue-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-base font-semibold text-slate-900">{course.title}</p>
                              <p className="text-xs text-slate-500">{course.description}</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {course.status}
                            </span>
                          </div>
                        </button>
                      ))}
                      {courses.length === 0 && (
                        <p className="text-sm text-slate-500">
                          Aucun cours pour le moment. Créez votre première formation !
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {selectedCourse && (
                    <Card className="border border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-lg text-slate-900">
                          <span>Modules du cours « {selectedCourse.title} »</span>
                          <BookOpen className="h-5 w-5 text-blue-500" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {modules.map((module) => (
                          <div
                            key={module.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{module.title}</p>
                                <p className="text-xs text-slate-500">
                                  {module.module_type} · {module.duration_seconds || 0} sec
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                                  #{module.position}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => handleStartModuleEdit(module)}
                                >
                                  Modifier
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {modules.length === 0 && (
                          <p className="text-sm text-slate-500">Aucun module pour le moment.</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                        <PlusCircle className="h-5 w-5 text-blue-500" />
                        Nouveau cours
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCourseSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Titre</label>
                          <Input
                            value={courseForm.title}
                            onChange={(event) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                title: event.target.value,
                                slug: prev.slug ? prev.slug : slugify(event.target.value),
                              }))
                            }
                            className="bg-white"
                            placeholder="Onboarding digital"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Slug</label>
                          <Input
                            value={courseForm.slug}
                            onChange={(event) => setCourseForm((prev) => ({ ...prev, slug: event.target.value }))}
                            className="bg-white"
                            placeholder="onboarding-digital"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Description</label>
                          <textarea
                            value={courseForm.description}
                            onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))}
                            className={`${baseFieldClasses} min-h-[90px]`}
                            placeholder="Décrivez la proposition de valeur du cours"
                            required
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Durée estimée (heures)</label>
                            <Input
                              type="number"
                              min={0}
                              value={courseForm.duration_hours}
                              onChange={(event) => setCourseForm((prev) => ({ ...prev, duration_hours: event.target.value }))}
                              className="bg-white"
                              placeholder="6"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Niveau</label>
                            <select
                              value={courseForm.level}
                              onChange={(event) => setCourseForm((prev) => ({ ...prev, level: event.target.value }))}
                              className={baseFieldClasses}
                            >
                              <option value="beginner">Débutant</option>
                              <option value="intermediate">Intermédiaire</option>
                              <option value="advanced">Avancé</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Visibilité</label>
                            <select
                              value={courseForm.visibility}
                              onChange={(event) => setCourseForm((prev) => ({ ...prev, visibility: event.target.value }))}
                              className={baseFieldClasses}
                            >
                              <option value="private">Privé</option>
                              <option value="public">Public</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Tags</label>
                            <Input
                              value={courseForm.tags}
                              onChange={(event) => setCourseForm((prev) => ({ ...prev, tags: event.target.value }))}
                              className="bg-white"
                              placeholder="onboarding, produit, équipe"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Métadonnées (JSON)</label>
                          <textarea
                            value={courseForm.metadata}
                            onChange={(event) => setCourseForm((prev) => ({ ...prev, metadata: event.target.value }))}
                            className={`${baseFieldClasses} min-h-[70px] font-mono text-xs`}
                            placeholder='{"audience":"Managers"}'
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700"
                          disabled={isSubmittingCourse}
                        >
                          {isSubmittingCourse ? "Création…" : "Créer le cours"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {selectedCourse && (
                    <Card className="border border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                          <LayoutGrid className="h-5 w-5 text-blue-500" />
                          Modifier le cours
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCourseUpdate} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Titre</label>
                            <Input
                              value={courseEditForm.title}
                              onChange={(event) => setCourseEditForm((prev) => ({ ...prev, title: event.target.value }))}
                              className="bg-white"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <textarea
                              value={courseEditForm.description}
                              onChange={(event) => setCourseEditForm((prev) => ({ ...prev, description: event.target.value }))}
                              className={`${baseFieldClasses} min-h-[90px]`}
                              required
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Durée estimée (heures)</label>
                              <Input
                                type="number"
                                min={0}
                                value={courseEditForm.duration_hours}
                                onChange={(event) =>
                                  setCourseEditForm((prev) => ({ ...prev, duration_hours: event.target.value }))
                                }
                                className="bg-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Niveau</label>
                              <select
                                value={courseEditForm.level}
                                onChange={(event) => setCourseEditForm((prev) => ({ ...prev, level: event.target.value }))}
                                className={baseFieldClasses}
                              >
                                <option value="beginner">Débutant</option>
                                <option value="intermediate">Intermédiaire</option>
                                <option value="advanced">Avancé</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Visibilité</label>
                              <select
                                value={courseEditForm.visibility}
                                onChange={(event) => setCourseEditForm((prev) => ({ ...prev, visibility: event.target.value }))}
                                className={baseFieldClasses}
                              >
                                <option value="private">Privé</option>
                                <option value="public">Public</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Tags</label>
                              <Input
                                value={courseEditForm.tags}
                                onChange={(event) => setCourseEditForm((prev) => ({ ...prev, tags: event.target.value }))}
                                className="bg-white"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Métadonnées additionnelles (JSON)</label>
                            <textarea
                              value={courseEditForm.metadata}
                              onChange={(event) => setCourseEditForm((prev) => ({ ...prev, metadata: event.target.value }))}
                              className={`${baseFieldClasses} min-h-[70px] font-mono text-xs`}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="submit"
                              className="flex-1 justify-center bg-blue-600 text-white hover:bg-blue-700"
                              disabled={isUpdatingCourse}
                            >
                              {isUpdatingCourse ? "Enregistrement…" : "Enregistrer"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 justify-center border-slate-200 text-slate-700 hover:bg-slate-100"
                              onClick={() => handlePublishCourse(selectedCourse)}
                            >
                              Publier
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 justify-center border-slate-200 text-slate-700 hover:bg-slate-100"
                              onClick={() => handleUnpublishCourse(selectedCourse)}
                            >
                              Dépublier
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-center border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleArchiveCourse(selectedCourse)}
                          >
                            Archiver le cours
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                  {selectedCourse && (
                    <Card className="border border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                          <Layers className="h-5 w-5 text-blue-500" />
                          Ajouter un module
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleModuleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Titre</label>
                            <Input
                              value={moduleForm.title}
                              onChange={(event) => setModuleForm((prev) => ({ ...prev, title: event.target.value }))}
                              className="bg-white"
                              placeholder="Vidéo de bienvenue"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Type</label>
                            <select
                              value={moduleForm.module_type}
                              onChange={(event) => setModuleForm((prev) => ({ ...prev, module_type: event.target.value }))}
                              className={baseFieldClasses}
                            >
                              {moduleTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Contenu associé</label>
                              <select
                                value={moduleForm.content_id}
                                onChange={(event) => setModuleForm((prev) => ({ ...prev, content_id: event.target.value }))}
                                className={baseFieldClasses}
                              >
                                <option value="">Aucun contenu</option>
                                {contents.map((content) => (
                                  <option key={content.id} value={content.id}>
                                    {content.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Durée (secondes)</label>
                              <Input
                                type="number"
                                min={0}
                                value={moduleForm.duration_seconds}
                                onChange={(event) => setModuleForm((prev) => ({ ...prev, duration_seconds: event.target.value }))}
                                className="bg-white"
                                placeholder="300"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Métadonnées (JSON)</label>
                            <textarea
                              value={moduleForm.data}
                              onChange={(event) => setModuleForm((prev) => ({ ...prev, data: event.target.value }))}
                              className={`${baseFieldClasses} min-h-[70px] font-mono text-xs`}
                              placeholder='{"duration":5}'
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700"
                            disabled={isSubmittingModule}
                          >
                            {isSubmittingModule ? "Ajout…" : "Ajouter le module"}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {editingModule && (
                    <Card className="border border-slate-200 bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                          <Layers className="h-5 w-5 text-blue-500" />
                          Modifier le module
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleModuleUpdate} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Titre</label>
                            <Input
                              value={moduleEditForm.title}
                              onChange={(event) => setModuleEditForm((prev) => ({ ...prev, title: event.target.value }))}
                              className="bg-white"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Type</label>
                            <select
                              value={moduleEditForm.module_type}
                              onChange={(event) => setModuleEditForm((prev) => ({ ...prev, module_type: event.target.value }))}
                              className={baseFieldClasses}
                            >
                              {moduleTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Contenu associé</label>
                              <select
                                value={moduleEditForm.content_id}
                                onChange={(event) => setModuleEditForm((prev) => ({ ...prev, content_id: event.target.value }))}
                                className={baseFieldClasses}
                              >
                                <option value="">Aucun contenu</option>
                                {contents.map((content) => (
                                  <option key={content.id} value={content.id}>
                                    {content.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Durée (secondes)</label>
                              <Input
                                type="number"
                                min={0}
                                value={moduleEditForm.duration_seconds}
                                onChange={(event) =>
                                  setModuleEditForm((prev) => ({ ...prev, duration_seconds: event.target.value }))
                                }
                                className="bg-white"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Métadonnées (JSON)</label>
                            <textarea
                              value={moduleEditForm.data}
                              onChange={(event) => setModuleEditForm((prev) => ({ ...prev, data: event.target.value }))}
                              className={`${baseFieldClasses} min-h-[70px] font-mono text-xs`}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              className="flex-1 justify-center bg-blue-600 text-white hover:bg-blue-700"
                              disabled={isUpdatingModule}
                            >
                              {isUpdatingModule ? "Enregistrement…" : "Mettre à jour"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 justify-center border-slate-200 text-slate-700 hover:bg-slate-100"
                              onClick={handleCancelModuleEdit}
                            >
                              Annuler
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.section>
            )}
            {activeSection === "learners" && (
              <motion.section
                key="learners"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid gap-6 lg:grid-cols-[1.4fr,1fr]"
              >
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <Users className="h-5 w-5 text-blue-500" />
                      Apprenants
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {users.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.email}</p>
                          <p className="text-xs text-slate-500">{item.role}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              item.status === "active"
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-amber-100 text-amber-600"
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.status === "active" ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="border-slate-200 text-xs text-slate-700 hover:bg-slate-100"
                              onClick={() => handleDeactivateUser(item.id)}
                            >
                              Désactiver
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="border-slate-200 text-xs text-slate-700 hover:bg-slate-100"
                              onClick={() => handleActivateUser(item.id)}
                            >
                              Réactiver
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <p className="text-sm text-slate-500">Aucun utilisateur enregistré.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <UserPlus className="h-5 w-5 text-blue-500" />
                      Nouvel utilisateur
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <Input
                          type="email"
                          value={userForm.email}
                          onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                          className="bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                        <Input
                          type="password"
                          value={userForm.password}
                          onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                          className="bg-white"
                          required
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Rôle</label>
                          <select
                            value={userForm.role}
                            onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
                            className={baseFieldClasses}
                          >
                            <option value="learner">Apprenant</option>
                            <option value="instructor">Formateur</option>
                            <option value="admin">Administrateur</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Statut</label>
                          <select
                            value={userForm.status}
                            onChange={(event) => setUserForm((prev) => ({ ...prev, status: event.target.value }))}
                            className={baseFieldClasses}
                          >
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Métadonnées (JSON)</label>
                        <textarea
                          value={userForm.metadata}
                          onChange={(event) => setUserForm((prev) => ({ ...prev, metadata: event.target.value }))}
                          className={`${baseFieldClasses} min-h-[70px] font-mono text-xs`}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700"
                        disabled={isSubmittingUser}
                      >
                        {isSubmittingUser ? "Invitation…" : "Créer l'utilisateur"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.section>
            )}

            {activeSection === "enrollments" && (
              <motion.section
                key="enrollments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid gap-6 lg:grid-cols-[1.4fr,1fr]"
              >
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <GraduationCap className="h-5 w-5 text-blue-500" />
                      Inscriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {enrollments.map((enrollment) => {
                      const course = courses.find((c) => c.id === enrollment.course_id);
                      const learner = users.find((u) => u.id === enrollment.user_id);
                      return (
                        <div
                          key={enrollment.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">{course?.title || "Cours"}</p>
                            <p className="text-xs text-slate-500">{learner?.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
                              {enrollment.status}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              className="border-slate-200 text-xs text-slate-700 hover:bg-slate-100"
                              onClick={() => handleCancelEnrollment(enrollment.id)}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {enrollments.length === 0 && (
                      <p className="text-sm text-slate-500">Aucune inscription enregistrée.</p>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                        <PlusCircle className="h-5 w-5 text-blue-500" />
                        Nouvelle inscription
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Cours</label>
                          <select
                            value={enrollmentForm.course_id}
                            onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, course_id: event.target.value }))}
                            className={baseFieldClasses}
                            required
                          >
                            <option value="">Choisir un cours</option>
                            {courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Apprenant</label>
                          <select
                            value={enrollmentForm.user_id}
                            onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, user_id: event.target.value }))}
                            className={baseFieldClasses}
                            required
                          >
                            <option value="">Choisir un utilisateur</option>
                            {users.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.email}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Groupe</label>
                          <select
                            value={enrollmentForm.group_id}
                            onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, group_id: event.target.value }))}
                            className={baseFieldClasses}
                          >
                            <option value="">Aucun</option>
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Métadonnées (JSON)</label>
                          <textarea
                            value={enrollmentForm.metadata}
                            onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, metadata: event.target.value }))}
                            className={`${baseFieldClasses} min-h-[70px] font-mono text-xs`}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700"
                          disabled={isSubmittingEnrollment}
                        >
                          {isSubmittingEnrollment ? "Création…" : "Créer l'inscription"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                        <Layers className="h-5 w-5 text-blue-500" />
                        Groupes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleGroupSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Nom</label>
                          <Input
                            value={groupForm.name}
                            onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value }))}
                            className="bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Description</label>
                          <textarea
                            value={groupForm.description}
                            onChange={(event) => setGroupForm((prev) => ({ ...prev, description: event.target.value }))}
                            className={`${baseFieldClasses} min-h-[70px]`}
                            required
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Capacité</label>
                            <Input
                              type="number"
                              min={1}
                              value={groupForm.capacity}
                              onChange={(event) => setGroupForm((prev) => ({ ...prev, capacity: event.target.value }))}
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Cours lié</label>
                            <select
                              value={groupForm.course_id}
                              onChange={(event) => setGroupForm((prev) => ({ ...prev, course_id: event.target.value }))}
                              className={baseFieldClasses}
                            >
                              <option value="">Optionnel</option>
                              {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                  {course.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Métadonnées (JSON)</label>
                          <textarea
                            value={groupForm.metadata}
                            onChange={(event) => setGroupForm((prev) => ({ ...prev, metadata: event.target.value }))}
                            className={`${baseFieldClasses} min-h-[70px] font-mono text-xs`}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700"
                          disabled={isSubmittingGroup}
                        >
                          {isSubmittingGroup ? "Création…" : "Créer le groupe"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </motion.section>
            )}
            {activeSection === "content" && (
              <motion.section
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid gap-6 lg:grid-cols-[1.5fr,1fr]"
              >
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <FileStack className="h-5 w-5 text-blue-500" />
                      Bibliothèque de contenus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contents.map((content) => (
                      <div
                        key={content.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{content.name}</p>
                            <p className="text-xs text-slate-500">{content.mime_type}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="border-slate-200 text-xs text-slate-700 hover:bg-slate-100"
                              onClick={() => handleDownloadLink(content.id)}
                            >
                              Télécharger
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="border-slate-200 text-xs text-slate-700 hover:bg-slate-100"
                              onClick={() => handleFinalizeContent(content.id)}
                            >
                              Finaliser
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="border-red-200 text-xs text-red-600 hover:bg-red-50"
                              onClick={() => handleArchiveContent(content.id)}
                            >
                              Archiver
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {contents.length === 0 && (
                      <p className="text-sm text-slate-500">Aucun contenu disponible.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <UploadCloud className="h-5 w-5 text-blue-500" />
                      Nouveau contenu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleContentSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nom</label>
                        <Input
                          value={contentForm.name}
                          onChange={(event) => setContentForm((prev) => ({ ...prev, name: event.target.value }))}
                          className="bg-white"
                          required
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Type MIME</label>
                          <Input
                            value={contentForm.mime_type}
                            onChange={(event) => setContentForm((prev) => ({ ...prev, mime_type: event.target.value }))}
                            className="bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Fichier</label>
                          <input
                            type="file"
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              setContentFile(file);
                              if (file) {
                                setContentForm((prev) => ({
                                  ...prev,
                                  name: prev.name || file.name.replace(/\.[^/.]+$/, ""),
                                  mime_type: file.type || prev.mime_type,
                                }));
                              }
                            }}
                            className={`${baseFieldClasses} cursor-pointer file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-1 file:text-xs file:font-medium file:text-white`}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Métadonnées (JSON)</label>
                        <textarea
                          value={contentForm.metadata}
                          onChange={(event) => setContentForm((prev) => ({ ...prev, metadata: event.target.value }))}
                          className={`${baseFieldClasses} min-h-[70px] font-mono text-xs`}
                        />
                      </div>
                      {isSubmittingContent && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                          Téléversement en cours… {uploadProgress}%
                          <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {lastUploadLink && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                          Dernier lien de téléversement :
                          <br />
                          <span className="break-all text-blue-600">{lastUploadLink}</span>
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700"
                        disabled={isSubmittingContent}
                      >
                        {isSubmittingContent ? "Téléversement…" : "Créer et téléverser"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.section>
            )}

            {activeSection === "organizations" && user?.role === "super_admin" && (
              <motion.section
                key="organizations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid gap-6 lg:grid-cols-[1.5fr,1fr]"
              >
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <ShieldCheck className="h-5 w-5 text-blue-500" />
                      Organisations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {organizations.map((org) => (
                      <div
                        key={org.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{org.name}</p>
                            <p className="text-xs text-slate-500">{org.slug}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
                              {org.status}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              className="border-slate-200 text-xs text-slate-700 hover:bg-slate-100"
                              onClick={() => handleActivateOrganization(org.id)}
                            >
                              Activer
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="border-red-200 text-xs text-red-600 hover:bg-red-50"
                              onClick={() => handleArchiveOrganization(org.id)}
                            >
                              Archiver
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {organizations.length === 0 && (
                      <p className="text-sm text-slate-500">Aucune organisation disponible.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <PlusCircle className="h-5 w-5 text-blue-500" />
                      Nouvelle organisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleOrganizationSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nom</label>
                        <Input
                          value={organizationForm.name}
                          onChange={(event) => setOrganizationForm((prev) => ({ ...prev, name: event.target.value }))}
                          className="bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Slug</label>
                        <Input
                          value={organizationForm.slug}
                          onChange={(event) => setOrganizationForm((prev) => ({ ...prev, slug: event.target.value }))}
                          className="bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Paramètres (JSON)</label>
                        <textarea
                          value={organizationForm.settings}
                          onChange={(event) => setOrganizationForm((prev) => ({ ...prev, settings: event.target.value }))}
                          className={`${baseFieldClasses} min-h-[70px] font-mono text-xs`}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700"
                        disabled={isSubmittingOrganization}
                      >
                        {isSubmittingOrganization ? "Création…" : "Créer l'organisation"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
