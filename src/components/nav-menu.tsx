"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { Link } from "next-view-transitions"
import { useClerk, useUser } from "@clerk/nextjs"
import {
  CircleHelp,
  ClipboardCheck,
  Home,
  LogOut,
  PlusCircle,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import BrandLogo from "@/components/brand-logo"
import { isAdminUser } from "@/lib/admin"

type NavMenuContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const NavMenuContext = createContext<NavMenuContextValue | null>(null)

function useNavMenu() {
  const context = useContext(NavMenuContext)
  if (!context) {
    throw new Error("useNavMenu must be used within NavMenuProvider")
  }
  return context
}

const NAV_ITEMS: {
  href: string
  label: string
  icon: LucideIcon
}[] = [
  { href: "/nearby", label: "Home", icon: Home },
  { href: "/add", label: "Contribute", icon: PlusCircle },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/help", label: "Help", icon: CircleHelp },
]

type MenuToggleProps = {
  className?: string
  variant?: "onDark" | "onLight"
}

export function MenuToggle({ className, variant = "onDark" }: MenuToggleProps) {
  const { isOpen, toggle } = useNavMenu()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
        variant === "onDark" && "hover:bg-white/10",
        variant === "onLight" && "bg-white/95 shadow-md hover:bg-white",
        className
      )}
    >
      <span className="relative block h-5 w-6" aria-hidden>
        <span
          className={cn(
            "absolute left-0 top-0.5 block h-[3px] w-6 rounded-full bg-manago-orange transition-all duration-300 ease-out",
            isOpen && "top-[9px] rotate-45"
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-[9px] block h-[3px] w-6 rounded-full bg-manago-orange transition-all duration-300 ease-out",
            isOpen && "opacity-0 scale-x-0"
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-[17px] block h-[3px] w-6 rounded-full bg-manago-orange transition-all duration-300 ease-out",
            isOpen && "top-[9px] -rotate-45"
          )}
        />
      </span>
    </button>
  )
}

function NavDrawer() {
  const pathname = usePathname()
  const { isOpen, close } = useNavMenu()
  const { isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const showAdmin = isAdminUser(user)

  const items = showAdmin
    ? [
        ...NAV_ITEMS,
        {
          href: "/admin/submissions",
          label: "Approve facilities",
          icon: ClipboardCheck,
        },
      ]
    : NAV_ITEMS

  useEffect(() => {
    close()
  }, [pathname, close])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, close])

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ease-out",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
        aria-hidden={!isOpen}
      />

      <aside
        id="app-nav-drawer"
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex w-[min(78vw,20rem)] flex-col bg-manago-mint shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-5 pb-2 pt-6">
          <MenuToggle variant="onLight" className="bg-transparent shadow-none" />
          <BrandLogo variant="dark" />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-5 pt-8">
          {items.map(({ href, label, icon: Icon }, index) => {
            const isActive =
              href === "/nearby"
                ? pathname === "/" || pathname === "/nearby"
                : pathname.startsWith(href)

            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={cn(
                  "nav-drawer-link flex items-center gap-3.5 rounded-xl px-3 py-3.5 text-lg font-semibold tracking-tight text-manago-navy transition-all duration-200",
                  "hover:bg-white/40 active:scale-[0.98]",
                  isActive && "bg-white/50",
                  isOpen && "nav-drawer-link-visible"
                )}
                style={{
                  transitionDelay: isOpen ? `${index * 40 + 60}ms` : "0ms",
                }}
              >
                <Icon
                  className="size-6 shrink-0 stroke-[2.25]"
                  aria-hidden
                />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-manago-navy/10 px-5 py-5">
          {isSignedIn ? (
            <button
              type="button"
              onClick={() => {
                close()
                void signOut({ redirectUrl: "/sign-in" })
              }}
              className="flex w-full items-center gap-3.5 rounded-xl px-3 py-3.5 text-left text-lg font-semibold tracking-tight text-red-700 transition-colors hover:bg-red-50"
            >
              <LogOut className="size-6 shrink-0 stroke-[2.25]" aria-hidden />
              Log out
            </button>
          ) : (
            <Link
              href="/sign-in"
              onClick={close}
              className="flex w-full items-center gap-3.5 rounded-xl px-3 py-3.5 text-lg font-semibold tracking-tight text-manago-navy transition-colors hover:bg-white/40"
            >
              <UserRound className="size-6 shrink-0 stroke-[2.25]" aria-hidden />
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}

export function NavMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return (
    <NavMenuContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      <NavDrawer />
    </NavMenuContext.Provider>
  )
}
