import { gozemMock } from "@/lib/providers/gozem-mock";
import { paymentMock } from "@/lib/providers/payment-mock";
import type { DeliveryProvider, PaymentProvider } from "@/lib/providers/types";

export function getDeliveryProvider(): DeliveryProvider {
  return gozemMock;
}

export function getPaymentProvider(): PaymentProvider {
  return paymentMock;
}
