"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusPill } from '@/components/StatusPill';
import { RequireAuth } from '@/components/RequireAuth';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getMyOrders, getMyListings, getMyQuestions, answerQuestion, cancelListing, updateListing, becomeSeller, cancelOrder } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, User, BadgeCheck, Loader2, Store, MessageCircle } from 'lucide-react';
import { GradeBadge } from '@/components/GradeBadge';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/Pagination';
import type { Order, Listing, CardBase, Question } from '@/types';

export default function Profile() {
  const { user, profile, isSeller, tokenRefreshCount, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [myListings, setMyListings] = useState<(Listing & { cardBase: CardBase })[]>([]);
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);

  // Become seller modal state
  const [becomeOpen, setBecomeOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [becomeLoading, setBecomeLoading] = useState(false);
  const [becomeError, setBecomeError] = useState<string | null>(null);

  const handleBecomeSeller = async () => {
    if (!storeName.trim()) return;
    setBecomeLoading(true);
    setBecomeError(null);
    const result = await becomeSeller(storeName.trim(), storeDesc.trim() || undefined);
    setBecomeLoading(false);
    if (!result.success) { setBecomeError(result.error); return; }
    setBecomeOpen(false);
    await refreshProfile();
  };

  useEffect(() => {
    if (user) {
      getMyOrders().then(setOrders);
      if (isSeller) {
        getMyListings().then(setMyListings);
        getMyQuestions().then(setMyQuestions);
      }
    }
  }, [user, isSeller, tokenRefreshCount]);

  const purchases = orders.filter(o => o.buyerId === user?.id);
  const sales = orders.filter(o => o.sellerId === user?.id);

  const displayName = profile?.full_name ?? 'Usuário';
  const roleLine = sales.length > 0 ? 'Comprador & Vendedor' : 'Comprador';

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-secondary border border-white/[0.06] flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{roleLine}</p>
          </div>
          {isSeller ? (
            <Button size="sm" className="ml-auto gap-1 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/sell"><Plus className="h-4 w-4" /> Criar anúncio</Link>
            </Button>
          ) : (
            <Button size="sm" className="ml-auto gap-1" variant="outline" onClick={() => setBecomeOpen(true)}>
              <Store className="h-4 w-4" /> Quero vender
            </Button>
          )}
        </div>

        {/* CTA banner — verified for sellers, become-seller for buyers */}
        {isSeller ? (
          <Link
            href="/como-funciona#selo-verificado"
            className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-accent/[0.04] border border-accent/10 hover:border-accent/25 hover:bg-accent/[0.07] transition-all duration-200"
          >
            <BadgeCheck className="h-5 w-5 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Quer o selo verificado?</p>
              <p className="text-xs text-muted-foreground">Saiba como se tornar um vendedor verificado no GradedBR</p>
            </div>
            <span className="text-xs text-accent font-medium shrink-0">Saiba mais &rarr;</span>
          </Link>
        ) : (
          <button
            onClick={() => setBecomeOpen(true)}
            className="w-full flex items-center gap-3 mb-6 p-4 rounded-xl bg-accent/[0.04] border border-accent/10 hover:border-accent/25 hover:bg-accent/[0.07] transition-all duration-200 text-left"
          >
            <Store className="h-5 w-5 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Torne-se um vendedor</p>
              <p className="text-xs text-muted-foreground">Crie sua loja e comece a vender suas cartas graduadas</p>
            </div>
            <span className="text-xs text-accent font-medium shrink-0">Começar &rarr;</span>
          </button>
        )}

        <Tabs defaultValue="purchases">
          <TabsList>
            <TabsTrigger value="purchases">Minhas compras</TabsTrigger>
            <TabsTrigger value="sales">Minhas vendas</TabsTrigger>
            {isSeller && <TabsTrigger value="listings">Meus anúncios</TabsTrigger>}
            {isSeller && (
              <TabsTrigger value="questions" className="gap-1.5">
                Perguntas
                {myQuestions.filter(q => !q.answer).length > 0 && (
                  <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                    {myQuestions.filter(q => !q.answer).length}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="purchases">
            <OrderList orders={purchases} onCancel={async (id) => {
              const result = await cancelOrder(id);
              if (result.success) setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelado' as const } : o));
            }} />
          </TabsContent>
          <TabsContent value="sales">
            <SalesOrderList orders={sales} />
          </TabsContent>
          {isSeller && (
            <TabsContent value="questions">
              <SellerQuestionsList
                questions={myQuestions}
                onAnswered={async () => { getMyQuestions().then(setMyQuestions); }}
              />
            </TabsContent>
          )}
          {isSeller && (
            <TabsContent value="listings">
              <MyListingsList
                listings={myListings}
                onCancel={async (id) => {
                  await cancelListing(id);
                  setMyListings(prev => prev.filter(l => l.id !== id));
                }}
                onPriceUpdate={async (id, newPrice) => {
                  await updateListing(id, { price: newPrice });
                  setMyListings(prev => prev.map(l => l.id === id ? { ...l, price: newPrice } : l));
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Become seller modal */}
      <Dialog open={becomeOpen} onOpenChange={(open) => { if (!becomeLoading) { setBecomeOpen(open); setBecomeError(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Criar sua loja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da loja <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ex: Coleção do João"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                placeholder="Fale um pouco sobre você e seus cards..."
                className="resize-none"
                rows={3}
                value={storeDesc}
                onChange={(e) => setStoreDesc(e.target.value)}
              />
            </div>
            {becomeError && <p className="text-sm text-destructive">{becomeError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBecomeOpen(false)} disabled={becomeLoading}>
              Cancelar
            </Button>
            <Button onClick={handleBecomeSeller} disabled={!storeName.trim() || becomeLoading}>
              {becomeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar loja'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequireAuth>
  );
}

function OrderList({ orders, onCancel }: { orders: Order[]; onCancel?: (id: string) => Promise<void> }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    setConfirmId(null);
    await onCancel?.(orderId);
    setCancellingId(null);
  };

  if (!orders.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>;
  }
  return (
    <div className="space-y-3 mt-4">
      {orders.map(order => (
        <Card key={order.id} className="glass">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{order.cardName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {order.sellerName} · {new Date(order.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-sm">R$ {formatPrice(order.price)}</p>
                <StatusPill status={order.status} />
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/checkout/${order.id}`}>Ver pedido</Link>
              </Button>
              {order.status === 'aguardando_pagamento' && onCancel && (
                confirmId === order.id ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={cancellingId === order.id}
                      onClick={() => handleCancel(order.id)}
                    >
                      {cancellingId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sim'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setConfirmId(null)}
                    >
                      Não
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-muted-foreground/50 hover:text-destructive"
                    onClick={() => setConfirmId(order.id)}
                  >
                    Cancelar
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SalesOrderList({ orders }: { orders: Order[] }) {
  if (!orders.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma venda encontrada.</p>;
  }

  const statusMessage: Record<string, string> = {
    aguardando_pagamento: 'Aguardando pagamento do comprador',
    pago: 'Pagamento recebido — prepare o envio',
    enviado: 'Enviado — aguardando confirmação do comprador',
    entregue: 'Aguardando liberação do pagamento',
    concluido: 'Venda concluída',
    cancelado: 'Pedido cancelado',
    em_disputa: 'Em disputa — aguarde resolução',
  };

  return (
    <div className="space-y-3 mt-4">
      {orders.map(order => (
        <Card key={order.id} className="glass">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{order.cardName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Comprador: {order.buyerName} · {new Date(order.createdAt).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {statusMessage[order.status] ?? order.status}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-sm">R$ {formatPrice(order.price)}</p>
                <StatusPill status={order.status} />
              </div>
              {order.status !== 'cancelado' && order.status !== 'aguardando_pagamento' && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/checkout/${order.id}`}>Ver pedido</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MyListingsList({
  listings,
  onCancel,
  onPriceUpdate,
}: {
  listings: (Listing & { cardBase: CardBase })[];
  onCancel: (id: string) => Promise<void>;
  onPriceUpdate: (id: string, newPrice: number) => Promise<void>;
}) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<(Listing & { cardBase: CardBase }) | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const { page, setPage, totalPages, paged, total, pageSize, setPageSize } = usePagination(listings, 10);

  if (!listings.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhum anúncio ativo.{' '}
        <Link href="/sell" className="text-accent hover:underline">Criar anúncio</Link>
      </p>
    );
  }

  const handleEditOpen = (listing: Listing & { cardBase: CardBase }) => {
    setEditingListing(listing);
    setEditPrice((listing.price / 100).toFixed(2));
  };

  const handleSavePrice = async () => {
    if (!editingListing || !editPrice) return;
    setSaving(true);
    await onPriceUpdate(editingListing.id, Math.round(Number(editPrice) * 100));
    setSaving(false);
    setEditingListing(null);
  };

  return (
    <>
      <div className="space-y-3 mt-4">
        {paged.map(listing => (
          <Card key={listing.id} className="glass">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate flex items-center gap-2">
                  {listing.cardBase.name}
                  <GradeBadge grade={listing.grade} company={listing.gradeCompany} pristine={listing.pristine} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  R$ {formatPrice(listing.price)}
                  {listing.freeShipping && ' · Frete grátis'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Status pill */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                  listing.status === 'active'
                    ? 'bg-accent/10 border-accent/25 text-accent'
                    : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${listing.status === 'active' ? 'bg-accent' : 'bg-amber-400'}`} />
                  {listing.status === 'active' ? 'Ativo' : 'Reservado'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-[11px] font-medium border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14]"
                  onClick={() => handleEditOpen(listing)}
                  disabled={listing.status !== 'active'}
                >
                  Editar preço
                </Button>
                {confirmingCancelId === listing.id ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px]">
                    <span className="text-muted-foreground/70">Cancelar anúncio?</span>
                    <button
                      className="text-destructive font-medium hover:underline disabled:opacity-50"
                      disabled={cancellingId === listing.id}
                      onClick={async () => {
                        setCancellingId(listing.id);
                        setConfirmingCancelId(null);
                        await onCancel(listing.id);
                        setCancellingId(null);
                      }}
                    >
                      {cancellingId === listing.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sim'}
                    </button>
                    <span className="text-muted-foreground/30">·</span>
                    <button
                      className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      onClick={() => setConfirmingCancelId(null)}
                    >
                      Não
                    </button>
                  </span>
                ) : (
                  <button
                    className="h-7 px-2 text-[11px] text-muted-foreground/50 hover:text-destructive transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    disabled={cancellingId === listing.id || listing.status !== 'active'}
                    onClick={() => setConfirmingCancelId(listing.id)}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} onPageSizeChange={setPageSize} />

      {/* Edit price dialog */}
      <Dialog open={!!editingListing} onOpenChange={(open) => !open && setEditingListing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Editar preço</DialogTitle>
          </DialogHeader>
          {editingListing && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {editingListing.cardBase.name}
              <GradeBadge grade={editingListing.grade} company={editingListing.gradeCompany} pristine={editingListing.pristine} />
            </div>
          )}
          <div className="space-y-2 py-2">
            <Label>Novo preço (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingListing(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSavePrice} disabled={!editPrice || Number(editPrice) <= 0 || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SellerQuestionsList({
  questions,
  onAnswered,
}: {
  questions: Question[];
  onAnswered: () => Promise<void>;
}) {
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const unanswered = questions.filter(q => !q.answer);
  const answered = questions.filter(q => !!q.answer);

  const handleSubmit = async (questionId: string) => {
    if (!answerText.trim() || submitting) return;
    setSubmitting(true);
    const result = await answerQuestion(questionId, answerText.trim());
    setSubmitting(false);
    if (result.success) {
      setAnsweringId(null);
      setAnswerText('');
      await onAnswered();
    }
  };

  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma pergunta recebida ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {unanswered.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-accent mb-3">Aguardando resposta ({unanswered.length})</h3>
          <div className="space-y-3">
            {unanswered.map(q => (
              <Card key={q.id} className="glass border-accent/20">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{q.userName}</span>
                        {' perguntou em '}
                        <Link href={`/card/${q.listingId}`} className="text-accent hover:underline">{q.cardName}</Link>
                      </p>
                      <p className="text-sm mt-1">{q.question}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">{new Date(q.questionDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  {answeringId === q.id ? (
                    <div className="ml-4 pl-3 border-l-2 border-accent/30 space-y-2">
                      <Textarea
                        placeholder="Sua resposta..."
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        className="min-h-[60px] resize-none text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={!answerText.trim() || submitting}
                          onClick={() => handleSubmit(q.id)}
                        >
                          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Enviar resposta'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-accent border-accent/20 hover:bg-accent/10"
                      onClick={() => { setAnsweringId(q.id); setAnswerText(''); }}
                    >
                      Responder
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {answered.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Respondidas ({answered.length})</h3>
          <div className="space-y-3">
            {answered.map(q => (
              <Card key={q.id} className="glass">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{q.userName}</span>
                    {' perguntou em '}
                    <span className="text-foreground/70">{q.cardName}</span>
                  </p>
                  <p className="text-sm">{q.question}</p>
                  <div className="ml-4 pl-3 border-l-2 border-accent/40">
                    <p className="text-sm text-muted-foreground">{q.answer}</p>
                    {q.answerDate && (
                      <p className="text-[11px] text-muted-foreground/50 mt-1">{new Date(q.answerDate).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
