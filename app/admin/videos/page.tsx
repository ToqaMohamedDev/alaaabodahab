"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Video, Plus, Edit, Trash2, X, Save, Image as ImageIcon } from "lucide-react";

interface EducationalLevel {
  id: string;
  name: string;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
}

interface VideoItem {
  id?: string;
  title: string;
  description: string;
  category: string;
  level: string;
  thumbnailUrl?: string;
  views?: number;
  duration?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface PrivateSource {
  url: string;
}

export default function VideosManagement() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [formData, setFormData] = useState<VideoItem>({
    title: "",
    description: "",
    category: "",
    level: "",
    thumbnailUrl: "",
  });
  
  const [privateVideoUrl, setPrivateVideoUrl] = useState("");

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

      // جلب المراحل التعليمية
      const levelsSnapshot = await getDocs(collection(db, "educationalLevels"));
      setLevels(levelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EducationalLevel)));

      // جلب تصنيفات الفيديوهات
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));

      // جلب الفيديوهات
      const videosSnapshot = await getDocs(query(collection(db, "videos"), orderBy("createdAt", "desc")));
      setVideos(videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoItem)));

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || !formData.level || !formData.thumbnailUrl) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!privateVideoUrl) {
      alert("يرجى إدخال رابط الفيديو الخاص");
      return;
    }

    try {
      if (editingVideo?.id) {
        // تحديث فيديو موجود
        await updateDoc(doc(db, "videos", editingVideo.id), {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          level: formData.level,
          thumbnailUrl: formData.thumbnailUrl,
          updatedAt: serverTimestamp(),
        });
        
        // تحديث الرابط الخاص
        await updateDoc(doc(db, "videos", editingVideo.id, "private", "source"), {
          url: privateVideoUrl,
        });
      } else {
        // إضافة فيديو جديد
        const videoRef = await addDoc(collection(db, "videos"), {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          level: formData.level,
          thumbnailUrl: formData.thumbnailUrl,
          views: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // إضافة الرابط الخاص
        await setDoc(doc(db, "videos", videoRef.id, "private", "source"), {
          url: privateVideoUrl,
        });
      }

      setShowForm(false);
      setEditingVideo(null);
      setFormData({
        title: "",
        description: "",
        category: "",
        level: "",
        thumbnailUrl: "",
      });
      setPrivateVideoUrl("");
      fetchData();
    } catch (error) {
      console.error("Error saving video:", error);
      alert("حدث خطأ أثناء حفظ الفيديو");
    }
  };

  const handleEdit = async (video: VideoItem) => {
    setEditingVideo(video);
    setFormData({
      title: video.title || "",
      description: video.description || "",
      category: video.category || "",
      level: video.level || "",
      thumbnailUrl: video.thumbnailUrl || "",
    });
    
    // جلب الرابط الخاص
    try {
      if (video.id) {
        const privateSourceRef = doc(db, "videos", video.id, "private", "source");
        const privateSourceDoc = await getDoc(privateSourceRef);
        if (privateSourceDoc.exists()) {
          setPrivateVideoUrl(privateSourceDoc.data().url || "");
        } else {
          setPrivateVideoUrl("");
        }
      }
    } catch (error) {
      console.error("Error fetching private source:", error);
      setPrivateVideoUrl("");
    }
    
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;

    try {
      // حذف الرابط الخاص أولاً
      try {
        await deleteDoc(doc(db, "videos", id, "private", "source"));
      } catch (error) {
        console.error("Error deleting private source:", error);
      }
      
      // حذف الفيديو
      await deleteDoc(doc(db, "videos", id));
      fetchData();
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("حدث خطأ أثناء حذف الفيديو");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVideo(null);
    setFormData({
      title: "",
      description: "",
      category: "",
      level: "",
      thumbnailUrl: "",
    });
    setPrivateVideoUrl("");
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-2 space-x-reverse">
              <Video className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              <span>إدارة الفيديوهات</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              إضافة وتعديل وحذف الفيديوهات
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-primary-600 dark:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة فيديو</span>
          </motion.button>
        </div>

        {/* Form Modal */}
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
                    {editingVideo ? "تعديل فيديو" : "إضافة فيديو جديد"}
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
                      عنوان الفيديو <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="أدخل عنوان الفيديو"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      الوصف <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="أدخل وصف الفيديو"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        التصنيف <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">اختر التصنيف</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        المرحلة التعليمية <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      رابط الصورة (Thumbnail) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        required
                        value={formData.thumbnailUrl}
                        onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      رابط الفيديو الخاص (Private Source) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Video className="h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        required
                        value={privateVideoUrl}
                        onChange={(e) => setPrivateVideoUrl(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://example.com/video.mp4"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      هذا الرابط سيتم حفظه في private/source ولن يكون متاحاً إلا للمشتركين
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
                      <span>{editingVideo ? "حفظ التعديلات" : "إضافة"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Videos List */}
        {loadingData ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <Video className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">لا توجد فيديوهات</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => {
              const category = categories.find(c => c.id === video.category);
              const level = levels.find(l => l.id === video.level);
              
              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  {video.thumbnailUrl && (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {video.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-4">
                      <span>{category?.name || "بدون تصنيف"}</span>
                      <span>{level?.name || "بدون مرحلة"}</span>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEdit(video)}
                        className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center justify-center space-x-2 space-x-reverse"
                      >
                        <Edit className="h-4 w-4" />
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={() => video.id && handleDelete(video.id)}
                        className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

