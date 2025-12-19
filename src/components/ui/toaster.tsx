
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="gap-3">
            {props.variant === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
            {props.variant === 'destructive' && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
            {props.variant === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
            
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
