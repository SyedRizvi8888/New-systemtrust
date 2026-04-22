"use client";

import AdminPage from "@/pages/AdminPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminRoute() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminPage />
    </ProtectedRoute>
  );
}
