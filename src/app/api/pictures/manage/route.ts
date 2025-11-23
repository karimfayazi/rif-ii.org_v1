import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

// Helper function to check if user is Admin
async function checkAdminAccess(userId: string | null): Promise<{ isAdmin: boolean; message?: string }> {
	if (!userId) {
		return { isAdmin: false, message: "Unauthorized" };
	}

	try {
		const pool = await getDb();
		const accessQuery = `
			SELECT [access_level]
			FROM [_rifiiorg_db].[dbo].[tbl_user_access]
			WHERE [username] = @userId OR [email] = @userId
		`;
		
		const accessResult = await pool.request()
			.input('userId', userId)
			.query(accessQuery);
		
		if (accessResult.recordset.length === 0) {
			return { isAdmin: false, message: "User not found" };
		}

		const accessLevel = accessResult.recordset[0].access_level;
		// Check if access_level is exactly 'Admin' (case-sensitive)
		const isAdmin = accessLevel === 'Admin';
		
		if (!isAdmin) {
			return { 
				isAdmin: false, 
				message: "Insufficient Permissions. This action requires Admin level access. Please contact your administrator if you believe this is an error." 
			};
		}

		return { isAdmin: true };
	} catch (error) {
		console.error("Error checking admin access:", error);
		return { isAdmin: false, message: "Error checking access permissions" };
	}
}

// GET all pictures (for management page) - Admin only
export async function GET(request: NextRequest) {
	try {
		// Check Admin access
		const userId = getUserIdFromRequest(request);
		const accessCheck = await checkAdminAccess(userId);
		
		if (!accessCheck.isAdmin) {
			return NextResponse.json(
				{
					success: false,
					message: accessCheck.message || "Access denied. Admin privileges required."
				},
				{ status: 403 }
			);
		}

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '50');
		const offset = (page - 1) * limit;

		const pool = await getDb();
		
		// Get total count
		const countQuery = `SELECT COUNT(*) as total FROM [_rifiiorg_db].[dbo].[tblPictures]`;
		const countResult = await pool.request().query(countQuery);
		const total = countResult.recordset[0].total;

		// Get pictures with pagination
		const query = `
			SELECT 
				[PictureID],
				[GroupName],
				[MainCategory],
				[SubCategory],
				[FileName],
				[FilePath],
				[FileSizeKB],
				[UploadedBy],
				CONVERT(VARCHAR(19), [UploadDate], 120) AS [UploadDate],
				[IsActive],
				CONVERT(VARCHAR(10), [EventDate], 105) AS [EventDate]
			FROM [_rifiiorg_db].[dbo].[tblPictures]
			ORDER BY [UploadDate] DESC
			OFFSET @offset ROWS
			FETCH NEXT @limit ROWS ONLY
		`;

		const request_obj = pool.request();
		request_obj.input('offset', offset);
		request_obj.input('limit', limit);

		const result = await request_obj.query(query);
		const pictures = result.recordset || [];

		return NextResponse.json({
			success: true,
			pictures: pictures,
			total: total,
			page: page,
			limit: limit
		});
	} catch (error) {
		console.error("Error fetching pictures:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to fetch pictures",
				error: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

// POST - Create new picture
export async function POST(request: NextRequest) {
	try {
		// Check Admin access
		const userId = getUserIdFromRequest(request);
		const accessCheck = await checkAdminAccess(userId);
		
		if (!accessCheck.isAdmin) {
			return NextResponse.json(
				{
					success: false,
					message: accessCheck.message || "Access denied. Admin privileges required."
				},
				{ status: 403 }
			);
		}

		const body = await request.json();
		const {
			GroupName,
			MainCategory,
			SubCategory,
			FileName,
			FilePath,
			FileSizeKB,
			UploadedBy,
			IsActive,
			EventDate
		} = body;

		// Validate required fields
		if (!MainCategory || !SubCategory || !FileName || !FilePath) {
			return NextResponse.json(
				{
					success: false,
					message: "MainCategory, SubCategory, FileName, and FilePath are required"
				},
				{ status: 400 }
			);
		}

		const pool = await getDb();
		const query = `
			INSERT INTO [_rifiiorg_db].[dbo].[tblPictures]
			([GroupName], [MainCategory], [SubCategory], [FileName], [FilePath], [FileSizeKB], [UploadedBy], [UploadDate], [IsActive], [EventDate])
			VALUES (@groupName, @mainCategory, @subCategory, @fileName, @filePath, @fileSizeKB, @uploadedBy, @uploadDate, @isActive, @eventDate)
		`;

		const request_obj = pool.request();
		request_obj.input('groupName', GroupName || null);
		request_obj.input('mainCategory', MainCategory);
		request_obj.input('subCategory', SubCategory);
		request_obj.input('fileName', FileName);
		request_obj.input('filePath', FilePath);
		request_obj.input('fileSizeKB', FileSizeKB || null);
		request_obj.input('uploadedBy', UploadedBy || null);
		request_obj.input('uploadDate', new Date().toISOString());
		request_obj.input('isActive', IsActive !== undefined ? IsActive : 1);
		request_obj.input('eventDate', EventDate || null);

		await request_obj.query(query);

		return NextResponse.json({
			success: true,
			message: "Picture created successfully"
		});
	} catch (error) {
		console.error("Error creating picture:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to create picture",
				error: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

// PUT - Update picture
export async function PUT(request: NextRequest) {
	try {
		// Check Admin access
		const userId = getUserIdFromRequest(request);
		const accessCheck = await checkAdminAccess(userId);
		
		if (!accessCheck.isAdmin) {
			return NextResponse.json(
				{
					success: false,
					message: accessCheck.message || "Access denied. Admin privileges required."
				},
				{ status: 403 }
			);
		}

		const body = await request.json();
		const {
			PictureID,
			GroupName,
			MainCategory,
			SubCategory,
			FileName,
			FilePath,
			FileSizeKB,
			UploadedBy,
			IsActive,
			EventDate
		} = body;

		if (!PictureID) {
			return NextResponse.json(
				{
					success: false,
					message: "PictureID is required"
				},
				{ status: 400 }
			);
		}

		const pool = await getDb();
		const query = `
			UPDATE [_rifiiorg_db].[dbo].[tblPictures]
			SET 
				[GroupName] = @groupName,
				[MainCategory] = @mainCategory,
				[SubCategory] = @subCategory,
				[FileName] = @fileName,
				[FilePath] = @filePath,
				[FileSizeKB] = @fileSizeKB,
				[UploadedBy] = @uploadedBy,
				[IsActive] = @isActive,
				[EventDate] = @eventDate
			WHERE [PictureID] = @pictureID
		`;

		const request_obj = pool.request();
		request_obj.input('pictureID', PictureID);
		request_obj.input('groupName', GroupName || null);
		request_obj.input('mainCategory', MainCategory || null);
		request_obj.input('subCategory', SubCategory || null);
		request_obj.input('fileName', FileName || null);
		request_obj.input('filePath', FilePath || null);
		request_obj.input('fileSizeKB', FileSizeKB || null);
		request_obj.input('uploadedBy', UploadedBy || null);
		request_obj.input('isActive', IsActive !== undefined ? IsActive : 1);
		request_obj.input('eventDate', EventDate || null);

		const result = await request_obj.query(query);

		if (result.rowsAffected[0] === 0) {
			return NextResponse.json(
				{
					success: false,
					message: "Picture not found"
				},
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Picture updated successfully"
		});
	} catch (error) {
		console.error("Error updating picture:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to update picture",
				error: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

// DELETE - Delete picture
export async function DELETE(request: NextRequest) {
	try {
		// Check Admin access
		const userId = getUserIdFromRequest(request);
		const accessCheck = await checkAdminAccess(userId);
		
		if (!accessCheck.isAdmin) {
			return NextResponse.json(
				{
					success: false,
					message: accessCheck.message || "Access denied. Admin privileges required."
				},
				{ status: 403 }
			);
		}

		const { searchParams } = new URL(request.url);
		const pictureID = searchParams.get('pictureID');

		if (!pictureID) {
			return NextResponse.json(
				{
					success: false,
					message: "PictureID is required"
				},
				{ status: 400 }
			);
		}

		const pool = await getDb();
		const query = `
			DELETE FROM [_rifiiorg_db].[dbo].[tblPictures]
			WHERE [PictureID] = @pictureID
		`;

		const request_obj = pool.request();
		request_obj.input('pictureID', parseInt(pictureID));

		const result = await request_obj.query(query);

		if (result.rowsAffected[0] === 0) {
			return NextResponse.json(
				{
					success: false,
					message: "Picture not found"
				},
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Picture deleted successfully"
		});
	} catch (error) {
		console.error("Error deleting picture:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to delete picture",
				error: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

