"use client";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Bell, PlusSquare, LogOut, LogIn } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (session) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setNotifications(data);
        });
    }
  }, [session]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-black text-white">
          <Image 
            src="/icon.png" 
            alt="Troll Logo" 
            width={32} 
            height={32} 
            className="object-contain" 
          />
          <span>Troll Memes</span>
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link
                href="/post/new"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 transition"
              >
                <PlusSquare size={16} /> Post
              </Link>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="relative rounded-lg p-2 text-slate-300 hover:bg-slate-800"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
                    <h3 className="px-2 py-1 text-xs font-bold uppercase text-slate-400">Notifications</h3>
                    <div className="mt-1 space-y-1">
                      {notifications.length === 0 ? (
                        <p className="p-2 text-xs text-slate-500">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="rounded-lg p-2 text-xs hover:bg-slate-800 text-slate-200">
                            <span className="font-semibold text-blue-400">@{n.actor.username}</span> liked your post{" "}
                            <span className="italic text-slate-300">&quot;{n.post.title}&quot;</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => signOut()}
                className="text-slate-400 hover:text-white"
                title="Sign out"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              <LogIn size={16} /> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}