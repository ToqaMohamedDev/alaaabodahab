"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, BookOpen, Video, FileText, Mail, User, Home, Sun, Moon, LogIn, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sync with actual DOM state
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setCurrentTheme(isDark ? "dark" : "light");
    };
    
    checkTheme();
    
    // Watch for changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => observer.disconnect();
  }, []);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const roleDoc = await getDoc(doc(db, "roles", user.uid));
        setIsAdmin(roleDoc.exists() && roleDoc.data()?.role === "admin");
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    if (!loading && user) {
      checkAdminStatus();
    }
  }, [user, loading]);

  const handleToggle = () => {
    console.log("🔄 Toggle clicked! Current theme:", theme);
    console.log("📋 HTML classes before:", document.documentElement.classList.toString());
    console.log("📋 Has dark class before?", document.documentElement.classList.contains("dark"));
    
    toggleTheme();
    
    // Check multiple times to ensure it's applied
    setTimeout(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setCurrentTheme(isDark ? "dark" : "light");
      console.log("📋 HTML classes after:", document.documentElement.classList.toString());
      console.log("📋 Has dark class after?", isDark);
      console.log("🎨 Theme state:", isDark ? "dark" : "light");
      
      // Force check again after a bit
      setTimeout(() => {
        const isDarkAgain = document.documentElement.classList.contains("dark");
        console.log("📋 Final check - Has dark class?", isDarkAgain);
        setCurrentTheme(isDarkAgain ? "dark" : "light");
      }, 100);
    }, 100);
  };

  const navItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/videos", label: "الفيديوهات والكورسات", icon: Video },
    { href: "/tests", label: "الاختبارات", icon: FileText },
    { href: "/contact", label: "التواصل", icon: Mail },
    { href: "/about", label: "عن الموقع", icon: BookOpen },
  ];

  // إضافة رابط لوحة التحكم فقط للأدمن
  const adminNavItems = [
    ...navItems,
    { href: "/admin/dashboard", label: "لوحة التحكم", icon: Shield },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg dark:shadow-gray-900/50 sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-700/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3 space-x-reverse group">
            <motion.div
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary-600/20 rounded-lg blur-lg group-hover:bg-primary-600/30 transition-colors" />
              <BookOpen className="h-9 w-9 text-primary-600 dark:text-primary-400 relative z-10 drop-shadow-sm" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-600 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent group-hover:from-primary-600 group-hover:to-primary-500 dark:group-hover:from-primary-300 dark:group-hover:to-primary-200 transition-all">
                علاء أبو الدهب
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                تعليم اللغة الإنجليزية
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-3 space-x-reverse">
            <div className="flex items-center space-x-1 space-x-reverse bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1.5 border border-gray-200/50 dark:border-gray-700/50">
              {(isAdmin ? adminNavItems : navItems).map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-primary-600 dark:bg-primary-700 text-white shadow-lg shadow-primary-500/30 dark:shadow-primary-700/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/50 hover:text-primary-600 dark:hover:text-primary-400"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary-600 dark:bg-primary-700 rounded-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className={`h-4 w-4 relative z-10 ${isActive ? "text-white" : ""}`} />
                    <span className={`text-sm font-semibold relative z-10 ${isActive ? "text-white" : ""}`}>
                      {item.label}
                    </span>
                  </motion.div>
                </Link>
              );
              })}
            </div>

            {/* Login/Profile Button */}
            {!loading && (
              <Link href={user ? "/profile" : "/auth/login"}>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex items-center space-x-2 space-x-reverse px-5 py-2.5 rounded-xl transition-all duration-300 overflow-hidden group ${
                    user
                      ? "bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white shadow-lg shadow-primary-500/30 dark:shadow-primary-700/30"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                  />
                  {user ? (
                    <>
                      <User className="h-4 w-4 relative z-10" />
                      <span className="text-sm font-semibold relative z-10">البروفايل</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 relative z-10" />
                      <span className="text-sm font-semibold relative z-10">تسجيل الدخول</span>
                    </>
                  )}
                </motion.button>
              </Link>
            )}

            {/* Dark Mode Toggle - في النهاية */}
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggle();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative ml-4 w-14 h-7 rounded-full cursor-pointer z-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 overflow-hidden"
              aria-label="Toggle theme"
              type="button"
            >
              {/* Track Background with Inset Shadow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.25)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] border border-gray-400/30 dark:border-gray-600/30" />
              
              {/* Stars Background for Dark Mode */}
              {currentTheme === "dark" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 rounded-full overflow-hidden"
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 0.7, 1, 0],
                        scale: [0, 1.2, 1, 1.2, 0],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeInOut",
                      }}
                      className="absolute w-1 h-1 bg-yellow-300 rounded-full shadow-[0_0_4px_rgba(253,224,71,0.8)]"
                      style={{
                        top: `${25 + (i * 15)}%`,
                        left: `${10 + (i * 12)}%`,
                      }}
                    />
                  ))}
                </motion.div>
              )}
              
              {/* Toggle Circle Container */}
              <div className="absolute inset-0 p-1 pointer-events-none">
                <motion.div
                  initial={false}
                  animate={{
                    x: currentTheme === "dark" ? 24 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    mass: 0.8,
                  }}
                  className="relative w-5 h-5 rounded-full"
                >
                  {/* Circle Shadow */}
                  <div className="absolute inset-0 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.3)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
                  
                  {/* Main Circle */}
                  <motion.div
                    animate={{
                      background: currentTheme === "dark" 
                        ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)"
                        : "linear-gradient(135deg, #f9fafb 0%, #e5e7eb 50%, #d1d5db 100%)",
                    }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-full border-2 border-white/40 dark:border-yellow-200/30"
                  >
                    {/* Inner Glow */}
                    <motion.div
                      animate={{
                        opacity: currentTheme === "dark" ? [0.4, 0.7, 0.4] : [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-[2px] rounded-full bg-white/30 dark:bg-yellow-200/40 blur-sm"
                    />
                    
                    {/* Icon Container */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{
                          rotate: currentTheme === "dark" ? 0 : 180,
                          scale: currentTheme === "dark" ? 1 : 0.85,
                        }}
                        transition={{ 
                          duration: 0.5,
                          ease: "easeInOut"
                        }}
                      >
                        {currentTheme === "dark" ? (
                          <Sun className="h-3 w-3 text-yellow-900 drop-shadow-sm" fill="currentColor" />
                        ) : (
                          <Moon className="h-3 w-3 text-gray-600 drop-shadow-sm" fill="currentColor" />
                        )}
                      </motion.div>
                    </div>
                    
                    {/* Shine Effect */}
                    <motion.div
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        x: [-1, 1, -1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute top-[2px] left-[2px] right-[2px] h-[40%] rounded-t-full bg-gradient-to-b from-white/60 to-transparent dark:from-yellow-100/50"
                    />
                  </motion.div>
                </motion.div>
              </div>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3 space-x-reverse">
            {/* Login/Profile Button for Mobile */}
            {!loading && (
              <Link href={user ? "/profile" : "/auth/login"}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    user
                      ? "bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white shadow-lg shadow-primary-500/30"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {user ? <User className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                </motion.button>
              </Link>
            )}
            
            {/* Dark Mode Toggle for Mobile */}
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggle();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative w-14 h-7 rounded-full cursor-pointer z-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 overflow-hidden"
              aria-label="Toggle theme"
              type="button"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.25)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] border border-gray-400/30 dark:border-gray-600/30" />
              <motion.div
                initial={false}
                animate={{
                  x: currentTheme === "dark" ? 28 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 35,
                }}
                className="relative w-5 h-5 rounded-full"
              >
                <motion.div
                  animate={{
                    background: currentTheme === "dark" 
                      ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)"
                      : "linear-gradient(135deg, #f9fafb 0%, #e5e7eb 50%, #d1d5db 100%)",
                  }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 rounded-full border-2 border-white/40 dark:border-yellow-200/30 shadow-lg"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {currentTheme === "dark" ? (
                      <Sun className="h-3 w-3 text-yellow-900" fill="currentColor" />
                    ) : (
                      <Moon className="h-3 w-3 text-gray-600" fill="currentColor" />
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </motion.button>
            
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden border-t border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
        >
          <div className="px-4 pt-4 pb-6 space-y-2">
            {(isAdmin ? adminNavItems : navItems).map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 5 }}
                    className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white shadow-lg shadow-primary-500/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-white" : ""}`} />
                    <span className={`font-semibold ${isActive ? "text-white" : ""}`}>{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
            {/* Login/Profile in Mobile Menu */}
            {!loading && (
              <Link
                href={user ? "/profile" : "/auth/login"}
                onClick={() => setIsOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (isAdmin ? adminNavItems : navItems).length * 0.05 }}
                  whileHover={{ x: 5 }}
                  className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-xl transition-all duration-300 ${
                    pathname === "/profile" || pathname === "/auth/login"
                      ? "bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white shadow-lg shadow-primary-500/30"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {user ? (
                    <>
                      <User className="h-5 w-5" />
                      <span className="font-semibold">البروفايل</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      <span className="font-semibold">تسجيل الدخول</span>
                    </>
                  )}
                </motion.div>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;

