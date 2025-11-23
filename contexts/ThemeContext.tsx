"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Function to apply theme to document
  const applyTheme = (newTheme: Theme) => {
    if (typeof window === "undefined") return;
    
    try {
      const root = document.documentElement;
      console.log("🔧 Applying theme:", newTheme);
      console.log("📋 Before - HTML classes:", root.classList.toString());
      
      // Remove both classes first - FORCE removal
      root.classList.remove("light", "dark");
      
      // Force a reflow to ensure classes are removed
      void root.offsetHeight;
      
      // Add the appropriate class
      if (newTheme === "dark") {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.add("light");
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
      }
      
      // Force another reflow to ensure classes are applied
      void root.offsetHeight;
      
      console.log("📋 After - HTML classes:", root.classList.toString());
      console.log("📋 Has dark class?", root.classList.contains("dark"));
      console.log("✅ Theme applied successfully!");
    } catch (error) {
      console.error("❌ Error applying theme:", error);
    }
  };

  useEffect(() => {
    // Initialize theme from localStorage ONLY (no system preference)
    if (typeof window === "undefined") return;
    
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      
      // Default to light if no saved theme
      const initialTheme: Theme = savedTheme || "light";
      
      console.log("🎨 Initializing theme:", initialTheme);
      console.log("📋 Saved theme from localStorage:", savedTheme);
      
      // Apply theme immediately before setting state
      applyTheme(initialTheme);
      setTheme(initialTheme);
      setMounted(true);
      
      console.log("✅ Theme initialized, HTML classes:", document.documentElement.classList.toString());
    } catch (error) {
      console.error("❌ Error initializing theme:", error);
      // Force light mode on error
      if (typeof window !== "undefined") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
      setTheme("light");
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      // Save to localStorage
      localStorage.setItem("theme", theme);
      // Apply theme to document
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      // Calculate new theme based on PREVIOUS state (not current)
      const newTheme: Theme = prevTheme === "light" ? "dark" : "light";
      console.log("🔄 Toggle theme called");
      console.log("📋 Previous theme:", prevTheme);
      console.log("🎨 Switching to theme:", newTheme);
      
      // Apply immediately for better UX
      if (typeof window !== "undefined") {
        applyTheme(newTheme);
        // Save to localStorage immediately
        try {
          localStorage.setItem("theme", newTheme);
          console.log("💾 Theme saved to localStorage:", newTheme);
        } catch (e) {
          console.error("❌ Error saving theme:", e);
        }
      }
      
      return newTheme;
    });
  };

  // Always provide the context, even before mount
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

