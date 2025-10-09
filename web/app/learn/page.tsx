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
import { Loading, LoadingDashboard } from "@/components/ui/loading";
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

interface CourseWithEnrollment {
  course: CourseResponse;
  enrollment?: EnrollmentResponse;
  progress: number;
}

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="glass-card p-8 md:p-12 overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-full blur-3xl -z-10" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-3"
                    >
                      Bonjour, {user?.email?.split("@")[0]} 👋
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-lg text-[var(--text-secondary)]"
                    >
                      Continuez votre parcours d'apprentissage
                    </motion.p>
                  </div>

                  {/* Overall Progress Circle */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="hidden md:block"
                  >
                    <CircularProgress value={avgProgress} size={120} />
                  </motion.div>
                </div>

                {/* Quick Stats Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
                >
                  <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                      {enrolledCourses.length}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                      En cours
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-[var(--accent-success)] mb-1">
                      {completedCount}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                      Terminés
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-[var(--accent-secondary)] mb-1">
                      {avgProgress}%
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                      Progression
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-[var(--accent-primary)] mb-1">
                      {courses.length}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">
                      Disponibles
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                      Mes Formations
                    </h2>
                    <p className="text-sm text-[var(--text-tertiary)]">
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
                      <div className="glass-card-hover p-6 h-full flex flex-col group cursor-pointer">
                        {/* Course Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 line-clamp-2">
                              {course.title}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                              {course.description}
                            </p>
                          </div>
                          <div className="ml-4">
                            {progress === 100 ? (
                              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                <Trophy className="h-6 w-6 text-white" strokeWidth={2.5} />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-[var(--accent-primary)]" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-auto space-y-4">
                          <ProgressBar value={progress} showLabel />

                          {/* Action Button */}
                          <button
                            onClick={() => router.push(`/learn/course/${course.id}`)}
                            className="btn-primary w-full group/btn"
                          >
                            <span>{progress > 0 ? "Continuer" : "Commencer"}</span>
                            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                      Catalogue de Formations
                    </h2>
                    <p className="text-sm text-[var(--text-tertiary)]">
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
                    <div className="glass-card-hover p-6 h-full flex flex-col group cursor-pointer">
                      {/* Badge New */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="badge-primary">
                          <Zap className="h-3 w-3" />
                          <span>Nouveau</span>
                        </div>
                      </div>

                      {/* Course Info */}
                      <div className="flex-1 mb-6">
                        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-3">
                          {course.description}
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => router.push(`/learn/course/${course.id}`)}
                        className="btn-secondary w-full group/btn"
                      >
                        <span>Découvrir</span>
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
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
