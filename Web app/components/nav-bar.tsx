import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HomeIcon, SettingsIcon, LayoutDashboardIcon } from "lucide-react"

export default function NavBar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">
          Opportunity Desk
        </Link>

        <div className="flex gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <HomeIcon size={16} />
              Dashboard
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <Link href="/setup" className="flex items-center gap-2">
              <LayoutDashboardIcon size={16} />
              Setup
            </Link>
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings" className="flex items-center gap-2">
              <SettingsIcon size={16} />
              Settings
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
