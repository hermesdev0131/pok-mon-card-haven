"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePlus } from 'lucide-react';
import { useState } from 'react';

export default function Sell() {
  const [step, setStep] = useState(1);
  const [freeShipping, setFreeShipping] = useState(false);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Criar anúncio</h1>
      <p className="text-sm text-muted-foreground mb-8">Preencha os dados da sua carta graduada</p>

      {/* Step indicators */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-accent' : 'bg-secondary'}`} />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Dados da carta</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da carta</Label>
              <Input placeholder="Ex: Charizard VMAX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Set</Label>
                <Input placeholder="Ex: Darkness Ablaze" />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input placeholder="Ex: 020/189" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Empresa de grading</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PSA">PSA</SelectItem>
                    <SelectItem value="BGS">BGS</SelectItem>
                    <SelectItem value="CGC">CGC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="9.5">9.5</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="8.5">8.5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="w-full">Próximo</Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Preço e frete</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input type="number" placeholder="0,00" />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="freeShipping" checked={freeShipping} onCheckedChange={(v) => setFreeShipping(!!v)} />
              <Label htmlFor="freeShipping">Frete por conta do vendedor</Label>
            </div>
            <div className="space-y-2">
              <Label>Observações sobre envio</Label>
              <Textarea placeholder="Ex: Envio via Sedex com rastreio" className="resize-none" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
              <Button onClick={() => setStep(3)} className="flex-1">Próximo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Imagens da carta</CardTitle>
            <p className="text-sm text-muted-foreground">Até 4 fotos · PNG, JPG até 5MB cada</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(['Frente', 'Verso', 'Label', 'Case'] as const).map((label, i) => (
                <div
                  key={label}
                  className="group relative aspect-[3/4] rounded-lg border-2 border-dashed border-white/[0.08] bg-white/[0.02] flex flex-col items-center justify-center cursor-pointer hover:border-accent/40 hover:bg-accent/[0.02] transition-all"
                >
                  <ImagePlus className="h-6 w-6 text-muted-foreground/40 group-hover:text-accent/60 transition-colors mb-2" />
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  {i >= 2 && (
                    <span className="text-[10px] text-muted-foreground/40 mt-0.5">Opcional</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/60 text-center">
              Frente e verso são obrigatórios. Label e case ajudam compradores a decidir.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
              <Button className="flex-1">Publicar anúncio</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
