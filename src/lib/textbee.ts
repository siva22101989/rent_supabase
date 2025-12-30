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
   * Split long messages into multiple SMS parts (160 chars per part)
   * Returns array of message parts
   */
  private splitMessage(message: string, maxLength = 153): string[] {
    // Reserve 7 chars for "(1/2)" suffix
    if (message.length <= 160) {
      return [message];
    }

    const parts: string[] = [];
    const words = message.split(' ');
    let currentPart = '';
    
    for (const word of words) {
      const testPart = currentPart ? `${currentPart} ${word}` : word;
      if (testPart.length <= maxLength) {
        currentPart = testPart;
      } else {
        if (currentPart) parts.push(currentPart);
        currentPart = word;
      }
    }
    
    if (currentPart) parts.push(currentPart);
    
    // Add part numbers
    return parts.map((part, i) => `${part} (${i + 1}/${parts.length})`);
  }

  /**
   * Send payment reminder SMS
   */
  async sendPaymentReminder({
    warehouseName,
    customerName,
    phone,
    amount,
    recordNumber,
  }: {
    warehouseName: string;
    customerName: string;
    phone: string;
    amount: number;
    recordNumber: string;
  }): Promise<SMSResponse> {
    const message = `${warehouseName}
Payment Due: Rs.${amount.toLocaleString('en-IN')}
Record: ${recordNumber}
Customer: ${customerName}
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
    warehouseName,
    customerName,
    phone,
    amount,
    recordNumber,
  }: {
    warehouseName: string;
    customerName: string;
    phone: string;
    amount: number;
    recordNumber: string;
  }): Promise<SMSResponse> {
    const message = `${warehouseName}
Payment Received: Rs.${amount.toLocaleString('en-IN')}
Record: ${recordNumber}
Thank you, ${customerName}!`;

    return this.sendSMS({
      to: phone,
      message,
    });
  }

  /**
   * Send inflow welcome SMS (when storage starts)
   * Detailed format with all information
   */
  async sendInflowWelcome({
    warehouseName,
    customerName,
    phone,
    commodity,
    bags,
    recordNumber,
    storageDate,
    location,
  }: {
    warehouseName: string;
    customerName: string;
    phone: string;
    commodity: string;
    bags: number;
    recordNumber: string;
    storageDate?: string;
    location?: string;
  }): Promise<SMSResponse> {
    // Build detailed message
    let message = `${warehouseName}
Storage Started
Record: ${recordNumber}
Customer: ${customerName}
Item: ${commodity}
Bags: ${bags}`;

    if (location) {
      message += `\nLocation: ${location}`;
    }
    
    if (storageDate) {
      message += `\nDate: ${storageDate}`;
    }

    // Check if message needs splitting
    const parts = this.splitMessage(message);
    
    if (parts.length === 1) {
      return this.sendSMS({ to: phone, message });
    }

    // Send multiple parts
    const results: SMSResponse[] = [];
    for (const part of parts) {
      const result = await this.sendSMS({ to: phone, message: part });
      results.push(result);
      
      // Small delay between parts
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Return combined result
    const allSuccessful = results.every(r => r.success);
    return {
      success: allSuccessful,
      messageId: results.map(r => r.messageId).join(','),
      error: allSuccessful ? undefined : 'Some parts failed to send',
    };
  }

  /**
   * Send outflow confirmation SMS (when withdrawal happens)
   * Detailed format with all information
   */
  async sendOutflowConfirmation({
    warehouseName,
    customerName,
    phone,
    commodity,
    bags,
    recordNumber,
    invoiceNumber,
    rentAmount,
    hamaliAmount,
    totalAmount,
  }: {
    warehouseName: string;
    customerName: string;
    phone: string;
    commodity: string;
    bags: number;
    recordNumber: string;
    invoiceNumber: string;
    rentAmount?: number;
    hamaliAmount?: number;
    totalAmount?: number;
  }): Promise<SMSResponse> {
    // Build detailed message
    let message = `${warehouseName}
Withdrawal Confirmed
Invoice: ${invoiceNumber}
Record: ${recordNumber}
Customer: ${customerName}
Item: ${commodity}
Bags Withdrawn: ${bags}`;

    if (rentAmount !== undefined) {
      message += `\nRent: Rs.${rentAmount.toLocaleString('en-IN')}`;
    }
    
    if (hamaliAmount !== undefined && hamaliAmount > 0) {
      message += `\nHamali: Rs.${hamaliAmount.toLocaleString('en-IN')}`;
    }
    
    if (totalAmount !== undefined) {
      message += `\nTotal: Rs.${totalAmount.toLocaleString('en-IN')}`;
    }

    message += `\nThank you!`;

    // Check if message needs splitting
    const parts = this.splitMessage(message);
    
    if (parts.length === 1) {
      return this.sendSMS({ to: phone, message });
    }

    // Send multiple parts
    const results: SMSResponse[] = [];
    for (const part of parts) {
      const result = await this.sendSMS({ to: phone, message: part });
      results.push(result);
      
      // Small delay between parts
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Return combined result
    const allSuccessful = results.every(r => r.success);
    return {
      success: allSuccessful,
      messageId: results.map(r => r.messageId).join(','),
      error: allSuccessful ? undefined : 'Some parts failed to send',
    };
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
