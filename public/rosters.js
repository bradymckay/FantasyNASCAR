const GOOGLE_SHEET_API = 'https://script.google.com/macros/s/AKfycbxUwU-nOzKRJjgNufz-TDCKXSU2ORVHMR78pMPnfSSKKsJuMmSkzEHMIkrtnbjhS16h/exec';
let driverStats = {}; 
let teamStats = {}; // ADDED: Object to hold combined team stats

async function loadDynamicDriverData() {
    try {
        const response = await fetch(`${GOOGLE_SHEET_API}?action=getDriverData`);
        const data = await response.json();

        if (data.status === 'success') {
            const tier1Html = '<option value="">-- Select Driver --</option>' + data.drivers.filter(d => d.pos <= 4).map(d => `<option value="${d.name}" data-team="${d.team}">${d.name} (${d.team})</option>`).join('');
            const tier2Html = '<option value="">-- Select Driver --</option>' + data.drivers.filter(d => d.pos >= 5 && d.pos <= 16).map(d => `<option value="${d.name}" data-team="${d.team}">${d.name} (${d.team})</option>`).join('');
            const tier3Html = '<option value="">-- Select Driver --</option>' + data.drivers.filter(d => d.pos >= 17 && d.pos <= 30).map(d => `<option value="${d.name}" data-team="${d.team}">${d.name} (${d.team})</option>`).join('');
            const tier4Html = '<option value="">-- Select Driver --</option>' + data.drivers.filter(d => d.pos >= 31).map(d => `<option value="${d.name}" data-team="${d.team}">${d.name} (${d.team})</option>`).join('');
            const teamsHtml = '<option value="">-- Select Race Team --</option>' + data.teams.map(t => `<option value="${t}">${t}</option>`).join('');

            document.querySelectorAll('.tier-1').forEach(s => s.innerHTML = tier1Html);
            document.querySelectorAll('.tier-2').forEach(s => s.innerHTML = tier2Html);
            document.querySelectorAll('.tier-3').forEach(s => s.innerHTML = tier3Html);
            document.querySelectorAll('.tier-4').forEach(s => s.innerHTML = tier4Html);
            document.querySelectorAll('.team-select').forEach(s => s.innerHTML = teamsHtml);

            // ADDED: Build stats for both drivers AND teams
            data.drivers.forEach(d => {
                driverStats[d.name] = { wins: d.wins, top5: d.top5, top10: d.top10, poles: d.poles };
                
                if (!teamStats[d.team]) {
                    teamStats[d.team] = { wins: 0, top5: 0, top10: 0, poles: 0 };
                }
                teamStats[d.team].wins += d.wins;
                teamStats[d.team].top5 += d.top5;
                teamStats[d.team].top10 += d.top10;
                teamStats[d.team].poles += d.poles;
            });
        }
    } catch (error) {
        console.error("Failed to load driver data:", error);
        document.getElementById('form-status').textContent = 'Error loading live driver data. Please refresh.';
    }
}

function handleDropdownUpdates() {
    const driverSelects = Array.from(document.querySelectorAll('.driver-select'));
    const teamSelects = Array.from(document.querySelectorAll('.team-select'));
    
    const selectedDriverOptions = driverSelects.map(s => s.options[s.selectedIndex]).filter(opt => opt && opt.value !== "");
    const selectedDriverNames = selectedDriverOptions.map(opt => opt.value);
    const selectedDriverTeams = selectedDriverOptions.map(opt => opt.dataset.team);
    
    const selectedTeams = teamSelects.map(s => s.value).filter(v => v);

    // Cross-validate Drivers
    driverSelects.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value === "") return;
            const isSelectedElsewhere = selectedDriverNames.includes(option.value) && select.value !== option.value;
            const isTeamSelected = selectedTeams.includes(option.dataset.team);
            option.disabled = isSelectedElsewhere || isTeamSelected;
        });
    });

    // Cross-validate Teams
    teamSelects.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value === "") return;
            const isSelectedElsewhere = selectedTeams.includes(option.value) && select.value !== option.value;
            const hasDriverSelected = selectedDriverTeams.includes(option.value);
            option.disabled = isSelectedElsewhere || hasDriverSelected;
        });
    });

    // Calculate and display cumulative statistics
    let totalWins = 0, totalTop5 = 0, totalTop10 = 0, totalPoles = 0;
    
    // Add Individual Driver Stats
    selectedDriverNames.forEach(driver => {
        if (driverStats[driver]) {
            totalWins += driverStats[driver].wins;
            totalTop5 += driverStats[driver].top5;
            totalTop10 += driverStats[driver].top10;
            totalPoles += driverStats[driver].poles;
        }
    });

    // ADDED: Add Entire Team Stats
    selectedTeams.forEach(team => {
        if (teamStats[team]) {
            totalWins += teamStats[team].wins;
            totalTop5 += teamStats[team].top5;
            totalTop10 += teamStats[team].top10;
            totalPoles += teamStats[team].poles;
        }
    });

    let statsDisplay = document.getElementById('cumulative-stats-display');
    if (!statsDisplay) {
        statsDisplay = document.createElement('div');
        statsDisplay.id = 'cumulative-stats-display';
        statsDisplay.style.cssText = 'margin: 20px 0; font-size: 1.1em; color: #fff; background: #333; padding: 15px; border-radius: 4px; border: 1px solid #444; display: flex; justify-content: space-around; font-weight: bold;';
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) submitBtn.parentNode.insertBefore(statsDisplay, submitBtn);
    }
    
    statsDisplay.innerHTML = `
        <div>Wins: <span style="color: #e31837;">${totalWins}</span></div>
        <div>Top 5s: <span style="color: #e31837;">${totalTop5}</span></div>
        <div>Top 10s: <span style="color: #e31837;">${totalTop10}</span></div>
        <div>Poles: <span style="color: #e31837;">${totalPoles}</span></div>
    `;
}

document.querySelectorAll('.driver-select, .team-select').forEach(select => {
    select.addEventListener('change', handleDropdownUpdates);
});

document.getElementById('roster-form')?.addEventListener('change', handleDropdownUpdates);

document.getElementById('roster-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const statusDiv = document.getElementById('form-status');
    const driverSelects = Array.from(document.querySelectorAll('.driver-select'));
    const teamSelects = Array.from(document.querySelectorAll('.team-select'));
    
    const selectedDriverOptions = driverSelects.map(select => select.options[select.selectedIndex]);
    const selectedTeams = teamSelects.map(select => select.value);

    if (statusDiv) statusDiv.textContent = '';

    for (const option of selectedDriverOptions) {
        if (option.value && selectedTeams.includes(option.dataset.team)) {
            statusDiv.style.color = '#e31837';
            statusDiv.textContent = `Rule Violation: You cannot select ${option.value} AND ${option.dataset.team}.`;
            return; 
        }
    }

    if (submitBtn) {
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
    }

    const payload = {
        manager: document.getElementById('manager-name').value,
        raceId: 'Season Roster',
        drivers: selectedDriverOptions.map(opt => opt.value).join(', '),
        teams: selectedTeams.join(', ')
    };

    try {
        const response = await fetch(GOOGLE_SHEET_API, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            if (statusDiv) {
                statusDiv.style.color = '#4CAF50';
                statusDiv.textContent = 'Roster submitted successfully!';
            }
            document.getElementById('roster-form').reset();
            handleDropdownUpdates(); 
        } else {
            throw new Error('Script returned an error: ' + (result.message || 'Unknown'));
        }
    } catch (error) {
        if (statusDiv) {
            statusDiv.style.color = '#e31837';
            statusDiv.textContent = 'Error submitting roster. Please try again.';
        }
        console.error('Submission Error:', error);
    } finally {
        if (submitBtn) {
            submitBtn.textContent = 'Submit Roster';
            submitBtn.disabled = false;
        }
    }
});

async function fetchRosters() {
    const tbody = document.getElementById('rosters-body');
    if (!tbody) return; 
    
    try {
        const response = await fetch(`${GOOGLE_SHEET_API}?action=getRosters`);
        if (!response.ok) throw new Error('Failed to fetch from Google Sheet');
        const rosters = await response.json();
        tbody.innerHTML = rosters.length === 0 
            ? `<tr><td colspan="4" style="text-align:center; padding: 20px; color:#aaa;">No rosters found.</td></tr>` 
            : rosters.map(r => `<tr><td><strong>${r["Manager"] || '--'}</strong></td><td>${r["Race ID"] || '--'}</td><td>${r["Drivers"] || '--'}</td><td>${r["Teams"] || '--'}</td></tr>`).join('');
    } catch (error) {
        console.error('Error fetching rosters:', error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#e31837;">Error loading rosters.</td></tr>`;
    }
}

if (document.getElementById('roster-form')) loadDynamicDriverData();
if (document.getElementById('rosters-body')) fetchRosters();