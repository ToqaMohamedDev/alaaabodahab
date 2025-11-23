"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { BookOpen, Video, FileText, ArrowLeft, GraduationCap, Award, Users, Play, Clock, TrendingUp, Star, CheckCircle, Sparkles, Lightbulb, Target, Layers, BarChart3, Heart, Users2, Youtube, Instagram, Facebook, MessageCircle, Music, BookText, PenTool, BookMarked, School, BookCheck } from "lucide-react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Category {
  id: string;
  name: string;
  videoCount?: number;
}

interface EducationalLevel {
  id: string;
  name: string;
  imageUrl?: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [educationalLevels, setEducationalLevels] = useState<EducationalLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    videosCount: 0,
    coursesCount: 0,
    testsCount: 0,
    activeStudents: 0,
  });

  useEffect(() => {
    fetchCategories();
    fetchStats();
    fetchEducationalLevels();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesQuery = query(collection(db, "categories"), orderBy("name"));
      const snapshot = await getDocs(categoriesQuery);
      const categoriesData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const categoryData = { id: doc.id, ...doc.data() } as Category;
          // حساب عدد الفيديوهات في كل تصنيف
          const videosQuery = query(
            collection(db, "videos"),
            where("category", "==", doc.id)
          );
          const videosSnapshot = await getDocs(videosQuery);
          categoryData.videoCount = videosSnapshot.size;
          return categoryData;
        })
      );
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationalLevels = async () => {
    try {
      const levelsSnapshot = await getDocs(collection(db, "educationalLevels"));
      const levelsData = levelsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EducationalLevel[];
      
      // ترتيب حسب createdAt أو updatedAt
      levelsData.sort((a, b) => {
        const aData = a as any;
        const bData = b as any;
        const aDate = aData.createdAt?.toMillis?.() || 
                     (aData.createdAt?.seconds ? aData.createdAt.seconds * 1000 : 0) ||
                     (aData.updatedAt?.toMillis?.() || 
                      (aData.updatedAt?.seconds ? aData.updatedAt.seconds * 1000 : 0) || 0);
        const bDate = bData.createdAt?.toMillis?.() || 
                     (bData.createdAt?.seconds ? bData.createdAt.seconds * 1000 : 0) ||
                     (bData.updatedAt?.toMillis?.() || 
                      (bData.updatedAt?.seconds ? bData.updatedAt.seconds * 1000 : 0) || 0);
        return bDate - aDate; // ترتيب تنازلي (الأحدث أولاً)
      });
      
      setEducationalLevels(levelsData);
    } catch (error) {
      console.error("Error fetching educational levels:", error);
    }
  };

  const fetchStats = async () => {
    try {
      // جلب عدد الفيديوهات
      let videosCount = 0;
      try {
        const videosSnapshot = await getDocs(collection(db, "videos"));
        videosCount = videosSnapshot.size;
        console.log("Videos count:", videosCount);
      } catch (error) {
        console.error("Error fetching videos count:", error);
      }

      // جلب عدد الكورسات
      let coursesCount = 0;
      try {
        const coursesSnapshot = await getDocs(collection(db, "courses"));
        coursesCount = coursesSnapshot.size;
        console.log("Courses count:", coursesCount, "Total docs:", coursesSnapshot.docs.length);
        // طباعة تفاصيل الكورسات للتحقق
        coursesSnapshot.docs.forEach((doc, index) => {
          console.log(`Course ${index + 1}:`, doc.id, doc.data());
        });
      } catch (error) {
        console.error("Error fetching courses count:", error);
      }

      // جلب عدد الاختبارات
      let testsCount = 0;
      try {
        const testsSnapshot = await getDocs(collection(db, "tests"));
        testsCount = testsSnapshot.size;
        console.log("Tests count:", testsCount);
      } catch (error) {
        console.error("Error fetching tests count:", error);
      }

      // جلب عدد الطلاب النشطين (من subscriptions)
      let activeStudents = 0;
      try {
        const subscriptionsSnapshot = await getDocs(collection(db, "subscriptions"));
        // حساب عدد المستخدمين الفريدين الذين لديهم اشتراكات صالحة
        const now = new Date();
        const uniqueUsers = new Set<string>();
        subscriptionsSnapshot.docs.forEach(doc => {
          const subscription = doc.data();
          if (subscription.endDate) {
            const endDate = subscription.endDate.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);
            if (endDate > now) {
              uniqueUsers.add(subscription.userId);
            }
          }
        });
        activeStudents = uniqueUsers.size;
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        // إذا فشل، نجرب جلب عدد المستخدمين من collection users
        try {
          const usersSnapshot = await getDocs(collection(db, "users"));
          activeStudents = usersSnapshot.size;
        } catch (err) {
          console.error("Error fetching users:", err);
        }
      }

      console.log("Stats fetched:", { videosCount, coursesCount, testsCount, activeStudents });
      
      // تحديث البيانات مع التأكد من القيم
      setStatsData({
        videosCount: videosCount || 0,
        coursesCount: coursesCount || 0,
        testsCount: testsCount || 0,
        activeStudents: activeStudents || 0,
      });
      
      console.log("Stats data updated:", { videosCount, coursesCount, testsCount, activeStudents });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const features = [
    {
      icon: Video,
      title: "فيديوهات تعليمية",
      description: "مجموعة واسعة من الفيديوهات التعليمية المخصصة للمرحلة الإعدادية والثانوية مع شرح واضح ومبسط",
      href: "/videos",
      color: "bg-blue-500",
      stats: "100+ فيديو",
    },
    {
      icon: BookOpen,
      title: "كورسات متخصصة",
      description: "كورسات شاملة تغطي جميع جوانب اللغة الإنجليزية من القواعد إلى المحادثة",
      href: "/videos",
      color: "bg-green-500",
      stats: "50+ كورس",
    },
    {
      icon: FileText,
      title: "اختبارات تفاعلية",
      description: "اختبر مستواك في اللغة الإنجليزية مع اختبارات تفاعلية شاملة مع نتائج فورية",
      href: "/tests",
      color: "bg-purple-500",
      stats: "30+ اختبار",
    },
  ];

  const stats = useMemo(() => [
    { 
      icon: Users, 
      value: statsData.activeStudents > 0 ? `${statsData.activeStudents}+` : "500+", 
      label: "طالب نشط", 
      color: "text-blue-600 dark:text-blue-400" 
    },
    { 
      icon: Video, 
      value: statsData.videosCount > 0 ? `${statsData.videosCount}+` : "100+", 
      label: "فيديو تعليمي", 
      color: "text-green-600 dark:text-green-400" 
    },
    { 
      icon: BookOpen, 
      value: statsData.coursesCount > 0 ? `${statsData.coursesCount}+` : "0", 
      label: "كورس متخصص", 
      color: "text-purple-600 dark:text-purple-400" 
    },
    { 
      icon: FileText, 
      value: statsData.testsCount > 0 ? `${statsData.testsCount}+` : "0", 
      label: "اختبار تفاعلي", 
      color: "text-yellow-600 dark:text-yellow-400" 
    },
  ], [statsData]);

  const benefits = [
    {
      icon: CheckCircle,
      title: "محتوى عالي الجودة",
      description: "جميع المحتويات تم إعدادها بعناية من قبل مدرس محترف",
    },
    {
      icon: Clock,
      title: "تعلم في أي وقت",
      description: "يمكنك الوصول للمحتوى في أي وقت يناسبك",
    },
    {
      icon: TrendingUp,
      title: "تتبع التقدم",
      description: "تابع تقدمك وإنجازاتك من خلال البروفايل الشخصي",
    },
    {
      icon: Star,
      title: "محتوى محدث",
      description: "نضيف محتوى جديد باستمرار لضمان أفضل تجربة تعليمية",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen overflow-x-hidden max-w-full w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 text-white py-24 md:py-32 lg:py-40 overflow-hidden min-h-[600px] md:min-h-[700px] lg:min-h-[800px]">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 left-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center md:text-right relative z-20"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-block mb-4"
              >
                <span className="bg-yellow-400 text-primary-900 px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 space-x-reverse w-fit mx-auto md:mx-0">
                  <Sparkles className="h-4 w-4" />
                  <span>منصة تعليمية متكاملة</span>
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
              >
                مرحباً بك في موقع
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-yellow-300"
              >
                علاء أبو الدهب
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                className="text-lg md:text-xl lg:text-2xl mb-8 text-gray-100 leading-relaxed"
              >
                مدرس لغة إنجليزية متخصص في تدريس المرحلة الإعدادية والثانوية مع سنوات من الخبرة في مجال التعليم.
                <br />
                <span className="text-yellow-200">أقدم محتوى تعليمي شامل ومتنوع لمساعدتك في إتقان اللغة الإنجليزية</span>
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
              >
                <Link href="/videos">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center space-x-2 space-x-reverse"
                  >
                    <Play className="h-5 w-5" fill="currentColor" />
                    <span>ابدأ التعلم الآن</span>
                  </motion.button>
                </Link>
                <Link href="/about">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-700 transition-all"
                  >
                    تعرف علينا أكثر
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Image Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex justify-center md:justify-start relative items-center"
            >
              <div className="relative w-full md:w-auto">
                {/* Image container - عند الطرف */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10 w-full md:w-auto"
                >
                  <div className="relative w-full md:w-[450px] lg:w-[550px] xl:w-[600px] h-[500px] md:h-[550px] lg:h-[600px] xl:h-[650px]">
                    {/* Decorative gradient background */}
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-blue-500/30 to-purple-500/30 blur-2xl"
                    />
                    
                    {/* Image container - الصورة بشكل طبيعي مع الرأس يظهر كامل */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* الحاوي الرئيسي - الصورة تظهر كاملة */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl md:rounded-r-[3rem] md:rounded-l-none shadow-2xl transform md:skew-x-3 md:-skew-y-1 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent" />
                        {/* الصورة - تظهر كاملة مع الرأس */}
                        <div className="relative w-full h-full">
                          <Image
                            src="/images/alaaabdahab.png"
                            priority
                            quality={90}
                            alt="علاء أبو الدهب"
                            width={500}
                            height={500}
                            className="w-full h-full object-cover object-top transform md:-skew-x-3 md:skew-y-1"
                            style={{ objectPosition: 'top center' }}
                          />
                        </div>
                      </div>
                      
                      {/* Decorative corner element */}
                      <motion.div
                        animate={{ rotate: [0, 5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-6 -right-6 w-32 h-32 bg-yellow-400/20 rounded-2xl blur-xl hidden md:block"
                      />
                      <motion.div
                        animate={{ rotate: [0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-6 -left-6 w-24 h-24 bg-blue-400/20 rounded-2xl blur-xl hidden md:block"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - منفصل تماماً عن الهيرو */}
      <section className="py-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              إحصائياتنا
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              أرقام تتحدث عن نفسها
            </p>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.05 }}
                  className="text-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-gray-900 transition-all duration-300"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block mb-6"
                  >
                    <div className={`p-4 rounded-full bg-gradient-to-br ${stat.color.includes('blue') ? 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30' : stat.color.includes('green') ? 'from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30' : stat.color.includes('purple') ? 'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30' : 'from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30'}`}>
                      <Icon className={`h-10 w-10 ${stat.color} mx-auto`} />
                    </div>
                  </motion.div>
                  <motion.h3
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: false }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    className="text-4xl md:text-5xl font-bold text-primary-700 dark:text-primary-400 mb-3"
                  >
                    {stat.value}
                  </motion.h3>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: false }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-block mb-4"
            >
              <BookOpen className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto" />
            </motion.div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              التصنيفات التعليمية
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              استكشف محتوى متنوع في مختلف التصنيفات
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-primary-200 dark:border-gray-600 card-hover cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                      {category.name}
                    </h3>
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Video className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {category.videoCount || 0} فيديو
                    </span>
                    <Link href={`/videos?category=${category.id}`}>
                      <motion.button
                        whileHover={{ x: -5 }}
                        className="flex items-center space-x-2 space-x-reverse text-primary-600 dark:text-primary-400 font-semibold"
                      >
                        <span>استكشف</span>
                        <ArrowLeft className="h-4 w-4" />
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && categories.length === 0 && (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-600 dark:text-gray-400">لا توجد تصنيفات متاحة حالياً</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              ما نقدمه لك
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              محتوى تعليمي متكامل لمساعدتك في إتقان اللغة الإنجليزية
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            className="grid md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -15, rotate: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 border border-gray-200 dark:border-gray-700 card-hover relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-transparent dark:from-primary-900/30 rounded-bl-full opacity-50" />
                  <div className={`${feature.color} w-16 h-16 rounded-lg flex items-center justify-center mb-6 shadow-lg relative z-10`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-primary-600 dark:text-primary-400 mb-4 font-semibold relative z-10">
                    {feature.stats}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 relative z-10">{feature.description}</p>
                  <Link href={feature.href}>
                    <motion.button
                      whileHover={{ scale: 1.05, x: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 space-x-reverse text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors relative z-10"
                    >
                      <span>اكتشف المزيد</span>
                      <ArrowLeft className="h-4 w-4" />
                    </motion.button>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Educational Methodology Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: false }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-block mb-4"
            >
              <GraduationCap className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto" />
            </motion.div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              مميزات المنهجية التعليمية
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              منهجية تعليمية متطورة لضمان أفضل تجربة تعليمية
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Lightbulb,
                title: "استخدام أحدث طرق التدريس التفاعلية",
                description: "نستخدم أحدث الأساليب والطرق التفاعلية في التدريس لضمان تفاعل أفضل مع المحتوى",
                color: "from-yellow-400 to-yellow-600",
                bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
              },
              {
                icon: Target,
                title: "ربط المحتوى بالواقع العملي",
                description: "نربط جميع الدروس والمحتوى بالواقع العملي لضمان الفهم والتطبيق الصحيح",
                color: "from-blue-400 to-blue-600",
                bgColor: "bg-blue-50 dark:bg-blue-900/20",
              },
              {
                icon: Layers,
                title: "توفير مواد تعليمية متنوعة",
                description: "فيديوهات تعليمية، اختبارات تفاعلية، وتمارين متنوعة لتناسب جميع أنماط التعلم",
                color: "from-green-400 to-green-600",
                bgColor: "bg-green-50 dark:bg-green-900/20",
              },
              {
                icon: BarChart3,
                title: "متابعة مستمرة لتقدم الطلاب",
                description: "نوفر نظام متابعة شامل لتتبع تقدمك وإنجازاتك في رحلتك التعليمية",
                color: "from-purple-400 to-purple-600",
                bgColor: "bg-purple-50 dark:bg-purple-900/20",
              },
              {
                icon: Heart,
                title: "بيئة تعليمية محفزة ومشجعة",
                description: "نوفر بيئة تعليمية إيجابية ومحفزة تشجعك على الاستمرار والتقدم",
                color: "from-pink-400 to-pink-600",
                bgColor: "bg-pink-50 dark:bg-pink-900/20",
              },
              {
                icon: Users2,
                title: "مراعاة الفروقات الفردية بين الطلاب",
                description: "نراعي الفروقات الفردية بين الطلاب ونوفر محتوى يناسب جميع المستويات",
                color: "from-indigo-400 to-indigo-600",
                bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={`${feature.bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700 card-hover relative overflow-hidden group`}
                >
                  {/* Background gradient effect */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-bl-full`} />
                  
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className="inline-block mb-4"
                    >
                      <div className={`bg-gradient-to-br ${feature.color} w-14 h-14 rounded-lg flex items-center justify-center shadow-lg`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Decorative corner */}
                  <div className={`absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr ${feature.color} opacity-5 rounded-tr-full`} />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              لماذا تختارنا؟
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              مميزات تجعل تجربتك التعليمية أفضل
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block mb-4"
                  >
                    <div className="bg-primary-100 dark:bg-primary-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                      <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: false }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-block mb-4"
            >
              <GraduationCap className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto" />
            </motion.div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              الكورسات المتخصصة
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              كورسات شاملة ومتكاملة لتعلم اللغة الإنجليزية باحترافية
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* كورس جرامر */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 dark:bg-blue-700/20 rounded-bl-full blur-2xl group-hover:bg-blue-300/30 transition-colors" />
              
              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block mb-6"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg">
                    <BookText className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  كورس جرامر
                </h3>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  كورس شامل ومتكامل لتعلم قواعد اللغة الإنجليزية من الصفر إلى الاحتراف. يتضمن شرحاً مفصلاً لجميع القواعد الأساسية والمتقدمة.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">شرح مفصل لجميع قواعد اللغة الإنجليزية</span>
                  </div>
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">أمثلة عملية وتطبيقات متنوعة</span>
                  </div>
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">تمارين تفاعلية لتعزيز الفهم</span>
                  </div>
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">مناسب للمبتدئين والمتقدمين</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse text-blue-600 dark:text-blue-400 font-semibold">
                  <Clock className="h-5 w-5" />
                  <span>مدة الكورس: 40+ ساعة</span>
                </div>
              </div>
            </motion.div>

            {/* كورس القصة */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 dark:bg-purple-700/20 rounded-bl-full blur-2xl group-hover:bg-purple-300/30 transition-colors" />
              
              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block mb-6"
                >
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg">
                    <BookMarked className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  كورس القصة
                </h3>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  كورس متخصص في تحليل وفهم القصص الإنجليزية. يساعدك على تطوير مهارات القراءة والفهم من خلال قصص متنوعة ومشوقة.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">تحليل قصص إنجليزية متنوعة ومشوقة</span>
                  </div>
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">تطوير مهارات القراءة والفهم</span>
                  </div>
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">شرح المفردات والتعبيرات المستخدمة</span>
                  </div>
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">تمارين على الفهم والتحليل</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse text-purple-600 dark:text-purple-400 font-semibold">
                  <Clock className="h-5 w-5" />
                  <span>مدة الكورس: 30+ ساعة</span>
                </div>
              </div>
            </motion.div>

            {/* كورس حل الأسئلة */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-8 border border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 dark:bg-green-700/20 rounded-bl-full blur-2xl group-hover:bg-green-300/30 transition-colors" />
              
              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block mb-6"
                >
                  <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg">
                    <PenTool className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  كورس حل الأسئلة
                </h3>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  كورس عملي يركز على حل الأسئلة والتمارين المختلفة. يساعدك على إتقان فن حل الأسئلة بطرق صحيحة وفعالة.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">حل أسئلة متنوعة من امتحانات سابقة</span>
                  </div>
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">شرح استراتيجيات حل الأسئلة</span>
                  </div>
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">تمارين تطبيقية على كل نوع من الأسئلة</span>
                  </div>
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">نصائح وحيل لتحسين الأداء في الامتحانات</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse text-green-600 dark:text-green-400 font-semibold">
                  <Clock className="h-5 w-5" />
                  <span>مدة الكورس: 35+ ساعة</span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link href="/videos">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all duration-300 flex items-center space-x-2 space-x-reverse mx-auto w-fit"
              >
                <span>استكشف جميع الكورسات</span>
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Educational Levels Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: false }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-block mb-4"
            >
              <School className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto" />
            </motion.div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              المراحل التعليمية
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              محتوى تعليمي مخصص للمرحلة الإعدادية والثانوية
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* المرحلة الإعدادية */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-orange-200 dark:border-orange-800 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
            >
              {/* Background Gradient */}
              <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700" />
              
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-40 h-40 bg-orange-100/30 dark:bg-orange-900/20 rounded-full blur-3xl group-hover:bg-orange-200/40 transition-colors" />
              
              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block mb-6"
                >
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookCheck className="h-10 w-10 text-white" />
                  </div>
                </motion.div>
                
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  المرحلة الإعدادية
                </h3>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed text-lg">
                  محتوى تعليمي شامل ومتكامل مصمم خصيصاً لطلاب المرحلة الإعدادية. يساعد الطلاب على بناء أساس قوي في اللغة الإنجليزية.
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg mt-0.5">
                      <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">قواعد اللغة الأساسية</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">شرح مبسط للقواعد الأساسية مع أمثلة واضحة</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg mt-0.5">
                      <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">المفردات والتعبيرات</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">تعلم مفردات مهمة وتعبيرات شائعة الاستخدام</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg mt-0.5">
                      <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">مهارات القراءة والكتابة</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">تطوير مهارات القراءة والكتابة بشكل تدريجي</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg mt-0.5">
                      <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">تمارين تفاعلية</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">تمارين متنوعة لتعزيز الفهم والتطبيق</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 space-x-reverse text-orange-600 dark:text-orange-400">
                    <Video className="h-5 w-5" />
                    <span className="font-semibold">فيديوهات تعليمية</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-orange-600 dark:text-orange-400">
                    <FileText className="h-5 w-5" />
                    <span className="font-semibold">اختبارات</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* المرحلة الثانوية */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-indigo-200 dark:border-indigo-800 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
            >
              {/* Background Gradient */}
              <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700" />
              
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-100/30 dark:bg-indigo-900/20 rounded-full blur-3xl group-hover:bg-indigo-200/40 transition-colors" />
              
              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block mb-6"
                >
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="h-10 w-10 text-white" />
                  </div>
                </motion.div>
                
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  المرحلة الثانوية
                </h3>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed text-lg">
                  محتوى متقدم ومتخصص لطلاب المرحلة الثانوية. يركز على التحضير للامتحانات النهائية والجامعة مع تعميق الفهم.
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mt-0.5">
                      <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">قواعد متقدمة</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">شرح متعمق للقواعد المتقدمة والمعقدة</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mt-0.5">
                      <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">تحليل النصوص</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">تعلم تحليل النصوص الأدبية والعلمية</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mt-0.5">
                      <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">التحضير للامتحانات</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">تدريبات شاملة على نماذج الامتحانات</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mt-0.5">
                      <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">مهارات متقدمة</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">تطوير مهارات الكتابة الأكاديمية والتحليلية</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 space-x-reverse text-indigo-600 dark:text-indigo-400">
                    <Video className="h-5 w-5" />
                    <span className="font-semibold">فيديوهات متقدمة</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-indigo-600 dark:text-indigo-400">
                    <FileText className="h-5 w-5" />
                    <span className="font-semibold">اختبارات شاملة</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link href="/videos">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all duration-300 flex items-center space-x-2 space-x-reverse mx-auto w-fit"
              >
                <span>استكشف المحتوى التعليمي</span>
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: false }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-block mb-4"
            >
              <Users className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto" />
            </motion.div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              تابعنا على وسائل التواصل الاجتماعي
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              انضم إلى مجتمعنا التعليمي وكن على اطلاع بآخر المستجدات
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            className="flex flex-wrap justify-center gap-6"
          >
            {[
              {
                name: "Facebook",
                icon: Facebook,
                href: "https://www.facebook.com/share/1J3UsXXjNy/?mibextid=wwXIf",
                color: "from-blue-500 to-blue-600",
                hoverColor: "hover:from-blue-600 hover:to-blue-700",
                bgColor: "bg-blue-50 dark:bg-blue-900/20",
                textColor: "text-blue-600 dark:text-blue-400",
              },
              {
                name: "YouTube",
                icon: Youtube,
                href: "https://www.youtube.com/@AlaaAboElDahab",
                color: "from-red-500 to-red-600",
                hoverColor: "hover:from-red-600 hover:to-red-700",
                bgColor: "bg-red-50 dark:bg-red-900/20",
                textColor: "text-red-600 dark:text-red-400",
              },
              {
                name: "Instagram",
                icon: Instagram,
                href: "https://www.instagram.com/alaaabodahab?igsh=MTJlY3FtOW8yNndh",
                color: "from-pink-500 to-purple-600",
                hoverColor: "hover:from-pink-600 hover:to-purple-700",
                bgColor: "bg-pink-50 dark:bg-pink-900/20",
                textColor: "text-pink-600 dark:text-pink-400",
              },
              {
                name: "WhatsApp",
                icon: MessageCircle,
                href: "https://wa.me/201152513088",
                color: "from-green-500 to-green-600",
                hoverColor: "hover:from-green-600 hover:to-green-700",
                bgColor: "bg-green-50 dark:bg-green-900/20",
                textColor: "text-green-600 dark:text-green-400",
              },
              {
                name: "TikTok",
                icon: Music,
                href: "#", // سيتم تحديثه لاحقاً
                color: "from-gray-800 to-black",
                hoverColor: "hover:from-gray-900 hover:to-black",
                bgColor: "bg-gray-50 dark:bg-gray-800",
                textColor: "text-gray-800 dark:text-gray-200",
              },
            ].map((social, index) => {
              const Icon = social.icon;
              return (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${social.bgColor} ${social.textColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700 card-hover relative overflow-hidden group min-w-[140px]`}
                >
                  {/* Background gradient effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${social.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative z-10 text-center">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.5 }}
                      className="inline-block mb-3"
                    >
                      <div className={`bg-gradient-to-br ${social.color} w-16 h-16 rounded-full flex items-center justify-center shadow-lg mx-auto`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </motion.div>
                    <h3 className="font-bold text-lg mb-1">{social.name}</h3>
                    <p className="text-sm opacity-75">تابعنا</p>
                  </div>
                  
                  {/* Shine effect */}
                  <motion.div
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                </motion.a>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 lg:gap-20 items-start">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false }}
                transition={{ delay: 0.2 }}
                className="inline-block mb-4"
              >
                <span className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  عن المدرس
                </span>
              </motion.div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                مرحباً، أنا علاء أبو الدهب
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                مدرس لغة إنجليزية متخصص في تدريس المرحلة الإعدادية والثانوية مع سنوات من الخبرة في مجال التعليم.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                أقدم محتوى تعليمي شامل ومتنوع يشمل فيديوهات تعليمية، كورسات متخصصة، واختبارات تفاعلية لمساعدتك في إتقان اللغة الإنجليزية.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                هدفي هو جعل تعلم اللغة الإنجليزية ممتعاً وسهلاً لجميع الطلاب، بغض النظر عن مستواهم الحالي.
              </p>
              <Link href="/about">
                <motion.button
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary-600 dark:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center space-x-2 space-x-reverse shadow-lg"
                >
                  <span>اقرأ المزيد</span>
                  <ArrowLeft className="h-4 w-4" />
                </motion.button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 p-8 border border-gray-200 dark:border-gray-700"
              >
                <div className="aspect-square rounded-xl overflow-hidden">
                  <Image
                    src="/images/photo_2025-11-23 07.19.31.jpeg"
                    alt="علاء أبو الدهب"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    quality={85}
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
