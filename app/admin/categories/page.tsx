"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Tag, Plus, Edit, Trash2, X, Save, Video, BookOpen } from "lucide-react";

interface Category {
  id?: string;
  name: string;
  type: "video" | "course";
}

export default function CategoriesManagement() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Category>({
    name: "",
    type: "video",
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
      
      // جلب تصنيفات الفيديوهات
      const videoCategoriesSnapshot = await getDocs(query(collection(db, "categories"), orderBy("name")));
      const videoCategories = videoCategoriesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name,
        type: "video" as const
      }));

      // جلب تصنيفات الكورسات
      const courseCategoriesSnapshot = await getDocs(query(collection(db, "courseCategories"), orderBy("name")));
      const courseCategories = courseCategoriesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name,
        type: "course" as const
      }));

      setCategories([...videoCategories, ...courseCategories]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert("يرجى إدخال اسم التصنيف");
      return;
    }

    try {
      const collectionName = formData.type === "video" ? "categories" : "courseCategories";
      
      if (editingCategory?.id) {
        await updateDoc(doc(db, collectionName, editingCategory.id), {
          name: formData.name,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, collectionName), {
          name: formData.name,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: "", type: "video" });
      fetchData();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("حدث خطأ أثناء حفظ التصنيف");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData(category);
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    if (!category.id) return;
    if (!confirm("هل أنت متأكد من حذف هذا التصنيف؟")) return;

    try {
      const collectionName = category.type === "video" ? "categories" : "courseCategories";
      await deleteDoc(doc(db, collectionName, category.id));
      fetchData();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("حدث خطأ أثناء حذف التصنيف");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: "", type: "video" });
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

  const videoCategories = categories.filter(c => c.type === "video");
  const courseCategories = categories.filter(c => c.type === "course");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-2 space-x-reverse">
              <Tag className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              <span>إدارة التصنيفات</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              إضافة وتعديل وحذف التصنيفات
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-primary-600 dark:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة تصنيف</span>
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
                    {editingCategory ? "تعديل تصنيف" : "إضافة تصنيف جديد"}
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
                      نوع التصنيف <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as "video" | "course" })}
                      disabled={!!editingCategory}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      <option value="video">تصنيف الفيديوهات</option>
                      <option value="course">تصنيف الكورسات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      اسم التصنيف <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
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
                      <span>{editingCategory ? "حفظ التعديلات" : "إضافة"}</span>
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
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Video Categories */}
            <div>
              <div className="flex items-center space-x-2 space-x-reverse mb-4">
                <Video className="h-6 w-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  تصنيفات الفيديوهات
                </h2>
              </div>
              {videoCategories.length === 0 ? (
                <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                  <p className="text-gray-600 dark:text-gray-400">لا توجد تصنيفات</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {videoCategories.map((category) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between border border-gray-200 dark:border-gray-700"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEdit(category)}
                          className="px-3 py-1 bg-primary-600 dark:bg-primary-700 text-white rounded hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="px-3 py-1 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Course Categories */}
            <div>
              <div className="flex items-center space-x-2 space-x-reverse mb-4">
                <BookOpen className="h-6 w-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  تصنيفات الكورسات
                </h2>
              </div>
              {courseCategories.length === 0 ? (
                <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                  <p className="text-gray-600 dark:text-gray-400">لا توجد تصنيفات</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {courseCategories.map((category) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between border border-gray-200 dark:border-gray-700"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEdit(category)}
                          className="px-3 py-1 bg-primary-600 dark:bg-primary-700 text-white rounded hover:bg-primary-700 dark:hover:bg-primary-600 transition"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="px-3 py-1 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

