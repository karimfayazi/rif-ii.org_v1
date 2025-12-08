import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const pool = await getDb();
		
		const query = `
			SELECT 
				[EventType],
				[District],
				SUM([TotalMale]) AS TotalMale,
				SUM([TotalFemale]) AS TotalFemale,
				SUM([TotalParticipants]) AS TotalParticipants
			FROM [_rifiiorg_db].[rifiiorg].[TrainingEvents]
			WHERE [EventType] IS NOT NULL 
				AND [District] IS NOT NULL
			GROUP BY [EventType], [District]
			ORDER BY [EventType], [District]
		`;
		
		const result = await pool.request().query(query);
		
		return NextResponse.json({
			success: true,
			graphData: result.recordset
		});
		
	} catch (error) {
		console.error("Error fetching training graphs data:", error);
		return NextResponse.json({
			success: false,
			message: "Failed to fetch training graphs data",
			error: error instanceof Error ? error.message : "Unknown error"
		}, { status: 500 });
	}
}

