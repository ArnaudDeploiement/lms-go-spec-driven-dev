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
  Sparkles,
  LineChart,
  PlusCircle,
  Rocket,
  ShieldCheck,
  BookOpen,
  UserPlus,
  FileStack,
  UploadCloud,
  Building2,
} from "lucide-react";

const baseNavItems = [
  { id: "overview", label: "Aperçu", icon: LayoutGrid },
  { id: "courses", label: "Cours", icon: GraduationCap },
  { id: "learners", label: "Apprenants", icon: Users },
  { id: "enrollments", label: "Inscriptions", icon: Layers },
  { id: "content", label: "Contenus", icon: FileStack },
];

const moduleTypes = [
  { value: "video", label: "Vidéo" },
  { value: "article", label: "Article" },
  { value: "pdf", label: "Document" },
  { value: "quiz", label: "Quiz" },
  { value: "scorm", label: "SCORM" },
];

function parseJsonInput(input: string): Record<string, any> | undefined {
  if (!input.trim()) return undefined;
  try {
    return JSON.parse(input);
  } catch (error) {
    console.error("Invalid JSON", error);
    throw new Error("Le champ métadonnées doit contenir du JSON valide");
  }
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

  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    description: "",
    metadata: "",
  });

  const [moduleForm, setModuleForm] = useState({
    title: "",
    module_type: moduleTypes[0].value,
    content_id: "",
    duration_seconds: "",
    data: "",
  });

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
    mime_type: "video/mp4",
    size_bytes: "",
    metadata: "",
  });

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
      const metadata = parseJsonInput(courseForm.metadata || "");
      const newCourse = await apiClient.createCourse(organization.id, {
        title: courseForm.title,
        slug: courseForm.slug,
        description: courseForm.description,
        metadata,
      });
      setCourses((prev) => [newCourse, ...prev]);
      setCourseForm({ title: "", slug: "", description: "", metadata: "" });
      setSelectedCourse(newCourse);
      setFeedback(`Cours "${newCourse.title}" créé avec succès`);
    } catch (err: any) {
      setError(err?.error || "Impossible de créer le cours");
    } finally {
      setIsSubmittingCourse(false);
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
      setModuleForm({ title: "", module_type: moduleTypes[0].value, content_id: "", duration_seconds: "", data: "" });
      setFeedback(`Module "${module.title}" ajouté`);
    } catch (err: any) {
      setError(err?.error || "Impossible d'ajouter le module");
    } finally {
      setIsSubmittingModule(false);
    }
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
    try {
      setIsSubmittingContent(true);
      const metadata = parseJsonInput(contentForm.metadata || "");
      const size = contentForm.size_bytes ? Number(contentForm.size_bytes) : 0;
      const response = await apiClient.createContent(organization.id, {
        name: contentForm.name,
        mime_type: contentForm.mime_type,
        size_bytes: size,
        metadata,
      });
      setContents((prev) => [response.content, ...prev]);
      setContentForm({ name: "", mime_type: "video/mp4", size_bytes: "", metadata: "" });
      setLastUploadLink(response.upload_url);
      setFeedback(`Contenu "${response.content.name}" créé. Téléversement disponible.`);
    } catch (err: any) {
      setError(err?.error || "Impossible de créer le contenu");
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card px-6 py-8 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-cyan-400/60 border-t-transparent"
          />
          <p className="text-sm text-slate-300">Chargement de votre campus numérique…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 pb-32 text-gray-100">
      <Navigation />
      <header className="glass-nav fixed inset-x-6 top-6 z-50 flex items-center justify-between rounded-3xl px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 rounded-2xl bg-white/10 p-[2px]">
            <div className="h-full w-full rounded-2xl bg-slate-900/80 backdrop-blur-xl" />
            <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">LMS Orchestrator</p>
            <h1 className="text-2xl font-semibold text-slate-50">{organization?.name || "Organisation"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-xs font-semibold uppercase text-slate-900">
            {user?.email?.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-100">{user?.email}</p>
            <p className="text-xs text-cyan-300">{user?.role}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pt-28">
        {feedback && (
          <motion.div
            key={feedback}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card border-cyan-400/40 px-4 py-3 text-sm text-cyan-200"
          >
            {feedback}
          </motion.div>
        )}

        {error && (
          <motion.div
            key={error}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card border-rose-400/40 px-4 py-3 text-sm text-rose-200"
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
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg text-slate-100">
                <span>Solde de progression</span>
                <LineChart className="h-5 w-5 text-cyan-300" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm uppercase tracking-wide text-slate-300">Cours terminés</p>
                <div className="mt-3 flex items-end justify-between">
                  <h2 className="text-3xl font-semibold text-white">
                    {stats.completed}/{stats.total || 1}
                  </h2>
                  <span className="revolut-badge text-cyan-200">{stats.progressPercentage}%</span>
                </div>
                <div className="mt-4 h-2 w-full rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
                    style={{ width: `${stats.progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Cours publiés</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{stats.publishedCourses}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Apprenants actifs</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{stats.activeLearners}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                <Rocket className="h-5 w-5 text-cyan-300" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button onClick={() => setActiveSection("courses")} className="revolut-button flex items-center justify-between">
                <span>Créer un cours</span>
                <PlusCircle className="h-4 w-4" />
              </Button>
              <Button onClick={() => setActiveSection("learners")} className="revolut-button flex items-center justify-between">
                <span>Inviter un apprenant</span>
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button onClick={() => setActiveSection("content")} className="revolut-button flex items-center justify-between">
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
                <motion.div key={course.id} whileHover={{ translateY: -6 }} className="revolut-card p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{course.title}</h3>
                    <span className="revolut-badge text-xs text-cyan-200">{course.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{course.description}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>Créé le {new Date(course.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setActiveSection("courses");
                      }}
                      className="text-cyan-300 hover:text-cyan-200"
                    >
                      Gérer
                    </button>
                  </div>
                </motion.div>
              ))}
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
              <div className="space-y-5">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg text-slate-100">
                      <span>Catalogue des cours</span>
                      <ShieldCheck className="h-5 w-5 text-cyan-300" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {courses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => setSelectedCourse(course)}
                        className={`w-full rounded-3xl border px-4 py-3 text-left transition-all duration-300 ${
                          selectedCourse?.id === course.id
                            ? "border-cyan-400/60 bg-white/15 shadow-[0_15px_40px_-20px_rgba(34,211,238,0.6)]"
                            : "border-white/10 bg-white/5 hover:border-cyan-300/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-semibold text-white">{course.title}</p>
                            <p className="text-xs text-slate-300">{course.description}</p>
                          </div>
                          <span className="revolut-badge text-cyan-200">{course.status}</span>
                        </div>
                      </button>
                    ))}
                    {courses.length === 0 && (
                      <p className="text-sm text-slate-400">Aucun cours pour le moment. Créez votre première formation !</p>
                    )}
                  </CardContent>
                </Card>

                {selectedCourse && (
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg text-slate-100">
                        <span>Modules du cours « {selectedCourse.title} »</span>
                        <BookOpen className="h-5 w-5 text-cyan-300" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {modules.length === 0 && <p className="text-sm text-slate-400">Aucun module pour le moment.</p>}
                      {modules.map((module) => (
                        <div key={module.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">{module.title}</p>
                              <p className="text-xs text-slate-400">
                                {module.module_type} · {module.duration_seconds || 0} sec
                              </p>
                            </div>
                            <span className="text-xs uppercase tracking-wide text-slate-400">#{module.position}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                      <PlusCircle className="h-5 w-5 text-cyan-300" />
                      Nouveau cours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCourseSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Titre</label>
                        <Input
                          value={courseForm.title}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
                          className="revolut-input"
                          placeholder="Onboarding digital"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Slug</label>
                        <Input
                          value={courseForm.slug}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, slug: event.target.value }))}
                          className="revolut-input"
                          placeholder="onboarding-digital"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Description</label>
                        <textarea
                          value={courseForm.description}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))}
                          className="revolut-input min-h-[90px]"
                          placeholder="Décrivez la proposition de valeur du cours"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Métadonnées (JSON)</label>
                        <textarea
                          value={courseForm.metadata}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, metadata: event.target.value }))}
                          className="revolut-input min-h-[70px] font-mono text-xs"
                          placeholder='{"level":"beginner"}'
                        />
                      </div>
                      <Button type="submit" className="revolut-button w-full justify-center" disabled={isSubmittingCourse}>
                        {isSubmittingCourse ? "Création…" : "Créer le cours"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {selectedCourse && (
                  <Card className="glass-card border-white/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                        <Layers className="h-5 w-5 text-cyan-300" />
                        Ajouter un module
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleModuleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wide text-slate-300">Titre</label>
                          <Input
                            value={moduleForm.title}
                            onChange={(event) => setModuleForm((prev) => ({ ...prev, title: event.target.value }))}
                            className="revolut-input"
                            placeholder="Vidéo de bienvenue"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wide text-slate-300">Type</label>
                          <select
                            value={moduleForm.module_type}
                            onChange={(event) => setModuleForm((prev) => ({ ...prev, module_type: event.target.value }))}
                            className="revolut-input"
                          >
                            {moduleTypes.map((type) => (
                              <option key={type.value} value={type.value} className="bg-slate-900">
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wide text-slate-300">Contenu associé</label>
                            <select
                              value={moduleForm.content_id}
                              onChange={(event) => setModuleForm((prev) => ({ ...prev, content_id: event.target.value }))}
                              className="revolut-input"
                            >
                              <option value="">Aucun contenu</option>
                              {contents.map((content) => (
                                <option key={content.id} value={content.id} className="bg-slate-900">
                                  {content.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wide text-slate-300">Durée (secondes)</label>
                            <Input
                              type="number"
                              min={0}
                              value={moduleForm.duration_seconds}
                              onChange={(event) => setModuleForm((prev) => ({ ...prev, duration_seconds: event.target.value }))}
                              className="revolut-input"
                              placeholder="300"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wide text-slate-300">Métadonnées (JSON)</label>
                          <textarea
                            value={moduleForm.data}
                            onChange={(event) => setModuleForm((prev) => ({ ...prev, data: event.target.value }))}
                            className="revolut-input min-h-[70px] font-mono text-xs"
                            placeholder='{"duration":5}'
                          />
                        </div>
                        <Button type="submit" className="revolut-button w-full justify-center" disabled={isSubmittingModule}>
                          {isSubmittingModule ? "Ajout…" : "Ajouter le module"}
                        </Button>
                      </form>
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={() => handlePublishCourse(selectedCourse)}
                          className="revolut-button flex-1 justify-center bg-gradient-to-r from-indigo-500 to-cyan-400"
                        >
                          Publier
                        </Button>
                        <Button
                          onClick={() => handleUnpublishCourse(selectedCourse)}
                          className="revolut-button flex-1 justify-center bg-white/5"
                        >
                          Dépublier
                        </Button>
                      </div>
                      <Button
                        onClick={() => handleArchiveCourse(selectedCourse)}
                        className="mt-2 w-full rounded-full border border-white/20 bg-white/0 px-4 py-2 text-sm text-rose-200 hover:bg-white/10"
                      >
                        Archiver le cours
                      </Button>
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
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <Users className="h-5 w-5 text-cyan-300" />
                    Apprenants
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {users.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{item.email}</p>
                        <p className="text-xs text-slate-400">{item.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`revolut-badge ${item.status === "active" ? "text-emerald-200" : "text-amber-200"}`}>
                          {item.status}
                        </span>
                        {item.status === "active" ? (
                          <Button onClick={() => handleDeactivateUser(item.id)} className="revolut-button bg-white/5 px-3 text-xs">
                            Désactiver
                          </Button>
                        ) : (
                          <Button onClick={() => handleActivateUser(item.id)} className="revolut-button bg-white/5 px-3 text-xs">
                            Réactiver
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-sm text-slate-400">Aucun utilisateur enregistré.</p>}
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <UserPlus className="h-5 w-5 text-cyan-300" />
                    Nouvel utilisateur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-slate-300">Email</label>
                      <Input
                        type="email"
                        value={userForm.email}
                        onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                        className="revolut-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-slate-300">Mot de passe</label>
                      <Input
                        type="password"
                        value={userForm.password}
                        onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                        className="revolut-input"
                        required
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Rôle</label>
                        <select
                          value={userForm.role}
                          onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
                          className="revolut-input"
                        >
                          <option value="learner">Apprenant</option>
                          <option value="instructor">Formateur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Statut</label>
                        <select
                          value={userForm.status}
                          onChange={(event) => setUserForm((prev) => ({ ...prev, status: event.target.value }))}
                          className="revolut-input"
                        >
                          <option value="active">Actif</option>
                          <option value="inactive">Inactif</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-slate-300">Métadonnées (JSON)</label>
                      <textarea
                        value={userForm.metadata}
                        onChange={(event) => setUserForm((prev) => ({ ...prev, metadata: event.target.value }))}
                        className="revolut-input min-h-[70px] font-mono text-xs"
                      />
                    </div>
                    <Button type="submit" className="revolut-button w-full justify-center" disabled={isSubmittingUser}>
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
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <GraduationCap className="h-5 w-5 text-cyan-300" />
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
                        className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{course?.title || "Cours"}</p>
                          <p className="text-xs text-slate-400">{learner?.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="revolut-badge text-cyan-200">{enrollment.status}</span>
                          <Button onClick={() => handleCancelEnrollment(enrollment.id)} className="revolut-button bg-white/5 px-3 text-xs">
                            Annuler
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {enrollments.length === 0 && <p className="text-sm text-slate-400">Aucune inscription enregistrée.</p>}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                      <PlusCircle className="h-5 w-5 text-cyan-300" />
                      Nouvelle inscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Cours</label>
                        <select
                          value={enrollmentForm.course_id}
                          onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, course_id: event.target.value }))}
                          className="revolut-input"
                          required
                        >
                          <option value="">Choisir un cours</option>
                          {courses.map((course) => (
                            <option key={course.id} value={course.id} className="bg-slate-900">
                              {course.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Apprenant</label>
                        <select
                          value={enrollmentForm.user_id}
                          onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, user_id: event.target.value }))}
                          className="revolut-input"
                          required
                        >
                          <option value="">Choisir un utilisateur</option>
                          {users.map((item) => (
                            <option key={item.id} value={item.id} className="bg-slate-900">
                              {item.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Groupe</label>
                        <select
                          value={enrollmentForm.group_id}
                          onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, group_id: event.target.value }))}
                          className="revolut-input"
                        >
                          <option value="">Aucun</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id} className="bg-slate-900">
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Métadonnées (JSON)</label>
                        <textarea
                          value={enrollmentForm.metadata}
                          onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, metadata: event.target.value }))}
                          className="revolut-input min-h-[70px] font-mono text-xs"
                        />
                      </div>
                      <Button type="submit" className="revolut-button w-full justify-center" disabled={isSubmittingEnrollment}>
                        {isSubmittingEnrollment ? "Création…" : "Créer l'inscription"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="glass-card border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                      <Layers className="h-5 w-5 text-cyan-300" />
                      Groupes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGroupSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Nom</label>
                        <Input
                          value={groupForm.name}
                          onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value }))}
                          className="revolut-input"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Description</label>
                        <textarea
                          value={groupForm.description}
                          onChange={(event) => setGroupForm((prev) => ({ ...prev, description: event.target.value }))}
                          className="revolut-input min-h-[70px]"
                          required
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wide text-slate-300">Capacité</label>
                          <Input
                            type="number"
                            min={1}
                            value={groupForm.capacity}
                            onChange={(event) => setGroupForm((prev) => ({ ...prev, capacity: event.target.value }))}
                            className="revolut-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-wide text-slate-300">Cours lié</label>
                          <select
                            value={groupForm.course_id}
                            onChange={(event) => setGroupForm((prev) => ({ ...prev, course_id: event.target.value }))}
                            className="revolut-input"
                          >
                            <option value="">Optionnel</option>
                            {courses.map((course) => (
                              <option key={course.id} value={course.id} className="bg-slate-900">
                                {course.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Métadonnées (JSON)</label>
                        <textarea
                          value={groupForm.metadata}
                          onChange={(event) => setGroupForm((prev) => ({ ...prev, metadata: event.target.value }))}
                          className="revolut-input min-h-[70px] font-mono text-xs"
                        />
                      </div>
                      <Button type="submit" className="revolut-button w-full justify-center" disabled={isSubmittingGroup}>
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
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <FileStack className="h-5 w-5 text-cyan-300" />
                    Bibliothèque de contenus
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contents.map((content) => (
                    <div key={content.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{content.name}</p>
                          <p className="text-xs text-slate-400">{content.mime_type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => handleDownloadLink(content.id)} className="revolut-button bg-white/5 px-3 text-xs">
                            Télécharger
                          </Button>
                          <Button onClick={() => handleFinalizeContent(content.id)} className="revolut-button bg-white/5 px-3 text-xs">
                            Finaliser
                          </Button>
                          <Button onClick={() => handleArchiveContent(content.id)} className="revolut-button bg-white/5 px-3 text-xs text-rose-200">
                            Archiver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {contents.length === 0 && <p className="text-sm text-slate-400">Aucun contenu disponible.</p>}
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <UploadCloud className="h-5 w-5 text-cyan-300" />
                    Nouveau contenu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContentSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-slate-300">Nom</label>
                      <Input
                        value={contentForm.name}
                        onChange={(event) => setContentForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="revolut-input"
                        required
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Type MIME</label>
                        <Input
                          value={contentForm.mime_type}
                          onChange={(event) => setContentForm((prev) => ({ ...prev, mime_type: event.target.value }))}
                          className="revolut-input"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-slate-300">Taille estimée (octets)</label>
                        <Input
                          type="number"
                          min={0}
                          value={contentForm.size_bytes}
                          onChange={(event) => setContentForm((prev) => ({ ...prev, size_bytes: event.target.value }))}
                          className="revolut-input"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-slate-300">Métadonnées (JSON)</label>
                      <textarea
                        value={contentForm.metadata}
                        onChange={(event) => setContentForm((prev) => ({ ...prev, metadata: event.target.value }))}
                        className="revolut-input min-h-[70px] font-mono text-xs"
                      />
                    </div>
                    {lastUploadLink && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                        Dernier lien de téléversement :
                        <br />
                        <span className="break-all text-cyan-200">{lastUploadLink}</span>
                      </div>
                    )}
                    <Button type="submit" className="revolut-button w-full justify-center" disabled={isSubmittingContent}>
                      {isSubmittingContent ? "Génération…" : "Créer le contenu"}
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
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <ShieldCheck className="h-5 w-5 text-cyan-300" />
                    Organisations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {organizations.map((org) => (
                    <div key={org.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{org.name}</p>
                          <p className="text-xs text-slate-400">{org.slug}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="revolut-badge text-cyan-200">{org.status}</span>
                          <Button onClick={() => handleActivateOrganization(org.id)} className="revolut-button bg-white/5 px-3 text-xs">
                            Activer
                          </Button>
                          <Button onClick={() => handleArchiveOrganization(org.id)} className="revolut-button bg-white/5 px-3 text-xs text-rose-200">
                            Archiver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {organizations.length === 0 && <p className="text-sm text-slate-400">Aucune organisation disponible.</p>}
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
                    <PlusCircle className="h-5 w-5 text-cyan-300" />
                    Nouvelle organisation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleOrganizationSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-slate-300">Nom</label>
                      <Input
                        value={organizationForm.name}
                        onChange={(event) => setOrganizationForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="revolut-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-slate-300">Slug</label>
                      <Input
                        value={organizationForm.slug}
                        onChange={(event) => setOrganizationForm((prev) => ({ ...prev, slug: event.target.value }))}
                        className="revolut-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-slate-300">Paramètres (JSON)</label>
                      <textarea
                        value={organizationForm.settings}
                        onChange={(event) => setOrganizationForm((prev) => ({ ...prev, settings: event.target.value }))}
                        className="revolut-input min-h-[70px] font-mono text-xs"
                      />
                    </div>
                    <Button type="submit" className="revolut-button w-full justify-center" disabled={isSubmittingOrganization}>
                      {isSubmittingOrganization ? "Création…" : "Créer l'organisation"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <nav className="glass-nav fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full px-6 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs transition-all duration-300 ${
                isActive ? "bg-white/20 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-cyan-300" : "text-slate-400"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
