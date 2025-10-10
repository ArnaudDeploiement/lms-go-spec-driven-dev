"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';
import type { EnrollmentResponse, ProgressResponse } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  ArrowLeft,
  Play,
  CheckCircle,
  Lock,
  Clock,
  FileText,
  Video,
  FileQuestion,
  Download
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  module_type: string;
  order_index: number;
  duration_minutes?: number;
  content?: {
    id: string;
    title: string;
    description: string;
    content_type: string;
  };
}

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  modules?: Module[];
}

type Enrollment = EnrollmentResponse & {
  progress_pct: number;
  module_progress?: ProgressResponse[];
};

// utils/typeGuards.ts (ou en haut du fichier)
function hasModules(x: unknown): x is { modules: unknown[] } {
  return !!x && typeof x === 'object' && Array.isArray((x as any).modules);
}
function hasDataModules(x: unknown): x is { data: { modules: unknown[] } } {
  return !!(x as any)?.data && Array.isArray((x as any).data.modules);
}


const deriveProgressPercentage = ({
  progressValue,
  moduleProgress,
  totalModules,
}: {
  progressValue?: number;
  moduleProgress?: ProgressResponse[];
  totalModules?: number;
}) => {
  if (moduleProgress && moduleProgress.length > 0) {
    const completed = moduleProgress.filter((module) => module.status === 'completed').length;
    const denominator = totalModules && totalModules > 0 ? totalModules : moduleProgress.length;

    if (denominator > 0) {
      return Math.round((completed / denominator) * 100);
    }
  }

  if (typeof progressValue === 'number' && !Number.isNaN(progressValue)) {
    if (progressValue <= 1) {
      return Math.round(progressValue * 100);
    }

    return Math.round(progressValue);
  }

  return 0;
};

const normalizeEnrollment = (
  base: EnrollmentResponse,
  moduleProgress: ProgressResponse[] = [],
  totalModules?: number,
): Enrollment => ({
  ...base,
  module_progress: moduleProgress,
  progress_pct: deriveProgressPercentage({
    progressValue: base.progress,
    moduleProgress,
    totalModules,
  }),
});

const moduleTypeIcons: Record<string, any> = {
  video: Video,
  pdf: FileText,
  article: FileText,
  quiz: FileQuestion,
  scorm: Download,
};

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, organization, isAuthenticated } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const courseId = params.id as string;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    const fetchCourse = async () => {
      if (!organization) return;

      try {
        // Fetch course details
        const courseData = await apiClient.getCourse(organization.id, courseId);
        setCourse(courseData);

        // Check if user is enrolled
        try {
          const enrollments = await apiClient.getEnrollments(
            organization.id,
            user ? { user_id: user.id } : {}
          );
          const userEnrollment = enrollments.find((e: EnrollmentResponse) => e.course_id === courseId);

          if (userEnrollment) {
            // Fetch detailed progress
 // Fetch detailed progress
const progress = await apiClient.getProgress(organization.id, userEnrollment.id);

// 🔽 calcule un moduleCount robuste selon la forme réelle de getCourse
const moduleCount = hasModules(courseData)
  ? courseData.modules.length
  : hasDataModules(courseData)
  ? courseData.data.modules.length
  : progress.length;

// Utilise moduleCount au lieu de courseData.modules?.length ?? progress.length
setEnrollment(
  normalizeEnrollment(
    userEnrollment,
    progress,
    moduleCount,
  ),
);

          }
        } catch (error) {
          console.error('Error fetching enrollment:', error);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [isAuthenticated, organization, user, courseId, router]);

  const handleEnroll = async () => {
    if (!organization || !user) return;

    setIsEnrolling(true);
    try {
      const created = await apiClient.createEnrollment(organization.id, {
        course_id: courseId,
        user_id: user.id,
      });
      const progress = await apiClient.getProgress(organization.id, created.id);
      setEnrollment(
        normalizeEnrollment(created, progress, course?.modules?.length ?? progress.length),
      );
    } catch (error) {
      console.error('Error enrolling:', error);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleModuleClick = async (module: Module) => {
    if (!enrollment || !organization) return;

    const moduleProgress = enrollment.module_progress?.find(p => p.module_id === module.id);
    const isLocked = moduleProgress?.status === 'not_started' && module.order_index > 0;

    if (isLocked) return;

    // Update progress to in_progress if not started
    if (!moduleProgress || moduleProgress.status === 'not_started') {
      try {
        await apiClient.startModule(organization.id, enrollment.id, module.id);
        const fresh = await apiClient.getProgress(organization.id, enrollment.id);
        setEnrollment((prev) =>
          prev
            ? {
                ...prev,
                module_progress: fresh,
                progress_pct: deriveProgressPercentage({
                  progressValue: prev.progress,
                  moduleProgress: fresh,
                  totalModules: course?.modules?.length ?? fresh.length,
                }),
              }
            : prev,
        );
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }

    // Navigate to module content
    router.push(`/learn/course/${courseId}/module/${module.id}`);
  };

  const getModuleStatus = (module: Module) => {
    if (!enrollment) return 'locked';

    const progress = enrollment.module_progress?.find(p => p.module_id === module.id);
    if (!progress) return 'not_started';

    return progress.status;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ring/40 border-t-ring" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="p-8">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">Formation non trouvée</p>
            <Button className="mt-2" onClick={() => router.push('/learn')}>
              Retour au catalogue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/learn')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au catalogue
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8 border border-border/60 bg-surface">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-2 text-3xl font-semibold tracking-tight">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    {course.description}
                  </CardDescription>
                </div>
                <div className="ml-4">
                  {enrollment ? (
                    <div className="text-right">
                      <div className="mb-2 text-sm text-muted-foreground">
                        Progression
                      </div>
                      <div className="text-2xl font-semibold text-accent">
                        {enrollment.progress_pct || 0}%
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleEnroll} disabled={isEnrolling} className="justify-center">
                      {isEnrolling ? 'Inscription...' : "S'inscrire"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {enrollment && (
              <CardContent>
                <ProgressBar value={enrollment.progress_pct || 0} />
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Modules List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">Modules de formation</h2>

          {!course.modules || course.modules.length === 0 ? (
            <Card className="border border-border/60 bg-surface">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Aucun module disponible pour cette formation
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {course.modules
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((module, index) => {
                    const status = getModuleStatus(module);
                    const isCompleted = status === 'completed';
                    const isInProgress = status === 'in_progress';
                    const isLocked = !enrollment || (status === 'not_started' && index > 0);
                    const Icon = moduleTypeIcons[module.module_type] || FileText;

                    return (
                      <motion.div
                        key={module.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card
                          className={`cursor-pointer border transition-all ${
                            isInProgress
                              ? 'border-ring shadow-[0_0_0_1px_var(--ring)]'
                              : isCompleted
                              ? 'border-success/40'
                              : 'border-border/60'
                          } ${isLocked ? 'opacity-60' : 'hover:translate-y-[-2px]'}`}
                          onClick={() => !isLocked && handleModuleClick(module)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div
                                  className={`rounded-xl p-3 ${
                                    isCompleted ? 'bg-success/20 text-success' : 'bg-accent/15 text-accent'
                                  }`}
                                >
                                  {isLocked ? (
                                    <Lock className="h-6 w-6 text-muted-foreground" />
                                  ) : isCompleted ? (
                                    <CheckCircle className="h-6 w-6" />
                                  ) : (
                                    <Icon className={`h-6 w-6 ${isInProgress ? 'text-accent' : 'text-muted-foreground'}`} />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="mb-1 text-xl font-semibold">
                                    Module {index + 1}: {module.title}
                                  </CardTitle>
                                  <CardDescription className="text-sm text-muted-foreground">
                                    {module.description}
                                  </CardDescription>
                                  <div className="flex items-center gap-4 mt-2">
                                    {module.duration_minutes && (
                                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        {module.duration_minutes} min
                                      </span>
                                    )}
                                    <span className="text-sm capitalize text-muted-foreground">
                                      {module.module_type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                {isLocked ? (
                                  <span className="text-sm text-muted-foreground/70">Verrouillé</span>
                                ) : isCompleted ? (
                                  <CheckCircle className="h-6 w-6 text-success" />
                                ) : isInProgress ? (
                                  <Play className="h-6 w-6 text-accent" />
                                ) : (
                                  <Button size="sm" variant="subtle">
                                    Commencer
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
