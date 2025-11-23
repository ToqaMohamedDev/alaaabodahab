"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { MessageSquare, Mail, User, Clock, CheckCircle, Circle, Eye } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Message {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | null;
}

function MessagesPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      checkAdminStatus();
      fetchMessages();
    }
  }, [user, loading]);

  const checkAdminStatus = async () => {
    if (!user) return;
    try {
      const roleDoc = await getDoc(doc(db, "roles", user.uid));
      setIsAdmin(roleDoc.exists() && roleDoc.data()?.role === "admin");
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;

    try {
      setLoadingMessages(true);
      let messagesQuery;

      if (isAdmin) {
        // الأدمن يرى كل الرسائل
        messagesQuery = query(
          collection(db, "messages"),
          orderBy("createdAt", "desc")
        );
      } else {
        // المستخدم العادي يرى رسائله فقط
        messagesQuery = query(
          collection(db, "messages"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
      }

      const snapshot = await getDocs(messagesQuery);
      const messagesData: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      setMessages(messagesData);
      setError("");
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      setError("حدث خطأ أثناء جلب الرسائل");
      
      // إذا فشل الاستعلام بسبب عدم وجود userId، نجرب استعلام آخر
      if (error.code === "failed-precondition" || error.code === "unavailable") {
        try {
          // محاولة جلب الرسائل بدون orderBy إذا فشل الاستعلام المركب
          const messagesQuery = query(
            collection(db, "messages"),
            where("userEmail", "==", user.email)
          );
          const snapshot = await getDocs(messagesQuery);
          const messagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Message[];
          
          // ترتيب الرسائل حسب التاريخ
          messagesData.sort((a, b) => {
            const aTime = a.createdAt?.toMillis() || 0;
            const bTime = b.createdAt?.toMillis() || 0;
            return bTime - aTime;
          });
          
          setMessages(messagesData);
          setError("");
        } catch (err: any) {
          console.error("Error fetching messages by email:", err);
          if (err.code !== "unavailable") {
            setError("حدث خطأ أثناء جلب الرسائل. يرجى المحاولة مرة أخرى.");
          }
        }
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin !== undefined) {
      fetchMessages();
    }
  }, [isAdmin]);

  const markAsRead = async (messageId: string) => {
    if (!isAdmin) return;

    try {
      await updateDoc(doc(db, "messages", messageId), {
        read: true,
      });
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
      );
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, read: true });
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const markAsUnread = async (messageId: string) => {
    if (!isAdmin) return;

    try {
      await updateDoc(doc(db, "messages", messageId), {
        read: false,
      });
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, read: false } : msg))
      );
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, read: false });
      }
    } catch (error) {
      console.error("Error marking message as unread:", error);
    }
  };

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "تاريخ غير محدد";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "اليوم";
    } else if (days === 1) {
      return "أمس";
    } else if (days < 7) {
      return `منذ ${days} أيام`;
    } else {
      return date.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === "read") return msg.read;
    if (filter === "unread") return !msg.read;
    return true;
  });

  const unreadCount = messages.filter((msg) => !msg.read).length;

  if (loading || loadingMessages) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                الرسائل
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {isAdmin ? "جميع الرسائل الواردة" : "رسائلك المرسلة"}
              </p>
            </div>
            {isAdmin && unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 space-x-reverse"
              >
                <Circle className="h-5 w-5 fill-current" />
                <span className="font-bold">{unreadCount}</span>
              </motion.div>
            )}
          </div>

          {/* Filters */}
          {isAdmin && (
            <div className="flex space-x-2 space-x-reverse mt-4">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === "all"
                    ? "bg-primary-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                الكل ({messages.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === "unread"
                    ? "bg-primary-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                غير المقروءة ({unreadCount})
              </button>
              <button
                onClick={() => setFilter("read")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === "read"
                    ? "bg-primary-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                المقروءة ({messages.filter((m) => m.read).length})
              </button>
            </div>
          )}
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200"
          >
            {error}
          </motion.div>
        )}

        {/* Messages List */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Messages Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-1 space-y-4"
          >
            {filteredMessages.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  لا توجد رسائل {filter !== "all" && filter === "unread" ? "غير مقروءة" : "مقروءة"}
                </p>
              </div>
            ) : (
              filteredMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedMessage(message)}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer transition hover:shadow-xl ${
                    selectedMessage?.id === message.id
                      ? "ring-2 ring-primary-500 dark:ring-primary-400"
                      : ""
                  } ${!message.read && isAdmin ? "border-r-4 border-primary-500" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {!message.read && isAdmin && (
                        <Circle className="h-4 w-4 text-primary-500 fill-current" />
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {message.userName}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {message.message}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(message.createdAt)}</span>
                    </div>
                    {message.read && isAdmin && (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Message Details */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2"
          >
            {selectedMessage ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedMessage.userName}
                      </h2>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span>{selectedMessage.userEmail}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-2 space-x-reverse">
                      {selectedMessage.read ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => markAsUnread(selectedMessage.id)}
                          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                          title="تحديد كغير مقروءة"
                        >
                          <Circle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => markAsRead(selectedMessage.id)}
                          className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition"
                          title="تحديد كمقروءة"
                        >
                          <CheckCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500 dark:text-gray-500 mb-4">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(selectedMessage.createdAt)}</span>
                    {selectedMessage.read && isAdmin && (
                      <>
                        <span>•</span>
                        <span className="text-green-500 flex items-center space-x-1 space-x-reverse">
                          <CheckCircle className="h-4 w-4" />
                          <span>مقروءة</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    الرسالة
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  اختر رسالة لعرض التفاصيل
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPageWrapper() {
  return (
    <ProtectedRoute>
      <MessagesPage />
    </ProtectedRoute>
  );
}

