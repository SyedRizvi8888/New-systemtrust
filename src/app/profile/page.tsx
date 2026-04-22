"use client";

import ProfilePage from "@/pages/ProfilePage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function ProfileRoute() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}
