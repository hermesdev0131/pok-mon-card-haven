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
          O GradedBR nasceu das principais dores do mercado brasileiro de cartas Pokémon graduadas: a falta de
          dados reais sobre vendas no Brasil, a dificuldade de entender o valor real das cartas e a ausência de
          um lugar centralizado que reunisse as cartas disponíveis no mercado nacional.
        </p>
        <p>
          Por muito tempo, colecionadores negociaram principalmente em grupos de WhatsApp e redes sociais, sem
          histórico estruturado de vendas e sem uma referência clara de preços. Muitas decisões acabavam baseadas
          em percepções isoladas, comparações internacionais ou simples especulação, o que gerava insegurança e
          dificultava o desenvolvimento do mercado.
        </p>
        <p>
          Além disso, não existia uma plataforma que concentrasse, de forma organizada, as cartas graduadas
          disponíveis no Brasil, tornando o processo de compra, venda e precificação ainda mais complexo.
        </p>
        <p>
          Foi para mudar esse cenário que criamos o GradedBR um marketplace especializado que organiza dados
          reais de vendas, centraliza ofertas e oferece um ambiente mais seguro, transparente e profissional
          para compradores e vendedores.
        </p>
        <p>
          Nosso objetivo vai além da intermediação: queremos fomentar o mercado brasileiro de cartas graduadas,
          trazendo mais clareza, confiança e estrutura para que ele cresça de forma saudável e sustentável.
        </p>
      </div>

      {/* Values */}
      <h2 className="text-xl font-bold mb-6 text-center">Nossos valores</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: ShieldCheck,
            title: 'Segurança acima de tudo',
            desc: 'Pagamento protegido, vendedores verificados e transações seguras do início ao fim.',
          },
          {
            icon: Target,
            title: 'Transparência de preços',
            desc: 'Dados reais de vendas e histórico confiável para decisões baseadas em informação, não em especulação.',
          },
          {
            icon: Users,
            title: 'Comunidade primeiro',
            desc: 'Feito por colecionadores, para colecionadores. Cada funcionalidade é pensada para quem vive esse hobby.',
          },
          {
            icon: Heart,
            title: 'Paixão pelo hobby',
            desc: 'O GradedBR nasceu da nossa própria paixão pelo colecionismo e da vontade de ver o mercado brasileiro evoluir com mais transparência, segurança e reconhecimento para quem vive esse hobby.',
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
