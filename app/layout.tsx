import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";

const cairo = Cairo({ 
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "علاء أبو الدهب - مدرس لغة إنجليزية",
  description: "موقع تعليمي متخصص في اللغة الإنجليزية للمرحلة الإعدادية والثانوية",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const root = document.documentElement;
                  
                  // Force remove both classes first
                  root.classList.remove('light', 'dark');
                  
                  // Force a reflow
                  void root.offsetHeight;
                  
                  // Only use system preference if no saved theme
                  if (savedTheme === 'dark') {
                    root.classList.add('dark');
                    root.setAttribute('data-theme', 'dark');
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.add('light');
                    root.setAttribute('data-theme', 'light');
                    root.style.colorScheme = 'light';
                  }
                  
                  // Force another reflow
                  void root.offsetHeight;
                } catch (e) {
                  // Fallback to light on error
                  const root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  root.classList.add('light');
                  root.setAttribute('data-theme', 'light');
                  root.style.colorScheme = 'light';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={cairo.className}>
        <ThemeProvider>
          <Navbar />
          <main className="bg-gray-50 dark:bg-gray-900">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

