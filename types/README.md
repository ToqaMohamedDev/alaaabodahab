# Firestore Data Schemas Documentation

هذا المجلد يحتوي على تعريفات أنواع البيانات (TypeScript Interfaces) المستخدمة في Firestore.

## الملفات

- **`firestore.ts`**: يحتوي على جميع الـ interfaces للبيانات المستخدمة في Firestore

## كيفية الاستخدام

### 1. استيراد الـ Types

```typescript
import { Video, Course, Test, Subscription } from "@/types/firestore";
```

### 2. استخدام الـ Types في المكونات

```typescript
import { Video } from "@/types/firestore";

const [videos, setVideos] = useState<Video[]>([]);

// عند جلب البيانات من Firestore
const fetchVideos = async () => {
  const snapshot = await getDocs(collection(db, "videos"));
  const videosData = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Video[];
  setVideos(videosData);
};
```

### 3. استخدام الـ Types في الدوال

```typescript
import { Video } from "@/types/firestore";

const addVideo = async (videoData: Video) => {
  await addDoc(collection(db, "videos"), {
    title: videoData.title,
    description: videoData.description,
    category: videoData.category,
    level: videoData.level,
    thumbnailUrl: videoData.thumbnailUrl,
    views: videoData.views || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
```

## Collections في Firestore

### 1. Videos Collection (`videos`)

**المسار:** `videos/{videoId}`

**الحقول المطلوبة:**
- `title`: string - عنوان الفيديو
- `description`: string - وصف الفيديو
- `category`: string - معرف التصنيف (ID من `categories`)
- `level`: string - معرف المرحلة التعليمية (ID من `educationalLevels`)

**الحقول الاختيارية:**
- `thumbnailUrl`: string - رابط صورة الغلاف
- `views`: number - عدد المشاهدات (افتراضي: 0)
- `duration`: string - مدة الفيديو
- `createdAt`: Timestamp - تاريخ الإنشاء
- `updatedAt`: Timestamp - تاريخ آخر تحديث

**المسار الخاص:** `videos/{videoId}/private/source`
- `url`: string - رابط الفيديو الخاص (يحتاج اشتراك)

**مثال:**
```typescript
const video: Video = {
  title: "شرح قواعد النحو",
  description: "شرح شامل لقواعد النحو",
  category: "categoryId123",
  level: "levelId456",
  thumbnailUrl: "https://example.com/thumbnail.jpg",
  views: 150,
  duration: "45:30"
};
```

---

### 2. Courses Collection (`courses`)

**المسار:** `courses/{courseId}`

**الحقول المطلوبة:**
- `title`: string - عنوان الكورس
- `description`: string - وصف الكورس
- `category`: string - معرف التصنيف (ID من `courseCategories`)
- `level`: string - معرف المرحلة التعليمية (ID من `educationalLevels`)
- `hours`: number - عدد الساعات (يجب أن يكون > 0)

**الحقول الاختيارية:**
- `thumbnailUrl`: string - رابط صورة الغلاف
- `createdAt`: Timestamp - تاريخ الإنشاء
- `updatedAt`: Timestamp - تاريخ آخر تحديث

**المسار الخاص:** `courses/{courseId}/private/source`
- `url`: string - رابط الكورس الخاص (يحتاج اشتراك)

**مثال:**
```typescript
const course: Course = {
  title: "كورس القواعد النحوية",
  description: "كورس شامل لتعلم القواعد النحوية",
  category: "categoryId789",
  level: "levelId456",
  thumbnailUrl: "https://example.com/course-thumb.jpg",
  hours: 20
};
```

---

### 3. Tests Collection (`tests`)

**المسار:** `tests/{testId}`

**الحقول المطلوبة:**
- `title`: string - عنوان الاختبار
- `description`: string - وصف الاختبار
- `level`: string - معرف المرحلة التعليمية (ID من `educationalLevels`)
- `duration`: string - مدة الاختبار بالدقائق (مثال: "30")
- `questions`: number - عدد الأسئلة (يتم حسابه تلقائياً)

**الحقول الاختيارية:**
- `createdAt`: Timestamp - تاريخ الإنشاء
- `updatedAt`: Timestamp - تاريخ آخر تحديث

**المسار الخاص:** `tests/{testId}/private/content`
- `questionsData`: Question[] - مصفوفة الأسئلة

**مثال:**
```typescript
const test: Test = {
  title: "اختبار القواعد النحوية",
  description: "اختبار شامل في القواعد النحوية",
  level: "levelId456",
  duration: "30",
  questions: 10
};

const question: Question = {
  id: 1,
  question: "ما هي علامة إعراب الفاعل؟",
  options: ["مرفوع", "منصوب", "مجرور", "مجهول"],
  correctAnswer: 0,
  explanation: "الفاعل دائماً مرفوع"
};
```

---

### 4. Subscriptions Collection (`subscriptions`)

**المسار:** `subscriptions/{userId}` (Document ID = userId)

**الحقول المطلوبة:**
- `userId`: string - معرف المستخدم (Document ID)
- `educationalLevelId`: string - معرف المرحلة التعليمية (ID من `educationalLevels`)
- `startsAt`: Timestamp - تاريخ بداية الاشتراك
- `endsAt`: Timestamp - تاريخ نهاية الاشتراك

**الحقول الاختيارية:**
- `adminId`: string - معرف الأدمن الذي أنشأ الاشتراك
- `userName`: string - اسم المستخدم
- `userEmail`: string - بريد المستخدم
- `userPhone`: string - رقم هاتف المستخدم
- `createdAt`: Timestamp - تاريخ الإنشاء
- `updatedAt`: Timestamp - تاريخ آخر تحديث

**مثال:**
```typescript
const subscription: Subscription = {
  userId: "user123",
  adminId: "admin456",
  educationalLevelId: "levelId456",
  userName: "أحمد محمد",
  userEmail: "ahmed@example.com",
  userPhone: "+201234567890",
  startsAt: Timestamp.now(),
  endsAt: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) // 3 أشهر
};
```

---

### 5. Educational Levels Collection (`educationalLevels`)

**المسار:** `educationalLevels/{levelId}`

**الحقول المطلوبة:**
- `name`: string - اسم المرحلة التعليمية (مثال: "المرحلة الإعدادية" أو "المرحلة الثانوية")

**الحقول الاختيارية:**
- `imageUrl`: string - رابط صورة المرحلة
- `createdAt`: Timestamp - تاريخ الإنشاء
- `updatedAt`: Timestamp - تاريخ آخر تحديث

**مثال:**
```typescript
const level: EducationalLevel = {
  name: "المرحلة الإعدادية",
  imageUrl: "https://example.com/level-image.jpg"
};
```

---

### 6. Categories Collection (`categories`)

**المسار:** `categories/{categoryId}`

**الحقول المطلوبة:**
- `name`: string - اسم التصنيف (مثال: "قواعد النحو" أو "القصص" أو "حل الأسئلة")

**مثال:**
```typescript
const category: VideoCategory = {
  name: "قواعد النحو"
};
```

---

### 7. Course Categories Collection (`courseCategories`)

**المسار:** `courseCategories/{categoryId}`

**الحقول المطلوبة:**
- `name`: string - اسم التصنيف (مثال: "كورس القواعد" أو "كورس القصص" أو "كورس حل الأسئلة")

**مثال:**
```typescript
const courseCategory: CourseCategory = {
  name: "كورس القواعد"
};
```

---

### 8. Messages Collection (`messages`)

**المسار:** `messages/{messageId}`

**الحقول المطلوبة:**
- `userName`: string - اسم المرسل
- `userEmail`: string - بريد المرسل
- `message`: string - نص الرسالة
- `createdAt`: Timestamp - تاريخ الإرسال

**الحقول الاختيارية:**
- `userId`: string | null - معرف المستخدم (null إذا كان غير مسجل)
- `read`: boolean - حالة القراءة (افتراضي: false)

**مثال:**
```typescript
const message: Message = {
  userId: "user123", // أو null
  userName: "أحمد محمد",
  userEmail: "ahmed@example.com",
  message: "أريد الاستفسار عن الكورسات المتاحة",
  read: false,
  createdAt: Timestamp.now()
};
```

---

### 9. Test Results Collection (`testResults`)

**المسار:** `testResults/{resultId}`

**الحقول المطلوبة:**
- `userId`: string - معرف المستخدم
- `testId`: string - معرف الاختبار
- `score`: number - النقاط المحققة
- `percentage`: number - النسبة المئوية
- `totalQuestions`: number - إجمالي عدد الأسئلة
- `createdAt`: Timestamp - تاريخ إجراء الاختبار

**مثال:**
```typescript
const testResult: TestResult = {
  userId: "user123",
  testId: "test456",
  score: 8,
  percentage: 80,
  totalQuestions: 10,
  createdAt: Timestamp.now()
};
```

---

### 10. Users Collection (`users`)

**المسار:** `users/{userId}` (Document ID = userId من Firebase Auth)

**الحقول المطلوبة:**
- `name`: string - اسم المستخدم
- `email`: string - بريد المستخدم

**الحقول الاختيارية:**
- `phone`: string - رقم الهاتف
- `photoURL`: string - رابط الصورة الشخصية
- `createdAt`: Timestamp - تاريخ الإنشاء
- `updatedAt`: Timestamp - تاريخ آخر تحديث

**مثال:**
```typescript
const userProfile: UserProfile = {
  name: "أحمد محمد",
  email: "ahmed@example.com",
  phone: "+201234567890",
  photoURL: "https://example.com/photo.jpg"
};
```

---

### 11. Roles Collection (`roles`)

**المسار:** `roles/{userId}` (Document ID = userId)

**الحقول المطلوبة:**
- `role`: "admin" - دور المستخدم (حالياً فقط "admin")

**مثال:**
```typescript
const userRole: UserRole = {
  role: "admin"
};
```

---

## ملاحظات مهمة

1. **Document IDs:**
   - `subscriptions`: Document ID = `userId`
   - `users`: Document ID = `userId` (من Firebase Auth)
   - `roles`: Document ID = `userId`

2. **البيانات الخاصة (Private Data):**
   - الفيديوهات: `videos/{videoId}/private/source`
   - الكورسات: `courses/{courseId}/private/source`
   - الاختبارات: `tests/{testId}/private/content`
   - هذه البيانات تحتاج اشتراك صالح للوصول إليها

3. **العلاقات (Relationships):**
   - `Video.category` → `categories/{categoryId}`
   - `Video.level` → `educationalLevels/{levelId}`
   - `Course.category` → `courseCategories/{categoryId}`
   - `Course.level` → `educationalLevels/{levelId}`
   - `Test.level` → `educationalLevels/{levelId}`
   - `Subscription.educationalLevelId` → `educationalLevels/{levelId}`
   - `Subscription.userId` → `users/{userId}` (من Firebase Auth)

4. **Timestamps:**
   - استخدم `serverTimestamp()` عند إضافة/تحديث البيانات
   - استخدم `Timestamp` من `firebase/firestore` عند قراءة البيانات

5. **التحقق من الصلاحيات:**
   - راجع `firestore.rules` لفهم قواعد الأمان
   - الأدمن فقط يمكنه الكتابة في معظم Collections
   - المستخدمون يمكنهم القراءة فقط (باستثناء البيانات الخاصة التي تحتاج اشتراك)

## أمثلة عملية

### إضافة فيديو جديد

```typescript
import { Video } from "@/types/firestore";
import { collection, addDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const addVideo = async (videoData: Video, privateVideoUrl: string) => {
  // إضافة البيانات العامة
  const videoRef = await addDoc(collection(db, "videos"), {
    title: videoData.title,
    description: videoData.description,
    category: videoData.category,
    level: videoData.level,
    thumbnailUrl: videoData.thumbnailUrl,
    views: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // إضافة الرابط الخاص
  await setDoc(doc(db, "videos", videoRef.id, "private", "source"), {
    url: privateVideoUrl,
  });
  
  return videoRef.id;
};
```

### جلب فيديو مع الرابط الخاص

```typescript
import { Video, VideoPrivateSource } from "@/types/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const getVideoWithPrivateSource = async (videoId: string) => {
  // جلب البيانات العامة
  const videoDoc = await getDoc(doc(db, "videos", videoId));
  if (!videoDoc.exists()) {
    throw new Error("Video not found");
  }
  
  const video = {
    id: videoDoc.id,
    ...videoDoc.data()
  } as Video;
  
  // جلب الرابط الخاص (يحتاج اشتراك)
  const privateSourceDoc = await getDoc(
    doc(db, "videos", videoId, "private", "source")
  );
  
  const privateSource = privateSourceDoc.exists() 
    ? privateSourceDoc.data() as VideoPrivateSource
    : null;
  
  return { video, privateSource };
};
```

### إضافة اشتراك جديد

```typescript
import { SubscriptionFormData } from "@/types/firestore";
import { doc, setDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const addSubscription = async (
  formData: SubscriptionFormData,
  adminId: string
) => {
  const now = Timestamp.now();
  const endsAtDate = new Date();
  endsAtDate.setMonth(endsAtDate.getMonth() + formData.months);
  const endsAt = Timestamp.fromDate(endsAtDate);
  
  await setDoc(doc(db, "subscriptions", formData.userId), {
    userId: formData.userId,
    adminId: adminId,
    educationalLevelId: formData.educationalLevelId,
    startsAt: now,
    endsAt: endsAt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
```

---

## الدعم والمساعدة

إذا واجهت أي مشاكل أو لديك أسئلة حول استخدام هذه الـ schemas، يرجى مراجعة:
- ملف `firestore.rules` لفهم قواعد الأمان
- ملفات الإدارة في `app/admin/` لأمثلة عملية
- ملفات الصفحات في `app/videos/`, `app/courses/`, `app/tests/` لأمثلة على القراءة

