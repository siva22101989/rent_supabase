'use client';

import { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, CheckCircle2 } from 'lucide-react';

export function QRScanner() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (result: any) => {
    if (result) {
      const scannedValue = result?.text || result;
      setResult(scannedValue);
      setScanning(false);
      
      // Navigate to the storage record
      // Assuming QR contains the record ID (REC-1001 format)
      setTimeout(() => {
        router.push(`/storage?search=${scannedValue}`);
      }, 1000);
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setError('Camera access denied or not available');
    setScanning(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!scanning && !result && (
            <div className="text-center py-8">
              <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Point your camera at a storage record QR code
              </p>
              <Button onClick={() => setScanning(true)}>
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            </div>
          )}

          {scanning && (
            <div className="relative">
              <div className="rounded-lg overflow-hidden border-2 border-primary">
                <QrReader
                  onResult={handleScan}
                  constraints={{ facingMode: 'environment' }}
                  containerStyle={{ width: '100%' }}
                />
              </div>
              
              <div className="absolute top-4 right-4">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setScanning(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Align QR code within the frame
                </p>
              </div>
            </div>
          )}

          {result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Scanned:</strong> {result}
                <br />
                <span className="text-sm text-muted-foreground">
                  Redirecting to record...
                </span>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!scanning && result && (
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
              >
                Scan Another
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Click "Start Scanning" to activate your camera</li>
            <li>Point your camera at the QR code on a storage record receipt</li>
            <li>Hold steady until the code is recognized</li>
            <li>You'll be automatically redirected to the record details</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
