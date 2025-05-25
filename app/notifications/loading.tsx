import { Spinner } from "@/components/ui/spinner"

export default function NotificationsLoading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    </div>
  )
}
