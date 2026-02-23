import { Card, CardContent } from '@/components/ui/card';
import { Heart, Target, Users, ShieldCheck } from 'lucide-react';

export default function Sobre() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-3">
          Sobre o <span className="text-accent text-glow-accent">Graded</span>BR
        </h1>
        <p className="text-muted-foreground">A história por trás do marketplace</p>
      </div>

      {/* Origin story */}
      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed mb-12">
        <p>
          O GradedBR nasceu da frustração de colecionadores brasileiros que queriam comprar e vender cartas
          Pokémon graduadas com segurança — mas não encontravam uma plataforma confiável e especializada para isso.
        </p>
        <p>
          Em grupos de WhatsApp e redes sociais, as negociações sempre tinham o mesmo problema: falta de
          transparência nos preços, dificuldade de verificar a reputação do vendedor e nenhuma proteção
          para o comprador. Golpes eram frequentes e a desconfiança impedia o mercado de crescer.
        </p>
        <p>
          Foi aí que decidimos criar o GradedBR — um marketplace feito por colecionadores, para colecionadores.
          Um lugar onde cada carta graduada tem histórico de preço real, cada vendedor é verificado e cada
          pagamento é protegido até a confirmação do recebimento.
        </p>
        <p>
          Começamos pequenos, com um grupo de amigos que compartilhavam a paixão por cartas Pokémon e a
          vontade de profissionalizar esse mercado no Brasil. Hoje, nossa missão é tornar a compra e venda
          de cartas graduadas tão segura e transparente quanto deveria sempre ter sido.
        </p>
      </div>

      {/* Values */}
      <h2 className="text-xl font-bold mb-6 text-center">Nossos valores</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: ShieldCheck,
            title: 'Segurança acima de tudo',
            desc: 'Pagamento protegido e vendedores verificados. Nenhuma transação é concluída sem a confirmação do comprador.',
          },
          {
            icon: Target,
            title: 'Transparência de preços',
            desc: 'Histórico real de vendas e gráficos por grade e idioma. Nada de preços inflados ou informações ocultas.',
          },
          {
            icon: Users,
            title: 'Comunidade primeiro',
            desc: 'Feito por colecionadores, para colecionadores. Cada funcionalidade é pensada para quem vive esse hobby.',
          },
          {
            icon: Heart,
            title: 'Paixão pelo hobby',
            desc: 'Acreditamos que colecionar cartas Pokémon graduadas merece uma experiência à altura da dedicação de cada colecionador.',
          },
        ].map(({ icon: Icon, title, desc }) => (
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
    </div>
  );
}
