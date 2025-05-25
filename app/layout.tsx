import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { AuthProvider } from "@/contexts/auth-kit-context"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"
import { sdk } from "@farcaster/frame-sdk"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BrainCast - Interactive Quizzes",
  description: "Test your knowledge and learn with interactive quizzes on BrainCast.",
  generator: 'v0.dev',
  other: {
    'fc:frame': JSON.stringify({
      image: 'https://lqy3lriiybxcejon.public.blob.vercel-storage.com/RBv8coHVCER8/farquiz_icon-IXTBuZNFH0DudhmcvziRZArAtuvCWn.png?reUe',
      buttons: [{ label: 'Start Quiz' }],
      post: { title: 'FarQuiz' }
    })
  }
}

function InitFarcaster() {
  useEffect(() => {
    // Hide splash screen when app is ready
    sdk.actions.ready();
  }, []);
  return null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-900 text-white min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <InitFarcaster />
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
