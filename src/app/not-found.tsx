import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-accent text-glow-accent">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
        <Link href="/" className="text-accent underline hover:text-accent/90">
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
