# دليل الإعداد السريع

## الخطوات الأساسية

### 1. تثبيت الحزم

```bash
npm install
```

### 2. إعداد Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد أو استخدم مشروع موجود
3. فعّل Authentication:
   - اذهب إلى Authentication > Sign-in method
   - فعّل Email/Password
4. أنشئ Firestore Database:
   - اذهب إلى Firestore Database
   - أنشئ قاعدة بيانات في وضع Production أو Test mode
   - انسخ Security Rules من ملف `firestore.rules` والصقها في Firebase Console
5. احصل على معلومات المشروع:
   - اذهب إلى Project Settings > General
   - انسخ معلومات Firebase SDK
6. أنشئ ملف `.env.local` في جذر المشروع:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. تشغيل المشروع

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

## إعداد البيانات الأولية

بعد إعداد Firebase، ستحتاج إلى إضافة بعض البيانات الأولية:

### 1. إضافة مراحل تعليمية

في Firebase Console > Firestore Database، أضف مستندات في collection `educationalLevels`:

```javascript
// مثال:
{
  id: "prep",
  name: "الإعدادية",
  imageUrl: "",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}

{
  id: "secondary",
  name: "الثانوية",
  imageUrl: "",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

### 2. إضافة تصنيفات

أضف مستندات في collection `categories` للفيديوهات:

```javascript
{
  id: "grammar",
  name: "قواعد اللغة",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

### 3. إضافة أدمن

أضف مستند في collection `roles`:

```javascript
{
  role: "admin"
}
```

حيث document ID هو `uid` المستخدم الأدمن.

## ملاحظات مهمة

- تأكد من تحديث روابط التواصل الاجتماعي في `components/Footer.tsx`
- تأكد من تحديث رقم الهاتف في `components/Footer.tsx` و `app/contact/page.tsx`
- يمكنك تخصيص الألوان من `tailwind.config.ts`
- جميع الصفحات جاهزة وتعمل مع Firebase

## الدعم

إذا واجهت أي مشاكل، تأكد من:
1. أن جميع متغيرات البيئة صحيحة في `.env.local`
2. أن Security Rules تم تطبيقها بشكل صحيح
3. أن Authentication مفعّل في Firebase Console

