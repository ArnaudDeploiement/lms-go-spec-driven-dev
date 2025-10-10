"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';
import { ArrowLeft, CheckCircle, ChevronRight, FileText, Video, Download } from 'lucide-react';

interface ModuleDetail {
  id: string;
  title: string;
  module_type: string;
  content_id?: string | null;
  position: number;
  duration_seconds: number;
  data: Record<string, any> | null;
}

interface ContentDetail {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
}

export default function ModuleViewPage() {
  const router = useRouter();
  const params = useParams();
  const { organization } = useAuth();
  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const courseId = params.id as string;
  const moduleId = params.moduleId as string;

  useEffect(() => {
    const fetchModule = async () => {
      if (!organization) return;

      try {
        // Fetch all modules for the course
        const modules = await apiClient.listModules(organization.id, courseId);
        const foundModule = modules.find((m: ModuleDetail) => m.id === moduleId);

        if (!foundModule) {
          throw new Error('Module not found');
        }

        setModule(foundModule);

        // If module has content, fetch content details and download URL
        if (foundModule.content_id) {
          const contentDetail = await apiClient.getContent(organization.id, foundModule.content_id);
          setContent(contentDetail);

          // Get download URL for viewing
          const downloadLink = await apiClient.getDownloadLink(organization.id, foundModule.content_id);
          setContentUrl(downloadLink.download_url);
        }
      } catch (error) {
        console.error('Error fetching module:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModule();
  }, [organization, courseId, moduleId]);

  const handleComplete = async () => {
    if (!organization) return;

    setIsCompleting(true);
    try {
      // Find the enrollment for this course
      const enrollments = await apiClient.getEnrollments(organization.id, { course_id: courseId });
      if (enrollments.length > 0) {
        const enrollment = enrollments[0];
        await apiClient.completeModule(organization.id, enrollment.id, moduleId);

        // Redirect back to course
        router.push(`/learn/course/${courseId}`);
      }
    } catch (error) {
      console.error('Error completing module:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="vercel-spinner" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Module non trouvé</p>
          <button
            onClick={() => router.push(`/learn/course/${courseId}`)}
            className="vercel-btn-secondary"
          >
            Retour au cours
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!content || !contentUrl) {
      return (
        <div className="vercel-card text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Aucun contenu disponible pour ce module</p>
        </div>
      );
    }

    // Video content
    if (content.mime_type.startsWith('video/')) {
      return (
        <div className="vercel-card p-0 overflow-hidden">
          <video
            controls
            className="w-full"
            src={contentUrl}
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        </div>
      );
    }

    // PDF content
    if (content.mime_type === 'application/pdf') {
      return (
        <div className="vercel-card p-0 overflow-hidden" style={{ height: '600px' }}>
          <iframe
            src={contentUrl}
            className="w-full h-full"
            title={content.name}
          />
        </div>
      );
    }

    // Audio content
    if (content.mime_type.startsWith('audio/')) {
      return (
        <div className="vercel-card">
          <div className="flex items-center justify-center py-8">
            <audio controls className="w-full max-w-2xl">
              <source src={contentUrl} type={content.mime_type} />
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        </div>
      );
    }

    // Generic download for other file types
    return (
      <div className="vercel-card text-center py-12">
        <Download className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-700 font-medium mb-2">{content.name}</p>
        <p className="text-sm text-gray-500 mb-6">
          {(content.size_bytes / 1024 / 1024).toFixed(2)} MB
        </p>
        <a
          href={contentUrl}
          download={content.name}
          className="vercel-btn-primary"
        >
          <Download className="h-4 w-4" />
          Télécharger
        </a>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="vercel-nav sticky top-0 z-10">
        <div className="vercel-container py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/learn/course/${courseId}`)}
              className="vercel-btn-ghost vercel-btn-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au cours
            </button>

            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="vercel-btn-primary vercel-btn-sm"
            >
              {isCompleting ? (
                <div className="flex items-center gap-2">
                  <div className="vercel-spinner" />
                  <span>Validation...</span>
                </div>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Marquer comme terminé</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="vercel-container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          {/* Module Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {module.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                {module.module_type === 'video' && <Video className="h-4 w-4" />}
                {module.module_type === 'pdf' && <FileText className="h-4 w-4" />}
                <span className="capitalize">{module.module_type}</span>
              </span>
              {module.duration_seconds > 0 && (
                <span>
                  {Math.floor(module.duration_seconds / 60)} min
                </span>
              )}
            </div>
          </div>

          {/* Content Area */}
          {renderContent()}

          {/* Additional Info */}
          {module.data && Object.keys(module.data).length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 vercel-card"
            >
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Informations complémentaires
              </h2>
              <div className="prose prose-sm max-w-none text-gray-600">
                {JSON.stringify(module.data, null, 2)}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
