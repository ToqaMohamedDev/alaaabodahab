import { Timestamp } from "firebase/firestore";

/**
 * ============================================
 * Firestore Data Schemas
 * ============================================
 * 
 * هذا الملف يحتوي على جميع أشكال البيانات (Schemas) المستخدمة في Firestore
 * يمكن استخدام هذه الـ interfaces في جميع أنحاء التطبيق لضمان نوع البيانات الصحيح
 */

// ============================================
// 1. Videos Collection
// ============================================

/**
 * فيديو تعليمي
 * Collection: videos
 * 
 * @example
 * {
 *   id: "video123",
 *   title: "شرح قواعد النحو",
 *   description: "شرح شامل لقواعد النحو في اللغة العربية",
 *   category: "categoryId123", // ID من collection categories
 *   level: "levelId456", // ID من collection educationalLevels
 *   thumbnailUrl: "https://example.com/thumbnail.jpg",
 *   views: 150,
 *   duration: "45:30",
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */
export interface Video {
  id?: string;
  title: string; // عنوان الفيديو (مطلوب)
  description: string; // وصف الفيديو (مطلوب)
  category: string; // معرف التصنيف (ID من collection categories) (مطلوب)
  level: string; // معرف المرحلة التعليمية (ID من collection educationalLevels) (مطلوب)
  thumbnailUrl?: string; // رابط صورة الغلاف (اختياري)
  views?: number; // عدد المشاهدات (افتراضي: 0)
  duration?: string; // مدة الفيديو بصيغة "MM:SS" أو "HH:MM:SS" (اختياري)
  createdAt?: Timestamp | any; // تاريخ الإنشاء
  updatedAt?: Timestamp | any; // تاريخ آخر تحديث
}

/**
 * رابط الفيديو الخاص (يحتاج اشتراك)
 * Collection: videos/{videoId}/private/source
 * 
 * @example
 * {
 *   url: "https://example.com/private-video.mp4"
 * }
 */
export interface VideoPrivateSource {
  url: string; // رابط الفيديو الخاص (مطلوب)
}

// ============================================
// 2. Courses Collection
// ============================================

/**
 * كورس تعليمي
 * Collection: courses
 * 
 * @example
 * {
 *   id: "course123",
 *   title: "كورس القواعد النحوية",
 *   description: "كورس شامل لتعلم القواعد النحوية",
 *   category: "categoryId789", // ID من collection courseCategories
 *   level: "levelId456", // ID من collection educationalLevels
 *   thumbnailUrl: "https://example.com/course-thumb.jpg",
 *   hours: 20, // عدد الساعات
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */
export interface Course {
  id?: string;
  title: string; // عنوان الكورس (مطلوب)
  description: string; // وصف الكورس (مطلوب)
  category: string; // معرف التصنيف (ID من collection courseCategories) (مطلوب)
  level: string; // معرف المرحلة التعليمية (ID من collection educationalLevels) (مطلوب)
  thumbnailUrl?: string; // رابط صورة الغلاف (اختياري)
  hours: number; // عدد الساعات (مطلوب، يجب أن يكون > 0)
  createdAt?: Timestamp | any; // تاريخ الإنشاء
  updatedAt?: Timestamp | any; // تاريخ آخر تحديث
}

/**
 * رابط الكورس الخاص (يحتاج اشتراك)
 * Collection: courses/{courseId}/private/source
 * 
 * @example
 * {
 *   url: "https://example.com/private-course.mp4"
 * }
 */
export interface CoursePrivateSource {
  url: string; // رابط الكورس الخاص (مطلوب)
}

// ============================================
// 3. Tests Collection
// ============================================

/**
 * اختبار تفاعلي
 * Collection: tests
 * 
 * @example
 * {
 *   id: "test123",
 *   title: "اختبار القواعد النحوية",
 *   description: "اختبار شامل في القواعد النحوية",
 *   level: "levelId456", // ID من collection educationalLevels
 *   duration: "30", // المدة بالدقائق
 *   questions: 10, // عدد الأسئلة (يتم حسابه تلقائياً من questionsData)
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */
export interface Test {
  id?: string;
  title: string; // عنوان الاختبار (مطلوب)
  description: string; // وصف الاختبار (مطلوب)
  level: string; // معرف المرحلة التعليمية (ID من collection educationalLevels) (مطلوب)
  duration: string; // مدة الاختبار بالدقائق (مطلوب، مثال: "30")
  questions: number; // عدد الأسئلة (يتم حسابه تلقائياً من questionsData)
  createdAt?: Timestamp | any; // تاريخ الإنشاء
  updatedAt?: Timestamp | any; // تاريخ آخر تحديث
}

/**
 * سؤال في الاختبار
 */
export interface Question {
  id: number; // رقم السؤال (يبدأ من 1)
  question: string; // نص السؤال (مطلوب)
  options: string[]; // خيارات الإجابة (مطلوب، يجب أن يكون 4 خيارات)
  correctAnswer: number; // رقم الإجابة الصحيحة (0-3) (مطلوب)
  explanation?: string; // شرح الإجابة الصحيحة (اختياري)
}

/**
 * محتوى الاختبار الخاص (يحتاج اشتراك)
 * Collection: tests/{testId}/private/content
 * 
 * @example
 * {
 *   questionsData: [
 *     {
 *       id: 1,
 *       question: "ما هي علامة إعراب الفاعل؟",
 *       options: ["مرفوع", "منصوب", "مجرور", "مجهول"],
 *       correctAnswer: 0,
 *       explanation: "الفاعل دائماً مرفوع"
 *     },
 *     ...
 *   ]
 * }
 */
export interface TestPrivateContent {
  questionsData: Question[]; // مصفوفة الأسئلة (مطلوب)
}

// ============================================
// 4. Subscriptions Collection
// ============================================

/**
 * اشتراك المستخدم
 * Collection: subscriptions
 * Document ID: userId (معرف المستخدم)
 * 
 * @example
 * {
 *   id: "user123", // Document ID = userId
 *   userId: "user123",
 *   adminId: "admin456",
 *   educationalLevelId: "levelId456",
 *   userName: "أحمد محمد",
 *   userEmail: "ahmed@example.com",
 *   userPhone: "+201234567890",
 *   startsAt: Timestamp,
 *   endsAt: Timestamp,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */
export interface Subscription {
  id?: string; // Document ID (يساوي userId)
  userId: string; // معرف المستخدم (مطلوب، Document ID)
  adminId?: string; // معرف الأدمن الذي أنشأ الاشتراك (اختياري)
  educationalLevelId: string; // معرف المرحلة التعليمية (ID من collection educationalLevels) (مطلوب)
  userName?: string; // اسم المستخدم (اختياري، يُجلب من users collection)
  userEmail?: string; // بريد المستخدم (اختياري، يُجلب من users collection)
  userPhone?: string; // رقم هاتف المستخدم (اختياري، يُجلب من users collection)
  startsAt: Timestamp; // تاريخ بداية الاشتراك (مطلوب)
  endsAt: Timestamp; // تاريخ نهاية الاشتراك (مطلوب)
  createdAt?: Timestamp | any; // تاريخ الإنشاء
  updatedAt?: Timestamp | any; // تاريخ آخر تحديث
}

/**
 * بيانات النموذج لإضافة/تعديل اشتراك
 */
export interface SubscriptionFormData {
  userId: string; // معرف المستخدم (مطلوب)
  educationalLevelId: string; // معرف المرحلة التعليمية (مطلوب)
  months: number; // عدد الأشهر (1-12) (مطلوب)
}

// ============================================
// 5. Educational Levels Collection
// ============================================

/**
 * مرحلة تعليمية
 * Collection: educationalLevels
 * 
 * @example
 * {
 *   id: "level123",
 *   name: "المرحلة الإعدادية",
 *   imageUrl: "https://example.com/level-image.jpg",
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */
export interface EducationalLevel {
  id?: string;
  name: string; // اسم المرحلة التعليمية (مطلوب، مثال: "المرحلة الإعدادية" أو "المرحلة الثانوية")
  imageUrl?: string; // رابط صورة المرحلة (اختياري)
  createdAt?: Timestamp | any; // تاريخ الإنشاء
  updatedAt?: Timestamp | any; // تاريخ آخر تحديث
}

// ============================================
// 6. Categories Collection (Videos)
// ============================================

/**
 * تصنيف الفيديوهات
 * Collection: categories
 * 
 * @example
 * {
 *   id: "category123",
 *   name: "قواعد النحو"
 * }
 */
export interface VideoCategory {
  id?: string;
  name: string; // اسم التصنيف (مطلوب، مثال: "قواعد النحو" أو "القصص" أو "حل الأسئلة")
}

// ============================================
// 7. Course Categories Collection
// ============================================

/**
 * تصنيف الكورسات
 * Collection: courseCategories
 * 
 * @example
 * {
 *   id: "category456",
 *   name: "كورس القواعد"
 * }
 */
export interface CourseCategory {
  id?: string;
  name: string; // اسم التصنيف (مطلوب، مثال: "كورس القواعد" أو "كورس القصص" أو "كورس حل الأسئلة")
}

/**
 * تصنيف موحد (لإدارة التصنيفات في صفحة واحدة)
 */
export interface Category {
  id?: string;
  name: string; // اسم التصنيف (مطلوب)
  type: "video" | "course"; // نوع التصنيف (مطلوب)
}

// ============================================
// 8. Messages Collection
// ============================================

/**
 * رسالة من المستخدم
 * Collection: messages
 * 
 * @example
 * {
 *   id: "message123",
 *   userId: "user123", // null إذا كان المستخدم غير مسجل
 *   userName: "أحمد محمد",
 *   userEmail: "ahmed@example.com",
 *   message: "أريد الاستفسار عن الكورسات المتاحة",
 *   read: false,
 *   createdAt: Timestamp
 * }
 */
export interface Message {
  id: string;
  userId: string | null; // معرف المستخدم (null إذا كان غير مسجل) (اختياري)
  userName: string; // اسم المرسل (مطلوب)
  userEmail: string; // بريد المرسل (مطلوب)
  message: string; // نص الرسالة (مطلوب)
  read: boolean; // حالة القراءة (افتراضي: false)
  createdAt: Timestamp | null; // تاريخ الإرسال (مطلوب)
}

// ============================================
// 9. Test Results Collection
// ============================================

/**
 * نتيجة اختبار للمستخدم
 * Collection: testResults
 * 
 * @example
 * {
 *   id: "result123",
 *   userId: "user123",
 *   testId: "test456",
 *   score: 8,
 *   percentage: 80,
 *   totalQuestions: 10,
 *   createdAt: Timestamp
 * }
 */
export interface TestResult {
  id: string;
  userId: string; // معرف المستخدم (مطلوب)
  testId: string; // معرف الاختبار (مطلوب)
  score: number; // النقاط المحققة (مطلوب)
  percentage: number; // النسبة المئوية (مطلوب)
  totalQuestions: number; // إجمالي عدد الأسئلة (مطلوب)
  createdAt: Timestamp | any; // تاريخ إجراء الاختبار (مطلوب)
}

// ============================================
// 10. Users Collection
// ============================================

/**
 * بيانات المستخدم الإضافية
 * Collection: users
 * Document ID: userId (معرف المستخدم من Firebase Auth)
 * 
 * @example
 * {
 *   id: "user123",
 *   name: "أحمد محمد",
 *   email: "ahmed@example.com",
 *   phone: "+201234567890",
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */
export interface UserProfile {
  id?: string; // Document ID (يساوي userId من Firebase Auth)
  name: string; // اسم المستخدم (مطلوب)
  email: string; // بريد المستخدم (مطلوب)
  phone?: string; // رقم الهاتف (اختياري)
  photoURL?: string; // رابط الصورة الشخصية (اختياري)
  createdAt?: Timestamp | any; // تاريخ الإنشاء
  updatedAt?: Timestamp | any; // تاريخ آخر تحديث
}

// ============================================
// 11. Roles Collection
// ============================================

/**
 * دور المستخدم (Admin)
 * Collection: roles
 * Document ID: userId (معرف المستخدم)
 * 
 * @example
 * {
 *   id: "admin123",
 *   role: "admin"
 * }
 */
export interface UserRole {
  id?: string; // Document ID (يساوي userId)
  role: "admin"; // دور المستخدم (مطلوب، حالياً فقط "admin")
}

// ============================================
// Export All Types
// ============================================

export type {
  Video,
  VideoPrivateSource,
  Course,
  CoursePrivateSource,
  Test,
  Question,
  TestPrivateContent,
  Subscription,
  SubscriptionFormData,
  EducationalLevel,
  VideoCategory,
  CourseCategory,
  Category,
  Message,
  TestResult,
  UserProfile,
  UserRole,
};

