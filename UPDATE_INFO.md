# تحديث معلومات الموقع

## معلومات تحتاج إلى تحديث

### 1. رقم الهاتف

**الملفات التي تحتاج تحديث:**
- `components/Footer.tsx` - السطر 46
- `app/contact/page.tsx` - ابحث عن "+20 XXX XXX XXXX"

**مثال:**
```tsx
<span>+20 123 456 7890</span>
```

### 2. روابط التواصل الاجتماعي

**الملف:** `components/Footer.tsx` - السطور 10-27

**مثال:**
```tsx
const socialLinks = [
  {
    name: "Facebook",
    icon: Facebook,
    href: "https://www.facebook.com/your-page", // حدث هذا
    color: "hover:text-blue-600",
  },
  {
    name: "YouTube",
    icon: Youtube,
    href: "https://www.youtube.com/@your-channel", // حدث هذا
    color: "hover:text-red-600",
  },
  {
    name: "Instagram",
    icon: Instagram,
    href: "https://www.instagram.com/your-account", // حدث هذا
    color: "hover:text-pink-600",
  },
];
```

### 3. البريد الإلكتروني

**الملف:** `components/Footer.tsx` و `app/contact/page.tsx`

ابحث عن:
```tsx
info@alaaabodahab.com
```
واستبدله ببريدك الإلكتروني الفعلي.

### 4. إضافة TikTok

إذا أردت إضافة رابط TikTok، يمكنك:

1. استيراد أيقونة TikTok من `lucide-react` أو استخدام أيقونة عامة
2. إضافة رابط جديد في `socialLinks`:

```tsx
import { Facebook, Youtube, Instagram, Phone, Mail, Music } from "lucide-react";

// في socialLinks array:
{
  name: "TikTok",
  icon: Music, // أو أي أيقونة مناسبة
  href: "https://www.tiktok.com/@your-account",
  color: "hover:text-black",
}
```

### 5. تحديث الإحصائيات

**الملف:** `app/page.tsx` - السطور 30-35

يمكنك تحديث الأرقام في قسم الإحصائيات:
```tsx
const stats = [
  { icon: Users, value: "500+", label: "طالب" },
  { icon: Video, value: "100+", label: "فيديو" },
  { icon: BookOpen, value: "50+", label: "كورس" },
  { icon: Award, value: "95%", label: "نسبة النجاح" },
];
```

### 6. تحديث النصوص

جميع النصوص موجودة في:
- `app/page.tsx` - الصفحة الرئيسية
- `app/about/page.tsx` - صفحة عن الموقع
- `app/contact/page.tsx` - صفحة التواصل

يمكنك تحديث أي نص حسب احتياجك.

## ملاحظات

- بعد أي تحديث، احفظ الملفات وأعد تحميل الصفحة في المتصفح
- تأكد من أن الروابط صحيحة وتعمل قبل النشر
- يمكنك تخصيص الألوان من `tailwind.config.ts`

