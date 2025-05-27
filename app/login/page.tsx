// app/login/page.tsx
import { AuthStatus } from "@/components/auth-status"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to FarQuiz</h1>
        <AuthStatus />
      </div>
    </div>
  )
}