"use client";

import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { Video, BookOpen, Play, Filter, ArrowRight, GraduationCap, FolderOpen, ChevronLeft } from "lucide-react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface VideoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  views?: number;
  duration?: string;
}

interface EducationalLevel {
  id: string;
  name: string;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
}

function VideosPageContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const levelParam = searchParams.get("level");
  
  const [educationalLevels, setEducationalLevels] = useState<EducationalLevel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // تصنيفات الفيديوهات
  const [courseCategories, setCourseCategories] = useState<Category[]>([]); // تصنيفات الكورسات
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [courses, setCourses] = useState<VideoItem[]>([]);
  const [activeTab, setActiveTab] = useState<"videos" | "courses">("videos");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(levelParam);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEducationalLevels();
    fetchCategories();
    fetchCourseCategories();
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      fetchVideos();
      fetchCourses();
    }
  }, [selectedLevel, selectedCategory, activeTab]);

  // إعادة تعيين التصنيف عند تغيير الـ tab إذا لم يكن موجوداً في التصنيفات الجديدة
  useEffect(() => {
    if (selectedCategory && selectedLevel) {
      const currentCategories = activeTab === "videos" ? categories : courseCategories;
      const categoryExists = currentCategories.some(c => c.id === selectedCategory);
      if (!categoryExists) {
        setSelectedCategory(null);
      }
    }
  }, [activeTab, categories, courseCategories, selectedCategory, selectedLevel]);

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

  const fetchCategories = async () => {
    try {
      const categoriesQuery = query(collection(db, "categories"), orderBy("name"));
      const snapshot = await getDocs(categoriesQuery);
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchCourseCategories = async () => {
    try {
      const categoriesQuery = query(collection(db, "courseCategories"), orderBy("name"));
      const snapshot = await getDocs(categoriesQuery);
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCourseCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching course categories:", error);
    }
  };

  const fetchVideos = async () => {
    if (!selectedLevel) return;
    
    try {
      let videosQuery;
      if (selectedCategory) {
        videosQuery = query(
          collection(db, "videos"),
          where("level", "==", selectedLevel),
          where("category", "==", selectedCategory)
        );
      } else {
        videosQuery = query(
          collection(db, "videos"),
          where("level", "==", selectedLevel)
        );
      }
      const snapshot = await getDocs(videosQuery);
      let videosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as VideoItem[];
      
      // ترتيب البيانات في JavaScript حسب createdAt
      videosData.sort((a, b) => {
        const aDate = (a as any).createdAt?.toMillis?.() || 
                     ((a as any).createdAt?.seconds ? (a as any).createdAt.seconds * 1000 : 0) ||
                     0;
        const bDate = (b as any).createdAt?.toMillis?.() || 
                     ((b as any).createdAt?.seconds ? (b as any).createdAt.seconds * 1000 : 0) ||
                     0;
        return bDate - aDate; // ترتيب تنازلي (الأحدث أولاً)
      });
      
      setVideos(videosData);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  const fetchCourses = async () => {
    if (!selectedLevel) return;
    
    try {
      let coursesQuery;
      if (selectedCategory) {
        coursesQuery = query(
          collection(db, "courses"),
          where("level", "==", selectedLevel),
          where("category", "==", selectedCategory)
        );
      } else {
        coursesQuery = query(
          collection(db, "courses"),
          where("level", "==", selectedLevel)
        );
      }
      const snapshot = await getDocs(coursesQuery);
      let coursesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as VideoItem[];
      
      // ترتيب البيانات في JavaScript حسب createdAt
      coursesData.sort((a, b) => {
        const aDate = (a as any).createdAt?.toMillis?.() || 
                     ((a as any).createdAt?.seconds ? (a as any).createdAt.seconds * 1000 : 0) ||
                     0;
        const bDate = (b as any).createdAt?.toMillis?.() || 
                     ((b as any).createdAt?.seconds ? (b as any).createdAt.seconds * 1000 : 0) ||
                     0;
        return bDate - aDate; // ترتيب تنازلي (الأحدث أولاً)
      });
      
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
    } else if (selectedLevel) {
      setSelectedLevel(null);
    }
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
              اختر المرحلة التعليمية لاستعراض المحتوى المتاح
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
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 border border-gray-200 dark:border-gray-700 card-hover cursor-pointer group"
                >
                  <div className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="mb-4 relative w-full h-48 mx-auto rounded-xl overflow-hidden shadow-lg"
                    >
                      {level.imageUrl ? (
                        <Image
                          src={level.imageUrl}
                          alt={level.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <GraduationCap className="h-20 w-20 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                    </motion.div>
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

  // Step 2: Select Category
  if (!selectedCategory) {
    // تحديد التصنيفات المناسبة حسب الـ tab النشط
    const currentCategories = activeTab === "videos" ? categories : courseCategories;
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleBack}
            className="mb-8 flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>رجوع</span>
          </motion.button>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-1 inline-flex border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setActiveTab("videos");
                  setSelectedCategory(null);
                }}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "videos"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              >
                <Video className="h-5 w-5 inline ml-2" />
                الفيديوهات
              </button>
              <button
                onClick={() => {
                  setActiveTab("courses");
                  setSelectedCategory(null);
                }}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "courses"
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                }`}
              >
                <BookOpen className="h-5 w-5 inline ml-2" />
                الكورسات
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              اختر التصنيف
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {educationalLevels.find(l => l.id === selectedLevel)?.name} - {activeTab === "videos" ? "الفيديوهات" : "الكورسات"}
            </p>
          </motion.div>

          {currentCategories.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-600 dark:text-gray-400">
                لا توجد تصنيفات متاحة حالياً
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  onClick={() => handleCategorySelect(category.id)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 border border-gray-200 dark:border-gray-700 card-hover cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {category.name}
                    </h3>
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <FolderOpen className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      اضغط للاستمرار
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Show Videos/Courses
  // تحديد نوع المحتوى بناءً على التصنيف المختار
  const isVideoCategory = categories.some(c => c.id === selectedCategory);
  const contentType = isVideoCategory ? "videos" : "courses";
  const filteredItems = contentType === "videos" ? videos : courses;
  const selectedLevelName = educationalLevels.find(l => l.id === selectedLevel)?.name;
  // استخدام التصنيفات المناسبة حسب نوع المحتوى
  const selectedCategoryName = isVideoCategory
    ? categories.find(c => c.id === selectedCategory)?.name
    : courseCategories.find(c => c.id === selectedCategory)?.name;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400"
        >
          <button onClick={() => setSelectedLevel(null)} className="hover:text-primary-600 dark:hover:text-primary-400">
            المراحل التعليمية
          </button>
          <span>/</span>
          <button onClick={() => setSelectedCategory(null)} className="hover:text-primary-600 dark:hover:text-primary-400">
            {selectedLevelName}
          </button>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{selectedCategoryName}</span>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {contentType === "videos" ? "الفيديوهات" : "الكورسات"}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {selectedLevelName} - {selectedCategoryName}
          </p>
        </motion.div>

        {/* Content Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            {contentType === "videos" ? (
              <Video className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            ) : (
              <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            )}
            <p className="text-xl text-gray-600 dark:text-gray-400">
              لا توجد {contentType === "videos" ? "فيديوهات" : "كورسات"} متاحة حالياً
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <Link key={item.id} href={contentType === "videos" ? `/videos/${item.id}` : `/courses/${item.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 overflow-hidden hover:shadow-2xl dark:hover:shadow-gray-900 transition border border-gray-200 dark:border-gray-700 card-hover cursor-pointer"
                >
                <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                  {item.thumbnailUrl ? (
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
                      {contentType === "videos" ? (
                        <Video className="h-16 w-16 text-white" />
                      ) : (
                        <BookOpen className="h-16 w-16 text-white" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition flex items-center justify-center cursor-pointer pointer-events-none">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-white rounded-full p-4 opacity-0 hover:opacity-100 transition pointer-events-auto"
                    >
                      <Play className="h-8 w-8 text-primary-600" fill="currentColor" />
                    </motion.div>
                  </div>
                  {item.duration && (
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                      {item.duration}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {item.views !== undefined && (
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        {item.views} مشاهدة
                      </span>
                    )}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 space-x-reverse text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-pointer"
                    >
                      <span>{contentType === "videos" ? "شاهد الآن" : "ابدأ الكورس"}</span>
                      <Play className="h-4 w-4" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    }>
      <VideosPageContent />
    </Suspense>
  );
}
