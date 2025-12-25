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
  private senderId: string;
  private baseUrl = 'https://api.textbee.in/api/v1';

  constructor() {
    this.apiKey = process.env.TEXTBEE_API_KEY || '';
    this.senderId = process.env.TEXTBEE_SENDER_ID || 'TXTBEE';

    if (!this.apiKey) {
      console.warn('TextBee API key not configured');
    }
  }

  /**
   * Send SMS via TextBee
   */
  async sendSMS({ to, message, senderId }: SendSMSParams): Promise<SMSResponse> {
    try {
      // Validate phone number (remove +91 if present, ensure 10 digits)
      const cleanPhone = to.replace(/^\+91/, '').replace(/\D/g, '');
      
      if (cleanPhone.length !== 10) {
        return {
          success: false,
          error: 'Invalid phone number. Must be 10 digits.',
        };
      }

      // TextBee API request
      const response = await fetch(`${this.baseUrl}/message/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          sender_id: senderId || this.senderId,
          recipient: cleanPhone,
          message: message,
          type: 'text', // or 'unicode' for regional languages
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('TextBee API error:', data);
        return {
          success: false,
          error: data.message || 'Failed to send SMS',
        };
      }

      return {
        success: true,
        messageId: data.message_id || data.id,
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
