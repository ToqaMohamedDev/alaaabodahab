"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, collection, addDoc, Timestamp, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { hasValidSubscription } from "@/lib/subscription";
import { ArrowLeft, AlertCircle, Loader2, CheckCircle, XCircle, Award, Clock, FileText } from "lucide-react";
import Link from "next/link";

interface Test {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  questions: number;
  createdAt?: any;
  updatedAt?: any;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface PrivateContent {
  questionsData: Question[];
}

interface TestResult {
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
}

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  const [user, loadingAuth] = useAuthState(auth);
  
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Test state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [savingResult, setSavingResult] = useState(false);
  const [existingResult, setExistingResult] = useState<any>(null);
  const [checkingExistingResult, setCheckingExistingResult] = useState(false);

  useEffect(() => {
    if (!loadingAuth) {
      fetchTest();
    }
  }, [testId, loadingAuth]);

  useEffect(() => {
    if (testStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, timeRemaining]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب البيانات العامة للاختبار
      const testRef = doc(db, "tests", testId);
      const testDoc = await getDoc(testRef);

      if (!testDoc.exists()) {
        setError("الاختبار غير موجود");
        setLoading(false);
        return;
      }

      const testData = {
        id: testDoc.id,
        ...testDoc.data(),
      } as Test;

      setTest(testData);

      // إذا كان المستخدم مسجل دخول، نحاول جلب الأسئلة والتحقق من وجود نتيجة سابقة
      if (user && testData.level) {
        await checkExistingResult(user.uid);
        await checkAndFetchQuestions(user, testData.level);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error fetching test:", error);
      setError("حدث خطأ أثناء جلب بيانات الاختبار");
      setLoading(false);
    }
  };

  const checkExistingResult = async (userId: string) => {
    try {
      setCheckingExistingResult(true);
      const resultsQuery = query(
        collection(db, "testResults"),
        where("userId", "==", userId),
        where("testId", "==", testId)
      );
      const snapshot = await getDocs(resultsQuery);
      
      if (!snapshot.empty) {
        // يوجد نتيجة سابقة
        const existingResultData = snapshot.docs[0].data();
        setExistingResult({
          id: snapshot.docs[0].id,
          ...existingResultData,
        });
        setTestCompleted(true);
        setResult({
          score: existingResultData.score,
          percentage: existingResultData.percentage,
          totalQuestions: existingResultData.totalQuestions,
          correctAnswers: existingResultData.correctAnswers,
          wrongAnswers: existingResultData.wrongAnswers,
        });
      }
    } catch (error) {
      console.error("Error checking existing result:", error);
    } finally {
      setCheckingExistingResult(false);
    }
  };

  const checkAndFetchQuestions = async (currentUser: any, levelId: string) => {
    try {
      setCheckingSubscription(true);

      // التحقق من الاشتراك أولاً - مهم جداً للأمان
      const isValid = await hasValidSubscription(currentUser, levelId);

      // فقط إذا كان لديه اشتراك صالح، نجلب البيانات الخاصة
      if (!isValid) {
        // لا يوجد اشتراك صالح - لا نجلب البيانات الخاصة على الإطلاق
        setHasAccess(false);
        setCheckingSubscription(false);
        setLoading(false);
        return;
      }

      // هنا فقط إذا كان لديه اشتراك صالح، نجلب البيانات الخاصة
      try {
        const privateContentRef = doc(db, "tests", testId, "private", "content");
        const privateContentDoc = await getDoc(privateContentRef);

        if (!privateContentDoc.exists()) {
          setError("الأسئلة غير متاحة");
          setCheckingSubscription(false);
          setLoading(false);
          return;
        }

        const contentData = privateContentDoc.data();
        
        // التأكد من أن questionsData هي مصفوفة
        let questionsArray: Question[] = [];
        
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
            // إذا كانت كائن، نحولها لمصفوفة
            const entries = Object.entries(questionsData)
              .filter(([key, value]: [string, any]) => 
                value && 
                typeof value === 'object' && 
                'question' in value
              )
              .sort(([a], [b]) => {
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
        
        if (questionsArray.length === 0) {
          setError("لا توجد أسئلة متاحة في هذا الاختبار");
          setHasAccess(false);
        } else {
          setQuestions(questionsArray);
          setHasAccess(true);
        }
      } catch (privateError: any) {
        console.error("Error fetching private content:", privateError);
        // إذا كان الخطأ بسبب عدم الصلاحية، لا نعرض رسالة خطأ تفصيلية
        if (privateError.code === "permission-denied") {
          setHasAccess(false);
          // لا نعرض رسالة خطأ لأن هذا يعني أنه ليس لديه اشتراك
        } else {
          setError("حدث خطأ أثناء جلب الأسئلة");
          setHasAccess(false);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setHasAccess(false);
    } finally {
      setCheckingSubscription(false);
      setLoading(false);
    }
  };

  const startTest = () => {
    if (!test) return;
    
    // التحقق من وجود نتيجة سابقة
    if (existingResult) {
      // إذا كان هناك نتيجة سابقة، لا يمكن بدء الاختبار مرة أخرى
      return;
    }
    
    // تحويل مدة الاختبار من دقائق إلى ثواني
    const durationMinutes = parseInt(test.duration) || 30;
    setTimeRemaining(durationMinutes * 60);
    setTestStarted(true);
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!user || !test) return;

    setSavingResult(true);

    // حساب النتيجة
    let correctAnswers = 0;
    let wrongAnswers = 0;

    questions.forEach((question) => {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    });

    const totalQuestions = questions.length;
    const score = correctAnswers;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    const testResult: TestResult = {
      score,
      percentage,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
    };

    setResult(testResult);
    setTestCompleted(true);

    // حفظ النتيجة في Firestore
    try {
      await addDoc(collection(db, "testResults"), {
        userId: user.uid,
        testId: test.id,
        score,
        percentage,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        answers: answers,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error saving test result:", error);
    } finally {
      setSavingResult(false);
    }
  };

  if (loading || loadingAuth || checkingExistingResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">خطأ</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link href="/tests">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              العودة إلى الاختبارات
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  if (!test) {
    return null;
  }

  // عرض رسالة عدم الوصول مع معلومات الاختبار العامة
  if (!hasAccess || (questions.length === 0 && !checkingSubscription)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="mb-6 flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>رجوع</span>
          </motion.button>

          {/* معلومات الاختبار العامة */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {test.title}
              </h1>
              <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                <FileText className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              {test.description}
            </p>
            <div className="flex flex-wrap gap-4 text-gray-700 dark:text-gray-300">
              <div className="flex items-center space-x-2 space-x-reverse">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>{test.questions} سؤال</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>{test.duration} دقيقة</span>
              </div>
            </div>
          </motion.div>

          {/* رسالة عدم الوصول */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="bg-primary-100 dark:bg-primary-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                هذا الاختبار يتطلب اشتراك
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {!user
                  ? "يرجى تسجيل الدخول للوصول إلى أسئلة هذا الاختبار"
                  : "يجب أن يكون لديك اشتراك صالح في المرحلة التعليمية المطلوبة للوصول إلى أسئلة هذا الاختبار"}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!user ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/auth/login?redirect=/tests/${testId}`)}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold"
                  >
                    تسجيل الدخول
                  </motion.button>
                ) : (
                  <Link href="/contact">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold"
                    >
                      تواصل معنا للاشتراك
                    </motion.button>
                  </Link>
                )}
                <Link href="/tests">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-8 py-3 rounded-lg font-semibold"
                  >
                    العودة إلى الاختبارات
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // التأكد من وجود الأسئلة
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">لا توجد أسئلة متاحة</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  // التأكد من وجود السؤال الحالي
  if (!currentQuestion || typeof currentQuestion !== 'object' || !('question' in currentQuestion)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">خطأ في تحميل السؤال</p>
        </div>
      </div>
    );
  }

  // عرض النتيجة
  if (testCompleted && result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-12"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="bg-primary-100 dark:bg-primary-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Award className="h-12 w-12 text-primary-600 dark:text-primary-400" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                تم إكمال الاختبار!
              </h2>
              <div className="text-6xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {result.percentage}%
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {result.correctAnswers} من {result.totalQuestions} إجابة صحيحة
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg text-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.correctAnswers}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">إجابة صحيحة</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.wrongAnswers}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">إجابة خاطئة</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg text-center">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.totalQuestions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي الأسئلة</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tests">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold w-full sm:w-auto"
                >
                  العودة إلى الاختبارات
                </motion.button>
              </Link>
              <Link href="/profile">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-8 py-3 rounded-lg font-semibold w-full sm:w-auto"
                >
                  عرض البروفايل
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // عرض الاختبار
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!testStarted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-12"
          >
            <div className="text-center mb-8">
              <FileText className="h-16 w-16 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {test.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                {test.description}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">عدد الأسئلة:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {questions.length} سؤال
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">المدة:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {test.duration}
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startTest}
              className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold text-lg"
            >
              ابدأ الاختبار
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {test.title}
                </h2>
                <div className="flex items-center space-x-2 space-x-reverse text-primary-600 dark:text-primary-400">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">
                    {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-primary-600 h-2 rounded-full"
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                السؤال {currentQuestionIndex + 1} من {questions.length}
              </div>
            </div>

            {/* Question */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-6"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {currentQuestion.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion.id] === index;
                  const isCorrect = index === currentQuestion.correctAnswer;
                  const showResult = testCompleted;

                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => !testCompleted && handleAnswerSelect(currentQuestion.id, index)}
                      disabled={testCompleted}
                      className={`w-full text-right p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? showResult
                            ? isCorrect
                              ? "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-100"
                              : "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-900 dark:text-red-100"
                            : "bg-primary-100 dark:bg-primary-900/30 border-primary-500 text-primary-900 dark:text-primary-100"
                          : showResult && isCorrect
                          ? "bg-green-50 dark:bg-green-900/20 border-green-300 text-green-900 dark:text-green-100"
                          : "bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-primary-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-primary-600 dark:bg-primary-400 flex items-center justify-center text-white text-sm font-bold">
                            {String.fromCharCode(65 + index)}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {testCompleted && currentQuestion.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>شرح:</strong> {currentQuestion.explanation}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </motion.button>

              {currentQuestionIndex === questions.length - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitTest}
                  disabled={savingResult}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {savingResult ? "جاري الحفظ..." : "إنهاء الاختبار"}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextQuestion}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  التالي
                </motion.button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

