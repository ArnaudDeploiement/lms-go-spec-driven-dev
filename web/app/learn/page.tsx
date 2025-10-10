"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/context";
import { apiClient, CourseResponse, EnrollmentResponse } from "@/lib/api/client";
import { Navigation } from "@/components/layout/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar, CircularProgress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingDashboard } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  GraduationCap,
  Trophy,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Clock,
  Target,
  Zap,
} from "lucide-react";

export default function LearnPage() {
  const router = useRouter();
  const { user, organization, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!organization) return;

    const fetchData = async () => {
      try {
        const [coursesData, enrollmentsData] = await Promise.all([
          apiClient.getCourses(organization.id, { status: "published" }),
          apiClient.getEnrollments(organization.id, user ? { user_id: user.id } : {}),
        ]);

        setCourses(coursesData);
        setEnrollments(enrollmentsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isAuthLoading, organization, user, router]);

  const getEnrollmentForCourse = (courseId: string) => {
    return enrollments.find((e) => e.course_id === courseId);
  };

  const getProgressPercentage = (enrollment: EnrollmentResponse) => {
    if (typeof enrollment.progress === "number") {
      return enrollment.progress <= 1
        ? Math.round(enrollment.progress * 100)
        : Math.round(enrollment.progress);
    }
    return 0;
  };

  // Compute statistics
  const enrolledCourses = courses.filter((course) => getEnrollmentForCourse(course.id));
  const availableCourses = courses.filter((course) => !getEnrollmentForCourse(course.id));
  const completedCount = enrollments.filter((e) => e.status === "completed").length;
  const avgProgress =
    enrolledCourses.length > 0
      ? Math.round(
          enrolledCourses.reduce((sum, course) => {
            const enrollment = getEnrollmentForCourse(course.id);
            return sum + (enrollment ? getProgressPercentage(enrollment) : 0);
          }, 0) / enrolledCourses.length
        )
      : 0;

  if (isLoading || isAuthLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-32 pb-16">
          <div className="container-custom">
            <LoadingDashboard />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-32 pb-16">
        <div className="container-custom space-y-12">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="glass-card relative overflow-hidden p-8 md:p-12">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-surface via-surface to-surface" />
              <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-60 w-60 rounded-full bg-accent/20 blur-3xl" />

              <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    Votre espace formation
                  </p>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl"
                  >
                    Bonjour {user?.email?.split("@")[0]}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-base text-muted-foreground md:text-lg"
                  >
                    Retrouvez vos formations actives, suivez votre progression et découvrez de nouveaux contenus sélectionnés pour vous.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-surface px-8 py-6 text-center shadow-subtle"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
                    Progression moyenne
                  </span>
                  <CircularProgress value={avgProgress} size={120} />
                  <p className="text-sm text-muted-foreground">
                    {avgProgress}% de vos formations complétées
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-surface p-5 shadow-subtle">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">Formations en cours</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{enrolledCourses.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-surface p-5 shadow-subtle">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 text-success">
                    <Trophy className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">Certifications obtenues</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{completedCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-surface p-5 shadow-subtle">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 text-success">
                    <Target className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">Progression globale</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{avgProgress}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-surface p-5 shadow-subtle">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">Formations disponibles</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{courses.length}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid gap-6 md:grid-cols-3"
          >
            <StatCard
              label="Formations actives"
              value={enrolledCourses.length}
              description="Formations en cours"
              icon={BookOpen}
              variant="primary"
            />
            <StatCard
              label="Progression moyenne"
              value={`${avgProgress}%`}
              description="De toutes vos formations"
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              label="Certifications"
              value={completedCount}
              description="Formations terminées"
              icon={Trophy}
              variant="warning"
            />
          </motion.div>

          {/* Enrolled Courses Section */}
          {enrolledCourses.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                    <GraduationCap className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      Mes Formations
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Continuez là où vous vous êtes arrêté
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {enrolledCourses.map((course, index) => {
                  const enrollment = getEnrollmentForCourse(course.id);
                  const progress = enrollment ? getProgressPercentage(enrollment) : 0;

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                    >
                      <div className="glass-card-hover group flex h-full cursor-pointer flex-col p-6">
                        {/* Course Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="mb-2 line-clamp-2 text-xl font-semibold text-foreground">
                              {course.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {course.description}
                            </p>
                          </div>
                          <div className="ml-4">
                            {progress === 100 ? (
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/20 text-success">
                                <Trophy className="h-6 w-6" strokeWidth={2.5} />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-surface-hover">
                                <BookOpen className="h-6 w-6 text-accent" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-auto space-y-4">
                          <ProgressBar value={progress} showLabel />

                          {/* Action Button */}
                          <Button
                            onClick={() => router.push(`/learn/course/${course.id}`)}
                            className="group/btn w-full justify-between"
                          >
                            <span>{progress > 0 ? "Continuer" : "Commencer"}</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Available Courses Section */}
          {availableCourses.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success/20 text-success">
                    <Sparkles className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      Catalogue de Formations
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Découvrez de nouvelles compétences
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                  >
                    <div className="glass-card-hover group flex h-full cursor-pointer flex-col p-6">
                      {/* Badge New */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                          <Zap className="h-3 w-3" />
                          <span>Nouveau</span>
                        </div>
                      </div>

                      {/* Course Info */}
                      <div className="mb-6 flex-1">
                        <h3 className="mb-2 line-clamp-2 text-xl font-semibold text-foreground">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {course.description}
                        </p>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => router.push(`/learn/course/${course.id}`)}
                        variant="subtle"
                        className="group/btn w-full justify-between"
                      >
                        <span>Découvrir</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Empty State */}
          {courses.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <EmptyState
                icon={BookOpen}
                title="Aucune formation disponible"
                description="Aucune formation n'est disponible pour le moment. Contactez votre administrateur pour en savoir plus."
              />
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
