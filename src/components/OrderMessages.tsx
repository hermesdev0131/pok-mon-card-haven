"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { getMessagesForOrder, sendMessage, markMessagesRead } from '@/lib/api';
import type { Message } from '@/types';

interface OrderMessagesProps {
  orderId: string;
}

export function OrderMessages({ orderId }: OrderMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const msgs = await getMessagesForOrder(orderId);
    setMessages(msgs);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchMessages();
    markMessagesRead(orderId);

    // Poll every 15 seconds
    const interval = setInterval(() => {
      fetchMessages();
      markMessagesRead(orderId);
    }, 15000);

    return () => clearInterval(interval);
  }, [orderId, fetchMessages]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const result = await sendMessage(orderId, newMessage.trim());
    setSending(false);
    if (result.success) {
      setNewMessage('');
      await fetchMessages();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-accent" />
          Mensagens do pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          ref={scrollRef}
          className="max-h-[300px] min-h-[100px] overflow-y-auto space-y-2 p-2 rounded-lg bg-background/50"
        >
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              Nenhuma mensagem ainda. Envie a primeira!
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    msg.isOwn
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {!msg.isOwn && (
                    <p className="text-xs font-medium opacity-70 mb-0.5">{msg.senderName}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.isOwn ? 'opacity-60' : 'opacity-40'}`}>
                    {new Date(msg.createdAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Escreva uma mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[100px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            className="self-end shrink-0"
            disabled={!newMessage.trim() || sending}
            onClick={handleSend}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
