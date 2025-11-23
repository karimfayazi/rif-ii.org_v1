"use client";

import type { ReactNode } from "react";
import MasterLayout from "@/components/MasterLayout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return <MasterLayout>{children}</MasterLayout>;
}
