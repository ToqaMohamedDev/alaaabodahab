"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { GraduationCap, Award, BookOpen, Users, Target, Heart } from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      icon: GraduationCap,
      title: "خبرة واسعة",
      description: "سنوات من الخبرة في تدريس اللغة الإنجليزية للمرحلة الإعدادية والثانوية",
    },
    {
      icon: BookOpen,
      title: "محتوى شامل",
      description: "محتوى تعليمي متنوع يشمل فيديوهات، كورسات، واختبارات تفاعلية",
    },
    {
      icon: Target,
      title: "أهداف واضحة",
      description: "نساعدك في تحقيق أهدافك في إتقان اللغة الإنجليزية",
    },
    {
      icon: Heart,
      title: "شغف بالتعليم",
      description: "نؤمن بأن التعليم يجب أن يكون ممتعاً ومفيداً في نفس الوقت",
    },
  ];

  const values = [
    {
      title: "الجودة",
      description: "نقدم محتوى عالي الجودة يلبي احتياجات الطلاب",
    },
    {
      title: "الالتزام",
      description: "نلتزم بمساعدة كل طالب في تحقيق أهدافه التعليمية",
    },
    {
      title: "الابتكار",
      description: "نستخدم أحدث الطرق والأساليب التعليمية",
    },
    {
      title: "الدعم",
      description: "نقدم الدعم المستمر للطلاب في رحلتهم التعليمية",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              عن الموقع
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto">
              مرحباً بك في موقع علاء أبو الدهب - منصة تعليمية متخصصة في اللغة الإنجليزية
            </p>
          </motion.div>
        </div>
      </section>

      {/* About Teacher */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                عن المدرس
              </h2>
              <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300">
                <p>
                  أنا <strong className="text-primary-700 dark:text-primary-400">علاء أبو الدهب</strong>،
                  مدرس لغة إنجليزية متخصص في تدريس المرحلة الإعدادية والثانوية.
                  لدي شغف كبير بالتعليم وأؤمن بأن كل طالب لديه القدرة على إتقان
                  اللغة الإنجليزية.
                </p>
                <p>
                  من خلال هذا الموقع، أقدم محتوى تعليمي شامل ومتنوع يشمل فيديوهات
                  تعليمية، كورسات متخصصة، واختبارات تفاعلية لمساعدتك في رحلتك
                  التعليمية.
                </p>
                <p>
                  هدفي هو جعل تعلم اللغة الإنجليزية ممتعاً وسهلاً لجميع الطلاب،
                  بغض النظر عن مستواهم الحالي.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-800 rounded-2xl p-8 shadow-2xl dark:shadow-gray-900/50">
                <div className="aspect-square bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                  <Image
                    src="/images/photo_2025-11-23 07.19.31.jpeg"
                    alt="علاء أبو الدهب"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              لماذا تختارنا؟
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              نقدم تجربة تعليمية فريدة ومميزة
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 text-center border border-gray-200 dark:border-gray-700"
                >
                  <div className="bg-primary-100 dark:bg-primary-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              قيمنا
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              المبادئ التي نؤمن بها ونعمل بها
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 border border-primary-200 dark:border-gray-600"
              >
                <h3 className="text-2xl font-bold text-primary-900 dark:text-primary-100 mb-4">
                  {value.title}
                </h3>
                <p className="text-lg text-gray-700 dark:text-gray-300">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8 }}
          >
            <Award className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-6">رسالتنا</h2>
            <p className="text-xl text-gray-100 leading-relaxed">
              نسعى إلى توفير أفضل تجربة تعليمية ممكنة لطلاب اللغة الإنجليزية في
              المرحلة الإعدادية والثانوية. نؤمن بأن التعليم يجب أن يكون متاحاً
              للجميع، وأن كل طالب لديه القدرة على النجاح والتميز.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

