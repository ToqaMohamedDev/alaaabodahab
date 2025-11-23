"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, Timestamp, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { MessageSquare, Mail, User, Clock, CheckCircle, Circle, Eye, Copy, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | null;
}

export default function MessagesManagement() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [loadingData, setLoadingData] = useState(true);

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

      fetchMessages();
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      router.push("/");
    } finally {
      setCheckingAdmin(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingData(true);
      
      // محاولة جلب الرسائل مع الترتيب
      let messagesSnapshot;
      try {
        messagesSnapshot = await getDocs(
          query(collection(db, "messages"), orderBy("createdAt", "desc"))
        );
      } catch (error: any) {
        // إذا فشل بسبب index، نجلب بدون ترتيب
        if (error.code === "failed-precondition" || error.message?.includes("index")) {
          messagesSnapshot = await getDocs(collection(db, "messages"));
        } else {
          throw error;
        }
      }
      
      // ترتيب الرسائل في JavaScript إذا لم يكن هناك ترتيب من Firestore
      const messagesData = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      
      // ترتيب حسب التاريخ
      messagesData.sort((a, b) => {
        const aDate = a.createdAt?.toMillis?.() || 
                     (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
                     0;
        const bDate = b.createdAt?.toMillis?.() || 
                     (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
                     0;
        return bDate - aDate; // ترتيب تنازلي
      });
      
      setMessages(messagesData);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const markAsRead = async (messageId: string) => {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === "read") return msg.read;
    if (filter === "unread") return !msg.read;
    return true;
  });

  const unreadCount = messages.filter((msg) => !msg.read).length;

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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link href="/admin/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <ArrowLeft className="h-5 w-5" />
                </motion.button>
              </Link>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-2 space-x-reverse">
                  <MessageSquare className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                  <span>إدارة الرسائل</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  عرض وإدارة جميع الرسائل الواردة
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
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
        </motion.div>

        {/* Messages List */}
        {loadingData ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : (
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
                    } ${!message.read ? "border-r-4 border-primary-500" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {!message.read && (
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
                      {message.read && (
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
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedMessage.userName}
                        </h2>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 mb-2">
                        <Mail className="h-4 w-4" />
                        <span>{selectedMessage.userEmail}</span>
                      </div>
                      {selectedMessage.userId && (
                        <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                          <User className="h-4 w-4" />
                          <span className="font-mono text-sm">ID: {selectedMessage.userId}</span>
                          <button
                            onClick={() => copyToClipboard(selectedMessage.userId || "")}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                            title="نسخ ID"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
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
                  </div>

                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500 dark:text-gray-500 mb-4">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(selectedMessage.createdAt)}</span>
                      {selectedMessage.read && (
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
        )}
      </div>
    </div>
  );
}

