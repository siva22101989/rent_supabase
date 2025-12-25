/**
 * TextBee SMS Service
 * Handles sending SMS via TextBee API
 */

interface SendSMSParams {
  to: string; // Phone number (10 digits)
  message: string;
  senderId?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class TextBeeService {
  private apiKey: string;
  private deviceId: string;
  private baseUrl = 'https://api.textbee.dev/api/v1';

  constructor() {
    this.apiKey = process.env.TEXTBEE_API_KEY || '';
    this.deviceId = process.env.TEXTBEE_DEVICE_ID || ''; // Need device ID

    if (!this.apiKey) {
      console.warn('TextBee API key not configured');
    }
    if (!this.deviceId) {
      console.warn('TextBee Device ID not configured. Get it from your TextBee dashboard.');
    }
  }

  /**
   * Send SMS via TextBee
   */
  async sendSMS({ to, message }: SendSMSParams): Promise<SMSResponse> {
    try {
      // Validate phone number (remove +91 if present, ensure 10 digits)
      const cleanPhone = to.replace(/^\+91/, '').replace(/\D/g, '');
      
      if (cleanPhone.length !== 10) {
        return {
          success: false,
          error: 'Invalid phone number. Must be 10 digits.',
        };
      }

      if (!this.deviceId) {
        return {
          success: false,
          error: 'TextBee Device ID not configured. Please add TEXTBEE_DEVICE_ID to .env.local',
        };
      }

      // TextBee API request (correct format)
      const response = await fetch(`${this.baseUrl}/gateway/devices/${this.deviceId}/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          recipients: [`+91${cleanPhone}`], // Array of phone numbers with country code
          message: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('TextBee API error:', data);
        return {
          success: false,
          error: data.message || data.error || 'Failed to send SMS',
        };
      }

      return {
        success: true,
        messageId: data.id || data.messageId,
      };
    } catch (error) {
      console.error('TextBee service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send payment reminder SMS
   */
  async sendPaymentReminder({
    customerName,
    phone,
    amount,
    recordNumber,
  }: {
    customerName: string;
    phone: string;
    amount: number;
    recordNumber: string;
  }): Promise<SMSResponse> {
    const message = `Payment Due: Rs.${amount.toLocaleString('en-IN')}
Record: ${recordNumber}
Customer: ${customerName}
Contact: ${phone}
Please clear dues at earliest.`;

    return this.sendSMS({
      to: phone,
      message,
    });
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation({
    customerName,
    phone,
    amount,
    recordNumber,
  }: {
    customerName: string;
    phone: string;
    amount: number;
    recordNumber: string;
  }): Promise<SMSResponse> {
    const message = `Payment Received: Rs.${amount.toLocaleString('en-IN')}
Record: ${recordNumber}
Thank you, ${customerName}!
- BagBill`;

    return this.sendSMS({
      to: phone,
      message,
    });
  }

  /**
   * Send inflow welcome SMS (when storage starts)
   */
  async sendInflowWelcome({
    customerName,
    phone,
    commodity,
    bags,
    recordNumber,
  }: {
    customerName: string;
    phone: string;
    commodity: string;
    bags: number;
    recordNumber: string;
  }): Promise<SMSResponse> {
    const message = `Welcome to BagBill!
Storage Started
Record: ${recordNumber}
Item: ${commodity}
Bags: ${bags}
Customer: ${customerName}
- BagBill`;

    return this.sendSMS({
      to: phone,
      message,
    });
  }

  /**
   * Send outflow confirmation SMS (when withdrawal happens)
   */
  async sendOutflowConfirmation({
    customerName,
    phone,
    commodity,
    bags,
    recordNumber,
    invoiceNumber,
  }: {
    customerName: string;
    phone: string;
    commodity: string;
    bags: number;
    recordNumber: string;
    invoiceNumber: string;
  }): Promise<SMSResponse> {
    const message = `Withdrawal Confirmed
Invoice: ${invoiceNumber}
Record: ${recordNumber}
Item: ${commodity}
Bags Withdrawn: ${bags}
Thank you, ${customerName}!
- BagBill`;

    return this.sendSMS({
      to: phone,
      message,
    });
  }

  /**
   * Send bulk SMS to multiple customers
   */
  async sendBulkSMS(recipients: SendSMSParams[]): Promise<SMSResponse[]> {
    const results = await Promise.allSettled(
      recipients.map(recipient => this.sendSMS(recipient))
    );

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { success: false, error: 'Failed to send' }
    );
  }
}

// Singleton instance
export const textBeeService = new TextBeeService();
