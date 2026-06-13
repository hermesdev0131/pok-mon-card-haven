"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import type { AppNotification } from '@/types';

// Relative time in pt-BR ("agora", "5 min", "3 h", "2 d", or a date).
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleOpen = (n: AppNotification) => {
    setOpen(false);
    if (!n.read) markRead(n.id);
    if (n.link) router.push(n.link);
  };

  const recent = notifications.slice(0, 8);

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-foreground hover:text-accent h-9 w-9"
        onClick={() => setOpen((o) => !o)}
        title="Notificações"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-sm font-semibold">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-accent"
              >
                <Check className="h-3 w-3" /> Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhuma notificação ainda.
              </div>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors flex gap-3 ${n.read ? '' : 'bg-accent/[0.04]'}`}
                >
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-accent'}`} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium leading-tight">{n.title}</span>
                    <span className="block text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</span>
                    <span className="block text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>

          <Link
            href="/me/notificacoes"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-medium text-accent py-2.5 border-t border-border hover:bg-secondary/50"
          >
            Ver todas
          </Link>
        </div>
      )}
    </div>
  );
}
