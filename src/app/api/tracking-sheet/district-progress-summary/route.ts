import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const pool = await getDb();
		
		const query = `
			SELECT 
				[District],
				AVG([ActivityProgress]) AS AvgActivityProgress
			FROM [_rifiiorg_db].[dbo].[Tracking_Sheet_Sub_Sub_Activity]
			WHERE [District] IS NOT NULL 
				AND [ActivityProgress] IS NOT NULL
			GROUP BY [District]
			ORDER BY [District]
		`;
		
		const result = await pool.request().query(query);
		
		return NextResponse.json({
			success: true,
			districtProgress: result.recordset
		});
		
	} catch (error) {
		console.error("Error fetching district progress:", error);
		return NextResponse.json({
			success: false,
			message: "Failed to fetch district progress",
			error: error instanceof Error ? error.message : "Unknown error"
		}, { status: 500 });
	}
}

