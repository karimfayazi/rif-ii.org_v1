import Image from "next/image";

export default function Home() {
	return (
		<div className="h-screen bg-white flex flex-col overflow-hidden">
			{/* Top Banner */}
			<section
				className="bg-[#0b4d2b] text-white flex flex-col items-center justify-center text-center px-4"
				style={{ height: "27vh" }}
			>
				<h1 className="text-3xl md:text-4xl font-bold leading-tight">
					Regional Infrastructure Fund – II in Khyber Pakhtunkhwa for
				</h1>
				<p className="text-xl md:text-2xl font-semibold mt-4">
					&ldquo;RESILIENT RESOURCE MANAGEMENT IN CITIES (RRMIC)&rdquo;
				</p>
			</section>

			{/* Main Content */}
			<section className="flex-1 flex flex-col items-center justify-between px-6 py-2 bg-white">
				<div className="text-center mb-0">
					<p className="text-lg font-medium text-gray-700">
						Welcome to RIF-II Management Information System
					</p>
				</div>

				<div className="flex flex-wrap gap-1 justify-center items-center">
					<a
						href="/login"
						className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-base text-white font-semibold hover:bg-green-700 transition-colors shadow-md"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
						</svg>
						Login
					</a>

					<a
						href="/RIF-II MIS-Concept Paper.docx"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-base text-white font-semibold hover:bg-blue-700 transition-colors shadow-md"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
						</svg>
						View Concept Paper
					</a>
				</div>

				<div className="w-full max-w-6xl">
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 items-center justify-center">
						<Image src="/logo/gov_kpk.png" alt="Government of KPK" width={100} height={65} className="mx-auto object-contain" />
						<Image src="/logo/german cooperation.jpg" alt="German Cooperation" width={100} height={65} className="mx-auto object-contain" />
						<Image src="/uppalogo.jpg" alt="UPPA" width={100} height={65} className="mx-auto object-contain" />
						<Image src="/uppu.png" alt="UPPU" width={100} height={65} className="mx-auto object-contain" />
						<Image src="/logo/bodra.png" alt="BORDA" width={100} height={65} className="mx-auto object-contain" />
						<Image src="/logo/Cynosure.png" alt="Cynosure" width={100} height={65} className="mx-auto object-contain" />
						<Image src="/logo/Dorsch_Impact.png" alt="Dorsch Impact" width={100} height={65} className="mx-auto object-contain" />
					</div>
				</div>
			</section>
		</div>
	);
}
