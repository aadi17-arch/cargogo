import api from './api';
import { ApiResponse } from '../types/api.types';

export interface PaymentReceipt {
  id: string;
  bookingId: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export const paymentService = {
  async processCheckout(bookingId: string, paymentMethod: string, amount: number): Promise<PaymentReceipt> {
    const response = await api.post<ApiResponse<PaymentReceipt>>('/payment/checkout', {
      bookingId,
      paymentMethod,
      amount,
    }, {
      headers: {
        'idempotency-key': `pay-${bookingId}`
      }
    });
    return response.data.data!;
  },
};
