'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getUserWarehouse } from '@/lib/queries';
import { logError } from '@/lib/error-logger';
import { createPaymentLink, cancelPaymentLink as cancelLink } from '@/lib/services/razorpay-service';
import { textBeeService } from '@/lib/textbee';

export interface CreatePaymentLinkResult {
  success: boolean;
  shortUrl?: string;
  smsStatus?: boolean;
  error?: string;
}

/**
 * Create and send payment link to customer
 */
export async function createAndSendPaymentLink(
  customerId: string,
  amount: number,
  description: string,
  recordId?: string
): Promise<CreatePaymentLinkResult> {
  try {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('name, phone')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return { success: false, error: 'Customer not found' };
    }

    if (!customer.phone) {
      return { success: false, error: 'Customer phone number not available' };
    }

    // Create payment link
    const linkResult = await createPaymentLink({
      warehouseId,
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      amount,
      description,
      recordId,
      expiryInDays: 7,
    });

    if (!linkResult.success || !linkResult.shortUrl) {
      return { success: false, error: linkResult.error || 'Failed to create payment link' };
    }

    // Send SMS via TextBee
    const businessName = process.env.RAZORPAY_BUSINESS_NAME || 'GrainFlow';
    const smsMessage = `Dear ${customer.name},\nPending dues: ₹${amount.toLocaleString('en-IN')}\nPay online: ${linkResult.shortUrl}\n- ${businessName}`;

    let smsStatus = false;
    try {
      const smsResult = await textBeeService.sendSMS({ to: customer.phone, message: smsMessage });
      smsStatus = smsResult.success;
    } catch (smsError) {
      logError(smsError as Error, { operation: 'createAndSendPaymentLink:SMS' });
      // Continue even if SMS fails - user can still copy link
    }

    revalidatePath(`/customers/${customerId}`);
    revalidatePath('/customers');

    return {
      success: true,
      shortUrl: linkResult.shortUrl,
      smsStatus,
    };
  } catch (error: any) {
    logError(error, { operation: 'createAndSendPaymentLink', metadata: { customerId } });
    return { success: false, error: error.message || 'Failed to create payment link' };
  }
}

/**
 * Get payment links for a customer
 */
export async function getCustomerPaymentLinks(customerId: string) {
  try {
    const supabase = await createClient();
    const warehouseId = await getUserWarehouse();

    if (!warehouseId) {
      throw new Error('Unauthorized');
    }

    const { data: links, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('customer_id', customerId)
      .eq('warehouse_id', warehouseId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logError(error, { operation: 'getCustomerPaymentLinks' });
      return [];
    }

    return links || [];
  } catch (error) {
    logError(error as Error, { operation: 'getCustomerPaymentLinks' });
    return [];
  }
}

/**
 * Cancel a payment link
 */
export async function cancelPaymentLinkAction(linkId: string) {
  try {
    const result = await cancelLink(linkId);

    if (result.success) {
      revalidatePath('/customers');
    }

    return result;
  } catch (error: any) {
    logError(error, { operation: 'cancelPaymentLinkAction' });
    return { success: false, error: error.message };
  }
}

/**
 * Resend payment link SMS
 */
export async function resendPaymentLinkSMS(linkId: string) {
  try {
    const supabase = await createClient();

    // Get payment link with customer details
    const { data: link, error } = await supabase
      .from('payment_links')
      .select(`
        *,
        customers (name, phone)
      `)
      .eq('id', linkId)
      .single();

    if (error || !link || !link.customers) {
      return { success: false, error: 'Payment link not found' };
    }

    if (link.status !== 'active') {
      return { success: false, error: 'Payment link is not active' };
    }

    const customer = link.customers as any;
    const businessName = process.env.RAZORPAY_BUSINESS_NAME || 'GrainFlow';
    const smsMessage = `Dear ${customer.name},\nPending dues: ₹${link.amount.toLocaleString('en-IN')}\nPay online: ${link.short_url}\n- ${businessName}`;

    const smsResult = await textBeeService.sendSMS({ to: customer.phone, message: smsMessage });

    return {
      success: smsResult.success,
      error: smsResult.success ? undefined : 'Failed to send SMS',
    };
  } catch (error: any) {
    logError(error, { operation: 'resendPaymentLinkSMS' });
    return { success: false, error: error.message };
  }
}
