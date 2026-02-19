import { Card, CardContent } from '@/components/ui/card';
import { Shield, TrendingUp, CheckCircle, CreditCard, Package, HelpCircle } from 'lucide-react';

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
        <Shield className="mx-auto h-10 w-10 text-accent mb-4" />
        <h1 className="text-3xl font-bold mb-3">Como funciona o GradedBR</h1>
        <p className="text-muted-foreground">Um processo pensado para proteger compradores e vendedores</p>
      </div>
      <div className="space-y-4">
        {steps.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="border-border/50">
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
    </div>
  );
}
