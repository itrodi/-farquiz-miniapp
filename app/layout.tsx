import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { AuthProvider } from "@/contexts/auth-kit-context"
import { Toaster } from "@/components/ui/toaster"
import { FarcasterInit } from "./components/farcaster-init"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FarQuiz - Interactive Quizzes",
  description: "Test your knowledge and learn with interactive quizzes on FarQuiz.",
  generator: 'v0.dev',
  other: {
    'fc:frame': JSON.stringify({
      version: 'next',
      imageUrl: 'https://lqy3lriiybxcejon.public.blob.vercel-storage.com/RBv8coHVCER8/farquiz_share_image-gNEfyJSjiSBnqxdOtSD4uWjQbT4mhy.png?GdgB',
      button: {
        title: 'Start Quiz',
        action: {
          type: 'launch_frame',
          name: 'FarQuiz',
          url: 'https://farquiz-miniapp-y88k.vercel.app/',
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
          <AuthProvider>
            <FarcasterInit />
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <MobileNav />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
