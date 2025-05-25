import type React from "react"
import { Loader2, Cast } from "lucide-react"

export const Icons = {
  spinner: Loader2,
  farcaster: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 12h12" />
      <path d="M6 16h12" />
      <path d="M6 8h12" />
      <path d="M18 3l-3 3 3 3" />
    </svg>
  ),
  cast: Cast,
}
