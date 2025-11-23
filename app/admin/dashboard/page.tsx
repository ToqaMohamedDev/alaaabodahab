"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  Users, 
  MessageSquare, 
  BookOpen, 
  Video, 
  FileText, 
  TrendingUp,
  Calendar,
  Mail,
  Award,
  BarChart3,
  Shield,
  CreditCard,
  GraduationCap,
  Tag,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalMessages: number;
  totalTests: number;
  totalVideos: number;
  totalCourses: number;
  unreadMessages: number;
}

interface RecentMessage {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  message: string;
  createdAt: Timestamp | null;
  read: boolean;
}

export default function AdminDashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalMessages: 0,
    totalTests: 0,
    totalVideos: 0,
    totalCourses: 0,
    unreadMessages: 0,
  });
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      checkAdminStatus();
    }
  }, [user, loading]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const roleDoc = await getDoc(doc(db, "roles", user.uid));
      const adminStatus = roleDoc.exists() && roleDoc.data()?.role === "admin";
      
      setIsAdmin(adminStatus);
      
      if (!adminStatus) {
        // إذا لم يكن أدمن، نعيد توجيهه للصفحة الرئيسية
        router.push("/");
        return;
      }

      // إذا كان أدمن، نجلب البيانات
      fetchDashboardData();
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      router.push("/");
    } finally {
      setCheckingAdmin(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);

      // جلب عدد المستخدمين
      let totalUsers = 0;
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        totalUsers = usersSnapshot.size;
      } catch (error: any) {
        console.error("Error fetching users:", error);
      }

      // جلب الرسائل
      let totalMessages = 0;
      let unreadMessages = 0;
      let recentMessagesData: RecentMessage[] = [];
      try {
        // محاولة جلب الرسائل مع الترتيب
        let messagesSnapshot;
        try {
          messagesSnapshot = await getDocs(
            query(collection(db, "messages"), orderBy("createdAt", "desc"))
          );
        } catch (error: any) {
          // إذا فشل بسبب index، نجلب بدون ترتيب
          if (error.code === "failed-precondition" || error.message?.includes("index")) {
            messagesSnapshot = await getDocs(collection(db, "messages"));
          } else {
            throw error;
          }
        }
        
        // ترتيب الرسائل في JavaScript إذا لم يكن هناك ترتيب من Firestore
        const allMessages = messagesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as RecentMessage[];
        
        // ترتيب حسب التاريخ
        allMessages.sort((a, b) => {
          const aDate = a.createdAt?.toMillis?.() || 
                       (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
                       0;
          const bDate = b.createdAt?.toMillis?.() || 
                       (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
                       0;
          return bDate - aDate; // ترتيب تنازلي
        });
        
        totalMessages = allMessages.length;
        unreadMessages = allMessages.filter((msg) => !msg.read).length;
        recentMessagesData = allMessages.slice(0, 5);
      } catch (error: any) {
        console.error("Error fetching messages:", error);
      }

      // جلب الاختبارات
      let totalTests = 0;
      try {
        const testsSnapshot = await getDocs(collection(db, "tests"));
        totalTests = testsSnapshot.size;
      } catch (error: any) {
        console.error("Error fetching tests:", error);
      }

      // جلب الفيديوهات
      let totalVideos = 0;
      try {
        const videosSnapshot = await getDocs(collection(db, "videos"));
        totalVideos = videosSnapshot.size;
      } catch (error: any) {
        console.error("Error fetching videos:", error);
      }

      // جلب الكورسات
      let totalCourses = 0;
      try {
        const coursesSnapshot = await getDocs(collection(db, "courses"));
        totalCourses = coursesSnapshot.size;
      } catch (error: any) {
        console.error("Error fetching courses:", error);
      }

      setStats({
        totalUsers,
        totalMessages,
        totalTests,
        totalVideos,
        totalCourses,
        unreadMessages,
      });
      
      setRecentMessages(recentMessagesData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoadingData(false);
    }
  };


  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statCards = [
    {
      title: "المستخدمين",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      title: "الرسائل",
      value: stats.totalMessages,
      icon: MessageSquare,
      color: "bg-green-500",
      textColor: "text-green-600",
      badge: stats.unreadMessages > 0 ? stats.unreadMessages : undefined,
    },
    {
      title: "الاختبارات",
      value: stats.totalTests,
      icon: FileText,
      color: "bg-purple-500",
      textColor: "text-purple-600",
    },
    {
      title: "الفيديوهات",
      value: stats.totalVideos,
      icon: Video,
      color: "bg-red-500",
      textColor: "text-red-600",
    },
    {
      title: "الكورسات",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-2 space-x-reverse">
                <Shield className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                <span>لوحة التحكم</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                إدارة الموقع والمحتوى
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                  {stat.badge && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {stat.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.title}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Messages Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 border border-gray-200 dark:border-gray-700 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 space-x-reverse">
              <Mail className="h-6 w-6" />
              <span>آخر الرسائل</span>
            </h2>
            <Link
              href="/admin/messages"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition"
            >
              عرض الكل
            </Link>
          </div>

          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : recentMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">لا توجد رسائل</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className={`border rounded-lg p-4 transition ${
                    !message.read
                      ? "border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {message.userName}
                        </h3>
                        {!message.read && (
                          <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                            جديد
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {message.message}
                      </p>
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500 dark:text-gray-500">
                        <Mail className="h-3 w-3" />
                        <span>{message.userEmail}</span>
                        {message.createdAt && (
                          <>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>
                              {message.createdAt.toDate().toLocaleDateString("ar-EG", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Management Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2 space-x-reverse">
            <Settings className="h-6 w-6" />
            <span>صفحات الإدارة</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/videos">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-red-500 to-red-700 rounded-lg p-6 text-white cursor-pointer"
              >
                <Video className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">إدارة الفيديوهات</h3>
                <p className="text-red-100 text-sm">إضافة وتعديل وحذف الفيديوهات</p>
              </motion.div>
            </Link>

            <Link href="/admin/courses">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white cursor-pointer"
              >
                <BookOpen className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">إدارة الكورسات</h3>
                <p className="text-blue-100 text-sm">إضافة وتعديل وحذف الكورسات</p>
              </motion.div>
            </Link>

            <Link href="/admin/tests">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white cursor-pointer"
              >
                <FileText className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">إدارة الاختبارات</h3>
                <p className="text-purple-100 text-sm">إضافة وتعديل وحذف الاختبارات</p>
              </motion.div>
            </Link>

            <Link href="/admin/subscriptions">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white cursor-pointer"
              >
                <CreditCard className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">إدارة الاشتراكات</h3>
                <p className="text-green-100 text-sm">إدارة اشتراكات المستخدمين</p>
              </motion.div>
            </Link>

            <Link href="/admin/levels">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg p-6 text-white cursor-pointer"
              >
                <GraduationCap className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">إدارة المراحل</h3>
                <p className="text-yellow-100 text-sm">إدارة المراحل التعليمية</p>
              </motion.div>
            </Link>

            <Link href="/admin/categories">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg p-6 text-white cursor-pointer"
              >
                <Tag className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">إدارة التصنيفات</h3>
                <p className="text-indigo-100 text-sm">إدارة تصنيفات الفيديوهات والكورسات</p>
              </motion.div>
            </Link>

            <Link href="/admin/messages">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white cursor-pointer"
              >
                <MessageSquare className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">إدارة الرسائل</h3>
                <p className="text-green-100 text-sm">عرض وإدارة جميع الرسائل الواردة</p>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

