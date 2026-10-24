const GOOGLE_SHEET_API = 'https://script.google.com/macros/s/AKfycbxUwU-nOzKRJjgNufz-TDCKXSU2ORVHMR78pMPnfSSKKsJuMmSkzEHMIkrtnbjhS16h/exec';

async function fetchResults() {
    const tbody = document.getElementById('results-body');
    const title = document.getElementById('race-title');
    
    const urlParams = new URLSearchParams(window.location.search);
    const raceId = urlParams.get('race_id');

    if (!raceId) {
        title.textContent = 'Error: No Race ID Provided';
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#e31837;">Missing race ID. Please go back to the dashboard and select a valid race.</td></tr>`;
        return;
    }

    title.textContent = `Loading Results...`;

    try {
        const response = await fetch(`${GOOGLE_SHEET_API}?race_id=${raceId}`);
        if (!response.ok) throw new Error('Failed to fetch from Google Sheet');
        
        const results = await response.json();
        tbody.innerHTML = '';

        if (results.error) {
            throw new Error(results.error);
        }

        if (results.length === 0) {
            title.textContent = `No Results Found for Race ${raceId}`;
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color:#aaa;">No results have been uploaded to the spreadsheet for this race yet.</td></tr>`;
            return;
        }

        const raceName = results[0]["Race Name"] || `Race ${raceId}`;
        title.textContent = `Official Results - ${raceName}`;

        results.forEach(result => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${result["Pos"] || '--'}</td>
                <td>${result["Start"] || '--'}</td>
                <td>${result["Car #"] || '--'}</td>
                <td><strong>${result["Driver Name"] || '--'}</strong></td>
                <td>${result["Laps"] || '--'}</td>
                <td>${result["Laps Led"] || '--'}</td>
                <td>${result["Status"] || '--'}</td>
                <td>${result["Total Pts"] || '--'}</td>
                <td style="text-align: right; font-weight: bold; color: #4CAF50;">${result["Total Fantasy Points"] || '--'}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error fetching results:', error);
        title.textContent = 'Error Loading Results';
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#e31837;">Error loading race data: ${error.message}</td></tr>`;
    }
}

if (document.getElementById('results-body')) {
    fetchResults();
}