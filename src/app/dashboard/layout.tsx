'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { useState } from 'react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-surface shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-textPrimary">
                  AppsForHire
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="border-accent text-textPrimary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/apps"
                  className="border-transparent text-textMuted hover:border-textMuted hover:text-textPrimary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Apps
                </Link>
                <Link
                  href="/test-tools"
                  className="border-transparent text-textMuted hover:border-textMuted hover:text-textPrimary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Test Tools
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="bg-surface rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-textMuted/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-textMuted">U</span>
                    </div>
                  </button>
                </div>
                {isMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-surface ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-textMuted hover:bg-background"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 