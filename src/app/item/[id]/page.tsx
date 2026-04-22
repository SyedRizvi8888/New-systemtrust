"use client";

import ItemDetailPage from "@/pages/ItemDetailPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function ItemDetailRoute() {
  return (
    <ProtectedRoute>
      <ItemDetailPage />
    </ProtectedRoute>
  );
}
