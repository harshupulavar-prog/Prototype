import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutGrid, Boxes, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import Logo from './Logo';
import { authService } from '../services/authService';

const NAV = [
  { to: '/', label: 'Prototypes', icon: LayoutGrid, end: true },
  { to: '/my-instances', label: 'My Instances', icon: Boxes },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="space-y-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
              isActive ? 'bg-kaara-50 text-kaara-600' : 'text-charcoal-500 hover:bg-surface hover:text-charcoal'
            }`
          }
        >
          <Icon className="h-[17px] w-[17px]" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function useUser() {
  const user = authService.getCurrentUser();
  return { user, initial: user?.name ? user.name.charAt(0).toUpperCase() : 'U' };
}

function UserBlock() {
  const navigate = useNavigate();
  const { user, initial } = useUser();
  const [open, setOpen] = useState(false);

  const signOut = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="relative">
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-line bg-white p-1.5 shadow-lift">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-charcoal-700 hover:bg-surface"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface"
      >
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold text-charcoal-700">
          {initial}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-charcoal">{user?.name || 'User'}</span>
        <ChevronDown className={`h-4 w-4 flex-none text-charcoal-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}

function TopAvatar() {
  const { initial } = useUser();
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold text-charcoal-700">
      {initial}
    </span>
  );
}

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white lg:pl-56">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-line bg-white px-3 py-6 lg:flex">
        <Link to="/" className="mb-8 px-3" aria-label="Kaara PrototypeHub home">
          <Logo className="h-12" />
        </Link>
        <NavItems />
        <div className="mt-auto border-t border-line pt-4">
          <UserBlock />
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="rounded-md p-2 text-charcoal-500 hover:bg-surface lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-[17px] font-bold tracking-tight text-charcoal">PrototypeHub</span>
          <span className="rounded-full bg-kaara-50 px-2.5 py-0.5 text-xs font-medium text-kaara-600">Enterprise</span>
        </div>
        <div className="hidden lg:block">
          <TopAvatar />
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-charcoal/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white px-4 py-6 shadow-modal">
            <div className="mb-8 flex items-center justify-between px-3.5">
              <Logo className="h-9" />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-2 text-charcoal-500 hover:bg-surface">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <div className="mt-auto border-t border-line pt-4">
              <UserBlock />
            </div>
          </div>
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}
