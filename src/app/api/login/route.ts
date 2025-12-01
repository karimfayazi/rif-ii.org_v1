import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();
		
		if (!email || !password) {
			return NextResponse.json({ success: false, message: "Missing credentials" }, { status: 400 });
		}

		const pool = await getDb();
		const result = await pool
			.request()
			.input("email", email)
			.query(
				"SELECT TOP(1) * FROM [_rifiiorg_db].[dbo].[tbl_user_access] WHERE [email] = @email"
			);
		
		const user = result.recordset?.[0];

		if (!user) {
			return NextResponse.json(
				{ success: false, message: "Invalid email or password" },
				{ status: 401 }
			);
		}

		if (String(user.password) !== String(password)) {
			return NextResponse.json(
				{ success: false, message: "Invalid email or password" },
				{ status: 401 }
			);
		}

		const response = NextResponse.json({ 
			success: true, 
			user: { 
				id: user.email, 
				name: user.full_name, 
				username: user.username,
				department: user.department,
				region: user.region,
				contact_no: user.contact_no,
				access_level: user.access_level,
				password: user.password,
				tracking_section: user.Tracking_Section ?? true,
				training_section: user.Training_Section ?? true
			},
			full_name: user.full_name
		});
		response.cookies.set({
			name: "auth",
			value: `authenticated:${user.email}`,
			httpOnly: false, // Allow JavaScript to read the cookie
			secure: process.env.NODE_ENV === "production", // Only secure in production
			path: "/",
			sameSite: "lax",
			maxAge: 60 * 60 * 8, // 8 hours
		});
		return response;
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json(
			{ 
				success: false, 
				message: "Login error: " + (error instanceof Error ? error.message : "Unknown error")
			},
			{ status: 500 }
		);
	}
}


