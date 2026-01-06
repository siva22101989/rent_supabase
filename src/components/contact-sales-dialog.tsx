
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Phone, MessageCircle } from "lucide-react"
import { ComponentProps } from "react"

interface ContactSalesDialogProps extends ComponentProps<typeof Dialog> {
  children: React.ReactNode
}

export function ContactSalesDialog({ children, ...props }: ContactSalesDialogProps) {
  return (
    <Dialog {...props}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Contact Sales Team</DialogTitle>
          <DialogDescription className="text-center">
            Choose how you would like to connect with us. We're here to help!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button 
            size="lg" 
            className="w-full gap-3 text-lg h-14" 
            onClick={() => window.open('tel:+919160606633', '_self')}
          >
            <Phone className="h-5 w-5" />
            Call +91 9160606633
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <Button 
            size="lg" 
            className="w-full gap-3 text-lg h-14 bg-[#25D366] hover:bg-[#128C7E] text-white" 
            onClick={() => window.open('https://wa.me/919160606633', '_blank')}
          >
            <MessageCircle className="h-5 w-5" />
            Chat on WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
