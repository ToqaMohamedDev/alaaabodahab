"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { GraduationCap, Plus, Edit, Trash2, X, Save, Image as ImageIcon } from "lucide-react";

interface EducationalLevel {
  id?: string;
  name: string;
  imageUrl?: string;
}

export default function LevelsManagement() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<EducationalLevel | null>(null);
  const [formData, setFormData] = useState<EducationalLevel>({
    name: "",
    imageUrl: "",
  });

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
      const levelsSnapshot = await getDocs(query(collection(db, "educationalLevels"), orderBy("name")));
      setLevels(levelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EducationalLevel)));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert("يرجى إدخال اسم المرحلة");
      return;
    }

    try {
      if (editingLevel?.id) {
        await updateDoc(doc(db, "educationalLevels", editingLevel.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "educationalLevels"), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setShowForm(false);
      setEditingLevel(null);
      setFormData({ name: "", imageUrl: "" });
      fetchData();
    } catch (error) {
      console.error("Error saving level:", error);
      alert("حدث خطأ أثناء حفظ المرحلة");
    }
  };

  const handleEdit = (level: EducationalLevel) => {
    setEditingLevel(level);
    setFormData(level);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المرحلة؟")) return;

    try {
      await deleteDoc(doc(db, "educationalLevels", id));
      fetchData();
    } catch (error) {
      console.error("Error deleting level:", error);
      alert("حدث خطأ أثناء حذف المرحلة");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLevel(null);
    setFormData({ name: "", imageUrl: "" });
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
              <GraduationCap className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              <span>إدارة المراحل التعليمية</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              إضافة وتعديل وحذف المراحل التعليمية
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-primary-600 dark:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة مرحلة</span>
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingLevel ? "تعديل مرحلة" : "إضافة مرحلة جديدة"}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      اسم المرحلة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      رابط الصورة
                    </label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  {formData.imageUrl && (
                    <div>
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

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
                      <span>{editingLevel ? "حفظ التعديلات" : "إضافة"}</span>
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
        ) : levels.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <GraduationCap className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">لا توجد مراحل تعليمية</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {level.imageUrl && (
                  <img
                    src={level.imageUrl}
                    alt={level.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {level.name}
                  </h3>
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleEdit(level)}
                      className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center justify-center space-x-2 space-x-reverse"
                    >
                      <Edit className="h-4 w-4" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => level.id && handleDelete(level.id)}
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

