"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { CreditCard, Plus, Edit, Trash2, X, Save, Calendar, User, Mail, Phone, Copy, Check } from "lucide-react";

interface EducationalLevel {
  id: string;
  name: string;
}

interface User {
  uid: string;
  name: string;
  email: string;
}

interface Subscription {
  id?: string;
  userId: string;
  adminId?: string;
  educationalLevelId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  startsAt: Timestamp;
  endsAt: Timestamp;
  createdAt?: any;
}

interface SubscriptionDisplay extends Subscription {
  userName?: string;
  levelName?: string;
}

export default function SubscriptionsManagement() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  const [subscriptions, setSubscriptions] = useState<SubscriptionDisplay[]>([]);
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState({
    userId: "",
    educationalLevelId: "",
    months: 1,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        router.push("/");
        return;
      }

      fetchData();
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      router.push("/");
    } finally {
      setCheckingAdmin(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoadingData(true);
      console.log("🔵 [fetchData] بدء جلب البيانات...");
      console.log("👤 [fetchData] المستخدم الحالي:", user?.uid, user?.email);

      const levelsSnapshot = await getDocs(collection(db, "educationalLevels"));
      const levelsData = levelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EducationalLevel));
      console.log("✅ [fetchData] المراحل التعليمية:", levelsData.length, "مرحلة");
      console.log("📋 [fetchData] بيانات المراحل:", levelsData);
      setLevels(levelsData);

      // لا نجلب قائمة المستخدمين - سنبحث عند الحاجة فقط
      console.log("ℹ️ [fetchData] تخطي جلب قائمة المستخدمين - سيتم البحث عند الحاجة");

      // جلب الاشتراكات بدون orderBy لتجنب الحاجة إلى index
      console.log("🔍 [fetchData] محاولة جلب الاشتراكات...");
      let subscriptionsSnapshot;
      try {
        subscriptionsSnapshot = await getDocs(collection(db, "subscriptions"));
        console.log("✅ [fetchData] الاشتراكات:", subscriptionsSnapshot.docs.length, "اشتراك");
        console.log("📋 [fetchData] وثائق الاشتراكات الخام:", subscriptionsSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
      } catch (subscriptionsError: any) {
        console.error("❌ [fetchData] خطأ في جلب الاشتراكات:", subscriptionsError);
        console.error("❌ [fetchData] تفاصيل خطأ الاشتراكات:", {
          message: subscriptionsError?.message,
          code: subscriptionsError?.code,
        });
        throw subscriptionsError;
      }
      
      const subscriptionsDataPromises = subscriptionsSnapshot.docs.map(async (subscriptionDoc, index) => {
        const data = subscriptionDoc.data() as Subscription;
        console.log(`\n🔍 [fetchData] معالجة اشتراك #${index + 1}:`);
        console.log("  📄 Document ID:", subscriptionDoc.id);
        console.log("  📊 Subscription Data:", data);
        console.log("  🔑 User ID من الاشتراك:", data.userId);
        console.log("  🔑 Educational Level ID:", data.educationalLevelId);
        
        // استخدام userName من البيانات المحفوظة مباشرة
        let userName = data.userName || "غير معروف";
        
        // إذا لم يكن userName موجوداً، نجلب بيانات المستخدم
        if (!data.userName && data.userId) {
          try {
            const userDocRef = doc(db, "users", data.userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userDocData = userDocSnap.data() as { name?: string };
              userName = userDocData?.name || "غير معروف";
              console.log("  👤 تم جلب اسم المستخدم:", userName);
            } else {
              console.log("  ⚠️ المستخدم غير موجود في قاعدة البيانات");
            }
          } catch (userError: any) {
            console.error("  ❌ خطأ في جلب بيانات المستخدم:", userError);
          }
        }
        
        const levelData = levelsData.find(l => l.id === data.educationalLevelId);
        console.log("  📚 البحث عن المرحلة التعليمية:");
        console.log("    - levelsData array length:", levelsData.length);
        console.log("    - levelsData IDs:", levelsData.map(l => l.id));
        console.log("    - البحث عن:", data.educationalLevelId);
        console.log("    - النتيجة:", levelData ? `✅ موجود: ${levelData.name}` : "❌ غير موجود");
        
        const result = {
          id: subscriptionDoc.id,
          ...data,
          userName: userName,
          levelName: levelData?.name || "غير معروف",
        };
        console.log("  ✅ النتيجة النهائية:", result);
        
        return result;
      });
      
      const subscriptionsData = await Promise.all(subscriptionsDataPromises);
      
      console.log("\n📦 [fetchData] جميع الاشتراكات بعد المعالجة:", subscriptionsData);
      
      // ترتيب البيانات في JavaScript حسب createdAt
      subscriptionsData.sort((a, b) => {
        const aDate = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const bDate = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return bDate - aDate; // ترتيب تنازلي (الأحدث أولاً)
      });
      
      console.log("🔄 [fetchData] الاشتراكات بعد الترتيب:", subscriptionsData);
      setSubscriptions(subscriptionsData);
      console.log("✅ [fetchData] تم حفظ الاشتراكات في state");

    } catch (error) {
      console.error("❌ [fetchData] خطأ في جلب البيانات:", error);
      console.error("❌ [fetchData] تفاصيل الخطأ:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        stack: (error as any)?.stack,
      });
    } finally {
      setLoadingData(false);
      console.log("🏁 [fetchData] انتهى جلب البيانات");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    
    if (!formData.userId || !formData.educationalLevelId) {
      setErrorMessage("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!user) {
      setErrorMessage("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      // التحقق من وجود المستخدم
      const userDoc = await getDoc(doc(db, "users", formData.userId));
      
      if (!userDoc.exists()) {
        setErrorMessage("المستخدم غير موجود");
        return;
      }

      const userData = userDoc.data();
      const userName = userData.name || "غير معروف";
      const userEmail = userData.email || null;
      const userPhone = userData.phone || null;

      // التحقق من عدم وجود اشتراك سابق
      const existingSubscriptionDoc = await getDoc(doc(db, "subscriptions", formData.userId));
      
      if (existingSubscriptionDoc.exists()) {
        const existingData = existingSubscriptionDoc.data();
        const existingEndsAt = existingData.endsAt;
        
        // التحقق من أن الاشتراك السابق لم ينته بعد
        if (existingEndsAt && existingEndsAt.toMillis() > Date.now()) {
          setErrorMessage("المستخدم لديه اشتراك فعال بالفعل");
          return;
        }
      }

      // حساب تاريخ الانتهاء بناءً على عدد الأشهر المختار
      const now = Timestamp.now();
      const endsAtDate = new Date(now.toMillis());
      endsAtDate.setMonth(endsAtDate.getMonth() + formData.months);
      const endsAt = Timestamp.fromDate(endsAtDate);

      if (editingSubscription?.id) {
        // تحديث اشتراك موجود
        await updateDoc(doc(db, "subscriptions", editingSubscription.id), {
          userId: formData.userId,
          adminId: user.uid,
          educationalLevelId: formData.educationalLevelId,
          userName: userName,
          userEmail: userEmail,
          userPhone: userPhone,
          endsAt: endsAt,
          updatedAt: serverTimestamp(),
        });
        setSuccessMessage("تم تحديث الاشتراك بنجاح");
      } else {
        // إنشاء اشتراك جديد
        await setDoc(doc(db, "subscriptions", formData.userId), {
          userId: formData.userId,
          adminId: user.uid,
          educationalLevelId: formData.educationalLevelId,
          userName: userName,
          userEmail: userEmail,
          userPhone: userPhone,
          startsAt: now,
          endsAt: endsAt,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setSuccessMessage("تم إضافة الاشتراك بنجاح");
      }

      // إعادة تعيين النموذج وإخفاؤه بعد ثانيتين
      setTimeout(() => {
        setShowForm(false);
        setEditingSubscription(null);
        setFormData({
          userId: "",
          educationalLevelId: "",
          months: 1,
        });
        setSuccessMessage("");
        fetchData();
      }, 2000);
    } catch (error: any) {
      console.error("Error saving subscription:", error);
      setErrorMessage(error.message || "حدث خطأ أثناء حفظ الاشتراك");
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    // حساب عدد الأشهر من تاريخ البداية والانتهاء
    const startDate = subscription.startsAt.toDate();
    const endDate = subscription.endsAt.toDate();
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (endDate.getMonth() - startDate.getMonth());
    
    setFormData({
      userId: subscription.userId,
      educationalLevelId: subscription.educationalLevelId,
      months: monthsDiff > 0 ? monthsDiff : 1,
    });
    setErrorMessage("");
    setSuccessMessage("");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الاشتراك؟")) return;

    try {
      await deleteDoc(doc(db, "subscriptions", id));
      fetchData();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      alert("حدث خطأ أثناء حذف الاشتراك");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSubscription(null);
    setFormData({
      userId: "",
      educationalLevelId: "",
      months: 1,
    });
    setErrorMessage("");
    setSuccessMessage("");
    setSearchedUser(null);
  };

  const handleSearchUser = async (userId: string) => {
    if (!userId || userId.trim() === "") {
      setSearchedUser(null);
      setErrorMessage("");
      return;
    }

    setSearchingUser(true);
    setErrorMessage("");

    try {
      const userDoc = await getDoc(doc(db, "users", userId.trim()));
      
      if (!userDoc.exists()) {
        setSearchedUser(null);
        setErrorMessage("المستخدم غير موجود");
      } else {
        const userData = userDoc.data();
        setSearchedUser({
          uid: userDoc.id,
          name: userData.name || "غير معروف",
          email: userData.email || "",
        });
        setFormData({ ...formData, userId: userDoc.id });
        setErrorMessage("");
      }
    } catch (error: any) {
      console.error("Error searching user:", error);
      setSearchedUser(null);
      setErrorMessage("حدث خطأ أثناء البحث عن المستخدم");
    } finally {
      setSearchingUser(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isExpired = (endsAt: Timestamp) => {
    return endsAt.toMillis() < Date.now();
  };

  const handleCopyId = async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Error copying ID:", error);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-2 space-x-reverse">
              <CreditCard className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              <span>إدارة الاشتراكات</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              إضافة وتعديل وحذف الاشتراكات
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-primary-600 dark:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة اشتراك</span>
          </motion.button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingSubscription ? "تعديل اشتراك" : "إضافة اشتراك جديد"}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                  >
                    <p className="text-red-800 dark:text-red-300 font-medium">{errorMessage}</p>
                  </motion.div>
                )}

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
                  >
                    <p className="text-green-800 dark:text-green-300 font-medium">{successMessage}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      معرف المستخدم (User ID) <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <div className="flex space-x-2 space-x-reverse">
                        <input
                          type="text"
                          required
                          value={formData.userId}
                          onChange={(e) => {
                            setFormData({ ...formData, userId: e.target.value });
                            setSearchedUser(null);
                            setErrorMessage("");
                          }}
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              handleSearchUser(e.target.value);
                            }
                          }}
                          placeholder="أدخل معرف المستخدم (User ID)"
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleSearchUser(formData.userId)}
                          disabled={!formData.userId || searchingUser}
                          className="px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {searchingUser ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            "بحث"
                          )}
                        </button>
                      </div>
                      
                      {searchedUser && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                        >
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <div>
                              <p className="text-green-800 dark:text-green-300 font-medium">{searchedUser.name}</p>
                              <p className="text-green-600 dark:text-green-400 text-sm">{searchedUser.email}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      المرحلة التعليمية <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.educationalLevelId}
                      onChange={(e) => {
                        setFormData({ ...formData, educationalLevelId: e.target.value });
                        setErrorMessage("");
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">اختر المرحلة</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      مدة الاشتراك (بالشهر) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.months}
                      onChange={(e) => {
                        setFormData({ ...formData, months: parseInt(e.target.value) });
                        setErrorMessage("");
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={month}>
                          {month} {month === 1 ? "شهر" : "شهر"}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      يمكنك اختيار مدة الاشتراك من شهر واحد حتى سنة كاملة (12 شهر)
                    </p>
                  </div>

                  <div className="flex space-x-2 space-x-reverse justify-end pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center space-x-2 space-x-reverse"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingSubscription ? "حفظ التعديلات" : "إضافة اشتراك"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {loadingData ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <CreditCard className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">لا توجد اشتراكات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <motion.div
                key={subscription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border ${
                  isExpired(subscription.endsAt)
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse mb-3">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {subscription.userName || "غير معروف"}
                      </h3>
                      {isExpired(subscription.endsAt) && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          منتهي
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">المرحلة:</span> {subscription.levelName || "غير معروف"}
                      </p>
                      
                      {subscription.userEmail && (
                        <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm">{subscription.userEmail}</span>
                        </div>
                      )}
                      
                      {subscription.userPhone && (
                        <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm">{subscription.userPhone}</span>
                        </div>
                      )}
                      
                      {subscription.userId && (
                        <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                          <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm font-mono text-xs">{subscription.userId}</span>
                          <button
                            onClick={() => handleCopyId(subscription.userId)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                            title="نسخ الـ ID"
                          >
                            {copiedId === subscription.userId ? (
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500 dark:text-gray-500">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Calendar className="h-4 w-4" />
                        <span>من: {formatDate(subscription.startsAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Calendar className="h-4 w-4" />
                        <span>إلى: {formatDate(subscription.endsAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => subscription.id && handleEdit(subscription as Subscription)}
                      className="px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => subscription.id && handleDelete(subscription.id)}
                      className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

