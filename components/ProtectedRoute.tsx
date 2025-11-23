"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, loading] = useAuthState(auth);
  const [checkingData, setCheckingData] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      checkUserData();
    }
  }, [user, loading, router]);

  const checkUserData = async () => {
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

      // البيانات مكتملة
      setCheckingData(false);
    } catch (error: any) {
      console.error("Error checking user data:", error);
      // إذا كان الخطأ بسبب عدم الاتصال، نسمح بالوصول مؤقتاً
      if (error.code === "unavailable" || error.message?.includes("offline")) {
        console.warn("Firestore offline - allowing access temporarily");
        setCheckingData(false);
      } else {
        // لأخطاء أخرى، نعيد توجيهه لتسجيل الدخول
        router.push("/auth/login");
      }
    }
  };

  if (loading || checkingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

