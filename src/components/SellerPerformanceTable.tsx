import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import type { SellerPerformanceStats } from '@/db/api';

interface SellerPerformanceTableProps {
  data: SellerPerformanceStats[];
  loading?: boolean;
}

export default function SellerPerformanceTable({ data, loading = false }: SellerPerformanceTableProps) {
  const getApprovalRateBadge = (rate: number) => {
    if (rate >= 90) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300">
        <TrendingUp className="h-3 w-3 mr-1" />
        {rate.toFixed(1)}%
      </Badge>;
    } else if (rate >= 70) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300">
        {rate.toFixed(1)}%
      </Badge>;
    } else if (rate >= 50) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-300">
        {rate.toFixed(1)}%
      </Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300">
        <TrendingDown className="h-3 w-3 mr-1" />
        {rate.toFixed(1)}%
      </Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seller Performance</CardTitle>
          <CardDescription>Top sellers by approval rate and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seller Performance</CardTitle>
          <CardDescription>Top sellers by approval rate and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No seller performance data available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seller Performance</CardTitle>
        <CardDescription>
          Top sellers by approval rate and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Store</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approved
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />
                    Rejected
                  </div>
                </TableHead>
                <TableHead className="text-center">Approval Rate</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Avg Time
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((seller) => (
                <TableRow key={seller.seller_id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {seller.seller_name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{seller.store_name}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <Badge variant="secondary">{seller.total_products}</Badge>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {seller.approved_products}
                    </span>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {seller.rejected_products}
                    </span>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    {getApprovalRateBadge(seller.approval_rate)}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <span className="text-sm text-muted-foreground">
                      {seller.avg_approval_hours > 0 
                        ? `${seller.avg_approval_hours}h` 
                        : 'N/A'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
