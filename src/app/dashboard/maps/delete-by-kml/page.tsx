"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileX, AlertCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DeleteGISMapsByKMLPage() {
	const router = useRouter();
	const { user, getUserId } = useAuth();
	const userId = user?.id || getUserId();
	const { accessDelete, loading: accessLoading } = useAccess(userId);

	const [kmlFile, setKmlFile] = useState<File | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [result, setResult] = useState<{
		success: boolean;
		message: string;
		deletedCount?: number;
		areaNamesFromKML?: string[];
		matchingMaps?: Array<{
			MapID: number;
			AreaName: string;
			MapType: string;
			FileName: string;
		}>;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const fileName = file.name.toLowerCase();
			if (!fileName.endsWith('.kml') && !fileName.endsWith('.kmz')) {
				setError("Please select a KML or KMZ file (.kml or .kmz extension)");
				setKmlFile(null);
				return;
			}
			setError(null);
			setKmlFile(file);
			setResult(null);
		}
	};

	const handleDelete = async () => {
		if (!kmlFile) {
			setError("Please select a KML file first");
			return;
		}

		if (!accessDelete) {
			setError("You don't have permission to delete GIS maps");
			return;
		}

		setIsDeleting(true);
		setError(null);
		setResult(null);

		try {
			const formData = new FormData();
			formData.append('kmlFile', kmlFile);

			const response = await fetch('/api/gis-maps/delete-by-kml', {
				method: 'POST',
				body: formData,
			});

			const data = await response.json();

			if (data.success) {
				setResult(data);
			} else {
				setError(data.message || "Failed to delete GIS maps");
			}
		} catch (err) {
			console.error("Error deleting GIS maps:", err);
			setError("An error occurred while deleting GIS maps");
		} finally {
			setIsDeleting(false);
		}
	};

	if (accessLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-[#0b4d2b]" />
			</div>
		);
	}

	if (!accessDelete) {
		return (
			<div className="space-y-6">
				<div className="bg-red-50 border border-red-200 rounded-lg p-6">
					<div className="flex items-start space-x-3">
						<AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
						<div>
							<h3 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h3>
							<p className="text-red-700">
								You don't have permission to delete GIS maps. This action requires delete access.
								Please contact your administrator if you believe this is an error.
							</p>
						</div>
					</div>
				</div>
				<Link
					href="/dashboard/maps/records"
					className="inline-flex items-center text-[#0b4d2b] hover:text-[#0a3d24] font-medium"
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to GIS Maps Records
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Delete GIS Maps by KML</h1>
					<p className="text-gray-600 mt-2">
						Upload a KML or KMZ file to automatically delete matching GIS maps from the database
					</p>
				</div>
				<Link
					href="/dashboard/maps/records"
					className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to Records
				</Link>
			</div>

			{/* Warning */}
			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<div className="flex items-start space-x-3">
					<AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
					<div>
						<h4 className="text-sm font-medium text-yellow-900 mb-1">Important Warning</h4>
						<p className="text-sm text-yellow-700">
							This action will permanently delete GIS maps from the database that match area names found in your KML/KMZ file.
							This action cannot be undone. Please ensure you have a backup before proceeding.
						</p>
					</div>
				</div>
			</div>

			{/* Upload Section */}
			<div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
				<div className="p-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-900">Upload KML/KMZ File</h2>
					<p className="text-sm text-gray-600 mt-1">
						Select a KML or KMZ file. The system will extract area names from placemarks and delete matching GIS maps.
					</p>
				</div>
				<div className="p-6">
					<div className="space-y-4">
						{/* File Input */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								KML File
							</label>
							<div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#0b4d2b] transition-colors">
								<div className="space-y-1 text-center">
									<Upload className="mx-auto h-12 w-12 text-gray-400" />
									<div className="flex text-sm text-gray-600">
										<label
											htmlFor="kml-file-upload"
											className="relative cursor-pointer bg-white rounded-md font-medium text-[#0b4d2b] hover:text-[#0a3d24] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#0b4d2b]"
										>
											<span>Upload a file</span>
											<input
												id="kml-file-upload"
												name="kml-file-upload"
												type="file"
												accept=".kml,.kmz"
												className="sr-only"
												onChange={handleFileChange}
											/>
										</label>
										<p className="pl-1">or drag and drop</p>
									</div>
									<p className="text-xs text-gray-500">KML or KMZ files</p>
									{kmlFile && (
										<p className="text-sm text-gray-900 mt-2">
											<FileX className="inline h-4 w-4 mr-2" />
											{kmlFile.name}
										</p>
									)}
								</div>
							</div>
						</div>

						{/* Error Message */}
						{error && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4">
								<div className="flex items-start space-x-3">
									<AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
									<p className="text-sm text-red-700">{error}</p>
								</div>
							</div>
						)}

						{/* Delete Button */}
						<button
							onClick={handleDelete}
							disabled={!kmlFile || isDeleting}
							className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
						>
							{isDeleting ? (
								<>
									<Loader2 className="h-5 w-5 mr-2 animate-spin" />
									Deleting...
								</>
							) : (
								<>
									<FileX className="h-5 w-5 mr-2" />
									Delete Matching GIS Maps
								</>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Results */}
			{result && (
				<div className={`bg-white rounded-xl border shadow-lg overflow-hidden ${
					result.success ? 'border-green-200' : 'border-red-200'
				}`}>
					<div className={`p-6 border-b ${
						result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
					}`}>
						<div className="flex items-start space-x-3">
							{result.success ? (
								<CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
							) : (
								<AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
							)}
							<div>
								<h3 className={`text-lg font-semibold ${
									result.success ? 'text-green-900' : 'text-red-900'
								}`}>
									{result.success ? 'Deletion Successful' : 'Deletion Failed'}
								</h3>
								<p className={`text-sm mt-1 ${
									result.success ? 'text-green-700' : 'text-red-700'
								}`}>
									{result.message}
								</p>
							</div>
						</div>
					</div>
					{result.success && (
						<div className="p-6 space-y-4">
							{/* Summary */}
							<div className="bg-gray-50 rounded-lg p-4">
								<h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
								<ul className="text-sm text-gray-700 space-y-1">
									<li>• File Type: <strong>{result.fileType || 'KML'}</strong></li>
									<li>• Deleted Maps: <strong>{result.deletedCount || 0}</strong></li>
									<li>• Area Names Found in {result.fileType || 'KML'}: <strong>{result.areaNamesFromKML?.length || 0}</strong></li>
									<li>• Matching Maps Found: <strong>{result.matchingMaps?.length || 0}</strong></li>
								</ul>
							</div>

							{/* Area Names from KML */}
							{result.areaNamesFromKML && result.areaNamesFromKML.length > 0 && (
								<div>
									<h4 className="text-sm font-medium text-gray-900 mb-2">
										Area Names Extracted from {result.fileType || 'KML'} ({result.areaNamesFromKML.length})
									</h4>
									<div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
										<div className="flex flex-wrap gap-2">
											{result.areaNamesFromKML.map((name, index) => (
												<span
													key={index}
													className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
												>
													{name}
												</span>
											))}
										</div>
									</div>
								</div>
							)}

							{/* Deleted Maps */}
							{result.matchingMaps && result.matchingMaps.length > 0 && (
								<div>
									<h4 className="text-sm font-medium text-gray-900 mb-2">
										Deleted Maps ({result.matchingMaps.length})
									</h4>
									<div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
										<div className="space-y-2">
											{result.matchingMaps.map((map) => (
												<div
													key={map.MapID}
													className="bg-white border border-gray-200 rounded p-3"
												>
													<div className="flex items-start justify-between">
														<div>
															<p className="font-medium text-gray-900">{map.AreaName}</p>
															<p className="text-sm text-gray-600">Type: {map.MapType}</p>
															<p className="text-xs text-gray-500">File: {map.FileName}</p>
														</div>
														<span className="text-xs text-gray-500">ID: {map.MapID}</span>
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

