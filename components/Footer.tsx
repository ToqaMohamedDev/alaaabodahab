"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Facebook, Youtube, Instagram, Phone, Mail } from "lucide-react";

const Footer = () => {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");
  
  if (isAuthPage) {
    return null;
  }

  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      href: "#", // سيتم تحديثه لاحقاً
      color: "hover:text-blue-600",
    },
    {
      name: "YouTube",
      icon: Youtube,
      href: "#", // سيتم تحديثه لاحقاً
      color: "hover:text-red-600",
    },
    {
      name: "Instagram",
      icon: Instagram,
      href: "#", // سيتم تحديثه لاحقاً
      color: "hover:text-pink-600",
    },
  ];

  return (
    <footer className="bg-gray-900 dark:bg-black text-white mt-0 border-t border-gray-800 dark:border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* معلومات المدرس */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-bold mb-4 text-white">علاء أبو الدهب</h3>
            <p className="text-gray-400 dark:text-gray-500 mb-4">
              مدرس لغة إنجليزية متخصص في المرحلة الإعدادية والثانوية
            </p>
            <div className="flex items-center space-x-2 space-x-reverse text-gray-400 dark:text-gray-500">
              <Phone className="h-4 w-4" />
              <span>+20 XXX XXX XXXX</span>
            </div>
          </motion.div>

          {/* روابط سريعة */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-xl font-bold mb-4 text-white">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/videos" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition-colors">
                  الفيديوهات والكورسات
                </Link>
              </li>
              <li>
                <Link href="/tests" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition-colors">
                  الاختبارات
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition-colors">
                  التواصل
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* التواصل الاجتماعي */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-bold mb-4 text-white">تابعنا</h3>
            <div className="flex space-x-4 space-x-reverse">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.2, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className={`${social.color} dark:text-gray-400 transition-colors`}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="border-t border-gray-800 dark:border-gray-900 mt-8 pt-8 text-center text-gray-400 dark:text-gray-600">
          <p>&copy; {new Date().getFullYear()} علاء أبو الدهب. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

