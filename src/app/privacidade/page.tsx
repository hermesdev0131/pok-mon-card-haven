export default function Privacidade() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Política de Privacidade</h1>
      <p className="text-muted-foreground leading-relaxed mb-8">Última atualização: Dezembro de 2024</p>
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-3">1. Dados Coletados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Coletamos dados necessários para o funcionamento do marketplace: nome, e-mail, endereço de entrega e informações de pagamento. Dados de navegação são coletados de forma anônima para melhorias.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-3">2. Uso dos Dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Seus dados são utilizados exclusivamente para processar transações, verificar vendedores, enviar notificações relevantes e melhorar a plataforma.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-3">3. Compartilhamento</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Não vendemos seus dados. Compartilhamos apenas o necessário com processadores de pagamento e serviços de logística para concluir as transações.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-3">4. Segurança</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Utilizamos criptografia e boas práticas de segurança para proteger seus dados. Informações de pagamento são processadas por parceiros certificados PCI-DSS.</p>
        </section>
      </div>
    </div>
  );
}
