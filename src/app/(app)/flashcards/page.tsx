import type { Metadata } from "next";
import { FlashcardsView } from "./FlashcardsView";

export const metadata: Metadata = { title: "Flashcards" };

export default function FlashcardsPage() {
  return <FlashcardsView />;
}
