"use client";

import { useState, useEffect } from "react";

type AccessLevel = 'Admin' | 'User' | null;

type AccessPermissions = {
	accessLevel: AccessLevel;
	isAdmin: boolean;
	canUpload: boolean;
	canManageCategories: boolean;
	canManageSubCategories: boolean;
	accessAdd: boolean;
	accessEdit: boolean;
	accessDelete: boolean;
	accessReports: boolean;
	userLoginLogs: boolean;
	trackingSection: boolean;
	trainingSection: boolean;
	loading: boolean;
	error: string | null;
};

export function useAccess(userId?: string | null) {
	const [permissions, setPermissions] = useState<AccessPermissions>({
		accessLevel: null,
		isAdmin: false,
		canUpload: false,
		canManageCategories: false,
		canManageSubCategories: false,
		accessAdd: false,
		accessEdit: false,
		accessDelete: false,
		accessReports: false,
		userLoginLogs: false,
		trackingSection: true,
		trainingSection: true,
		loading: true,
		error: null
	});

	useEffect(() => {
		if (!userId) {
			setPermissions(prev => ({
				...prev,
				loading: false,
				error: "No user ID provided"
			}));
			return;
		}

		checkAccess(userId);
	}, [userId]);

	const checkAccess = async (userId: string) => {
		try {
			setPermissions(prev => ({ ...prev, loading: true, error: null }));
			
			const response = await fetch(`/api/auth/access?userId=${encodeURIComponent(userId)}`);
			const data = await response.json();
			
			if (data.success) {
				setPermissions({
					accessLevel: data.accessLevel,
					isAdmin: data.isAdmin,
					canUpload: data.canUpload,
					canManageCategories: data.canManageCategories,
					canManageSubCategories: data.canManageSubCategories,
					accessAdd: data.accessAdd === true || data.accessAdd === 1,
					accessEdit: data.accessEdit === true || data.accessEdit === 1,
					accessDelete: data.accessDelete === true || data.accessDelete === 1,
					accessReports: data.accessReports === true || data.accessReports === 1,
					userLoginLogs: data.userLoginLogs === true || data.userLoginLogs === 1,
					trackingSection: data.trackingSection !== false,
					trainingSection: data.trainingSection !== false,
					loading: false,
					error: null
				});
			} else {
				setPermissions({
					accessLevel: null,
					isAdmin: false,
					canUpload: false,
					canManageCategories: false,
					canManageSubCategories: false,
					accessAdd: false,
					accessEdit: false,
					accessDelete: false,
					accessReports: false,
					userLoginLogs: false,
					trackingSection: false,
					trainingSection: false,
					loading: false,
					error: data.message || "Failed to check access"
				});
			}
		} catch (error) {
			setPermissions({
				accessLevel: null,
				isAdmin: false,
				canUpload: false,
				canManageCategories: false,
				canManageSubCategories: false,
				accessAdd: false,
				accessEdit: false,
				accessDelete: false,
				accessReports: false,
				userLoginLogs: false,
				trackingSection: false,
				trainingSection: false,
				loading: false,
				error: "Error checking access permissions"
			});
			console.error("Error checking access:", error);
		}
	};

	const refreshAccess = () => {
		if (userId) {
			checkAccess(userId);
		}
	};

	return {
		...permissions,
		refreshAccess
	};
}
