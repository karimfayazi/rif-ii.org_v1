import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getUserIdFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const kmlFile = formData.get('kmlFile') as File;
		const name = formData.get('name') as string;
		const description = formData.get('description') as string || '';
		
		if (!kmlFile) {
			return NextResponse.json({
				success: false,
				message: "No KML file provided"
			}, { status: 400 });
		}
		
		if (!name) {
			return NextResponse.json({
				success: false,
				message: "Name is required"
			}, { status: 400 });
		}
		
		// Validate file type
		if (!kmlFile.name.toLowerCase().endsWith('.kml')) {
			return NextResponse.json({
				success: false,
				message: "File must be a KML file (.kml extension)"
			}, { status: 400 });
		}
		
		// Validate file size (50MB limit for KML files)
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (kmlFile.size > maxSize) {
			return NextResponse.json({
				success: false,
				message: "File size must be less than 50MB"
			}, { status: 400 });
		}
		
		// Get user ID
		const userId = getUserIdFromRequest(request);
		const uploadedBy = userId || 'System';
		
		// Determine upload directory
		const uploadDir = join(process.cwd(), 'public', 'uploads', 'kml');
		
		// Create directory if it doesn't exist
		if (!existsSync(uploadDir)) {
			await mkdir(uploadDir, { recursive: true });
		}
		
		// Generate unique filename
		const timestamp = Date.now();
		const fileExtension = kmlFile.name.split('.').pop();
		const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
		const filePath = join(uploadDir, fileName);
		const relativePath = `/uploads/kml/${fileName}`;
		
		// Save file to disk
		const bytes = await kmlFile.arrayBuffer();
		await writeFile(filePath, Buffer.from(bytes));
		
		// Insert into database
		const pool = await getDb();
		const insertQuery = `
			INSERT INTO [_rifiiorg_db].[dbo].[tblKMLFiles] 
			([Name], [Description], [FilePath], [UploadDate], [UploadedBy])
			VALUES (@name, @description, @filePath, @uploadDate, @uploadedBy)
		`;
		
		const request_obj = pool.request();
		request_obj.input('name', name);
		request_obj.input('description', description);
		request_obj.input('filePath', relativePath);
		request_obj.input('uploadDate', new Date().toISOString());
		request_obj.input('uploadedBy', uploadedBy);
		
		await request_obj.query(insertQuery);
		
		return NextResponse.json({
			success: true,
			message: "KML file uploaded successfully",
			file: {
				name: name,
				filePath: relativePath
			}
		});
	} catch (error) {
		console.error("Error uploading KML file:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to upload KML file",
				error: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

