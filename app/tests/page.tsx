"use client";

import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { FileText, Clock, Play, Award, CheckCircle, GraduationCap, ChevronLeft, ArrowRight } from "lucide-react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Test {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  questions: number;
}

interface EducationalLevel {
  id: string;
  name: string;
  imageUrl?: string;
}

function TestsPageContent() {
  const searchParams = useSearchParams();
  const levelParam = searchParams.get("level");
  
  const [educationalLevels, setEducationalLevels] = useState<EducationalLevel[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(levelParam);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEducationalLevels();
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      fetchTests();
    }
  }, [selectedLevel]);

  const fetchEducationalLevels = async () => {
    try {
      // محاولة الترتيب حسب createdAt أولاً
      let levelsQuery;
      try {
        levelsQuery = query(collection(db, "educationalLevels"), orderBy("createdAt", "desc"));
      } catch (error) {
        // إذا فشل (مثل عدم وجود index)، نستخدم الترتيب حسب الاسم
        levelsQuery = query(collection(db, "educationalLevels"), orderBy("name"));
      }
      
      const snapshot = await getDocs(levelsQuery);
      let levelsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EducationalLevel[];
      
      // إذا لم يكن هناك createdAt، نرتب في JavaScript حسب createdAt أو updatedAt
      if (levelsData.some(level => !(level as any).createdAt)) {
        levelsData.sort((a, b) => {
          const aDate = (a as any).createdAt?.toMillis?.() || 
                       (a as any).updatedAt?.toMillis?.() || 
                       ((a as any).createdAt?.seconds ? (a as any).createdAt.seconds * 1000 : 0) ||
                       ((a as any).updatedAt?.seconds ? (a as any).updatedAt.seconds * 1000 : 0) ||
                       0;
          const bDate = (b as any).createdAt?.toMillis?.() || 
                       (b as any).updatedAt?.toMillis?.() || 
                       ((b as any).createdAt?.seconds ? (b as any).createdAt.seconds * 1000 : 0) ||
                       ((b as any).updatedAt?.seconds ? (b as any).updatedAt.seconds * 1000 : 0) ||
                       0;
          return bDate - aDate; // ترتيب تنازلي (الأحدث أولاً)
        });
      }
      
      setEducationalLevels(levelsData);
    } catch (error) {
      console.error("Error fetching educational levels:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    if (!selectedLevel) return;

    try {
      // استخدام where فقط بدون orderBy لتجنب الحاجة إلى index
      const testsQuery = query(
        collection(db, "tests"),
        where("level", "==", selectedLevel)
      );
      const snapshot = await getDocs(testsQuery);
      const testsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Test[];
      
      // ترتيب البيانات في JavaScript حسب createdAt
      testsData.sort((a, b) => {
        const aDate = (a as any).createdAt?.toMillis?.() || 0;
        const bDate = (b as any).createdAt?.toMillis?.() || 0;
        return bDate - aDate; // ترتيب تنازلي (الأحدث أولاً)
      });
      
      setTests(testsData);
    } catch (error) {
      console.error("Error fetching tests:", error);
    }
  };

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
  };

  const handleBack = () => {
    setSelectedLevel(null);
  };

  // Step 1: Select Educational Level
  if (!selectedLevel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              اختر المرحلة التعليمية
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              اختر المرحلة التعليمية لاستعراض الاختبارات المتاحة
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationalLevels.map((level, index) => (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  onClick={() => handleLevelSelect(level.id)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 overflow-hidden border border-gray-200 dark:border-gray-700 card-hover cursor-pointer group"
                >
                  {/* Image Section - Full Width Top */}
                  <div className="relative w-full h-48 overflow-hidden">
                    {level.imageUrl ? (
                      <Image
                        src={level.imageUrl}
                        alt={level.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="lazy"
                        quality={85}
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <GraduationCap className="h-20 w-20 text-primary-600 dark:text-primary-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-6 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {level.name}
                    </h3>
                    <div className="flex items-center justify-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                      <span>اضغط للاستمرار</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && educationalLevels.length === 0 && (
            <div className="text-center py-20">
              <GraduationCap className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-600 dark:text-gray-400">لا توجد مراحل تعليمية متاحة حالياً</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Show Tests
  const selectedLevelName = educationalLevels.find(l => l.id === selectedLevel)?.name;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>رجوع</span>
          </button>
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
            <button onClick={handleBack} className="hover:text-primary-600 dark:hover:text-primary-400">
              المراحل التعليمية
            </button>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">{selectedLevelName}</span>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            الاختبارات التفاعلية
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {selectedLevelName}
          </p>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-2xl p-8 mb-12 text-white"
        >
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">{tests.length}</div>
              <div className="text-gray-200 dark:text-gray-300">اختبار متاح</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">
                {tests.reduce((sum, test) => sum + test.questions, 0)}
              </div>
              <div className="text-gray-200 dark:text-gray-300">سؤال إجمالي</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">
                {tests.reduce((sum, test) => {
                  const duration = parseInt(test.duration) || 0;
                  return sum + duration;
                }, 0)}
              </div>
              <div className="text-gray-200 dark:text-gray-300">دقيقة إجمالية</div>
            </div>
          </div>
        </motion.div>

        {/* Tests Grid */}
        {tests.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">لا توجد اختبارات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tests.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 overflow-hidden hover:shadow-2xl dark:hover:shadow-gray-900 transition border border-gray-200 dark:border-gray-700 card-hover"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                      <FileText className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse text-yellow-500 dark:text-yellow-400">
                      <Award className="h-5 w-5" />
                      <span className="text-sm font-semibold">اختبار</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {test.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                    {test.description}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2 space-x-reverse text-gray-700 dark:text-gray-300">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{test.questions} سؤال</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-gray-700 dark:text-gray-300">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span>{test.duration}</span>
                    </div>
                  </div>

                  <Link href={`/tests/${test.id}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-primary-600 dark:bg-primary-700 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center justify-center space-x-2 space-x-reverse shadow-md"
                    >
                      <span>ابدأ الاختبار</span>
                      <Play className="h-5 w-5" />
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    }>
      <TestsPageContent />
    </Suspense>
  );
}
