const firebaseConfig = {
  apiKey: "AIzaSyDIWZC0zO_l5IFZI_d-N54Kyjps7GwrGeU",
  authDomain: "fantasy-nascar-d3a9c.firebaseapp.com",
  projectId: "fantasy-nascar-d3a9c",
  storageBucket: "fantasy-nascar-d3a9c.firebasestorage.app",
  messagingSenderId: "204281763606",
  appId: "1:204281763606:web:b430287e4ca5b3862fe237",
  measurementId: "G-R8TMWGSWLG"
};

// Ensure Firebase initializes once with the valid key
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

const SUPER_ADMIN_EMAIL = "bradymckay25@gmail.com";
const ADMIN_EMAIL = SUPER_ADMIN_EMAIL;
const LOCAL_STORAGE_USER_NAMES_KEY = 'nascar_fantasy_user_manager_names_v1';

let currentAuthUser = null;

const NASCAR_FEEDS_BASE_URL = 'https://cf.nascar.com/live/feeds';
const LIVE_FEED_URL = `${NASCAR_FEEDS_BASE_URL}/live-feed.json`;
const PIT_DATA_URL = `${NASCAR_FEEDS_BASE_URL}/live-pit-data.json`;
const STAGE_POINTS_URL = `${NASCAR_FEEDS_BASE_URL}/live-stage-points.json`;
const LIVE_POINTS_URL = `${NASCAR_FEEDS_BASE_URL}/live-points.json`;
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxUwU-nOzKRJjgNufz-TDCKXSU2ORVHMR78pMPnfSSKKsJuMmSkzEHMIkrtnbjhS16h/exec';
const GOOGLE_SHEET_API = APPS_SCRIPT_URL;
const POLL_INTERVAL_MS = 5000;

const SERIES_NAMES = {
    1: 'NASCAR Cup Series',
    2: "NASCAR O'Reilly Auto Parts Series",
    3: 'NASCAR Craftsman Truck Series'
};

const SERIES_SHORT_NAMES = {
    1: 'Cup Series',
    2: "O'Reilly Auto Parts Series",
    3: 'Truck Series'
};

const FLAG_STATES = {
    0: { name: 'None', className: 'status-btn' },
    1: { name: 'Green', className: 'status-btn flag-green' },
    2: { name: 'Yellow', className: 'status-btn flag-yellow' },
    3: { name: 'Red', className: 'status-btn flag-red' },
    4: { name: 'White', className: 'status-btn' },
    5: { name: 'Checkered', className: 'status-btn' },
    8: { name: 'Hot Track', className: 'status-btn flag-yellow' },
    9: { name: 'Cold Track', className: 'status-btn' }
};

/**
 * Previous year's final standings directory constraining driver position tiers:
 * - Tier 1 (Pos 1–4): Select 1 Driver
 * - Tier 2 (Pos 5–16): Select 3 Drivers
 * - Tier 3 (Pos 17–30): Select 4 Drivers
 * - Tier 4 (Pos 31+): Select 2 Drivers
 */
const DEFAULT_DRIVER_DIRECTORY = [
    { pos: 1, name: 'Kyle Larson', team: 'Hendrick Motorsports', wins: 3, top5: 14, top10: 21, poles: 1 },
    { pos: 2, name: 'Denny Hamlin', team: 'Joe Gibbs Racing', wins: 6, top5: 14, top10: 17, poles: 4 },
    { pos: 3, name: 'Chase Briscoe', team: 'Joe Gibbs Racing', wins: 3, top5: 15, top10: 19, poles: 7 },
    { pos: 4, name: 'William Byron', team: 'Hendrick Motorsports', wins: 3, top5: 11, top10: 16, poles: 3 },
    { pos: 5, name: 'Christopher Bell', team: 'Joe Gibbs Racing', wins: 4, top5: 13, top10: 22, poles: 1 },
    { pos: 6, name: 'Ryan Blaney', team: 'Team Penske', wins: 3, top5: 14, top10: 18, poles: 2 },
    { pos: 7, name: 'Joey Logano', team: 'Team Penske', wins: 1, top5: 6, top10: 12, poles: 2 },
    { pos: 8, name: 'Chase Elliott', team: 'Hendrick Motorsports', wins: 2, top5: 11, top10: 18, poles: 0 },
    { pos: 9, name: 'Tyler Reddick', team: '23XI Racing', wins: 0, top5: 7, top10: 14, poles: 2 },
    { pos: 10, name: 'Ross Chastain', team: 'Trackhouse Racing', wins: 1, top5: 4, top10: 12, poles: 0 },
    { pos: 11, name: 'Bubba Wallace', team: '23XI Racing', wins: 1, top5: 6, top10: 14, poles: 0 },
    { pos: 12, name: 'Shane Van Gisbergen', team: 'Trackhouse Racing', wins: 5, top5: 5, top10: 7, poles: 3 },
    { pos: 13, name: 'Alex Bowman', team: 'Hendrick Motorsports', wins: 0, top5: 6, top10: 16, poles: 2 },
    { pos: 14, name: 'Austin Cindric', team: 'Team Penske', wins: 1, top5: 2, top10: 5, poles: 0 },
    { pos: 15, name: 'Austin Dillon', team: 'Richard Childress Racing', wins: 1, top5: 1, top10: 5, poles: 0 },
    { pos: 16, name: 'Josh Berry', team: 'Wood Brothers Racing', wins: 1, top5: 3, top10: 7, poles: 0 },
    { pos: 17, name: 'Chris Buescher', team: 'RFK Racing', wins: 0, top5: 5, top10: 16, poles: 0 },
    { pos: 18, name: 'Ryan Preece', team: 'RFK Racing', wins: 0, top5: 3, top10: 13, poles: 1 },
    { pos: 19, name: 'Ty Gibbs', team: 'Joe Gibbs Racing', wins: 0, top5: 5, top10: 10, poles: 0 },
    { pos: 20, name: 'Brad Keselowski', team: 'RFK Racing', wins: 0, top5: 5, top10: 12, poles: 0 },
    { pos: 22, name: 'Michael McDowell', team: 'Spire Motorsports', wins: 0, top5: 3, top10: 5, poles: 2 },
    { pos: 23, name: 'Carson Hocevar', team: 'Spire Motorsports', wins: 0, top5: 2, top10: 9, poles: 1 },
    { pos: 24, name: 'Erik Jones', team: 'Legacy Motor Club', wins: 0, top5: 4, top10: 5, poles: 0 },
    { pos: 25, name: 'John Hunter Nemechek', team: 'Legacy Motor Club', wins: 0, top5: 2, top10: 8, poles: 0 },
    { pos: 26, name: 'AJ Allmendinger', team: 'Kaulig Racing', wins: 0, top5: 2, top10: 7, poles: 1 },
    { pos: 27, name: 'Todd Gilliland', team: 'Front Row Motorsports', wins: 0, top5: 1, top10: 5, poles: 0 },
    { pos: 28, name: 'Zane Smith', team: 'Front Row Motorsports', wins: 0, top5: 1, top10: 5, poles: 1 },
    { pos: 29, name: 'Daniel Suarez', team: 'Spire Motorsports', wins: 0, top5: 2, top10: 7, poles: 0 },
    { pos: 30, name: 'Ricky Stenhouse Jr.', team: 'Hyak Motorsports', wins: 0, top5: 1, top10: 3, poles: 0 },
    { pos: 32, name: 'Cole Custer', team: 'Haas Factory Team', wins: 0, top5: 2, top10: 3, poles: 0 },
    { pos: 33, name: 'Ty Dillon', team: 'Kaulig Racing', wins: 0, top5: 0, top10: 1, poles: 0 },
    { pos: 34, name: 'Noah Gragson', team: 'Front Row Motorsports', wins: 0, top5: 1, top10: 3, poles: 0 },
    { pos: 35, name: 'Riley Herbst', team: '23XI Racing', wins: 0, top5: 0, top10: 0, poles: 0 },
    { pos: 36, name: 'Cody Ware', team: 'Rick Ware Racing', wins: 0, top5: 0, top10: 0, poles: 0 },
    { pos: 44, name: 'Corey Heim', team: '23XI Racing', wins: 0, top5: 0, top10: 1, poles: 0 },
    { pos: 45, name: 'Austin Hill', team: 'Richard Childress Racing', wins: 0, top5: 0, top10: 1, poles: 0 },
    { pos: 47, name: 'Connor Zilisch', team: 'Trackhouse Racing', wins: 0, top5: 0, top10: 0, poles: 0 },
    { pos: 48, name: 'Bj Mcleod', team: 'Live Fast Motorsports', wins: 0, top5: 0, top10: 0, poles: 0 },
    { pos: 49, name: 'Casey Mears', team: 'Garage 66', wins: 0, top5: 0, top10: 0, poles: 0 },
    { pos: 57, name: 'JJ Yeley', team: 'NY Racing Team', wins: 0, top5: 0, top10: 0, poles: 0 }
];

const DEFAULT_TEAMS_LIST = [
    '23XI Racing',
    'Front Row Motorsports',
    'Garage 66',
    'Haas Factory Team',
    'Hendrick Motorsports',
    'Hyak Motorsports',
    'Joe Gibbs Racing',
    'Kaulig Racing',
    'Legacy Motor Club',
    'Live Fast Motorsports',
    'NY Racing Team',
    'RFK Racing',
    'Richard Childress Racing',
    'Rick Ware Racing',
    'Spire Motorsports',
    'Team Penske',
    'Trackhouse Racing',
    'Wood Brothers Racing'
];

const LOCAL_STORAGE_ROSTERS_KEY = 'fantasy_nascar_rosters_v1';

/**
 * Default fallback user rosters adhering strictly to the tier & non-overlapping team rules:
 * - Tier 1 (Pos 1-4): 1 driver
 * - Tier 2 (Pos 5-16): 3 drivers
 * - Tier 3 (Pos 17-30): 4 drivers
 * - Tier 4 (Pos 31+): 2 drivers
 * - Race Teams (2 unique teams with zero overlap with drafted drivers' teams)
 */
const DEFAULT_USER_ROSTERS = [
    {
        Manager: 'Brady',
        Drivers: [
            'Kyle Larson',           // Tier 1 (#1, Hendrick Motorsports)
            'Chase Elliott',         // Tier 2 (#8, Hendrick Motorsports)
            'Alex Bowman',           // Tier 2 (#13, Hendrick Motorsports)
            'Bubba Wallace',         // Tier 2 (#11, 23XI Racing)
            'Chris Buescher',        // Tier 3 (#17, RFK Racing)
            'Carson Hocevar',        // Tier 3 (#23, Spire Motorsports)
            'John Hunter Nemechek',  // Tier 3 (#25, Legacy Motor Club)
            'Todd Gilliland',        // Tier 3 (#27, Front Row Motorsports)
            'Cole Custer',           // Tier 4 (#32, Haas Factory Team)
            'Riley Herbst'           // Tier 4 (#35, 23XI Racing)
        ],
        Teams: ['Joe Gibbs Racing', 'Team Penske']
    },
    {
        Manager: 'Austin',
        Drivers: [
            'Denny Hamlin',          // Tier 1 (#2, Joe Gibbs Racing)
            'Christopher Bell',      // Tier 2 (#5, Joe Gibbs Racing)
            'Ross Chastain',         // Tier 2 (#10, Trackhouse Racing)
            'Josh Berry',            // Tier 2 (#16, Wood Brothers Racing)
            'Brad Keselowski',       // Tier 3 (#20, RFK Racing)
            'Michael McDowell',      // Tier 3 (#22, Spire Motorsports)
            'Erik Jones',            // Tier 3 (#24, Legacy Motor Club)
            'Ricky Stenhouse Jr.',   // Tier 3 (#30, Hyak Motorsports)
            'Ty Dillon',             // Tier 4 (#33, Kaulig Racing)
            'Noah Gragson'           // Tier 4 (#34, Front Row Motorsports)
        ],
        Teams: ['Hendrick Motorsports', '23XI Racing']
    },
    {
        Manager: 'Tyler',
        Drivers: [
            'William Byron',         // Tier 1 (#4, Hendrick Motorsports)
            'Ryan Blaney',           // Tier 2 (#6, Team Penske)
            'Joey Logano',           // Tier 2 (#7, Team Penske)
            'Austin Cindric',        // Tier 2 (#14, Team Penske)
            'Ryan Preece',           // Tier 3 (#18, RFK Racing)
            'Ty Gibbs',              // Tier 3 (#19, Joe Gibbs Racing)
            'Zane Smith',            // Tier 3 (#28, Front Row Motorsports)
            'Daniel Suarez',         // Tier 3 (#29, Spire Motorsports)
            'Cody Ware',             // Tier 4 (#36, Rick Ware Racing)
            'Austin Hill'            // Tier 4 (#45, Richard Childress Racing)
        ],
        Teams: ['Trackhouse Racing', '23XI Racing']
    }
];

let cachedUserRosters = null;
let rosterFetchPromise = null;
let cachedSheetStandingsMap = {};
let cachedDriverDirectory = [...DEFAULT_DRIVER_DIRECTORY];
let cachedTeamsList = [...DEFAULT_TEAMS_LIST];
let cachedDriverTeamMap = {};
let cachedDriverPosMap = {};
let driverStatsMap = {};
let teamStatsMap = {};
let latestRaceData = null;
let latestPitData = null;
let latestStageData = null;
let latestPointsData = null;
let activeSeriesId = 1;
let isRosterFormInitialized = false;
let livePollingIntervalId = null;
let isLivePollInFlight = false;
let lastPollStartedAt = 0;

/**
 * Helper to fetch a URL with an AbortController timeout so a hung connection never stalls the polling loop.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 7000) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timerId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
        const response = await fetch(url, {
            ...options,
            cache: 'no-store',
            signal: controller ? controller.signal : undefined
        });
        return response;
    } finally {
        if (timerId) clearTimeout(timerId);
    }
}

/**
 * Helper to fetch JSON from a URL with cache-busting and multi-tier CORS proxy fallback
 * so temporary network/CORS hiccups never break the live polling loop.
 */
async function fetchWithCorsFallback(url) {
    const separator = url.includes('?') ? '&' : '?';
    const cacheBustedUrl = `${url}${separator}_t=${Date.now()}`;

    try {
        const response = await fetchWithTimeout(cacheBustedUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        }, 6500);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (directError) {
        console.warn(`Direct fetch failed for ${url}, attempting primary CORS proxy fallback:`, directError.message);
        try {
            const proxyUrl1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(cacheBustedUrl)}`;
            const proxyResponse1 = await fetchWithTimeout(proxyUrl1, { method: 'GET' }, 7500);
            if (!proxyResponse1.ok) {
                throw new Error(`Primary CORS proxy HTTP status: ${proxyResponse1.status}`);
            }
            return await proxyResponse1.json();
        } catch (proxy1Error) {
            console.warn(`Primary CORS proxy failed for ${url}, attempting secondary CORS proxy:`, proxy1Error.message);
            const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(cacheBustedUrl)}`;
            const proxyResponse2 = await fetchWithTimeout(proxyUrl2, { method: 'GET' }, 7500);
            if (!proxyResponse2.ok) {
                throw new Error(`Secondary CORS proxy failed with HTTP status: ${proxyResponse2.status}`);
            }
            return await proxyResponse2.json();
        }
    }
}

let cachedBackendTeamPointsMap = new Map();
let cachedBackendDriverPointsMap = new Map();
let backendTeamPointsFetchPromise = null;

/**
 * Registers or updates an official team points entry in cachedBackendTeamPointsMap.
 */
function upsertBackendTeamPointsEntry(rawTeamName, pointsInfo = {}) {
    const cleanName = String(rawTeamName ?? '')
        .replace(/^🏁\s*/, '')
        .replace(/\s*\([^)]*pts[^)]*\)\s*$/i, '')
        .trim();
    if (!cleanName) return;
    const norm = normalizeName(cleanName);
    if (!norm) return;

    const existing = cachedBackendTeamPointsMap.get(norm) || {
        name: cleanName,
        racePoints: null,
        totalPoints: null,
        points: null,
        byRaceId: {}
    };

    if (pointsInfo.racePoints !== undefined && pointsInfo.racePoints !== null && Number.isFinite(Number(pointsInfo.racePoints))) {
        existing.racePoints = Math.round(Number(pointsInfo.racePoints));
    }
    if (pointsInfo.totalPoints !== undefined && pointsInfo.totalPoints !== null && Number.isFinite(Number(pointsInfo.totalPoints))) {
        existing.totalPoints = Math.round(Number(pointsInfo.totalPoints));
    }
    if (pointsInfo.points !== undefined && pointsInfo.points !== null && Number.isFinite(Number(pointsInfo.points))) {
        existing.points = Math.round(Number(pointsInfo.points));
        if (existing.racePoints === null) existing.racePoints = existing.points;
        if (existing.totalPoints === null) existing.totalPoints = existing.points;
    }
    if (pointsInfo.byRaceId && typeof pointsInfo.byRaceId === 'object') {
        Object.entries(pointsInfo.byRaceId).forEach(([rId, val]) => {
            if (rId && Number.isFinite(Number(val))) {
                existing.byRaceId[String(rId).trim()] = Math.round(Number(val));
            }
        });
    }

    cachedBackendTeamPointsMap.set(norm, existing);
}

/**
 * Registers or updates an official driver points entry in cachedBackendDriverPointsMap.
 */
function upsertBackendDriverPointsEntry(rawDriverName, pointsInfo = {}) {
    const cleanName = String(rawDriverName ?? '')
        .replace(/^#\d+\s+/, '')
        .replace(/\s*\([^)]*pts[^)]*\)\s*$/i, '')
        .trim();
    if (!cleanName) return;
    const norm = normalizeName(cleanName);
    if (!norm) return;

    const existing = cachedBackendDriverPointsMap.get(norm) || {
        name: cleanName,
        racePoints: null,
        totalPoints: null,
        points: null,
        byRaceId: {}
    };

    if (pointsInfo.racePoints !== undefined && pointsInfo.racePoints !== null && Number.isFinite(Number(pointsInfo.racePoints))) {
        existing.racePoints = Math.round(Number(pointsInfo.racePoints));
    }
    if (pointsInfo.totalPoints !== undefined && pointsInfo.totalPoints !== null && Number.isFinite(Number(pointsInfo.totalPoints))) {
        existing.totalPoints = Math.round(Number(pointsInfo.totalPoints));
    }
    if (pointsInfo.points !== undefined && pointsInfo.points !== null && Number.isFinite(Number(pointsInfo.points))) {
        existing.points = Math.round(Number(pointsInfo.points));
        if (existing.racePoints === null) existing.racePoints = existing.points;
        if (existing.totalPoints === null) existing.totalPoints = existing.points;
    }
    if (pointsInfo.byRaceId && typeof pointsInfo.byRaceId === 'object') {
        Object.entries(pointsInfo.byRaceId).forEach(([rId, val]) => {
            if (rId && Number.isFinite(Number(val))) {
                existing.byRaceId[String(rId).trim()] = Math.round(Number(val));
            }
        });
    }

    cachedBackendDriverPointsMap.set(norm, existing);
}

/**
 * Parses any backend payload containing official Team Points (from ?action=Team Points, ?action=getTeamPoints,
 * ?action=getDriverData, ?action=getRosters, or ?action=getRaceResults).
 */
function ingestBackendTeamPointsData(rawPayload) {
    if (!rawPayload) return;

    const parseNum = (val) => {
        if (val === undefined || val === null || String(val).trim() === '') return null;
        const n = Number(String(val).replace(/,/g, '').trim());
        return Number.isFinite(n) ? Math.round(n) : null;
    };

    // Unwrap container object if needed
    let payload = rawPayload;
    if (typeof rawPayload === 'object' && !Array.isArray(rawPayload)) {
        const arrayCandidate = rawPayload.teamPoints ||
                               rawPayload.TeamPoints ||
                               rawPayload.team_points ||
                               rawPayload.teamScores ||
                               rawPayload.TeamScores ||
                               rawPayload['Team Points'] ||
                               rawPayload.teams ||
                               rawPayload.Teams ||
                               rawPayload.results ||
                               rawPayload.data ||
                               rawPayload.values ||
                               rawPayload.rows;
        if (arrayCandidate !== undefined) {
            payload = arrayCandidate;
        }
    }

    // Case 1: Plain dictionary mapping { "23XI Racing": 58, "Team Penske": { racePoints: 45, totalPoints: 310 } }
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        Object.entries(payload).forEach(([key, val]) => {
            if (!key || /^(status|message|error|action|meta|raceMeta)$/i.test(key.trim())) return;
            if (typeof val === 'number' || typeof val === 'string') {
                const pts = parseNum(val);
                if (pts !== null) {
                    upsertBackendTeamPointsEntry(key, { points: pts, racePoints: pts });
                }
            } else if (val && typeof val === 'object') {
                const racePts = parseNum(
                    val.racePoints ?? val.RacePoints ?? val['Race Points'] ?? val['Race Pts'] ??
                    val.lastRacePoints ?? val.LastRacePoints ?? val.livePoints ?? val.LivePoints ??
                    val.points ?? val.Points ?? val['Team Points'] ?? val['Total Fantasy Point'] ?? val.score ?? val.Score
                );
                const totalPts = parseNum(
                    val.totalPoints ?? val.TotalPoints ?? val['Total Points'] ?? val.seasonPoints ??
                    val.SeasonPoints ?? val.cumulativePoints ?? val.total ?? val.Total ?? racePts
                );
                upsertBackendTeamPointsEntry(val.name ?? val.Team ?? val.team ?? key, {
                    racePoints: racePts,
                    totalPoints: totalPts,
                    points: racePts ?? totalPts
                });
            }
        });
        return;
    }

    if (!Array.isArray(payload) || payload.length === 0) return;

    // Case 2: 2D Grid Array [[headers...], [row1...], ...] from Team Points tab
    let rows = payload;
    if (Array.isArray(payload[0])) {
        const headers = payload[0].map(h => String(h ?? '').trim());
        rows = payload.slice(1).map(rowArr => {
            const obj = {};
            headers.forEach((h, idx) => {
                if (h) obj[h] = rowArr[idx];
            });
            return obj;
        });
    }

    if (rows.length === 0 || typeof rows[0] !== 'object' || rows[0] === null) return;

    // Subcase 2A: Vertical Team Columns (Row 1 headers are team names like "23XI Racing", "Team Penske", "Richard Childress Racing")
    const knownTeamsNorm = new Set((cachedTeamsList || DEFAULT_TEAMS_LIST).map(normalizeName));
    const firstRowKeys = Object.keys(rows[0]);
    const matchingTeamHeaderKeys = firstRowKeys.filter(k => knownTeamsNorm.has(normalizeName(k)));

    if (matchingTeamHeaderKeys.length >= 2) {
        matchingTeamHeaderKeys.forEach(teamHeader => {
            let sumPts = 0;
            let latestRacePts = null;
            const byRaceId = {};

            rows.forEach(r => {
                const val = parseNum(r[teamHeader]);
                if (val === null) return;
                const rowLabel = String(r[firstRowKeys[0]] ?? r['Race ID'] ?? r['Race'] ?? '').trim();
                if (/^(total|sum|season total|cumulative|overall)/i.test(rowLabel)) {
                    upsertBackendTeamPointsEntry(teamHeader, { totalPoints: val });
                    return;
                }
                const raceIdMatch = rowLabel.match(/^(\d{4})/);
                if (raceIdMatch && val > 0) {
                    byRaceId[raceIdMatch[1]] = val;
                }
                if (val > 0) {
                    sumPts += val;
                    latestRacePts = val;
                }
            });

            upsertBackendTeamPointsEntry(teamHeader, {
                racePoints: latestRacePts ?? 0,
                totalPoints: sumPts > 0 ? sumPts : (latestRacePts ?? 0),
                points: latestRacePts ?? sumPts ?? 0,
                byRaceId
            });
        });
        return;
    }

    // Subcase 2B: Standard row objects where each row has a Team Name
    const multiRaceAccumulator = new Map();

    rows.forEach(row => {
        if (!row || typeof row !== 'object') return;
        const teamName = String(
            row['Team'] ?? row['Team Name'] ?? row['Race Team'] ?? row['Organization'] ?? row['Owner'] ??
            row.team ?? row.Team ?? row.teamName ?? row.TeamName ?? row.name ?? row.Name ?? ''
        ).trim();
        if (!teamName || /^(team|team name|total|average|sum)$/i.test(teamName)) return;

        const rowRaceId = String(
            row['Race ID'] ?? row['Race Id'] ?? row['race_id'] ?? row['RaceId'] ?? row['raceId'] ?? ''
        ).trim();

        const explicitRacePts = parseNum(
            row['Average Points'] ?? row['Average Pts'] ?? row['Avg Points'] ?? row['Avg Pts'] ??
            row.AveragePoints ?? row.averagePoints ?? row.avgPoints ?? row.AvgPoints ??
            row['Race Points'] ?? row['Race Pts'] ?? row['Team Points'] ?? row['Team Pts'] ??
            row['Total Fantasy Point'] ?? row['Total Fantasy Points'] ?? row['Fantasy Points'] ??
            row['Last Race'] ?? row['Last Race Points'] ?? row['Current Race'] ?? row['Live Points'] ??
            row.racePoints ?? row.RacePoints ?? row.teamPoints ?? row.TeamPoints ??
            row.lastRacePoints ?? row.LastRacePoints ?? row.livePoints ?? row.points ?? row.Points ?? row.score ?? row.Score
        );

        const explicitTotalPts = parseNum(
            row['Total Points'] ?? row['Total'] ?? row['Season Points'] ?? row['Cumulative Points'] ??
            row['Season Total'] ?? row.totalPoints ?? row.TotalPoints ?? row.seasonPoints ?? row.SeasonPoints ??
            row.total ?? row.Total
        );

        const byRaceId = {};
        let lastNonZeroRaceColPts = null;
        let summedRaceCols = 0;

        // Also inspect any race-specific columns (e.g., "5633" or "5633 Freeway Insurance 500") or RaceScores array on the team row
        if (Array.isArray(row.RaceScores || row.raceScores)) {
            (row.RaceScores || row.raceScores).forEach(rs => {
                if (!rs || typeof rs !== 'object') return;
                const rId = String(rs.raceId ?? rs.RaceId ?? rs.id ?? '').trim();
                const rPts = parseNum(rs.points ?? rs.Points ?? rs.score ?? rs.Score);
                if (rPts !== null && rPts > 0) {
                    if (rId) byRaceId[rId] = rPts;
                    lastNonZeroRaceColPts = rPts;
                    summedRaceCols += rPts;
                }
            });
        }

        Object.entries(row).forEach(([colKey, colVal]) => {
            const cleanKey = String(colKey).trim();
            if (/^(team|team name|race team|organization|owner|name|pos|rank|position|race id|race_id|wins|top\s*\d+|poles|car|cars)$/i.test(cleanKey)) {
                return;
            }
            if (/^(total|total points|season points|cumulative points|season total)$/i.test(cleanKey)) {
                return;
            }
            const raceIdPrefix = cleanKey.match(/^(\d{4})\b/);
            if (raceIdPrefix) {
                const pts = parseNum(colVal);
                if (pts !== null) {
                    byRaceId[raceIdPrefix[1]] = pts;
                    if (pts > 0) {
                        lastNonZeroRaceColPts = pts;
                        summedRaceCols += pts;
                    }
                }
            }
        });

        if (rowRaceId && explicitRacePts !== null) {
            const norm = normalizeName(teamName);
            const acc = multiRaceAccumulator.get(norm) || {
                teamName,
                latestRacePts: 0,
                totalPts: 0,
                byRaceId: {}
            };
            acc.byRaceId[rowRaceId] = explicitRacePts;
            if (explicitRacePts > 0) {
                acc.latestRacePts = explicitRacePts;
                acc.totalPts += explicitRacePts;
            }
            multiRaceAccumulator.set(norm, acc);
        } else {
            const resolvedRacePts = explicitRacePts ?? lastNonZeroRaceColPts;
            const resolvedTotalPts = explicitTotalPts ?? (summedRaceCols > 0 ? summedRaceCols : resolvedRacePts);
            if (resolvedRacePts !== null || resolvedTotalPts !== null) {
                upsertBackendTeamPointsEntry(teamName, {
                    racePoints: resolvedRacePts ?? resolvedTotalPts,
                    totalPoints: resolvedTotalPts ?? resolvedRacePts,
                    points: resolvedRacePts ?? resolvedTotalPts,
                    byRaceId
                });
            }
        }
    });

    multiRaceAccumulator.forEach(acc => {
        upsertBackendTeamPointsEntry(acc.teamName, {
            racePoints: acc.latestRacePts,
            totalPoints: acc.totalPts,
            points: acc.latestRacePts || acc.totalPts,
            byRaceId: acc.byRaceId
        });
    });
}

/**
 * Fetches official Team Points from the Google Apps Script backend (trying ?action=Team Points and ?action=getTeamPoints).
 */
async function fetchBackendTeamPoints(forceRefresh = false) {
    if (!currentAuthUser) return cachedBackendTeamPointsMap;
    if (backendTeamPointsFetchPromise && !forceRefresh) return backendTeamPointsFetchPromise;

    backendTeamPointsFetchPromise = (async () => {
        const candidateActions = ['Team Points', 'getTeamPoints', 'TeamPoints'];
        for (const actionName of candidateActions) {
            try {
                const res = await fetch(`${APPS_SCRIPT_URL}?action=${encodeURIComponent(actionName)}`);
                if (!res.ok) continue;
                const data = await res.json();
                if (!data || (typeof data === 'object' && data.status === 'error')) continue;
                const beforeSize = cachedBackendTeamPointsMap.size;
                ingestBackendTeamPointsData(data);
                if (cachedBackendTeamPointsMap.size > 0 || cachedBackendTeamPointsMap.size > beforeSize) {
                    break;
                }
            } catch (err) {
                // Continue to next candidate action
            }
        }
        backendTeamPointsFetchPromise = null;
        return cachedBackendTeamPointsMap;
    })();

    return backendTeamPointsFetchPromise;
}

/**
 * Looks up a team's official backend points entry by exact or normalized/fuzzy team name
 * (e.g., "23XI Racing", "Team Penske", "Richard Childress Racing").
 */
function lookupBackendTeamEntry(teamName) {
    const clean = String(teamName ?? '')
        .replace(/^🏁\s*/, '')
        .replace(/\s*\([^)]*pts[^)]*\)\s*$/i, '')
        .trim();
    if (!clean) return null;
    const norm = normalizeName(clean);
    if (!norm) return null;

    if (cachedBackendTeamPointsMap.has(norm)) {
        return cachedBackendTeamPointsMap.get(norm);
    }

    for (const [key, entry] of cachedBackendTeamPointsMap.entries()) {
        if (key.includes(norm) || norm.includes(key)) {
            return entry;
        }
    }
    return null;
}

/**
 * Looks up a driver's official backend points entry by exact or normalized driver name.
 */
function lookupBackendDriverEntry(driverName) {
    const clean = String(driverName ?? '')
        .replace(/^#\d+\s+/, '')
        .replace(/\s*\([^)]*pts[^)]*\)\s*$/i, '')
        .trim();
    if (!clean) return null;
    const norm = normalizeName(clean);
    if (!norm) return null;

    if (cachedBackendDriverPointsMap.has(norm)) {
        return cachedBackendDriverPointsMap.get(norm);
    }

    for (const [key, entry] of cachedBackendDriverPointsMap.entries()) {
        if (key.includes(norm) || norm.includes(key)) {
            return entry;
        }
    }
    return null;
}

/**
 * Resolves the official backend points for a selected Race Team (never guessing or averaging on the client side).
 */
function resolveOfficialTeamPoints(teamName, roster = null, options = {}) {
    const clean = String(teamName ?? '')
        .replace(/^🏁\s*/, '')
        .replace(/\s*\([^)]*pts[^)]*\)\s*$/i, '')
        .trim();
    if (!clean) return 0;
    const norm = normalizeName(clean);

    // 1. Check if the team string itself had an inline "(XX pts)" annotation from the sheet
    const inlineMatch = String(teamName ?? '').match(/\(([+-]?\d+(?:,\d{3})*(?:\.\d+)?)\s*pts?\)/i);
    if (inlineMatch) {
        const inlinePts = Number(inlineMatch[1].replace(/,/g, ''));
        if (Number.isFinite(inlinePts)) return Math.round(inlinePts);
    }

    // 2. Check manager-level TeamPointsMap on the roster object (from getRosters)
    if (roster && roster.TeamPointsMap && typeof roster.TeamPointsMap === 'object') {
        if (roster.TeamPointsMap[norm] !== undefined && Number.isFinite(Number(roster.TeamPointsMap[norm]))) {
            return Math.round(Number(roster.TeamPointsMap[norm]));
        }
        for (const [k, v] of Object.entries(roster.TeamPointsMap)) {
            if ((k.includes(norm) || norm.includes(k)) && Number.isFinite(Number(v))) {
                return Math.round(Number(v));
            }
        }
    }

    // 3. Check global backend Team Points map (from Team Points tab / getDriverData / Results / getRaceResults)
    const backendEntry = lookupBackendTeamEntry(clean);
    if (backendEntry) {
        const targetRaceId = String(options.raceId ?? roster?.LastRaceId ?? '').trim();
        if (targetRaceId && backendEntry.byRaceId && backendEntry.byRaceId[targetRaceId] !== undefined) {
            return Math.round(Number(backendEntry.byRaceId[targetRaceId]) || 0);
        }
        if (options.preferTotalPoints && backendEntry.totalPoints !== null) {
            return Math.round(Number(backendEntry.totalPoints) || 0);
        }
        const resolved = backendEntry.racePoints ?? backendEntry.points ?? backendEntry.totalPoints ?? 0;
        return Math.round(Number(resolved) || 0);
    }

    return 0;
}

/**
 * Resolves the official points for a drafted Driver (checking manager-level DriverPointsMap,
 * live race vehicle score, and backend driver points from getDriverData / Results).
 */
function resolveOfficialDriverPoints(driverName, roster = null, scoredVehicle = null, options = {}) {
    const clean = String(driverName ?? '')
        .replace(/^#\d+\s+/, '')
        .replace(/\s*\([^)]*pts[^)]*\)\s*$/i, '')
        .trim();
    if (!clean) return 0;
    const norm = normalizeName(clean);

    // 1. Check inline "(XX pts)" annotation if present
    const inlineMatch = String(driverName ?? '').match(/\(([+-]?\d+(?:,\d{3})*(?:\.\d+)?)\s*pts?\)/i);
    if (inlineMatch) {
        const inlinePts = Number(inlineMatch[1].replace(/,/g, ''));
        if (Number.isFinite(inlinePts)) return Math.round(inlinePts);
    }

    // 2. If live vehicle telemetry score is provided and non-zero, use it for live race scoring
    if (scoredVehicle && Number(scoredVehicle.totalFantasyPts) > 0 && !options.preferTotalPoints) {
        return Math.round(Number(scoredVehicle.totalFantasyPts));
    }

    // 3. Check manager-level DriverPointsMap on the roster object (from getRosters)
    if (roster && roster.DriverPointsMap && typeof roster.DriverPointsMap === 'object') {
        if (roster.DriverPointsMap[norm] !== undefined && Number.isFinite(Number(roster.DriverPointsMap[norm]))) {
            return Math.round(Number(roster.DriverPointsMap[norm]));
        }
    }

    // 4. Check global backend Driver Points map (from getDriverData / Results / getRaceResults)
    const backendEntry = lookupBackendDriverEntry(clean);
    if (backendEntry) {
        const targetRaceId = String(options.raceId ?? roster?.LastRaceId ?? '').trim();
        if (targetRaceId && backendEntry.byRaceId && backendEntry.byRaceId[targetRaceId] !== undefined && !options.preferTotalPoints) {
            return Math.round(Number(backendEntry.byRaceId[targetRaceId]) || 0);
        }
        if (options.preferTotalPoints && backendEntry.totalPoints !== null) {
            return Math.round(Number(backendEntry.totalPoints) || 0);
        }
        const resolved = backendEntry.racePoints ?? backendEntry.points ?? backendEntry.totalPoints ?? 0;
        if (Number(resolved) > 0) {
            return Math.round(Number(resolved));
        }
    }

    if (scoredVehicle && Number.isFinite(Number(scoredVehicle.totalFantasyPts))) {
        return Math.round(Number(scoredVehicle.totalFantasyPts));
    }

    return 0;
}

/**
 * Rebuilds internal lookup maps (previous year standings position, team assignment, cumulative stats,
 * and any official driver/team points included in getDriverData) from the active driver directory.
 */
function rebuildDriverAndTeamMaps(driversArray, teamsArray, rawDriverDataPayload = null) {
    cachedDriverPosMap = {};
    cachedDriverTeamMap = {};
    driverStatsMap = {};
    teamStatsMap = {};

    if (rawDriverDataPayload && typeof rawDriverDataPayload === 'object') {
        ingestBackendTeamPointsData(rawDriverDataPayload);
    }

    const validDrivers = Array.isArray(driversArray) && driversArray.length > 0
        ? driversArray
        : DEFAULT_DRIVER_DIRECTORY;

    cachedDriverDirectory = validDrivers.map((d, idx) => {
        const name = String(d.name ?? d.Driver ?? d['Driver Name'] ?? '').trim();
        const team = String(d.team ?? d.Team ?? d['Race Team'] ?? 'Independent').trim();
        const racePts = d.racePoints ?? d.RacePoints ?? d['Race Points'] ?? d['Race Pts'] ?? d.lastRacePoints ?? d.LastRacePoints ?? d['Total Fantasy Point'] ?? d.fantasyPoints ?? null;
        const totalPts = d.totalPoints ?? d.TotalPoints ?? d['Total Points'] ?? d.seasonPoints ?? d.SeasonPoints ?? d.points ?? d.Points ?? null;
        if (name && (racePts !== null || totalPts !== null)) {
            upsertBackendDriverPointsEntry(name, {
                racePoints: racePts !== null ? Number(String(racePts).replace(/,/g, '')) : null,
                totalPoints: totalPts !== null ? Number(String(totalPts).replace(/,/g, '')) : null,
                points: (racePts ?? totalPts) !== null ? Number(String(racePts ?? totalPts).replace(/,/g, '')) : null
            });
        }
        return {
            name,
            pos: Number(d.pos ?? d.position ?? d.Pos) || (idx + 1),
            team,
            wins: Number(d.wins ?? d.Wins) || 0,
            top5: Number(d.top5 ?? d['Top 5']) || 0,
            top10: Number(d.top10 ?? d['Top 10']) || 0,
            poles: Number(d.poles ?? d.Poles) || 0
        };
    }).sort((a, b) => a.pos - b.pos);

    const normalizedTeamNames = [];
    if (Array.isArray(teamsArray) && teamsArray.length > 0) {
        ingestBackendTeamPointsData(teamsArray);
        teamsArray.forEach(t => {
            if (typeof t === 'string') {
                const clean = t.trim();
                if (clean) normalizedTeamNames.push(clean);
            } else if (t && typeof t === 'object') {
                const tName = String(t.name ?? t.Team ?? t.team ?? t['Team Name'] ?? t['Race Team'] ?? '').trim();
                if (tName) normalizedTeamNames.push(tName);
            }
        });
    }

    const discoveredTeams = new Set(normalizedTeamNames.length > 0 ? normalizedTeamNames : DEFAULT_TEAMS_LIST);

    cachedDriverDirectory.forEach(d => {
        const norm = normalizeName(d.name);
        cachedDriverPosMap[norm] = d.pos;
        cachedDriverTeamMap[norm] = d.team;
        if (d.team && d.team !== 'Independent') {
            discoveredTeams.add(d.team);
        }

        driverStatsMap[d.name] = {
            wins: d.wins,
            top5: d.top5,
            top10: d.top10,
            poles: d.poles,
            team: d.team,
            pos: d.pos
        };

        if (!teamStatsMap[d.team]) {
            teamStatsMap[d.team] = { wins: 0, top5: 0, top10: 0, poles: 0 };
        }
        teamStatsMap[d.team].wins += d.wins;
        teamStatsMap[d.team].top5 += d.top5;
        teamStatsMap[d.team].top10 += d.top10;
        teamStatsMap[d.team].poles += d.poles;
    });

    cachedTeamsList = Array.from(discoveredTeams).filter(Boolean);
}

// Initialize default maps immediately
rebuildDriverAndTeamMaps(DEFAULT_DRIVER_DIRECTORY, DEFAULT_TEAMS_LIST);

/**
 * Dynamically detects which NASCAR Series feed (Cup = 1, O'Reilly Auto Parts = 2, Truck = 3) is currently live.
 */
async function detectAndFetchLiveSeriesFeed() {
    // 1. Try primary unified live-feed.json first
    try {
        const mainFeed = await fetchWithCorsFallback(LIVE_FEED_URL);
        if (mainFeed && Array.isArray(mainFeed.vehicles) && mainFeed.vehicles.length > 0) {
            const detectedSeries = Number(mainFeed.series_id) || 1;
            activeSeriesId = detectedSeries;
            return { raceData: mainFeed, seriesId: detectedSeries };
        }
    } catch (e) {
        console.warn('Unified live-feed.json check failed, probing series-specific feeds...', e.message);
    }

    // 2. Probe Series 1 (Cup), Series 2 (NASCAR O'Reilly Auto Parts Series), and Series 3 (Truck) endpoints in parallel
    const seriesIds = [1, 2, 3];
    const probePromises = seriesIds.map(async (id) => {
        const candidateUrl = `${NASCAR_FEEDS_BASE_URL}/series_${id}/live-feed.json`;
        const data = await fetchWithCorsFallback(candidateUrl);
        return { seriesId: id, data };
    });

    const results = await Promise.allSettled(probePromises);
    const availableFeeds = results
        .filter(r => r.status === 'fulfilled' && r.value?.data && Array.isArray(r.value.data.vehicles))
        .map(r => r.value);

    if (availableFeeds.length > 0) {
        const activeRaceFeed = availableFeeds.find(f =>
            [1, 2, 3, 4].includes(Number(f.data.flag_state)) && Number(f.data.lap_number) > 0
        ) || availableFeeds.find(f => f.data.vehicles.length > 0) || availableFeeds[0];

        activeSeriesId = Number(activeRaceFeed.data.series_id) || activeRaceFeed.seriesId;
        return { raceData: activeRaceFeed.data, seriesId: activeSeriesId };
    }

    throw new Error("No live NASCAR Cup, O'Reilly Auto Parts, or Truck series feed is currently active.");
}

/**
 * Fantasy Scoring Table vertical manager column bounds:
 * Columns D (0-based index 3) through AI (0-based index 34) — 32 manager columns total.
 * Within each column:
 * - Row 1: Manager Name
 * - Rows 2 through 11: 10 Drafted Drivers
 * - Rows 12 and 13: 2 Selected Race Teams
 */
const FANTASY_SCORING_START_COL_INDEX = 3; // Column D
const FANTASY_SCORING_END_COL_INDEX = 34;  // Column AI

/**
 * Converts a 0-based column index to an Excel/Google Sheet column letter (e.g., 3 -> 'D', 25 -> 'Z', 26 -> 'AA', 34 -> 'AI').
 */
function getExcelColumnLetter(colIndexZeroBased) {
    let index = Math.max(0, Number(colIndexZeroBased) || 0);
    let letter = '';
    while (index >= 0) {
        letter = String.fromCharCode((index % 26) + 65) + letter;
        index = Math.floor(index / 26) - 1;
    }
    return letter;
}

/**
 * Converts an Excel/Google Sheet column letter (e.g., 'D' -> 3, 'AI' -> 34) to a 0-based column index.
 */
function getColumnIndexFromLetter(colLetter) {
    const clean = String(colLetter ?? '').trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (!clean) return FANTASY_SCORING_START_COL_INDEX;
    let index = 0;
    for (let i = 0; i < clean.length; i++) {
        index = index * 26 + (clean.charCodeAt(i) - 64);
    }
    return index - 1;
}

/**
 * Ordered list of manager column letters in the Fantasy Scoring Table from D through AI.
 */
const FANTASY_SCORING_MANAGER_COLUMNS = Array.from(
    { length: FANTASY_SCORING_END_COL_INDEX - FANTASY_SCORING_START_COL_INDEX + 1 },
    (_, idx) => getExcelColumnLetter(FANTASY_SCORING_START_COL_INDEX + idx)
);

/**
 * Cleans an individual cell value from the Google Sheet vertical roster column,
 * stripping optional position prefixes (e.g. "#1 ") or trailing team annotations if present.
 */
function cleanRosterCell(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    return raw
        .replace(/^#\d+\s+/, '')
        .replace(/\s*\([^)]+\)\s*$/, '')
        .trim();
}

/**
 * Builds a normalized vertical column roster object for a manager column in D through AI:
 * - Row 1: Manager Name
 * - Rows 2 through 11: 10 Drivers (in exact row order 2..11)
 * - Rows 12 and 13: 2 Selected Race Teams (in exact row order 12..13)
 * - Rows 14 through 16: Optional summary/stat rows
 */
function buildVerticalColumnRoster(
    managerName,
    driversRows2To11,
    teamsRows12To13,
    colIndexOrRange = FANTASY_SCORING_START_COL_INDEX,
    extraRows14To16 = [],
    totalPointsValue = 0,
    enrichedMeta = {}
) {
    const manager = String(managerName ?? '').trim();
    let colIndex = FANTASY_SCORING_START_COL_INDEX;
    let colLetter = 'D';
    let columnRange = 'D1:D16';

    if (typeof colIndexOrRange === 'number') {
        colIndex = colIndexOrRange;
        colLetter = getExcelColumnLetter(colIndex);
        columnRange = `${colLetter}1:${colLetter}16`;
    } else if (typeof colIndexOrRange === 'string') {
        const matchCol = colIndexOrRange.trim().toUpperCase().match(/^([A-Z]+)/);
        if (matchCol) {
            colLetter = matchCol[1];
            colIndex = getColumnIndexFromLetter(colLetter);
            columnRange = colIndexOrRange.includes(':') ? colIndexOrRange.trim().toUpperCase() : `${colLetter}1:${colLetter}16`;
        }
    }

    const rawDriversArray = Array.isArray(driversRows2To11) ? driversRows2To11 : parseListField(driversRows2To11);
    const rawTeamsArray = Array.isArray(teamsRows12To13) ? teamsRows12To13 : parseListField(teamsRows12To13);

    const parseNumericField = (val, fallback = 0) => {
        if (val === undefined || val === null || val === '') return fallback;
        const n = Number(String(val).replace(/,/g, '').trim());
        return Number.isFinite(n) ? n : fallback;
    };

    const driverPointsMap = {};
    const teamPointsMap = {};

    // Preserve exact 10 driver slots for Rows 2 through 11 (indices 0..9)
    const rows2To11WithRowNums = Array.from({ length: 10 }, (_, idx) => {
        const rawEntry = rawDriversArray[idx];
        let driverName = '';
        if (typeof rawEntry === 'object' && rawEntry !== null) {
            driverName = String(rawEntry.name ?? rawEntry.driver ?? rawEntry.Driver ?? '').trim();
            const entryPts = parseNumericField(
                rawEntry.points ?? rawEntry.Points ?? rawEntry.racePoints ?? rawEntry.RacePoints ?? rawEntry.totalPoints ?? rawEntry.TotalPoints ?? rawEntry.score,
                null
            );
            if (driverName && entryPts !== null) {
                driverPointsMap[normalizeName(driverName)] = Math.round(entryPts);
                upsertBackendDriverPointsEntry(driverName, { points: entryPts, racePoints: entryPts });
            }
        } else {
            driverName = String(rawEntry ?? '').trim();
        }
        return {
            rowNumber: idx + 2, // Exact Sheet Row 2 through 11
            slotIndex: idx,
            name: driverName
        };
    });

    // Preserve exact 2 race team slots for Rows 12 and 13 (indices 0..1)
    const rows12To13WithRowNums = Array.from({ length: 2 }, (_, idx) => {
        const rawEntry = rawTeamsArray[idx];
        let teamName = '';
        if (typeof rawEntry === 'object' && rawEntry !== null) {
            teamName = String(rawEntry.name ?? rawEntry.team ?? rawEntry.Team ?? '').trim();
            const entryPts = parseNumericField(
                rawEntry.points ?? rawEntry.Points ?? rawEntry.racePoints ?? rawEntry.RacePoints ?? rawEntry.totalPoints ?? rawEntry.TotalPoints ?? rawEntry.score,
                null
            );
            if (teamName && entryPts !== null) {
                teamPointsMap[normalizeName(teamName)] = Math.round(entryPts);
                upsertBackendTeamPointsEntry(teamName, { points: entryPts, racePoints: entryPts });
            }
        } else {
            teamName = String(rawEntry ?? '').trim();
        }
        return {
            rowNumber: idx + 12, // Exact Sheet Row 12 and 13
            slotIndex: idx,
            name: teamName
        };
    });

    const normalizedDrivers = rows2To11WithRowNums.map(r => r.name);
    const normalizedTeams = rows12To13WithRowNums.map(r => r.name).filter(Boolean);

    // Extract any explicit DriverPoints / TeamPoints arrays or maps on enrichedMeta
    const rawMetaDriverPts = enrichedMeta.DriverPoints ?? enrichedMeta.driverPoints ?? enrichedMeta.DriverScores ?? enrichedMeta.driverScores;
    if (Array.isArray(rawMetaDriverPts)) {
        rawMetaDriverPts.forEach((item, idx) => {
            if (item && typeof item === 'object') {
                const dName = String(item.name ?? item.driver ?? item.Driver ?? normalizedDrivers[idx] ?? '').trim();
                const dPts = parseNumericField(item.points ?? item.Points ?? item.racePoints ?? item.score, null);
                if (dName && dPts !== null) {
                    driverPointsMap[normalizeName(dName)] = Math.round(dPts);
                    upsertBackendDriverPointsEntry(dName, { points: dPts, racePoints: dPts });
                }
            } else {
                const dName = normalizedDrivers[idx];
                const dPts = parseNumericField(item, null);
                if (dName && dPts !== null) {
                    driverPointsMap[normalizeName(dName)] = Math.round(dPts);
                    upsertBackendDriverPointsEntry(dName, { points: dPts, racePoints: dPts });
                }
            }
        });
    } else if (rawMetaDriverPts && typeof rawMetaDriverPts === 'object') {
        Object.entries(rawMetaDriverPts).forEach(([dName, val]) => {
            const dPts = parseNumericField(typeof val === 'object' ? (val?.points ?? val?.racePoints ?? val?.score) : val, null);
            if (dName && dPts !== null) {
                driverPointsMap[normalizeName(dName)] = Math.round(dPts);
                upsertBackendDriverPointsEntry(dName, { points: dPts, racePoints: dPts });
            }
        });
    }

    const rawMetaTeamPts = enrichedMeta.TeamPoints ?? enrichedMeta.teamPoints ?? enrichedMeta.TeamScores ?? enrichedMeta.teamScores;
    if (Array.isArray(rawMetaTeamPts)) {
        rawMetaTeamPts.forEach((item, idx) => {
            if (item && typeof item === 'object') {
                const tName = String(item.name ?? item.team ?? item.Team ?? normalizedTeams[idx] ?? '').trim();
                const tPts = parseNumericField(item.points ?? item.Points ?? item.racePoints ?? item.score, null);
                if (tName && tPts !== null) {
                    teamPointsMap[normalizeName(tName)] = Math.round(tPts);
                    upsertBackendTeamPointsEntry(tName, { points: tPts, racePoints: tPts });
                }
            } else {
                const tName = normalizedTeams[idx];
                const tPts = parseNumericField(item, null);
                if (tName && tPts !== null) {
                    teamPointsMap[normalizeName(tName)] = Math.round(tPts);
                    upsertBackendTeamPointsEntry(tName, { points: tPts, racePoints: tPts });
                }
            }
        });
    } else if (rawMetaTeamPts && typeof rawMetaTeamPts === 'object') {
        Object.entries(rawMetaTeamPts).forEach(([tName, val]) => {
            const tPts = parseNumericField(typeof val === 'object' ? (val?.points ?? val?.racePoints ?? val?.score) : val, null);
            if (tName && tPts !== null) {
                teamPointsMap[normalizeName(tName)] = Math.round(tPts);
                upsertBackendTeamPointsEntry(tName, { points: tPts, racePoints: tPts });
            }
        });
    }

    const numericTotalPoints = parseNumericField(totalPointsValue ?? enrichedMeta.TotalPoints ?? enrichedMeta.totalPoints, 0);
    const incomingTiers = enrichedMeta.tiers && typeof enrichedMeta.tiers === 'object' ? enrichedMeta.tiers : null;

    const fixedTiers = {
        tier1: Array.isArray(incomingTiers?.tier1)
            ? incomingTiers.tier1.map(d => String(d ?? '').trim()).filter(Boolean)
            : (normalizedDrivers[0] ? [normalizedDrivers[0]] : []),
        tier2: Array.isArray(incomingTiers?.tier2)
            ? incomingTiers.tier2.map(d => String(d ?? '').trim()).filter(Boolean)
            : normalizedDrivers.slice(1, 4).filter(Boolean),
        tier3: Array.isArray(incomingTiers?.tier3)
            ? incomingTiers.tier3.map(d => String(d ?? '').trim()).filter(Boolean)
            : normalizedDrivers.slice(4, 8).filter(Boolean),
        tier4: Array.isArray(incomingTiers?.tier4)
            ? incomingTiers.tier4.map(d => String(d ?? '').trim()).filter(Boolean)
            : normalizedDrivers.slice(8, 10).filter(Boolean)
    };

    return {
        Manager: manager,
        ColumnIndex: colIndex,
        ColumnLetter: colLetter,
        ColumnRange: columnRange,
        RaceId: 'Season Roster',
        Drivers: normalizedDrivers,
        tiers: fixedTiers,
        Teams: normalizedTeams,
        DriverPointsMap: driverPointsMap,
        TeamPointsMap: teamPointsMap,
        TotalPoints: numericTotalPoints,
        OverallRank: parseNumericField(enrichedMeta.OverallRank ?? enrichedMeta.overallRank, null),
        GapToLeader: enrichedMeta.GapToLeader ?? enrichedMeta.gapToLeader ?? null,
        Wins: parseNumericField(enrichedMeta.Wins ?? enrichedMeta.wins, 0),
        PriorRank: parseNumericField(enrichedMeta.PriorRank ?? enrichedMeta.priorRank, null),
        PositionChange: parseNumericField(enrichedMeta.PositionChange ?? enrichedMeta.positionChange, 0),
        MovementTrend: String(enrichedMeta.MovementTrend ?? enrichedMeta.movementTrend ?? '').trim(),
        LastRacePoints: parseNumericField(enrichedMeta.LastRacePoints ?? enrichedMeta.lastRacePoints, 0),
        LastRaceRank: parseNumericField(enrichedMeta.LastRaceRank ?? enrichedMeta.lastRaceRank, null),
        LastRaceGap: enrichedMeta.LastRaceGap ?? enrichedMeta.lastRaceGap ?? null,
        LastRaceId: String(enrichedMeta.LastRaceId ?? enrichedMeta.lastRaceId ?? '').trim(),
        LastRaceName: String(enrichedMeta.LastRaceName ?? enrichedMeta.lastRaceName ?? '').trim(),
        LastRaceTrack: String(enrichedMeta.LastRaceTrack ?? enrichedMeta.lastRaceTrack ?? '').trim(),
        RaceScores: enrichedMeta.RaceScores ?? enrichedMeta.raceScores ?? [],
        VerticalRows: {
            row1Manager: { rowNumber: 1, value: manager },
            rows2To11Drivers: rows2To11WithRowNums,
            rows12To13Teams: rows12To13WithRowNums,
            rows14To16Extra: Array.isArray(extraRows14To16) ? extraRows14To16.slice(0, 3) : []
        }
    };
}

/**
 * Iterates across the manager columns in the Fantasy Scoring Table (ranging from Column D through Column AI).
 * For each column, extracts:
 * - Row 1 (index 0): Manager Name
 * - Rows 2 through 11 (indices 1..10): 10 Drivers
 * - Rows 12 and 13 (indices 11..12): 2 Selected Race Teams
 * Returns the parsed manager rosters in exact column order (D -> AI).
 */
function parseVerticalColumnRosters(rawPayload) {
    if (!rawPayload) return [];

    const payload = Array.isArray(rawPayload)
        ? rawPayload
        : (rawPayload.rosters || rawPayload.values || rawPayload.data || rawPayload.columns || rawPayload);

    const reservedHeaders = new Set([
        '', 'manager', 'manager name', 'managers', 'slot', 'slots', 'row', 'rows',
        'tier', 'tiers', 'pos', 'position', 'driver', 'drivers', 'team', 'teams',
        'race team', 'race teams', 'category', 'pick', 'selection', 'selections',
        'stat', 'stats', 'rules', 'notes', 'race id', 'race_id', '__rownum__',
        '5633 freeway insurance 500', 'sum of race points'
    ]);

    const isNonManagerLabel = (str) => {
        const clean = String(str ?? '').trim().toLowerCase();
        if (!clean || reservedHeaders.has(clean)) return true;
        if (clean.includes('incomplete') || clean.includes('sum of race points') || clean === '5633 freeway insurance 500') return true;
        if (/^(empty|unnamed|col_|column\s*\d+|tier\s*\d+|driver\s*\d+|row\s*\d+|\d{4}\s+.+)$/i.test(clean)) return true;
        return false;
    };

    const orderedRosters = [];

    // Case 1: 2D Grid Array from Fantasy Scoring Table
    if (Array.isArray(payload) && payload.length > 0 && Array.isArray(payload[0])) {
        const knownTeamNorms = new Set(cachedTeamsList.map(normalizeName));

        // Subcase 1A: Column-major 2D array (each element is a vertical column array [Row1_Manager, Row2..11_Drivers, Row12..13_Teams])
        const looksColumnMajor = payload.every(col => Array.isArray(col) && col.length >= 13) &&
            payload.some(col => knownTeamNorms.has(normalizeName(col[11])) || knownTeamNorms.has(normalizeName(col[12])));

        const looksRowMajor = payload.length >= 13 &&
            Array.isArray(payload[11]) &&
            payload[11].some(cell => knownTeamNorms.has(normalizeName(cell)));

        if (looksColumnMajor && !looksRowMajor) {
            const maxCols = Math.min(payload.length, FANTASY_SCORING_MANAGER_COLUMNS.length);
            for (let offset = 0; offset < maxCols; offset++) {
                const colValues = payload[offset];
                const sheetColIdx = FANTASY_SCORING_START_COL_INDEX + offset; // D (3) through AI (34)
                const row1Manager = String(colValues[0] ?? '').trim();
                if (isNonManagerLabel(row1Manager)) continue;

                const rows2To11Drivers = colValues.slice(1, 11);
                const rows12To13Teams = colValues.slice(11, 13);
                const rows14To16Extra = colValues.slice(13, 16);

                const rosterObj = buildVerticalColumnRoster(
                    row1Manager,
                    rows2To11Drivers,
                    rows12To13Teams,
                    sheetColIdx,
                    rows14To16Extra
                );
                if (rosterObj.Drivers.length > 0 || rosterObj.Teams.length > 0) {
                    orderedRosters.push(rosterObj);
                }
            }
            return orderedRosters;
        }

        // Subcase 1B: Row-major 2D sheet array (payload[0] = Row 1, payload[1..10] = Rows 2–11, payload[11..12] = Rows 12–13)
        const row1Headers = payload[0] || [];
        const totalColsInGrid = Math.max(...payload.map(r => (Array.isArray(r) ? r.length : 0)));

        // Determine if grid starts at Column A (index 0, so Column D is index 3 and Column AI is index 34)
        // or if grid was fetched starting directly at Column D (D1:AI16, so index 0 is Column D and index 31 is Column AI)
        const startsAtColumnA = totalColsInGrid > FANTASY_SCORING_START_COL_INDEX && (
            isNonManagerLabel(row1Headers[0]) ||
            isNonManagerLabel(row1Headers[1]) ||
            isNonManagerLabel(row1Headers[2]) ||
            totalColsInGrid > (FANTASY_SCORING_END_COL_INDEX - FANTASY_SCORING_START_COL_INDEX + 1)
        );

        const startGridCol = startsAtColumnA ? FANTASY_SCORING_START_COL_INDEX : 0;
        const endGridCol = startsAtColumnA
            ? Math.min(totalColsInGrid - 1, FANTASY_SCORING_END_COL_INDEX)
            : Math.min(totalColsInGrid - 1, FANTASY_SCORING_END_COL_INDEX - FANTASY_SCORING_START_COL_INDEX);

        for (let gridCol = startGridCol; gridCol <= endGridCol; gridCol++) {
            const sheetColIdx = startsAtColumnA ? gridCol : (FANTASY_SCORING_START_COL_INDEX + gridCol);
            if (sheetColIdx < FANTASY_SCORING_START_COL_INDEX || sheetColIdx > FANTASY_SCORING_END_COL_INDEX) continue;

            // Row 1: Manager Name
            const row1Manager = String(row1Headers[gridCol] ?? '').trim();
            if (isNonManagerLabel(row1Manager)) continue;

            // Rows 2 through 11: 10 Drivers
            const rows2To11Drivers = [];
            for (let rowIdx = 1; rowIdx <= 10; rowIdx++) {
                rows2To11Drivers.push(payload[rowIdx]?.[gridCol] ?? '');
            }

            // Rows 12 and 13: 2 Selected Race Teams
            const rows12To13Teams = [
                payload[11]?.[gridCol] ?? '',
                payload[12]?.[gridCol] ?? ''
            ];

            // Optional Rows 14 through 16
            const rows14To16Extra = [
                payload[13]?.[gridCol] ?? '',
                payload[14]?.[gridCol] ?? '',
                payload[15]?.[gridCol] ?? ''
            ];

            const rosterObj = buildVerticalColumnRoster(
                row1Manager,
                rows2To11Drivers,
                rows12To13Teams,
                sheetColIdx,
                rows14To16Extra
            );
            if (rosterObj.Drivers.length > 0 || rosterObj.Teams.length > 0) {
                orderedRosters.push(rosterObj);
            }
        }

        if (orderedRosters.length > 0) {
            return orderedRosters;
        }
    }

    // Case 2: Array of Row Objects or Per-Manager Objects
    if (Array.isArray(payload) && payload.length > 0 && typeof payload[0] === 'object' && payload[0] !== null) {
        const firstEntry = payload[0];
        const hasHorizontalKeys = (
            firstEntry.Drivers !== undefined ||
            firstEntry.drivers !== undefined ||
            firstEntry.Teams !== undefined ||
            firstEntry.teams !== undefined ||
            Array.isArray(firstEntry.rows) ||
            Array.isArray(firstEntry.values) ||
            Array.isArray(firstEntry.column)
        );

        // Subcase 2A: Vertical Row Objects where Row 1 Manager Names are the keys of each row object
        // payload[0..9] = Rows 2 through 11 (10 Drivers), payload[10..11] = Rows 12 and 13 (2 Race Teams)
        if (!hasHorizontalKeys && payload.length >= 10) {
            const allKeys = Object.keys(firstEntry);
            const hasLeadingLabelKeys = allKeys.length > 3 && (
                isNonManagerLabel(allKeys[0]) ||
                isNonManagerLabel(allKeys[1]) ||
                isNonManagerLabel(allKeys[2])
            );

            const managerKeys = hasLeadingLabelKeys
                ? allKeys.slice(FANTASY_SCORING_START_COL_INDEX, FANTASY_SCORING_END_COL_INDEX + 1)
                : allKeys.filter(k => !isNonManagerLabel(k)).slice(0, FANTASY_SCORING_MANAGER_COLUMNS.length);

            managerKeys.forEach((managerKey, offset) => {
                if (isNonManagerLabel(managerKey)) return;
                const sheetColIdx = FANTASY_SCORING_START_COL_INDEX + offset; // D (3) through AI (34)
                const row1Manager = managerKey.trim();
                const rows2To11Drivers = Array.from({ length: 10 }, (_, rIdx) => payload[rIdx]?.[managerKey] ?? '');
                const rows12To13Teams = [
                    payload[10]?.[managerKey] ?? '',
                    payload[11]?.[managerKey] ?? ''
                ];
                const rows14To16Extra = [
                    payload[12]?.[managerKey] ?? '',
                    payload[13]?.[managerKey] ?? '',
                    payload[14]?.[managerKey] ?? ''
                ];

                const rosterObj = buildVerticalColumnRoster(
                    row1Manager,
                    rows2To11Drivers,
                    rows12To13Teams,
                    sheetColIdx,
                    rows14To16Extra
                );
                if (rosterObj.Drivers.length > 0 || rosterObj.Teams.length > 0) {
                    orderedRosters.push(rosterObj);
                }
            });

            if (orderedRosters.length > 0) {
                return orderedRosters;
            }
        }

        // Subcase 2B: Array of enriched manager objects from ?action=getRosters:
        // { Manager, Drivers, tiers, Teams, TotalPoints, OverallRank, GapToLeader, Wins, PriorRank, PositionChange, MovementTrend, LastRacePoints, LastRaceRank, LastRaceGap, LastRaceId, LastRaceName, LastRaceTrack, RaceScores }
        payload.forEach((entry, offset) => {
            if (!entry || typeof entry !== 'object') return;
            const sheetColIdx = FANTASY_SCORING_START_COL_INDEX + offset;
            const entryTotalPoints = entry.TotalPoints ?? entry.totalPoints ?? 0;
            const verticalArray = entry.rows || entry.values || entry.column;
            if (Array.isArray(verticalArray) && verticalArray.length >= 12) {
                const row1Manager = String(entry.Manager || entry.manager || verticalArray[0] || '').trim();
                if (!row1Manager || isNonManagerLabel(row1Manager)) return;
                const rows2To11Drivers = verticalArray.slice(1, 11);
                const rows12To13Teams = verticalArray.slice(11, 13);
                const rows14To16Extra = verticalArray.slice(13, 16);
                const colRange = entry.ColumnRange || entry.columnRange || entry.range || sheetColIdx;
                const built = buildVerticalColumnRoster(row1Manager, rows2To11Drivers, rows12To13Teams, colRange, rows14To16Extra, entryTotalPoints, entry);
                if (built.Drivers.some(Boolean) || built.Teams.length > 0 || built.TotalPoints > 0) {
                    orderedRosters.push(built);
                }
                return;
            }

            const row1Manager = String(entry.Manager ?? entry.manager ?? '').trim();
            if (!row1Manager || isNonManagerLabel(row1Manager)) return;

            let rows2To11Drivers = [];
            if (Array.isArray(entry.Drivers)) {
                rows2To11Drivers = entry.Drivers.slice(0, 10);
            } else if (entry.tiers && typeof entry.tiers === 'object') {
                rows2To11Drivers = [
                    ...(Array.isArray(entry.tiers.tier1) ? entry.tiers.tier1.slice(0, 1) : []),
                    ...(Array.isArray(entry.tiers.tier2) ? entry.tiers.tier2.slice(0, 3) : []),
                    ...(Array.isArray(entry.tiers.tier3) ? entry.tiers.tier3.slice(0, 4) : []),
                    ...(Array.isArray(entry.tiers.tier4) ? entry.tiers.tier4.slice(0, 2) : [])
                ];
            } else {
                rows2To11Drivers = parseListField(entry.Drivers ?? entry.drivers);
            }

            const rows12To13Teams = Array.isArray(entry.Teams)
                ? entry.Teams.slice(0, 2)
                : parseListField(entry.Teams ?? entry.teams);
            const colRange = entry.ColumnRange || entry.columnRange || entry.range || sheetColIdx;
            const built = buildVerticalColumnRoster(row1Manager, rows2To11Drivers, rows12To13Teams, colRange, [], entryTotalPoints, entry);
            if (built.Drivers.some(Boolean) || built.Teams.length > 0 || built.TotalPoints > 0) {
                orderedRosters.push(built);
            }
        });

        if (orderedRosters.length > 0) {
            return orderedRosters;
        }
    }

    // Case 3: Object keyed by column letter / range (D through AI) or manager name
    if (typeof payload === 'object' && !Array.isArray(payload)) {
        // First check if keyed by column letter ('D'..'AI') or range ('D1:D16'..'AI1:AI16')
        FANTASY_SCORING_MANAGER_COLUMNS.forEach((colLetter, offset) => {
            const sheetColIdx = FANTASY_SCORING_START_COL_INDEX + offset;
            const colValues = payload[colLetter] || payload[`${colLetter}1:${colLetter}16`] || payload[`${colLetter}1:${colLetter}13`];
            if (Array.isArray(colValues) && colValues.length >= 12) {
                const row1Manager = String(colValues[0] ?? '').trim();
                if (isNonManagerLabel(row1Manager)) return;
                const rows2To11Drivers = colValues.slice(1, 11);
                const rows12To13Teams = colValues.slice(11, 13);
                const rows14To16Extra = colValues.slice(13, 16);
                const rosterObj = buildVerticalColumnRoster(row1Manager, rows2To11Drivers, rows12To13Teams, sheetColIdx, rows14To16Extra);
                if (rosterObj.Drivers.length > 0 || rosterObj.Teams.length > 0) {
                    orderedRosters.push(rosterObj);
                }
            }
        });

        if (orderedRosters.length > 0) {
            return orderedRosters;
        }

        Object.entries(payload).slice(0, FANTASY_SCORING_MANAGER_COLUMNS.length).forEach(([key, val], offset) => {
            if (!Array.isArray(val) || val.length < 12) return;
            const sheetColIdx = FANTASY_SCORING_START_COL_INDEX + offset;
            const isRangeKey = /^[A-Z]+\d+:[A-Z]+\d+$/i.test(key.trim());
            const row1Manager = isRangeKey ? String(val[0] ?? '').trim() : String(val[0] || key).trim();
            if (isNonManagerLabel(row1Manager)) return;
            const rows2To11Drivers = val.slice(1, 11);
            const rows12To13Teams = val.slice(11, 13);
            const rows14To16Extra = val.slice(13, 16);
            const colRange = isRangeKey ? key.trim().toUpperCase() : sheetColIdx;
            const rosterObj = buildVerticalColumnRoster(row1Manager, rows2To11Drivers, rows12To13Teams, colRange, rows14To16Extra);
            if (rosterObj.Drivers.length > 0 || rosterObj.Teams.length > 0) {
                orderedRosters.push(rosterObj);
            }
        });
    }

    return orderedRosters;
}

/**
 * Reads any locally saved manager rosters from localStorage to preserve user edits across reloads.
 */
function readSavedLocalRosters() {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_ROSTERS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (e) {
        return {};
    }
}

/**
 * Persists manager rosters into localStorage keyed by normalized manager name.
 */
function saveLocalRosters(rostersArray) {
    try {
        if (!Array.isArray(rostersArray)) return;
        const map = readSavedLocalRosters();
        rostersArray.forEach(r => {
            if (r && r.Manager && ((Array.isArray(r.Drivers) && r.Drivers.length > 0) || (Array.isArray(r.Teams) && r.Teams.length > 0))) {
                map[normalizeName(r.Manager)] = {
                    Manager: r.Manager,
                    Drivers: r.Drivers,
                    Teams: r.Teams,
                    ColumnRange: r.ColumnRange
                };
            }
        });
        localStorage.setItem(LOCAL_STORAGE_ROSTERS_KEY, JSON.stringify(map));
    } catch (e) {
        // Ignore storage quota errors
    }
}

/**
 * Loads enriched manager rosters from ${APPS_SCRIPT_URL}?action=getRosters, returning:
 * [{ Manager, Drivers, tiers, Teams, TotalPoints, OverallRank, GapToLeader, Wins, PriorRank, PositionChange, MovementTrend, LastRacePoints, LastRaceRank, LastRaceGap, LastRaceId, LastRaceName, LastRaceTrack, RaceScores }]
 */
async function loadUserRosters(forceRefresh = false) {
    if (!currentAuthUser) return [];
    if (cachedUserRosters && !forceRefresh) return cachedUserRosters;
    if (rosterFetchPromise && !forceRefresh) return rosterFetchPromise;

    rosterFetchPromise = (async () => {
        try {
            const [rostersRes, driverDataRes] = await Promise.allSettled([
                fetch(`${APPS_SCRIPT_URL}?action=getRosters`),
                fetch(`${APPS_SCRIPT_URL}?action=getDriverData`),
                fetchBackendTeamPoints(forceRefresh),
                fetchAllResultsSheetRows()
            ]);

            if (driverDataRes.status === 'fulfilled' && driverDataRes.value.ok) {
                const driverData = await driverDataRes.value.json();
                if (driverData && typeof driverData === 'object') {
                    ingestBackendTeamPointsData(driverData);
                    if (Array.isArray(driverData.drivers) && driverData.drivers.length > 0) {
                        rebuildDriverAndTeamMaps(driverData.drivers, driverData.teams, driverData);
                    } else if (Array.isArray(driverData.teams) && driverData.teams.length > 0) {
                        rebuildDriverAndTeamMaps(cachedDriverDirectory, driverData.teams, driverData);
                    }
                }
            }

            if (rostersRes.status === 'fulfilled' && rostersRes.value.ok) {
                const rawRosters = await rostersRes.value.json();
                if (rawRosters && typeof rawRosters === 'object' && !Array.isArray(rawRosters)) {
                    ingestBackendTeamPointsData(rawRosters);
                }
                const parsedVerticalRosters = parseVerticalColumnRosters(rawRosters);
                parsedVerticalRosters.forEach(r => {
                    const normMgr = normalizeName(r.Manager);
                    if (normMgr) {
                        cachedSheetStandingsMap[normMgr] = {
                            manager: r.Manager,
                            score: Number(r.TotalPoints) || 0,
                            wins: Number(r.Wins) || 0
                        };
                    }
                });
                cachedUserRosters = parsedVerticalRosters;

                // Also pre-fetch the latest completed race's getRaceResults payload so teamResults (AveragePoints) and driverResults are cached
                try {
                    const validMgrs = getValidRosters(parsedVerticalRosters);
                    const { defaultKey } = extractCompletedRacesCatalog(validMgrs);
                    const latestRaceId = String(defaultKey ?? '').trim().match(/^(\d{4})/)?.[1] || String(defaultKey ?? '').trim();
                    if (latestRaceId && !cachedRaceResultsMap.has(latestRaceId)) {
                        const raceRes = await fetch(`${APPS_SCRIPT_URL}?action=getRaceResults&race_id=${encodeURIComponent(latestRaceId)}`);
                        if (raceRes.ok) {
                            const racePayload = await raceRes.json();
                            if (racePayload && typeof racePayload === 'object') {
                                cachedRaceResultsMap.set(latestRaceId, racePayload);
                                if (racePayload.teamResults || racePayload.TeamResults || racePayload.teamPoints || racePayload.TeamPoints || racePayload.teams) {
                                    ingestBackendTeamPointsData(
                                        racePayload.teamResults || racePayload.TeamResults || racePayload.teamPoints || racePayload.TeamPoints || racePayload.teams
                                    );
                                }
                            }
                        }
                    }
                } catch (prefetchErr) {
                    // Non-blocking prefetch
                }

                populateRosterEditorOptions();
                return cachedUserRosters;
            }
        } catch (err) {
            console.warn('Could not load remote rosters/standings:', err.message);
        } finally {
            rosterFetchPromise = null;
        }

        if (!cachedUserRosters) {
            cachedUserRosters = [];
        }
        populateRosterEditorOptions();
        return cachedUserRosters;
    })();

    return rosterFetchPromise;
}

/**
 * Firebase Auth & Admin / Manager Role Helpers
 */
function readSavedUserManagerNamesMap() {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_USER_NAMES_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (e) {
        return {};
    }
}

function saveUserManagerNameForEmail(email, managerName) {
    try {
        const cleanEmail = String(email ?? '').trim().toLowerCase();
        const cleanName = String(managerName ?? '').trim();
        if (!cleanEmail || !cleanName) return;
        const map = readSavedUserManagerNamesMap();
        map[cleanEmail] = cleanName;
        localStorage.setItem(LOCAL_STORAGE_USER_NAMES_KEY, JSON.stringify(map));
    } catch (e) {
        // Ignore storage errors
    }
}

function isCurrentUserAdmin() {
    if (!currentAuthUser || !currentAuthUser.email) return false;
    return String(currentAuthUser.email).trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

function getCurrentUserManagerName() {
    if (!currentAuthUser) return '';
    if (currentAuthUser.displayName && String(currentAuthUser.displayName).trim()) {
        return String(currentAuthUser.displayName).trim();
    }
    const emailKey = String(currentAuthUser.email || '').trim().toLowerCase();
    const savedNames = readSavedUserManagerNamesMap();
    if (emailKey && savedNames[emailKey]) {
        return savedNames[emailKey];
    }
    if (isCurrentUserAdmin()) {
        const bradyMatch = getValidRosters(cachedUserRosters || []).find(r =>
            /brady\s*mckay/i.test(r.Manager) || /^brady$/i.test(r.Manager)
        );
        return bradyMatch ? bradyMatch.Manager : 'Brady McKay';
    }
    const emailPrefix = emailKey.split('@')[0] || '';
    const rosterMatch = getValidRosters(cachedUserRosters || []).find(r =>
        normalizeName(r.Manager) === normalizeName(emailPrefix)
    );
    return rosterMatch ? rosterMatch.Manager : emailPrefix;
}

function canUserEditManagerRoster(targetManagerName) {
    if (isCurrentUserAdmin()) return true;
    if (!currentAuthUser) return false;
    const myManagerName = getCurrentUserManagerName();
    if (!myManagerName || !targetManagerName) return false;
    return normalizeName(myManagerName) === normalizeName(targetManagerName);
}

function formatFirebaseAuthError(error) {
    const rawCode = String(error?.code || '').toLowerCase();
    const rawMessage = String(error?.message || '').toLowerCase();
    const combined = `${rawCode} ${rawMessage}`;

    if (combined.includes('auth/email-already-in-use') || combined.includes('email-already-in-use')) {
        return 'An account with this email already exists';
    }
    if (combined.includes('user-not-found') || combined.includes('invalid-credential') || combined.includes('wrong-password')) {
        return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (combined.includes('weak-password')) {
        return 'Password is too weak. Please choose a password with at least 6 characters.';
    }
    if (combined.includes('invalid-email')) {
        return 'Please enter a valid email address.';
    }
    if (combined.includes('too-many-requests')) {
        return 'Too many failed attempts. Please wait a moment and try again.';
    }
    if (combined.includes('network-request-failed')) {
        return 'Network error while contacting authentication server. Please check your connection.';
    }

    const cleanedMsg = String(error?.message || '')
        .replace(/^Firebase:\s*/i, '')
        .replace(/\s*\(auth\/[^)]+\)\.?\s*/gi, '')
        .trim();
    return cleanedMsg || 'Unable to complete authentication request. Please try again.';
}

function setAuthModalError(message, isSuccess = false) {
    const banners = [
        document.getElementById('authAlert'),
        document.getElementById('auth-error-msg')
    ].filter(Boolean);

    banners.forEach(banner => {
        banner.classList.toggle('auth-alert-success', Boolean(isSuccess));
        if (!message) {
            banner.textContent = '';
            banner.classList.add('hidden');
        } else {
            banner.textContent = message;
            banner.classList.remove('hidden');
        }
    });
}

function switchAuthTab(tabName) {
    const isSignup = String(tabName).toLowerCase() === 'signup';
    const loginBtn = document.getElementById('auth-tab-btn-login');
    const signupBtn = document.getElementById('auth-tab-btn-signup');
    const loginForm = document.getElementById('auth-login-form');
    const signupForm = document.getElementById('auth-signup-form');

    setAuthModalError('');

    if (loginBtn) {
        loginBtn.classList.toggle('active', !isSignup);
        loginBtn.setAttribute('aria-selected', !isSignup ? 'true' : 'false');
    }
    if (signupBtn) {
        signupBtn.classList.toggle('active', isSignup);
        signupBtn.setAttribute('aria-selected', isSignup ? 'true' : 'false');
    }
    if (loginForm) loginForm.classList.toggle('hidden', isSignup);
    if (signupForm) signupForm.classList.toggle('hidden', !isSignup);
}

function openAuthModal(defaultTab = 'login') {
    switchAuthTab(defaultTab);
    const authGate = document.getElementById('authGate');
    if (authGate && !currentAuthUser) {
        authGate.style.display = 'flex';
        return;
    }
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeAuthModal() {
    setAuthModalError('');
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function handleAuthModalBackdropClick(event) {
    if (event && event.target && event.target.id === 'authModal') {
        closeAuthModal();
    }
}

async function handleForgotPassword(event) {
    if (event) event.preventDefault();
    if (!auth) {
        setAuthModalError('Firebase Authentication SDK is not initialized.');
        return;
    }

    const emailInput = document.getElementById('auth-login-email');
    const email = String(emailInput?.value || '').trim();
    if (!email) {
        setAuthModalError('Please enter your email address in the Email field above to receive a password reset link.');
        if (emailInput) emailInput.focus();
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        setAuthModalError(`Password reset link sent to ${email}. Check your inbox.`, true);
    } catch (err) {
        setAuthModalError(formatFirebaseAuthError(err));
    }
}

window.handleForgotPassword = handleForgotPassword;

async function handleAuthLoginSubmit(event) {
    event.preventDefault();
    if (!auth) {
        setAuthModalError('Firebase Authentication SDK is not initialized.');
        return;
    }

    const emailInput = document.getElementById('auth-login-email');
    const passwordInput = document.getElementById('auth-login-password');
    const submitBtn = document.getElementById('auth-login-submit-btn');

    const email = String(emailInput?.value || '').trim();
    const password = String(passwordInput?.value || '');

    setAuthModalError('');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing In...';
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        if (passwordInput) passwordInput.value = '';
        closeAuthModal();
    } catch (err) {
        setAuthModalError(formatFirebaseAuthError(err));
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Log In';
        }
    }
}

async function handleAuthSignupSubmit(event) {
    event.preventDefault();
    if (!auth) {
        setAuthModalError('Firebase Authentication SDK is not initialized.');
        return;
    }

    const managerInput = document.getElementById('auth-signup-manager');
    const emailInput = document.getElementById('auth-signup-email');
    const passwordInput = document.getElementById('auth-signup-password');
    const confirmPasswordInput = document.getElementById('auth-signup-confirm-password');
    const submitBtn = document.getElementById('auth-signup-submit-btn');

    const managerName = String(managerInput?.value || '').trim();
    const email = String(emailInput?.value || '').trim();
    const password = String(passwordInput?.value || '');
    const confirmPassword = confirmPasswordInput ? String(confirmPasswordInput.value || '') : password;

    if (!managerName) {
        setAuthModalError('Please enter your Manager / Team Name.');
        return;
    }

    if (confirmPasswordInput && password !== confirmPassword) {
        setAuthModalError('Passwords do not match. Please confirm your password.');
        return;
    }

    setAuthModalError('');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Team...';
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        saveUserManagerNameForEmail(email, managerName);
        if (userCredential && userCredential.user && typeof userCredential.user.updateProfile === 'function') {
            await userCredential.user.updateProfile({ displayName: managerName });
        }
        currentAuthUser = auth.currentUser || userCredential.user;
        if (passwordInput) passwordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
        closeAuthModal();
        updateAuthUI();
    } catch (err) {
        setAuthModalError(formatFirebaseAuthError(err));
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Team & Enter';
        }
    }
}

/**
 * Clears loaded league rosters, manager names, and standings data from memory and the DOM
 * so unauthenticated visitors cannot inspect them after logging out.
 */
function clearProtectedDashboardDOM() {
    cachedUserRosters = null;
    cachedSeasonSchedule = null;
    cachedResultsSheetRows = null;
    cachedRaceResultsMap.clear();
    cachedBackendTeamPointsMap.clear();
    cachedBackendDriverPointsMap.clear();
    Object.keys(cachedSheetStandingsMap).forEach(k => delete cachedSheetStandingsMap[k]);

    const teamRostersContainer = document.getElementById('team-rosters-container');
    if (teamRostersContainer) teamRostersContainer.innerHTML = '';

    const tableClearedConfigs = [
        ['rosters-table-body', 13],
        ['fantasy-standings-body', 9],
        ['last-race-standings-body', 6],
        ['live-race-standings-body', 6],
        ['live-projected-standings-body', 7],
        ['season-schedule-body', 7],
        ['leaderboard-body', 10],
        ['series-live-standings-body', 11]
    ];

    tableClearedConfigs.forEach(([id, cols]) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `<tr><td colspan="${cols}" class="empty-state">Sign in to view league data.</td></tr>`;
        }
    });

    closeRaceResultsViewer();
}

async function handleAuthLogout() {
    stopLiveTelemetryPollingLoop();
    currentAuthUser = null;
    clearProtectedDashboardDOM();

    const mainDashboard = document.getElementById('mainDashboard');
    const authGate = document.getElementById('authGate');
    if (mainDashboard) mainDashboard.style.display = 'none';
    if (authGate) authGate.style.display = 'flex';

    updateAuthUI();

    if (!auth) return;
    try {
        await auth.signOut();
    } catch (err) {
        console.warn('Sign out error:', err.message);
    }
}

/**
 * Updates the Auth Gate vs. Main Dashboard visibility, top-right header Auth controls,
 * Admin Control Bar, and Roster Form role locks.
 */
function updateAuthUI() {
    const mainDashboard = document.getElementById('mainDashboard');
    const authGate = document.getElementById('authGate');
    const signInBtn = document.getElementById('header-signin-btn');
    const userInfoEl = document.getElementById('header-user-info');
    const adminBadgeEl = document.getElementById('header-admin-badge');
    const userLabelEl = document.getElementById('header-user-label');
    const adminControlBar = document.getElementById('admin-control-bar');
    const toggleRosterBtn = document.getElementById('toggle-roster-editor-btn');

    const isAdmin = isCurrentUserAdmin();

    if (!currentAuthUser) {
        if (mainDashboard) mainDashboard.style.display = 'none';
        if (authGate) authGate.style.display = 'flex';
        if (signInBtn) signInBtn.classList.remove('hidden');
        if (userInfoEl) userInfoEl.classList.add('hidden');
        if (adminBadgeEl) adminBadgeEl.classList.add('hidden');
        if (userLabelEl) userLabelEl.textContent = '';
        if (adminControlBar) adminControlBar.classList.add('hidden');
        if (toggleRosterBtn) toggleRosterBtn.textContent = 'Sign In to Submit Roster';
        syncRosterEditorRoleUI();
        return;
    }

    if (authGate) authGate.style.display = 'none';
    if (mainDashboard) mainDashboard.style.display = 'block';

    if (signInBtn) signInBtn.classList.add('hidden');
    if (userInfoEl) userInfoEl.classList.remove('hidden');
    if (adminBadgeEl) adminBadgeEl.classList.toggle('hidden', !isAdmin);

    const mgrName = getCurrentUserManagerName();
    if (userLabelEl) {
        userLabelEl.textContent = isAdmin
            ? currentAuthUser.email
            : (mgrName && mgrName.toLowerCase() !== String(currentAuthUser.email).toLowerCase()
                ? `${mgrName} (${currentAuthUser.email})`
                : currentAuthUser.email);
    }

    if (adminControlBar) {
        adminControlBar.classList.toggle('hidden', !isAdmin);
    }
    if (toggleRosterBtn) {
        toggleRosterBtn.textContent = isAdmin ? 'Admin: Submit / Edit Any Roster' : 'Submit / Edit My Roster';
    }

    syncRosterEditorRoleUI();
    populateAdminControlBarDropdowns();
    updateTeamRostersTab(latestRaceData, latestStageData, latestPointsData);
}

/**
 * Synchronizes the Roster Editor form inputs based on whether the user is Admin vs. Standard Manager.
 */
function syncRosterEditorRoleUI() {
    const managerInput = document.getElementById('manager-name');
    const managerLabel = document.getElementById('manager-name-label');
    const existingManagerSelect = document.getElementById('existing-manager-select');
    const roleBanner = document.getElementById('roster-role-banner');

    const isAdmin = isCurrentUserAdmin();

    if (isAdmin) {
        if (managerInput) {
            managerInput.readOnly = false;
            managerInput.style.backgroundColor = '';
        }
        if (existingManagerSelect) {
            existingManagerSelect.classList.remove('hidden');
        }
        if (managerLabel) {
            managerLabel.textContent = 'Admin Mode — Manager Name (Select Any Manager or Type New)';
        }
        if (roleBanner) {
            roleBanner.textContent = 'Admin Mode Unlocked: You can load, edit, and submit roster picks on behalf of any manager in the league.';
        }
    } else if (currentAuthUser) {
        const myManagerName = getCurrentUserManagerName();
        if (managerInput) {
            managerInput.value = myManagerName;
            managerInput.readOnly = true;
            managerInput.style.backgroundColor = '#f3f4f6';
        }
        if (existingManagerSelect) {
            existingManagerSelect.classList.add('hidden');
        }
        if (managerLabel) {
            managerLabel.textContent = 'Your Manager / Team Name (Locked to Your Account)';
        }
        if (roleBanner) {
            roleBanner.textContent = `Logged in as ${myManagerName}: Select your 10 drivers across Tiers 1–4 and 2 unique Race Teams, then click Submit Roster.`;
        }
    } else {
        if (managerInput) {
            managerInput.readOnly = false;
            managerInput.style.backgroundColor = '';
        }
        if (existingManagerSelect) {
            existingManagerSelect.classList.add('hidden');
        }
        if (managerLabel) {
            managerLabel.textContent = 'Manager Name (Sign In Required to Submit)';
        }
    }
}

/**
 * Populates the Admin Control Bar dropdowns (#admin-manager-select, #admin-override-manager, #admin-override-race).
 */
function populateAdminControlBarDropdowns() {
    if (!isCurrentUserAdmin()) return;

    const adminMgrSelect = document.getElementById('admin-manager-select');
    const overrideMgrSelect = document.getElementById('admin-override-manager');
    const overrideRaceSelect = document.getElementById('admin-override-race');

    const validManagers = getValidRosters(cachedUserRosters || []);

    if (adminMgrSelect) {
        const prev = adminMgrSelect.value;
        adminMgrSelect.innerHTML = '<option value="">-- Select Manager to Load & Edit Lineup --</option>' +
            validManagers.map(r => `<option value="${r.Manager}">${r.Manager}</option>`).join('');
        if (prev && validManagers.some(r => r.Manager === prev)) {
            adminMgrSelect.value = prev;
        }
    }

    if (overrideMgrSelect) {
        const prev = overrideMgrSelect.value;
        overrideMgrSelect.innerHTML = '<option value="">-- Select Manager --</option>' +
            validManagers.map(r => `<option value="${r.Manager}">${r.Manager}</option>`).join('');
        if (prev && validManagers.some(r => r.Manager === prev)) {
            overrideMgrSelect.value = prev;
        }
    }

    if (overrideRaceSelect) {
        const prev = overrideRaceSelect.value;
        const scheduleList = Array.isArray(cachedSeasonSchedule) && cachedSeasonSchedule.length > 0
            ? cachedSeasonSchedule
            : deriveSeasonScheduleFromRosters(validManagers);

        if (scheduleList.length > 0) {
            overrideRaceSelect.innerHTML = '<option value="">-- Select Race --</option>' +
                scheduleList.map(rc => {
                    const rId = String(rc.raceId || rc.raceNumber || '').trim();
                    const statusSuffix = rc.isCompleted ? '✓' : '○';
                    return `<option value="${rId}">${statusSuffix} #${rc.raceNumber}: ${rId} ${rc.raceName}</option>`;
                }).join('');
            if (prev && Array.from(overrideRaceSelect.options).some(o => o.value === prev)) {
                overrideRaceSelect.value = prev;
            }
        }
    }
}

function handleAdminManagerSelect(managerName) {
    const clean = String(managerName ?? '').trim();
    if (!clean) return;
    loadManagerIntoForm(clean, { bypassAuthCheck: true });
}

function handleAdminLoadSelectedManager() {
    const adminMgrSelect = document.getElementById('admin-manager-select');
    const selected = String(adminMgrSelect?.value || '').trim();
    const statusEl = document.getElementById('admin-control-status');
    if (!selected) {
        if (statusEl) {
            statusEl.style.color = '#f87171';
            statusEl.textContent = 'Please choose a manager from the dropdown first.';
        }
        return;
    }
    loadManagerIntoForm(selected, { bypassAuthCheck: true });
    if (statusEl) {
        statusEl.style.color = '#4ade80';
        statusEl.textContent = `Loaded ${selected}'s lineup into the editor below. You can now edit and save on their behalf.`;
    }
}

async function handleForceStandingsRecalc() {
    if (!isCurrentUserAdmin()) return;
    const btn = document.getElementById('admin-force-recalc-btn');
    const statusEl = document.getElementById('admin-control-status');

    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Recalculating Standings...';
    }
    if (statusEl) {
        statusEl.style.color = '#fbbf24';
        statusEl.textContent = 'Triggering backend standings recalculation and refreshing all league data...';
    }

    try {
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'recalculateStandings',
                userEmail: currentAuthUser?.email || ADMIN_EMAIL,
                isAdmin: true
            })
        }).catch(() => null);

        cachedRaceResultsMap.clear();
        cachedSeasonSchedule = null;
        await loadUserRosters(true);
        await loadSeasonSchedule(true);
        await fetchLiveTelemetry();
        await updateSeasonScheduleTable(true);

        if (statusEl) {
            statusEl.style.color = '#4ade80';
            statusEl.textContent = '✓ Standings recalculation complete and all dashboard tables refreshed!';
        }
    } catch (err) {
        if (statusEl) {
            statusEl.style.color = '#f87171';
            statusEl.textContent = `Recalculation warning: ${err.message}`;
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '⚡ Force Standings Recalculation';
        }
    }
}

async function handleAdminScoreOverride() {
    if (!isCurrentUserAdmin()) return;

    const mgrSelect = document.getElementById('admin-override-manager');
    const raceSelect = document.getElementById('admin-override-race');
    const ptsInput = document.getElementById('admin-override-points');
    const submitBtn = document.getElementById('admin-override-submit-btn');
    const statusEl = document.getElementById('admin-control-status');

    const targetManager = String(mgrSelect?.value || '').trim();
    const targetRaceId = String(raceSelect?.value || '').trim();
    const rawPts = ptsInput?.value;

    if (!targetManager) {
        if (statusEl) {
            statusEl.style.color = '#f87171';
            statusEl.textContent = 'Please select a Manager for the score override.';
        }
        return;
    }
    if (!targetRaceId) {
        if (statusEl) {
            statusEl.style.color = '#f87171';
            statusEl.textContent = 'Please select a Race for the score override.';
        }
        return;
    }
    if (rawPts === undefined || rawPts === null || String(rawPts).trim() === '' || !Number.isFinite(Number(rawPts))) {
        if (statusEl) {
            statusEl.style.color = '#f87171';
            statusEl.textContent = 'Please enter a valid numeric score to override.';
        }
        return;
    }

    const overridePoints = Math.round(Number(rawPts));

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Applying...';
    }

    // Apply immediately to local cachedUserRosters so UI updates right away
    if (Array.isArray(cachedUserRosters)) {
        const rosterObj = cachedUserRosters.find(r => normalizeName(r.Manager) === normalizeName(targetManager));
        if (rosterObj) {
            if (!Array.isArray(rosterObj.RaceScores)) {
                rosterObj.RaceScores = [];
            }
            const existingRaceEntry = rosterObj.RaceScores.find(rs =>
                rs && (String(rs.raceId ?? rs.RaceId ?? '').trim() === targetRaceId || String(rs.raceName ?? '').trim() === targetRaceId)
            );
            const oldPts = existingRaceEntry ? (Number(existingRaceEntry.points ?? existingRaceEntry.Points ?? 0) || 0) : 0;
            if (existingRaceEntry) {
                existingRaceEntry.points = overridePoints;
                existingRaceEntry.Points = overridePoints;
            } else {
                rosterObj.RaceScores.push({
                    raceId: targetRaceId,
                    raceName: `Race ${targetRaceId}`,
                    points: overridePoints
                });
            }
            if (String(rosterObj.LastRaceId ?? '').trim() === targetRaceId) {
                rosterObj.LastRacePoints = overridePoints;
            }
            rosterObj.TotalPoints = Math.max(0, (Number(rosterObj.TotalPoints) || 0) - oldPts + overridePoints);
        }
    }

    cachedSeasonSchedule = deriveSeasonScheduleFromRosters(getValidRosters(cachedUserRosters || []));
    await updateLiveRaceStandingsTable(latestRaceData, latestStageData, latestPointsData);
    await updateFantasyStandingsTable(latestRaceData, latestStageData, latestPointsData);
    await updateTeamRostersTab(latestRaceData, latestStageData, latestPointsData);
    await updateSeasonScheduleTable();

    try {
        const res = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'overrideScore',
                userEmail: currentAuthUser?.email || ADMIN_EMAIL,
                isAdmin: true,
                managerName: targetManager,
                raceId: targetRaceId,
                points: overridePoints
            })
        });
        const data = await res.json().catch(() => ({}));
        if (statusEl) {
            statusEl.style.color = '#4ade80';
            statusEl.textContent = data?.message || `✓ Score override applied: ${targetManager} set to ${overridePoints} pts for Race ${targetRaceId}.`;
        }
    } catch (err) {
        if (statusEl) {
            statusEl.style.color = '#4ade80';
            statusEl.textContent = `✓ Score override applied in dashboard (${targetManager} → ${overridePoints} pts for Race ${targetRaceId}).`;
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Apply Override';
        }
    }
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleAuthModalBackdropClick = handleAuthModalBackdropClick;
window.switchAuthTab = switchAuthTab;
window.handleAuthLoginSubmit = handleAuthLoginSubmit;
window.handleAuthSignupSubmit = handleAuthSignupSubmit;
window.handleAuthLogout = handleAuthLogout;
window.handleAdminManagerSelect = handleAdminManagerSelect;
window.handleAdminLoadSelectedManager = handleAdminLoadSelectedManager;
window.handleForceStandingsRecalc = handleForceStandingsRecalc;
window.handleAdminScoreOverride = handleAdminScoreOverride;

/**
 * Populates the Submit / Edit Roster form dropdowns with drivers constrained by previous year's standings tiers:
 * - Tier 1: Pos 1–4 (Select 1 Driver)
 * - Tier 2: Pos 5–16 (Select 3 Drivers)
 * - Tier 3: Pos 17–30 (Select 4 Drivers)
 * - Tier 4: Pos 31+ (Select 2 Drivers)
 * - Race Teams: Select 2 Unique Teams
 */
function populateRosterEditorOptions() {
    const form = document.getElementById('roster-form');
    if (!form) return;

    const formatDriverOption = (d) =>
        `<option value="${d.name}" data-team="${d.team}" data-pos="${d.pos}">#${d.pos} ${d.name} (${d.team})</option>`;

    const tier1Drivers = cachedDriverDirectory.filter(d => d.pos >= 1 && d.pos <= 4);
    const tier2Drivers = cachedDriverDirectory.filter(d => d.pos >= 5 && d.pos <= 16);
    const tier3Drivers = cachedDriverDirectory.filter(d => d.pos >= 17 && d.pos <= 30);
    const tier4Drivers = cachedDriverDirectory.filter(d => d.pos >= 31);

    const tier1Html = '<option value="">-- Select Tier 1 Driver (Pos 1–4) --</option>' + tier1Drivers.map(formatDriverOption).join('');
    const tier2Html = '<option value="">-- Select Tier 2 Driver (Pos 5–16) --</option>' + tier2Drivers.map(formatDriverOption).join('');
    const tier3Html = '<option value="">-- Select Tier 3 Driver (Pos 17–30) --</option>' + tier3Drivers.map(formatDriverOption).join('');
    const tier4Html = '<option value="">-- Select Tier 4 Driver (Pos 31+) --</option>' + tier4Drivers.map(formatDriverOption).join('');
    const teamsHtml = '<option value="">-- Select Race Team --</option>' + cachedTeamsList.map(t => `<option value="${t}">${t}</option>`).join('');

    const saveAndPopulate = (selector, html) => {
        document.querySelectorAll(selector).forEach(select => {
            const currentVal = select.value;
            select.innerHTML = html;
            if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
                select.value = currentVal;
            }
        });
    };

    saveAndPopulate('.tier-1', tier1Html);
    saveAndPopulate('.tier-2', tier2Html);
    saveAndPopulate('.tier-3', tier3Html);
    saveAndPopulate('.tier-4', tier4Html);
    saveAndPopulate('.team-select', teamsHtml);

    const existingManagerSelect = document.getElementById('existing-manager-select');
    if (existingManagerSelect && Array.isArray(cachedUserRosters)) {
        const currentSelectedManager = existingManagerSelect.value;
        const validManagers = getValidRosters(cachedUserRosters);
        existingManagerSelect.innerHTML = '<option value="">-- Load Existing Manager Roster --</option>' +
            validManagers.map(r => `<option value="${r.Manager}">${r.Manager}</option>`).join('');
        if (currentSelectedManager) {
            existingManagerSelect.value = currentSelectedManager;
        }
    }

    syncRosterEditorRoleUI();
    populateAdminControlBarDropdowns();
    handleRosterDropdownUpdates();

    if (!isRosterFormInitialized) {
        isRosterFormInitialized = true;
        document.querySelectorAll('.driver-select, .team-select').forEach(select => {
            select.addEventListener('change', handleRosterDropdownUpdates);
        });
        form.addEventListener('submit', handleRosterFormSubmit);
    }
}

/**
 * Enforces live cross-validation in the Submit / Edit Roster form:
 * 1. Prevents selecting the same driver twice within a tier.
 * 2. Prevents selecting a driver whose race team is selected in the 2 Race Team slots.
 * 3. Prevents selecting the same Race Team twice or selecting a Race Team that already has a drafted driver.
 * 4. Updates combined previous year's Wins, Top 5s, Top 10s, and Poles preview.
 */
function handleRosterDropdownUpdates() {
    const driverSelects = Array.from(document.querySelectorAll('#roster-form .driver-select'));
    const teamSelects = Array.from(document.querySelectorAll('#roster-form .team-select'));
    if (driverSelects.length === 0 && teamSelects.length === 0) return;

    const selectedDriverOptions = driverSelects
        .map(s => s.options[s.selectedIndex])
        .filter(opt => opt && opt.value !== '');
    const selectedDriverNames = selectedDriverOptions.map(opt => opt.value);
    const selectedDriverTeams = selectedDriverOptions.map(opt => opt.dataset.team).filter(Boolean);
    const selectedTeams = teamSelects.map(s => s.value).filter(Boolean);

    driverSelects.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value === '') return;
            const isSelectedElsewhere = selectedDriverNames.includes(option.value) && select.value !== option.value;
            const isTeamSelected = selectedTeams.includes(option.dataset.team);
            option.disabled = isSelectedElsewhere || isTeamSelected;
        });
    });

    teamSelects.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value === '') return;
            const isSelectedElsewhere = selectedTeams.includes(option.value) && select.value !== option.value;
            const hasDriverFromTeam = selectedDriverTeams.includes(option.value);
            option.disabled = isSelectedElsewhere || hasDriverFromTeam;
        });
    });

    let totalWins = 0, totalTop5 = 0, totalTop10 = 0, totalPoles = 0;

    selectedDriverNames.forEach(driverName => {
        const stats = driverStatsMap[driverName];
        if (stats) {
            totalWins += stats.wins;
            totalTop5 += stats.top5;
            totalTop10 += stats.top10;
            totalPoles += stats.poles;
        }
    });

    selectedTeams.forEach(teamName => {
        const stats = teamStatsMap[teamName];
        if (stats) {
            totalWins += stats.wins;
            totalTop5 += stats.top5;
            totalTop10 += stats.top10;
            totalPoles += stats.poles;
        }
    });

    const winsEl = document.getElementById('stat-wins');
    const top5El = document.getElementById('stat-top5');
    const top10El = document.getElementById('stat-top10');
    const polesEl = document.getElementById('stat-poles');
    if (winsEl) winsEl.textContent = totalWins;
    if (top5El) top5El.textContent = totalTop5;
    if (top10El) top10El.textContent = totalTop10;
    if (polesEl) polesEl.textContent = totalPoles;
}

/**
 * Validates a roster submission against all established league rules.
 */
function validateRosterSubmission(managerName, tierSelections, selectedTeams) {
    if (!managerName || !managerName.trim()) {
        return { valid: false, message: 'Please enter a Manager Name.' };
    }

    const { tier1, tier2, tier3, tier4 } = tierSelections;

    if (tier1.length !== 1 || !tier1[0].value) {
        return { valid: false, message: 'Tier 1 (Pos 1–4) requires selecting 1 driver.' };
    }
    if (tier2.length !== 3 || tier2.some(o => !o.value)) {
        return { valid: false, message: 'Tier 2 (Pos 5–16) requires selecting 3 drivers.' };
    }
    if (tier3.length !== 4 || tier3.some(o => !o.value)) {
        return { valid: false, message: 'Tier 3 (Pos 17–30) requires selecting 4 drivers.' };
    }
    if (tier4.length !== 2 || tier4.some(o => !o.value)) {
        return { valid: false, message: 'Tier 4 (Pos 31+) requires selecting 2 drivers.' };
    }

    const checkPosBounds = (options, minPos, maxPos, tierLabel) => {
        for (const opt of options) {
            const pos = Number(opt.dataset.pos) || cachedDriverPosMap[normalizeName(opt.value)];
            if (pos && (pos < minPos || pos > maxPos)) {
                return `${opt.value} (Pos #${pos}) is not eligible for ${tierLabel} (Pos ${minPos}–${maxPos === Infinity ? '31+' : maxPos}).`;
            }
        }
        return null;
    };

    const t1Err = checkPosBounds(tier1, 1, 4, 'Tier 1');
    if (t1Err) return { valid: false, message: t1Err };
    const t2Err = checkPosBounds(tier2, 5, 16, 'Tier 2');
    if (t2Err) return { valid: false, message: t2Err };
    const t3Err = checkPosBounds(tier3, 17, 30, 'Tier 3');
    if (t3Err) return { valid: false, message: t3Err };
    const t4Err = checkPosBounds(tier4, 31, Infinity, 'Tier 4');
    if (t4Err) return { valid: false, message: t4Err };

    const allDrivers = [...tier1, ...tier2, ...tier3, ...tier4];
    const uniqueDriverNames = new Set(allDrivers.map(o => o.value));
    if (uniqueDriverNames.size !== 10) {
        return { valid: false, message: 'Rule Violation: All 10 drafted drivers must be unique.' };
    }

    const validTeams = selectedTeams.filter(Boolean);
    if (validTeams.length !== 2) {
        return { valid: false, message: 'Please select 2 Race Teams.' };
    }
    if (validTeams[0] === validTeams[1]) {
        return { valid: false, message: 'Rule Violation: You must select 2 unique Race Teams.' };
    }

    for (const driverOpt of allDrivers) {
        const driverTeam = driverOpt.dataset.team || cachedDriverTeamMap[normalizeName(driverOpt.value)];
        if (driverTeam && validTeams.includes(driverTeam)) {
            return {
                valid: false,
                message: `Rule Violation: You cannot select ${driverOpt.value} (${driverTeam}) AND draft ${driverTeam} as a Race Team.`
            };
        }
    }

    return { valid: true };
}

/**
 * Handles saving & submitting a new or edited roster.
 * Sends POST to APPS_SCRIPT_URL with { action: "saveRoster", userEmail: user.email, managerName: ..., picks: ... }.
 */
async function handleRosterFormSubmit(e) {
    e.preventDefault();

    if (!currentAuthUser) {
        openAuthModal('login');
        setAuthModalError('Please sign in or create an account to submit your roster.');
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    const statusDiv = document.getElementById('form-status');
    const managerInput = document.getElementById('manager-name');
    const isAdmin = isCurrentUserAdmin();
    const myManagerName = getCurrentUserManagerName();
    const managerName = isAdmin
        ? (managerInput?.value || myManagerName || '').trim()
        : (myManagerName || managerInput?.value || '').trim();

    if (!isAdmin && !canUserEditManagerRoster(managerName)) {
        if (statusDiv) {
            statusDiv.style.color = '#dc2626';
            statusDiv.textContent = 'Standard managers can only submit picks for their own team.';
        }
        return;
    }

    const getSelectedOptions = (selector) =>
        Array.from(document.querySelectorAll(`#roster-form ${selector}`)).map(s => s.options[s.selectedIndex] || { value: '' });

    const tierSelections = {
        tier1: getSelectedOptions('.tier-1'),
        tier2: getSelectedOptions('.tier-2'),
        tier3: getSelectedOptions('.tier-3'),
        tier4: getSelectedOptions('.tier-4')
    };

    const selectedTeams = Array.from(document.querySelectorAll('#roster-form .team-select')).map(s => s.value);

    if (statusDiv) statusDiv.textContent = '';

    const validation = validateRosterSubmission(managerName, tierSelections, selectedTeams);
    if (!validation.valid) {
        if (statusDiv) {
            statusDiv.style.color = '#dc2626';
            statusDiv.textContent = validation.message;
        }
        return;
    }

    const orderedDrivers = [
        ...tierSelections.tier1,
        ...tierSelections.tier2,
        ...tierSelections.tier3,
        ...tierSelections.tier4
    ].map(opt => opt.value);

    if (submitBtn) {
        submitBtn.textContent = 'Saving Roster...';
        submitBtn.disabled = true;
    }

    if (!Array.isArray(cachedUserRosters)) {
        cachedUserRosters = DEFAULT_USER_ROSTERS.map((r, idx) =>
            buildVerticalColumnRoster(r.Manager, r.Drivers, r.Teams, 3 + idx)
        );
    }

    const existingIdx = cachedUserRosters.findIndex(r => r.Manager.toLowerCase() === managerName.toLowerCase());
    const targetColIndexOrRange = existingIdx >= 0
        ? (cachedUserRosters[existingIdx].ColumnRange || (3 + existingIdx))
        : (3 + cachedUserRosters.length);
    const updatedRosterEntry = buildVerticalColumnRoster(managerName, orderedDrivers, selectedTeams, targetColIndexOrRange);

    if (existingIdx >= 0) {
        cachedUserRosters[existingIdx] = {
            ...cachedUserRosters[existingIdx],
            ...updatedRosterEntry,
            TotalPoints: cachedUserRosters[existingIdx].TotalPoints ?? updatedRosterEntry.TotalPoints
        };
    } else {
        cachedUserRosters.push(updatedRosterEntry);
    }

    saveLocalRosters(cachedUserRosters);
    populateRosterEditorOptions();
    updateSeriesLiveStandingsTable(latestPointsData, latestRaceData);
    await updateLiveRaceStandingsTable(latestRaceData, latestStageData, latestPointsData);
    await updateFantasyStandingsTable(latestRaceData, latestStageData, latestPointsData);
    await updateTeamRostersTab(latestRaceData, latestStageData, latestPointsData);

    const picksObject = {
        tier1: tierSelections.tier1.map(o => o.value),
        tier2: tierSelections.tier2.map(o => o.value),
        tier3: tierSelections.tier3.map(o => o.value),
        tier4: tierSelections.tier4.map(o => o.value),
        drivers: orderedDrivers,
        teams: selectedTeams
    };

    const payload = {
        action: 'saveRoster',
        userEmail: currentAuthUser.email || '',
        managerName: managerName,
        isAdmin: isAdmin,
        picks: picksObject,
        manager: managerName,
        raceId: 'Season Roster',
        columnRange: updatedRosterEntry.ColumnRange,
        drivers: orderedDrivers.join(', '),
        teams: selectedTeams.join(', '),
        verticalColumn: [managerName, ...orderedDrivers, ...selectedTeams]
    };

    try {
        const response = await fetch(APPS_SCRIPT_API_POST_URL(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.status === 'success' || response.ok) {
            if (statusDiv) {
                statusDiv.style.color = '#16a34a';
                statusDiv.textContent = `Roster for ${managerName} saved and synced to league sheet!`;
            }
        } else {
            throw new Error(result.message || 'Remote sync warning');
        }
    } catch (error) {
        console.warn('Roster saved locally; remote Google Sheet sync returned:', error.message);
        if (statusDiv) {
            statusDiv.style.color = '#16a34a';
            statusDiv.textContent = `Roster for ${managerName} updated in live dashboard!`;
        }
    } finally {
        if (submitBtn) {
            submitBtn.textContent = 'Submit Roster';
            submitBtn.disabled = false;
        }
    }
}

function APPS_SCRIPT_API_POST_URL() {
    return APPS_SCRIPT_URL;
}

/**
 * Toggles visibility of the Submit / Edit Roster builder panel.
 */
function toggleRosterEditor(forceOpen) {
    const panel = document.getElementById('roster-editor-panel');
    if (!panel) return;

    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.classList.contains('hidden');
    if (shouldOpen) {
        if (!currentAuthUser) {
            openAuthModal('login');
            setAuthModalError('Please sign in or join the league to submit or edit your team roster.');
            return;
        }
        panel.classList.remove('hidden');
        populateRosterEditorOptions();
        if (!isCurrentUserAdmin()) {
            const myMgr = getCurrentUserManagerName();
            if (myMgr) {
                loadManagerIntoForm(myMgr, { bypassAuthCheck: true });
            }
        }
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        panel.classList.add('hidden');
    }
}

/**
 * Loads an existing manager's drafted drivers and teams into the Submit / Edit Roster form for editing.
 */
function loadManagerIntoForm(managerName, options = {}) {
    if (!managerName) return;

    if (!options.bypassAuthCheck) {
        if (!currentAuthUser) {
            openAuthModal('login');
            setAuthModalError(`Please sign in to edit ${managerName}'s roster.`);
            return;
        }
        if (!canUserEditManagerRoster(managerName)) {
            alert(`Standard managers can only edit their own team (${getCurrentUserManagerName()}).`);
            return;
        }
    }

    const panel = document.getElementById('roster-editor-panel');
    if (panel && panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
    }

    populateRosterEditorOptions();

    const managerInput = document.getElementById('manager-name');
    const existingSelect = document.getElementById('existing-manager-select');
    const adminMgrSelect = document.getElementById('admin-manager-select');

    const roster = (cachedUserRosters || DEFAULT_USER_ROSTERS).find(
        r => r.Manager.toLowerCase() === managerName.toLowerCase()
    );

    if (!roster) {
        if (managerInput) managerInput.value = managerName;
        return;
    }

    if (managerInput) managerInput.value = roster.Manager;
    if (existingSelect) existingSelect.value = roster.Manager;
    if (adminMgrSelect) adminMgrSelect.value = roster.Manager;

    document.querySelectorAll('#roster-form .driver-select, #roster-form .team-select').forEach(s => {
        s.value = '';
    });

    const tiers = categorizeDriversByTier(roster.Drivers);

    const setSelectValues = (selector, driverObjs) => {
        const selects = Array.from(document.querySelectorAll(`#roster-form ${selector}`));
        selects.forEach((select, idx) => {
            const targetName = driverObjs[idx]?.name || '';
            if (!targetName) return;
            const normTarget = normalizeName(targetName);
            const matchOpt = Array.from(select.options).find(o => normalizeName(o.value) === normTarget);
            if (matchOpt) {
                select.value = matchOpt.value;
            }
        });
    };

    setSelectValues('.tier-1', tiers.tier1);
    setSelectValues('.tier-2', tiers.tier2);
    setSelectValues('.tier-3', tiers.tier3);
    setSelectValues('.tier-4', tiers.tier4);

    const teams = Array.isArray(roster.Teams) ? roster.Teams : parseListField(roster.Teams);
    const teamSelects = Array.from(document.querySelectorAll('#roster-form .team-select'));
    teamSelects.forEach((select, idx) => {
        const targetTeam = teams[idx] || '';
        if (!targetTeam) return;
        const normTarget = normalizeName(targetTeam);
        const matchOpt = Array.from(select.options).find(o => normalizeName(o.value) === normTarget);
        if (matchOpt) {
            select.value = matchOpt.value;
        }
    });

    handleRosterDropdownUpdates();

    const statusDiv = document.getElementById('form-status');
    if (statusDiv) {
        statusDiv.style.color = '#007bff';
        statusDiv.textContent = isCurrentUserAdmin()
            ? `Admin Mode: Loaded ${roster.Manager}'s roster for editing.`
            : `Loaded your roster (${roster.Manager}) for editing.`;
    }
}

window.toggleRosterEditor = toggleRosterEditor;
window.loadManagerIntoForm = loadManagerIntoForm;

function parseListField(field) {
    if (Array.isArray(field)) return field.map(s => String(s).trim()).filter(Boolean);
    if (typeof field === 'string') {
        return field.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
}

function normalizeName(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Categorizes a manager's 10 drafted drivers strictly in their fixed draft slot order (Rows 2 through 11)
 * without matching or re-sorting by live standings/position:
 * - Tier 1: Driver 1 (index 0 / row 2)
 * - Tier 2: Drivers 2, 3, 4 (indices 1, 2, 3 / rows 3, 4, 5)
 * - Tier 3: Drivers 5, 6, 7, 8 (indices 4, 5, 6, 7 / rows 6, 7, 8, 9)
 * - Tier 4: Drivers 9, 10 (indices 8, 9 / rows 10, 11)
 */
function categorizeDriversByTier(driversList) {
    const rawList = Array.isArray(driversList) ? driversList : parseListField(driversList);

    const toDriverSlot = (entry, idx) => {
        const name = typeof entry === 'object' && entry !== null
            ? String(entry.name ?? '').trim()
            : String(entry ?? '').trim();
        return {
            name,
            slotIndex: idx,
            rowNumber: idx + 2
        };
    };

    const slots = Array.from({ length: 10 }, (_, idx) => toDriverSlot(rawList[idx], idx));

    return {
        tier1: slots.slice(0, 1).filter(d => d.name),
        tier2: slots.slice(1, 4).filter(d => d.name),
        tier3: slots.slice(4, 8).filter(d => d.name),
        tier4: slots.slice(8, 10).filter(d => d.name)
    };
}

/**
 * Formats lap time in seconds to M:SS.mmm or SS.mmm.
 */
function formatLapTime(seconds) {
    const num = Number(seconds);
    if (!num || num <= 0) return '--';
    if (num >= 60) {
        const mins = Math.floor(num / 60);
        const secs = (num % 60).toFixed(3).padStart(6, '0');
        return `${mins}:${secs}`;
    }
    return num.toFixed(3);
}

/**
 * Formats interval / delta to leader.
 */
function formatInterval(delta, runningPosition) {
    if (runningPosition === 1) return 'Leader';
    if (delta === undefined || delta === null || delta === '') return '--';
    const num = Number(delta);
    if (isNaN(num)) return String(delta);
    if (num === 0) return 'Leader';
    if (num < 0) {
        const lapsDown = Math.abs(num);
        return `-${lapsDown} ${lapsDown === 1 ? 'Lap' : 'Laps'}`;
    }
    return `+${num.toFixed(3)}`;
}

/**
 * Calculates total laps led from v.laps_led on a vehicle object.
 * - If v.laps_led is already a total number (or numeric string), uses it directly.
 * - If v.laps_led is an array of segments (e.g., [{ start_lap, end_lap }, ...]),
 *   sums (end_lap - start_lap + 1) across all valid segments rather than counting array length.
 */
function calculateLapsLed(lapsLedInput, currentLap) {
    if (lapsLedInput === undefined || lapsLedInput === null) return 0;

    if (typeof lapsLedInput === 'number') {
        return Number.isFinite(lapsLedInput) ? Math.max(0, Math.round(lapsLedInput)) : 0;
    }

    if (typeof lapsLedInput === 'string') {
        const cleaned = lapsLedInput.replace(/,/g, '').trim();
        if (!cleaned) return 0;
        const parsed = Number(cleaned);
        if (Number.isFinite(parsed)) {
            return Math.max(0, Math.round(parsed));
        }
    }

    if (!Array.isArray(lapsLedInput) || lapsLedInput.length === 0) return 0;

    const seenSegments = new Set();

    return lapsLedInput.reduce((total, range) => {
        if (typeof range === 'number' && Number.isFinite(range)) {
            return total + Math.max(0, Math.round(range));
        }
        if (!range || typeof range !== 'object') return total;

        // If a segment object directly specifies a numeric laps_led count without start/end bounds
        if (
            range.start_lap === undefined &&
            range.startLap === undefined &&
            range.laps_led !== undefined &&
            Number.isFinite(Number(range.laps_led))
        ) {
            return total + Math.max(0, Math.round(Number(range.laps_led)));
        }

        const rawStart = range.start_lap ?? range.startLap;
        const rawEnd = range.end_lap ?? range.endLap;
        const start = Number(rawStart);
        const parsedEnd = (rawEnd !== undefined && rawEnd !== null && String(rawEnd).trim() !== '')
            ? Number(rawEnd)
            : NaN;

        // Ignore pre-race / lap-0 placeholder entries (e.g., { start_lap: 0, end_lap: 0 })
        if (!Number.isFinite(start) || start <= 0) {
            if (Number.isFinite(parsedEnd) && parsedEnd > 0 && start === 0) {
                return total + Math.max(0, Math.round(parsedEnd));
            }
            return total;
        }

        const end = (Number.isFinite(parsedEnd) && parsedEnd >= start)
            ? parsedEnd
            : (Number(currentLap) >= start ? Number(currentLap) : start);

        const segKey = `${start}-${end}`;
        if (seenSegments.has(segKey)) return total;
        seenSegments.add(segKey);

        return total + Math.max(0, Math.round(end - start + 1));
    }, 0);
}

/**
 * Normalizes a car/vehicle number string (e.g., "#05 " -> "05", 5 -> "5") for consistent matching.
 */
function normalizeCarNumber(carVal) {
    if (carVal === undefined || carVal === null) return '';
    return String(carVal).replace(/^#/, '').trim();
}

/**
 * Filters and deduplicates raw pit stop log entries for a single vehicle,
 * returning { pitCount, lastPitLap, isInPit }.
 * Excludes lap-0 initialization placeholders, debug/test records, and duplicate telemetry log events
 * emitted during the same pit stop.
 */
function summarizeVehiclePitEntries(rawEntries, currentLap = 0) {
    if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
        return { pitCount: 0, lastPitLap: 0, isInPit: false };
    }

    const uniquePitLaps = new Set();
    const seenPitInTimes = new Set();
    let isInPit = false;

    rawEntries.forEach(entry => {
        if (!entry || typeof entry !== 'object') return;

        // Check if this entry indicates the vehicle is currently on pit road
        if (entry.pit_in_flag === 1 || entry.pit_in_flag === true || entry.in_pit === true) {
            isInPit = true;
        }

        // Ignore explicit debug or invalid log events
        if (
            entry.is_debug === true ||
            /^(debug|test|invalid|ignore)$/i.test(String(entry.event_type ?? entry.type ?? entry.status ?? '').trim())
        ) {
            return;
        }

        const rawLap = entry.lap_count ??
                       entry.pit_in_lap_count ??
                       entry.pit_in_leader_lap ??
                       entry.leader_lap ??
                       entry.pit_out_lap_count ??
                       entry.pit_lap ??
                       entry.last_pit_lap ??
                       entry.lap;

        const pitLap = Number(rawLap);

        // A valid race pit stop must happen on Lap 1 or later (filters out { pit_in_lap_count: 0, pit_in_leader_lap: 0 } placeholders)
        if (!Number.isFinite(pitLap) || pitLap <= 0) return;
        if (Number(currentLap) > 0 && pitLap > Number(currentLap) + 1) return;

        // If timing fields are present and all are 0 with no actual pit stop duration/activity, skip dummy rows
        const hasTimingFields = (
            entry.pit_in_elapsed_time !== undefined ||
            entry.pit_out_elapsed_time !== undefined ||
            entry.total_duration !== undefined ||
            entry.pit_stop_duration !== undefined ||
            entry.in_travel_duration !== undefined
        );
        if (hasTimingFields) {
            const pitInTime = Number(entry.pit_in_elapsed_time) || 0;
            const pitOutTime = Number(entry.pit_out_elapsed_time) || 0;
            const totalDur = Number(entry.total_duration ?? entry.pit_stop_duration ?? 0) || 0;
            const inTravelDur = Number(entry.in_travel_duration) || 0;

            if (pitInTime <= 0 && pitOutTime <= 0 && totalDur <= 0 && inTravelDur <= 0 && entry.lap_count === undefined) {
                return;
            }

            // Deduplicate multiple log packets that share the exact same pit_in_elapsed_time timestamp
            if (pitInTime > 0) {
                const timeKey = pitInTime.toFixed(3);
                if (seenPitInTimes.has(timeKey)) {
                    uniquePitLaps.add(Math.round(pitLap));
                    return;
                }
                seenPitInTimes.add(timeKey);
            }
        }

        uniquePitLaps.add(Math.round(pitLap));
    });

    const sortedLaps = Array.from(uniquePitLaps).sort((a, b) => a - b);
    const pitCount = sortedLaps.length;
    const lastPitLap = pitCount > 0 ? sortedLaps[sortedLaps.length - 1] : 0;

    return {
        pitCount,
        lastPitLap,
        isInPit
    };
}

/**
 * Parses live-pit-data.json and vehicle.pit_stops across all active vehicles, matching each car by
 * vehicle_number or car_number, counting unique completed pit stops, and identifying last_pit_lap.
 */
function buildVehiclePitStatsMap(pitData, vehicles = [], currentLap = 0) {
    const pitLogsByCar = new Map();
    const summaryByCar = new Map();

    // Extract raw array from live-pit-data.json (handles root array or { pits, pit_stops, vehicles, data, results })
    const rawPitList = Array.isArray(pitData)
        ? pitData
        : (Array.isArray(pitData?.pits)
            ? pitData.pits
            : (Array.isArray(pitData?.pit_stops)
                ? pitData.pit_stops
                : (Array.isArray(pitData?.pitStops)
                    ? pitData.pitStops
                    : (Array.isArray(pitData?.vehicles)
                        ? pitData.vehicles
                        : (Array.isArray(pitData?.data)
                            ? pitData.data
                            : (Array.isArray(pitData?.results) ? pitData.results : []))))));

    rawPitList.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const carKey = normalizeCarNumber(
            item.vehicle_number ?? item.car_number ?? item.vehicleNumber ?? item.carNumber
        );
        if (!carKey) return;

        if (!pitLogsByCar.has(carKey)) {
            pitLogsByCar.set(carKey, []);
        }

        // If item is a per-vehicle object containing its own nested pit_stops / pits array
        const nestedStops = Array.isArray(item.pit_stops)
            ? item.pit_stops
            : (Array.isArray(item.pits) ? item.pits : null);

        if (nestedStops) {
            pitLogsByCar.get(carKey).push(...nestedStops);
            summaryByCar.set(carKey, item);
        } else {
            pitLogsByCar.get(carKey).push(item);
        }
    });

    const resultByCar = new Map();

    vehicles.forEach(vehicle => {
        if (!vehicle || typeof vehicle !== 'object') return;
        const carKey = normalizeCarNumber(vehicle.vehicle_number ?? vehicle.car_number);
        if (!carKey) return;

        const livePitLogs = pitLogsByCar.get(carKey) || [];
        const vehicleFeedStops = Array.isArray(vehicle.pit_stops) ? vehicle.pit_stops : [];
        const summaryObj = summaryByCar.get(carKey) || null;

        // Prefer live-pit-data.json log entries for this car; also merge/fall back to vehicle.pit_stops
        const combinedLogs = livePitLogs.length > 0
            ? [...livePitLogs, ...vehicleFeedStops]
            : vehicleFeedStops;

        const parsed = summarizeVehiclePitEntries(combinedLogs, currentLap);

        let pitCount = parsed.pitCount;
        let lastPitLap = parsed.lastPitLap;

        // Fallback if only summary numeric counters were provided without individual log entries
        if (pitCount === 0 && combinedLogs.length === 0) {
            const explicitCount = Number(
                summaryObj?.number_of_pit_stops ??
                summaryObj?.pit_count ??
                vehicle.number_of_pit_stops ??
                vehicle.pit_count ??
                0
            );
            if (Number.isFinite(explicitCount) && explicitCount > 0) {
                pitCount = Math.round(explicitCount);
            }
        }

        if (lastPitLap === 0) {
            const explicitLastLap = Number(
                summaryObj?.last_pit_lap ??
                summaryObj?.pit_in_lap_count ??
                vehicle.last_pit_lap ??
                0
            );
            if (Number.isFinite(explicitLastLap) && explicitLastLap > 0) {
                lastPitLap = Math.round(explicitLastLap);
            }
        }

        const isInPit = Boolean(
            parsed.isInPit ||
            summaryObj?.pit_in_flag === 1 ||
            vehicle.pit_in_flag === 1
        );

        resultByCar.set(carKey, {
            pitCount,
            lastPitLap,
            isInPit
        });
    });

    return resultByCar;
}

/**
 * Calculates Fantasy NASCAR position points based on running position:
 * 1st = 40 pts, 2nd = 35 pts, 3rd = 34 pts ... down to 36th = 1 pt, 37th-40th = 1 pt.
 */
function getPositionPoints(runningPosition) {
    const pos = Number(runningPosition);
    if (!pos || pos <= 0) return 0;
    if (pos === 1) return 40;
    if (pos >= 2 && pos <= 35) return 37 - pos;
    return 1;
}

/**
 * Calculates stage bonus points for each vehicle/driver from live stage data or live points feed.
 */
function buildStagePointsMap(stageData, pointsData, raceData) {
    const stageMapByCar = new Map();
    const stageMapByName = new Map();

    if (Array.isArray(stageData) && stageData.length > 0) {
        stageData.forEach(stage => {
            const results = Array.isArray(stage.results) ? stage.results : [];
            results.forEach((entry, idx) => {
                const pts = entry.stage_points !== undefined
                    ? Number(entry.stage_points)
                    : Math.max(0, 10 - idx);
                const carNum = String(entry.vehicle_number || '').trim();
                const driverName = normalizeName(entry.full_name || entry.driver_name || '');
                if (carNum) {
                    stageMapByCar.set(carNum, (stageMapByCar.get(carNum) || 0) + pts);
                }
                if (driverName) {
                    stageMapByName.set(driverName, (stageMapByName.get(driverName) || 0) + pts);
                }
            });
        });
        return { stageMapByCar, stageMapByName };
    }

    if (Array.isArray(pointsData) && pointsData.length > 0) {
        pointsData.forEach(driver => {
            const pts = (Number(driver.stage_1_points) || 0) +
                        (Number(driver.stage_2_points) || 0) +
                        (Number(driver.stage_3_points) || 0);
            const carNum = String(driver.car_number || '').trim();
            const fullName = normalizeName(`${driver.first_name || ''} ${driver.last_name || ''}`);
            if (carNum && pts > 0) {
                stageMapByCar.set(carNum, pts);
            }
            if (fullName && pts > 0) {
                stageMapByName.set(fullName, pts);
            }
        });
        if (stageMapByCar.size > 0 || stageMapByName.size > 0) {
            return { stageMapByCar, stageMapByName };
        }
    }

    const vehicles = Array.isArray(raceData?.vehicles) ? raceData.vehicles : [];
    vehicles.forEach(v => {
        if (v.stage_points !== undefined) {
            const pts = Number(v.stage_points) || 0;
            stageMapByCar.set(String(v.vehicle_number), pts);
        }
    });

    return { stageMapByCar, stageMapByName };
}

/**
 * Checks whether a manager name is a helper/summary/incomplete column that should be excluded.
 */
function isExcludedHelperManagerName(managerName) {
    const raw = String(managerName ?? '').trim();
    if (!raw) return true;
    const lower = raw.toLowerCase();
    if (
        lower === '5633 freeway insurance 500' ||
        lower === 'sum of race points' ||
        lower.includes('incomplete') ||
        lower.includes('sum of race points') ||
        lower.includes('freeway insurance 500') ||
        /^(unknown manager|manager|manager name|empty|unnamed|\d{4}\s+.+)$/i.test(raw)
    ) {
        return true;
    }
    return false;
}

/**
 * Filters a roster array to only the 11 valid league managers returned by ?action=getRosters,
 * ignoring helper columns ('5633 Freeway Insurance 500', 'Sum of Race Points', or containing 'Incomplete').
 */
function getValidRosters(rosters) {
    if (!Array.isArray(rosters)) return [];
    return rosters.filter(r => {
        if (!r || typeof r !== 'object') return false;
        const mgr = String(r.Manager ?? r.manager ?? '').trim();
        if (isExcludedHelperManagerName(mgr)) return false;
        const drivers = Array.isArray(r.Drivers) ? r.Drivers.filter(Boolean) : [];
        const teams = Array.isArray(r.Teams) ? r.Teams.filter(Boolean) : [];
        const totalPts = Number(r.TotalPoints ?? r.totalPoints ?? 0) || 0;
        return drivers.length > 0 || teams.length > 0 || totalPts > 0;
    });
}

/**
 * Calculates per-vehicle live Fantasy NASCAR points using our custom scoring rules:
 * - Position points (40 for 1st, 35 for 2nd, 34 for 3rd, ..., 1 for 36th+)
 * - 1 point per lap led
 * - 5 bonus points for Most Laps Led in the race
 * - Stage bonus points
 * Falls back to live-points.json entries if live_feed.json vehicles are not yet populated.
 */
function calculateVehicleFantasyScores(raceData, stageData, pointsData) {
    const vehicles = Array.isArray(raceData?.vehicles) ? raceData.vehicles : [];
    const rawPointsArray = Array.isArray(pointsData)
        ? pointsData
        : (Array.isArray(pointsData?.drivers) ? pointsData.drivers : (Array.isArray(pointsData?.points) ? pointsData.points : []));
    const currentLap = Number(raceData?.lap_number) || 0;
    const { stageMapByCar, stageMapByName } = buildStagePointsMap(stageData, pointsData, raceData);

    const pointsDriverByName = new Map();
    const pointsDriverByCar = new Map();
    rawPointsArray.forEach(pt => {
        const ptName = normalizeName(
            pt.full_name || pt.driver_name || `${pt.first_name || ''} ${pt.last_name || ''}`.trim()
        );
        const ptCar = String(pt.car_number ?? pt.vehicle_number ?? '').trim();
        if (ptName) pointsDriverByName.set(ptName, pt);
        if (ptCar) pointsDriverByCar.set(ptCar, pt);
    });

    if (vehicles.length === 0 && rawPointsArray.length > 0) {
        return rawPointsArray.map((pt, idx) => {
            const carNumber = String(pt.car_number ?? pt.vehicle_number ?? idx + 1).trim();
            const driverFullName = (
                pt.full_name || pt.driver_name || `${pt.first_name || ''} ${pt.last_name || ''}`.trim() || 'Unknown Driver'
            );
            const normName = normalizeName(driverFullName);
            const runningPos = Number(pt.running_position ?? pt.position ?? pt.points_position) || 0;
            const teamName = cachedDriverTeamMap[normName] || pt.team_name || pt.vehicle_owner || '';
            const positionPts = runningPos > 0 ? getPositionPoints(runningPos) : 0;
            const stagePts = stageMapByCar.get(carNumber) ?? stageMapByName.get(normName) ?? (
                (Number(pt.stage_1_points) || 0) + (Number(pt.stage_2_points) || 0) + (Number(pt.stage_3_points) || 0)
            );
            const lapsLed = calculateLapsLed(pt.laps_led, currentLap);
            const lapsLedPts = lapsLed;
            const mostLedBonus = 0;
            const totalFantasyPts = positionPts + lapsLedPts + mostLedBonus + stagePts;
            return {
                carNumber,
                driverName: driverFullName,
                normalizedName: normName,
                teamName,
                normalizedTeam: normalizeName(teamName),
                runningPosition: runningPos,
                positionPts,
                stagePts,
                lapsLed,
                lapsLedPts,
                mostLedBonus,
                totalFantasyPts
            };
        });
    }

    let maxLapsLed = 0;
    const vehicleLapsLedMap = new Map();

    vehicles.forEach(vehicle => {
        const lapsLed = calculateLapsLed(vehicle.laps_led, currentLap);
        vehicleLapsLedMap.set(vehicle.vehicle_number, lapsLed);
        if (lapsLed > maxLapsLed) {
            maxLapsLed = lapsLed;
        }
    });

    return vehicles.map(vehicle => {
        const carNumber = String(vehicle.vehicle_number ?? '').trim();
        const driverFullName = vehicle.driver?.full_name || vehicle.driver_name || 'Unknown Driver';
        const normName = normalizeName(driverFullName);
        const runningPos = Number(vehicle.running_position) || 0;
        const ptEntry = pointsDriverByCar.get(carNumber) || pointsDriverByName.get(normName);

        const teamName = cachedDriverTeamMap[normName] ||
                         vehicle.team_name ||
                         vehicle.vehicle_owner ||
                         ptEntry?.team_name ||
                         ptEntry?.vehicle_owner ||
                         vehicle.vehicle_sponsor_name ||
                         '';

        const positionPts = getPositionPoints(runningPos);
        const lapsLed = vehicleLapsLedMap.get(vehicle.vehicle_number) || 0;
        const lapsLedPts = lapsLed * 1;
        const mostLedBonus = (maxLapsLed > 0 && lapsLed === maxLapsLed) ? 5 : 0;
        const stagePts = stageMapByCar.get(carNumber) ?? stageMapByName.get(normName) ?? (
            ptEntry
                ? ((Number(ptEntry.stage_1_points) || 0) + (Number(ptEntry.stage_2_points) || 0) + (Number(ptEntry.stage_3_points) || 0))
                : 0
        );

        const totalFantasyPts = positionPts + lapsLedPts + mostLedBonus + stagePts;

        return {
            carNumber,
            driverName: driverFullName,
            normalizedName: normName,
            teamName,
            normalizedTeam: normalizeName(teamName),
            runningPosition: runningPos,
            positionPts,
            stagePts,
            lapsLed,
            lapsLedPts,
            mostLedBonus,
            totalFantasyPts
        };
    });
}

/**
 * Calculates real-time live fantasy points for the active race currently on track from each manager's
 * 10 drafted Drivers and 2 Teams, plus live projected season points = TotalPoints + liveRacePoints
 * and top live scorer details.
 * Team points are pulled strictly from official backend data (Team Points tab / getDriverData / Results / getRosters)
 * rather than client-side guesswork or driver averaging.
 */
function calculateLiveRosterStandings(raceData, stageData, pointsData, rosters) {
    const scoredVehicles = calculateVehicleFantasyScores(raceData, stageData, pointsData);
    const validRosters = getValidRosters(rosters);

    const standings = validRosters.map(roster => {
        const managerName = roster.Manager || 'Unknown Manager';
        const rosterDrivers = (Array.isArray(roster.Drivers) ? roster.Drivers : parseListField(roster.Drivers))
            .map(d => String(d ?? '').trim())
            .filter(Boolean);
        const rosterTeams = (Array.isArray(roster.Teams) ? roster.Teams : parseListField(roster.Teams))
            .map(t => String(t ?? '').trim())
            .filter(Boolean);

        let posPtsTotal = 0;
        let stagePtsTotal = 0;
        let ledPtsTotal = 0;
        let mostLedBonusTotal = 0;
        let driverPtsTotal = 0;
        let teamPtsTotal = 0;

        const matchedVehicleNumbers = new Set();

        // Score each of the manager's 10 drafted drivers in the current race
        const driverLiveBreakdowns = rosterDrivers.map(driverName => {
            const cleanDriverName = String(driverName ?? '').replace(/\s*\([^)]*pts[^)]*\)\s*$/i, '').trim() || driverName;
            const normDriver = normalizeName(cleanDriverName);
            const matchedVehicle = scoredVehicles.find(v =>
                normDriver && (v.normalizedName === normDriver || v.normalizedName.includes(normDriver) || normDriver.includes(v.normalizedName))
            );

            const officialDriverPts = resolveOfficialDriverPoints(driverName, roster, matchedVehicle);

            if (matchedVehicle) {
                if (!matchedVehicleNumbers.has(matchedVehicle.carNumber)) {
                    matchedVehicleNumbers.add(matchedVehicle.carNumber);
                    posPtsTotal += matchedVehicle.positionPts;
                    stagePtsTotal += matchedVehicle.stagePts;
                    ledPtsTotal += matchedVehicle.lapsLedPts;
                    mostLedBonusTotal += matchedVehicle.mostLedBonus;
                }
                driverPtsTotal += officialDriverPts;
                return {
                    name: cleanDriverName,
                    carNumber: matchedVehicle.carNumber,
                    runningPosition: matchedVehicle.runningPosition,
                    points: officialDriverPts,
                    posPts: matchedVehicle.positionPts,
                    stagePts: matchedVehicle.stagePts,
                    ledPts: matchedVehicle.lapsLedPts + matchedVehicle.mostLedBonus
                };
            }

            driverPtsTotal += officialDriverPts;
            return {
                name: cleanDriverName,
                carNumber: '--',
                runningPosition: null,
                points: officialDriverPts,
                posPts: 0,
                stagePts: 0,
                ledPts: 0
            };
        });

        // Pull official points for each of the manager's 2 selected race teams from backend data (no client-side guesswork)
        const teamLiveBreakdowns = rosterTeams.map(teamName => {
            const cleanTeamName = String(teamName ?? '')
                .replace(/^🏁\s*/, '')
                .replace(/\s*\([^)]*pts[^)]*\)\s*$/i, '')
                .trim() || teamName;
            const officialTeamPts = resolveOfficialTeamPoints(teamName, roster);
            teamPtsTotal += officialTeamPts;

            return {
                name: cleanTeamName,
                points: officialTeamPts
            };
        });

        const liveRacePtsTotal = driverPtsTotal + teamPtsTotal;

        // Identify the manager's highest-scoring driver in the current race
        let topLiveScorer = null;
        driverLiveBreakdowns.forEach(d => {
            if (!topLiveScorer || d.points > topLiveScorer.points) {
                topLiveScorer = d;
            }
        });

        const totalPoints = Number(String(roster.TotalPoints ?? roster.totalPoints ?? 0).replace(/,/g, '')) || 0;
        const wins = Number(roster.Wins ?? roster.wins ?? 0) || 0;
        const projectedSeasonTotal = totalPoints + liveRacePtsTotal;

        return {
            ...roster,
            manager: managerName,
            drivers: rosterDrivers,
            teams: rosterTeams,
            driverLiveBreakdowns,
            teamLiveBreakdowns,
            topLiveScorer,
            wins,
            totalPoints,
            sheetCumulativePts: totalPoints,
            posPts: posPtsTotal,
            stagePts: stagePtsTotal,
            ledPts: ledPtsTotal,
            mostLedBonus: mostLedBonusTotal,
            driverPtsTotal,
            teamPtsTotal,
            liveRacePts: liveRacePtsTotal,
            projectedSeasonTotal
        };
    });

    // Establish each manager's baseline official rank (officialRank) by sorting by official cumulative TotalPoints descending
    const sortedByOfficial = [...standings].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        const rankA = Number(a.OverallRank) || 999;
        const rankB = Number(b.OverallRank) || 999;
        return rankA - rankB;
    });
    const officialRankMap = new Map();
    sortedByOfficial.forEach((mgr, idx) => {
        officialRankMap.set(mgr.manager, idx + 1);
    });

    // Establish each manager's projected live rank (projectedRank) by sorting by projected season points (TotalPoints + liveRacePts descending)
    const sortedByProjected = [...standings].sort((a, b) => {
        if (b.projectedSeasonTotal !== a.projectedSeasonTotal) return b.projectedSeasonTotal - a.projectedSeasonTotal;
        if (b.liveRacePts !== a.liveRacePts) return b.liveRacePts - a.liveRacePts;
        return (officialRankMap.get(a.manager) || 999) - (officialRankMap.get(b.manager) || 999);
    });
    const projectedRankMap = new Map();
    sortedByProjected.forEach((mgr, idx) => {
        projectedRankMap.set(mgr.manager, idx + 1);
    });

    standings.forEach(mgr => {
        const officialRank = officialRankMap.get(mgr.manager) || 1;
        const projectedRank = projectedRankMap.get(mgr.manager) || 1;
        mgr.officialRank = officialRank;
        mgr.projectedRank = projectedRank;
        mgr.posChange = officialRank - projectedRank;
    });

    return standings;
}

/**
 * Asynchronous polling function that fetches official real-time NASCAR series points and core season statistics
 * from https://cf.nascar.com/live/feeds/live-points.json (using our CORS proxy fallback).
 */
async function fetchSeriesLivePoints(seriesIdOverride) {
    try {
        const primaryPoints = await fetchWithCorsFallback(LIVE_POINTS_URL);
        const normalizedPrimary = Array.isArray(primaryPoints)
            ? primaryPoints
            : (Array.isArray(primaryPoints?.drivers) ? primaryPoints.drivers : (Array.isArray(primaryPoints?.points) ? primaryPoints.points : null));

        if (normalizedPrimary && normalizedPrimary.length > 0) {
            latestPointsData = normalizedPrimary;
            updateSeriesLiveStandingsTable(latestPointsData, latestRaceData);
            return latestPointsData;
        }
    } catch (err) {
        console.warn('Primary live-points.json fetch failed, checking series-specific live-points.json:', err.message);
    }

    try {
        const targetSeries = Number(seriesIdOverride) || Number(activeSeriesId) || 1;
        const seriesPointsUrl = `${NASCAR_FEEDS_BASE_URL}/series_${targetSeries}/live-points.json`;
        const seriesPoints = await fetchWithCorsFallback(seriesPointsUrl);
        const normalizedSeries = Array.isArray(seriesPoints)
            ? seriesPoints
            : (Array.isArray(seriesPoints?.drivers) ? seriesPoints.drivers : (Array.isArray(seriesPoints?.points) ? seriesPoints.points : []));

        if (normalizedSeries.length > 0) {
            latestPointsData = normalizedSeries;
        }
    } catch (seriesErr) {
        console.warn('Series-specific live-points.json fetch failed:', seriesErr.message);
    }

    updateSeriesLiveStandingsTable(latestPointsData, latestRaceData);
    return latestPointsData;
}

/**
 * Tab 2: Renders the official Series Live Standings table (#series-live-standings-body) displaying
 * core season statistics: POS, CAR, DRIVER, SERIES PTS, BEHIND, WINS, TOP 5, and TOP 10.
 */
function updateSeriesLiveStandingsTable(pointsData, raceData) {
    const tbody = document.getElementById('series-live-standings-body');
    if (!tbody) return;

    const rawPointsArray = Array.isArray(pointsData)
        ? pointsData
        : (Array.isArray(pointsData?.drivers) ? pointsData.drivers : (Array.isArray(pointsData?.points) ? pointsData.points : []));

    const vehicleByName = new Map();
    if (Array.isArray(raceData?.vehicles)) {
        raceData.vehicles.forEach(v => {
            const name = normalizeName(v.driver?.full_name || v.driver_name || '');
            if (name) vehicleByName.set(name, v);
        });
    }

    // Filter eligible entries from live-points.json
    const validPointsEntries = rawPointsArray.filter(driver => {
        const hasName = Boolean(driver.full_name || driver.driver_name || driver.last_name || driver.first_name);
        const isEligible = driver.is_points_eligible !== false;
        return hasName && isEligible;
    });

    if (validPointsEntries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">Waiting for official NASCAR Series Live Standings data from live-points.json...</td>
            </tr>
        `;
        return;
    }

    // Sort by points_position ascending (or points descending as fallback)
    const sortedDrivers = [...validPointsEntries].sort((a, b) => {
        const posA = Number(a.points_position ?? a.position) || 0;
        const posB = Number(b.points_position ?? b.position) || 0;
        if (posA > 0 && posB > 0 && posA !== posB) return posA - posB;
        return (Number(b.points) || 0) - (Number(a.points) || 0);
    });

    const leaderPoints = Number(sortedDrivers[0]?.points) || 0;

    tbody.innerHTML = sortedDrivers.map((driver, idx) => {
        const pos = Number(driver.points_position ?? driver.position) || (idx + 1);
        const fullName = (
            driver.full_name ||
            driver.driver_name ||
            `${driver.first_name || ''} ${driver.last_name || ''}`.trim() ||
            'Unknown Driver'
        );
        const normName = normalizeName(fullName);
        const liveVehicle = vehicleByName.get(normName);
        const rawCar = String(driver.car_number ?? driver.vehicle_number ?? liveVehicle?.vehicle_number ?? '--').trim();
        const carDisplay = rawCar && rawCar !== '--' ? `#${rawCar}` : '--';

        const seriesPoints = Number(driver.points) || 0;
        let deltaLeaderDisplay = 'Leader';
        if (pos > 1) {
            const rawDelta = driver.delta_leader !== undefined && driver.delta_leader !== null
                ? Number(driver.delta_leader)
                : Math.max(0, leaderPoints - seriesPoints);
            const absDelta = Math.abs(Number(rawDelta) || Math.max(0, leaderPoints - seriesPoints));
            deltaLeaderDisplay = absDelta === 0 ? '0' : `-${absDelta}`;
        }

        const wins = Number(driver.wins ?? driver.season_wins ?? 0) || 0;
        const top5 = Number(driver.top_5 ?? driver.top5 ?? 0) || 0;
        const top10 = Number(driver.top_10 ?? driver.top10 ?? 0) || 0;

        return `
            <tr>
                <td class="pos-cell">${pos}</td>
                <td class="car-cell">${carDisplay}</td>
                <td class="driver-cell">${fullName}</td>
                <td class="pos-cell">${seriesPoints}</td>
                <td class="mono-cell">${deltaLeaderDisplay}</td>
                <td class="mono-cell">${wins}</td>
                <td class="mono-cell">${top5}</td>
                <td class="mono-cell">${top10}</td>
            </tr>
        `;
    }).join('');
}

const expandedLiveManagersSet = new Set();

/**
 * Toggles the compact inline drawer row for a manager in the Live Race Standings table.
 */
function toggleLiveManagerDrawer(managerName) {
    const key = String(managerName ?? '').trim();
    if (!key) return;
    if (expandedLiveManagersSet.has(key)) {
        expandedLiveManagersSet.delete(key);
    } else {
        expandedLiveManagersSet.add(key);
    }
    updateLiveRaceStandingsTable(latestRaceData, latestStageData, latestPointsData);
}

window.toggleLiveManagerDrawer = toggleLiveManagerDrawer;

/**
 * Formats the projected live standings movement trend badge:
 * - ▲ +X in green if posChange > 0
 * - ▼ -X in red if posChange < 0
 * - — Even in gray if posChange === 0
 */
function formatLiveProjectedTrendBadge(posChange) {
    const change = Number(posChange) || 0;
    if (change > 0) {
        return `<span class="trend-pill trend-up">▲ +${change}</span>`;
    }
    if (change < 0) {
        return `<span class="trend-pill trend-down">▼ -${Math.abs(change)}</span>`;
    }
    return `<span class="trend-pill trend-flat">— Even</span>`;
}

/**
 * Tab 3: Renders the dual-panel Live Race Standings tab:
 * - Left Panel (#live-race-standings-body): Live Race Results sorted by Live Race Pts (descending)
 *   Columns: POS | MANAGER | LIVE RACE PTS | LIVE GAP | TOP LIVE SCORER
 *   Clicking a manager row expands an inline drawer showing individual live points for their 10 drivers and 2 teams.
 * - Right Panel (#live-projected-standings-body): Projected Overall Season Standings sorted by Projected Rank (ascending)
 *   Columns: RANK | MANAGER | PROJ. PTS | PROJ. GAP | TREND (— Even, ▲ +X, ▼ -X)
 */
async function updateLiveRaceStandingsTable(raceData, stageData, pointsData) {
    const liveRaceTbody = document.getElementById('live-race-standings-body');
    const projectedSeasonTbody = document.getElementById('live-projected-standings-body');
    const liveBannerEl = document.getElementById('live-race-banner');
    if (!liveRaceTbody && !projectedSeasonTbody) return;

    if (liveBannerEl) {
        if (raceData && (raceData.run_name || raceData.track_name)) {
            const titlePart = [raceData.run_name, raceData.track_name].filter(Boolean).join(' • ');
            const lapPart = raceData.lap_number !== undefined
                ? ` — Lap ${raceData.lap_number}${raceData.laps_in_race ? ` / ${raceData.laps_in_race}` : ''}`
                : '';
            liveBannerEl.textContent = `${titlePart}${lapPart}`;
        } else {
            liveBannerEl.textContent = 'Real-time live points for the current race in progress';
        }
    }

    const rosters = await loadUserRosters();
    const standings = calculateLiveRosterStandings(raceData, stageData, pointsData, rosters);

    if (standings.length === 0) {
        if (liveRaceTbody) {
            liveRaceTbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No valid manager rosters returned from Google Apps Script to calculate live race standings.</td>
                </tr>
            `;
        }
        if (projectedSeasonTbody) {
            projectedSeasonTbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No valid manager rosters available for projected season standings.</td>
                </tr>
            `;
        }
        return;
    }

    // Establish baseline official rank (officialRank) by sorting managers by official cumulative TotalPoints before the current race
    const sortedByOfficial = [...standings].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        const rankA = Number(a.OverallRank) || 999;
        const rankB = Number(b.OverallRank) || 999;
        return rankA - rankB;
    });
    const officialRankByMgr = new Map();
    sortedByOfficial.forEach((mgr, idx) => {
        officialRankByMgr.set(mgr.manager, idx + 1);
    });

    // Establish projected live rank (projectedRank) by sorting managers by projected season points (TotalPoints + liveRacePts descending)
    const sortedByProjected = [...standings].sort((a, b) => {
        const projA = (Number(a.totalPoints) || 0) + (Number(a.liveRacePts) || 0);
        const projB = (Number(b.totalPoints) || 0) + (Number(b.liveRacePts) || 0);
        if (projB !== projA) return projB - projA;
        if (b.liveRacePts !== a.liveRacePts) return b.liveRacePts - a.liveRacePts;
        return (officialRankByMgr.get(a.manager) || 999) - (officialRankByMgr.get(b.manager) || 999);
    });
    const projectedRankByMgr = new Map();
    sortedByProjected.forEach((mgr, idx) => {
        projectedRankByMgr.set(mgr.manager, idx + 1);
    });

    // 1. Left Panel: Live Race Results sorted descending by Live Race Pts (with Projected Season Pts as tie-breaker)
    const sortedRaceStandings = [...standings].sort((a, b) => {
        if (b.liveRacePts !== a.liveRacePts) return b.liveRacePts - a.liveRacePts;
        return b.projectedSeasonTotal - a.projectedSeasonTotal;
    });

    const leaderLivePts = Number(sortedRaceStandings[0]?.liveRacePts) || 0;

    if (liveRaceTbody) {
        liveRaceTbody.innerHTML = sortedRaceStandings.map((row, idx) => {
            const rank = idx + 1;
            const livePts = Number(row.liveRacePts) || 0;
            const livePtsFormatted = livePts.toLocaleString('en-US');
            const liveGapDisplay = rank === 1 ? '—' : `-${Math.max(0, leaderLivePts - livePts).toLocaleString('en-US')}`;

            const officialRank = officialRankByMgr.get(row.manager) ?? row.officialRank ?? rank;
            const projectedRank = projectedRankByMgr.get(row.manager) ?? row.projectedRank ?? rank;

            const topScorer = row.topLiveScorer;
            const topScorerDisplay = topScorer && topScorer.name
                ? `${topScorer.name} <span class="mono-cell">(${topScorer.points} pts)</span>`
                : '—';

            const isExpanded = expandedLiveManagersSet.has(row.manager);
            const escapedMgr = row.manager.replace(/'/g, "\\'");

            const driverChipsHtml = (row.driverLiveBreakdowns || []).map(d => {
                const posBadge = d.runningPosition ? `P${d.runningPosition} • ` : '';
                const ptsFormatted = (Number(d.points) || 0).toLocaleString('en-US');
                return `
                    <div class="live-drawer-chip">
                        <span class="live-drawer-name" title="${d.name}">${d.name}</span>
                        <span class="live-drawer-pts">${posBadge}${ptsFormatted} pts</span>
                    </div>
                `;
            }).join('');

            const teamChipsHtml = (row.teamLiveBreakdowns || []).map(t => {
                const teamPtsFormatted = (Number(t.points) || 0).toLocaleString('en-US');
                return `
                    <div class="live-drawer-chip team-chip">
                        <span class="live-drawer-name" title="Team: ${t.name}">🏁 ${t.name}</span>
                        <span class="live-drawer-pts">${teamPtsFormatted} pts</span>
                    </div>
                `;
            }).join('');

            const driverTotalFormatted = (Number(row.driverPtsTotal) || 0).toLocaleString('en-US');
            const teamTotalFormatted = (Number(row.teamPtsTotal) || 0).toLocaleString('en-US');

            const drawerRowHtml = isExpanded ? `
                <tr class="live-drawer-row">
                    <td colspan="5">
                        <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; margin-bottom: 8px;">
                            ${row.manager} — Live Current-Race Roster Breakdown (Driver Pts: ${driverTotalFormatted} • Official Team Pts: ${teamTotalFormatted} • Official Rank #${officialRank} → Projected Rank #${projectedRank})
                        </div>
                        <div class="live-drawer-grid">
                            ${driverChipsHtml}
                            ${teamChipsHtml}
                        </div>
                    </td>
                </tr>
            ` : '';

            return `
                <tr class="live-manager-row${isExpanded ? ' expanded' : ''}" onclick="toggleLiveManagerDrawer('${escapedMgr}')" title="Click to toggle live driver &amp; team points breakdown">
                    <td class="pos-cell">${rank}</td>
                    <td class="driver-cell"><span class="live-expand-icon">▶</span>${row.manager}</td>
                    <td class="pos-cell">${livePtsFormatted}</td>
                    <td class="mono-cell">${liveGapDisplay}</td>
                    <td>${topScorerDisplay}</td>
                </tr>
                ${drawerRowHtml}
            `;
        }).join('');
    }

    // 2. Right Panel: Projected Overall Season Standings sorted by Projected Rank (TotalPoints + LiveRacePts descending)
    if (projectedSeasonTbody) {
        const leaderProjectedPts = sortedByProjected.length > 0
            ? ((Number(sortedByProjected[0].totalPoints) || 0) + (Number(sortedByProjected[0].liveRacePts) || 0))
            : 0;

        projectedSeasonTbody.innerHTML = sortedByProjected.map((row, idx) => {
            const projectedRank = idx + 1;
            const officialRank = officialRankByMgr.get(row.manager) ?? row.officialRank ?? projectedRank;
            const livePts = Number(row.liveRacePts) || 0;
            const projectedSeasonPts = (Number(row.totalPoints) || 0) + livePts;
            const projectedPtsFormatted = projectedSeasonPts.toLocaleString('en-US');

            const projectedGapDiff = Math.max(0, leaderProjectedPts - projectedSeasonPts);
            const projectedGapDisplay = projectedRank === 1
                ? '—'
                : (projectedGapDiff === 0 ? '0' : `-${projectedGapDiff.toLocaleString('en-US')}`);

            const posChange = officialRank - projectedRank;
            const trendBadgeHtml = formatLiveProjectedTrendBadge(posChange);

            return `
                <tr>
                    <td class="pos-cell">${projectedRank}</td>
                    <td class="driver-cell">${row.manager}</td>
                    <td class="pos-cell">${projectedPtsFormatted}</td>
                    <td class="mono-cell">${projectedGapDisplay}</td>
                    <td title="Official Baseline Rank #${officialRank} → Projected Live Rank #${projectedRank}">${trendBadgeHtml}</td>
                </tr>
            `;
        }).join('');
    }
}

let selectedCompletedRaceKey = '';

/**
 * Extracts a deduplicated list of completed races from the managers' RaceScores (and LastRace* fields),
 * returning { races: Array<{ key, raceId, raceName, track, label }>, defaultKey: string }.
 */
function extractCompletedRacesCatalog(validRosters) {
    const raceMap = new Map();
    let defaultLastRaceKey = '';

    // 1. Discover default Last Completed Race metadata from any manager with LastRaceId / LastRaceName
    for (const r of validRosters) {
        const lastId = String(r.LastRaceId ?? '').trim();
        const lastName = String(r.LastRaceName ?? '').trim();
        const lastTrack = String(r.LastRaceTrack ?? '').trim();
        if (lastId || lastName) {
            const key = lastId || lastName;
            if (!defaultLastRaceKey) defaultLastRaceKey = key;
            const titlePart = [lastId, lastName].filter(Boolean).join(' ');
            const fullLabel = lastTrack ? `${titlePart} • ${lastTrack}` : titlePart;
            raceMap.set(key, {
                key,
                raceId: lastId,
                raceName: lastName,
                track: lastTrack,
                label: fullLabel || key,
                isLastRace: true
            });
        }
    }

    // 2. Discover all completed races in RaceScores across managers
    validRosters.forEach(r => {
        const rs = r.RaceScores;
        if (!rs) return;

        if (Array.isArray(rs)) {
            rs.forEach((entry, idx) => {
                if (!entry || typeof entry !== 'object') return;
                const raceId = String(entry.RaceId ?? entry.raceId ?? entry.id ?? '').trim();
                const raceName = String(entry.RaceName ?? entry.raceName ?? entry.name ?? entry.label ?? '').trim();
                const track = String(entry.trackName ?? entry.TrackName ?? entry.Track ?? entry.track ?? entry.RaceTrack ?? entry.raceTrack ?? '').trim();
                const key = raceId || raceName || `race_${idx + 1}`;
                const pts = Number(String(entry.Points ?? entry.points ?? entry.Score ?? entry.score ?? 0).replace(/,/g, '')) || 0;
                const hasCompletedScore = pts > 0 || key === defaultLastRaceKey;
                if (!hasCompletedScore && !raceMap.has(key)) return;

                const existing = raceMap.get(key);
                const mergedId = raceId || existing?.raceId || '';
                const mergedName = raceName || existing?.raceName || '';
                const mergedTrack = track || existing?.track || '';
                const titlePart = [mergedId, mergedName].filter(Boolean).join(' ') || key;
                const fullLabel = mergedTrack ? `${titlePart} • ${mergedTrack}` : titlePart;

                raceMap.set(key, {
                    key,
                    raceId: mergedId,
                    raceName: mergedName,
                    track: mergedTrack,
                    label: fullLabel,
                    isLastRace: key === defaultLastRaceKey || Boolean(existing?.isLastRace)
                });
            });
        } else if (typeof rs === 'object') {
            Object.entries(rs).forEach(([rawKey, val]) => {
                const cleanKey = String(rawKey).trim();
                if (!cleanKey) return;
                const isObj = typeof val === 'object' && val !== null;
                const pts = isObj
                    ? (Number(String(val.Points ?? val.points ?? val.Score ?? val.score ?? 0).replace(/,/g, '')) || 0)
                    : (Number(String(val ?? 0).replace(/,/g, '')) || 0);
                if (pts <= 0 && cleanKey !== defaultLastRaceKey && !raceMap.has(cleanKey)) return;

                const raceId = isObj ? String(val.RaceId ?? val.raceId ?? cleanKey).trim() : cleanKey;
                const raceName = isObj ? String(val.RaceName ?? val.raceName ?? val.name ?? '').trim() : '';
                const track = isObj ? String(val.Track ?? val.track ?? '').trim() : '';

                const existing = raceMap.get(cleanKey) || (raceId ? raceMap.get(raceId) : null);
                const targetKey = existing?.key || raceId || cleanKey;
                const mergedId = existing?.raceId || raceId;
                const mergedName = existing?.raceName || raceName;
                const mergedTrack = existing?.track || track;
                const titlePart = [mergedId, mergedName].filter(Boolean).join(' ') || cleanKey;
                const fullLabel = mergedTrack ? `${titlePart} • ${mergedTrack}` : titlePart;

                raceMap.set(targetKey, {
                    key: targetKey,
                    raceId: mergedId,
                    raceName: mergedName,
                    track: mergedTrack,
                    label: fullLabel,
                    isLastRace: targetKey === defaultLastRaceKey || Boolean(existing?.isLastRace)
                });
            });
        }
    });

    const races = Array.from(raceMap.values());
    if (!defaultLastRaceKey && races.length > 0) {
        defaultLastRaceKey = races[races.length - 1].key;
    }

    return { races, defaultKey: defaultLastRaceKey };
}

/**
 * Extracts a manager's score, rank, and gap for a specific selected completed race key.
 */
function getManagerCompletedRaceEntry(roster, raceKey, defaultKey) {
    const isDefaultLastRace = !raceKey || raceKey === defaultKey || String(roster.LastRaceId ?? '').trim() === String(raceKey).trim();
    const rs = roster.RaceScores;
    let matchedEntry = null;

    if (Array.isArray(rs)) {
        matchedEntry = rs.find(item => {
            if (!item || typeof item !== 'object') return false;
            const id = String(item.RaceId ?? item.raceId ?? item.id ?? '').trim();
            const name = String(item.RaceName ?? item.raceName ?? item.name ?? item.label ?? '').trim();
            return (id && id === raceKey) || (name && name === raceKey) || `${id} ${name}`.trim() === raceKey;
        });
    } else if (rs && typeof rs === 'object') {
        if (rs[raceKey] !== undefined) {
            matchedEntry = rs[raceKey];
        } else {
            const matchKey = Object.keys(rs).find(k => k.trim() === raceKey || k.includes(raceKey));
            if (matchKey !== undefined) matchedEntry = rs[matchKey];
        }
    }

    if (matchedEntry !== null && matchedEntry !== undefined) {
        if (typeof matchedEntry === 'object') {
            const pts = Number(String(matchedEntry.Points ?? matchedEntry.points ?? matchedEntry.Score ?? matchedEntry.score ?? 0).replace(/,/g, '')) || 0;
            const rankVal = matchedEntry.Rank ?? matchedEntry.rank ?? (isDefaultLastRace ? roster.LastRaceRank : null);
            const gapVal = matchedEntry.Gap ?? matchedEntry.gap ?? (isDefaultLastRace ? roster.LastRaceGap : null);
            return {
                points: pts || (isDefaultLastRace ? (Number(roster.LastRacePoints) || 0) : 0),
                rank: rankVal !== undefined && rankVal !== null && rankVal !== '' ? Number(rankVal) : null,
                gap: gapVal
            };
        }
        const numericScore = Number(String(matchedEntry).replace(/,/g, '')) || 0;
        return {
            points: numericScore,
            rank: isDefaultLastRace && roster.LastRaceRank ? Number(roster.LastRaceRank) : null,
            gap: isDefaultLastRace ? roster.LastRaceGap : null
        };
    }

    if (isDefaultLastRace) {
        return {
            points: Number(roster.LastRacePoints) || 0,
            rank: roster.LastRaceRank !== undefined && roster.LastRaceRank !== null ? Number(roster.LastRaceRank) : null,
            gap: roster.LastRaceGap ?? null
        };
    }

    return { points: 0, rank: null, gap: null };
}

/**
 * Formats a gap value (e.g., GapToLeader or LastRaceGap) cleanly for table display.
 */
function formatGapDisplay(rawGap, rank, leaderPoints, rowPoints) {
    if (rank === 1) return '—';
    if (rawGap !== undefined && rawGap !== null && String(rawGap).trim() !== '') {
        const str = String(rawGap).trim();
        if (/^leader$/i.test(str) || str === '—' || str === '-' || str === '0' || str === '-0' || str === '+0') {
            return rank === 1 ? '—' : '0';
        }
        const num = Number(str.replace(/,/g, ''));
        if (Number.isFinite(num)) {
            if (num === 0) return '0';
            const absFormatted = Math.abs(num).toLocaleString('en-US');
            return `-${absFormatted}`;
        }
        return str;
    }
    const diff = Math.max(0, (Number(leaderPoints) || 0) - (Number(rowPoints) || 0));
    return diff === 0 ? '0' : `-${diff.toLocaleString('en-US')}`;
}

/**
 * Formats MovementTrend and PositionChange into a styled pill badge:
 * - ▲ +X in green if posChange > 0
 * - ▼ -X in red if posChange < 0
 * - — Even in gray if posChange === 0
 */
function formatMovementTrendBadge(roster) {
    const trendStr = String(roster.MovementTrend ?? '').trim();
    const posChange = Number(roster.PositionChange ?? 0) || 0;

    if (posChange > 0 || /▲|↑|\bup\b|\+/i.test(trendStr)) {
        const num = Math.abs(posChange) || Number(trendStr.replace(/[^\d]/g, '')) || 0;
        const label = num > 0 ? `▲ +${num}` : (trendStr || '▲');
        return `<span class="trend-pill trend-up">${label}</span>`;
    }
    if (posChange < 0 || /▼|↓|\bdown\b|-/i.test(trendStr)) {
        const num = Math.abs(posChange) || Number(trendStr.replace(/[^\d]/g, '')) || 0;
        const label = num > 0 ? `▼ -${num}` : (trendStr || '▼');
        return `<span class="trend-pill trend-down">${label}</span>`;
    }
    const neutralLabel = (!trendStr || trendStr === '—' || trendStr === '-' || /^even$/i.test(trendStr) || trendStr === '0')
        ? '— Even'
        : trendStr;
    return `<span class="trend-pill trend-flat">${neutralLabel}</span>`;
}

/**
 * Handles switching the completed race in the Fantasy Standings dropdown (#completed-race-select).
 * Updates the Left Panel (Latest Completed Race Results) for the selected race and pre-fetches race results.
 */
async function handleCompletedRaceChange(raceKey) {
    selectedCompletedRaceKey = String(raceKey ?? '').trim();
    await updateFantasyStandingsTable(latestRaceData, latestStageData, latestPointsData);
    if (selectedCompletedRaceKey) {
        const cleanRaceId = selectedCompletedRaceKey.match(/^(\d{4})/)?.[1] || selectedCompletedRaceKey;
        if (!cachedRaceResultsMap.has(cleanRaceId)) {
            await loadIndividualRaceResults(cleanRaceId, { openModal: false });
            await updateFantasyStandingsTable(latestRaceData, latestStageData, latestPointsData);
        }
    }
}

window.handleCompletedRaceChange = handleCompletedRaceChange;

/**
 * Opens the Individual Race Results modal for the currently selected race in the Fantasy Standings dropdown.
 */
function openSelectedFantasyRaceResults() {
    const selectEl = document.getElementById('completed-race-select');
    const rawKey = (selectEl && selectEl.value) ? selectEl.value : selectedCompletedRaceKey;
    const cleanRaceId = String(rawKey ?? '').trim().match(/^(\d{4})/)?.[1] || String(rawKey ?? '').trim();
    if (cleanRaceId) {
        loadIndividualRaceResults(cleanRaceId, { openModal: true });
    }
}

window.openSelectedFantasyRaceResults = openSelectedFantasyRaceResults;

/**
 * Tab 4: Renders the Fantasy Standings tab:
 * 1. Overall Season Fantasy Standings table (#fantasy-standings-body) sorted by OverallRank
 *    (Manager, TotalPoints, GapToLeader, Wins, PriorRank, MovementTrend)
 * 2. Completed Race Results table (#last-race-standings-body) sorted by LastRaceRank
 *    (LastRaceId - LastRaceName at LastRaceTrack, LastRacePoints, LastRaceGap) with RaceScores selector dropdown.
 */
async function updateFantasyStandingsTable(raceData, stageData, pointsData) {
    const overallTbody = document.getElementById('fantasy-standings-body');
    const lastRaceTbody = document.getElementById('last-race-standings-body');
    const raceBannerEl = document.getElementById('last-race-banner');
    const raceSelectEl = document.getElementById('completed-race-select');
    if (!overallTbody && !lastRaceTbody) return;

    const rosters = await loadUserRosters();
    const validRosters = getValidRosters(rosters);

    if (validRosters.length === 0) {
        if (overallTbody) {
            overallTbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">No season-long fantasy standings available.</td>
                </tr>
            `;
        }
        if (lastRaceTbody) {
            lastRaceTbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">No completed race results available.</td>
                </tr>
            `;
        }
        return;
    }

    // Table B: Render Overall Season Fantasy Standings sorted by OverallRank ascending (fallback: TotalPoints descending)
    const sortedOverall = [...validRosters].sort((a, b) => {
        const rankA = Number(a.OverallRank) || 0;
        const rankB = Number(b.OverallRank) || 0;
        if (rankA > 0 && rankB > 0 && rankA !== rankB) return rankA - rankB;
        return (Number(b.TotalPoints) || 0) - (Number(a.TotalPoints) || 0);
    });

    const overallLeaderPts = Number(sortedOverall[0]?.TotalPoints) || 0;

    if (overallTbody) {
        overallTbody.innerHTML = sortedOverall.map((r, idx) => {
            const overallRank = Number(r.OverallRank) || (idx + 1);
            const totalPts = Number(r.TotalPoints) || 0;
            const totalPtsFormatted = totalPts.toLocaleString('en-US');
            const gapDisplay = formatGapDisplay(r.GapToLeader, overallRank, overallLeaderPts, totalPts);
            const wins = Number(r.Wins ?? 0) || 0;
            const lastRacePtsFormatted = (Number(r.LastRacePoints) || 0).toLocaleString('en-US');
            const priorRankDisplay = r.PriorRank !== undefined && r.PriorRank !== null && r.PriorRank !== ''
                ? r.PriorRank
                : '—';
            const trendBadge = formatMovementTrendBadge(r);

            return `
                <tr>
                    <td class="pos-cell">${overallRank}</td>
                    <td class="driver-cell">${r.Manager}</td>
                    <td class="pos-cell">${totalPtsFormatted}</td>
                    <td class="mono-cell">${gapDisplay}</td>
                    <td class="mono-cell">${wins}</td>
                    <td class="mono-cell">${lastRacePtsFormatted}</td>
                    <td class="mono-cell">${priorRankDisplay}</td>
                    <td>${trendBadge}</td>
                </tr>
            `;
        }).join('');
    }

    // 2. Populate Race Selector Dropdown from RaceScores (defaulting to LastRaceId)
    const { races, defaultKey } = extractCompletedRacesCatalog(validRosters);
    if (!selectedCompletedRaceKey || !races.some(rc => rc.key === selectedCompletedRaceKey)) {
        selectedCompletedRaceKey = defaultKey;
    }

    if (raceSelectEl && races.length > 0) {
        const optionsHtml = races.map(rc => {
            const isSelected = rc.key === selectedCompletedRaceKey ? ' selected' : '';
            const suffix = rc.key === defaultKey ? ' (Last Completed)' : '';
            return `<option value="${rc.key.replace(/"/g, '&quot;')}"${isSelected}>${rc.label}${suffix}</option>`;
        }).join('');
        if (raceSelectEl.innerHTML !== optionsHtml) {
            raceSelectEl.innerHTML = optionsHtml;
        }
        raceSelectEl.value = selectedCompletedRaceKey;
    }

    const activeRaceMeta = races.find(rc => rc.key === selectedCompletedRaceKey) || races[0] || null;
    if (raceBannerEl) {
        if (activeRaceMeta) {
            raceBannerEl.textContent = activeRaceMeta.label;
        } else {
            const sample = validRosters.find(r => r.LastRaceId || r.LastRaceName) || validRosters[0];
            const titlePart = [sample?.LastRaceId, sample?.LastRaceName].filter(Boolean).join(' ');
            raceBannerEl.textContent = sample?.LastRaceTrack
                ? `${titlePart} • ${sample.LastRaceTrack}`
                : (titlePart || 'Last Completed Race Results');
        }
    }

    // 3. Render Completed Race Results table sorted by LastRaceRank (when viewing default race) or race points descending
    if (lastRaceTbody) {
        const isViewingLastRace = !selectedCompletedRaceKey || selectedCompletedRaceKey === defaultKey;
        const cleanSelectedRaceId = String(selectedCompletedRaceKey ?? '').trim().match(/^(\d{4})/)?.[1] || String(selectedCompletedRaceKey ?? '').trim();
        const cachedPayload = cleanSelectedRaceId ? cachedRaceResultsMap.get(cleanSelectedRaceId) : null;
        const cachedMgrList = cachedPayload && Array.isArray(cachedPayload.managerResults) ? cachedPayload.managerResults : null;

        let raceRows = validRosters.map(r => {
            const entry = getManagerCompletedRaceEntry(r, selectedCompletedRaceKey, defaultKey);
            return {
                manager: r.Manager,
                points: entry.points,
                rawRank: entry.rank,
                rawGap: entry.gap
            };
        });

        const hasNonZeroPoints = raceRows.some(row => (Number(row.points) || 0) > 0);
        if (!hasNonZeroPoints && cachedMgrList && cachedMgrList.length > 0) {
            raceRows = cachedMgrList
                .map(m => ({
                    manager: String(m.Manager ?? m.manager ?? m.name ?? '').trim(),
                    points: Math.round(Number(String(m.Points ?? m.points ?? m.RacePoints ?? m.racePoints ?? m.Score ?? m.score ?? 0).replace(/,/g, '')) || 0),
                    rawRank: m.Rank ?? m.rank ?? m.Finish ?? m.finish ?? null,
                    rawGap: m.Gap ?? m.gap ?? m.GapToWinner ?? m.gapToWinner ?? null
                }))
                .filter(m => !isExcludedHelperManagerName(m.manager));
        }

        raceRows.sort((a, b) => {
            if (isViewingLastRace && a.rawRank && b.rawRank && a.rawRank !== b.rawRank) {
                return a.rawRank - b.rawRank;
            }
            if (b.points !== a.points) return b.points - a.points;
            return (a.rawRank || 999) - (b.rawRank || 999);
        });

        const raceLeaderPts = Number(raceRows[0]?.points) || 0;

        lastRaceTbody.innerHTML = raceRows.map((row, idx) => {
            const rank = (isViewingLastRace && row.rawRank) ? row.rawRank : (idx + 1);
            const ptsFormatted = (Number(row.points) || 0).toLocaleString('en-US');
            const gapDisplay = formatGapDisplay(isViewingLastRace ? row.rawGap : null, rank, raceLeaderPts, row.points);

            return `
                <tr>
                    <td class="pos-cell">${rank}</td>
                    <td class="driver-cell">${row.manager}</td>
                    <td class="pos-cell">${ptsFormatted}</td>
                    <td class="mono-cell">${gapDisplay}</td>
                </tr>
            `;
        }).join('');
    }
}

/**
 * Tab 5: Renders the Team Rosters / Selections tab (#team-rosters-container cards and #rosters-table-body table),
 * displaying only the valid managers returned by getRosters with their 10 drivers locked to their fixed
 * draft slot tiers (tiers.tier1, tiers.tier2, tiers.tier3, tiers.tier4) and 2 Teams.
 */
async function updateTeamRostersTab(raceData, stageData, pointsData) {
    const gridEl = document.getElementById('team-rosters-container') || document.getElementById('rosters-grid');
    const tableBodyEl = document.getElementById('rosters-table-body');
    if (!gridEl && !tableBodyEl) return;

    const rosters = await loadUserRosters();
    const validRosters = getValidRosters(rosters);
    const activeRosters = validRosters.map((r, idx) => {
        const drivers = Array.isArray(r.Drivers) ? r.Drivers.slice(0, 10).map(d => String(d ?? '').trim()) : parseListField(r.Drivers);
        const teams = Array.isArray(r.Teams) ? r.Teams.slice(0, 2).map(t => String(t ?? '').trim()) : parseListField(r.Teams);
        const totalPoints = Number(String(r.TotalPoints ?? r.totalPoints ?? 0).replace(/,/g, '')) || 0;
        const incomingTiers = r.tiers && typeof r.tiers === 'object' ? r.tiers : null;
        return {
            ...r,
            Manager: String(r.Manager ?? r.manager ?? 'Unknown Manager').trim(),
            Drivers: drivers,
            tiers: {
                tier1: Array.isArray(incomingTiers?.tier1) && incomingTiers.tier1.length > 0
                    ? incomingTiers.tier1.map(d => String(d ?? '').trim()).filter(Boolean)
                    : (drivers[0] ? [drivers[0]] : []),
                tier2: Array.isArray(incomingTiers?.tier2) && incomingTiers.tier2.length > 0
                    ? incomingTiers.tier2.map(d => String(d ?? '').trim()).filter(Boolean)
                    : drivers.slice(1, 4).filter(Boolean),
                tier3: Array.isArray(incomingTiers?.tier3) && incomingTiers.tier3.length > 0
                    ? incomingTiers.tier3.map(d => String(d ?? '').trim()).filter(Boolean)
                    : drivers.slice(4, 8).filter(Boolean),
                tier4: Array.isArray(incomingTiers?.tier4) && incomingTiers.tier4.length > 0
                    ? incomingTiers.tier4.map(d => String(d ?? '').trim()).filter(Boolean)
                    : drivers.slice(8, 10).filter(Boolean)
            },
            Teams: teams,
            TotalPoints: totalPoints,
            ColumnLetter: r.ColumnLetter || getExcelColumnLetter(FANTASY_SCORING_START_COL_INDEX + idx)
        };
    });

    if (activeRosters.length === 0) {
        if (gridEl) {
            gridEl.innerHTML = `
                <div class="table-card" style="grid-column: 1 / -1; padding: 28px; text-align: center; color: #6b7280;">
                    No rosters returned from <code>${APPS_SCRIPT_URL}?action=getRosters</code> (received <code>[]</code>). Verify the sheet tab name in Google Apps Script and redeploy.
                </div>
            `;
        }
        if (tableBodyEl) {
            tableBodyEl.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">No manager rosters returned from Google Apps Script backend.</td>
                </tr>
            `;
        }
        return;
    }

    const scoredVehicles = calculateVehicleFantasyScores(raceData, stageData, pointsData);

    const formatDriverPill = (driverEntry, rosterObj) => {
        const rawDriverStr = typeof driverEntry === 'object' && driverEntry !== null
            ? String(driverEntry.name || '').trim()
            : String(driverEntry || '').trim();
        if (!rawDriverStr) return '';

        const cleanDriverName = rawDriverStr.replace(/\s*\([^)]*pts[^)]*\)\s*$/i, '').trim() || rawDriverStr;
        const normDriver = normalizeName(cleanDriverName);
        const matchedVehicle = scoredVehicles.find(v =>
            normDriver && (v.normalizedName === normDriver || v.normalizedName.includes(normDriver) || normDriver.includes(v.normalizedName))
        );
        const explicitObjPts = (typeof driverEntry === 'object' && driverEntry !== null && Number.isFinite(Number(driverEntry.points ?? driverEntry.Points)))
            ? Math.round(Number(driverEntry.points ?? driverEntry.Points))
            : null;
        const officialDriverPts = explicitObjPts !== null
            ? explicitObjPts
            : resolveOfficialDriverPoints(rawDriverStr, rosterObj, matchedVehicle);
        const ptsBadgeHtml = `<span class="pill-pts">${officialDriverPts.toLocaleString('en-US')} pts</span>`;
        return `<span class="driver-pill"><span>${cleanDriverName}</span>${ptsBadgeHtml}</span>`;
    };

    const formatTeamPill = (teamEntry, rosterObj) => {
        const rawTeamStr = typeof teamEntry === 'object' && teamEntry !== null
            ? String(teamEntry.name || '').trim()
            : String(teamEntry || '').trim();
        if (!rawTeamStr) return '';

        const cleanTeamName = rawTeamStr
            .replace(/^🏁\s*/, '')
            .replace(/\s*\([^)]*pts[^)]*\)\s*$/i, '')
            .trim() || rawTeamStr;
        const explicitObjPts = (typeof teamEntry === 'object' && teamEntry !== null && Number.isFinite(Number(teamEntry.points ?? teamEntry.Points)))
            ? Math.round(Number(teamEntry.points ?? teamEntry.Points))
            : null;
        const officialTeamPts = explicitObjPts !== null
            ? explicitObjPts
            : resolveOfficialTeamPoints(rawTeamStr, rosterObj);
        const ptsBadgeHtml = `<span class="pill-pts">${officialTeamPts.toLocaleString('en-US')} pts</span>`;
        return `<span class="team-pill"><span>🏁 ${cleanTeamName}</span>${ptsBadgeHtml}</span>`;
    };

    const formatTierCell = (tierDrivers) => {
        if (!tierDrivers || tierDrivers.length === 0) return '--';
        return tierDrivers
            .map(d => (typeof d === 'object' && d !== null ? String(d.name || '').trim() : String(d || '').trim()))
            .filter(Boolean)
            .join(', ') || '--';
    };

    const formatTeamsCell = (teamsList, rosterObj) => {
        const validTeams = (teamsList || []).map(t => (typeof t === 'object' ? t.name : String(t || '').trim())).filter(Boolean);
        if (validTeams.length === 0) return '--';
        return validTeams.slice(0, 2).map(t => {
            const cleanT = String(t).replace(/^🏁\s*/, '').replace(/\s*\([^)]*pts[^)]*\)\s*$/i, '').trim() || t;
            const pts = resolveOfficialTeamPoints(t, rosterObj);
            return pts > 0 ? `${cleanT} (${pts.toLocaleString('en-US')} pts)` : cleanT;
        }).join(', ');
    };

    if (gridEl) {
        gridEl.innerHTML = activeRosters.map((r, idx) => {
            const colLetter = r.ColumnLetter || getExcelColumnLetter(FANTASY_SCORING_START_COL_INDEX + idx);
            const managerName = r.Manager || 'Unknown Manager';

            // Use fixed draft slot tiers (tiers.tier1, tiers.tier2, tiers.tier3, tiers.tier4)
            const tier1 = (r.tiers?.tier1 || []).filter(Boolean);
            const tier2 = (r.tiers?.tier2 || []).filter(Boolean);
            const tier3 = (r.tiers?.tier3 || []).filter(Boolean);
            const tier4 = (r.tiers?.tier4 || []).filter(Boolean);
            const validTeams = (r.Teams || []).filter(Boolean);

            const populatedDriversCount = tier1.length + tier2.length + tier3.length + tier4.length;
            const totalPointsFormatted = (Number(r.TotalPoints) || 0).toLocaleString('en-US');
            const rankPrefix = r.OverallRank ? `Rank #${r.OverallRank} • ` : '';
            const canEditThisRoster = canUserEditManagerRoster(managerName);
            const editBtnHtml = canEditThisRoster
                ? `<button type="button" class="edit-roster-inline-btn" onclick="loadManagerIntoForm('${managerName.replace(/'/g, "\\'")}')">Edit</button>`
                : (!currentAuthUser
                    ? `<button type="button" class="edit-roster-inline-btn" onclick="openAuthModal('login')">Sign In to Edit</button>`
                    : '');

            return `
                <article class="roster-card" data-manager="${managerName}" data-column="${colLetter}">
                    <div class="roster-card-header">
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            <span class="roster-manager-name">${managerName}</span>
                            <span class="metric-subtext" style="font-size: 0.72rem; color: #9ca3af;">${rankPrefix}${populatedDriversCount} / 10 Drivers • ${validTeams.length} / 2 Race Teams</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="roster-live-score">${totalPointsFormatted} Pts</span>
                            ${editBtnHtml}
                        </div>
                    </div>
                    <div class="roster-card-body">
                        <div class="tier-group">
                            <div class="tier-group-title">
                                <span>Tier 1 (Row 2)</span>
                                <span class="tier-badge">${tier1.length} / 1 Driver</span>
                            </div>
                            <div class="driver-pill-list">
                                ${tier1.map(d => formatDriverPill(d, r)).join('') || '<span class="metric-subtext">None selected</span>'}
                            </div>
                        </div>

                        <div class="tier-group">
                            <div class="tier-group-title">
                                <span>Tier 2 (Rows 3–5)</span>
                                <span class="tier-badge">${tier2.length} / 3 Drivers</span>
                            </div>
                            <div class="driver-pill-list">
                                ${tier2.map(d => formatDriverPill(d, r)).join('') || '<span class="metric-subtext">None selected</span>'}
                            </div>
                        </div>

                        <div class="tier-group">
                            <div class="tier-group-title">
                                <span>Tier 3 (Rows 6–9)</span>
                                <span class="tier-badge">${tier3.length} / 4 Drivers</span>
                            </div>
                            <div class="driver-pill-list">
                                ${tier3.map(d => formatDriverPill(d, r)).join('') || '<span class="metric-subtext">None selected</span>'}
                            </div>
                        </div>

                        <div class="tier-group">
                            <div class="tier-group-title">
                                <span>Tier 4 (Rows 10–11)</span>
                                <span class="tier-badge">${tier4.length} / 2 Drivers</span>
                            </div>
                            <div class="driver-pill-list">
                                ${tier4.map(d => formatDriverPill(d, r)).join('') || '<span class="metric-subtext">None selected</span>'}
                            </div>
                        </div>

                        <div class="tier-group">
                            <div class="tier-group-title">
                                <span>Selected Race Teams (Rows 12–13)</span>
                                <span class="tier-badge">${validTeams.length} / 2 Teams</span>
                            </div>
                            <div class="driver-pill-list">
                                ${validTeams.map(t => formatTeamPill(t, r)).filter(Boolean).join('') || '<span class="metric-subtext">None selected</span>'}
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    if (tableBodyEl) {
        tableBodyEl.innerHTML = activeRosters.map(r => {
            const managerName = r.Manager || 'Unknown Manager';
            const tier1 = (r.tiers?.tier1 || []).filter(Boolean);
            const tier2 = (r.tiers?.tier2 || []).filter(Boolean);
            const tier3 = (r.tiers?.tier3 || []).filter(Boolean);
            const tier4 = (r.tiers?.tier4 || []).filter(Boolean);
            const totalPointsFormatted = (Number(r.TotalPoints) || 0).toLocaleString('en-US');

            const canEditRow = canUserEditManagerRoster(managerName);
            const rowActionHtml = canEditRow
                ? `<button type="button" class="edit-roster-inline-btn" onclick="loadManagerIntoForm('${managerName.replace(/'/g, "\\'")}')">Edit Roster</button>`
                : (!currentAuthUser
                    ? `<button type="button" class="edit-roster-inline-btn" onclick="openAuthModal('login')">Sign In to Edit</button>`
                    : `<span class="mono-cell" style="font-size: 0.75rem; color: #9ca3af;">View Only</span>`);

            return `
                <tr>
                    <td class="driver-cell">${managerName}</td>
                    <td>${formatTierCell(tier1)}</td>
                    <td>${formatTierCell(tier2)}</td>
                    <td>${formatTierCell(tier3)}</td>
                    <td>${formatTierCell(tier4)}</td>
                    <td>${formatTeamsCell(r.Teams, r)}</td>
                    <td class="pos-cell">${totalPointsFormatted}</td>
                    <td>${rowActionHtml}</td>
                </tr>
            `;
        }).join('');
    }
}

/**
 * Season Schedule & Individual Race Results State
 */
let cachedSeasonSchedule = null;
let scheduleFetchPromise = null;
let cachedResultsSheetRows = null;
let resultsSheetFetchPromise = null;
const cachedRaceResultsMap = new Map();

/**
 * Derives the full 40-race Season Schedule directly from the valid managers' RaceScores array in getRosters.
 * Iterates through indices 0..39 (or all races present in RaceScores):
 * - raceNumber: index + 1
 * - raceId: race.raceId
 * - raceName: race.raceName
 * - trackName: race.trackName
 * - Calculates each manager's score for that race (mgr.RaceScores[index].points).
 * - If sum of manager points > 0, marks status = 'Completed', finds winningPoints, and lists top-scoring manager(s) as fantasyWinner.
 * - Otherwise marks status = 'Upcoming' and fantasyWinner = '—'.
 */
function deriveSeasonScheduleFromRosters(validRosters) {
    if (!Array.isArray(validRosters) || validRosters.length === 0) return [];

    const maxRaces = Math.max(
        0,
        ...validRosters.map(r => (Array.isArray(r.RaceScores) ? r.RaceScores.length : 0))
    );
    if (maxRaces === 0) return [];

    const scheduleCount = Math.max(maxRaces, Math.min(40, maxRaces));
    const derivedSchedule = [];

    for (let index = 0; index < scheduleCount; index++) {
        let raceId = '';
        let raceName = '';
        let trackName = '';

        for (const mgr of validRosters) {
            const raceObj = Array.isArray(mgr.RaceScores) ? mgr.RaceScores[index] : null;
            if (raceObj && typeof raceObj === 'object') {
                if (!raceId) raceId = String(raceObj.raceId ?? raceObj.RaceId ?? raceObj.id ?? '').trim();
                if (!raceName) raceName = String(raceObj.raceName ?? raceObj.RaceName ?? raceObj.name ?? '').trim();
                if (!trackName) trackName = String(raceObj.trackName ?? raceObj.TrackName ?? raceObj.track ?? raceObj.Track ?? '').trim();
                if (raceId && raceName && trackName) break;
            }
        }

        let sumPoints = 0;
        let winningPoints = 0;
        const managerScores = validRosters.map(mgr => {
            const raceObj = Array.isArray(mgr.RaceScores) ? mgr.RaceScores[index] : null;
            const pts = Number(
                String(raceObj?.points ?? raceObj?.Points ?? raceObj?.score ?? raceObj?.Score ?? 0).replace(/,/g, '')
            ) || 0;
            sumPoints += pts;
            if (pts > winningPoints) {
                winningPoints = pts;
            }
            return {
                manager: mgr.Manager,
                points: pts
            };
        });

        const isCompleted = sumPoints > 0;
        let fantasyWinner = '—';
        if (isCompleted && winningPoints > 0) {
            const topManagers = managerScores
                .filter(m => m.points === winningPoints)
                .map(m => m.manager);
            fantasyWinner = topManagers.join(', ');
        }

        // Sort manager standings for this race highest to lowest
        const sortedManagerResults = [...managerScores]
            .sort((a, b) => b.points - a.points)
            .map((m, idx) => ({
                rank: idx + 1,
                manager: m.manager,
                points: m.points,
                gap: idx === 0 ? '—' : `-${Math.max(0, winningPoints - m.points).toLocaleString('en-US')}`
            }));

        derivedSchedule.push({
            raceNumber: index + 1,
            raceId: raceId || String(index + 1),
            raceName: raceName || `Race ${index + 1}`,
            trackName: trackName || 'TBA',
            status: isCompleted ? 'Completed' : 'Upcoming',
            isCompleted,
            fantasyWinner: isCompleted ? fantasyWinner : '—',
            winningPoints: isCompleted ? winningPoints : 0,
            managerResults: sortedManagerResults
        });
    }

    return derivedSchedule;
}

/**
 * Loads the 40-race season schedule by deriving it directly from getRosters (RaceScores),
 * with a fallback to ${APPS_SCRIPT_URL}?action=getSchedule if RaceScores is not populated.
 */
async function loadSeasonSchedule(forceRefresh = false) {
    if (!currentAuthUser) return [];
    if (cachedSeasonSchedule && cachedSeasonSchedule.length > 0 && !forceRefresh) {
        return cachedSeasonSchedule;
    }
    if (scheduleFetchPromise && !forceRefresh) return scheduleFetchPromise;

    scheduleFetchPromise = (async () => {
        try {
            const rosters = await loadUserRosters(forceRefresh);
            const validRosters = getValidRosters(rosters);
            const derived = deriveSeasonScheduleFromRosters(validRosters);
            if (derived.length > 0) {
                cachedSeasonSchedule = derived;
                return cachedSeasonSchedule;
            }

            // Fallback: fetch ?action=getSchedule if RaceScores was not embedded in getRosters
            const res = await fetch(`${APPS_SCRIPT_URL}?action=getSchedule`);
            if (res.ok) {
                const rawData = await res.json();
                const rawList = Array.isArray(rawData)
                    ? rawData
                    : (rawData?.schedule || rawData?.races || rawData?.data || []);

                if (Array.isArray(rawList) && rawList.length > 0) {
                    cachedSeasonSchedule = rawList.map((item, idx) => {
                        const raceNumber = item.raceNumber ?? item.RaceNumber ?? item.race_number ?? (idx + 1);
                        const raceId = String(item.raceId ?? item.RaceId ?? item.race_id ?? '').trim();
                        const raceName = String(item.raceName ?? item.RaceName ?? item.race_name ?? item.name ?? '').trim();
                        const trackName = String(item.trackName ?? item.TrackName ?? item.track_name ?? item.track ?? '').trim();
                        const rawStatus = String(item.status ?? item.Status ?? '').trim();
                        const fantasyWinner = String(item.fantasyWinner ?? item.FantasyWinner ?? item.winner ?? '').trim();
                        const winningPoints = Number(String(item.winningPoints ?? item.WinningPoints ?? item.points ?? 0).replace(/,/g, '')) || 0;
                        const isCompleted = (
                            /^completed$/i.test(rawStatus) ||
                            item.isCompleted === true ||
                            item.completed === true ||
                            (Boolean(fantasyWinner && fantasyWinner !== '—' && fantasyWinner !== '--') && winningPoints > 0)
                        );

                        return {
                            raceNumber,
                            raceId,
                            raceName,
                            trackName,
                            status: isCompleted ? 'Completed' : 'Upcoming',
                            isCompleted,
                            fantasyWinner: isCompleted ? fantasyWinner : '—',
                            winningPoints: isCompleted ? winningPoints : 0,
                            managerResults: []
                        };
                    }).filter(r => r.raceId || r.raceName);
                }
            }
        } catch (err) {
            console.warn('Could not load season schedule:', err.message);
        } finally {
            scheduleFetchPromise = null;
        }

        if (!cachedSeasonSchedule) {
            cachedSeasonSchedule = [];
        }
        return cachedSeasonSchedule;
    })();

    return scheduleFetchPromise;
}

/**
 * Tab 6: Renders the 40-race Season Schedule table (#season-schedule-body) with:
 * RACE # | RACE ID | RACE NAME | TRACK | STATUS | FANTASY WINNER | RESULTS ('View Results →')
 */
async function updateSeasonScheduleTable(forceRefresh = false) {
    const tbody = document.getElementById('season-schedule-body');
    if (!tbody) return;

    const schedule = await loadSeasonSchedule(forceRefresh);

    if (!Array.isArray(schedule) || schedule.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">Loading 40-race Season Schedule from league rosters...</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = schedule.map((race, idx) => {
        const raceNumDisplay = race.raceNumber ?? (idx + 1);
        const raceIdDisplay = race.raceId || '—';
        const raceNameDisplay = race.raceName || 'TBA';
        const trackDisplay = race.trackName || 'TBA';

        const statusBadge = race.isCompleted
            ? '<span class="schedule-status-badge schedule-status-completed">Completed</span>'
            : '<span class="schedule-status-badge schedule-status-upcoming">Upcoming</span>';

        const winnerDisplay = (race.isCompleted && race.fantasyWinner && race.fantasyWinner !== '—')
            ? `🏆 <strong>${race.fantasyWinner}</strong> <span class="mono-cell">(${race.winningPoints.toLocaleString('en-US')} pts)</span>`
            : '—';

        const rawRaceKey = String(race.raceId || race.raceName || raceNumDisplay).trim();
        const escapedRaceId = rawRaceKey.replace(/'/g, "\\'");

        return `
            <tr class="schedule-race-row" style="cursor: pointer;" onclick="loadIndividualRaceResults('${escapedRaceId}')" title="Click to view full race results and NASCAR driver breakdown">
                <td class="pos-cell">${raceNumDisplay}</td>
                <td class="mono-cell">${raceIdDisplay}</td>
                <td class="driver-cell">${raceNameDisplay}</td>
                <td>${trackDisplay}</td>
                <td>${statusBadge}</td>
                <td>${winnerDisplay}</td>
                <td>
                    <button type="button" class="view-results-link-btn" onclick="event.stopPropagation(); loadIndividualRaceResults('${escapedRaceId}')">
                        View Results →
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Closes the Individual Race Results modal.
 */
function closeRaceResultsViewer() {
    const modalEl = document.getElementById('race-results-viewer-modal');
    if (modalEl) {
        modalEl.classList.add('hidden');
    }
}

window.closeRaceResultsViewer = closeRaceResultsViewer;

/**
 * Closes the Individual Race Results modal when clicking the dark backdrop outside the card.
 */
function handleRaceModalBackdropClick(event) {
    if (event && event.target && event.target.id === 'race-results-viewer-modal') {
        closeRaceResultsViewer();
    }
}

window.handleRaceModalBackdropClick = handleRaceModalBackdropClick;

/**
 * Fetches and caches the full Results sheet from ${APPS_SCRIPT_URL}?action=Results so it only fetches once,
 * and populates official driver/team points maps from any official points columns present in the sheet.
 */
async function fetchAllResultsSheetRows() {
    if (!currentAuthUser) return [];
    if (Array.isArray(cachedResultsSheetRows)) return cachedResultsSheetRows;
    if (resultsSheetFetchPromise) return resultsSheetFetchPromise;

    resultsSheetFetchPromise = (async () => {
        try {
            const res = await fetch(`${APPS_SCRIPT_URL}?action=Results`);
            if (res.ok) {
                const data = await res.json();
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    ingestBackendTeamPointsData(data);
                }
                const rows = Array.isArray(data)
                    ? data
                    : (Array.isArray(data?.results) ? data.results : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.driverResults) ? data.driverResults : null)));
                if (Array.isArray(rows)) {
                    cachedResultsSheetRows = rows;
                    // Populate official driver points and any explicit official team points columns from Results sheet rows
                    const driverTotalsAcc = new Map();
                    rows.forEach(row => {
                        if (!row || typeof row !== 'object') return;
                        const rId = String(row['Race ID'] ?? row['Race Id'] ?? row['race_id'] ?? row['RaceId'] ?? row['raceId'] ?? '').trim();
                        const dName = String(
                            row['Driver Name'] ?? row['Driver'] ?? row['Full Name'] ?? row['Name'] ??
                            row.driverName ?? row.DriverName ?? row.driver ?? row.Driver ?? row.name ?? ''
                        ).trim();
                        const rawDrvPts = row['Total Fantasy Point'] ?? row['Total Fantasy Points'] ?? row['Total Fantasy'] ??
                                          row['Fantasy Points'] ?? row['Fantasy Pts'] ?? row.totalFantasyPoint ?? row.TotalFantasyPoint ??
                                          row.totalFantasyPoints ?? row.fantasyPoints ?? null;
                        if (dName && rawDrvPts !== null && rawDrvPts !== undefined && String(rawDrvPts).trim() !== '') {
                            const ptsVal = parseWholeNumber(rawDrvPts, 0);
                            const normD = normalizeName(dName);
                            const acc = driverTotalsAcc.get(normD) || { name: dName, latestPts: 0, totalPts: 0, byRaceId: {} };
                            if (rId) acc.byRaceId[rId] = ptsVal;
                            if (ptsVal > 0) {
                                acc.latestPts = ptsVal;
                                acc.totalPts += ptsVal;
                            }
                            driverTotalsAcc.set(normD, acc);
                        }

                        const tName = String(row['Team'] ?? row['Team Name'] ?? row['Race Team'] ?? row.team ?? row.Team ?? row.teamName ?? '').trim();
                        const rawExplicitTeamPts = row['Team Points'] ?? row['Team Pts'] ?? row['Official Team Points'] ??
                                                   row.teamPoints ?? row.TeamPoints ?? row.teamPts ?? null;
                        if (tName && rawExplicitTeamPts !== null && rawExplicitTeamPts !== undefined && String(rawExplicitTeamPts).trim() !== '') {
                            const tPts = parseWholeNumber(rawExplicitTeamPts, 0);
                            upsertBackendTeamPointsEntry(tName, {
                                racePoints: tPts,
                                points: tPts,
                                byRaceId: rId ? { [rId]: tPts } : {}
                            });
                        }
                    });
                    driverTotalsAcc.forEach(acc => {
                        upsertBackendDriverPointsEntry(acc.name, {
                            racePoints: acc.latestPts,
                            totalPoints: acc.totalPts,
                            points: acc.latestPts || acc.totalPts,
                            byRaceId: acc.byRaceId
                        });
                    });
                    return cachedResultsSheetRows;
                }
            }
        } catch (err) {
            console.warn('Could not fetch ?action=Results sheet:', err.message);
        } finally {
            resultsSheetFetchPromise = null;
        }
        return [];
    })();

    return resultsSheetFetchPromise;
}

/**
 * Builds Fantasy Manager Standings AND Cumulative Standings (up through cleanRaceId)
 * immediately from the valid managers' RaceScores as an instant baseline/fallback.
 */
function buildManagerStandingsForRace(validRosters, cleanRaceId) {
    if (!Array.isArray(validRosters) || validRosters.length === 0) {
        return {
            raceName: '',
            trackName: '',
            isCompleted: false,
            winningPoints: 0,
            fantasyWinner: '—',
            rows: [],
            cumulativeRows: []
        };
    }

    let raceName = '';
    let trackName = '';
    let sumPoints = 0;
    let winningPoints = 0;
    let targetRaceIdx = -1;

    // Locate the index of cleanRaceId in RaceScores (matching by raceId, raceName, or 1-based raceNumber)
    for (const mgr of validRosters) {
        const rs = Array.isArray(mgr.RaceScores) ? mgr.RaceScores : [];
        const foundIdx = rs.findIndex((entry, idx) => {
            if (!entry || typeof entry !== 'object') return false;
            const id = String(entry.raceId ?? entry.RaceId ?? entry.id ?? '').trim();
            const name = String(entry.raceName ?? entry.RaceName ?? entry.name ?? '').trim();
            return id === cleanRaceId || name === cleanRaceId || String(idx + 1) === cleanRaceId;
        });
        if (foundIdx !== -1) {
            targetRaceIdx = foundIdx;
            const matched = rs[foundIdx];
            raceName = String(matched.raceName ?? matched.RaceName ?? matched.name ?? '').trim();
            trackName = String(matched.trackName ?? matched.TrackName ?? matched.track ?? matched.Track ?? '').trim();
            break;
        }
    }

    let maxCumulativePts = 0;

    const rawScores = validRosters.map(mgr => {
        const rs = Array.isArray(mgr.RaceScores) ? mgr.RaceScores : [];
        const matched = targetRaceIdx !== -1
            ? rs[targetRaceIdx]
            : rs.find(entry => entry && String(entry.raceId ?? entry.RaceId ?? entry.id ?? '').trim() === cleanRaceId);

        const pts = matched
            ? (Number(String(matched.points ?? matched.Points ?? matched.score ?? matched.Score ?? 0).replace(/,/g, '')) || 0)
            : (String(mgr.LastRaceId ?? '').trim() === cleanRaceId ? (Number(mgr.LastRacePoints) || 0) : 0);

        sumPoints += pts;
        if (pts > winningPoints) winningPoints = pts;

        // Compute cumulative points up through targetRaceIdx
        let cumulativePts = 0;
        if (targetRaceIdx !== -1 && rs.length > 0) {
            for (let i = 0; i <= targetRaceIdx; i++) {
                const rEntry = rs[i];
                cumulativePts += Number(String(rEntry?.points ?? rEntry?.Points ?? rEntry?.score ?? rEntry?.Score ?? 0).replace(/,/g, '')) || 0;
            }
        } else {
            cumulativePts = Number(mgr.TotalPoints) || 0;
        }
        if (cumulativePts > maxCumulativePts) maxCumulativePts = cumulativePts;

        return {
            manager: mgr.Manager,
            points: pts,
            cumulativePoints: cumulativePts
        };
    });

    const isCompleted = sumPoints > 0;
    const winners = isCompleted && winningPoints > 0
        ? rawScores.filter(m => m.points === winningPoints).map(m => m.manager)
        : [];
    const fantasyWinner = winners.length > 0 ? winners.join(', ') : '—';

    const rows = [...rawScores]
        .sort((a, b) => b.points - a.points)
        .map((m, idx) => ({
            rank: idx + 1,
            manager: m.manager,
            points: m.points,
            gap: idx === 0 ? '—' : `-${Math.max(0, winningPoints - m.points).toLocaleString('en-US')}`
        }));

    const cumulativeRows = [...rawScores]
        .sort((a, b) => b.cumulativePoints - a.cumulativePoints)
        .map((m, idx) => ({
            rank: idx + 1,
            manager: m.manager,
            cumulativePoints: m.cumulativePoints,
            gap: idx === 0 ? '—' : `-${Math.max(0, maxCumulativePts - m.cumulativePoints).toLocaleString('en-US')}`
        }));

    return {
        raceName,
        trackName,
        isCompleted,
        winningPoints,
        fantasyWinner,
        rows,
        cumulativeRows
    };
}

/**
 * Formats a driver's Fastest Lap cell from various possible sheet representations.
 */
function formatFastestLapCell(rawVal) {
    if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') return '—';
    if (typeof rawVal === 'boolean') return rawVal ? '⚡ Yes' : '—';
    const str = String(rawVal).trim();
    if (/^(false|no|0|none|-|—|n\/a)$/i.test(str)) return '—';
    if (/^(true|yes|1|fastest)$/i.test(str)) return '⚡ Yes';
    return str.includes('⚡') ? str : `⚡ ${str}`;
}

/**
 * Formats a driver's race Status cell with appropriate telemetry color classes.
 */
function formatDriverStatusCell(rawStatus) {
    const str = String(rawStatus ?? '').trim() || 'Running';
    if (/^running$/i.test(str)) {
        return `<span class="driver-status-badge driver-status-running">● ${str}</span>`;
    }
    return `<span class="driver-status-badge driver-status-dnf">○ ${str}</span>`;
}

/**
 * Parses a numeric value from a sheet cell and rounds it to a whole number.
 */
function parseWholeNumber(rawVal, fallback = 0) {
    if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') return fallback;
    const cleaned = String(rawVal).replace(/,/g, '').trim();
    const num = Number(cleaned);
    return Number.isFinite(num) ? Math.round(num) : fallback;
}

/**
 * Formats a rank number into an ordinal label (1st, 2nd, 3rd, 4th, etc.).
 */
function formatOrdinalRank(rawRank, fallbackIndex = 0) {
    if (typeof rawRank === 'string' && /^\d+(st|nd|rd|th)$/i.test(rawRank.trim())) {
        return rawRank.trim();
    }
    const n = Math.round(Number(String(rawRank ?? '').replace(/[^\d]/g, ''))) || (fallbackIndex + 1);
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
    switch (n % 10) {
        case 1: return `${n}st`;
        case 2: return `${n}nd`;
        case 3: return `${n}rd`;
        default: return `${n}th`;
    }
}

/**
 * Formats an official team average points value to 2 decimal places.
 */
function formatTeamAveragePointsDisplay(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return '0.00';
    return num.toFixed(2);
}

/**
 * Toggles between the "Driver Points" and "Team Points (Car Averages)" subtabs inside the Race Results modal.
 */
function switchRaceModalSubtab(subtabId, event) {
    const targetSubtab = String(subtabId ?? 'driver-points').trim();
    document.querySelectorAll('.modal-subtab-btn').forEach(btn => {
        const isMatch = btn.getAttribute('data-modal-subtab') === targetSubtab;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    const driverPanel = document.getElementById('modal-subtab-driver-points');
    const teamPanel = document.getElementById('modal-subtab-team-points');

    if (driverPanel) {
        driverPanel.classList.toggle('active', targetSubtab === 'driver-points');
    }
    if (teamPanel) {
        teamPanel.classList.toggle('active', targetSubtab === 'team-points');
    }
}

window.switchRaceModalSubtab = switchRaceModalSubtab;

/**
 * Formats a team's Driving Lineup / Breakdown cell showing each driver on that team and their individual points in that race.
 */
function formatTeamLineupBreakdownHtml(rawLineup, matchingDriversForTeam = []) {
    const renderDriverChip = (name, pts, finishPos = null) => {
        const cleanName = String(name ?? '').trim();
        if (!cleanName) return '';
        const ptsNum = Number(String(pts ?? '').replace(/[^\d.-]/g, ''));
        const hasPts = pts !== undefined && pts !== null && String(pts).trim() !== '' && Number.isFinite(ptsNum);
        const posPrefix = finishPos && Number.isFinite(Number(finishPos)) ? `P${finishPos} • ` : '';
        const ptsHtml = hasPts
            ? `<span class="pill-pts">${posPrefix}${Math.round(ptsNum).toLocaleString('en-US')} pts</span>`
            : '';
        return `<span class="driver-pill" style="margin: 2px 4px 2px 0;"><span>${cleanName}</span>${ptsHtml}</span>`;
    };

    // 1. Array of driver objects or strings from teamResults
    if (Array.isArray(rawLineup) && rawLineup.length > 0) {
        const chips = rawLineup.map(item => {
            if (typeof item === 'string') {
                const str = item.trim();
                if (!str) return '';
                const inlineMatch = str.match(/^(.+?)\s*\(([+-]?\d+(?:,\d{3})*(?:\.\d+)?)\s*pts?\)$/i) ||
                                    str.match(/^(.+?)\s*[:–-]\s*([+-]?\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:pts?)?$/i);
                if (inlineMatch) {
                    return renderDriverChip(inlineMatch[1], inlineMatch[2]);
                }
                const matchedDrv = matchingDriversForTeam.find(d => normalizeName(d.driverName) === normalizeName(str));
                if (matchedDrv) {
                    return renderDriverChip(matchedDrv.driverName, matchedDrv.totalFantasyPts, matchedDrv.finishPos);
                }
                return `<span class="driver-pill" style="margin: 2px 4px 2px 0;"><span>${str}</span></span>`;
            }
            if (item && typeof item === 'object') {
                const dName = item.driverName ?? item.DriverName ?? item['Driver Name'] ?? item.driver ?? item.Driver ?? item.name ?? item.Name ?? '';
                const dPts = item.totalFantasyPoints ?? item.TotalFantasyPoints ?? item['Total Fantasy Point'] ??
                             item.fantasyPoints ?? item.FantasyPoints ?? item.points ?? item.Points ?? item.score ?? item.Score;
                const dPos = item.finishPos ?? item.Finish ?? item.Pos ?? item.pos ?? item.position ?? null;
                return renderDriverChip(dName, dPts, dPos);
            }
            return '';
        }).filter(Boolean);

        if (chips.length > 0) {
            return `<div class="driver-pill-list" style="gap: 4px;">${chips.join('')}</div>`;
        }
    }

    // 2. String representation from teamResults (e.g., "Tyler Reddick (55 pts), Bubba Wallace (42 pts)")
    if (typeof rawLineup === 'string' && rawLineup.trim() !== '') {
        const rawStr = rawLineup.trim();
        const parts = rawStr.split(/\s*(?:,|;|•|\||\/)\s*/).filter(Boolean);
        if (parts.length > 0) {
            const chips = parts.map(part => {
                const m = part.match(/^(.+?)\s*\((?:P(\d+)\s*[•,-]?\s*)?([+-]?\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:pts?)?\)$/i) ||
                          part.match(/^(.+?)\s*[:–-]\s*([+-]?\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:pts?)?$/i);
                if (m) {
                    if (m.length === 4) {
                        return renderDriverChip(m[1], m[3], m[2]);
                    }
                    return renderDriverChip(m[1], m[2]);
                }
                const matchedDrv = matchingDriversForTeam.find(d => normalizeName(d.driverName) === normalizeName(part));
                if (matchedDrv) {
                    return renderDriverChip(matchedDrv.driverName, matchedDrv.totalFantasyPts, matchedDrv.finishPos);
                }
                return `<span class="driver-pill" style="margin: 2px 4px 2px 0;"><span>${part}</span></span>`;
            }).filter(Boolean);

            if (chips.length > 0) {
                return `<div class="driver-pill-list" style="gap: 4px;">${chips.join('')}</div>`;
            }
        }
        return rawStr;
    }

    // 3. Fallback: Build from matchingDriversForTeam in driverResults
    if (Array.isArray(matchingDriversForTeam) && matchingDriversForTeam.length > 0) {
        const sortedTeamDrivers = [...matchingDriversForTeam].sort((a, b) => b.totalFantasyPts - a.totalFantasyPts);
        const chips = sortedTeamDrivers.map(d => renderDriverChip(d.driverName, d.totalFantasyPts, d.finishPos)).filter(Boolean);
        if (chips.length > 0) {
            return `<div class="driver-pill-list" style="gap: 4px;">${chips.join('')}</div>`;
        }
    }

    return '—';
}

/**
 * Opens the Individual Race Results Viewer for raceId and fetches ${APPS_SCRIPT_URL}?action=getRaceResults&race_id=${raceId},
 * rendering four tables:
 * - Table 1: Fantasy Race Results (managerResults: Rank, Manager, Points, Gap)
 * - Table 2: Overall Season Standings As of This Race (cumulativeStandings: Rank, Manager, Cumulative Points, Gap to Leader)
 * - Table 3: Driver Points Table — Official NASCAR Race Results (driverResults: Start, Finish, Driver Name, Team, Laps, Laps Led, Fastest Lap, Status, Race Pts, Stage Pts, Subtotal, Bonus Pts, Total Fantasy Points)
 * - Table 4: Team Points Table — Companion Team Scoring (teamResults: Rank, Team, Cars, Total Team Pts, Average Pts, Driving Lineup / Breakdown)
 */
async function loadIndividualRaceResults(raceId, options = { openModal: true }) {
    const cleanRaceId = String(raceId ?? '').trim();
    if (!cleanRaceId) return null;

    const modalEl = document.getElementById('race-results-viewer-modal');
    const titleEl = document.getElementById('race-results-modal-title');
    const subtitleEl = document.getElementById('race-results-modal-subtitle');
    const winnerBadgeEl = document.getElementById('race-results-winner-badge');
    const managerTbody = document.getElementById('modal-manager-results-body');
    const cumulativeTbody = document.getElementById('modal-cumulative-standings-body');
    const driverTbody = document.getElementById('modal-driver-results-body');
    const teamTbody = document.getElementById('modal-team-results-body');

    if (options.openModal !== false && modalEl) {
        modalEl.classList.remove('hidden');
    }

    // 1. Immediately render baseline Table 1 & Table 2 from getRosters RaceScores while fetching getRaceResults
    const rosters = await loadUserRosters();
    const validRosters = getValidRosters(rosters);
    const scheduleMatch = (cachedSeasonSchedule || []).find(s => String(s.raceId).trim() === cleanRaceId);
    const derivedManagerData = buildManagerStandingsForRace(validRosters, cleanRaceId);

    const renderManagerRowsHtml = (rows, leaderPts) => rows.map((row, idx) => {
        const rank = Number(row.rank) || (idx + 1);
        const pts = Math.round(Number(row.points) || 0);
        const gapDisplay = formatGapDisplay(row.gap, rank, leaderPts, pts);
        return `
            <tr>
                <td class="pos-cell">${rank}</td>
                <td class="driver-cell">${row.manager}</td>
                <td class="pos-cell num-col">${pts.toLocaleString('en-US')}</td>
                <td class="mono-cell num-col">${gapDisplay}</td>
            </tr>
        `;
    }).join('');

    const renderCumulativeRowsHtml = (rows, leaderCumPts) => rows.map((row, idx) => {
        const rank = Number(row.rank) || (idx + 1);
        const cumPts = Math.round(Number(row.cumulativePoints) || 0);
        const gapDisplay = formatGapDisplay(row.gap, rank, leaderCumPts, cumPts);
        return `
            <tr>
                <td class="pos-cell">${rank}</td>
                <td class="driver-cell">${row.manager}</td>
                <td class="pos-cell num-col">${cumPts.toLocaleString('en-US')}</td>
                <td class="mono-cell num-col">${gapDisplay}</td>
            </tr>
        `;
    }).join('');

    let displayRaceName = derivedManagerData.raceName || scheduleMatch?.raceName || `Race ${cleanRaceId}`;
    let displayTrackName = derivedManagerData.trackName || scheduleMatch?.trackName || '';
    let displayWinner = derivedManagerData.fantasyWinner !== '—'
        ? derivedManagerData.fantasyWinner
        : (scheduleMatch?.fantasyWinner || '—');
    let displayWinPts = derivedManagerData.winningPoints || scheduleMatch?.winningPoints || 0;

    const updateModalHeader = () => {
        if (titleEl) {
            titleEl.textContent = displayTrackName
                ? `${displayRaceName} at ${displayTrackName} (Race ID: ${cleanRaceId})`
                : `${displayRaceName} (Race ID: ${cleanRaceId})`;
        }
        if (subtitleEl) {
            subtitleEl.textContent = displayTrackName
                ? `${cleanRaceId} ${displayRaceName} • ${displayTrackName}`
                : `Race ID: ${cleanRaceId} • ${displayRaceName}`;
        }
        if (winnerBadgeEl) {
            if (displayWinner && displayWinner !== '—' && displayWinPts > 0) {
                winnerBadgeEl.textContent = `🏆 Fantasy Winner: ${displayWinner} (${Math.round(displayWinPts).toLocaleString('en-US')} pts)`;
            } else {
                winnerBadgeEl.textContent = '○ Upcoming Race';
            }
        }
    };

    updateModalHeader();

    if (managerTbody && derivedManagerData.rows.length > 0) {
        managerTbody.innerHTML = renderManagerRowsHtml(derivedManagerData.rows, derivedManagerData.winningPoints);
    }
    if (cumulativeTbody && derivedManagerData.cumulativeRows.length > 0) {
        const topCum = Number(derivedManagerData.cumulativeRows[0]?.cumulativePoints) || 0;
        cumulativeTbody.innerHTML = renderCumulativeRowsHtml(derivedManagerData.cumulativeRows, topCum);
    }
    if (driverTbody) {
        driverTbody.innerHTML = `<tr><td colspan="13" class="empty-state">Fetching Official NASCAR Race Results for Race ${cleanRaceId}...</td></tr>`;
    }
    if (teamTbody) {
        teamTbody.innerHTML = `<tr><td colspan="6" class="empty-state">Fetching Official Team Points Breakdown for Race ${cleanRaceId}...</td></tr>`;
    }

    // 2. Fetch ${APPS_SCRIPT_URL}?action=getRaceResults&race_id=${raceId}
    try {
        let racePayload = cachedRaceResultsMap.get(cleanRaceId);
        if (!racePayload) {
            const res = await fetch(`${APPS_SCRIPT_URL}?action=getRaceResults&race_id=${encodeURIComponent(cleanRaceId)}`);
            if (res.ok) {
                racePayload = await res.json();
                cachedRaceResultsMap.set(cleanRaceId, racePayload);
            }
        }

        if (racePayload && typeof racePayload === 'object') {
            if (racePayload.teamResults || racePayload.teamPoints || racePayload.TeamPoints || racePayload['Team Points'] || racePayload.teams) {
                ingestBackendTeamPointsData(
                    racePayload.teamResults || racePayload.teamPoints || racePayload.TeamPoints || racePayload['Team Points'] || racePayload.teams
                );
            }
            const raceMeta = racePayload.raceMeta || racePayload.meta || racePayload.race || {};
            if (raceMeta.raceName || racePayload.raceName) {
                displayRaceName = String(raceMeta.raceName ?? racePayload.raceName).trim();
            }
            if (raceMeta.trackName || racePayload.trackName) {
                displayTrackName = String(raceMeta.trackName ?? racePayload.trackName).trim();
            }

            // Table 1: Update from payload.managerResults if provided
            const rawManagerResults = Array.isArray(racePayload.managerResults)
                ? racePayload.managerResults
                : (Array.isArray(racePayload.managers) ? racePayload.managers : []);

            if (rawManagerResults.length > 0 && managerTbody) {
                const filteredManagers = rawManagerResults
                    .map(m => ({
                        manager: String(m.Manager ?? m.manager ?? m.name ?? '').trim(),
                        points: Math.round(Number(String(m.Points ?? m.points ?? m.RacePoints ?? m.racePoints ?? m.Score ?? m.score ?? 0).replace(/,/g, '')) || 0),
                        rank: m.Rank ?? m.rank ?? m.Finish ?? m.finish ?? null,
                        gap: m.Gap ?? m.gap ?? m.GapToWinner ?? m.gapToWinner ?? null
                    }))
                    .filter(m => !isExcludedHelperManagerName(m.manager));

                filteredManagers.sort((a, b) => {
                    const rA = Number(a.rank) || 0;
                    const rB = Number(b.rank) || 0;
                    if (rA > 0 && rB > 0 && rA !== rB) return rA - rB;
                    return b.points - a.points;
                });

                if (filteredManagers.length > 0) {
                    const leaderPts = Number(filteredManagers[0]?.points) || 0;
                    if (leaderPts > 0) {
                        displayWinPts = leaderPts;
                        const winners = filteredManagers.filter(m => m.points === leaderPts).map(m => m.manager);
                        if (winners.length > 0) displayWinner = winners.join(', ');
                    }
                    managerTbody.innerHTML = renderManagerRowsHtml(filteredManagers, leaderPts);
                }
            }

            // Table 2: Update from payload.cumulativeStandings if provided
            const rawCumulative = Array.isArray(racePayload.cumulativeStandings)
                ? racePayload.cumulativeStandings
                : (Array.isArray(racePayload.seasonStandings) ? racePayload.seasonStandings : (Array.isArray(racePayload.overallStandings) ? racePayload.overallStandings : []));

            if (rawCumulative.length > 0 && cumulativeTbody) {
                const filteredCumulative = rawCumulative
                    .map(c => ({
                        manager: String(c.Manager ?? c.manager ?? c.name ?? '').trim(),
                        cumulativePoints: Math.round(Number(String(
                            c.CumulativePoints ?? c.cumulativePoints ?? c.TotalPoints ?? c.totalPoints ?? c.Points ?? c.points ?? c.Score ?? c.score ?? 0
                        ).replace(/,/g, '')) || 0),
                        rank: c.Rank ?? c.rank ?? c.OverallRank ?? c.overallRank ?? null,
                        gap: c.Gap ?? c.gap ?? c.GapToLeader ?? c.gapToLeader ?? null
                    }))
                    .filter(c => !isExcludedHelperManagerName(c.manager));

                filteredCumulative.sort((a, b) => {
                    const rA = Number(a.rank) || 0;
                    const rB = Number(b.rank) || 0;
                    if (rA > 0 && rB > 0 && rA !== rB) return rA - rB;
                    return b.cumulativePoints - a.cumulativePoints;
                });

                if (filteredCumulative.length > 0) {
                    const topCumPts = Number(filteredCumulative[0]?.cumulativePoints) || 0;
                    cumulativeTbody.innerHTML = renderCumulativeRowsHtml(filteredCumulative, topCumPts);
                }
            }

            updateModalHeader();
        }

        // Table 3: Driver Points Table — Official NASCAR Race Results (driverResults from getRaceResults or ?action=Results)
        let matchingDriverRows = [];
        if (racePayload) {
            const payloadDrivers = Array.isArray(racePayload)
                ? racePayload
                : (racePayload.driverResults || racePayload.drivers || racePayload.results || []);
            if (Array.isArray(payloadDrivers) && payloadDrivers.length > 0) {
                matchingDriverRows = payloadDrivers;
            }
        }

        if (matchingDriverRows.length === 0) {
            const allResultsRows = await fetchAllResultsSheetRows();
            if (Array.isArray(allResultsRows) && allResultsRows.length > 0) {
                matchingDriverRows = allResultsRows.filter(row => {
                    if (!row || typeof row !== 'object') return false;
                    const rowRaceId = String(
                        row['Race ID'] ?? row['Race Id'] ?? row['race_id'] ?? row['RaceId'] ?? row['raceId'] ?? row['ID'] ?? ''
                    ).trim();
                    return rowRaceId === cleanRaceId;
                });
            }
        }

        const normalizedDrivers = matchingDriverRows.map((d, idx) => {
            const rawStart = d['Start'] ?? d['Starting Position'] ?? d['Start Pos'] ?? d['Start Position'] ??
                             d.start ?? d.Start ?? d.startingPosition ?? d.StartingPosition ?? d.starting_position ?? d.startPos;
            const hasExplicitStart = rawStart !== undefined && rawStart !== null && String(rawStart).trim() !== '';
            const startPosDisplay = hasExplicitStart
                ? Math.round(Number(String(rawStart).replace(/[^\d.-]/g, '')) || 0) || String(rawStart).trim()
                : '—';

            const rawFinish = d['Pos'] ?? d['Position'] ?? d['Finish Position'] ?? d['Finish'] ?? d['Finishing Position'] ??
                              d.pos ?? d.Pos ?? d.position ?? d.Position ?? d.finishPosition ?? d.FinishPosition ?? d.finish ?? d.running_position;
            const hasExplicitFinish = rawFinish !== undefined && rawFinish !== null && String(rawFinish).trim() !== '';
            const finishPos = hasExplicitFinish
                ? (Math.round(Number(String(rawFinish).replace(/[^\d.-]/g, ''))) || (idx + 1))
                : (idx + 1);

            const driverName = String(
                d['Driver Name'] ?? d['Driver'] ?? d['Full Name'] ?? d['Name'] ??
                d.driverName ?? d.DriverName ?? d.driver ?? d.Driver ?? d.full_name ?? d.name ?? 'Unknown Driver'
            ).trim();
            const normDriver = normalizeName(driverName);

            const teamName = String(
                d['Team'] ?? d['Race Team'] ?? d['Team Name'] ?? d['Owner'] ??
                d.team ?? d.Team ?? d.teamName ?? d.TeamName ?? d.team_name ?? d.owner ??
                cachedDriverTeamMap[normDriver] ?? '—'
            ).trim() || '—';

            const rawLaps = d['Laps'] ?? d['Laps Completed'] ?? d['Laps Run'] ??
                            d.laps ?? d.Laps ?? d.lapsCompleted ?? d.LapsCompleted ?? d.laps_completed;
            const lapsDisplay = rawLaps !== undefined && rawLaps !== null && String(rawLaps).trim() !== ''
                ? parseWholeNumber(rawLaps, 0).toLocaleString('en-US')
                : '—';

            const rawLapsLed = d['Laps Led'] ?? d['Led'] ?? d['LapsLed'] ??
                               d.lapsLed ?? d.LapsLed ?? d.laps_led ?? d.led;
            const lapsLedVal = parseWholeNumber(rawLapsLed, 0);
            const lapsLedDisplay = lapsLedVal.toLocaleString('en-US');

            const rawFastestLap = d['Best Lap'] ?? d['Fastest Lap'] ?? d['Fast Lap'] ?? d['FastestLap'] ?? d['BestLap'] ??
                                  d.bestLap ?? d.BestLap ?? d.fastestLap ?? d.FastestLap ?? d.fastLap ?? d.FastLap ?? d.fastest_lap ?? d.best_lap_time;
            const fastestLapDisplay = formatFastestLapCell(rawFastestLap);

            const rawStatus = d['Status'] ?? d['Vehicle Status'] ?? d['Result Status'] ??
                              d.status ?? d.Status ?? 'Running';
            const statusHtml = formatDriverStatusCell(rawStatus);

            // Race Pts (position points from race finish)
            const rawRacePts = d['Race Pts'] ?? d['Race Points'] ?? d['Position Pts'] ?? d['Finish Pts'] ??
                               d.racePts ?? d.RacePts ?? d.racePoints ?? d.RacePoints ?? d.positionPts;
            const racePts = rawRacePts !== undefined && rawRacePts !== null && String(rawRacePts).trim() !== ''
                ? parseWholeNumber(rawRacePts, getPositionPoints(finishPos))
                : getPositionPoints(finishPos);

            // Stage Pts (Pts Stage 1 + Pts Stage 2 + Pts Stage 3 combined stage points, or direct Stage Pts column)
            const rawCombinedStagePts = d['Stage Pts'] ?? d['Stage Points'] ?? d['Total Stage Pts'] ??
                                        d.stagePts ?? d.StagePts ?? d.stagePoints ?? d.StagePoints;
            const s1Pts = parseWholeNumber(d['Pts Stage 1'] ?? d['Stage 1 Pts'] ?? d['Stage 1'] ?? d.ptsStage1 ?? d.PtsStage1 ?? d.stage1Pts ?? d.stage1, 0);
            const s2Pts = parseWholeNumber(d['Pts Stage 2'] ?? d['Stage 2 Pts'] ?? d['Stage 2'] ?? d.ptsStage2 ?? d.PtsStage2 ?? d.stage2Pts ?? d.stage2, 0);
            const s3Pts = parseWholeNumber(d['Pts Stage 3'] ?? d['Stage 3 Pts'] ?? d['Stage 3'] ?? d.ptsStage3 ?? d.PtsStage3 ?? d.stage3Pts ?? d.stage3, 0);
            const summedStagePts = s1Pts + s2Pts + s3Pts;
            const stagePts = (rawCombinedStagePts !== undefined && rawCombinedStagePts !== null && String(rawCombinedStagePts).trim() !== '')
                ? parseWholeNumber(rawCombinedStagePts, summedStagePts)
                : summedStagePts;

            // Subtotal (Race Pts + Stage Pts)
            const rawSubtotal = d['Subtotal'] ?? d['Sub Total'] ?? d['Race + Stage Pts'] ??
                                d.subtotal ?? d.Subtotal ?? d.subTotal;
            const subtotalPts = (rawSubtotal !== undefined && rawSubtotal !== null && String(rawSubtotal).trim() !== '')
                ? parseWholeNumber(rawSubtotal, racePts + stagePts)
                : (racePts + stagePts);

            // Total Fantasy (Total Fantasy Point)
            const rawTotalFantasy = d['Total Fantasy Point'] ?? d['Total Fantasy Points'] ?? d['Total Fantasy'] ?? d['Fantasy Points'] ?? d['Fantasy Pts'] ?? d['Total Points'] ?? d['Points'] ??
                                    d.totalFantasyPoint ?? d.TotalFantasyPoint ?? d.totalFantasyPoints ?? d.TotalFantasyPoints ??
                                    d.fantasyPoints ?? d.FantasyPoints ?? d.totalPoints ?? d.points ?? d.score;

            // Bonus Pts (Bonus Pts / Fastest Pit bonuses for starting 1st, leading laps, most laps led)
            const rawBonusPts = d['Bonus Pts'] ?? d['Bonus Points'] ?? d['Bonus'] ??
                                d.bonusPts ?? d.BonusPts ?? d.bonusPoints ?? d.BonusPoints ?? d.bonus;
            const rawFastestPit = d['Fastest Pit'] ?? d['Fastest Pit Bonus'] ?? d['Pit Bonus'] ??
                                  d.fastestPit ?? d.FastestPit ?? d.fastestPitBonus ?? 0;
            const rawPoleBonus = d['Pole Bonus'] ?? d['Start 1st Bonus'] ?? d.poleBonus ?? 0;
            const rawLedBonus = d['Laps Led Bonus'] ?? d['Lead Lap Bonus'] ?? d.lapsLedBonus ?? 0;
            const rawMostLedBonus = d['Most Laps Led Bonus'] ?? d['Most Led Bonus'] ?? d.mostLapsLedBonus ?? 0;

            let bonusPts = 0;
            if (rawBonusPts !== undefined && rawBonusPts !== null && String(rawBonusPts).trim() !== '') {
                bonusPts = parseWholeNumber(rawBonusPts, 0) + parseWholeNumber(rawFastestPit, 0);
            } else {
                const componentBonuses = parseWholeNumber(rawFastestPit, 0) +
                                         parseWholeNumber(rawPoleBonus, 0) +
                                         parseWholeNumber(rawLedBonus, 0) +
                                         parseWholeNumber(rawMostLedBonus, 0);
                if (componentBonuses > 0) {
                    bonusPts = componentBonuses;
                } else if (rawTotalFantasy !== undefined && rawTotalFantasy !== null && String(rawTotalFantasy).trim() !== '') {
                    const parsedTotal = parseWholeNumber(rawTotalFantasy, subtotalPts);
                    bonusPts = Math.max(0, parsedTotal - subtotalPts);
                }
            }

            const totalFantasyPts = (rawTotalFantasy !== undefined && rawTotalFantasy !== null && String(rawTotalFantasy).trim() !== '')
                ? parseWholeNumber(rawTotalFantasy, subtotalPts + bonusPts)
                : (subtotalPts + bonusPts);

            return {
                startPosDisplay,
                finishPos,
                hasExplicitFinish,
                driverName,
                teamName,
                lapsDisplay,
                lapsLedDisplay,
                fastestLapDisplay,
                statusHtml,
                racePts,
                stagePts,
                subtotalPts,
                bonusPts,
                totalFantasyPts
            };
        });

        // Sort Driver Points Table by Finish Position ascending (fallback: Total Fantasy Points descending)
        normalizedDrivers.sort((a, b) => {
            if (a.hasExplicitFinish && b.hasExplicitFinish && a.finishPos !== b.finishPos) {
                return a.finishPos - b.finishPos;
            }
            if (b.totalFantasyPts !== a.totalFantasyPts) {
                return b.totalFantasyPts - a.totalFantasyPts;
            }
            return a.finishPos - b.finishPos;
        });

        if (driverTbody) {
            if (normalizedDrivers.length === 0) {
                driverTbody.innerHTML = `
                    <tr>
                        <td colspan="13" class="empty-state">
                            ${derivedManagerData.isCompleted
                                ? `No official NASCAR driver rows found in the Results sheet for Race ID ${cleanRaceId}.`
                                : `Upcoming race (Race ID ${cleanRaceId}) — official NASCAR race results will appear once the race is completed.`}
                        </td>
                    </tr>
                `;
            } else {
                driverTbody.innerHTML = normalizedDrivers.map((d, idx) => `
                    <tr>
                        <td class="mono-cell num-col">${d.startPosDisplay}</td>
                        <td class="pos-cell num-col">${d.hasExplicitFinish ? d.finishPos : (idx + 1)}</td>
                        <td class="driver-cell">${d.driverName}</td>
                        <td>${d.teamName}</td>
                        <td class="mono-cell num-col">${d.lapsDisplay}</td>
                        <td class="mono-cell num-col">${d.lapsLedDisplay}</td>
                        <td class="mono-cell">${d.fastestLapDisplay}</td>
                        <td>${d.statusHtml}</td>
                        <td class="mono-cell num-col">${d.racePts.toLocaleString('en-US')}</td>
                        <td class="mono-cell num-col">${d.stagePts.toLocaleString('en-US')}</td>
                        <td class="mono-cell num-col">${d.subtotalPts.toLocaleString('en-US')}</td>
                        <td class="mono-cell num-col">${d.bonusPts.toLocaleString('en-US')}</td>
                        <td class="pos-cell num-col highlighted-pts-col">${d.totalFantasyPts.toLocaleString('en-US')}</td>
                    </tr>
                `).join('');
            }
        }

        // Table 4: Companion Team Points Table (teamResults from getRaceResults sorted by AveragePoints descending)
        if (teamTbody) {
            const rawTeamResults = (racePayload && typeof racePayload === 'object')
                ? (racePayload.teamResults ||
                   racePayload.TeamResults ||
                   racePayload.team_results ||
                   racePayload.teamPoints ||
                   racePayload.TeamPoints ||
                   racePayload['Team Points'] ||
                   racePayload.teams ||
                   [])
                : [];

            // Group normalizedDrivers by teamName so we can enrich or derive teamResults when needed
            const driversByNormTeam = new Map();
            normalizedDrivers.forEach(d => {
                const tClean = String(d.teamName ?? '').trim();
                if (!tClean || tClean === '—' || /^independent$/i.test(tClean)) return;
                const normT = normalizeName(tClean);
                if (!normT) return;
                if (!driversByNormTeam.has(normT)) {
                    driversByNormTeam.set(normT, { teamName: tClean, drivers: [] });
                }
                driversByNormTeam.get(normT).drivers.push(d);
            });

            const findMatchingDriversForTeam = (teamStr) => {
                const normT = normalizeName(teamStr);
                if (!normT) return [];
                if (driversByNormTeam.has(normT)) {
                    return driversByNormTeam.get(normT).drivers;
                }
                for (const [k, group] of driversByNormTeam.entries()) {
                    if (k.includes(normT) || normT.includes(k)) {
                        return group.drivers;
                    }
                }
                return [];
            };

            let normalizedTeams = [];

            if (Array.isArray(rawTeamResults) && rawTeamResults.length > 0) {
                normalizedTeams = rawTeamResults.map(t => {
                    if (!t || typeof t !== 'object') return null;
                    const teamName = String(
                        t.Team ?? t.team ?? t['Team Name'] ?? t.teamName ?? t.TeamName ?? t['Race Team'] ?? t.name ?? t.Name ?? ''
                    ).trim();
                    if (!teamName) return null;

                    const matchingDrvs = findMatchingDriversForTeam(teamName);
                    const rawLineup = t['Driving Lineup / Breakdown'] ?? t['Driving Lineup'] ?? t.DrivingLineup ?? t.drivingLineup ??
                                      t.Breakdown ?? t.breakdown ?? t.Lineup ?? t.lineup ??
                                      t.Drivers ?? t.drivers ?? t.driverBreakdown ?? t.DriverBreakdown ?? null;

                    const rawCars = t.Cars ?? t.cars ?? t['Cars in race'] ?? t.carCount ?? t.CarsCount ?? t.carsCount ??
                                    (Array.isArray(rawLineup) ? rawLineup.length : null);
                    const carsCount = (rawCars !== undefined && rawCars !== null && String(rawCars).trim() !== '')
                        ? (Math.round(Number(String(rawCars).replace(/[^\d.-]/g, ''))) || matchingDrvs.length || 1)
                        : (matchingDrvs.length || 1);

                    const summedDriverPts = matchingDrvs.reduce((sum, drv) => sum + (Number(drv.totalFantasyPts) || 0), 0);
                    const rawTotalPts = t.TotalPoints ?? t.totalPoints ?? t['Total Team Pts'] ?? t['Total Points'] ??
                                        t.TotalTeamPts ?? t.totalTeamPts ?? t.total ?? t.Total;
                    const totalPoints = (rawTotalPts !== undefined && rawTotalPts !== null && String(rawTotalPts).trim() !== '')
                        ? (Number(String(rawTotalPts).replace(/,/g, '')) || 0)
                        : summedDriverPts;

                    const rawAvgPts = t.AveragePoints ?? t.averagePoints ?? t['Average Pts'] ?? t['Average Points'] ??
                                      t.avgPoints ?? t.AvgPoints ?? t.Average ?? t.average ?? t.points ?? t.Points;
                    const averagePoints = (rawAvgPts !== undefined && rawAvgPts !== null && String(rawAvgPts).trim() !== '')
                        ? (Number(String(rawAvgPts).replace(/,/g, '')) || 0)
                        : (carsCount > 0 ? totalPoints / carsCount : totalPoints);

                    // Also ensure this team's official AveragePoints is cached for this raceId in cachedBackendTeamPointsMap
                    upsertBackendTeamPointsEntry(teamName, {
                        racePoints: Math.round(averagePoints),
                        points: Math.round(averagePoints),
                        byRaceId: { [cleanRaceId]: Math.round(averagePoints) }
                    });

                    return {
                        rawRank: t.Rank ?? t.rank ?? null,
                        teamName,
                        carsCount,
                        totalPoints,
                        averagePoints,
                        lineupHtml: formatTeamLineupBreakdownHtml(rawLineup, matchingDrvs)
                    };
                }).filter(Boolean);
            } else if (driversByNormTeam.size > 0) {
                // Fallback when teamResults is not explicitly attached: derive from official driverResults for this race
                driversByNormTeam.forEach(group => {
                    const carsCount = group.drivers.length;
                    if (carsCount === 0) return;
                    const totalPoints = group.drivers.reduce((sum, drv) => sum + (Number(drv.totalFantasyPts) || 0), 0);
                    const averagePoints = totalPoints / carsCount;

                    upsertBackendTeamPointsEntry(group.teamName, {
                        racePoints: Math.round(averagePoints),
                        points: Math.round(averagePoints),
                        byRaceId: { [cleanRaceId]: Math.round(averagePoints) }
                    });

                    normalizedTeams.push({
                        rawRank: null,
                        teamName: group.teamName,
                        carsCount,
                        totalPoints,
                        averagePoints,
                        lineupHtml: formatTeamLineupBreakdownHtml(null, group.drivers)
                    });
                });
            }

            // Sort Team Points Table by AveragePoints descending (tie-breaker: TotalPoints descending)
            normalizedTeams.sort((a, b) => {
                if (b.averagePoints !== a.averagePoints) return b.averagePoints - a.averagePoints;
                return b.totalPoints - a.totalPoints;
            });

            if (normalizedTeams.length === 0) {
                teamTbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">
                            ${derivedManagerData.isCompleted
                                ? `No team scoring breakdown available for Race ID ${cleanRaceId}.`
                                : `Upcoming race (Race ID ${cleanRaceId}) — official team points and driver lineups will appear once the race is completed.`}
                        </td>
                    </tr>
                `;
            } else {
                teamTbody.innerHTML = normalizedTeams.map((t, idx) => {
                    const ordinalRank = formatOrdinalRank(idx + 1, idx);
                    const totalPtsFormatted = Math.round(Number(t.totalPoints) || 0).toLocaleString('en-US');
                    const avgPtsFormatted = formatTeamAveragePointsDisplay(t.averagePoints);

                    return `
                        <tr>
                            <td class="pos-cell">${ordinalRank}</td>
                            <td class="driver-cell">🏁 ${t.teamName}</td>
                            <td class="mono-cell num-col">${t.carsCount}</td>
                            <td class="mono-cell num-col">${totalPtsFormatted}</td>
                            <td class="pos-cell num-col highlighted-pts-col">${avgPtsFormatted}</td>
                            <td>${t.lineupHtml}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        console.warn(`Error loading enhanced race results for Race ${cleanRaceId}:`, err.message);
        if (driverTbody) {
            driverTbody.innerHTML = `<tr><td colspan="13" class="empty-state">Unable to load official NASCAR race results for Race ${cleanRaceId}.</td></tr>`;
        }
        if (teamTbody) {
            teamTbody.innerHTML = `<tr><td colspan="6" class="empty-state">Unable to load official team race results for Race ${cleanRaceId}.</td></tr>`;
        }
    }

    return derivedManagerData;
}

window.loadIndividualRaceResults = loadIndividualRaceResults;

/**
 * Switches between all 6 tabs:
 * 1. 'live-race-feed' (Live Race Feed)
 * 2. 'series-live-standings' (Series Live Standings)
 * 3. 'live-race-standings' (Live Race Standings)
 * 4. 'fantasy-standings' (Fantasy Standings)
 * 5. 'team-rosters' (Team Rosters / Selections)
 * 6. 'season-schedule' (Season Schedule)
 */
function switchTab(event, tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
        event.currentTarget.setAttribute('aria-selected', 'true');
    } else {
        const matchingBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (matchingBtn) {
            matchingBtn.classList.add('active');
            matchingBtn.setAttribute('aria-selected', 'true');
        }
    }

    const targetPanel = document.getElementById(tabId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    if (tabId === 'live-race-feed') {
        if (latestRaceData) {
            updateTelemetryHeader(latestRaceData, activeSeriesId);
            updateTelemetryTable(latestRaceData, latestPitData);
        }
    } else if (tabId === 'series-live-standings') {
        if (latestPointsData) {
            updateSeriesLiveStandingsTable(latestPointsData, latestRaceData, latestStageData);
        } else {
            fetchSeriesLivePoints(activeSeriesId);
        }
    } else if (tabId === 'live-race-standings') {
        updateLiveRaceStandingsTable(latestRaceData, latestStageData, latestPointsData);
    } else if (tabId === 'fantasy-standings') {
        updateFantasyStandingsTable(latestRaceData, latestStageData, latestPointsData);
    } else if (tabId === 'team-rosters') {
        updateTeamRostersTab(latestRaceData, latestStageData, latestPointsData);
    } else if (tabId === 'season-schedule') {
        updateSeasonScheduleTable();
    }
}

window.switchTab = switchTab;

/**
 * Fetches live-pit-data.json for the active series (trying unified PIT_DATA_URL first, then series-specific).
 */
async function fetchLivePitData(seriesIdOverride) {
    try {
        const primaryPitData = await fetchWithCorsFallback(PIT_DATA_URL);
        const hasEntries = Array.isArray(primaryPitData)
            ? primaryPitData.length > 0
            : Boolean(
                primaryPitData &&
                (Array.isArray(primaryPitData.pits) ||
                 Array.isArray(primaryPitData.pit_stops) ||
                 Array.isArray(primaryPitData.vehicles) ||
                 Array.isArray(primaryPitData.data))
            );
        if (hasEntries) {
            return primaryPitData;
        }
    } catch (err) {
        console.warn('Primary live-pit-data.json fetch failed, checking series-specific live-pit-data.json:', err.message);
    }

    try {
        const targetSeries = Number(seriesIdOverride) || Number(activeSeriesId) || 1;
        const seriesPitUrl = `${NASCAR_FEEDS_BASE_URL}/series_${targetSeries}/live-pit-data.json`;
        return await fetchWithCorsFallback(seriesPitUrl);
    } catch (seriesErr) {
        console.warn('Series-specific live-pit-data.json fetch failed:', seriesErr.message);
        return null;
    }
}

/**
 * Fetches live race telemetry (live-feed.json, live-pit-data.json, live-stage-points.json, live-points.json)
 * and immediately recalculates and updates all tabs (including Live Race Standings, live driver points,
 * and projected season totals) regardless of which tab the user is currently viewing.
 * Wrapped in a resilient try/catch and overlap guard so temporary network timeouts never break the polling loop.
 */
async function fetchLiveTelemetry() {
    if (!currentAuthUser) return;
    const now = Date.now();
    // Guard against overlapping slow requests while ensuring a stuck request (>15s) never blocks future polls
    if (isLivePollInFlight && (now - lastPollStartedAt) < 15000) {
        return;
    }
    isLivePollInFlight = true;
    lastPollStartedAt = now;

    try {
        const { raceData, seriesId } = await detectAndFetchLiveSeriesFeed();

        const [pitDataResult, stageDataResult, pointsDataResult] = await Promise.all([
            fetchLivePitData(seriesId).catch(err => {
                console.warn('Pit data poll error (preserving last known pit data):', err.message);
                return null;
            }),
            fetchWithCorsFallback(STAGE_POINTS_URL).catch(err => {
                console.warn('Stage points poll error (preserving last known stage data):', err.message);
                return null;
            }),
            fetchSeriesLivePoints(seriesId).catch(err => {
                console.warn('Series live points poll error (preserving last known points data):', err.message);
                return latestPointsData;
            })
        ]);

        if (raceData) {
            latestRaceData = raceData;
        }
        if (pitDataResult) {
            latestPitData = pitDataResult;
        }
        if (stageDataResult) {
            latestStageData = stageDataResult;
        }
        if (pointsDataResult) {
            latestPointsData = pointsDataResult;
        }

        // Immediately update the telemetry header and all tables in the background regardless of active tab
        if (latestRaceData) {
            updateTelemetryHeader(latestRaceData, seriesId);
            updateTelemetryTable(latestRaceData, latestPitData);
        }
        updateSeriesLiveStandingsTable(latestPointsData, latestRaceData, latestStageData);
        await updateLiveRaceStandingsTable(latestRaceData, latestStageData, latestPointsData);
        await updateFantasyStandingsTable(latestRaceData, latestStageData, latestPointsData);
        await updateTeamRostersTab(latestRaceData, latestStageData, latestPointsData);
    } catch (error) {
        console.warn('Temporary error during NASCAR live telemetry poll (will retry on next 5s tick):', error.message);
        renderErrorState(error);
        try {
            const fallbackPoints = await fetchSeriesLivePoints(activeSeriesId).catch(() => latestPointsData);
            if (fallbackPoints) latestPointsData = fallbackPoints;
            // Preserve latestRaceData and latestStageData so a single timeout never wipes out live points
            await updateLiveRaceStandingsTable(latestRaceData, latestStageData, latestPointsData);
            await updateFantasyStandingsTable(latestRaceData, latestStageData, latestPointsData);
            await updateTeamRostersTab(latestRaceData, latestStageData, latestPointsData);
        } catch (fallbackErr) {
            console.warn('Fallback table update error caught during poll recovery:', fallbackErr.message);
        }
    } finally {
        isLivePollInFlight = false;
    }
}

/**
 * Starts (or restarts) the persistent background polling loop at POLL_INTERVAL_MS (5000ms).
 */
function startLiveTelemetryPollingLoop() {
    if (!currentAuthUser) return;
    if (livePollingIntervalId !== null) {
        clearInterval(livePollingIntervalId);
    }
    livePollingIntervalId = setInterval(() => {
        if (!currentAuthUser) return;
        fetchLiveTelemetry().catch(err => {
            console.warn('Unhandled error in background telemetry polling loop caught:', err.message);
        });
    }, POLL_INTERVAL_MS);
}

/**
 * Stops the background telemetry polling loop when logged out.
 */
function stopLiveTelemetryPollingLoop() {
    if (livePollingIntervalId !== null) {
        clearInterval(livePollingIntervalId);
        livePollingIntervalId = null;
    }
}

/**
 * Updates the white telemetry header (LAP, TO GO, STAGE, LEADERS, series badge, and flag button).
 */
function updateTelemetryHeader(data, detectedSeriesId) {
    const runNameEl = document.getElementById('run-name');
    const trackNameEl = document.getElementById('track-name');
    const seriesNameEl = document.getElementById('series-name');
    const activeSeriesPillEl = document.getElementById('active-series-pill');
    const lapCountEl = document.getElementById('lap-count');
    const totalLapsEl = document.getElementById('total-laps');
    const lapsToGoEl = document.getElementById('laps-to-go');
    const stageLabelEl = document.getElementById('stage-label');
    const stageLapsRemainingEl = document.getElementById('stage-laps-remaining');
    const leadersCountEl = document.getElementById('leaders-count');
    const flagStateBtn = document.getElementById('flag-state');

    const seriesId = Number(data.series_id) || Number(detectedSeriesId) || 1;
    const fullSeriesName = SERIES_NAMES[seriesId] || 'NASCAR Cup Series';
    const shortSeriesName = SERIES_SHORT_NAMES[seriesId] || 'Cup Series';

    if (runNameEl) runNameEl.textContent = data.run_name || fullSeriesName;
    if (trackNameEl) trackNameEl.textContent = data.track_name || 'Track TBA';
    if (seriesNameEl) seriesNameEl.textContent = fullSeriesName;
    if (activeSeriesPillEl) activeSeriesPillEl.textContent = shortSeriesName;

    const currentLap = Number(data.lap_number) || 0;
    const totalLaps = Number(data.laps_in_race) || 0;
    const lapsToGo = data.laps_to_go !== undefined
        ? Number(data.laps_to_go)
        : Math.max(0, totalLaps - currentLap);

    if (lapCountEl) lapCountEl.textContent = currentLap;
    if (totalLapsEl) totalLapsEl.textContent = totalLaps;
    if (lapsToGoEl) lapsToGoEl.textContent = lapsToGo;

    const stageNum = data.stage?.stage_num || 1;
    const finishAtLap = Number(data.stage?.finish_at_lap) || 0;
    const lapsToStageEnd = Math.max(0, finishAtLap - currentLap);

    if (stageLabelEl) stageLabelEl.textContent = `STAGE ${stageNum}`;
    if (stageLapsRemainingEl) stageLapsRemainingEl.textContent = lapsToStageEnd;

    if (leadersCountEl) {
        leadersCountEl.textContent = data.number_of_leaders !== undefined ? data.number_of_leaders : 0;
    }

    if (flagStateBtn) {
        const flagInfo = FLAG_STATES[data.flag_state] || FLAG_STATES[1];
        flagStateBtn.textContent = flagInfo.name;
        flagStateBtn.className = flagInfo.className;
    }
}

/**
 * Tab 1: Populates the main data table rows (POS, CAR, DRIVER, INTERVAL, LAPS, STATUS, PIT, LED, BEST, LAST).
 */
function updateTelemetryTable(data, pitData) {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;

    const vehicles = Array.isArray(data.vehicles) ? [...data.vehicles] : [];
    if (vehicles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">No active vehicles in the live race feed right now.</td>
            </tr>
        `;
        return;
    }

    vehicles.sort((a, b) => (Number(a.running_position) || 999) - (Number(b.running_position) || 999));

    const currentLap = Number(data.lap_number) || 0;
    const pitStatsMap = buildVehiclePitStatsMap(pitData, vehicles, currentLap);

    let fastestLap = Infinity;
    vehicles.forEach(v => {
        const bestTime = Number(v.best_lap_time);
        if (bestTime > 0 && bestTime < fastestLap) {
            fastestLap = bestTime;
        }
    });

    const rowsHtml = vehicles.map(vehicle => {
        const pos = vehicle.running_position ?? '--';
        const carNum = vehicle.vehicle_number ?? '--';
        const carKey = normalizeCarNumber(carNum);
        const driverName = vehicle.driver?.full_name || vehicle.driver_name || 'Unknown Driver';
        const hasFastestLap = Number(vehicle.best_lap_time) === fastestLap && fastestLap !== Infinity;

        const interval = formatInterval(vehicle.delta, Number(vehicle.running_position));
        const lapsCompleted = vehicle.laps_completed ?? 0;

        const pitStats = pitStatsMap.get(carKey) || summarizeVehiclePitEntries(vehicle.pit_stops, currentLap);
        const isInPit = pitStats.isInPit || vehicle.pit_in_flag === 1;
        const pitCount = pitStats.pitCount;
        const lastPitLap = pitStats.lastPitLap;

        // Store normalized counts on vehicle object for downstream consumers
        vehicle.pit_stops_count = pitCount;
        vehicle.last_pit_lap = lastPitLap;

        const pitDisplay = lastPitLap > 0
            ? `${pitCount} <span class="mono-cell" style="font-size: 0.72rem; color: #6b7280;" title="Last Pit Stop: Lap ${lastPitLap}">(L${lastPitLap})</span>`
            : `${pitCount}`;

        let statusLabel = '● Running';
        let statusClass = 'status-running';
        if (isInPit) {
            statusLabel = '● In Pit';
            statusClass = 'status-pit';
        } else if (vehicle.status !== undefined && Number(vehicle.status) !== 1) {
            statusLabel = '○ Out';
            statusClass = 'status-out';
        }

        const lapsLed = calculateLapsLed(vehicle.laps_led, currentLap);
        vehicle.laps_led_total = lapsLed;
        const bestLap = formatLapTime(vehicle.best_lap_time);
        const lastLap = formatLapTime(vehicle.last_lap_time);

        return `
            <tr>
                <td class="pos-cell">${pos}</td>
                <td class="car-cell">#${carNum}</td>
                <td class="driver-cell">${driverName}${hasFastestLap ? ' ⚡' : ''}</td>
                <td class="mono-cell">${interval}</td>
                <td>${lapsCompleted}</td>
                <td><span class="${statusClass}">${statusLabel}</span></td>
                <td data-pit-count="${pitCount}" data-last-pit-lap="${lastPitLap}">${pitDisplay}</td>
                <td>${lapsLed}</td>
                <td class="mono-cell">${bestLap}</td>
                <td class="mono-cell">${lastLap}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rowsHtml;
}

/**
 * Displays a descriptive message in the live race feed table if a network or CORS error occurs.
 */
function renderErrorState(error) {
    const leaderboardTbody = document.getElementById('leaderboard-body');

    const isCorsOrNetworkError = error instanceof TypeError || /cors|network|failed to fetch/i.test(error.message);
    const message = isCorsOrNetworkError
        ? 'Unable to reach NASCAR Live Feed (possible CORS restriction or offline session). Retrying every 5 seconds...'
        : `Error loading live telemetry: ${error.message}`;

    if (leaderboardTbody && leaderboardTbody.querySelectorAll('tr').length <= 1) {
        leaderboardTbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">${message}</td>
            </tr>
        `;
    }
}

/**
 * Triggers initial league roster, schedule, and live telemetry data fetching once authenticated.
 */
function startAuthenticatedDashboardFeeds() {
    if (!currentAuthUser) return;
    populateRosterEditorOptions();
    loadUserRosters()
        .then(() => {
            if (!currentAuthUser) return;
            updateAuthUI();
            populateAdminControlBarDropdowns();
            updateLiveRaceStandingsTable(latestRaceData, latestStageData, latestPointsData);
            updateFantasyStandingsTable(latestRaceData, latestStageData, latestPointsData);
            updateTeamRostersTab(latestRaceData, latestStageData, latestPointsData);
        })
        .catch(err => console.warn('Initial roster load warning:', err.message));
    updateSeasonScheduleTable().catch(err => console.warn('Initial schedule load warning:', err.message));
    fetchLiveTelemetry().catch(err => console.warn('Initial telemetry fetch warning:', err.message));
    startLiveTelemetryPollingLoop();
}

// Initial Firebase Auth Gate listener — data fetching only triggers once a user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    populateRosterEditorOptions();
    if (auth && typeof auth.onAuthStateChanged === 'function') {
        auth.onAuthStateChanged(user => {
            currentAuthUser = user || null;
            if (!currentAuthUser) {
                stopLiveTelemetryPollingLoop();
                clearProtectedDashboardDOM();
                updateAuthUI();
            } else {
                updateAuthUI();
                startAuthenticatedDashboardFeeds();
            }
        });
    } else {
        updateAuthUI();
    }
});
