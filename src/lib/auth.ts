export function getUserIdFromCookie(): string | null {
	const authCookie = document.cookie
		.split("; ")
		.find((row) => row.startsWith("auth="))
		?.split("=")[1];

	if (authCookie && authCookie.startsWith("authenticated:")) {
		return authCookie.split(":")[1];
	}
	return null;
}

export function getUserIdFromRequest(request: { headers: { get: (name: string) => string | null } }): string | null {
	const cookie = request.headers.get("cookie") || "";
	// Try multiple patterns to extract user ID from cookie
	const patterns = [
		/auth=authenticated:(.*?)(?:;|$)/,
		/auth="authenticated:(.*?)"/,
		/auth=authenticated%3A(.*?)(?:;|$)/  // URL encoded colon
	];
	
	for (const pattern of patterns) {
		const match = cookie.match(pattern);
		if (match && match[1]) {
			return decodeURIComponent(match[1]);
		}
	}
	
	return null;
}

export async function checkDeleteAccess(userId: string | null): Promise<{ hasAccess: boolean; message?: string }> {
	if (!userId) {
		return { hasAccess: false, message: "Unauthorized" };
	}

	try {
		const { getDb } = await import("@/lib/db");
		const pool = await getDb();
		const accessQuery = `
			SELECT [access_delete]
			FROM [_rifiiorg_db].[dbo].[tbl_user_access]
			WHERE [username] = @userId OR [email] = @userId
		`;
		
		const accessResult = await pool.request()
			.input('userId', userId)
			.query(accessQuery);
		
		if (accessResult.recordset.length === 0) {
			return { hasAccess: false, message: "User not found" };
		}

		const accessDelete = accessResult.recordset[0].access_delete;
		const hasAccess = accessDelete === true || accessDelete === 1;
		
		if (!hasAccess) {
			return { 
				hasAccess: false, 
				message: "Insufficient Permissions. This action requires delete access. Please contact your administrator if you believe this is an error." 
			};
		}

		return { hasAccess: true };
	} catch (error) {
		console.error("Error checking delete access:", error);
		return { hasAccess: false, message: "Error checking access permissions" };
	}
}