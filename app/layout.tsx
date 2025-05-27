// app/layout.tsx
import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { SimplifiedAuthProvider } from "@/contexts/simplified-auth-context"
import { Toaster } from "@/components/ui/toaster"
import { FarcasterInit } from "./components/farcaster-init"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FarQuiz - Interactive Quizzes on Farcaster",
  description: "Test your knowledge and compete with friends using interactive quizzes on Farcaster. Challenge friends, climb leaderboards, and unlock achievements!",
  generator: 'Next.js',
  keywords: ["quiz", "trivia", "farcaster", "competition", "education", "games"],
  authors: [{ name: "FarQuiz Team" }],
  creator: "FarQuiz",
  publisher: "FarQuiz",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'FarQuiz - Interactive Quizzes on Farcaster',
    description: 'Test your knowledge and compete with friends using interactive quizzes on Farcaster',
    siteName: 'FarQuiz',
    images: [
      {
        url: 'https://lqy3lriiybxcejon.public.blob.vercel-storage.com/RBv8coHVCER8/farquiz_share_image-gNEfyJSjiSBnqxdOtSD4uWjQbT4mhy.png?GdgB',
        width: 1200,
        height: 630,
        alt: 'FarQuiz - Interactive Quizzes'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FarQuiz - Interactive Quizzes on Farcaster',
    description: 'Test your knowledge and compete with friends using interactive quizzes on Farcaster',
    images: ['https://lqy3lriiybxcejon.public.blob.vercel-storage.com/RBv8coHVCER8/farquiz_share_image-gNEfyJSjiSBnqxdOtSD4uWjQbT4mhy.png?GdgB']
  },
  other: {
    'fc:frame': JSON.stringify({
      version: 'next',
      imageUrl: 'https://lqy3lriiybxcejon.public.blob.vercel-storage.com/RBv8coHVCER8/farquiz_share_image-gNEfyJSjiSBnqxdOtSD4uWjQbT4mhy.png?GdgB',
      button: {
        title: '🧠 Start Quizzing',
        action: {
          type: 'launch_frame',
          name: 'FarQuiz',
          url: 'https://farquiz-miniapp-y88k.vercel.app/?utm_source=farcaster&utm_medium=frame_home',
          splashImageUrl: 'https://lqy3lriiybxcejon.public.blob.vercel-storage.com/RBv8coHVCER8/farquiz_splash-h61l64V89HzQsrn3v0Ey1RJGCVtPvq.png?Ik5m',
          splashBackgroundColor: '#8B5CF6'
        }
      }
    })
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-900 text-white min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SimplifiedAuthProvider>
            <FarcasterInit />
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <MobileNav />
            </div>
            <Toaster />
          </SimplifiedAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}