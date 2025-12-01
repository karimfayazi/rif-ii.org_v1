import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		
		const fileType = formData.get('fileType') as string; // 'report', 'participantList', 'pictures'
		const trainingTitle = formData.get('trainingTitle') as string;
		let trainingSN = formData.get('trainingSN') as string;
		const file = formData.get('file') as File;
		const files = formData.getAll('files') as File[];

		// If SN is not provided, use timestamp as temporary identifier
		if (!trainingSN || trainingSN === '') {
			trainingSN = Date.now().toString();
		}

		if (!fileType) {
			return NextResponse.json({
				success: false,
				message: "File type is required"
			}, { status: 400 });
		}

		// Validate file types and sizes
		const maxSize = 10 * 1024 * 1024; // 10MB
		const allowedReportTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		];
		const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

		let uploadDir: string;
		let uploadedFiles: Array<{ originalName: string; fileName: string; filePath: string }> = [];

		if (fileType === 'report') {
			// Activity Completion Report - Training/{TrainingTitle}_{SN}/
			if (!file) {
				return NextResponse.json({
					success: false,
					message: "Report file is required"
				}, { status: 400 });
			}

			if (!allowedReportTypes.includes(file.type)) {
				return NextResponse.json({
					success: false,
					message: "Report must be PDF, DOC, or DOCX format"
				}, { status: 400 });
			}

			if (file.size > maxSize) {
				return NextResponse.json({
					success: false,
					message: "File size must be less than 10MB"
				}, { status: 400 });
			}

			// Create folder name: TrainingTitle_SN (sanitize for filesystem)
			const folderName = `${(trainingTitle || 'Training').replace(/[^a-zA-Z0-9]/g, '_')}_${trainingSN || Date.now()}`;
			uploadDir = join(process.cwd(), 'public', 'uploads', 'Training', folderName);

			if (!existsSync(uploadDir)) {
				await mkdir(uploadDir, { recursive: true });
			}

			const fileExtension = file.name.split('.').pop();
			const fileName = `ActivityCompletionReport.${fileExtension}`;
			const filePath = join(uploadDir, fileName);
			const relativePath = `uploads/Training/${folderName}/${fileName}`;

			const bytes = await file.arrayBuffer();
			await writeFile(filePath, Buffer.from(bytes));

			uploadedFiles.push({
				originalName: file.name,
				fileName: fileName,
				filePath: relativePath
			});

		} else if (fileType === 'participantList') {
			// Participant List - participantList/
			if (!file) {
				return NextResponse.json({
					success: false,
					message: "Participant list file is required"
				}, { status: 400 });
			}

			if (!allowedReportTypes.includes(file.type)) {
				return NextResponse.json({
					success: false,
					message: "Participant list must be PDF, DOC, or DOCX format"
				}, { status: 400 });
			}

			if (file.size > maxSize) {
				return NextResponse.json({
					success: false,
					message: "File size must be less than 10MB"
				}, { status: 400 });
			}

			uploadDir = join(process.cwd(), 'public', 'uploads', 'participantList');

			if (!existsSync(uploadDir)) {
				await mkdir(uploadDir, { recursive: true });
			}

			const fileExtension = file.name.split('.').pop();
			const fileName = `${trainingSN || Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
			const filePath = join(uploadDir, fileName);
			const relativePath = `uploads/participantList/${fileName}`;

			const bytes = await file.arrayBuffer();
			await writeFile(filePath, Buffer.from(bytes));

			uploadedFiles.push({
				originalName: file.name,
				fileName: fileName,
				filePath: relativePath
			});

		} else if (fileType === 'pictures') {
			// Pictures - Training/picture/{SN}_{TrainingTitle}_1.jpg, etc.
			if (!files || files.length === 0) {
				return NextResponse.json({
					success: false,
					message: "At least one picture is required"
				}, { status: 400 });
			}

			if (files.length < 5) {
				return NextResponse.json({
					success: false,
					message: "At least 5 pictures are required"
				}, { status: 400 });
			}

			// Validate all files
			for (const picFile of files) {
				if (!allowedImageTypes.includes(picFile.type)) {
					return NextResponse.json({
						success: false,
						message: `File ${picFile.name} is not a valid image (JPEG, PNG, GIF, or WEBP)`
					}, { status: 400 });
				}

				if (picFile.size > maxSize) {
					return NextResponse.json({
						success: false,
						message: `File ${picFile.name} is too large (max 10MB)`
					}, { status: 400 });
				}
			}

			const folderName = `${trainingSN || Date.now()}_${(trainingTitle || 'Training').replace(/[^a-zA-Z0-9]/g, '_')}`;
			uploadDir = join(process.cwd(), 'public', 'uploads', 'Training', 'picture', folderName);

			if (!existsSync(uploadDir)) {
				await mkdir(uploadDir, { recursive: true });
			}

			// Upload each picture
			for (let i = 0; i < files.length; i++) {
				const picFile = files[i];
				const fileExtension = picFile.name.split('.').pop();
				const fileName = `${folderName}_${i + 1}.${fileExtension}`;
				const filePath = join(uploadDir, fileName);
				const relativePath = `uploads/Training/picture/${folderName}/${fileName}`;

				const bytes = await picFile.arrayBuffer();
				await writeFile(filePath, Buffer.from(bytes));

				uploadedFiles.push({
					originalName: picFile.name,
					fileName: fileName,
					filePath: relativePath
				});
			}
		} else {
			return NextResponse.json({
				success: false,
				message: "Invalid file type"
			}, { status: 400 });
		}

		return NextResponse.json({
			success: true,
			message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
			uploadedFiles: uploadedFiles,
			filePath: uploadedFiles.length === 1 ? uploadedFiles[0].filePath : uploadedFiles.map(f => f.filePath).join(',')
		});

	} catch (error) {
		console.error("Error uploading training files:", error);
		return NextResponse.json({
			success: false,
			message: "Failed to upload files",
			error: error instanceof Error ? error.message : "Unknown error"
		}, { status: 500 });
	}
}

