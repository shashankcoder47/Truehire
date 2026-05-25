export class PaymentsApi {
  constructor(apiClient) {
    this.api = apiClient;
  }

  createPremiumOrder(token, payload = { planId: 'premium-monthly' }) {
    return this.api.post('/payments/create-premium-order', payload, { token });
  }

  verifyPremium(token, payload) {
    return this.api.post('/payments/verify-premium', payload, { token });
  }

  status(token) {
    return this.api.get('/payments/status', { token });
  }
}
