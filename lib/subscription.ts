import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

/**
 * التحقق من صحة الاشتراك للمستخدم في مرحلة تعليمية معينة
 * @param user - المستخدم الحالي
 * @param educationalLevelId - معرف المرحلة التعليمية المطلوبة
 * @returns true إذا كان المستخدم لديه اشتراك صالح للمرحلة التعليمية
 */
export async function hasValidSubscription(
  user: User | null,
  educationalLevelId: string | null | undefined
): Promise<boolean> {
  // التحقق من وجود المستخدم
  if (!user || !educationalLevelId) {
    return false;
  }

  try {
    // جلب وثيقة الاشتراك
    const subscriptionRef = doc(db, "subscriptions", user.uid);
    const subscriptionDoc = await getDoc(subscriptionRef);

    // التحقق من وجود وثيقة الاشتراك
    if (!subscriptionDoc.exists()) {
      return false;
    }

    const subscriptionData = subscriptionDoc.data();

    // التحقق من وجود حقل educationalLevelId
    if (!subscriptionData.educationalLevelId) {
      return false;
    }

    // التحقق من مطابقة المرحلة التعليمية
    if (subscriptionData.educationalLevelId !== educationalLevelId) {
      return false;
    }

    // التحقق من تاريخ الانتهاء
    const endsAt = subscriptionData.endsAt as Timestamp | null;
    if (!endsAt) {
      return false;
    }

    const endsAtDate = endsAt.toDate();
    const now = new Date();

    // التحقق من أن الاشتراك لم ينتهِ
    if (endsAtDate <= now) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
}

/**
 * جلب معلومات الاشتراك للمستخدم
 * @param user - المستخدم الحالي
 * @returns معلومات الاشتراك أو null إذا لم يكن هناك اشتراك
 */
export async function getSubscription(user: User | null) {
  if (!user) {
    return null;
  }

  try {
    const subscriptionRef = doc(db, "subscriptions", user.uid);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      return null;
    }

    const data = subscriptionDoc.data();
    return {
      id: subscriptionDoc.id,
      userId: data.userId,
      educationalLevelId: data.educationalLevelId,
      startsAt: data.startsAt?.toDate(),
      endsAt: data.endsAt?.toDate(),
      ...data,
    };
  } catch (error) {
    console.error("Error getting subscription:", error);
    return null;
  }
}

