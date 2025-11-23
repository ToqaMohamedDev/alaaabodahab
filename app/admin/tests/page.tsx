"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FileText, Plus, Edit, Trash2, X, Save, PlusCircle, MinusCircle } from "lucide-react";

interface EducationalLevel {
  id: string;
  name: string;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Test {
  id?: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  questions: number; // عدد الأسئلة فقط في البيانات العامة
  createdAt?: any;
  updatedAt?: any;
}

interface QuestionData {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export default function TestsManagement() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  const [tests, setTests] = useState<Test[]>([]);
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState<Test>({
    title: "",
    description: "",
    level: "",
    duration: "30",
    questions: 0,
  });
  
  const [questionsData, setQuestionsData] = useState<QuestionData[]>([]);

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

      const levelsSnapshot = await getDocs(collection(db, "educationalLevels"));
      setLevels(levelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EducationalLevel)));

      const testsSnapshot = await getDocs(query(collection(db, "tests"), orderBy("createdAt", "desc")));
      setTests(testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test)));

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const addQuestion = () => {
    const currentQuestions = Array.isArray(questionsData) ? questionsData : [];
    setQuestionsData([
      ...currentQuestions,
      {
        id: currentQuestions.length,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
    setFormData({ ...formData, questions: currentQuestions.length + 1 });
  };

  const removeQuestion = (index: number) => {
    const currentQuestions = Array.isArray(questionsData) ? questionsData : [];
    const newQuestions = currentQuestions.filter((_, i) => i !== index);
    // تحديث الـ IDs
    const updatedQuestions = newQuestions.map((q, i) => ({ ...q, id: i }));
    setQuestionsData(updatedQuestions);
    setFormData({ ...formData, questions: updatedQuestions.length });
  };

  const updateQuestion = (index: number, field: keyof QuestionData, value: any) => {
    const currentQuestions = Array.isArray(questionsData) ? questionsData : [];
    const newQuestions = [...currentQuestions];
    if (field === "options") {
      newQuestions[index].options = value;
    } else {
      (newQuestions[index] as any)[field] = value;
    }
    setQuestionsData(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const currentQuestions = Array.isArray(questionsData) ? questionsData : [];
    const newQuestions = [...currentQuestions];
    if (newQuestions[questionIndex] && Array.isArray(newQuestions[questionIndex].options)) {
      newQuestions[questionIndex].options[optionIndex] = value;
      setQuestionsData(newQuestions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentQuestions = Array.isArray(questionsData) ? questionsData : [];
    
    if (!formData.title || !formData.description || !formData.level || !formData.duration || currentQuestions.length === 0) {
      alert("يرجى ملء جميع الحقول المطلوبة وإضافة سؤال واحد على الأقل");
      return;
    }

    // التحقق من صحة الأسئلة
    for (let i = 0; i < currentQuestions.length; i++) {
      const q = currentQuestions[i];
      if (!q || typeof q !== 'object' || !q.question || !Array.isArray(q.options) || q.options.some(opt => !opt) || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        alert(`يرجى إكمال السؤال رقم ${i + 1}`);
        return;
      }
    }

    try {
      if (editingTest?.id) {
        // تحديث البيانات العامة
        await updateDoc(doc(db, "tests", editingTest.id), {
          title: formData.title,
          description: formData.description,
          level: formData.level,
          duration: formData.duration,
          questions: currentQuestions.length,
          updatedAt: serverTimestamp(),
        });
        
        // تحديث الأسئلة الخاصة
        await updateDoc(doc(db, "tests", editingTest.id, "private", "content"), {
          questionsData: currentQuestions,
        });
      } else {
        // إضافة اختبار جديد
        const testRef = await addDoc(collection(db, "tests"), {
          title: formData.title,
          description: formData.description,
          level: formData.level,
          duration: formData.duration,
          questions: currentQuestions.length,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // إضافة الأسئلة الخاصة
        await setDoc(doc(db, "tests", testRef.id, "private", "content"), {
          questionsData: currentQuestions,
        });
      }

      setShowForm(false);
      setEditingTest(null);
      setFormData({
        title: "",
        description: "",
        level: "",
        duration: "30",
        questions: 0,
      });
      setQuestionsData([]);
      fetchData();
    } catch (error) {
      console.error("Error saving test:", error);
      alert("حدث خطأ أثناء حفظ الاختبار");
    }
  };

  const handleEdit = async (test: Test) => {
    setEditingTest(test);
    setFormData({
      title: test.title || "",
      description: test.description || "",
      level: test.level || "",
      duration: test.duration || "30",
      questions: test.questions || 0,
    });
    
    // جلب الأسئلة الخاصة
    try {
      if (test.id) {
        const privateContentRef = doc(db, "tests", test.id, "private", "content");
        const privateContentDoc = await getDoc(privateContentRef);
        if (privateContentDoc.exists()) {
          const contentData = privateContentDoc.data();
          let questionsArray: QuestionData[] = [];
          
          if (contentData && contentData.questionsData) {
            const questionsData = contentData.questionsData;
            
            // دالة مساعدة لتحويل options إلى مصفوفة strings
            const normalizeOptions = (options: any): string[] => {
              if (Array.isArray(options)) {
                return options.map((opt: any) => {
                  if (typeof opt === 'string') return opt;
                  if (typeof opt === 'object' && opt !== null) return String(opt);
                  return String(opt || '');
                });
              } else if (options && typeof options === 'object') {
                // إذا كانت كائن (مثل {0: "opt1", 1: "opt2"})
                const entries = Object.entries(options)
                  .sort(([a], [b]) => {
                    const aNum = Number(a);
                    const bNum = Number(b);
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                      return aNum - bNum;
                    }
                    return a.localeCompare(b);
                  });
                return entries.map(([, opt]: [string, any]) => String(opt || ''));
              }
              return [];
            };
            
            if (Array.isArray(questionsData)) {
              // إذا كانت مصفوفة مباشرة
              questionsArray = questionsData.map((q: any, index: number) => ({
                id: q.id !== undefined && q.id !== null ? Number(q.id) : index,
                question: String(q.question || ''),
                options: normalizeOptions(q.options),
                correctAnswer: Number(q.correctAnswer || 0),
                explanation: q.explanation ? String(q.explanation) : undefined,
              }));
            } else if (typeof questionsData === 'object' && questionsData !== null) {
              // إذا كانت كائن، نحولها لمصفوفة مع الحفاظ على الترتيب
              const entries = Object.entries(questionsData)
                .filter(([key, value]: [string, any]) => 
                  value && 
                  typeof value === 'object' && 
                  'question' in value
                )
                .sort(([a], [b]) => {
                  // ترتيب حسب المفاتيح الرقمية
                  const aNum = Number(a);
                  const bNum = Number(b);
                  if (!isNaN(aNum) && !isNaN(bNum)) {
                    return aNum - bNum;
                  }
                  return a.localeCompare(b);
                });
              
              questionsArray = entries.map(([key, q]: [string, any], index: number) => ({
                id: q.id !== undefined && q.id !== null ? Number(q.id) : (isNaN(Number(key)) ? index : Number(key)),
                question: String(q.question || ''),
                options: normalizeOptions(q.options),
                correctAnswer: Number(q.correctAnswer || 0),
                explanation: q.explanation ? String(q.explanation) : undefined,
              }));
            }
          }
          
          setQuestionsData(questionsArray);
        } else {
          setQuestionsData([]);
        }
      }
    } catch (error) {
      console.error("Error fetching private content:", error);
      setQuestionsData([]);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الاختبار؟")) return;

    try {
      // حذف الأسئلة الخاصة أولاً
      try {
        await deleteDoc(doc(db, "tests", id, "private", "content"));
      } catch (error) {
        console.error("Error deleting private content:", error);
      }
      
      await deleteDoc(doc(db, "tests", id));
      fetchData();
    } catch (error) {
      console.error("Error deleting test:", error);
      alert("حدث خطأ أثناء حذف الاختبار");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTest(null);
    setFormData({
      title: "",
      description: "",
      level: "",
      duration: "30",
      questions: 0,
    });
    setQuestionsData([]);
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
              <FileText className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              <span>إدارة الاختبارات</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              إضافة وتعديل وحذف الاختبارات
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-primary-600 dark:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة اختبار</span>
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingTest ? "تعديل اختبار" : "إضافة اختبار جديد"}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      عنوان الاختبار <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      المدة (بالدقائق) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="مثل: 30 دقيقة"
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
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
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

                  {/* Questions Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        الأسئلة <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>إضافة سؤال</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {Array.isArray(questionsData) && questionsData.map((question, qIndex) => {
                        // التأكد من أن question هو كائن صحيح
                        if (!question || typeof question !== 'object' || !('question' in question)) {
                          return null;
                        }
                        
                        return (
                          <div
                            key={qIndex}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                سؤال {qIndex + 1}
                              </h3>
                              {questionsData.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(qIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <MinusCircle className="h-5 w-5" />
                                </button>
                              )}
                            </div>

                            <div className="mb-3">
                              <input
                                type="text"
                                required
                                value={String(question.question || '')}
                                onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                                placeholder="اكتب السؤال هنا..."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>

                            <div className="space-y-2 mb-3">
                              {Array.isArray(question.options) && question.options.map((option, oIndex) => {
                                // التأكد من أن option هو string وليس كائن
                                const optionValue = typeof option === 'string' ? option : (typeof option === 'object' && option !== null ? String(option) : '');
                                
                                return (
                                  <div key={oIndex} className="flex items-center space-x-2 space-x-reverse">
                                    <input
                                      type="radio"
                                      name={`correct-${qIndex}`}
                                      checked={Number(question.correctAnswer) === oIndex}
                                      onChange={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                                      className="h-4 w-4 text-primary-600"
                                    />
                                    <input
                                      type="text"
                                      required
                                      value={optionValue}
                                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                      placeholder={`الخيار ${oIndex + 1}`}
                                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                      <span>{editingTest ? "حفظ التعديلات" : "إضافة"}</span>
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
        ) : tests.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <FileText className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">لا توجد اختبارات</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => {
              const level = levels.find(l => l.id === test.level);
              
              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {test.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {test.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-4">
                    <span>{level?.name || "بدون مرحلة"}</span>
                    <span>{test.questions} سؤال</span>
                  </div>
                  {test.duration && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                      المدة: {test.duration}
                    </div>
                  )}
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleEdit(test)}
                      className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center justify-center space-x-2 space-x-reverse"
                    >
                      <Edit className="h-4 w-4" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => test.id && handleDelete(test.id)}
                      className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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

