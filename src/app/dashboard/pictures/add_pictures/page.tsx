"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	Plus,
	Edit,
	Trash2,
	Save,
	X,
	Search,
	RefreshCw,
	FileImage,
	Calendar,
	Folder,
	User,
	CheckCircle,
	AlertCircle,
	Loader2
} from "lucide-react";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import AccessDenied from "@/components/AccessDenied";
import Image from "next/image";

type Picture = {
	PictureID: number;
	GroupName: string | null;
	MainCategory: string | null;
	SubCategory: string | null;
	FileName: string | null;
	FilePath: string | null;
	FileSizeKB: number | null;
	UploadedBy: string | null;
	UploadDate: string | null;
	IsActive: boolean | null;
	EventDate: string | null;
};

export default function AddPicturesPage() {
	const router = useRouter();
	const { user, getUserId } = useAuth();
	const userId = user?.id || user?.username || getUserId() || "1";
	const { isAdmin, loading: accessLoading, accessLevel, error: accessError } = useAccess(userId);

	const [pictures, setPictures] = useState<Picture[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [showAddForm, setShowAddForm] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const [formData, setFormData] = useState<Omit<Picture, 'PictureID' | 'UploadDate'>>({
		GroupName: "",
		MainCategory: "",
		SubCategory: "",
		FileName: "",
		FilePath: "",
		FileSizeKB: null,
		UploadedBy: "",
		IsActive: true,
		EventDate: ""
	});

	// Debug: Log access status
	useEffect(() => {
		if (!accessLoading) {
			console.log('Add Pictures Page - Access Status:', { 
				userId, 
				isAdmin, 
				accessLevel, 
				accessLoading, 
				accessError,
				user 
			});
		}
	}, [isAdmin, accessLoading, accessLevel, accessError, userId, user]);

	useEffect(() => {
		if (!accessLoading && !isAdmin) {
			return;
		}
		if (isAdmin) {
			fetchPictures();
		}
	}, [isAdmin, accessLoading]);

	const fetchPictures = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/pictures/manage");
			const data = await response.json();

			if (data.success) {
				setPictures(data.pictures || []);
			} else {
				setError(data.message || "Failed to fetch pictures");
			}
		} catch (err) {
			setError("Error fetching pictures");
			console.error("Error fetching pictures:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: name === 'IsActive' ? value === 'true' || value === '1' : name === 'FileSizeKB' ? (value ? parseFloat(value) : null) : value
		}));
	};

	const handleEdit = (picture: Picture) => {
		setEditingId(picture.PictureID);
		setFormData({
			GroupName: picture.GroupName || "",
			MainCategory: picture.MainCategory || "",
			SubCategory: picture.SubCategory || "",
			FileName: picture.FileName || "",
			FilePath: picture.FilePath || "",
			FileSizeKB: picture.FileSizeKB,
			UploadedBy: picture.UploadedBy || "",
			IsActive: picture.IsActive !== null ? picture.IsActive : true,
			EventDate: picture.EventDate || ""
		});
		setShowAddForm(false);
		setError(null);
		setSuccess(null);
	};

	const handleCancel = () => {
		setEditingId(null);
		setShowAddForm(false);
		setFormData({
			GroupName: "",
			MainCategory: "",
			SubCategory: "",
			FileName: "",
			FilePath: "",
			FileSizeKB: null,
			UploadedBy: "",
			IsActive: true,
			EventDate: ""
		});
		setError(null);
		setSuccess(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		setSuccess(null);

		try {
			const url = editingId
				? "/api/pictures/manage"
				: "/api/pictures/manage";
			const method = editingId ? "PUT" : "POST";

			const body = editingId
				? { PictureID: editingId, ...formData }
				: formData;

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (data.success) {
				setSuccess(editingId ? "Picture updated successfully" : "Picture created successfully");
				handleCancel();
				fetchPictures();
			} else {
				setError(data.message || "Failed to save picture");
			}
		} catch (err) {
			setError("Error saving picture");
			console.error("Error saving picture:", err);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (pictureID: number) => {
		if (!confirm("Are you sure you want to delete this picture?")) {
			return;
		}

		try {
			const response = await fetch(`/api/pictures/manage?pictureID=${pictureID}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (data.success) {
				setSuccess("Picture deleted successfully");
				fetchPictures();
			} else {
				setError(data.message || "Failed to delete picture");
			}
		} catch (err) {
			setError("Error deleting picture");
			console.error("Error deleting picture:", err);
		}
	};

	const getImageUrl = (filePath: string | null) => {
		if (!filePath) return '';
		if (filePath.startsWith('https://') || filePath.startsWith('http://')) {
			return filePath;
		} else if (filePath.startsWith('~/')) {
			return `https://rif-ii.org/${filePath.replace('~/', '')}`;
		} else if (filePath.startsWith('uploads/')) {
			return `/${filePath}`;
		} else {
			return `https://rif-ii.org/${filePath}`;
		}
	};

	const filteredPictures = pictures.filter(picture =>
		(searchTerm === "" ||
			picture.FileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			picture.MainCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			picture.SubCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			picture.GroupName?.toLowerCase().includes(searchTerm.toLowerCase()))
	);

	if (accessLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b4d2b]"></div>
				<span className="ml-3 text-gray-600">Loading...</span>
			</div>
		);
	}

	if (!accessLoading && (!isAdmin || accessLevel !== 'Admin')) {
		return (
			<div className="space-y-6">
				<AccessDenied action="access this page" requiredLevel="Admin" />
				{/* Debug info - helps troubleshoot access issues */}
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
					<p className="text-sm text-yellow-800">
						<strong>Debug Info:</strong><br />
						User ID: {userId || 'Not found'}<br />
						Access Level: {accessLevel || 'None'}<br />
						Is Admin: {isAdmin ? 'Yes' : 'No'}<br />
						Access Loading: {accessLoading ? 'Yes' : 'No'}<br />
						Error: {accessError || 'None'}<br />
						User Object: {user ? JSON.stringify(user) : 'Not loaded'}
					</p>
					<p className="text-xs text-yellow-700 mt-2">
						To fix: Ensure your user has <code>access_level = 'Admin'</code> in the database.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2 h-screen flex flex-col overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between flex-shrink-0 pb-2">
				<div className="flex items-center space-x-2">
					<Link
						href="/dashboard/pictures"
						className="inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
					>
						<ArrowLeft className="h-3 w-3 mr-1" />
						Back
					</Link>
					<div>
						<h1 className="text-xl font-bold text-gray-900">Manage Pictures</h1>
						<p className="text-xs text-gray-600">Add, edit, and delete pictures</p>
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<button
						onClick={fetchPictures}
						className="inline-flex items-center px-2 py-1 text-xs text-[#0b4d2b] bg-[#0b4d2b]/10 rounded hover:bg-[#0b4d2b]/20 transition-colors"
					>
						<RefreshCw className="h-3 w-3 mr-1" />
						Refresh
					</button>
					{!showAddForm && !editingId && (
						<button
							onClick={() => {
								setShowAddForm(true);
								setEditingId(null);
								handleCancel();
							}}
							className="inline-flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
						>
							<Plus className="h-3 w-3 mr-1" />
							Add
						</button>
					)}
				</div>
			</div>

			{/* Success/Error Messages */}
			{success && (
				<div className="bg-green-50 border border-green-200 rounded p-2 flex items-center flex-shrink-0">
					<CheckCircle className="h-3 w-3 text-green-600 mr-2" />
					<p className="text-xs text-green-800">{success}</p>
				</div>
			)}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded p-2 flex items-center flex-shrink-0">
					<AlertCircle className="h-3 w-3 text-red-600 mr-2" />
					<p className="text-xs text-red-800">{error}</p>
				</div>
			)}

			{/* Add/Edit Form */}
			{(showAddForm || editingId) && (
				<div className="bg-white rounded border border-gray-200 shadow-sm p-2 flex-shrink-0 overflow-y-auto max-h-64">
					<div className="flex items-center justify-between mb-2">
						<h2 className="text-base font-semibold text-gray-900">
							{editingId ? "Edit Picture" : "Add New Picture"}
						</h2>
						<button
							onClick={handleCancel}
							className="text-gray-400 hover:text-gray-600"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-2">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
							<div>
								<label className="block text-xs font-medium text-gray-700 mb-0.5">
									Group Name
								</label>
								<input
									type="text"
									name="GroupName"
									value={formData.GroupName}
									onChange={handleInputChange}
									className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-700 mb-0.5">
									Main Category <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="MainCategory"
									value={formData.MainCategory}
									onChange={handleInputChange}
									required
									className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-700 mb-0.5">
									Sub Category <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="SubCategory"
									value={formData.SubCategory}
									onChange={handleInputChange}
									required
									className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-700 mb-0.5">
									File Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="FileName"
									value={formData.FileName}
									onChange={handleInputChange}
									required
									className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-700 mb-0.5">
									File Path <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="FilePath"
									value={formData.FilePath}
									onChange={handleInputChange}
									required
									placeholder="~/Uploads/Pictures/..."
									className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-700 mb-0.5">
									File Size (KB)
								</label>
								<input
									type="number"
									name="FileSizeKB"
									value={formData.FileSizeKB || ""}
									onChange={handleInputChange}
									className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-700 mb-0.5">
									Uploaded By
								</label>
								<input
									type="text"
									name="UploadedBy"
									value={formData.UploadedBy}
									onChange={handleInputChange}
									className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-700 mb-0.5">
									Event Date
								</label>
								<input
									type="date"
									name="EventDate"
									value={formData.EventDate}
									onChange={handleInputChange}
									className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none"
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-700 mb-0.5">
									Is Active
								</label>
								<select
									name="IsActive"
									value={formData.IsActive ? "1" : "0"}
									onChange={handleInputChange}
									className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none"
								>
									<option value="1">Active</option>
									<option value="0">Inactive</option>
								</select>
							</div>
						</div>

						<div className="flex items-center justify-end space-x-2 pt-2">
							<button
								type="button"
								onClick={handleCancel}
								className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={saving}
								className="px-2 py-1 text-xs bg-[#0b4d2b] text-white rounded hover:bg-[#0a3d24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
							>
								{saving ? (
									<>
										<Loader2 className="h-3 w-3 mr-1 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="h-3 w-3 mr-1" />
										{editingId ? "Update" : "Create"}
									</>
								)}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Search */}
			<div className="bg-white rounded border border-gray-200 shadow-sm p-1 flex-shrink-0">
				<div className="relative">
					<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
					<input
						type="text"
						placeholder="Search..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0b4d2b] focus:border-[#0b4d2b] outline-none"
					/>
				</div>
			</div>

			{/* Pictures Table */}
			{loading ? (
				<div className="flex items-center justify-center py-4 flex-1">
					<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0b4d2b]"></div>
					<span className="ml-2 text-xs text-gray-600">Loading...</span>
				</div>
			) : (
				<div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
					<div className="overflow-auto flex-1">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50 sticky top-0">
								<tr>
									<th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
										Preview
									</th>
									<th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
										File Name
									</th>
									<th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
										Category
									</th>
									<th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
										Group
									</th>
									<th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
										Path
									</th>
									<th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
										Size
									</th>
									<th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
										Status
									</th>
									<th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredPictures.length === 0 ? (
									<tr>
										<td colSpan={8} className="px-2 py-4 text-center text-xs text-gray-500">
											<FileImage className="mx-auto h-8 w-8 text-gray-400 mb-2" />
											<p>No pictures found</p>
										</td>
									</tr>
								) : (
									filteredPictures.map((picture) => (
										<tr key={picture.PictureID} className="hover:bg-gray-50">
											<td className="px-2 py-1 whitespace-nowrap">
												{picture.FilePath ? (
													<div className="relative w-10 h-10">
														<Image
															src={getImageUrl(picture.FilePath)}
															alt={picture.FileName || "Picture"}
															fill
															className="object-cover rounded"
															unoptimized
														/>
													</div>
												) : (
													<div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
														<FileImage className="h-5 w-5 text-gray-400" />
													</div>
												)}
											</td>
											<td className="px-2 py-1 whitespace-nowrap">
												<div className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
													{picture.FileName || "N/A"}
												</div>
											</td>
											<td className="px-2 py-1">
												<div className="text-xs text-gray-900 truncate max-w-[100px]">
													{picture.MainCategory || "N/A"}
												</div>
												<div className="text-xs text-gray-500 truncate max-w-[100px]">
													{picture.SubCategory || "N/A"}
												</div>
											</td>
											<td className="px-2 py-1 whitespace-nowrap">
												<div className="text-xs text-gray-900 truncate max-w-[100px]">
													{picture.GroupName || "N/A"}
												</div>
											</td>
											<td className="px-2 py-1">
												<div className="text-xs text-gray-900 max-w-[150px] truncate">
													{picture.FilePath || "N/A"}
												</div>
											</td>
											<td className="px-2 py-1 whitespace-nowrap">
												<div className="text-xs text-gray-900">
													{picture.FileSizeKB || "N/A"}
												</div>
											</td>
											<td className="px-2 py-1 whitespace-nowrap">
												<span
													className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
														picture.IsActive
															? "bg-green-100 text-green-800"
															: "bg-red-100 text-red-800"
													}`}
												>
													{picture.IsActive ? "Active" : "Inactive"}
												</span>
											</td>
											<td className="px-2 py-1 whitespace-nowrap text-xs font-medium">
												<div className="flex items-center space-x-1">
													<button
														onClick={() => handleEdit(picture)}
														className="text-blue-600 hover:text-blue-900"
														title="Edit"
													>
														<Edit className="h-3 w-3" />
													</button>
													<button
														onClick={() => handleDelete(picture.PictureID)}
														className="text-red-600 hover:text-red-900"
														title="Delete"
													>
														<Trash2 className="h-3 w-3" />
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Results Count */}
			{filteredPictures.length > 0 && (
				<div className="text-center text-xs text-gray-500 flex-shrink-0 pt-1">
					Showing {filteredPictures.length} of {pictures.length} picture(s)
					{searchTerm && ` matching "${searchTerm}"`}
				</div>
			)}
		</div>
	);
}

