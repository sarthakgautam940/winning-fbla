import type { Metadata } from "next";
import { ReviewView } from "./ReviewView";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage() {
  return <ReviewView />;
}
