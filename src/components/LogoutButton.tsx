"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Facebook, Youtube } from "lucide-react";

export default function LogoutButton() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	async function handleLogout() {
		setLoading(true);
		try {
			await fetch("/api/logout", { method: "POST" });
			router.replace("/login");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex items-center gap-2">
			{/* Social Media Icons */}
			<a
				href="https://www.facebook.com"
				target="_blank"
				rel="noopener noreferrer"
				className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
				aria-label="Facebook"
			>
				<Facebook className="h-4 w-4" />
			</a>
			<a
				href="https://www.youtube.com"
				target="_blank"
				rel="noopener noreferrer"
				className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
				aria-label="YouTube"
			>
				<Youtube className="h-4 w-4" />
			</a>
			{/* Logout Button */}
			<button
				onClick={handleLogout}
				disabled={loading}
				className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-60 flex items-center gap-2"
			>
				<LogOut className="h-4 w-4" />
				{loading ? "Logging out..." : "Logout"}
			</button>
		</div>
	);
}


