'use client';

import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { getShareableFilterUrl } from '@/lib/url-filters';

interface ShareFilterButtonProps {
  filters: any;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

/**
 * Button to share current filtered view via URL
 * Uses native share API on mobile, clipboard on desktop
 */
export function ShareFilterButton({ 
  filters, 
  variant = 'outline', 
  size = 'sm',
  showLabel = true 
}: ShareFilterButtonProps) {
  const [copied, setCopied] = useState(false);
  
  const handleShare = async () => {
    const url = getShareableFilterUrl(filters);
    
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Filtered View',
          text: 'Check out this filtered view',
          url: url,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to clipboard
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
    
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };
  
  return (
    <Button variant={variant} size={size} onClick={handleShare} aria-label="Share filtered view">
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          {showLabel && size !== 'icon' && <span className="ml-2">Copied!</span>}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {showLabel && size !== 'icon' && <span className="ml-2">Share</span>}
        </>
      )}
    </Button>
  );
}
