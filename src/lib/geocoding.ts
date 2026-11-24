// Geocoding and coordinate resolver for Swift Delivery Express shipment locations

export interface GeoLocation {
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export interface CurrentLocationTarget {
  trackingId: string;
  location: string;
  status: string;
  lat: number;
  lon: number;
  occurredAt: string | null;
  description: string | null;
  isCancelled: boolean;
}

const CITY_DATABASE: Record<string, [number, number]> = {
  // North America
  'new york': [40.7128, -74.006],
  'nyc': [40.7128, -74.006],
  'jfk': [40.6413, -73.7781],
  'los angeles': [34.0522, -118.2437],
  'lax': [33.9416, -118.4085],
  'chicago': [41.8781, -87.6298],
  'ord': [41.9742, -87.9073],
  'houston': [29.7604, -95.3698],
  'phoenix': [33.4484, -112.074],
  'philadelphia': [39.9526, -75.1652],
  'san antonio': [29.4241, -98.4936],
  'san diego': [32.7157, -117.1611],
  'dallas': [32.7767, -96.797],
  'dfw': [32.8998, -97.0403],
  'san jose': [37.3382, -121.8863],
  'austin': [30.2672, -97.7431],
  'san francisco': [37.7749, -122.4194],
  'sfo': [37.6213, -122.379],
  'seattle': [47.6062, -122.3321],
  'sea': [47.4502, -122.3088],
  'denver': [39.7392, -104.9903],
  'boston': [42.3601, -71.0589],
  'atlanta': [33.749, -84.388],
  'atl': [33.6407, -84.4277],
  'miami': [25.7617, -80.1918],
  'mia': [25.7959, -80.287],
  'memphis': [35.1495, -90.049],
  'louisville': [38.2527, -85.7585],
  'portland': [45.5152, -122.6784],
  'las vegas': [36.1699, -115.1398],
  'detroit': [42.3314, -83.0458],
  'minneapolis': [44.9778, -93.265],
  'toronto': [43.6532, -79.3832],
  'yyz': [43.6777, -79.6248],
  'montreal': [45.5017, -73.5673],
  'vancouver': [49.2827, -123.1207],
  'calgary': [51.0447, -114.0719],
  'ottawa': [45.4215, -75.6972],
  'mexico city': [19.4326, -99.1332],
  'guadalajara': [20.6597, -103.3496],
  'monterrey': [25.6866, -100.3161],

  // Europe
  'london': [51.5074, -0.1278],
  'lhr': [51.47, -0.4543],
  'birmingham': [52.4862, -1.8904],
  'manchester': [53.4808, -2.2426],
  'edinburgh': [55.9533, -3.1883],
  'dublin': [53.3498, -6.2603],
  'paris': [48.8566, 2.3522],
  'cdg': [49.0097, 2.5479],
  'lyon': [45.764, 4.8357],
  'marseille': [43.2965, 5.3698],
  'frankfurt': [50.1109, 8.6821],
  'fra': [50.0379, 8.5622],
  'berlin': [52.52, 13.405],
  'munich': [48.1351, 11.582],
  'hamburg': [53.5511, 9.9937],
  'cologne': [50.9375, 6.9603],
  'stuttgart': [48.7758, 9.1829],
  'amsterdam': [52.3676, 4.9041],
  'ams': [52.3105, 4.7683],
  'rotterdam': [51.9244, 4.4777],
  'brussels': [50.8503, 4.3517],
  'antwerp': [51.2194, 4.4025],
  'zurich': [47.3769, 8.5417],
  'geneva': [46.2044, 6.1432],
  'vienna': [48.2082, 16.3738],
  'madrid': [40.4168, -3.7038],
  'mad': [40.4839, -3.568],
  'barcelona': [41.3879, 2.1699],
  'valencia': [39.4699, -0.3763],
  'rome': [41.9028, 12.4964],
  'fco': [41.8003, 12.2389],
  'milan': [45.4642, 9.19],
  'mxp': [45.6301, 8.7255],
  'warsaw': [52.2297, 21.0122],
  'prague': [50.0755, 14.4378],
  'budapest': [47.4979, 19.0402],
  'stockholm': [59.3293, 18.0686],
  'copenhagen': [55.6761, 12.5683],
  'oslo': [59.9139, 10.7522],
  'helsinki': [60.1699, 24.9384],
  'athens': [37.9838, 23.7275],
  'lisbon': [38.7223, -9.1393],

  // Asia & Pacific
  'tokyo': [35.6762, 139.6503],
  'hnd': [35.5494, 139.7798],
  'nrt': [35.772, 140.3929],
  'osaka': [34.6937, 135.5023],
  'shanghai': [31.2304, 121.4737],
  'pvg': [31.1443, 121.8083],
  'beijing': [39.9042, 116.4074],
  'pek': [40.0799, 116.6031],
  'shenzhen': [22.5431, 114.0579],
  'guangzhou': [23.1291, 113.2644],
  'hong kong': [22.3193, 114.1694],
  'hkg': [22.308, 113.9185],
  'taipei': [25.033, 121.5654],
  'seoul': [37.5665, 126.978],
  'icn': [37.4602, 126.4407],
  'singapore': [1.3521, 103.8198],
  'sin': [1.3644, 103.9915],
  'bangkok': [13.7563, 100.5018],
  'bkk': [13.69, 100.7501],
  'kuala lumpur': [3.139, 101.6869],
  'cul': [2.7456, 101.7072],
  'jakarta': [6.2088, 106.8456],
  'manila': [14.5995, 120.9842],
  'hanoi': [21.0285, 105.8542],
  'ho chi minh': [10.8231, 106.6297],
  'mumbai': [19.076, 72.8777],
  'delhi': [28.6139, 77.209],
  'bangalore': [12.9716, 77.5946],
  'sydney': [ -33.8688, 151.2093],
  'syd': [-33.9399, 151.1753],
  'melbourne': [-37.8136, 144.9631],
  'brisbane': [-27.4698, 153.0251],
  'perth': [-31.9505, 115.8605],
  'auckland': [-36.8485, 174.7633],

  // Middle East & Africa
  'dubai': [25.2048, 55.2708],
  'dxb': [25.2532, 55.3657],
  'abu dhabi': [24.4539, 54.3773],
  'doha': [25.2854, 51.531],
  'riyadh': [24.7136, 46.6753],
  'jeddah': [21.5433, 39.1728],
  'kuwait': [29.3759, 47.9774],
  'cairo': [30.0444, 31.2357],
  'johannesburg': [-26.2041, 28.0473],
  'jnb': [-26.1367, 28.2411],
  'cape town': [-33.9249, 18.4241],
  'nairobi': [-1.2921, 36.8219],
  'lagos': [6.5244, 3.3792],
  'los': [6.5774, 3.3211],
  'casablanca': [33.5731, -7.5898],
  'accra': [5.6037, -0.187],
  'istanbul': [41.0082, 28.9784],
  'ist': [41.2753, 28.7519],

  // Latin America
  'sao paulo': [-23.5505, -46.6333],
  'gru': [-23.4356, -46.4731],
  'rio de janeiro': [-22.9068, -43.1729],
  'buenos aires': [-34.6037, -58.3816],
  'eze': [-34.8222, -58.5358],
  'santiago': [-33.4489, -70.6693],
  'bogota': [4.711, -74.0721],
  'lima': [-12.0464, -77.0428],
};

const COUNTRY_DATABASE: Record<string, [number, number]> = {
  'united states': [37.0902, -95.7129],
  'usa': [37.0902, -95.7129],
  'us': [37.0902, -95.7129],
  'united kingdom': [55.3781, -3.436],
  'uk': [55.3781, -3.436],
  'canada': [56.1304, -106.3468],
  'germany': [51.1657, 10.4515],
  'france': [46.2276, 2.2137],
  'italy': [41.8719, 12.5674],
  'spain': [40.4637, -3.7492],
  'netherlands': [52.1326, 5.2913],
  'belgium': [50.5039, 4.4699],
  'switzerland': [46.8182, 8.2275],
  'austria': [47.5162, 14.5501],
  'poland': [51.9194, 19.1451],
  'china': [35.8617, 104.1954],
  'japan': [36.2048, 138.2529],
  'south korea': [35.9078, 127.7669],
  'korea': [35.9078, 127.7669],
  'singapore': [1.3521, 103.8198],
  'australia': [-25.2744, 133.7751],
  'india': [20.5937, 78.9629],
  'united arab emirates': [23.4241, 53.8478],
  'uae': [23.4241, 53.8478],
  'dubai': [25.2048, 55.2708],
  'saudi arabia': [23.8859, 45.0792],
  'brazil': [-14.235, -51.9253],
  'mexico': [23.6345, -102.5528],
  'argentina': [-38.4161, -63.6167],
  'south africa': [-30.5595, 22.9375],
  'egypt': [26.8206, 30.8025],
  'nigeria': [9.082, 8.6753],
  'kenya': [-0.0236, 37.9062],
  'morocco': [31.7917, -7.0926],
  'turkey': [38.9637, 35.2433],
};

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Resolves any freeform location string (e.g. "Frankfurt Sorting Facility, Germany", "New York Hub, USA", "London")
 * to realistic [latitude, longitude] coordinates.
 */
export function resolveCoordinates(rawLocation: string, fallbackOffset = 0): [number, number] {
  if (!rawLocation || typeof rawLocation !== 'string') {
    return [40.7128 + fallbackOffset, -74.006 + fallbackOffset];
  }

  const cleaned = rawLocation.toLowerCase().trim();

  // 1. Direct city match
  for (const [city, coords] of Object.entries(CITY_DATABASE)) {
    if (cleaned === city || cleaned.includes(city)) {
      return [coords[0] + (fallbackOffset * 0.1), coords[1] + (fallbackOffset * 0.1)];
    }
  }

  // 2. Direct country match
  for (const [country, coords] of Object.entries(COUNTRY_DATABASE)) {
    if (cleaned === country || cleaned.includes(country)) {
      return [coords[0] + (fallbackOffset * 0.1), coords[1] + (fallbackOffset * 0.1)];
    }
  }

  // 3. Fallback: deterministic coordinates generated from hash, placed over global land corridors
  const h = hashString(cleaned);
  // Pick from 8 realistic global shipping hub corridors
  const corridors: [number, number][] = [
    [40.7128, -74.006],  // US East
    [34.0522, -118.24],  // US West
    [51.5074, -0.1278],  // Western Europe
    [50.1109, 8.6821],   // Central Europe
    [25.2048, 55.2708],  // Middle East
    [1.3521, 103.8198],  // SE Asia
    [35.6762, 139.65],   // East Asia
    [-33.8688, 151.2],   // Oceania
  ];
  const base = corridors[h % corridors.length] ?? [40.7128, -74.006];
  const jitterLat = ((h % 100) - 50) * 0.05 + fallbackOffset * 0.2;
  const jitterLon = (((h >> 4) % 100) - 50) * 0.05 + fallbackOffset * 0.2;

  return [base[0] + jitterLat, base[1] + jitterLon];
}

/**
 * Projects latitude and longitude onto an SVG canvas of given width and height using Equirectangular projection.
 */
export function projectCoordinates(
  lat: number,
  lon: number,
  width = 960,
  height = 480
): [number, number] {
  // Clamped latitude between -85 and 85 to prevent edge overflow
  const clampedLat = Math.max(-82, Math.min(82, lat));
  // Normalize lon to -180..180
  let normalizedLon = lon;
  while (normalizedLon < -180) normalizedLon += 360;
  while (normalizedLon > 180) normalizedLon -= 360;

  const x = ((normalizedLon + 180) / 360) * width;
  const y = ((90 - clampedLat) / 180) * height;

  return [x, y];
}

export function resolveCurrentLocationTarget(record: {
  tracking_id: string;
  origin: string;
  destination: string;
  status: string;
  latest_location: string | null;
  created_at: string;
  events: { status: string; location: string; description: string; occurred_at: string }[];
}): CurrentLocationTarget {
  const sortedEvents = [...record.events].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
  );
  const latestEvent = sortedEvents[sortedEvents.length - 1];
  const isCancelled = record.status === 'Cancelled';
  const isDelivered = record.status === 'Delivered';

  let location = record.origin;
  let occurredAt: string | null = record.created_at;
  let description: string | null = latestEvent?.description ?? null;

  if (isDelivered) {
    location = latestEvent?.location || record.destination;
    occurredAt = latestEvent?.occurred_at ?? record.created_at;
    description = latestEvent?.description ?? 'Delivered to recipient address';
  } else if (record.latest_location && record.latest_location.trim()) {
    location = record.latest_location.trim();
    occurredAt = latestEvent?.occurred_at ?? record.created_at;
  } else if (latestEvent?.location) {
    location = latestEvent.location;
    occurredAt = latestEvent.occurred_at;
  }

  const [lat, lon] = resolveCoordinates(location, 0);
  return {
    trackingId: record.tracking_id,
    location,
    status: record.status,
    lat,
    lon,
    occurredAt,
    description,
    isCancelled,
  };
}
