"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { createReview, getReviewForOrder } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Review } from '@/types';

interface ReviewFormProps {
  orderId: string;
  sellerId: string;
  onReviewSent?: () => void;
}

export function ReviewForm({ orderId, sellerId, onReviewSent }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReviewForOrder(orderId).then(r => {
      setExistingReview(r);
      setLoading(false);
    });
  }, [orderId]);

  if (loading) return null;

  // Already reviewed — show the existing review
  if (existingReview) {
    return (
      <Card className="glass border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">Avaliação enviada</span>
          </div>
          <div className="flex gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                className={`h-4 w-4 ${s <= existingReview.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`}
              />
            ))}
          </div>
          {existingReview.comment && (
            <p className="text-sm text-muted-foreground">{existingReview.comment}</p>
          )}
          {existingReview.sellerReply && (
            <div className="ml-4 pl-3 border-l-2 border-accent/40 mt-2">
              <p className="text-xs font-medium text-accent">Resposta do vendedor</p>
              <p className="text-sm text-muted-foreground mt-1">{existingReview.sellerReply}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Only buyer can review
  if (!user || user.id === sellerId) return null;

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await createReview(orderId, sellerId, rating, comment.trim());
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    // Refetch to show the submitted review
    const review = await getReviewForOrder(orderId);
    setExistingReview(review);
    onReviewSent?.();
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="h-4 w-4 text-accent" />
          Avaliar vendedor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              type="button"
              className="p-0.5 transition-transform hover:scale-110"
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(s)}
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  s <= (hoverRating || rating)
                    ? 'fill-yellow-500 text-yellow-500'
                    : 'text-muted-foreground/30'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm text-muted-foreground self-center ml-2">
              {rating === 1 ? 'Ruim' : rating === 2 ? 'Regular' : rating === 3 ? 'Bom' : rating === 4 ? 'Muito bom' : 'Excelente'}
            </span>
          )}
        </div>

        <Textarea
          placeholder="Comentário (opcional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[60px] resize-none text-sm"
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          size="sm"
          disabled={rating === 0 || submitting}
          onClick={handleSubmit}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Enviar avaliação
        </Button>
      </CardContent>
    </Card>
  );
}
