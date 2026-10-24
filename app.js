const LIVE_FEED_URL = 'https://cf.nascar.com/live/feeds/live-feed.json';
const PIT_DATA_URL = 'https://cf.nascar.com/live/feeds/live-pit-data.json';
const POLL_INTERVAL_MS = 5000;

const SERIES_NAMES = {
    1: 'NASCAR Cup Series',
    2: 'NASCAR Xfinity Series',
    3: 'NASCAR Craftsman Truck Series'
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
 * Helper to fetch JSON from a URL with a CORS proxy fallback if direct fetch fails due to CORS.
 */
async function fetchWithCorsFallback(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (directError) {
        console.warn(`Direct fetch failed for ${url}, attempting CORS proxy fallback:`, directError.message);
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const proxyResponse = await fetch(proxyUrl);
        if (!proxyResponse.ok) {
            throw new Error(`CORS fallback failed with HTTP status: ${proxyResponse.status}`);
        }
        return await proxyResponse.json();
    }
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
 * Calculates total laps led from the laps_led array on a vehicle object.
 */
function calculateLapsLed(lapsLedArray, currentLap) {
    if (!Array.isArray(lapsLedArray) || lapsLedArray.length === 0) return 0;
    return lapsLedArray.reduce((total, range) => {
        const start = Number(range.start_lap) || 0;
        const end = Number(range.end_lap) > 0 ? Number(range.end_lap) : (Number(currentLap) || start);
        return total + Math.max(0, end - start + 1);
    }, 0);
}

/**
 * Fetches live race telemetry from the NASCAR live feed API and updates the DOM.
 */
async function fetchLiveTelemetry() {
    try {
        const [raceDataResult, pitDataResult] = await Promise.allSettled([
            fetchWithCorsFallback(LIVE_FEED_URL),
            fetchWithCorsFallback(PIT_DATA_URL)
        ]);

        if (raceDataResult.status !== 'fulfilled' || !raceDataResult.value) {
            throw raceDataResult.reason || new Error('Unable to load live race feed data.');
        }

        const raceData = raceDataResult.value;
        const pitData = pitDataResult.status === 'fulfilled' ? pitDataResult.value : null;

        updateTelemetryHeader(raceData);
        updateTelemetryTable(raceData, pitData);
    } catch (error) {
        console.error('Error fetching NASCAR live feed (check network or CORS policy):', error);
        renderErrorState(error);
    }
}

/**
 * Updates the white telemetry header (LAP, TO GO, STAGE, LEADERS, and flag button).
 */
function updateTelemetryHeader(data) {
    const runNameEl = document.getElementById('run-name');
    const trackNameEl = document.getElementById('track-name');
    const seriesNameEl = document.getElementById('series-name');
    const lapCountEl = document.getElementById('lap-count');
    const totalLapsEl = document.getElementById('total-laps');
    const lapsToGoEl = document.getElementById('laps-to-go');
    const stageLabelEl = document.getElementById('stage-label');
    const stageLapsRemainingEl = document.getElementById('stage-laps-remaining');
    const leadersCountEl = document.getElementById('leaders-count');
    const flagStateBtn = document.getElementById('flag-state');

    if (runNameEl) runNameEl.textContent = data.run_name || 'NASCAR Live Race';
    if (trackNameEl) trackNameEl.textContent = data.track_name || 'Track TBA';
    if (seriesNameEl) seriesNameEl.textContent = SERIES_NAMES[data.series_id] || 'NASCAR Cup Series';

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
 * Populates the main data table rows (POS, CAR, DRIVER, INTERVAL, LAPS, STATUS, PIT, LED, BEST, LAST).
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

    // Sort by running position
    vehicles.sort((a, b) => (Number(a.running_position) || 999) - (Number(b.running_position) || 999));

    // Build lookup map for pit data if available
    const pitMap = new Map();
    if (pitData && Array.isArray(pitData.vehicles)) {
        pitData.vehicles.forEach(pv => {
            if (pv.vehicle_number !== undefined) {
                pitMap.set(String(pv.vehicle_number), pv);
            }
        });
    }

    // Identify overall fastest lap time
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
        const driverName = vehicle.driver?.full_name || vehicle.driver_name || 'Unknown Driver';
        const hasFastestLap = Number(vehicle.best_lap_time) === fastestLap && fastestLap !== Infinity;

        const interval = formatInterval(vehicle.delta, Number(vehicle.running_position));
        const lapsCompleted = vehicle.laps_completed ?? 0;

        // Pit stop count & status
        const pitVehicle = pitMap.get(String(vehicle.vehicle_number));
        const isInPit = pitVehicle?.pit_in_flag === 1 || vehicle.pit_in_flag === 1;
        const pitCount = pitVehicle?.number_of_pit_stops
            ?? (Array.isArray(vehicle.pit_stops) ? vehicle.pit_stops.length : (vehicle.number_of_pit_stops ?? 0));

        // Vehicle running status
        let statusLabel = '● Running';
        let statusClass = 'status-running';
        if (isInPit) {
            statusLabel = '● In Pit';
            statusClass = 'status-pit';
        } else if (vehicle.status !== undefined && Number(vehicle.status) !== 1) {
            statusLabel = '○ Out';
            statusClass = 'status-out';
        }

        const lapsLed = calculateLapsLed(vehicle.laps_led, data.lap_number);
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
                <td>${pitCount}</td>
                <td>${lapsLed}</td>
                <td class="mono-cell">${bestLap}</td>
                <td class="mono-cell">${lastLap}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rowsHtml;
}

/**
 * Displays a descriptive message in the table if a network or CORS error occurs.
 */
function renderErrorState(error) {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;

    // Only overwrite if table doesn't already have rendered driver rows
    const hasExistingData = tbody.querySelectorAll('tr').length > 1;
    if (!hasExistingData) {
        const isCorsOrNetworkError = error instanceof TypeError || /cors|network|failed to fetch/i.test(error.message);
        const message = isCorsOrNetworkError
            ? 'Unable to reach NASCAR Live Feed (possible CORS restriction or offline session). Retrying every 5 seconds...'
            : `Error loading live telemetry: ${error.message}`;

        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">${message}</td>
            </tr>
        `;
    }
}

// Initial fetch & 5-second polling interval
document.addEventListener('DOMContentLoaded', () => {
    fetchLiveTelemetry();
    setInterval(fetchLiveTelemetry, POLL_INTERVAL_MS);
});
