import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('userId');
		
		if (!userId) {
			return NextResponse.json({
				success: false,
				message: "User ID is required"
			}, { status: 400 });
		}

		const pool = await getDb();
		const query = `
			SELECT [access_level]
			FROM [_rifiiorg_db].[dbo].[tbl_user_access]
			WHERE [username] = @userId OR [email] = @userId
		`;
		
		const result = await pool.request()
			.input('userId', userId)
			.query(query);
			
		if (result.recordset.length === 0) {
			return NextResponse.json({
				success: false,
				message: "User not found",
				accessLevel: null
			});
		}
		
		const accessLevel = result.recordset[0].access_level;
		// Check if access_level is exactly 'Admin' (case-sensitive as per database requirement)
		const isAdmin = accessLevel === 'Admin';
		
		return NextResponse.json({
			success: true,
			accessLevel: accessLevel,
			isAdmin: isAdmin,
			canUpload: isAdmin,
			canManageCategories: isAdmin,
			canManageSubCategories: isAdmin
		});
	} catch (error) {
		console.error("Error checking user access:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to check user access",
				error: error instanceof Error ? error.message : "Unknown error",
				accessLevel: null,
				isAdmin: false,
				canUpload: false,
				canManageCategories: false,
				canManageSubCategories: false
			},
			{ status: 500 }
		);
	}
}
