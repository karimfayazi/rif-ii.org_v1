import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const pool = await getDb();
		
		// Query to get all KML files
		// Assuming a table structure similar to other file tables
		const query = `
			SELECT 
				[ID] as id,
				[Name] as name,
				[Description] as description,
				[FilePath] as filePath,
				[UploadDate] as uploadDate
			FROM [_rifiiorg_db].[dbo].[tblKMLFiles]
			ORDER BY [UploadDate] DESC
		`;
		
		const result = await pool.request().query(query);
		
		const files = result.recordset.map((row: any) => ({
			id: row.id?.toString() || '',
			name: row.name || '',
			description: row.description || '',
			filePath: row.filePath || '',
			uploadDate: row.uploadDate ? new Date(row.uploadDate).toISOString() : new Date().toISOString()
		}));
		
		return NextResponse.json({
			success: true,
			files: files
		});
	} catch (error) {
		console.error("Error fetching KML files:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to fetch KML files",
				error: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

