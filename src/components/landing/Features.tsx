import { BarChart3, Users, Zap } from 'lucide-react'
import Image from 'next/image'

const features = [
  {
    title: "Smart Inventory & Logistics",
    description: "Track inflow and outflow with zero friction. From paddy to wheat, manage everything in real-time with automated balance checks.",
    image: "/screenshots/storage.png",
    icon: Zap,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    reverse: false
  },
  {
    title: "Transparent Payments",
    description: "No more calculation errors. Automated billing cycles (6 months vs 1 year) handles rent, hamali, and expenses automatically.",
    image: "/screenshots/payments.png",
    icon: BarChart3,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    reverse: true
  },
  {
    title: "Customer CRM",
    description: "Empower your clients with transparency. Track full transaction histories for every customer profile in one central location.",
    image: "/screenshots/customers.png",
    icon: Users,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
    reverse: false
  }
]

export function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto space-y-32">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need to run at scale</h2>
          <p className="text-lg text-muted-foreground">
            Built by agriculture experts for warehouse owners. Ditch the paperwork and step into the digital age.
          </p>
        </div>

        {features.map((feature, index) => (
          <div key={index} className={`grid lg:grid-cols-2 gap-16 items-center ${feature.reverse ? 'lg:flex-row-reverse' : ''}`}>
            <div className={`space-y-6 ${feature.reverse ? 'lg:order-2' : ''}`}>
              <div className={`h-12 w-12 rounded-xl ${feature.bgColor} ${feature.color} flex items-center justify-center`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-bold">{feature.title}</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              <ul className="space-y-3">
                {["Real-time status updates", "Export as PDF/Excel", "SMS Notifications ready"].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-medium">
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={`relative group ${feature.reverse ? 'lg:order-1' : ''}`}>
               <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="rounded-xl border bg-card shadow-xl overflow-hidden shadow-primary/5 transition-transform duration-500 group-hover:scale-[1.02]">
                 <div className="relative aspect-video w-full">
                    <Image 
                      src={feature.image} 
                      alt={feature.title} 
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
