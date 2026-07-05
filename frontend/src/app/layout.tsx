import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GlobalHeader from "@/components/Header/GlobalHeader";
import Footer from "@/components/Footer/Footer";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ 
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter", 
});

export const metadata: Metadata = {
  title: "Employment.kg — Поиск работы и сотрудников в Кыргызстане",
  description: "Портал поиска работы №1 в Кыргызстане. Вакансии, резюме, тренинги, курсы и многое другое для работодателей и соискателей.",
  keywords: "работа в кыргызстане, вакансии бишкек, резюме бишкек, найти сотрудников, работа кыргызстан, вакансии ош",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="shortcut icon" href="/favicon.png"/>
        <link rel="stylesheet" href="/css/fonts.css" />
        <link rel="stylesheet" href="/css/font-awesome.min.css" />
      </head>
      <body className={`${inter.variable} ${inter.className}`}>
        <AuthProvider>
          <GlobalHeader />
          <Toaster position="top-center" />
          <main className="flex-1 flex flex-col w-full min-h-screen">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
