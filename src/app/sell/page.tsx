"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePlus, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { RequireAuth } from '@/components/RequireAuth';

const IMAGE_SLOTS = ['Frente', 'Verso', 'Label', 'Case'] as const;

export default function Sell() {
  const [step, setStep] = useState(1);

  // Step 1 — Card data (persists across steps)
  const [cardName, setCardName] = useState('');
  const [set, setSet] = useState('');
  const [number, setNumber] = useState('');
  const [gradeCompany, setGradeCompany] = useState('');
  const [grade, setGrade] = useState('');

  // Step 2 — Price & shipping
  const [price, setPrice] = useState('');
  const [freeShipping, setFreeShipping] = useState(false);
  const [shippingNotes, setShippingNotes] = useState('');

  // Step 3 — Images (array of 4 slots, null = empty)
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleImageUpload = (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImages(prev => {
        const next = [...prev];
        next[index] = e.target?.result as string;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  return (
    <RequireAuth role="seller">
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
              <Input placeholder="Ex: Charizard VMAX" value={cardName} onChange={(e) => setCardName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Set</Label>
                <Input placeholder="Ex: Darkness Ablaze" value={set} onChange={(e) => setSet(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input placeholder="Ex: 020/189" value={number} onChange={(e) => setNumber(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Empresa de grading</Label>
                <Select value={gradeCompany} onValueChange={(v) => { setGradeCompany(v); if (grade === 'pristine-10' && !['CGC', 'TAG', 'Beckett'].includes(v)) setGrade(''); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PSA">PSA</SelectItem>
                    <SelectItem value="CGC">CGC</SelectItem>
                    <SelectItem value="TAG">TAG</SelectItem>
                    <SelectItem value="Mana Fix">Mana Fix</SelectItem>
                    <SelectItem value="BGA">BGA</SelectItem>
                    <SelectItem value="Beckett">Beckett</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {['CGC', 'TAG', 'Beckett'].includes(gradeCompany) && (
                      <SelectItem value="pristine-10">Pristine 10</SelectItem>
                    )}
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="9.5">9.5</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="8.5">8.5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="7">7</SelectItem>
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
              <Input type="number" placeholder="0,00" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="freeShipping" checked={freeShipping} onCheckedChange={(v) => setFreeShipping(!!v)} />
              <Label htmlFor="freeShipping">Frete por conta do vendedor</Label>
            </div>
            <div className="space-y-2">
              <Label>Observações sobre envio</Label>
              <Textarea placeholder="Ex: Envio via Sedex com rastreio" className="resize-none" value={shippingNotes} onChange={(e) => setShippingNotes(e.target.value)} />
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
            <div className="grid grid-cols-4 gap-2">
              {IMAGE_SLOTS.map((label, i) => (
                <div key={label} className="relative">
                  <input
                    ref={(el) => { fileInputRefs.current[i] = el; }}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(i, file);
                    }}
                  />

                  {images[i] ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-accent/30 bg-secondary">
                      <img src={images[i]!} alt={label} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-center py-0.5 font-medium">
                        {label}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRefs.current[i]?.click()}
                      className="w-full aspect-square rounded-lg border-2 border-dashed border-white/[0.08] bg-white/[0.02] flex flex-col items-center justify-center cursor-pointer hover:border-accent/40 hover:bg-accent/[0.02] transition-all"
                    >
                      <ImagePlus className="h-5 w-5 text-muted-foreground/40 mb-1" />
                      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                      {i >= 2 && (
                        <span className="text-[9px] text-muted-foreground/40">Opcional</span>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/60 text-center">
              Frente e verso são obrigatórios. Label e case ajudam compradores a decidir.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
              <Button className="flex-1" disabled={!images[0] || !images[1]}>Publicar anúncio</Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </RequireAuth>
  );
}
