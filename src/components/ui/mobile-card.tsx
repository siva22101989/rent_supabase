import { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MobileCardProps {
  children: ReactNode
  className?: string
}

export function MobileCard({ children, className = '' }: MobileCardProps) {
  return (
    <Card className={`${className}`}>
      {children}
    </Card>
  )
}

interface MobileCardHeaderProps {
  children: ReactNode
}

function MobileCardHeader({ children }: MobileCardHeaderProps) {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-2">
        {children}
      </div>
    </CardHeader>
  )
}

interface MobileCardTitleProps {
  children: ReactNode
}

function MobileCardTitle({ children }: MobileCardTitleProps) {
  return <h3 className="font-semibold text-base leading-tight">{children}</h3>
}

interface MobileCardBadgeProps {
  children: ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

function MobileCardBadge({ children, variant = 'secondary' }: MobileCardBadgeProps) {
  return <Badge variant={variant} className="shrink-0">{children}</Badge>
}

interface MobileCardContentProps {
  children: ReactNode
}

function MobileCardContent({ children }: MobileCardContentProps) {
  return (
    <CardContent className="space-y-2 pb-3">
      {children}
    </CardContent>
  )
}

interface MobileCardRowProps {
  label: string
  value: ReactNode
  className?: string
}

function MobileCardRow({ label, value, className = '' }: MobileCardRowProps) {
  return (
    <div className={`flex justify-between items-center text-sm ${className}`}>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

interface MobileCardActionsProps {
  children: ReactNode
}

function MobileCardActions({ children }: MobileCardActionsProps) {
  return (
    <CardContent className="pt-0 pb-4">
      <div className="flex gap-2 flex-wrap">
        {children}
      </div>
    </CardContent>
  )
}

// Attach sub-components
MobileCard.Header = MobileCardHeader
MobileCard.Title = MobileCardTitle
MobileCard.Badge = MobileCardBadge
MobileCard.Content = MobileCardContent
MobileCard.Row = MobileCardRow
MobileCard.Actions = MobileCardActions
