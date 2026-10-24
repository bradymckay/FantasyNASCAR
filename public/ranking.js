const API_URL = 'https://script.google.com/macros/s/AKfycbxUwU-nOzKRJjgNufz-TDCKXSU2ORVHMR78pMPnfSSKKsJuMmSkzEHMIkrtnbjhS16h/exec?action=getLeaderboard&race_id=5593';
const REFRESH_INTERVAL_MS = 30000; // 30 seconds

const loadingMessage = document.getElementById('loading-message');
const errorMessage = document.getElementById('error-message');
const leaderboardTable = document.getElementById('leaderboard-table');
const leaderboardBody = document.getElementById('leaderboard-body');

async function fetchLeaderboardData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not fetch leaderboard data:", error);
        throw error;
    }
}

function renderLeaderboard(data) {
    leaderboardBody.innerHTML = ''; // Clear existing rows

    if (!Array.isArray(data) || data.length === 0) {
        showError("No data available.");
        return;
    }

    // Sort data by Score descending
    const sortedData = data.sort((a, b) => (b.Score || 0) - (a.Score || 0));

    sortedData.forEach((row, index) => {
        const tr = document.createElement('tr');
        
        // Position
        const rank = index + 1;
        const positionTd = document.createElement('td');
        positionTd.className = 'position';
        positionTd.textContent = rank;
        if (rank === 1) positionTd.classList.add('rank-1');
        else if (rank === 2) positionTd.classList.add('rank-2');
        else if (rank === 3) positionTd.classList.add('rank-3');
        tr.appendChild(positionTd);

        // Manager
        const managerTd = document.createElement('td');
        managerTd.className = 'manager';
        managerTd.textContent = row.Manager || 'Unknown';
        tr.appendChild(managerTd);

        // Score (Points Scored)
        const scoreTd = document.createElement('td');
        scoreTd.className = 'score';
        scoreTd.textContent = row.Score !== undefined ? row.Score : 0;
        tr.appendChild(scoreTd);

        // Wins
        // Since Wins might not be in the current API response, we check for it or default to '-'
        const winsTd = document.createElement('td');
        winsTd.className = 'wins';
        winsTd.textContent = row.Wins !== undefined ? row.Wins : '-';
        tr.appendChild(winsTd);

        leaderboardBody.appendChild(tr);
    });
}

function showError(message) {
    loadingMessage.classList.add('hidden');
    leaderboardTable.classList.add('hidden');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
}

async function updateLeaderboard() {
    hideError();
    
    // Only show loading message if it's the first load (table is currently hidden)
    if (leaderboardTable.classList.contains('hidden')) {
        loadingMessage.classList.remove('hidden');
    }

    try {
        const data = await fetchLeaderboardData();
        renderLeaderboard(data);
        
        loadingMessage.classList.add('hidden');
        leaderboardTable.classList.remove('hidden');
    } catch (error) {
        // If table is already visible, maybe don't hide it, just show error toast? 
        // For simplicity, we'll just show the error message.
        if (leaderboardTable.classList.contains('hidden')) {
             showError("Failed to load leaderboard data. Retrying...");
        } else {
             console.warn("Failed to refresh data, keeping old data visible.");
        }
    }
}

// Initial load
updateLeaderboard();

// Set up periodic refresh
setInterval(updateLeaderboard, REFRESH_INTERVAL_MS);
