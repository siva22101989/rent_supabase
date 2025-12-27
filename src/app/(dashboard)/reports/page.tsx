import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, TrendingUp, BarChart3, DollarSign, Package } from "lucide-react";

// Revalidate every 5 minutes - reports are less time-sensitive
export const revalidate = 300;

export default async function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description="Access comprehensive reports and business insights"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Reports' }
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Financial Analytics */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>Financial Analytics</CardTitle>
            </div>
            <CardDescription>
              Revenue trends, collection metrics, and outstanding dues analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/reports/financial">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Financial Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Operational Analytics */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>Operational Analytics</CardTitle>
            </div>
            <CardDescription>
              Capacity utilization, turnover metrics, and customer behavior insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/reports/operations">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Operations Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Custom Reports */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Custom Reports</CardTitle>
            </div>
            <CardDescription>
              Generate APMC checklists, filtered transaction lists, and exportable data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/reports/custom">
                <FileText className="mr-2 h-4 w-4" />
                Create Custom Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
