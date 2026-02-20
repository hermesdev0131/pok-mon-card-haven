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
          <CardHeader><CardTitle className="text-lg">Imagens</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-white/[0.08] rounded-lg p-12 text-center cursor-pointer hover:border-accent/40 hover:bg-accent/[0.02] transition-all">
              <ImagePlus className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Arraste imagens ou clique para fazer upload</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 5MB · Frente e verso da carta + case</p>
            </div>
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
