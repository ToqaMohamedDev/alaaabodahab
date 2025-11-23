"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { hasValidSubscription } from "@/lib/subscription";
import VideoPlayer from "@/components/VideoPlayer";
import { Play, Lock, ArrowLeft, AlertCircle, Loader2, BookOpen, Clock } from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  videoUrl?: string;
  hours?: number;
  createdAt?: any;
  updatedAt?: any;
}

interface PrivateSource {
  url: string;
}

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [user, loadingAuth] = useAuthState(auth);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [privateSource, setPrivateSource] = useState<PrivateSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        // الكورسات تحتاج تسجيل دخول حتى للبيانات العامة
        router.push(`/auth/login?redirect=/courses/${courseId}`);
        return;
      }
      fetchCourse();
    }
  }, [courseId, loadingAuth, user]);

  const fetchCourse = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // جلب البيانات العامة للكورس
      const courseRef = doc(db, "courses", courseId);
      const courseDoc = await getDoc(courseRef);

      if (!courseDoc.exists()) {
        setError("الكورس غير موجود");
        setLoading(false);
        return;
      }

      const courseData = {
        id: courseDoc.id,
        ...courseDoc.data(),
      } as Course;

      setCourse(courseData);

      // التحقق من الاشتراك وجلب الرابط الخاص
      if (courseData.level) {
        await checkAndFetchPrivateSource(user, courseData.level);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error fetching course:", error);
      if (error.code === "permission-denied") {
        setError("يجب تسجيل الدخول للوصول إلى هذا الكورس");
      } else {
        setError("حدث خطأ أثناء جلب بيانات الكورس");
      }
      setLoading(false);
    }
  };

  const checkAndFetchPrivateSource = async (currentUser: any, levelId: string) => {
    try {
      setCheckingSubscription(true);

      // التحقق من الاشتراك
      const isValid = await hasValidSubscription(currentUser, levelId);

      if (isValid) {
        // جلب الرابط الخاص
        try {
          const privateSourceRef = doc(db, "courses", courseId, "private", "source");
          const privateSourceDoc = await getDoc(privateSourceRef);

          if (privateSourceDoc.exists()) {
            const sourceData = privateSourceDoc.data() as PrivateSource;
            setPrivateSource(sourceData);
            setHasAccess(true);
          } else {
            setError("الرابط الخاص غير متاح");
          }
        } catch (privateError: any) {
          console.error("Error fetching private source:", privateError);
          if (privateError.code === "permission-denied") {
            setError("ليس لديك صلاحية للوصول إلى هذا الكورس");
          } else {
            setError("حدث خطأ أثناء جلب رابط الكورس");
          }
        }
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setHasAccess(false);
    } finally {
      setCheckingSubscription(false);
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    router.push(`/auth/login?redirect=/courses/${courseId}`);
  };

  if (loading || loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">خطأ</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link href="/videos">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              العودة إلى الكورسات
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="mb-6 flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>رجوع</span>
        </motion.button>

        {/* Course Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center space-x-2 space-x-reverse mb-4">
            <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {course.title}
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {course.description}
          </p>
          <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500 dark:text-gray-500">
            {course.hours && (
              <div className="flex items-center space-x-1 space-x-reverse">
                <Clock className="h-4 w-4" />
                <span>{course.hours} ساعة</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Video Player or Access Message */}
        {checkingSubscription ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">جاري التحقق من الاشتراك...</p>
          </div>
        ) : hasAccess && privateSource ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
          >
            <VideoPlayer
              videoUrl={privateSource.url}
              title={course.title}
              thumbnailUrl={course.thumbnailUrl || course.thumbnail}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="bg-primary-100 dark:bg-primary-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                هذا الكورس يتطلب اشتراك
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                يجب أن يكون لديك اشتراك صالح في المرحلة التعليمية المطلوبة للوصول إلى هذا الكورس
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 space-x-reverse"
                  >
                    <span>تواصل معنا للاشتراك</span>
                    <Play className="h-5 w-5" />
                  </motion.button>
                </Link>
                <Link href="/videos">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-8 py-3 rounded-lg font-semibold"
                  >
                    العودة إلى الكورسات
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

