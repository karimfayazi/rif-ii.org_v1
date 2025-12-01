import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		
		if (!id) {
			return NextResponse.json({
				success: false,
				message: "KML file ID is required"
			}, { status: 400 });
		}
		
		const pool = await getDb();
		
		// First, get the file path
		const selectQuery = `
			SELECT [FilePath]
			FROM [_rifiiorg_db].[dbo].[tblKMLFiles]
			WHERE [ID] = @id
		`;
		
		const selectResult = await pool.request()
			.input('id', id)
			.query(selectQuery);
		
		if (selectResult.recordset.length === 0) {
			return NextResponse.json({
				success: false,
				message: "KML file not found"
			}, { status: 404 });
		}
		
		const filePath = selectResult.recordset[0].FilePath;
		
		// Delete from database
		const deleteQuery = `
			DELETE FROM [_rifiiorg_db].[dbo].[tblKMLFiles]
			WHERE [ID] = @id
		`;
		
		await pool.request()
			.input('id', id)
			.query(deleteQuery);
		
		// Try to delete the physical file
		try {
			// Handle both relative and absolute paths
			let physicalPath: string;
			if (filePath.startsWith('/')) {
				// Relative path from public folder
				physicalPath = join(process.cwd(), 'public', filePath);
			} else {
				// Absolute path or relative path
				physicalPath = join(process.cwd(), 'public', filePath);
			}
			
			if (existsSync(physicalPath)) {
				await unlink(physicalPath);
			}
		} catch (fileError) {
			// Log but don't fail if file deletion fails
			console.warn("Failed to delete physical file:", fileError);
		}
		
		return NextResponse.json({
			success: true,
			message: "KML file deleted successfully"
		});
	} catch (error) {
		console.error("Error deleting KML file:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to delete KML file",
				error: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

