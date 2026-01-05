import { ComponentProps } from "react"

export function GrainFlowLogo(props: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Wheat Stalk / G shape - Gold/Amber */}
      <path 
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2" 
        className="stroke-amber-500"
        strokeWidth="2.5"
      />
      <path 
        d="M12 2V12" 
        className="stroke-amber-500" 
      />
      <path 
        d="M12 6L16 3" 
        className="stroke-amber-500" 
      />
      <path 
        d="M12 9L15 7" 
        className="stroke-amber-500" 
      />
      
      {/* Flow / Water / Logistics - Blue/Teal */}
      <path 
        d="M2 12C2 12 5 18 12 18C19 18 20 14 20 14" 
        className="stroke-sky-500"
        strokeWidth="2.5"
      />
    </svg>
  )
}
