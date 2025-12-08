import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const pool = await getDb();
		
		const query = `
			SELECT 
				[ActivityProgress],
				[Sector_Name]
			FROM [_rifiiorg_db].[dbo].[Tracking_Sheet_Sub_Sub_Activity]
			WHERE [Sector_Name] IS NOT NULL 
				AND [ActivityProgress] IS NOT NULL
			ORDER BY [Sector_Name]
		`;
		
		const result = await pool.request().query(query);
		
		return NextResponse.json({
			success: true,
			sectorProgress: result.recordset
		});
		
	} catch (error) {
		console.error("Error fetching sector progress:", error);
		return NextResponse.json({
			success: false,
			message: "Failed to fetch sector progress",
			error: error instanceof Error ? error.message : "Unknown error"
		}, { status: 500 });
	}
}

