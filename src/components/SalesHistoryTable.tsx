import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GradeBadge } from './GradeBadge';
import { FlagIcon } from './FlagIcon';
import type { SaleRecord } from '@/types';

export function SalesHistoryTable({ sales }: { sales: SaleRecord[] }) {
  if (!sales.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">Nenhum histórico de vendas disponível.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Comprador</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Idioma</TableHead>
            <TableHead className="text-right">Preço</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm">{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell className="text-sm">{sale.sellerName}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{sale.buyerName}</TableCell>
              <TableCell><GradeBadge grade={sale.grade} company={sale.gradeCompany} /></TableCell>
              <TableCell><FlagIcon code={sale.language} /></TableCell>
              <TableCell className="text-right font-semibold">R$ {sale.price.toLocaleString('pt-BR')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
