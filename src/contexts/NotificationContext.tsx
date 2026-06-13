"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead as apiMarkRead,
  markAllNotificationsRead as apiMarkAllRead,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import type { AppNotification } from '@/types';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationState | undefined>(undefined);

const supabase = createClient();

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    const [list, count] = await Promise.all([
      getMyNotifications(),
      getUnreadNotificationCount(),
    ]);
    setNotifications(list);
    setUnreadCount(count);
    setLoading(false);
  }, [isAuthenticated]);

  // Initial load + reload on auth change.
  useEffect(() => { refresh(); }, [user?.id, refresh]);

  // Live updates: subscribe to inserts on this user's notifications so the
  // bell badge reacts instantly without polling.
  useEffect(() => {
    // Always tear down any existing channel first.
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const row = payload.new;
          const incoming: AppNotification = {
            id: row.id,
            type: row.type,
            title: row.title,
            body: row.body,
            link: row.link ?? undefined,
            read: row.read_at != null,
            createdAt: row.created_at,
          };
          setNotifications((prev) => [incoming, ...prev].slice(0, 30));
          setUnreadCount((c) => c + 1);
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user?.id]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic: flip locally, then persist.
    setNotifications((prev) => prev.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n)));
    setUnreadCount((c) => {
      const wasUnread = notifications.find((n) => n.id === id && !n.read);
      return wasUnread ? Math.max(0, c - 1) : c;
    });
    await apiMarkRead(id);
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await apiMarkAllRead();
  }, []);

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, refresh, markRead, markAllRead }),
    [notifications, unreadCount, loading, refresh, markRead, markAllRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationState {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
