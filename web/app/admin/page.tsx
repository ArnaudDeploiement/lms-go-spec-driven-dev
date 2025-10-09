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
  LineChart,
  PlusCircle,
  ShieldCheck,
  BookOpen,
  UserPlus,
  FileStack,
  UploadCloud,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const baseNavItems = [
  { id: "overview", label: "Aperçu", icon: LayoutGrid },
  { id: "courses", label: "Cours", icon: GraduationCap },
  { id: "learners", label: "Apprenants", icon: Users },
  { id: "enrollments", label: "Inscriptions", icon: Layers },
  { id: "content", label: "Contenus", icon: FileStack },
];

const backToLearnNav = { id: "back-to-learn", label: "Retour Learn", icon: ArrowLeft, href: "/learn" } as const;

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
    return JSON.parse(value);
  } catch (error) {
    throw new Error("Le JSON fourni est invalide");
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { user, organization, isLoading, isAuthenticated } = useAuth();
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
    if (!isLoading) {
      if (!isAuthenticated) {
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
  }, [isLoading, isAuthenticated, organization?.id]);
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
      console.error(err);
      setError(err?.error || "Impossible d'enregistrer le cours");
    } finally {
      setIsSavingCourse(false);
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

  if (isLoading || isBootstrapping) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-slate-600">Chargement de l'espace administrateur…</p>
          </div>
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progression</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.progressPercentage}%</p>
            <p className="mt-2 text-xs text-slate-500">Taux moyen de complétion</p>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
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
        </div>

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
                      <div className="grid gap-4 sm:grid-cols-2">
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
