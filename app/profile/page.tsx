"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { User, Mail, Award, BookOpen, TrendingUp, Edit, MessageSquare, Calendar, Copy, Check } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// Component for Test Result Item
function TestResultItem({ result, index }: { result: TestResult; index: number }) {
  const [testTitle, setTestTitle] = useState<string>("اختبار");
  
  useEffect(() => {
    const fetchTestTitle = async () => {
       try {
         const testDoc = await getDoc(doc(db, "tests", result.testId));
         if (testDoc.exists()) {
           setTestTitle(testDoc.data().title || "اختبار");
         }
       } catch (error) {
         console.error("Error fetching test title:", error);
       }
     };
     fetchTestTitle();
   }, [result.testId]);
  
  return (
    <Link href={`/tests/${result.testId}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-900/50 transition bg-white dark:bg-gray-800 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {testTitle}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {result.score} من {result.totalQuestions} صحيح
            </p>
            {result.createdAt && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {result.createdAt.toDate().toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {result.percentage}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">النسبة</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

interface UserData {
  name: string;
  email: string;
  photoURL?: string;
  phone?: string;
  birthDate?: string;
  level?: string;
  levelScore?: number;
  averageScore?: number;
  completedTests?: number;
  educationalLevel?: string;
}

interface Message {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | null;
}

interface TestResult {
  id: string;
  testId: string;
  score: number;
  percentage: number;
  totalQuestions: number;
  createdAt: any;
}

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const checkUserData = useCallback(async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // إذا لم يكن المستخدم موجوداً، نحتاج لجمع البيانات الإضافية
        router.push(`/auth/complete-profile?uid=${user.uid}`);
        return;
      }

      const userData = userDoc.data();
      // التحقق من وجود البيانات المطلوبة
      if (!userData.phone || !userData.birthDate) {
        router.push(`/auth/complete-profile?uid=${user.uid}`);
        return;
      }

      // إذا كانت البيانات مكتملة، نجلب البيانات
      // نبدأ بجلب نتائج الاختبارات أولاً لأنها تحدّث الإحصائيات
      await fetchTestResults();
      await fetchUserData();
      fetchMessages();
    } catch (error: any) {
      console.error("Error checking user data:", error);
      // إذا كان الخطأ بسبب عدم الاتصال، نعرض رسالة خطأ
      if (error.code === "unavailable" || error.message?.includes("offline")) {
        console.warn("Firestore offline - redirecting to complete profile");
        router.push(`/auth/complete-profile?uid=${user.uid}`);
      } else {
        console.error("Error checking user data:", error);
        // لأخطاء أخرى، نعيد توجيهه لتسجيل الدخول
        router.push("/auth/login");
      }
    }
  }, [user, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      checkUserData();
    }
  }, [user, loading, checkUserData, router]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
      } else {
        // إنشاء بيانات المستخدم إذا لم تكن موجودة
        setUserData({
          name: user.displayName || "مستخدم",
          email: user.email || "",
          photoURL: user.photoURL || undefined,
          averageScore: 0,
          completedTests: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchTestResults = async () => {
    if (!user) return;

    try {
      let snapshot;
      try {
        // محاولة الاستعلام مع الترتيب
        const resultsQuery = query(
          collection(db, "testResults"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        snapshot = await getDocs(resultsQuery);
      } catch (error: any) {
        // إذا فشل بسبب index، نجلب بدون ترتيب
        if (error.code === "failed-precondition" || error.message?.includes("index") || error.code === "unavailable") {
          console.warn("Firestore index missing, fetching without orderBy:", error.message);
          const resultsQuery = query(
            collection(db, "testResults"),
            where("userId", "==", user.uid)
          );
          snapshot = await getDocs(resultsQuery);
        } else {
          throw error;
        }
      }
      let results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TestResult[];
      
      // ترتيب حسب التاريخ إذا لم يكن هناك ترتيب من Firestore
      results.sort((a, b) => {
        const aDate = a.createdAt?.toMillis?.() || 
                     (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
                     0;
        const bDate = b.createdAt?.toMillis?.() || 
                     (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
                     0;
        return bDate - aDate; // ترتيب تنازلي
      });
      
      setTestResults(results);
      
      // حساب المعدل العام وعدد الاختبارات المكتملة
      let averageScore = 0;
      let completedTests = results.length;
      
      if (results.length > 0) {
        const totalPercentage = results.reduce((sum, result) => {
          // التأكد من أن percentage موجود وصحيح
          const percentage = result.percentage || 0;
          return sum + percentage;
        }, 0);
        averageScore = Math.round(totalPercentage / results.length);
      }
      
      // تحديث بيانات المستخدم في Firestore
      try {
        await updateDoc(doc(db, "users", user.uid), {
          averageScore,
          completedTests,
          updatedAt: Timestamp.now(),
        });
        
        // تحديث البيانات المحلية مباشرة
        setUserData((prev) => {
          const updatedData = {
            ...(prev || {}),
            averageScore,
            completedTests,
          } as UserData;
          return updatedData;
        });
      } catch (error) {
        console.error("Error updating user stats:", error);
        // حتى لو فشل التحديث في Firestore، نحدث البيانات المحلية
        setUserData((prev) => ({
          ...(prev || {}),
          averageScore,
          completedTests,
        } as UserData));
      }
    } catch (error) {
      console.error("Error fetching test results:", error);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const messagesQuery = query(
        collection(db, "messages"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(messagesQuery);
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(messagesData);
    } catch (error: any) {
      // إذا فشل الاستعلام بسبب عدم وجود userId، نجرب استعلام آخر
      if (error.code === "failed-precondition" || error.code === "unavailable") {
        try {
          const messagesQuery = query(
            collection(db, "messages"),
            where("userEmail", "==", user.email)
          );
          const snapshot = await getDocs(messagesQuery);
          const messagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Message[];
          
          // ترتيب الرسائل حسب التاريخ
          messagesData.sort((a, b) => {
            const aTime = a.createdAt?.toMillis() || 0;
            const bTime = b.createdAt?.toMillis() || 0;
            return bTime - aTime;
          });
          
          setMessages(messagesData);
        } catch (err) {
          console.error("Error fetching messages by email:", err);
        }
      } else {
        console.error("Error fetching messages:", error);
      }
    }
  };

  // دالة للحصول على لون عشوائي بناءً على الحرف الأول من الاسم
  const getAvatarColor = (name: string): string => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-cyan-500",
    ];
    const firstChar = name.charAt(0).toUpperCase();
    const charCode = firstChar.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // دالة للحصول على أول حرف من الاسم
  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  // دالة لتنسيق تاريخ الميلاد
  const formatBirthDate = (birthDate: string | undefined): string => {
    if (!birthDate) return "غير محدد";
    try {
      const date = new Date(birthDate);
      return date.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return birthDate;
    }
  };

  // دالة نسخ ID المستخدم
  const copyUserId = async () => {
    if (!user?.uid) return;
    
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };


  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const levelColors: { [key: string]: string } = {
    مبتدئ: "bg-green-100 text-green-800",
    "مبتدئ متقدم": "bg-blue-100 text-blue-800",
    متوسط: "bg-yellow-100 text-yellow-800",
    متقدم: "bg-orange-100 text-orange-800",
    ممتاز: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            الملف الشخصي
          </h1>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  {userData?.photoURL ? (
                    <>
                      <div className="relative w-32 h-32 mx-auto">
                        <Image
                          src={userData.photoURL}
                          alt={userData.name}
                          width={128}
                          height={128}
                          className="w-32 h-32 rounded-full object-cover border-4 border-primary-200 dark:border-primary-800"
                          onError={() => {
                            // إذا فشل تحميل الصورة، نعرض الحرف الأول
                            const fallback = document.querySelector(".avatar-fallback");
                            if (fallback) {
                              (fallback as HTMLElement).style.display = "flex";
                            }
                          }}
                        />
                        <div
                          className={`avatar-fallback absolute inset-0 w-32 h-32 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold border-4 border-primary-200 dark:border-primary-800 hidden ${getAvatarColor(userData?.name || "م")}`}
                        >
                          {getInitials(userData?.name || "م")}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div
                      className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold border-4 border-primary-200 dark:border-primary-800 ${getAvatarColor(userData?.name || "م")}`}
                    >
                      {getInitials(userData?.name || "م")}
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {userData?.name || "مستخدم"}
                </h2>
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 mb-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{userData?.email}</span>
                </div>
                {userData?.birthDate && (
                  <div className="flex items-center justify-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 mb-4">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{formatBirthDate(userData.birthDate)}</span>
                  </div>
                )}

                {/* User ID */}
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">معرف المستخدم</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white truncate">
                        {user?.uid || "غير متاح"}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={copyUserId}
                      className="mr-2 p-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition flex-shrink-0"
                      title="نسخ المعرف"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </motion.button>
                  </div>
                </div>

                {userData?.level && (
                  <div className="mb-4">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        levelColors[userData.level] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {userData.level}
                    </span>
                  </div>
                )}

              </div>
            </div>
          </motion.div>

          {/* Stats and Results */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2 space-y-8"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <Award className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {userData?.averageScore || 0}%
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">المعدل العام</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <BookOpen className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {userData?.completedTests || 0}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">الاختبارات المكتملة</p>
              </div>
            </div>

            {/* Messages Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 border border-gray-200 dark:border-gray-700 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 space-x-reverse">
                  <MessageSquare className="h-6 w-6" />
                  <span>الرسائل</span>
                </h3>
                <Link href="/messages">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition"
                  >
                    عرض الكل
                  </motion.button>
                </Link>
              </div>

              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">لا توجد رسائل</p>
                  <Link href="/contact">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-primary-600 dark:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition text-sm"
                    >
                      إرسال رسالة
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.slice(0, 3).map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-900/50 transition bg-gray-50 dark:bg-gray-900/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                            {message.userName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {message.message}
                          </p>
                          {message.createdAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {message.createdAt.toDate().toLocaleDateString("ar-EG", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {messages.length > 3 && (
                    <Link href="/messages">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full mt-4 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition"
                      >
                        عرض المزيد ({messages.length - 3} رسالة أخرى)
                      </motion.button>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Test Results */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2 space-x-reverse">
                <TrendingUp className="h-6 w-6" />
                <span>نتائج الاختبارات</span>
              </h3>

              {testResults.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">لم تقم بأي اختبارات بعد</p>
                  <Link href="/tests">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-primary-600 dark:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                    >
                      ابدأ الاختبار الآن
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <TestResultItem key={result.id} result={result} index={index} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

