import { useState } from "react"
import AppHeader from "./AppHeader"
import SideMenu from "./SideMenu"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <AppHeader onMenuClick={() => setMenuOpen(true)} />
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      {children}
    </div>
  )
}
