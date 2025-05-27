
import { redirect } from "next/navigation"

export default async function SignUpPage() {
  const supabase = createClient()

  // Check if user is already logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignUpForm />
    </div>
  )
}
