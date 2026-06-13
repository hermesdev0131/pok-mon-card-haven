"use client";

import { useRouter } from 'next/navigation';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/RequireAuth';
import { useNotifications } from '@/contexts/NotificationContext';
import type { AppNotification } from '@/types';

function fullTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationsPageGuarded() {
  return (
    <RequireAuth>
      <NotificationsPage />
    </RequireAuth>
  );
}

function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

  const handleOpen = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}` : 'Tudo em dia'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead()}>
            <Check className="h-4 w-4 mr-2" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Você ainda não tem notificações.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleOpen(n)}
              className={`w-full text-left rounded-xl border p-4 flex gap-3 transition-colors hover:border-accent/40 ${n.read ? 'border-border bg-card' : 'border-accent/30 bg-accent/[0.04]'}`}
            >
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-accent'}`} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold leading-tight">{n.title}</span>
                <span className="block text-sm text-muted-foreground mt-1">{n.body}</span>
                <span className="block text-[11px] text-muted-foreground/70 mt-1.5">{fullTime(n.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
