"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';
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
}

interface ModuleProgress {
  module_id: string;
  status: string;
}

interface Enrollment {
  id: string;
  status: string;
  progress_pct: number;
  module_progress?: ModuleProgress[];
}

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
          const enrollments = await apiClient.getEnrollments(organization.id, user?.id);
          const userEnrollment = enrollments.find((e: any) => e.course_id === courseId);

          if (userEnrollment) {
            // Fetch detailed progress
            const progress = await apiClient.getProgress(organization.id, userEnrollment.id);
            setEnrollment({ ...userEnrollment, module_progress: progress.module_progress });
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
    if (!organization) return;

    setIsEnrolling(true);
    try {
      const newEnrollment = await apiClient.enrollInCourse(organization.id, courseId);
      setEnrollment(newEnrollment);
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
        await apiClient.updateProgress(
          organization.id,
          enrollment.id,
          module.id,
          'in_progress'
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
                  <CardDescription className="text-base">
                    {course.description}
                  </CardDescription>
                </div>
                <div className="ml-4">
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
                          className={`
                            transition-all cursor-pointer
                            ${isLocked ? 'opacity-60' : 'hover:shadow-lg'}
                            ${isInProgress ? 'border-blue-500 border-2' : ''}
                            ${isCompleted ? 'border-green-500' : ''}
                          `}
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
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                  ) : (
                                    <Icon className={`h-6 w-6 ${isInProgress ? 'text-blue-600' : 'text-gray-600'}`} />
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
                                  <span className="text-sm text-gray-500">Verrouillé</span>
                                ) : isCompleted ? (
                                  <CheckCircle className="h-6 w-6 text-green-600" />
                                ) : isInProgress ? (
                                  <Play className="h-6 w-6 text-blue-600" />
                                ) : (
                                  <Button size="sm" variant="outline">
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
