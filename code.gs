/**
 * Live Leaderboard Custom Function
 * Usage: =GET_LIVE_RUNNING_ORDER(A1)
 */
function GET_LIVE_RUNNING_ORDER(refreshTrigger) {
  try {
    const feedUrl = "https://cf.nascar.com/live/feeds/live-feed.json";
    const pointsUrl = "https://cf.nascar.com/live/feeds/live-points.json";
    const driversUrl = "https://cf.nascar.com/cacher/drivers.json";
    const pitUrl = "https://cf.nascar.com/live/feeds/live-pit-data.json";

    const feedData = fetchNascarData(feedUrl);
    const pointsData = fetchNascarData(pointsUrl);
    const driversData = fetchNascarData(driversUrl);
    const pitData = fetchNascarData(pitUrl);

    if (!feedData || !feedData.vehicles) return [["Loading data..."]];

    // =========================================================================
    // PRE-SCAN: Fastest Lap, Pit Stop Duration, and Driver Laps Led
    // =========================================================================
    let overallFastestLapTime = Infinity;
    let overallFastestLapDriver = "N/A";

    feedData.vehicles.forEach(v => {
      const rawName = (v.driver && v.driver.full_name) ? v.driver.full_name : "Unknown";
      const cleanName = cleanDriverName(rawName);

      if (v.best_lap_time > 0 && v.best_lap_time < overallFastestLapTime) {
        overallFastestLapTime = v.best_lap_time;
        overallFastestLapDriver = cleanName;
      }
    });

    let overallFastestPitTime = Infinity;
    let overallFastestPitDriver = "N/A";
    let overallFastestPitLap = "";
    const pitMap = {};

    if (Array.isArray(pitData)) {
      pitData.forEach(stop => {
        if (stop.pit_stop_type === "FOUR_WHEEL_CHANGE" && stop.pit_stop_duration > 0) {
          const carNum = String(stop.vehicle_number);

          if (stop.pit_stop_duration < overallFastestPitTime) {
            overallFastestPitTime = stop.pit_stop_duration;
            overallFastestPitDriver = cleanDriverName(stop.driver_name || "Unknown");
            overallFastestPitLap = stop.lap_count || "";
          }

          if (!pitMap[carNum] || stop.pit_stop_duration < pitMap[carNum]) {
            pitMap[carNum] = stop.pit_stop_duration;
          }
        }
      });
    }

    const bestLapString = overallFastestLapTime === Infinity ? "N/A" : `${overallFastestLapDriver} (${overallFastestLapTime.toFixed(3)}s)`;
    const bestPitString = overallFastestPitTime === Infinity ? "N/A" : `${overallFastestPitDriver} (${overallFastestPitTime.toFixed(2)}s on L${overallFastestPitLap})`;

    const lapNumber = feedData.lap_number || 0;
    const totalLaps = feedData.laps_in_race || 0;
    const lapsToGo = feedData.laps_to_go || 0;
    const globalFlagState = getFlagStateDescription(feedData.flag_state);

    const runName = feedData.run_name || "Live Race";
    const trackName = feedData.track_name || "Track";

    let stageNum = "N/A";
    if (feedData.stage && feedData.stage.stage_num !== undefined) {
      stageNum = feedData.stage.stage_num;
    } else if (feedData.stage_num !== undefined) {
      stageNum = feedData.stage_num;
    }

    // =========================================================================
    // LAYER 1: FETCH DATA FROM DRIVERS TAB (MID-WEEK LOCAL TRUTH)
    // =========================================================================
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const dbSheet = spreadsheet.getSheetByName("Drivers");
    const dbMap = {};

    if (dbSheet) {
      const dbValues = dbSheet.getDataRange().getValues();
      for (let i = 1; i < dbValues.length; i++) {
        const dbDriverName = cleanDriverName(String(dbValues[i][2]));
        const dbTeamName = String(dbValues[i][6]).trim();
        if (dbDriverName && dbDriverName !== "Unknown") {
          dbMap[dbDriverName] = dbTeamName;
        }
      }
    }

    const pointsMap = {};
    if (Array.isArray(pointsData)) {
      pointsData.forEach(p => pointsMap[String(p.car_number)] = p);
    }

    const profileTeamMap = {};
    const masterNameMap = {};
    const rawDrivers = Array.isArray(driversData) ? driversData : (driversData.response || []);

    rawDrivers.forEach(d => {
      const nascarId = d.Nascar_Driver_ID !== undefined ? d.Nascar_Driver_ID : d.driver_id;
      if (nascarId !== undefined) {
        const driverIdKey = String(nascarId);
        const fullName = d.Full_Name || `${d.First_Name || ''} ${d.Last_Name || ''}`.trim();
        masterNameMap[driverIdKey] = cleanDriverName(fullName);

        let teamName = (d.Team || "").trim();
        const isGarbageData = (teamName === "" || teamName === driverIdKey || teamName === String(d.Badge) || /^\d+$/.test(teamName));

        if (!isGarbageData) {
          if (!profileTeamMap[driverIdKey] || d.Driver_Series === "nascar-cup-series") {
            profileTeamMap[driverIdKey] = teamName;
          }
        }
      }
    });

    const statusMap = {
      1: "Running",
      3: "Out",
      6: "Off Track"
    };

    // =========================================================================
    // PRE-CALCULATE LAPS LED PER DRIVER & FIND MAX LAPS LED
    // =========================================================================
    let maxLapsLed = 0;
    feedData.vehicles.forEach(v => {
      let lapsLed = 0;
      if (Array.isArray(v.laps_led)) {
        v.laps_led.forEach(segment => {
          if (segment.start_lap !== undefined && segment.end_lap !== undefined) {
            let effectiveStart = Math.max(segment.start_lap, 1);
            if (segment.end_lap >= effectiveStart) {
              lapsLed += (segment.end_lap - effectiveStart + 1);
            }
          }
        });
      }

      const runningPos = v.running_position || v.position || 0;
      if (runningPos === 1) {
        let lastArchivedLap = 0;
        if (Array.isArray(v.laps_led) && v.laps_led.length > 0) {
          lastArchivedLap = v.laps_led[v.laps_led.length - 1].end_lap;
        }
        if (lastArchivedLap < (v.laps_completed || 0)) {
          lapsLed += 1;
        }
      }

      v._computedLapsLed = lapsLed;
      if (lapsLed > maxLapsLed) {
        maxLapsLed = lapsLed;
      }
    });

    // =========================================================================
    // BUILD THE SHEET LAYOUT & RESULTS ARRAY
    // =========================================================================
    const mainHeaders = [
      "Pos", "Start", "Car Num", "Driver Name", "Delta", "Laps", "Laps Led",
      "Best Lap", "Fastest Pit", "Status", "Live Pts", "S1 Pts", "S2 Pts",
      "S3 Pts", "Team Name", "Bonus Pts", "Total Fantasy"
    ];
    const colCount = mainHeaders.length;

    const padRow = (arr) => {
      while(arr.length < colCount) arr.push("");
      return arr;
    };

    // Dashboard Row 1
    const headerRow1 = padRow([
      "",
      runName,
      "",
      "",
      trackName
    ]);

    // Dashboard Row 2
    const headerRow2 = padRow([
      "",
      `Flag: ${globalFlagState}`,
      `Stage: ${stageNum}`,
      `Laps: ${lapNumber} / ${totalLaps}`,
      `Laps To Go: ${lapsToGo}`
    ]);

    // Dashboard Row 3
    const headerRow3 = padRow([
      "",
      `Fastest Lap: ${bestLapString}`,
      "",
      `Fastest Pit Stop: ${bestPitString}`,
      ""
    ]);

    const results = [
      headerRow1,
      headerRow2,
      headerRow3,
      padRow([]), // Spacer Row
      mainHeaders
    ];

    const vehicles = feedData.vehicles.sort((a, b) => (a.running_position || a.position || 99) - (b.running_position || b.position || 99));

    // Process Vehicles
    vehicles.forEach(v => {
      const runningPos = v.running_position || v.position || 0;
      const startPos = Number(v.starting_position) || 0;
      const lapsLed = v._computedLapsLed || 0;

      const carStr = String(v.vehicle_number || v.car_number || "0");
      const rawPitTime = pitMap[carStr];
      const fastestPit = (rawPitTime !== undefined && rawPitTime !== Infinity) ? rawPitTime.toFixed(2) : "--.--";

      const statusText = statusMap[v.status] || ("Code: " + v.status);
      const p = pointsMap[carStr] || {};
      const livePts = Number(p.points_earned_this_race) || 0;

      const driverObj = v.driver || {};
      const liveDriverId = driverObj.driver_id ? String(driverObj.driver_id) : "";
      const rawFeedName = driverObj.full_name || `${driverObj.first_name || ''} ${driverObj.last_name || ''}`.trim();
      const driverFullName = rawFeedName ? cleanDriverName(rawFeedName) : (masterNameMap[liveDriverId] || "Unknown");

      // Resolve Team Name
      let teamName = "Open / Part-Time Entry";
      const apiTeamName = profileTeamMap[liveDriverId];
      if (apiTeamName) {
        teamName = apiTeamName;
      } else if (dbMap[driverFullName]) {
        teamName = dbMap[driverFullName];
      } else if (v.team_name || v.vehicle_owner || v.team) {
        teamName = v.team_name || v.vehicle_owner || v.team;
      }

      // =========================================================================
      // BONUS POINTS CALCULATION (COLUMN P & COLUMN Q)
      // =========================================================================
      let bonusPts = 0;

      // 1. Pole Position (+5)
      if (startPos === 1) {
        bonusPts += 5;
      }

      // 2. Led At Least 1 Lap (+1)
      if (lapsLed >= 1) {
        bonusPts += 1;
      }

      // 3. Most Laps Led (+4 additional, for 5 total)
      if (maxLapsLed > 0 && lapsLed === maxLapsLed) {
        bonusPts += 4;
      }

      // 4. Fastest 4-Tire Pit Stop (+1)
      if (rawPitTime !== undefined && rawPitTime === overallFastestPitTime && overallFastestPitTime !== Infinity) {
        bonusPts += 1;
      }

      // Sum for Column Q
      const totalPts = livePts + bonusPts;

      results.push(padRow([
        runningPos,
        startPos,
        carStr,
        driverFullName,
        v.delta || 0,
        v.laps_completed || 0,
        lapsLed,
        v.best_lap_time || "--.--",
        fastestPit,
        statusText,
        livePts,
        Number(p.stage_1_points) || 0,
        Number(p.stage_2_points) || 0,
        Number(p.stage_3_points) || 0,
        teamName,
        bonusPts, // Column P
        totalPts  // Column Q
      ]));
    });

    return results;

  } catch (e) {
    return [["Error", e.toString()]];
  }
}

/**
 * Text Cleaner Utility
 */
function cleanDriverName(name) {
  if (!name) return "Unknown";
  return String(name)
    .replace(/\(i\)/gi, "")
    .replace(/[#*]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Flag State Code Translator
 */
function getFlagStateDescription(code) {
  switch (Number(code)) {
    case 0: return 'None';
    case 1: return 'Green';
    case 2: return 'Yellow';
    case 3: return 'Red';
    case 4: return 'White';
    case 5: return 'Checkered';
    case 6: return 'Who Knows 1';
    case 7: return 'Who Knows 2';
    case 8: return 'Hot Track';
    case 9: return 'Cold Track';
    default: return 'UnAccounted For Flag';
  }
}

/**
 * Live Point Standings Custom Function
 */
function GET_LIVE_POINTS(refreshTrigger) {
  const url = "https://cf.nascar.com/live/feeds/live-points.json";
  const data = fetchNascarData(url);

  if (data && Array.isArray(data) && data.length > 0) {
    const headers = ["Points Pos", "Car Number", "Driver", "Total Points", "Delta to Leader", "Stage 1", "Stage 2", "Stage 3"];
    const results = [headers];
    data.forEach(p => {      results.push([
        p.points_position,
        p.car_number,
        cleanDriverName(`${p.first_name || ''} ${p.last_name || ''}`),
        p.points,
        p.delta_leader || 0,
        p.stage_1_points || 0,
        p.stage_2_points || 0,
        p.stage_3_points || 0
      ]);
    });
    return results;
  }
  return [["Points Data Unavailable"]];
}

/**
 * Shared Fetch Helper
 */
function fetchNascarData(url) {
  try {
    const ts = new Date().getTime();
    const finalUrl = url.includes('?') ? `${url}&cb=${ts}` : `${url}?cb=${ts}`;
    const response = UrlFetchApp.fetch(finalUrl, { "muteHttpExceptions": true });
    if (response.getResponseCode() !== 200) return null;
    return JSON.parse(response.getContentText());
  } catch (e) {
    return null;
  }
}
