'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Bell,
  User,
  Search,
  Settings,
  Bot,
  Menu,
  X,
} from 'lucide-react'

interface SidebarProps {
  role: 'client' | 'freelancer' | 'admin'
  user: { full_name: string; email: string; avatar_url?: string | null }
}

interface NavLink {
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_LINKS: Record<SidebarProps['role'], NavLink[]> = {
  client: [
    { label: 'Dashboard', href: '/client/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Browse Freelancers', href: '/client/browse', icon: <Search size={18} /> },
    { label: 'My Requests', href: '/client/requests', icon: <FileText size={18} /> },
    { label: 'Messages', href: '/client/messages', icon: <MessageSquare size={18} /> },
    { label: 'Notifications', href: '/client/notifications', icon: <Bell size={18} /> },
  ],
  freelancer: [
    { label: 'Dashboard', href: '/freelancer/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'My Profile', href: '/freelancer/profile', icon: <User size={18} /> },
    { label: 'Requests', href: '/freelancer/requests', icon: <FileText size={18} /> },
    { label: 'Messages', href: '/freelancer/messages', icon: <MessageSquare size={18} /> },
    { label: 'Notifications', href: '/freelancer/notifications', icon: <Bell size={18} /> },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Freelancers', href: '/admin/freelancers', icon: <Users size={18} /> },
    { label: 'Clients', href: '/admin/clients', icon: <User size={18} /> },
    { label: 'Requests', href: '/admin/requests', icon: <FileText size={18} /> },
    { label: 'Services', href: '/admin/services', icon: <Settings size={18} /> },
    { label: 'Chatbot Logs', href: '/admin/chatbot', icon: <Bot size={18} /> },
  ],
}

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    )
  }

  return (
    <div className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0">
      <span className="text-white text-sm font-heading font-semibold">{initials}</span>
    </div>
  )
}

function SidebarContent({
  role,
  user,
  pathname,
  onClose,
}: SidebarProps & { pathname: string; onClose?: () => void }) {
  const links = NAV_LINKS[role]

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200">
      {/* Logo / Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-neutral-100">
        <span className="font-heading font-bold text-xl text-brand-blue tracking-tight">
          PurlyRemote
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-colors',
                isActive
                  ? 'bg-[#007BFF] text-white'
                  : 'text-neutral-600 hover:bg-blue-50 hover:text-neutral-800',
              ].join(' ')}
            >
              <span className={isActive ? 'text-white' : 'text-neutral-400'}>{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-neutral-100">
        <div className="flex items-center gap-3 mb-3">
          <UserAvatar name={user.full_name} avatarUrl={user.avatar_url} />
          <div className="min-w-0">
            <p className="text-sm font-body font-semibold text-neutral-800 truncate">
              {user.full_name}
            </p>
            <p className="text-xs font-body text-neutral-500 truncate">{user.email}</p>
          </div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="btn-ghost w-full text-sm justify-center"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-60 z-30">
        <SidebarContent role={role} user={user} pathname={pathname} />
      </aside>

      {/* Mobile: hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white shadow-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Mobile: overlay backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile: slide-in sidebar */}
      <aside
        className={[
          'md:hidden fixed top-0 left-0 h-screen w-64 z-50 transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-hidden={!mobileOpen}
      >
        <SidebarContent
          role={role}
          user={user}
          pathname={pathname}
          onClose={() => setMobileOpen(false)}
        />
      </aside>
    </>
  )
}
