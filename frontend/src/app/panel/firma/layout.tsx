import { SubscriptionGate } from "@/components/SubscriptionGate";

export default function FirmaLayout({ children }: { children: React.ReactNode }) {
  return <SubscriptionGate>{children}</SubscriptionGate>;
}
