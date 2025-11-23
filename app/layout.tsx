import type { Metadata, Viewport } from "next";
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
  title: {
    default: "علاء أبو الدهب - مدرس لغة إنجليزية",
    template: "%s | علاء أبو الدهب",
  },
  description: "موقع تعليمي متخصص في اللغة الإنجليزية للمرحلة الإعدادية والثانوية. فيديوهات تعليمية، كورسات متخصصة، واختبارات تفاعلية",
  keywords: ["تعليم إنجليزي", "لغة إنجليزية", "مرحلة إعدادية", "مرحلة ثانوية", "كورسات إنجليزية", "فيديوهات تعليمية"],
  authors: [{ name: "علاء أبو الدهب" }],
  creator: "علاء أبو الدهب",
  publisher: "علاء أبو الدهب",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: '/',
    title: 'علاء أبو الدهب - مدرس لغة إنجليزية',
    description: 'موقع تعليمي متخصص في اللغة الإنجليزية للمرحلة الإعدادية والثانوية',
    siteName: 'علاء أبو الدهب',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'علاء أبو الدهب - مدرس لغة إنجليزية',
    description: 'موقع تعليمي متخصص في اللغة الإنجليزية للمرحلة الإعدادية والثانوية',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="overflow-x-hidden">
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
      <body className={`${cairo.className} overflow-x-hidden max-w-full`}>
        <ThemeProvider>
          <div className="overflow-x-hidden max-w-full w-full">
            <Navbar />
            <main className="bg-gray-50 dark:bg-gray-900 overflow-x-hidden max-w-full w-full">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

