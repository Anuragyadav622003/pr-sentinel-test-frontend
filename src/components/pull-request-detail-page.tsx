"use client";

import { useParams } from "next/navigation";
import PrReviewWorkspace from "@/components/pr-review-workspace";

export default function PullRequestDetailPage() {
  const params = useParams<{ id: string }>();
  return <PrReviewWorkspace pullRequestId={params.id} />;
}
