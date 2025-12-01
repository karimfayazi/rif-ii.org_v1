'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Layers, Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// GIS Map Component for KML/Shapefile display
function KMLGISMapViewer() {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<any>(null);
	const layerRefsRef = useRef<any>({});
	const [mapLoaded, setMapLoaded] = useState(false);
	const [mapError, setMapError] = useState<string | null>(null);
	const [activeLayers, setActiveLayers] = useState({
		districts: true,
		bannu: false,
		dik: false,
		roads: false,
		waterways: false
	});

	useEffect(() => {
		if (!mapContainerRef.current) return;

		let linkElement: HTMLLinkElement | null = null;
		let scriptElement: HTMLScriptElement | null = null;
		let timeoutId: NodeJS.Timeout | null = null;
		let checkInterval: NodeJS.Timeout | null = null;
		let initDelay: NodeJS.Timeout | null = null;
		let isMounted = true;

		const initializeMap = () => {
			if (!isMounted || !mapContainerRef.current) return;

			if (mapInstanceRef.current) {
				return;
			}

			setTimeout(() => {
				if (!isMounted || !mapContainerRef.current) return;

				try {
					const L = (window as any).L;
					if (!L) {
						if (isMounted) setMapError('Map library failed to load');
						return;
					}

					if (!mapContainerRef.current) {
						if (isMounted) setMapError('Map container not found');
						return;
					}

					const container = mapContainerRef.current;
					if (container.offsetWidth === 0 || container.offsetHeight === 0) {
						setTimeout(initializeMap, 200);
						return;
					}

					delete (L.Icon.Default.prototype as any)._getIconUrl;
					L.Icon.Default.mergeOptions({
						iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
						iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
						shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
					});

					// Initialize map centered on KPK region
					const map = L.map(container, {
						center: [34.0, 71.5], // Centered on KPK
						zoom: 8,
						zoomControl: true,
						attributionControl: true
					});

					mapInstanceRef.current = map;

					// Add OpenStreetMap tiles
					L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
						attribution: '© OpenStreetMap contributors',
						maxZoom: 19
					}).addTo(map);

					// Layer control
					const layerControl = L.control.layers().addTo(map);
					layerRefsRef.current.layerControl = layerControl;

					// Load KP Districts layer
					const loadKPDistrictsLayer = async () => {
						try {
							const response = await fetch('/maps/Shapefiles/KP_Districts.geojson');
							if (!response.ok) {
								console.warn('KP Districts GeoJSON file not found');
								return;
							}

							const geoJsonData = await response.json();

							const districtsLayer = L.geoJSON(geoJsonData, {
								style: {
									color: '#1e40af', // Blue border
									weight: 2,
									opacity: 0.8,
									fillColor: '#3b82f6',
									fillOpacity: 0.2
								},
								onEachFeature: (feature: any, layer: any) => {
									if (feature.properties) {
										const props = feature.properties;
										let popupContent = `
											<div style="font-weight: bold; margin-bottom: 8px; color: #1e40af;">
												${props.ADM2_EN || props.ADM2_PCODE || 'District'}
											</div>
											<div style="font-size: 12px; line-height: 1.4;">
												${props.ADM2_EN ? `<div><strong>Name:</strong> ${props.ADM2_EN}</div>` : ''}
												${props.ADM2_PCODE ? `<div><strong>Code:</strong> ${props.ADM2_PCODE}</div>` : ''}
												${props.ADM1_EN ? `<div><strong>Province:</strong> ${props.ADM1_EN}</div>` : ''}
											</div>
										`;
										layer.bindPopup(popupContent);

										// Add tooltip
										if (props.ADM2_EN) {
											layer.bindTooltip(props.ADM2_EN, {
												permanent: false,
												direction: 'center',
												className: 'district-tooltip'
											});
										}
									}
								}
							});

							if (activeLayers.districts) {
								districtsLayer.addTo(map);
							}

							layerControl.addOverlay(districtsLayer, 'KP Districts');
							layerRefsRef.current.districts = districtsLayer;

							// Fit map to districts bounds
							if (districtsLayer.getBounds().isValid()) {
								map.fitBounds(districtsLayer.getBounds(), { padding: [20, 20] });
							}

						} catch (error) {
							console.warn('Error loading KP Districts:', error);
							if (isMounted && !mapError) {
								setMapError('Failed to load districts data: ' + (error instanceof Error ? error.message : 'Unknown error'));
							}
						}
					};

					// Load Bannu District layer
					const loadBannuLayer = async () => {
						try {
							const response = await fetch('/maps/Shapefiles/Bannu_District_elect_comm.geojson');
							if (!response.ok) {
								console.warn('Bannu District GeoJSON file not found, skipping Bannu layer');
								return;
							}

							const geoJsonData = await response.json();

							const bannuLayer = L.geoJSON(geoJsonData, {
								style: {
									color: '#dc2626', // Red border
									weight: 3,
									opacity: 0.9,
									fillColor: '#ef4444',
									fillOpacity: 0.3
								},
								onEachFeature: (feature: any, layer: any) => {
									if (feature.properties) {
										const props = feature.properties;
										let popupContent = `
											<div style="font-weight: bold; margin-bottom: 8px; color: #dc2626;">
												Bannu District
											</div>
											<div style="font-size: 12px; line-height: 1.4;">
												${Object.entries(props).map(([key, value]) =>
													`<div><strong>${key}:</strong> ${value}</div>`
												).join('')}
											</div>
										`;
										layer.bindPopup(popupContent);
									}
								}
							});

							if (activeLayers.bannu) {
								bannuLayer.addTo(map);
							}

							layerControl.addOverlay(bannuLayer, 'Bannu District');
							layerRefsRef.current.bannu = bannuLayer;

						} catch (error) {
							console.warn('Error loading Bannu District:', error);
						}
					};

					// Load DI Khan District layer
					const loadDIKhanLayer = async () => {
						try {
							const response = await fetch('/maps/Shapefiles/DIKhanDistrict.geojson');
							if (!response.ok) {
								console.warn('DI Khan District GeoJSON file not found, skipping DI Khan layer');
								return;
							}

							const geoJsonData = await response.json();

							const dikLayer = L.geoJSON(geoJsonData, {
								style: {
									color: '#16a34a', // Green border
									weight: 3,
									opacity: 0.9,
									fillColor: '#22c55e',
									fillOpacity: 0.3
								},
								onEachFeature: (feature: any, layer: any) => {
									if (feature.properties) {
										const props = feature.properties;
										let popupContent = `
											<div style="font-weight: bold; margin-bottom: 8px; color: #16a34a;">
												D.I. Khan District
											</div>
											<div style="font-size: 12px; line-height: 1.4;">
												${Object.entries(props).map(([key, value]) =>
													`<div><strong>${key}:</strong> ${value}</div>`
												).join('')}
											</div>
										`;
										layer.bindPopup(popupContent);
									}
								}
							});

							if (activeLayers.dik) {
								dikLayer.addTo(map);
							}

							layerControl.addOverlay(dikLayer, 'D.I. Khan District');
							layerRefsRef.current.dik = dikLayer;

						} catch (error) {
							console.warn('Error loading DI Khan District:', error);
						}
					};

					// Load Roads layer
					const loadRoadsLayer = async () => {
						try {
							const response = await fetch('/maps/Shapefiles/hotosm_pak_roads_lines_shp.geojson');
							if (!response.ok) {
								console.warn('Roads GeoJSON file not found, skipping roads layer');
								return;
							}

							const geoJsonData = await response.json();

							const roadsLayer = L.geoJSON(geoJsonData, {
								style: {
									color: '#6b7280', // Gray
									weight: 1,
									opacity: 0.6
								},
								onEachFeature: (feature: any, layer: any) => {
									if (feature.properties) {
										const props = feature.properties;
										let popupContent = `
											<div style="font-weight: bold; margin-bottom: 8px; color: #6b7280;">
												Road
											</div>
											<div style="font-size: 12px; line-height: 1.4;">
												${props.highway ? `<div><strong>Type:</strong> ${props.highway}</div>` : ''}
												${props.name ? `<div><strong>Name:</strong> ${props.name}</div>` : ''}
											</div>
										`;
										layer.bindPopup(popupContent);
									}
								}
							});

							if (activeLayers.roads) {
								roadsLayer.addTo(map);
							}

							layerControl.addOverlay(roadsLayer, 'Roads');
							layerRefsRef.current.roads = roadsLayer;

						} catch (error) {
							console.warn('Error loading roads layer:', error);
						}
					};

					// Load Waterways layer
					const loadWaterwaysLayer = async () => {
						try {
							const response = await fetch('/maps/Shapefiles/hotosm_pak_waterways_lines_shp.geojson');
							if (!response.ok) {
								console.warn('Waterways GeoJSON file not found, skipping waterways layer');
								return;
							}

							const geoJsonData = await response.json();

							const waterwaysLayer = L.geoJSON(geoJsonData, {
								style: {
									color: '#2563eb', // Blue
									weight: 2,
									opacity: 0.8
								},
								onEachFeature: (feature: any, layer: any) => {
									if (feature.properties) {
										const props = feature.properties;
										let popupContent = `
											<div style="font-weight: bold; margin-bottom: 8px; color: #2563eb;">
												Waterway
											</div>
											<div style="font-size: 12px; line-height: 1.4;">
												${props.waterway ? `<div><strong>Type:</strong> ${props.waterway}</div>` : ''}
												${props.name ? `<div><strong>Name:</strong> ${props.name}</div>` : ''}
											</div>
										`;
										layer.bindPopup(popupContent);
									}
								}
							});

							if (activeLayers.waterways) {
								waterwaysLayer.addTo(map);
							}

							layerControl.addOverlay(waterwaysLayer, 'Waterways');
							layerRefsRef.current.waterways = waterwaysLayer;

						} catch (error) {
							console.warn('Error loading waterways:', error);
						}
					};

					// Load all layers
					loadKPDistrictsLayer();
					loadBannuLayer();
					loadDIKhanLayer();
					loadRoadsLayer();
					loadWaterwaysLayer();

					map.whenReady(() => {
						if (!isMounted) return;
						setTimeout(() => {
							if (!isMounted) return;
							try {
								if (mapInstanceRef.current) {
									mapInstanceRef.current.invalidateSize();
								}
								if (isMounted) setMapLoaded(true);
							} catch (e) {
								console.error('Error:', e);
								if (isMounted) setMapLoaded(true);
							}
						}, 200);
					});
				} catch (error) {
					console.error('Error initializing map:', error);
					if (isMounted) {
						setMapError('Failed to initialize map: ' + (error instanceof Error ? error.message : 'Unknown error'));
					}
				}
			}, 300);
		};

		initDelay = setTimeout(() => {
			if ((window as any).L) {
				initializeMap();
				return;
			}

			const existingCSS = document.querySelector('link[href*="leaflet"]');
			if (!existingCSS) {
				linkElement = document.createElement('link');
				linkElement.rel = 'stylesheet';
				linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
				linkElement.crossOrigin = 'anonymous';
				document.head.appendChild(linkElement);
			}

			const existingScript = document.querySelector('script[src*="leaflet"]');
			if (existingScript) {
				checkInterval = setInterval(() => {
					if ((window as any).L) {
						if (checkInterval) clearInterval(checkInterval);
						initializeMap();
					}
				}, 100);

				timeoutId = setTimeout(() => {
					if (checkInterval) clearInterval(checkInterval);
					if (!(window as any).L && isMounted) {
						setMapError('Map library is taking too long to load');
					}
				}, 10000);
			} else {
				scriptElement = document.createElement('script');
				scriptElement.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
				scriptElement.crossOrigin = 'anonymous';
				scriptElement.async = true;
				scriptElement.onload = () => {
					if (isMounted) {
						setTimeout(initializeMap, 200);
					}
				};
				scriptElement.onerror = () => {
					if (isMounted) {
						setMapError('Failed to load map library. Please check your internet connection.');
					}
				};
				document.body.appendChild(scriptElement);
			}
		}, 100);

		return () => {
			isMounted = false;
			if (timeoutId) clearTimeout(timeoutId);
			if (checkInterval) clearInterval(checkInterval);
			if (initDelay) clearTimeout(initDelay);
			if (mapInstanceRef.current) {
				try {
					mapInstanceRef.current.remove();
				} catch (e) {
					console.error('Error removing map:', e);
				}
				mapInstanceRef.current = null;
			}
		};
	}, []);

	// Handle layer toggling
	useEffect(() => {
		if (!mapInstanceRef.current || !mapLoaded) return;

		const map = mapInstanceRef.current;
		const layerRefs = layerRefsRef.current;

		// Toggle districts layer
		if (layerRefs.districts) {
			if (activeLayers.districts && !map.hasLayer(layerRefs.districts)) {
				layerRefs.districts.addTo(map);
			} else if (!activeLayers.districts && map.hasLayer(layerRefs.districts)) {
				map.removeLayer(layerRefs.districts);
			}
		}

		// Toggle DIK layer
		if (layerRefs.dik) {
			if (activeLayers.dik && !map.hasLayer(layerRefs.dik)) {
				layerRefs.dik.addTo(map);
			} else if (!activeLayers.dik && map.hasLayer(layerRefs.dik)) {
				map.removeLayer(layerRefs.dik);
			}
		}

		// Toggle Bannu layer
		if (layerRefs.bannu) {
			if (activeLayers.bannu && !map.hasLayer(layerRefs.bannu)) {
				layerRefs.bannu.addTo(map);
			} else if (!activeLayers.bannu && map.hasLayer(layerRefs.bannu)) {
				map.removeLayer(layerRefs.bannu);
			}
		}

		// Toggle waterways layer
		if (layerRefs.waterways) {
			if (activeLayers.waterways && !map.hasLayer(layerRefs.waterways)) {
				layerRefs.waterways.addTo(map);
			} else if (!activeLayers.waterways && map.hasLayer(layerRefs.waterways)) {
				map.removeLayer(layerRefs.waterways);
			}
		}
	}, [activeLayers, mapLoaded]);

	const toggleLayer = (layerKey: keyof typeof activeLayers) => {
		setActiveLayers(prev => ({
			...prev,
			[layerKey]: !prev[layerKey]
		}));
	};

	return (
		<div className="relative w-full overflow-hidden rounded-lg border border-gray-200">
			<div className="flex flex-col lg:flex-row">
				{/* Map Container */}
				<div className="flex-1 relative">
					<div
						ref={mapContainerRef}
						className="w-full bg-gray-100"
						style={{
							height: '700px',
							minHeight: '700px',
							position: 'relative',
							zIndex: 1
						}}
					>
						{!mapLoaded && !mapError && (
							<div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20 pointer-events-none">
								<div className="text-center">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b4d2b] mx-auto mb-2"></div>
									<p className="text-sm text-gray-600">Loading GIS map...</p>
								</div>
							</div>
						)}
						{mapError && (
							<div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
								<div className="text-center p-4">
									<p className="text-sm text-red-600 mb-2">{mapError}</p>
									<button
										onClick={() => {
											setMapError(null);
											setMapLoaded(false);
											window.location.reload();
										}}
										className="px-4 py-2 bg-[#0b4d2b] text-white rounded-lg hover:bg-[#0a3d24] transition-colors text-sm"
									>
										Retry
									</button>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Legend / Map Selecting Options */}
				<div className="w-full lg:w-80 bg-white border-l border-gray-200 p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
						Map Selecting Options
					</h3>
					<div className="space-y-3">
						{/* KPK Districts */}
						<label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors group">
							<input
								type="checkbox"
								checked={activeLayers.districts}
								onChange={() => toggleLayer('districts')}
								className="w-5 h-5 text-[#0b4d2b] border-gray-300 rounded focus:ring-2 focus:ring-[#0b4d2b] focus:ring-offset-2 cursor-pointer"
							/>
							<div className="ml-3 flex items-center flex-1">
								<div className="w-6 h-6 rounded border-2 mr-3" style={{ backgroundColor: '#3b82f6', borderColor: '#1e40af', opacity: 0.3 }}></div>
								<span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">KPK Districts</span>
							</div>
						</label>

						{/* DIK District */}
						<label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors group">
							<input
								type="checkbox"
								checked={activeLayers.dik}
								onChange={() => toggleLayer('dik')}
								className="w-5 h-5 text-[#0b4d2b] border-gray-300 rounded focus:ring-2 focus:ring-[#0b4d2b] focus:ring-offset-2 cursor-pointer"
							/>
							<div className="ml-3 flex items-center flex-1">
								<div className="w-6 h-6 rounded border-2 mr-3" style={{ backgroundColor: '#22c55e', borderColor: '#16a34a', opacity: 0.3 }}></div>
								<span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">DIK District</span>
							</div>
						</label>

						{/* Bannu District */}
						<label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors group">
							<input
								type="checkbox"
								checked={activeLayers.bannu}
								onChange={() => toggleLayer('bannu')}
								className="w-5 h-5 text-[#0b4d2b] border-gray-300 rounded focus:ring-2 focus:ring-[#0b4d2b] focus:ring-offset-2 cursor-pointer"
							/>
							<div className="ml-3 flex items-center flex-1">
								<div className="w-6 h-6 rounded border-2 mr-3" style={{ backgroundColor: '#ef4444', borderColor: '#dc2626', opacity: 0.3 }}></div>
								<span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Bannu District</span>
							</div>
						</label>

						{/* Water Ways */}
						<label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors group">
							<input
								type="checkbox"
								checked={activeLayers.waterways}
								onChange={() => toggleLayer('waterways')}
								className="w-5 h-5 text-[#0b4d2b] border-gray-300 rounded focus:ring-2 focus:ring-[#0b4d2b] focus:ring-offset-2 cursor-pointer"
							/>
							<div className="ml-3 flex items-center flex-1">
								<div className="w-6 h-2 rounded mr-3" style={{ backgroundColor: '#2563eb' }}></div>
								<span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Water Ways</span>
							</div>
						</label>
					</div>

					{/* Info Section */}
					<div className="mt-6 pt-4 border-t border-gray-200">
						<div className="flex items-start text-xs text-gray-500">
							<Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
							<p>Toggle layers on/off to customize your map view. Click on map features to view detailed information.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function KMLGISMapsPage() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">KML GIS Maps</h1>
					<p className="text-gray-600 mt-2">Interactive GIS maps for Khyber Pakhtunkhwa Districts</p>
				</div>
				<div className="flex items-center space-x-2 px-4 py-2 bg-[#0b4d2b] text-white rounded-lg">
					<MapPin className="h-5 w-5" />
					<span className="text-sm font-medium">KP Districts</span>
				</div>
			</div>


			{/* Map Container */}
			<div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
				<div className="p-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-900">Interactive GIS Map</h2>
					<p className="text-sm text-gray-600 mt-1">Click on districts to view detailed information. Use layer controls to toggle different map elements.</p>
				</div>
				<div className="p-6">
					<KMLGISMapViewer />
				</div>
			</div>

			{/* Map Controls Info */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-start space-x-3">
					<Layers className="h-5 w-5 text-blue-600 mt-0.5" />
					<div>
						<h4 className="text-sm font-medium text-blue-900 mb-1">Map Controls</h4>
						<p className="text-sm text-blue-700">
							Use the layer control button (top-right corner of the map) to toggle different geographical layers.
							Click on any district or feature to view detailed information in a popup.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}