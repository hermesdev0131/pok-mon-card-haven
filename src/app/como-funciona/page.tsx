import { Card, CardContent } from '@/components/ui/card';
import { Shield, TrendingUp, CheckCircle, CreditCard, Package, HelpCircle, BadgeCheck, Star, MessageCircle } from 'lucide-react';

export default function ComoFunciona() {
  const steps = [
    { icon: TrendingUp, title: '1. Pesquise com dados reais', desc: 'Compare preços usando histórico de vendas concluídas e gráficos por grade. Sem achismos.' },
    { icon: CheckCircle, title: '2. Compre de vendedores verificados', desc: 'Vendedores passam por verificação e têm avaliações públicas de compradores reais.' },
    { icon: CreditCard, title: '3. Pague com segurança', desc: 'O pagamento fica retido até você receber e verificar a carta. Proteção total.' },
    { icon: Package, title: '4. Receba e confirme', desc: 'Verifique a carta, confirme o recebimento e o pagamento é liberado ao vendedor.' },
    { icon: HelpCircle, title: '5. Suporte dedicado', desc: 'Em caso de problemas, abra uma disputa. Nosso time analisa e resolve.' },
  ];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="text-center mb-12">
        <Shield className="mx-auto h-10 w-10 text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.4)] mb-4" />
        <h1 className="text-3xl font-bold mb-3">Como funciona o GradedBR</h1>
        <p className="text-muted-foreground">Um processo pensado para proteger compradores e vendedores</p>
      </div>
      <div className="space-y-4">
        {steps.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="glass">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selo Verificado section */}
      <div className="mt-16" id="selo-verificado">
        <div className="text-center mb-8">
          <BadgeCheck className="mx-auto h-10 w-10 text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.4)] mb-4" />
          <h2 className="text-2xl font-bold mb-2">Como obter o Selo Verificado</h2>
          <p className="text-muted-foreground text-sm">Destaque-se no marketplace e ganhe a confiança dos compradores</p>
        </div>

        <div className="space-y-4">
          <Card className="glass">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Mínimo de 20 vendas concluídas</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Complete pelo menos 20 transações com sucesso na plataforma para comprovar sua experiência e confiabilidade.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <Star className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Avaliação mínima de 4.5</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Mantenha uma nota média de pelo menos 4.5 estrelas nas avaliações dos compradores.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-accent/10">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <MessageCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Já é reconhecido pela comunidade?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Vendedores de confiança já reconhecidos pela comunidade podem receber o selo ao se cadastrar. Entre em contato pelo WhatsApp com algumas informações para análise.
                </p>
                <a
                  href="https://wa.me/5511987813451"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar no WhatsApp
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
