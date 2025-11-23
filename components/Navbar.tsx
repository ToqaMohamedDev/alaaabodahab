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
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 space-x-reverse">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <BookOpen className="h-8 w-8 text-primary-600" />
            </motion.div>
            <span className="text-xl font-bold text-primary-700 dark:text-primary-400">
              علاء أبو الدهب
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2 space-x-reverse">
            <div className="flex space-x-1 space-x-reverse">
              {(isAdmin ? adminNavItems : navItems).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center space-x-1 space-x-reverse px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-primary-600 dark:bg-primary-700 text-white shadow-md"
                        : "text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
              })}
            </div>

            {/* Login/Profile Button */}
            {!loading && (
              <Link href={user ? "/profile" : "/auth/login"} className="ml-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-200 ${
                    user
                      ? "bg-primary-600 dark:bg-primary-700 text-white shadow-md hover:bg-primary-700 dark:hover:bg-primary-600"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {user ? (
                    <>
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">البروفايل</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span className="text-sm font-medium">تسجيل الدخول</span>
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
          <div className="md:hidden flex items-center space-x-2 space-x-reverse">
            {/* Login/Profile Button for Mobile */}
            {!loading && (
              <Link href={user ? "/profile" : "/auth/login"}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    user
                      ? "bg-primary-600 dark:bg-primary-700 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700 p-1 transition-colors duration-300 cursor-pointer z-10 overflow-hidden"
              aria-label="Toggle theme"
              type="button"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-800 shadow-inner border border-gray-400/20 dark:border-gray-600/20 pointer-events-none z-10" />
              <motion.div
                layout
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                className={`relative w-4 h-4 rounded-full shadow-lg pointer-events-none z-20 ${
                  currentTheme === "dark"
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-500"
                    : "bg-gradient-to-br from-gray-50 to-gray-100"
                }`}
                style={{
                  x: currentTheme === "dark" ? 20 : 0,
                }}
              >
                <div className="absolute inset-0 rounded-full bg-white/30 dark:bg-yellow-300/30 blur-sm" />
                <motion.div
                  initial={false}
                  animate={{
                    rotate: currentTheme === "dark" ? 0 : 180,
                  }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {currentTheme === "dark" ? (
                    <Sun className="h-2.5 w-2.5 text-yellow-900" fill="currentColor" />
                  ) : (
                    <Moon className="h-2.5 w-2.5 text-gray-600" fill="currentColor" />
                  )}
                </motion.div>
              </motion.div>
            </motion.button>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {(isAdmin ? adminNavItems : navItems).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-primary-600 dark:bg-primary-700 text-white shadow-md"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
            {/* Login/Profile in Mobile Menu */}
            {!loading && (
              <Link
                href={user ? "/profile" : "/auth/login"}
                onClick={() => setIsOpen(false)}
              >
                <div
                  className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg transition-all duration-200 ${
                    pathname === "/profile" || pathname === "/auth/login"
                      ? "bg-primary-600 dark:bg-primary-700 text-white shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {user ? (
                    <>
                      <User className="h-5 w-5" />
                      <span>البروفايل</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      <span>تسجيل الدخول</span>
                    </>
                  )}
                </div>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;

