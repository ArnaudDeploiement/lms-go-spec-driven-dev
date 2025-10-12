"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';
import type { CourseMetadata, EnrollmentResponse, ProgressResponse } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
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
  metadata?: CourseMetadata | null;
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
  const [coverContentId, setCoverContentId] = useState<string | null>(null);
  const [courseCoverUrl, setCourseCoverUrl] = useState<string | null>(null);

  const courseId = params.id as string;

  const sortedModules = useMemo(
    () => (course?.modules ? [...course.modules].sort((a, b) => a.order_index - b.order_index) : []),
    [course?.modules]
  );

  const moduleProgressMap = useMemo(() => {
    const map = new Map<string, ProgressResponse>();
    enrollment?.module_progress?.forEach((progress) => {
      map.set(progress.module_id, progress);
    });
    return map;
  }, [enrollment?.module_progress]);

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
        const courseEntity = courseData as Course;
        setCourse(courseEntity);

        const nextCoverContentId = courseEntity.metadata?.cover_image?.content_id ?? null;
        setCoverContentId(nextCoverContentId);
        if (!nextCoverContentId) {
          setCourseCoverUrl(null);
        }

        // Check if user is enrolled
        try {
          const enrollments = await apiClient.getEnrollments(
            organization.id,
            user ? { user_id: user.id } : {}
          );
          const userEnrollment = enrollments.find((e: EnrollmentResponse) => e.course_id === courseId);

          if (userEnrollment) {
            const progress = await apiClient.getProgress(organization.id, userEnrollment.id);
            const moduleCount = hasModules(courseData)
              ? courseData.modules.length
              : hasDataModules(courseData)
              ? courseData.data.modules.length
              : progress.length;

            setEnrollment(normalizeEnrollment(userEnrollment, progress, moduleCount));
          } else {
            setEnrollment(null);
          }
        } catch (error) {
          console.error('Error fetching enrollment:', error);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        setCourse(null);
        setCoverContentId(null);
        setCourseCoverUrl(null);
        setEnrollment(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [isAuthenticated, organization, user, courseId, router]);

  useEffect(() => {
    let cancelled = false;

    if (!organization || !coverContentId) {
      setCourseCoverUrl(null);
      return;
    }

    const fetchCover = async () => {
      try {
        const downloadLink = await apiClient.getDownloadLink(organization.id, coverContentId);
        if (!cancelled) {
          setCourseCoverUrl(downloadLink.download_url);
        }
      } catch (error) {
        console.error('Error fetching course cover:', error);
        if (!cancelled) {
          setCourseCoverUrl(null);
        }
      }
    };

    fetchCover();

    return () => {
      cancelled = true;
    };
  }, [coverContentId, organization]);

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

    const index = sortedModules.findIndex((m) => m.id === module.id);
    const status = moduleProgressMap.get(module.id)?.status ?? 'not_started';
    const previousCompleted =
      index <= 0 || sortedModules.slice(0, index).every((prevModule) => moduleProgressMap.get(prevModule.id)?.status === 'completed');
    const canAccess = status === 'in_progress' || status === 'completed' || previousCompleted;

    if (!canAccess) return;

    if (status === 'not_started') {
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
                  totalModules: sortedModules.length || fresh.length,
                }),
              }
            : prev,
        );
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }

    router.push(`/learn/course/${courseId}/module/${module.id}`);
  };

  const getModuleStatus = (module: Module) => {
    if (!enrollment) return 'locked';

    const progress = moduleProgressMap.get(module.id);
    return progress?.status ?? 'not_started';
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600">Formation non trouvée</p>
            <Button className="mt-4" onClick={() => router.push('/learn')}>
              Retour au catalogue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
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
      <main className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-start md:gap-6">
                  {courseCoverUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm md:w-64">
                      <img
                        src={courseCoverUrl}
                        alt={`Illustration du cours ${course.title}`}
                        className="h-40 w-full object-cover md:h-44"
                      />
                    </div>
                  ) : coverContentId ? (
                    <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 shadow-sm md:h-44 md:w-64">
                      <div className="h-6 w-6 animate-pulse rounded-full bg-slate-300" />
                    </div>
                  ) : null}
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
                    <CardDescription className="text-base">
                      {course.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="md:ml-4">
                  {enrollment ? (
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-2">
                        Progression
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {enrollment.progress_pct || 0}%
                      </div>
                    </div>
                  ) : (
                    <Button onClick={handleEnroll} disabled={isEnrolling}>
                      {isEnrolling ? 'Inscription...' : "S'inscrire"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {enrollment && (
              <CardContent>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${enrollment.progress_pct || 0}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="h-full rounded-full bg-blue-600"
                  />
                </div>
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
          <h2 className="text-2xl font-bold mb-4">Modules de formation</h2>

          {!course.modules || course.modules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-600 text-center">
                  Aucun module disponible pour cette formation
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {sortedModules.map((module, index) => {
                    const status = getModuleStatus(module);
                    const isCompleted = status === 'completed';
                    const isInProgress = status === 'in_progress';
                    const previousCompleted =
                      index === 0 || sortedModules.slice(0, index).every((prevModule) => moduleProgressMap.get(prevModule.id)?.status === 'completed');
                    const canAccess = status === 'in_progress' || status === 'completed' || previousCompleted;
                    const isLocked = !enrollment || !canAccess;
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
                          className={`transition-all cursor-pointer ${
                            isLocked ? 'opacity-50' : 'shadow-[var(--soft-shadow-sm)] hover:shadow-[var(--soft-shadow)]'
                          } ${
                            isInProgress ? 'border border-[rgba(124,167,255,0.6)]' : isCompleted ? 'border border-[rgba(90,226,180,0.6)]' : 'border border-transparent'
                          }`}
                          onClick={() => !isLocked && handleModuleClick(module)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`
                                  p-3 rounded-lg
                                  ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}
                                `}>
                                  {isLocked ? (
                                    <Lock className="h-6 w-6 text-gray-400" />
                                  ) : isCompleted ? (
                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                  ) : (
                                    <Icon className={`h-6 w-6 ${isInProgress ? 'text-[var(--accent-primary)]' : 'text-[var(--muted-foreground)]'}`} />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-xl mb-1">
                                    Module {index + 1}: {module.title}
                                  </CardTitle>
                                  <CardDescription>{module.description}</CardDescription>
                                  <div className="flex items-center gap-4 mt-2">
                                    {module.duration_minutes && (
                                      <span className="flex items-center gap-1 text-sm text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        {module.duration_minutes} min
                                      </span>
                                    )}
                                    <span className="text-sm text-gray-600 capitalize">
                                      {module.module_type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                {isLocked ? (
                                  <span className="text-sm text-[var(--muted-foreground)]">Verrouillé</span>
                                ) : isCompleted ? (
                                  <CheckCircle className="h-6 w-6 text-green-500" />
                                ) : isInProgress ? (
                                  <Play className="h-6 w-6 text-[var(--accent-primary)]" />
                                ) : (
                                  <Button size="sm" variant="secondary">
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
