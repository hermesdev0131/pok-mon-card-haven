"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createQuestion, answerQuestion } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Question } from '@/types';

interface QnAProps {
  questions: Question[];
  listingId: string;
  sellerId: string;
  onQuestionSent?: () => void;
}

export function QnA({ questions, listingId, sellerId, onQuestionSent }: QnAProps) {
  const { user } = useAuth();
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answerSubmitting, setAnswerSubmitting] = useState(false);

  const isSeller = user?.id === sellerId;

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || submitting) return;
    setSubmitting(true);
    const result = await createQuestion(listingId, newQuestion.trim());
    setSubmitting(false);
    if (result.success) {
      setNewQuestion('');
      onQuestionSent?.();
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answerText.trim() || answerSubmitting) return;
    setAnswerSubmitting(true);
    const result = await answerQuestion(questionId, answerText.trim());
    setAnswerSubmitting(false);
    if (result.success) {
      setAnsweringId(null);
      setAnswerText('');
      onQuestionSent?.();
    }
  };

  return (
    <div className="space-y-4">
      {user ? (
        <div className="flex gap-2">
          <Textarea
            placeholder="Faça uma pergunta pública ao vendedor..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="min-h-[60px] resize-none"
          />
          <Button
            size="sm"
            className="self-end"
            disabled={!newQuestion.trim() || submitting}
            onClick={handleSubmitQuestion}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Faça login para enviar uma pergunta.
        </p>
      )}

      {!questions.length && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-muted-foreground text-sm">Nenhuma pergunta ainda. Seja o primeiro!</p>
        </div>
      )}

      {questions.map((q) => (
        <Card key={q.id} className="glass">
          <CardContent className="p-4 space-y-2">
            <div>
              <span className="font-medium text-sm">{q.userName}</span>
              <span className="text-xs text-muted-foreground ml-2">{new Date(q.questionDate).toLocaleDateString('pt-BR')}</span>
            </div>
            <p className="text-sm">{q.question}</p>
            {q.answer ? (
              <div className="ml-4 pl-3 border-l-2 border-accent/40 mt-2">
                <span className="text-xs font-medium text-accent">{q.sellerName}</span>
                {q.answerDate && (
                  <span className="text-xs text-muted-foreground ml-2">{new Date(q.answerDate).toLocaleDateString('pt-BR')}</span>
                )}
                <p className="text-sm text-muted-foreground mt-1">{q.answer}</p>
              </div>
            ) : isSeller && (
              <div className="ml-4 pl-3 border-l-2 border-accent/20 mt-2">
                {answeringId === q.id ? (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Sua resposta..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      className="min-h-[50px] resize-none text-sm"
                    />
                    <div className="flex flex-col gap-1 self-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs"
                        disabled={!answerText.trim() || answerSubmitting}
                        onClick={() => handleSubmitAnswer(q.id)}
                      >
                        {answerSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Responder'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-accent"
                    onClick={() => { setAnsweringId(q.id); setAnswerText(''); }}
                  >
                    Responder
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
