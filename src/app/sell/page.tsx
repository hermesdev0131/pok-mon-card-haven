"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { searchCardBases, createListing } from '@/lib/api';
import type { CardBase, GradeCompany } from '@/types';

const IMAGE_SLOTS = ['Frente', 'Verso', 'Label', 'Case'] as const;

export default function Sell() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 — Card data
  const [selectedCardBase, setSelectedCardBase] = useState<CardBase | null>(null);
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [cardSearchResults, setCardSearchResults] = useState<CardBase[]>([]);
  const [gradeCompany, setGradeCompany] = useState('');
  const [grade, setGrade] = useState('');
  const [language, setLanguage] = useState<'PT' | 'EN' | 'JP'>('PT');

  // Step 2 — Price & shipping
  const [price, setPrice] = useState('');
  const [freeShipping, setFreeShipping] = useState(false);
  const [shippingNotes, setShippingNotes] = useState('');

  // Step 3 — Images
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null, null]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Debounced card search
  useEffect(() => {
    if (selectedCardBase || cardSearchQuery.length < 2) {
      setCardSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchCardBases(cardSearchQuery).then(setCardSearchResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [cardSearchQuery, selectedCardBase]);

  const handleImageUpload = (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) return;
    if (!file.type.startsWith('image/')) return;

    setImageFiles(prev => {
      const next = [...prev];
      next[index] = file;
      return next;
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviews(prev => {
        const next = [...prev];
        next[index] = e.target?.result as string;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setImagePreviews(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedCardBase || !gradeCompany || !grade || !price) return;
    setSubmitting(true);
    setSubmitError(null);

    const result = await createListing({
      cardBaseId: selectedCardBase.id,
      grade: grade === 'pristine-10' ? 10 : Number(grade),
      gradeCompany: gradeCompany as GradeCompany,
      pristine: grade === 'pristine-10',
      language,
      price: Math.round(Number(price) * 100),
      freeShipping,
      conditionNotes: shippingNotes || undefined,
      imageFiles,
    });

    if (!result.success) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    router.push('/me');
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
            {/* Card search */}
            <div className="space-y-2">
              <Label>Carta</Label>
              <div className="relative">
                {selectedCardBase ? (
                  <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <span className="flex-1 font-medium">{selectedCardBase.name}</span>
                    <span className="text-muted-foreground text-xs">{selectedCardBase.set} · {selectedCardBase.number}</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedCardBase(null); setCardSearchQuery(''); }}
                      className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <Input
                    placeholder="Buscar por nome, set ou número..."
                    value={cardSearchQuery}
                    onChange={(e) => setCardSearchQuery(e.target.value)}
                  />
                )}
                {!selectedCardBase && cardSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full top-full mt-1 rounded-lg border border-white/[0.08] bg-card shadow-lg overflow-hidden">
                    {cardSearchResults.map(cb => (
                      <button
                        key={cb.id}
                        type="button"
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-white/[0.04] flex items-center justify-between gap-2 border-b border-white/[0.04] last:border-0"
                        onClick={() => {
                          setSelectedCardBase(cb);
                          setCardSearchQuery('');
                          setCardSearchResults([]);
                        }}
                      >
                        <span className="font-medium truncate">{cb.name}</span>
                        <span className="text-muted-foreground text-xs shrink-0">{cb.set} · {cb.number}</span>
                      </button>
                    ))}
                  </div>
                )}
                {!selectedCardBase && cardSearchQuery.length >= 2 && cardSearchResults.length === 0 && (
                  <div className="absolute z-10 w-full top-full mt-1 rounded-lg border border-white/[0.08] bg-card shadow-lg px-3 py-2.5 text-sm text-muted-foreground">
                    Nenhuma carta encontrada
                  </div>
                )}
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
                    <SelectItem value="Beckett">Beckett</SelectItem>
                    <SelectItem value="Mana Fix">Mana Fix</SelectItem>
                    <SelectItem value="BGA">BGA</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="Capy">Capy</SelectItem>
                    <SelectItem value="Taverna">Taverna</SelectItem>
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

            <div className="space-y-2">
              <Label>Idioma da carta</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as 'PT' | 'EN' | 'JP')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PT">Português (BR)</SelectItem>
                  <SelectItem value="EN">Inglês (EN)</SelectItem>
                  <SelectItem value="JP">Japonês (JP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full"
              disabled={!selectedCardBase || !gradeCompany || !grade}
            >
              Próximo
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Preço e frete</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" placeholder="0,00" value={price} onChange={(e) => setPrice(e.target.value)} />
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
              <Button onClick={() => setStep(3)} className="flex-1" disabled={!price || Number(price) <= 0}>Próximo</Button>
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

                  {imagePreviews[i] ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-accent/30 bg-secondary">
                      <img src={imagePreviews[i]!} alt={label} className="w-full h-full object-cover" />
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
            {submitError && (
              <p className="text-sm text-destructive text-center">{submitError}</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={submitting}>Voltar</Button>
              <Button
                className="flex-1"
                disabled={!imageFiles[0] || !imageFiles[1] || submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Publicando...</>
                ) : (
                  'Publicar anúncio'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </RequireAuth>
  );
}
