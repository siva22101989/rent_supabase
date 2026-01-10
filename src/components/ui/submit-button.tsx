'use client';

import { useFormStatus } from 'react-dom';
import { Button, ButtonProps } from '@/components/ui/button';

export function SubmitButton({ children, isLoading: externalLoading, disabled, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  
  // Use external isLoading if provided (for client-side handlers), otherwise use form status (for server actions)
  const isLoading = externalLoading ?? pending;
  const isDisabled = disabled || isLoading;

  return (
    <Button type="submit" isLoading={isLoading} disabled={isDisabled} {...props}>
      {children}
    </Button>
  );
}
