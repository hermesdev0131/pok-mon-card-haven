import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Lock, CheckCircle, Star, ArrowRight, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/hero-cards.jpg" alt="Cartas Pokémon graduadas" fill className="object-cover opacity-20" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" />
        </div>
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Compre e venda cartas graduadas com{' '}
              <span className="text-accent">confiança real</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Histórico de vendas transparente, vendedores verificados e pagamento protegido. O marketplace brasileiro que coleciona confiança.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/marketplace">Explorar marketplace <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/sell">Anunciar carta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">Como funciona</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: BarChart3, title: 'Pesquise e compare', desc: 'Encontre a carta ideal com histórico real de preços e vendas anteriores.' },
            { icon: Shield, title: 'Compre com segurança', desc: 'Pagamento retido até o comprador confirmar o recebimento.' },
            { icon: CheckCircle, title: 'Receba verificado', desc: 'Vendedores com selo de confiança e avaliações reais de compradores.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border/50 text-center">
              <CardContent className="p-8 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Segurança */}
      <section className="bg-secondary/50">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <Lock className="mx-auto h-10 w-10 text-accent" />
            <h2 className="text-2xl font-bold">Pagamento protegido</h2>
            <p className="text-muted-foreground leading-relaxed">
              O valor da compra fica retido com segurança até que o comprador confirme o recebimento e verifique a carta. Só então o vendedor recebe o pagamento.
            </p>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">O que dizem nossos usuários</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { name: 'João M.', text: 'Comprei um Charizard PSA 10 e o processo foi impecável. Confiança total!' },
            { name: 'Fernanda R.', text: 'Como vendedora, adoro a transparência do histórico de preços. Ajuda muito.' },
            { name: 'Bruno M.', text: 'Melhor marketplace de cartas graduadas do Brasil. O selo verificado faz diferença.' },
          ].map(({ name, text }) => (
            <Card key={name} className="border-border/50">
              <CardContent className="p-6 space-y-3">
                <div className="flex gap-1">{Array(5).fill(0).map((_, i) => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{text}&rdquo;</p>
                <p className="font-medium text-sm">{name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-secondary/50">
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-2xl font-bold text-center mb-12">Perguntas frequentes</h2>
          <div className="mx-auto max-w-2xl">
            <Accordion type="single" collapsible>
              {[
                { q: 'Como funciona o pagamento protegido?', a: 'O valor fica retido até o comprador confirmar o recebimento da carta em bom estado.' },
                { q: 'Como sei que o vendedor é confiável?', a: 'Vendedores verificados passam por um processo de validação e têm histórico de vendas público.' },
                { q: 'Posso devolver uma carta?', a: 'Sim, se a carta não corresponder ao anúncio, você pode abrir uma disputa e solicitar reembolso.' },
                { q: 'Quais empresas de grading são aceitas?', a: 'Aceitamos cartas graduadas por PSA, BGS e CGC.' },
              ].map(({ q, a }, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-sm font-medium">{q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
}
