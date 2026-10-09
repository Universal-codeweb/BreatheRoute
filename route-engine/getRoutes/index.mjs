
import {
    GeoRoutesClient,
    CalculateRoutesCommand
} from "@aws-sdk/client-geo-routes";

import {
    DynamoDBClient,
    ScanCommand
} from "@aws-sdk/client-dynamodb";

const region = process.env.AWS_REGION || "us-east-1";

const client = new GeoRoutesClient({ region });
const dynamoClient = new DynamoDBClient({ region });

const AQI_TABLE = "breatheroute-aqi";
const AQI_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_AQI = 70;
const DEFAULT_TRAFFIC = 30;
const MAX_MATCH_DISTANCE_METERS = 300;

const PROFILES = ["general", "asthma", "elderly", "child"];
const MODES = ["walking", "cycling"];

const PROFILE_SCORING_WEIGHTS = {
    general: { aqi: 0.60, traffic: 0.25, duration: 0.15 },
    asthma: { aqi: 0.80, traffic: 0.10, duration: 0.10 },
    elderly: { aqi: 0.70, traffic: 0.15, duration: 0.15 },
    child: { aqi: 0.75, traffic: 0.15, duration: 0.10 }
};

let aqiCache = {
    records: [],
    expiresAt: 0
};

function reply(statusCode, body) {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "content-type,authorization",
            "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS"
        },
        body: JSON.stringify(body)
    };
}

function parseInput(event) {
    let body = event?.body;

    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch {
            throw new Error("Request body must be valid JSON.");
        }
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new Error("Request body must be a JSON object.");
    }

    const { origin, destination, mode, profile } = body;

    function validLocation(location) {
        return (
            location &&
            Number.isFinite(location.lat) &&
            Number.isFinite(location.lng) &&
            location.lat >= -90 &&
            location.lat <= 90 &&
            location.lng >= -180 &&
            location.lng <= 180
        );
    }

    if (!validLocation(origin)) {
        throw new Error(
            "origin must contain valid numeric lat and lng values."
        );
    }

    if (!validLocation(destination)) {
        throw new Error(
            "destination must contain valid numeric lat and lng values."
        );
    }

    if (!MODES.includes(mode)) {
        throw new Error("mode must be walking or cycling.");
    }

    if (!PROFILES.includes(profile)) {
        throw new Error(
            "profile must be general, asthma, elderly, or child."
        );
    }

    return { origin, destination, mode, profile };
}

function haversineMeters(point1, point2) {
    const R = 6371000;
    const rad = Math.PI / 180;

    const lat1 = point1[1] * rad;
    const lat2 = point2[1] * rad;
    const dLat = (point2[1] - point1[1]) * rad;
    const dLng = (point2[0] - point1[0]) * rad;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(
        Math.sqrt(Math.max(0, Math.min(1, a)))
    );
}

function interpolatePoint(start, end, fraction) {
    return [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction
    ];
}

function samplePoints(coords, spacingMeters = 100) {
    if (!Array.isArray(coords) || coords.length === 0) {
        throw new Error("Cannot sample a route without coordinates.");
    }

    if (!Number.isFinite(spacingMeters) || spacingMeters <= 0) {
        throw new Error("Sampling spacing must be greater than zero.");
    }

    for (const point of coords) {
        if (
            !Array.isArray(point) ||
            point.length < 2 ||
            !Number.isFinite(point[0]) ||
            !Number.isFinite(point[1]) ||
            point[0] < -180 ||
            point[0] > 180 ||
            point[1] < -90 ||
            point[1] > 90
        ) {
            throw new Error("Route contains an invalid coordinate.");
        }
    }

    const sampled = [[coords[0][0], coords[0][1]]];
    let distanceSinceLastSample = 0;

    for (let i = 1; i < coords.length; i++) {
        const start = coords[i - 1];
        const end = coords[i];
        const segmentDistance = haversineMeters(start, end);

        if (segmentDistance === 0) continue;

        let distanceAlongSegment = 0;

        while (
            distanceSinceLastSample +
            (segmentDistance - distanceAlongSegment) >=
            spacingMeters
        ) {
            const distanceToNextSample =
                spacingMeters - distanceSinceLastSample;

            distanceAlongSegment += distanceToNextSample;

            sampled.push(
                interpolatePoint(
                    start,
                    end,
                    distanceAlongSegment / segmentDistance
                )
            );

            distanceSinceLastSample = 0;
        }

        distanceSinceLastSample +=
            segmentDistance - distanceAlongSegment;
    }

    const last = coords[coords.length - 1];
    const lastSample = sampled[sampled.length - 1];

    if (lastSample[0] !== last[0] || lastSample[1] !== last[1]) {
        sampled.push([last[0], last[1]]);
    }

    return sampled;
}

function cleanCoordinates(coords) {
    if (!Array.isArray(coords)) return [];

    const cleaned = [];

    for (const point of coords) {
        if (
            !Array.isArray(point) ||
            point.length < 2 ||
            !Number.isFinite(point[0]) ||
            !Number.isFinite(point[1])
        ) {
            continue;
        }

        const current = [point[0], point[1]];
        const previous = cleaned[cleaned.length - 1];

        if (
            !previous ||
            previous[0] !== current[0] ||
            previous[1] !== current[1]
        ) {
            cleaned.push(current);
        }
    }

    return cleaned;
}

function getRouteSummary(route) {
    const legs = route.Legs || [];

    let distanceMeters = 0;
    let durationSeconds = 0;

    for (const leg of legs) {
        const summary = leg.PedestrianLegDetails?.Summary?.Overview;
        const distance = summary?.Distance;
        const duration = summary?.Duration;

        if (
            !Number.isFinite(distance) ||
            !Number.isFinite(duration)
        ) {
            throw new Error(
                "Amazon Location returned a route without valid distance or duration."
            );
        }

        distanceMeters += distance;
        durationSeconds += duration;
    }

    if (legs.length === 0) {
        throw new Error("Amazon Location returned a route without legs.");
    }

    return {
        distanceKm: distanceMeters / 1000,
        durationMin: durationSeconds / 60
    };
}

function numericAttribute(value) {
    if (value && typeof value === "object" && "N" in value) {
        return Number(value.N);
    }

    return Number(value);
}

function normalizeRecord(item) {
    const lat = numericAttribute(item.lat);
    const lng = numericAttribute(item.lng);
    const aqi = numericAttribute(item.aqi);
    const traffic = numericAttribute(item.traffic);

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        !Number.isFinite(aqi) ||
        !Number.isFinite(traffic) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
    ) {
        return null;
    }

    return {
        cellId: item.cellId?.S ?? item.cellId ?? null,
        lat,
        lng,
        aqi,
        traffic
    };
}

async function getAqiRecords() {
    const now = Date.now();

    if (aqiCache.expiresAt > now) {
        return { records: aqiCache.records, cacheHit: true };
    }

    const records = [];
    let lastEvaluatedKey;

    do {
        const result = await dynamoClient.send(
            new ScanCommand({
                TableName: AQI_TABLE,
                ExclusiveStartKey: lastEvaluatedKey
            })
        );

        for (const item of result.Items || []) {
            const record = normalizeRecord(item);
            if (record) records.push(record);
        }

        lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    aqiCache = {
        records,
        expiresAt: Date.now() + AQI_CACHE_TTL_MS
    };

    console.log(JSON.stringify({
        message: "AQI table cache refreshed",
        table: AQI_TABLE,
        recordCount: records.length,
        cacheTtlSeconds: AQI_CACHE_TTL_MS / 1000
    }));

    return { records, cacheHit: false };
}

function lookupSample(point, records) {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const record of records) {
        const distance = haversineMeters(
            point,
            [record.lng, record.lat]
        );

        if (distance < nearestDistance) {
            nearest = record;
            nearestDistance = distance;
        }
    }

    if (
        nearest &&
        nearestDistance <= MAX_MATCH_DISTANCE_METERS
    ) {
        return {
            aqi: nearest.aqi,
            traffic: nearest.traffic,
            matched: true,
            cellId: nearest.cellId,
            distanceMeters: Number(nearestDistance.toFixed(1))
        };
    }

    return {
        aqi: DEFAULT_AQI,
        traffic: DEFAULT_TRAFFIC,
        matched: false,
        cellId: null,
        distanceMeters: null
    };
}

function enrichRouteWithAirQuality(route, records) {
    const samples = route.sampledPoints.map(point =>
        lookupSample(point, records)
    );

    const totalAqi = samples.reduce(
        (sum, sample) => sum + sample.aqi, 0
    );

    const totalTraffic = samples.reduce(
        (sum, sample) => sum + sample.traffic, 0
    );

    const matchedPointCount = samples.filter(
        sample => sample.matched
    ).length;

    return {
        ...route,
        avgAqi: Number((totalAqi / samples.length).toFixed(2)),
        avgTraffic: Number(
            (totalTraffic / samples.length).toFixed(2)
        ),
        aqiLookup: {
            sampleCount: samples.length,
            matchedPointCount,
            defaultPointCount: samples.length - matchedPointCount,
            matchRadiusMeters: MAX_MATCH_DISTANCE_METERS
        }
    };
}

function clampScore(value) {
    return Math.max(0, Math.min(100, value));
}

function scoreRoutes(routes, profile) {
    if (routes.length === 0) return [];

    const weights = PROFILE_SCORING_WEIGHTS[profile];

    if (!weights) {
        throw new Error("No scoring weights are configured for this profile.");
    }

    const fastestDuration = Math.min(
        ...routes.map(route => route.durationMin)
    );

    return routes.map(route => {
        const aqiScore = clampScore(
            100 - (Math.max(0, route.avgAqi) / 500) * 100
        );

        const trafficScore = clampScore(
            100 - Math.max(0, Math.min(100, route.avgTraffic))
        );

        const durationScore = route.durationMin > 0
            ? clampScore(
                (fastestDuration / route.durationMin) * 100
            )
            : 100;

        const routeScore =
            aqiScore * weights.aqi +
            trafficScore * weights.traffic +
            durationScore * weights.duration;

        return {
            ...route,
            routeScore: Number(routeScore.toFixed(2)),
            scoreBreakdown: {
                aqiScore: Number(aqiScore.toFixed(2)),
                trafficScore: Number(trafficScore.toFixed(2)),
                durationScore: Number(durationScore.toFixed(2)),
                weights
            }
        };
    });
}

export const handler = async event => {
    if (event?.requestContext?.http?.method === "OPTIONS") {
        return reply(200, { message: "CORS preflight successful" });
    }

    try {
        const { origin, destination, mode, profile } = parseInput(event);

        // Never present a pedestrian route as a genuine cycling route.
        // A cycling-capable routing provider must be configured first.
        if (mode === "cycling") {
            return reply(501, {
                message:
                    "Cycling routes are not configured yet. A cycling-capable routing provider is required."
            });
        }

        const command = new CalculateRoutesCommand({
            Origin: [origin.lng, origin.lat],
            Destination: [destination.lng, destination.lat],
            TravelMode: "Pedestrian",
            MaxAlternatives: 2,
            LegGeometryFormat: "Simple",
            LegAdditionalFeatures: ["Summary"]
        });

        const result = await client.send(command);
        const rawRoutes = result.Routes || [];

        if (rawRoutes.length === 0) {
            return reply(404, {
                message: "No walking route was found for these locations."
            });
        }

        const routes = rawRoutes.map((rawRoute, index) => {
            const summary = getRouteSummary(rawRoute);

            const coords = cleanCoordinates(
                (rawRoute.Legs || []).flatMap(
                    leg => leg.Geometry?.LineString || []
                )
            );

            if (coords.length < 2) {
                throw new Error(
                    `Route ${index + 1} does not contain enough geometry coordinates.`
                );
            }

            const sampledPoints = samplePoints(coords, 100);

            return {
                id: `r${index + 1}`,
                distanceKm: Number(summary.distanceKm.toFixed(3)),
                durationMin: Number(summary.durationMin.toFixed(2)),
                coords,
                sampledPoints
            };
        });

        const { records, cacheHit } = await getAqiRecords();

        const enrichedRoutes = routes.map(route =>
            enrichRouteWithAirQuality(route, records)
        );

        const scoredRoutes = scoreRoutes(enrichedRoutes, profile);

        const recommendedRoute = scoredRoutes.reduce(
            (best, route) =>
                route.routeScore > best.routeScore ? route : best
        );

        const fastestRoute = scoredRoutes.reduce(
            (fastest, route) =>
                route.durationMin < fastest.durationMin ? route : fastest
        );

        const weights = PROFILE_SCORING_WEIGHTS[profile];

        console.log(JSON.stringify({
            message: "Walking route calculation and scoring completed",
            mode,
            profile,
            routeCount: scoredRoutes.length,
            aqiCacheHit: cacheHit,
            aqiRecordCount: records.length,
            recommendedRouteId: recommendedRoute.id,
            scoringWeights: weights,
            routes: scoredRoutes.map(route => ({
                id: route.id,
                distanceKm: route.distanceKm,
                durationMin: route.durationMin,
                avgAqi: route.avgAqi,
                avgTraffic: route.avgTraffic,
                routeScore: route.routeScore,
                aqiLookup: route.aqiLookup
            }))
        }));

        return reply(200, {
            message: "Walking routes calculated, enriched with AQI table data, and scored",
            mode,
            profile,
            requestedTravelMode: mode,
            amazonLocationTravelMode: "Pedestrian",
            routeCount: scoredRoutes.length,
            fastestRouteId: fastestRoute.id,
            recommendedRouteId: recommendedRoute.id,
            scoringMethod: {
                scale: "0-100; higher is better",
                profile,
                weights: {
                    aqi: weights.aqi * 100,
                    traffic: weights.traffic * 100,
                    duration: weights.duration * 100
                },
                note: "Experimental route preference score, not a medical or validated health-risk score. Profile-specific weights are engineering assumptions, not clinical guidance."
            },
            aqiDataSource: AQI_TABLE,
            aqiIsLive: false,
            trafficIsLive: false,
            aqiCacheTtlSeconds: AQI_CACHE_TTL_MS / 1000,
            aqiCacheHit: cacheHit,
            routes: scoredRoutes
        });
    } catch (error) {
        console.error("Route handler error:", {
            name: error?.name,
            message: error?.message,
            stack: error?.stack
        });

        const message = error?.message || "Unexpected server error.";

        if (
            message.startsWith("Request body") ||
            message.startsWith("origin ") ||
            message.startsWith("destination ") ||
            message.startsWith("mode ") ||
            message.startsWith("profile ") ||
            message.startsWith("Sampling spacing") ||
            message.startsWith("Cannot sample") ||
            message.startsWith("Route contains")
        ) {
            return reply(400, { message });
        }

        return reply(500, {
            message: "Unable to calculate routes right now."
        });
    }
};