import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Film, Bell, User, LogOut, CheckCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: 'movies' | 'theatres' | 'bookings' | 'admin';
  onSelectTab: (tab: 'movies' | 'theatres' | 'bookings' | 'admin') => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenAuth }) => {
  const { user, logout, quickLogin, notifications, unreadCount, markAsRead, markAllAsRead } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => onSelectTab('movies')}
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
        >
          <Film className="w-5 h-5 text-amber-400" />
          <span>IMOVIES</span>
        </button>

        {/* Zone 2: 4 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => onSelectTab('movies')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'movies'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => onSelectTab('theatres')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'theatres'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Cinemas
          </button>
          <button
            onClick={() => {
              if (!user) {
                onOpenAuth();
              } else {
                onSelectTab('bookings');
              }
            }}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'bookings'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            My Bookings
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                currentTab === 'admin'
                  ? 'text-amber-400 font-semibold'
                  : 'text-amber-200/80 hover:text-amber-300'
              }`}
            >
              Admin Suite
            </button>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action / User Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Demo Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => quickLogin('user')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                user?.role === 'user'
                  ? 'bg-amber-400/20 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Test as regular moviegoer"
            >
              Demo User
            </button>
            <button
              onClick={() => quickLogin('admin')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                user?.role === 'admin'
                  ? 'bg-amber-400/20 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Test as cinema admin"
            >
              Demo Admin
            </button>
          </div>

          {/* Notifications Bell */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-900"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
                    <span className="font-semibold text-white">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto flex flex-col gap-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => markAsRead(n._id)}
                          className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            n.read ? 'bg-slate-950/40 text-slate-400' : 'bg-slate-800/80 text-slate-200'
                          }`}
                        >
                          <div className="font-medium text-white mb-0.5">{n.title}</div>
                          <div className="leading-relaxed line-clamp-2">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile or Sign In */}
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pl-2.5 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <div className="w-6 h-6 rounded bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onSelectTab('bookings');
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded flex items-center gap-2 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" /> My Bookings
                  </button>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSelectTab('admin');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-amber-300 hover:bg-slate-800 rounded flex items-center gap-2 transition-colors"
                    >
                      <Film className="w-3.5 h-3.5" /> Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-slate-800 rounded flex items-center gap-2 transition-colors mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
