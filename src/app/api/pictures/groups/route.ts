import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const pool = await getDb();
		const query = `
			SELECT 
				[GroupName],
				COUNT(*) AS [PictureCount],
				(
					SELECT TOP 1 [FilePath]
					FROM [_rifiiorg_db].[dbo].[tblPictures] P2
					WHERE P2.[GroupName] = P.[GroupName]
						AND (P2.[IsActive] = 1 OR P2.[IsActive] IS NULL)
						AND P2.[FilePath] IS NOT NULL
						AND P2.[FilePath] != ''
					ORDER BY P2.[UploadDate] DESC
				) AS [ThumbnailImage]
			FROM [_rifiiorg_db].[dbo].[tblPictures] P
			WHERE ([IsActive] = 1 OR [IsActive] IS NULL)
				AND [GroupName] IS NOT NULL
				AND [GroupName] != ''
			GROUP BY [GroupName]
			ORDER BY [GroupName]
		`;

		const result = await pool.request().query(query);
		const groups = result.recordset || [];
		
		return NextResponse.json({
			success: true,
			groups: groups
		});
	} catch (error) {
		console.error("Error fetching picture groups:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to fetch picture groups",
				error: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

