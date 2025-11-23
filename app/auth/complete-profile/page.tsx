"use client";

import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { User, Phone, Calendar, Save } from "lucide-react";

function CompleteProfileForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const redirect = searchParams.get("redirect") || "/profile";

  useEffect(() => {
    const checkUser = async () => {
      if (!uid) {
        router.push("/auth/login");
        return;
      }

      try {
        const user = auth.currentUser;
        if (!user || user.uid !== uid) {
          router.push("/auth/login");
          return;
        }

        // التحقق من وجود البيانات
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setName(userData.name || user.displayName || "");
          setPhone(userData.phone || "");
          setBirthDate(userData.birthDate || "");
        } else {
          // إذا لم يكن موجوداً، نستخدم بيانات جوجل
          setName(user.displayName || "");
        }
      } catch (err) {
        console.error("Error checking user:", err);
        router.push("/auth/login");
      } finally {
        setChecking(false);
      }
    };

    checkUser();
  }, [uid, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // التحقق من الحقول المطلوبة
    if (!name || !phone || !birthDate) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      setLoading(false);
      return;
    }

    if (!uid) {
      setError("خطأ في التحقق من المستخدم");
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user || user.uid !== uid) {
        router.push("/auth/login");
        return;
      }

      // تحديث اسم المستخدم في Firebase Auth
      await updateProfile(user, {
        displayName: name,
      });

      // التحقق من وجود المستند
      const userDoc = await getDoc(doc(db, "users", uid));

      if (userDoc.exists()) {
        // تحديث البيانات الموجودة
        await setDoc(
          doc(db, "users", uid),
          {
            name: name,
            phone: phone,
            birthDate: birthDate,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        // إنشاء مستند جديد
        await setDoc(doc(db, "users", uid), {
          uid: uid,
          name: name,
          email: user.email,
          phone: phone,
          birthDate: birthDate,
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      router.push(redirect);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ البيانات");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 -mb-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">إكمال الملف الشخصي</h2>
          <p className="text-gray-600 dark:text-gray-400">يرجى إدخال بياناتك المطلوبة</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الاسم <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="أدخل اسمك"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              رقم التليفون <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="أدخل رقم التليفون"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تاريخ الميلاد <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-primary-600 dark:bg-primary-700 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <span>حفظ البيانات</span>
                <Save className="h-5 w-5" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      }
    >
      <CompleteProfileForm />
    </Suspense>
  );
}

