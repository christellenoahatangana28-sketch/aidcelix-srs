import { medindexMock } from "@/lib/providers/medindex-mock";
import { gozemMock } from "@/lib/providers/gozem-mock";
import { paymentMock } from "@/lib/providers/payment-mock";
import type { DeliveryProvider, PaymentProvider, PricingProvider } from "@/lib/providers/types";

const mode = process.env.PROVIDER_MODE ?? "mock";

export function getPricingProvider(): PricingProvider {
  return medindexMock;
}

export function getDeliveryProvider(): DeliveryProvider {
  return gozemMock;
}

export function getPaymentProvider(): PaymentProvider {
  return paymentMock;
}

export const providerMode = mode;
