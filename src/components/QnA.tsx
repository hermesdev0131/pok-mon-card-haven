"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import type { Question } from '@/types';

export function QnA({ questions }: { questions: Question[] }) {
  const [newQuestion, setNewQuestion] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Faça uma pergunta pública ao vendedor..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="min-h-[60px] resize-none"
        />
        <Button size="sm" className="self-end" disabled={!newQuestion.trim()}>
          Enviar
        </Button>
      </div>

      {!questions.length && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-muted-foreground text-sm">Nenhuma pergunta ainda. Seja o primeiro!</p>
        </div>
      )}

      {questions.map((q) => (
        <Card key={q.id} className="border-border/50">
          <CardContent className="p-4 space-y-2">
            <div>
              <span className="font-medium text-sm">{q.userName}</span>
              <span className="text-xs text-muted-foreground ml-2">{new Date(q.questionDate).toLocaleDateString('pt-BR')}</span>
            </div>
            <p className="text-sm">{q.question}</p>
            {q.answer && (
              <div className="ml-4 pl-3 border-l-2 border-accent/40 mt-2">
                <span className="text-xs font-medium text-accent">Resposta do vendedor</span>
                <p className="text-sm text-muted-foreground mt-1">{q.answer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
