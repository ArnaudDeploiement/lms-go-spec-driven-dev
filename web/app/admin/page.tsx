"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
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
  UserPlus,
  Users,
} from "lucide-react";

const fieldClass =
  "w-full rounded-xl border border-border/60 bg-surface px-4 py-2.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

const moduleTypeLabels: Record<string, string> = {
  video: "Vidéo",
  article: "Article",
  pdf: "PDF",
  quiz: "Quiz",
  scorm: "SCORM",
};

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

type UserFormState = {
  email: string;
  password: string;
  role: string;
};

type GroupFormState = {
  name: string;
  description: string;
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


const emptyUserForm: UserFormState = {
  email: "",
  password: "",
  role: "learner",
};

const emptyGroupForm: GroupFormState = {
  name: "",
  description: "",
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
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [courseForm, setCourseForm] = useState<CourseFormState>(createEmptyCourseForm());
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [groupForm, setGroupForm] = useState<GroupFormState>(emptyGroupForm);
  const [enrollmentForm, setEnrollmentForm] = useState<EnrollmentFormState>(emptyEnrollmentForm);
  const [organizationForm, setOrganizationForm] = useState<OrganizationFormState>(emptyOrganizationForm);

  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [isSavingEnrollment, setIsSavingEnrollment] = useState(false);
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
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
      return;
    }

    setIsLoadingModules(true);
    setError(null);
    void apiClient
      .listModules(organization.id, selectedCourseId)
      .then((moduleData) => {
        setModules(moduleData);
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
      const [coursesData, usersData, groupsData, enrollmentsData] = await Promise.all([
        apiClient.getCourses(organization.id),
        apiClient.listUsers(organization.id),
        apiClient.listGroups(organization.id),
        apiClient.getEnrollments(organization.id),
      ]);

      setCourses(coursesData);
      setUsers(usersData);
      setGroups(groupsData);
      setEnrollments(enrollmentsData);

      setSelectedCourseId(null);

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

  const handleCourseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !selectedCourseId) {
      setError("Sélectionnez un cours à modifier");
      return;
    }

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

      const course = await apiClient.updateCourse(organization.id, selectedCourseId, {
        title: courseForm.title,
        description: courseForm.description,
        metadata: baseMetadata,
      });
      setCourses((prev) => prev.map((item) => (item.id === course.id ? course : item)));

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

  const handleDeleteModule = async (moduleId: string) => {
    if (!organization) return;
    try {
      await apiClient.deleteModule(organization.id, moduleId);
      setModules((prev) => prev.filter((module) => module.id !== moduleId));
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
      <div className="min-h-screen bg-surface-hover">
        <Navigation />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-surface px-8 py-10 text-center shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-ring border-t-transparent" />
            <p className="text-sm text-muted-foreground">Chargement de l'espace administrateur…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !organization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-hover">
      <Navigation />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-surface px-6 py-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Administration</p>
              <h1 className="text-2xl font-semibold text-foreground">{organization.name}</h1>
              <p className="text-sm text-muted-foreground/80">Pilotez vos cours, utilisateurs et contenus depuis un espace centralisé.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2 border-border/60 text-sm text-muted-foreground"
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="rounded-2xl border border-border/60 bg-surface p-6 shadow-sm">
          <TabsList className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-surface data-[state=active]:text-foreground">
              <LayoutGrid className="h-4 w-4" /> Aperçu
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-surface data-[state=active]:text-foreground">
              <BookOpen className="h-4 w-4" /> Cours
            </TabsTrigger>
            <TabsTrigger value="learners" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-surface data-[state=active]:text-foreground">
              <Users className="h-4 w-4" /> Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-surface data-[state=active]:text-foreground">
              <Layers className="h-4 w-4" /> Inscriptions
            </TabsTrigger>
            {user.role === "super_admin" && (
              <TabsTrigger value="organizations" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-surface data-[state=active]:text-foreground">
                <ShieldCheck className="h-4 w-4" /> Organisations
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border border-border/60 bg-surface-hover/80 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cours publiés</CardTitle>
                  <GraduationCap className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-foreground">{stats.publishedCourses}</p>
                </CardContent>
              </Card>
              <Card className="border border-border/60 bg-surface-hover/80 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cours brouillons</CardTitle>
                  <PlusCircle className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-foreground">{stats.draftCourses}</p>
                </CardContent>
              </Card>
              <Card className="border border-border/60 bg-surface-hover/80 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Apprenants actifs</CardTitle>
                  <Users className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-foreground">{stats.activeLearners}</p>
                </CardContent>
              </Card>
              <Card className="border border-border/60 bg-surface-hover/80 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cours terminés</CardTitle>
                  <LineChart className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-foreground">{stats.completedCourses}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-border/60 bg-surface-hover/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Activité récente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {courses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-surface px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{course.title}</p>
                      <p className="text-xs text-muted-foreground/80">{course.status === "published" ? "Publié" : "Brouillon"}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-border/60 text-xs"
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
            <Card className="border border-ring/30 bg-accent/10 shadow-subtle">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground">Assistant guidé de création</CardTitle>
                  <p className="text-sm text-muted-foreground/80">
                    Créez un nouveau cours en trois étapes : informations, modules et publication.
                  </p>
                </div>
                <Button type="button" className="justify-center" onClick={() => router.push("/admin/courses/new") }>
                  <PlusCircle className="mr-2 h-4 w-4" /> Lancer l'assistant
                </Button>
              </CardHeader>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.1fr,1.4fr]">
              <Card className="border border-border/60 bg-surface shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Vos cours</CardTitle>
                  <p className="text-sm text-muted-foreground/80">Sélectionnez un cours pour afficher et modifier ses informations.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectCourse(course)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelectCourse(course);
                        }
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                        selectedCourseId === course.id
                          ? "border-ring/50 bg-accent/10"
                          : "border-border/60 bg-surface-hover hover:border-ring/40 hover:bg-accent/10"
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{course.title}</p>
                          <p className="text-xs text-muted-foreground/80">{course.description || "Pas de description"}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-surface px-3 py-1 text-muted-foreground">{course.status}</span>
                          {course.status === "published" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-border/60"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleUnpublishCourse(course.id);
                              }}
                            >
                              Dépublier
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-accent text-accent-foreground hover:bg-accent/90"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handlePublishCourse(course.id);
                              }}
                            >
                              Publier
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleArchiveCourse(course.id);
                            }}
                          >
                            Archiver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/40 bg-surface-hover px-4 py-6 text-center text-sm text-muted-foreground/80">
                      Aucun cours pour le moment. Utilisez l'assistant pour créer votre premier programme.
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedCourse ? (
                <Card className="border border-border/60 bg-surface shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">Modifier le cours : {selectedCourse.title}</CardTitle>
                    <p className="text-sm text-muted-foreground/80">
                      Mettez à jour les informations principales du cours sélectionné.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 text-xs text-muted-foreground/80">
                      Slug : <code className="rounded bg-surface-hover px-1 py-0.5">{selectedCourse.slug}</code>
                    </div>
                    <form className="space-y-4" onSubmit={handleCourseSubmit}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Titre</label>
                        <Input
                          required
                          value={courseForm.title}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <textarea
                          className={fieldClass}
                          rows={3}
                          value={courseForm.description}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Tags</label>
                          <Input
                            value={courseForm.tags}
                            onChange={(event) => setCourseForm((prev) => ({ ...prev, tags: event.target.value }))}
                            placeholder="séparés par une virgule"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Durée (heures)</label>
                          <Input
                            value={courseForm.duration_hours}
                            onChange={(event) => setCourseForm((prev) => ({ ...prev, duration_hours: event.target.value }))}
                            placeholder="ex: 12"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Niveau</label>
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
                          <label className="text-sm font-medium text-muted-foreground">Visibilité</label>
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
                        <label className="text-sm font-medium text-muted-foreground">Métadonnées (JSON)</label>
                        <textarea
                          className={fieldClass}
                          rows={5}
                          value={courseForm.metadata}
                          onChange={(event) => setCourseForm((prev) => ({ ...prev, metadata: event.target.value }))}
                          placeholder={'{\n  "lang": "fr"\n}'}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                        disabled={isSavingCourse}
                      >
                        {isSavingCourse ? "Enregistrement…" : "Enregistrer les modifications"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-border/60 bg-surface shadow-sm">
                  <CardContent className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground/80">
                    <BookOpen className="h-8 w-8 text-muted-foreground/70" />
                    <p className="font-medium text-muted-foreground">Sélectionnez un cours pour afficher ses détails.</p>
                    <p>Vous pouvez créer de nouveaux cours uniquement avec l'assistant guidé.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {selectedCourse && (
              <Card className="border border-border/60 bg-surface shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                    <FileStack className="h-5 w-5 text-accent" /> Modules du cours
                  </CardTitle>
                  <p className="text-sm text-muted-foreground/80">
                    Les modules sont gérés via l'assistant de création. Supprimez ceux qui ne sont plus nécessaires.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingModules && <p className="text-sm text-muted-foreground/80">Chargement des modules…</p>}
                  {!isLoadingModules && modules.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/40 bg-surface-hover px-4 py-6 text-center text-sm text-muted-foreground/80">
                      Aucun module pour ce cours.
                    </div>
                  )}
                  {modules.map((module) => (
                    <div key={module.id} className="rounded-lg border border-border/60 bg-surface-hover px-4 py-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{module.title}</p>
                          <p className="text-xs text-muted-foreground/80">
                            {moduleTypeLabels[module.module_type] ?? module.module_type}
                            {module.duration_seconds
                              ? ` • ${Math.ceil((module.duration_seconds ?? 0) / 60)} min`
                              : ""}
                          </p>
                          {module.content_id && (
                            <p className="text-xs text-muted-foreground/70">Contenu associé : {module.content_id}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 md:self-start"
                          onClick={() => void handleDeleteModule(module.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="learners" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr,1.9fr]">
              <Card className="border border-border/60 bg-surface shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                    <UserPlus className="h-5 w-5 text-accent" /> Nouvel utilisateur
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
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSavingUser}>
                      {isSavingUser ? "Création…" : "Créer l'utilisateur"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-surface shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {users.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-surface-hover px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.email}</p>
                        <p className="text-xs text-muted-foreground/80">
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
                            className="border-border/60"
                            onClick={() => handleActivateUser(item.id)}
                          >
                            Activer
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-sm text-muted-foreground/80">Aucun utilisateur pour le moment.</p>}
                </CardContent>
              </Card>
            </div>

            <Card className="border border-border/60 bg-surface shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <Users className="h-5 w-5 text-accent" /> Groupes
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
                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSavingGroup}>
                    {isSavingGroup ? "Création…" : "Créer le groupe"}
                  </Button>
                </form>

                <div className="space-y-3">
                  {groups.map((group) => (
                    <div key={group.id} className="rounded-lg border border-border/60 bg-surface-hover px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{group.name}</p>
                      <p className="text-xs text-muted-foreground/80">{group.description || "Pas de description"}</p>
                    </div>
                  ))}
                  {groups.length === 0 && <p className="text-sm text-muted-foreground/80">Aucun groupe enregistré.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments" className="mt-6 space-y-6">
            <Card className="border border-border/60 bg-surface shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <Layers className="h-5 w-5 text-accent" /> Gérer les inscriptions
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
                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSavingEnrollment}>
                    {isSavingEnrollment ? "Création…" : "Créer l'inscription"}
                  </Button>
                </form>

                <div className="space-y-3">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="rounded-lg border border-border/60 bg-surface-hover px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">
                        {courses.find((course) => course.id === enrollment.course_id)?.title || "Cours"}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {users.find((item) => item.id === enrollment.user_id)?.email || "Utilisateur"} • {enrollment.status}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/80">
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
                  {enrollments.length === 0 && <p className="text-sm text-muted-foreground/80">Aucune inscription enregistrée.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === "super_admin" && (
            <TabsContent value="organizations" className="mt-6 space-y-6">
              <Card className="border border-border/60 bg-surface shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                    <ShieldCheck className="h-5 w-5 text-accent" /> Organisations
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
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSavingOrganization}>
                      {isSavingOrganization ? "Création…" : "Créer l'organisation"}
                    </Button>
                  </form>

                  <div className="space-y-3">
                    {organizations.map((org) => (
                      <div key={org.id} className="rounded-lg border border-border/60 bg-surface-hover px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{org.name}</p>
                        <p className="text-xs text-muted-foreground/80">{org.slug} • {org.status}</p>
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
                              className="border-border/60"
                              onClick={() => handleActivateOrganization(org.id)}
                            >
                              Activer
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {organizations.length === 0 && <p className="text-sm text-muted-foreground/80">Aucune organisation disponible.</p>}
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
