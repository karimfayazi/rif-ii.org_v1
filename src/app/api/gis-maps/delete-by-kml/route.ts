import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserIdFromRequest, checkDeleteAccess } from "@/lib/auth";
import AdmZip from "adm-zip";

export async function POST(request: NextRequest) {
	try {
		// Check delete access
		const userId = getUserIdFromRequest({ headers: request.headers });
		const accessCheck = await checkDeleteAccess(userId);
		
		if (!accessCheck.hasAccess) {
			return NextResponse.json(
				{
					success: false,
					message: accessCheck.message || "Access denied. Delete permission required."
				},
				{ status: 403 }
			);
		}

		const formData = await request.formData();
		const kmlFile = formData.get('kmlFile') as File;

		if (!kmlFile) {
			return NextResponse.json(
				{ success: false, message: "KML file is required" },
				{ status: 400 }
			);
		}

		// Validate file type
		const fileName = kmlFile.name.toLowerCase();
		const isKML = fileName.endsWith('.kml');
		const isKMZ = fileName.endsWith('.kmz');
		
		if (!isKML && !isKMZ) {
			return NextResponse.json(
				{ success: false, message: "File must be a KML or KMZ file (.kml or .kmz extension)" },
				{ status: 400 }
			);
		}

		// Read and parse KML/KMZ file
		let kmlContent: string;
		
		if (isKMZ) {
			// Extract KML from KMZ (KMZ is a ZIP archive containing a KML file)
			const arrayBuffer = await kmlFile.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const zip = new AdmZip(buffer);
			const zipEntries = zip.getEntries();
			
			// Find the KML file in the ZIP
			const kmlEntry = zipEntries.find(entry => 
				entry.entryName.toLowerCase().endsWith('.kml')
			);
			
			if (!kmlEntry) {
				return NextResponse.json(
					{ success: false, message: "No KML file found inside the KMZ archive" },
					{ status: 400 }
				);
			}
			
			kmlContent = kmlEntry.getData().toString('utf8');
		} else {
			// Direct KML file
			kmlContent = await kmlFile.text();
		}
		
		// Parse KML to extract area names
		const areaNames = extractAreaNamesFromKML(kmlContent);
		
		if (areaNames.length === 0) {
			return NextResponse.json(
				{ 
					success: false, 
					message: `No area names found in ${isKMZ ? 'KMZ' : 'KML'} file. Please ensure the ${isKMZ ? 'KMZ' : 'KML'} file contains placemarks with names.` 
				},
				{ status: 400 }
			);
		}

		// Get database connection
		const pool = await getDb();

		// Find matching GIS maps by AreaName
		const placeholders = areaNames.map((_, i) => `@areaName${i}`).join(', ');
		const query = `
			SELECT MapID, AreaName, MapType, FileName
			FROM [_rifiiorg_db].[dbo].[TABLE_GIS_MAPS]
			WHERE AreaName IN (${placeholders})
		`;

		const dbRequest = pool.request();
		areaNames.forEach((name, i) => {
			dbRequest.input(`areaName${i}`, name);
		});

		const result = await dbRequest.query(query);
		const matchingMaps = result.recordset;

		if (matchingMaps.length === 0) {
			return NextResponse.json({
				success: true,
				message: "No matching GIS maps found to delete",
				deletedCount: 0,
				fileType: isKMZ ? 'KMZ' : 'KML',
				areaNamesFromKML: areaNames,
				matchingMaps: []
			});
		}

		// Delete matching maps
		const mapIds = matchingMaps.map((map: any) => map.MapID);
		const deletePlaceholders = mapIds.map((_, i) => `@mapId${i}`).join(', ');
		const deleteQuery = `
			DELETE FROM [_rifiiorg_db].[dbo].[TABLE_GIS_MAPS]
			WHERE MapID IN (${deletePlaceholders})
		`;

		const deleteRequest = pool.request();
		mapIds.forEach((id: number, i: number) => {
			deleteRequest.input(`mapId${i}`, id);
		});

		const deleteResult = await deleteRequest.query(deleteQuery);
		const deletedCount = deleteResult.rowsAffected[0];

		return NextResponse.json({
			success: true,
			message: `Successfully deleted ${deletedCount} GIS map(s)`,
			deletedCount,
			fileType: isKMZ ? 'KMZ' : 'KML',
			areaNamesFromKML: areaNames,
			matchingMaps: matchingMaps.map((map: any) => ({
				MapID: map.MapID,
				AreaName: map.AreaName,
				MapType: map.MapType,
				FileName: map.FileName
			}))
		});

	} catch (error) {
		console.error("Error deleting GIS maps by KML:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to delete GIS maps",
				error: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

/**
 * Extract area names from KML content
 * KML files typically have placemarks with <name> tags
 */
function extractAreaNamesFromKML(kmlContent: string): string[] {
	const areaNames = new Set<string>();

	try {
		// Remove XML namespace declarations for easier parsing
		let cleanKml = kmlContent.replace(/xmlns[^=]*="[^"]*"/g, '');
		
		// Extract names from <name> tags (case-insensitive)
		const nameRegex = /<name[^>]*>([^<]+)<\/name>/gi;
		let match;
		
		while ((match = nameRegex.exec(cleanKml)) !== null) {
			const name = match[1].trim();
			if (name && name.length > 0) {
				areaNames.add(name);
			}
		}

		// Also try to extract from ExtendedData/SimpleData if present
		const simpleDataRegex = /<SimpleData[^>]*name="([^"]+)"[^>]*>([^<]+)<\/SimpleData>/gi;
		while ((match = simpleDataRegex.exec(cleanKml)) !== null) {
			const value = match[2].trim();
			if (value && value.length > 0) {
				areaNames.add(value);
			}
		}

		// Extract from description if it contains area names
		const descriptionRegex = /<description[^>]*>([^<]+)<\/description>/gi;
		while ((match = descriptionRegex.exec(cleanKml)) !== null) {
			const desc = match[1].trim();
			// If description looks like an area name (short, no HTML), add it
			if (desc && desc.length < 100 && !desc.includes('<')) {
				areaNames.add(desc);
			}
		}

	} catch (error) {
		console.error("Error parsing KML:", error);
	}

	return Array.from(areaNames);
}

