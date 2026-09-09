import { COUNTRY } from "@/data/catalog";
import type { PaymentMethod, PaymentProvider, PaymentSession } from "@/lib/providers/types";

const COLLECT_TO = process.env.AIDCELIX_MOMO_MSISDN ?? "674246887";

const sessions = new Map<string, PaymentSession>();

export const paymentMock: PaymentProvider = {
  async initiate(orderId, amount, currency, method, _payerMsisdn) {
    const session: PaymentSession = {
      sessionId: `pay-${orderId}-${Date.now()}`,
      method,
      amount,
      currency: currency || COUNTRY.currency,
      collectTo: COLLECT_TO,
      status: "pending",
    };
    sessions.set(session.sessionId, session);
    return session;
  },

  async confirm(sessionId, succeed = true) {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error("Payment session not found");
    }
    const updated: PaymentSession = {
      ...session,
      status: succeed ? "succeeded" : "failed",
      providerRef: succeed ? `MOMO-${session.method.toUpperCase()}-${Date.now()}` : undefined,
    };
    sessions.set(sessionId, updated);
    return updated;
  },
};

export function methodLabel(method: PaymentMethod) {
  return method === "orange" ? "Orange Money" : "MTN Money";
}
