
import type { FC, ReactNode } from 'react';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  backHref?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export const PageHeader: FC<PageHeaderProps> = ({ title, description, children, backHref, breadcrumbs }) => {
  return (
    <div className="mb-6 flex flex-col gap-4">
      {backHref && (
        <Button variant="ghost" size="sm" asChild className="w-fit p-0 h-auto hover:bg-transparent hover:text-primary -ml-1 text-muted-foreground">
            <Link href={backHref} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
            </Link>
        </Button>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-2">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
};
