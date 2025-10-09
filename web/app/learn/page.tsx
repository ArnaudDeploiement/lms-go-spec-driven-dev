"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, LogOut, Clock, CheckCircle } from 'lucide-react';

export default function LearnPage() {
  const router = useRouter();
  const { user, organization, isAuthenticated, logout } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    const fetchData = async () => {
      if (!organization) return;

      try {
        const [coursesData, enrollmentsData] = await Promise.all([
          apiClient.getCourses(organization.id),
          apiClient.getEnrollments(organization.id, user?.id),
        ]);

        setCourses(coursesData || []);
        setEnrollments(enrollmentsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, organization, user, router]);

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">LMS Go</h1>
            {organization && (
              <p className="text-sm text-gray-600">{organization.name}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">
            Bienvenue, {user?.email?.split('@')[0]} 👋
          </h2>
          <p className="text-gray-600">
            Découvrez vos parcours de formation et progressez à votre rythme
          </p>
        </motion.div>

        {/* My Enrollments */}
        {enrollments.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <h3 className="text-2xl font-bold mb-4">Mes formations en cours</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enrollment, index) => (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/learn/course/${enrollment.course_id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        {enrollment.course?.title || 'Formation'}
                      </CardTitle>
                      <CardDescription>
                        {enrollment.course?.description || 'En cours'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          {enrollment.progress_pct || 0}% complété
                        </span>
                        {enrollment.status === 'completed' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${enrollment.progress_pct || 0}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Available Courses */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold mb-4">Catalogue de formations</h3>
          {courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-600 text-center">
                  Aucune formation disponible pour le moment.
                  <br />
                  Contactez votre administrateur pour plus d'informations.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/learn/course/${course.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-purple-600" />
                        {course.title}
                      </CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {course.status === 'published' ? 'Disponible' : 'Brouillon'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
