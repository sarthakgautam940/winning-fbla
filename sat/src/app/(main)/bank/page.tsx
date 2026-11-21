import type { Metadata } from "next";
import { BankView } from "@/components/BankView";

export const metadata: Metadata = { title: "Question bank" };

export default function BankPage() {
  return <BankView />;
}
