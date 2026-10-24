const LIVE_FEED_URL = 'https://cf.nascar.com/live/feeds/live-feed.json';
let isPaused = false;
let refreshInterval;

async function fetchRaceData() {
    if (isPaused) return;

    try {
        const response = await fetch(LIVE_FEED_URL);
        if (!response.ok) throw new Error('Failed to fetch live feed');
        
        const data = await response.json();
        updateDashboard(data);
        
        if (data.race_id && data.vehicles && data.vehicles.length > 0) {
            fetchRaceNotes(data.race_id);
        }
    } catch (error) {
        console.error('Error updating live telemetry:', error);
    }
}

async function fetchRaceNotes(raceId) {
    const currentYear = new Date().getFullYear();
    const NOTES_URL = `https://cf.nascar.com/cacher/${currentYear}/1/${raceId}/lap-notes.json`;
    
    try {
        const response = await fetch(NOTES_URL);
        if (response.ok) {
            const notesData = await response.json();
            if (notesData.length > 0) {
                const latestNote = notesData[notesData.length - 1];
                document.getElementById('latest-note').textContent = `Lap ${latestNote.lap || '--'}: ${latestNote.note || 'No recent updates'}`;
            }
        }
    } catch (error) {
        console.error('Notes not available yet:', error);
    }
}

function updateDashboard(data) {
    document.getElementById('run-name').textContent = data.run_name || 'NASCAR Cup Series';
    document.getElementById('track-name').textContent = data.track_name || 'TBA';
    document.getElementById('lap-count').textContent = data.lap_number || 0;
    document.getElementById('stage-number').textContent = data.stage?.stage_num || 0;
    
    const flagMap = { 1: '🟢 Green', 2: '🟡 Yellow', 3: '🔴 Red', 4: '🏁 Checkered', 8: 'Warmup', 9: 'Not Active' };
    document.getElementById('flag-state').textContent = `Flag: ${flagMap[data.flag_state] || 'Offline'}`;

    const isRaceFinal = (data.flag_state === 4 || data.flag_state === 9);
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    const vehicles = data.vehicles || [];

    if (vehicles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color:#aaa;">No live race data available. The NASCAR live feed is currently offline.</td></tr>`;
        document.getElementById('fastest-lap').textContent = '--';
        return;
    }

    vehicles.sort((a, b) => a.running_position - b.running_position);

    // STEP 1: Safely parse lap times as numbers to find the exact lowest time
    let overallBestTime = 999;
    vehicles.forEach(vehicle => {
        const lapTime = Number(vehicle.best_lap_time) || 999;
        if (lapTime > 0 && lapTime < overallBestTime) {
            overallBestTime = lapTime;
        }
    });

    let fastestDriverText = '--';

    // STEP 2: Build the rows and apply the indicator
    vehicles.forEach(vehicle => {
        let driverName = vehicle.driver ? vehicle.driver.full_name : 'Unknown';
        const teamName = vehicle.vehicle_sponsor_name || vehicle.vehicle_manufacturer || 'Unknown';
        
        const lapTime = Number(vehicle.best_lap_time) || 999;
        
        // If this driver's time matches the overall best, add the bolt
        if (lapTime === overallBestTime && overallBestTime !== 999) {
            driverName += ' ⚡';
            fastestDriverText = `${vehicle.driver ? vehicle.driver.full_name : 'Unknown'} (${lapTime})`;
        }

        let totalLapsLed = 0;
        if (Array.isArray(vehicle.laps_led)) {
            totalLapsLed = vehicle.laps_led.reduce((sum, segment) => {
                const end = segment.end_lap > 0 ? segment.end_lap : data.lap_number;
                return sum + (end - segment.start_lap + 1);
            }, 0);
        }

        const rawStatusCode = Number(vehicle.status_id !== undefined ? vehicle.status_id : vehicle.status) || 1;
        let statusText = 'Running';
        if (rawStatusCode === 6) statusText = 'Out';
        else if (rawStatusCode === 3) statusText = 'Off';
        
        if (isRaceFinal && (statusText === 'Out' || statusText === 'Off')) {
            statusText = 'DNF';
        }
        
        let displayDelta = vehicle.delta;
        if (vehicle.running_position === 1) displayDelta = 'Leader';
        else if (vehicle.delta < 0) displayDelta = `-${Math.abs(vehicle.delta)} Laps`;
        
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${vehicle.running_position}</td>
            <td>${vehicle.starting_position || '--'}</td>
            <td>${vehicle.vehicle_number}</td>
            <td>${driverName}</td>
            <td>${displayDelta}</td>
            <td>${totalLapsLed > 0 ? totalLapsLed : ''}</td>
            <td>${vehicle.best_lap_time || '--'}</td>
            <td>${teamName}</td>
            <td style="text-align: right;">${statusText}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('fastest-lap').textContent = overallBestTime === 999 ? '--' : fastestDriverText;
}

const toggleBtn = document.getElementById('toggle-pause');
toggleBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        toggleBtn.textContent = 'Resume Live Feed';
        toggleBtn.style.background = '#555';
    } else {
        toggleBtn.textContent = 'Pause Live Feed';
        toggleBtn.style.background = '#111';
        fetchRaceData();
    }
});

async function fetchSchedule() {
    const currentYear = new Date().getFullYear();
    const SCHEDULE_URL = `https://cf.nascar.com/cacher/${currentYear}/race_list_basic.json`;
    try {
        const response = await fetch(SCHEDULE_URL);
        if (!response.ok) throw new Error('Schedule endpoint unavailable');
        const data = await response.json();
        const cupSchedule = data.series_1 || [];
        const tbody = document.getElementById('schedule-body');
        tbody.innerHTML = '';
        if (cupSchedule.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:#e31837; text-align:center;">No Cup Series schedule found.</td></tr>`;
            return;
        }
        cupSchedule.forEach(race => {
            const tr = document.createElement('tr');
            const raceDate = new Date(race.race_date);
            const isComplete = raceDate < new Date();
            const resultsLink = isComplete 
                ? `<a href="results.html?race_id=${race.race_id}" class="results-link">View Results</a>` 
                : `<span style="color: #555;">Upcoming</span>`;
            tr.innerHTML = `
                <td>${race.race_id}</td>
                <td>${race.race_name}</td>
                <td>${race.track_name}</td>
                <td>${raceDate.toLocaleDateString()}</td>
                <td>${resultsLink}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        document.getElementById('schedule-body').innerHTML = `<tr><td colspan="5" style="text-align:center; color:#e31837;">Error: ${error.message}</td></tr>`;
    }
}

fetchRaceData();
fetchSchedule();
refreshInterval = setInterval(fetchRaceData, 3000);