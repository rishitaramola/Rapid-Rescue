
const graphNodes = [
    { id: 0,  name: "Clock Tower (Ghantaghar)", lat: 30.3243, lng: 78.0418, type: "junction" },
    { id: 1,  name: "ISBT (Clement Town)",      lat: 30.2872, lng: 78.0039, type: "junction" },
    { id: 2,  name: "Railway Station",           lat: 30.3165, lng: 78.0322, type: "junction" },
    { id: 3,  name: "Ballupur Chowk",            lat: 30.3315, lng: 78.0050, type: "junction" },
    { id: 4,  name: "Premnagar",                 lat: 30.3340, lng: 77.9540, type: "junction" },
    { id: 5,  name: "Nanda Ki Chowki",           lat: 30.3370, lng: 77.9640, type: "junction" },
    { id: 6,  name: "FRI",                       lat: 30.3392, lng: 77.9942, type: "junction" },
    { id: 7,  name: "Rajpur Road",               lat: 30.3601, lng: 78.0772, type: "junction" },
    { id: 8,  name: "Prince Chowk",              lat: 30.3160, lng: 78.0423, type: "junction" },
    { id: 9,  name: "Rispana Pull",              lat: 30.2974, lng: 78.0384, type: "junction" },
    { id: 10, name: "GEU / GEHU",                lat: 30.2687, lng: 77.9945, type: "junction" },
    { id: 11, name: "Doon Hospital",             lat: 30.3193, lng: 78.0354, type: "hospital" },
    { id: 12, name: "Max Hospital",              lat: 30.3662, lng: 78.0772, type: "hospital" }
];

function validatePhoneNumber() {
    const input = document.getElementById("vInitPhone");
    const value = input.value.trim();

    if (value.length !== 10) {
        alert("Please enter a valid 10-digit phone number");
        input.value = "";
        input.focus();
        return false;
    }

    return true;
}
const graphEdges = [
    [0, 2, 5],  [0, 8,  3],  [0, 11, 4],  [0, 7,  15],
    [2, 8, 4],  [8, 9,  8],  [9,  1, 10], [1, 10,  5],
    [3, 0, 10], [3, 6,  4],  [6,  5,  3], [5,  4,  2],
    [7, 12, 5], [2, 11, 2],  [3,  1, 15]
];
const map = L.map('map').setView([30.3160, 78.0200], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, attribution: '© CartoDB'
}).addTo(map);
const nodeMarkers  = {};
let   ambMarkers   = {};
let   routeLines   = [];
let   globalAmbCount = 0;
let   ambulances   = [];
function buildAdjacency() {
    const adj = {};
    graphNodes.forEach(n => { adj[n.id] = []; });
    graphEdges.forEach(([u, v, w]) => {
        adj[u].push({ node: v, cost: w });
        adj[v].push({ node: u, cost: w });
    });
    return adj;
}
function dijkstra(startId, endId) {
    const adj = buildAdjacency();
    const dist = {}; const prev = {}; const visited = new Set();
    graphNodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
    dist[startId] = 0;
    const pq = [{ id: startId, cost: 0 }];
    while (pq.length > 0) {
        pq.sort((a, b) => a.cost - b.cost);
        const { id: curr } = pq.shift();
        if (visited.has(curr)) continue;
        visited.add(curr);
        if (curr === endId) break;
        (adj[curr] || []).forEach(({ node: nbr, cost }) => {
            const alt = dist[curr] + cost;
            if (alt < dist[nbr]) { dist[nbr] = alt; prev[nbr] = curr; pq.push({ id: nbr, cost: alt }); }
        });
    }
    const path = []; let curr = endId;
    while (curr !== null) { path.unshift(curr); curr = prev[curr]; }
    if (path[0] !== startId) return [];
    return path;
}
function pathToLatLngs(path) {
    return path.map(id => { const n = graphNodes.find(x => x.id === id); return [n.lat, n.lng]; });
}
function getNodeIdNearLatLng(lat, lng) {
    let best = null, bestD = Infinity;
    graphNodes.forEach(n => { const d = Math.hypot(n.lat - lat, n.lng - lng); if (d < bestD) { bestD = d; best = n.id; } });
    return best;
}
function clearRouteLines() {
    routeLines.forEach(l => map.removeLayer(l));
    routeLines = [];
}
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
function fetchOsrmRoute(waypoints, color, onDone) {
    if (waypoints.length < 2) {
        if (onDone) onDone(null);
        return;
    }
    const fallback = () => {
        const latlngs = waypoints.map(w => [w.lat, w.lng]);
        const line = L.polyline(latlngs, {
            color, weight: 6, opacity: 0.75, dashArray: '10,6',
            lineJoin: 'round', lineCap: 'round'
        }).addTo(map);
        routeLines.push(line);
        if (onDone) onDone(line);
    };
    const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
    const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;
    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (!data.routes || !data.routes[0]) {
                fallback();
                return;
            }
            const geojson = data.routes[0].geometry;
            const latlngs = geojson.coordinates.map(([lng, lat]) => [lat, lng]);
            const line = L.polyline(latlngs, {
                color, weight: 6, opacity: 0.92,
                lineJoin: 'round', lineCap: 'round'
            }).addTo(map);
            routeLines.push(line);
            if (onDone) onDone(line);
        })
        .catch(fallback);
}
function getNearestNode(lat, lng) {
    let bestDist = Infinity;
    let bestNode = null;
    graphNodes.forEach(n => {
        let d = Math.pow(n.lat - lat, 2) + Math.pow(n.lng - lng, 2);
        if (d < bestDist) { bestDist = d; bestNode = n; }
    });
    return bestNode;
}
function buildMapUI() {

    // Draw roads
    graphEdges.forEach(edge => {
        const u = graphNodes[edge[0]];
        const v = graphNodes[edge[1]];
        const w = edge[2];

        L.polyline([[u.lat, u.lng], [v.lat, v.lng]], {
            color: '#cbd5e1',
            weight: 2,
            opacity: 0.5,
            dashArray: '5, 5'
        }).addTo(map).bindTooltip(`${w} mins`, { direction: 'center' });
    });

    // Draw nodes
    graphNodes.forEach(node => {

        let html;

        if (node.type === "hospital") {
            html = `
            <div style="
                background: linear-gradient(135deg, #10b981, #059669);
                width: 34px;
                height: 34px;
                border-radius: 10px;
                border: 2px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                box-shadow: 0 0 15px rgba(16,185,129,0.9);
            ">
                🏥
            </div>`;
        } else {
            html = `
            <div style="
                background:#94a3b8;
                width:14px;
                height:14px;
                border-radius:50%;
                border:2px solid white;
            "></div>`;
        }

        let m = L.marker([node.lat, node.lng], {
            icon: L.divIcon({
                className: 'custom-icon',
                html: html,
                iconSize: node.type === "hospital" ? [34, 34] : [16, 16],
                iconAnchor: node.type === "hospital" ? [17, 17] : [8, 8]
            })
        }).addTo(map);

        m.bindTooltip(`<b>${node.name}</b>`, { direction: 'top' });

        nodeMarkers[node.id] = m;
    });

    // Spawn initial drivers
    spawnDriver(30.2872, 78.0039);
    spawnDriver(30.3340, 77.9540);
}
function spawnDriver(lat, lng, name, phone, plate) {
    let nearest = getNearestNode(lat, lng);
    globalAmbCount++;
    let newAmb = {
        id:             globalAmbCount,
        locationNodeId: nearest.id,
        lat:            lat,
        lng:            lng,
        name:           name  || 'Guest Driver',
        phone:          phone || '+91 (Dispatched)',
        plate:          plate || 'UK--Temp',
        busy:           false
    };
    ambulances.push(newAmb);
    let html = `<div style="background:#3b82f6;width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 15px #3b82f6;display:flex;align-items:center;justify-content:center;font-size:14px;">🚑</div>`;
    let m = L.marker([lat, lng], {
        icon: L.divIcon({ className: 'custom-icon', html, iconSize: [34, 34], iconAnchor: [17, 17] })
    }).addTo(map);
    ambMarkers[newAmb.id] = m;
    return newAmb;
}
function removeAmbulance(ambId) {
    let amb = ambulances.find(a => a.id === ambId);
    if (!amb) return;
    if (amb.busy) {
        alert('❌ Cannot remove an ambulance currently in an active rescue!');
        return;
    }
    let confirmed = confirm(
        `⚠️ Cancel & Remove Ambulance?\n\nDriver: ${amb.name}\nPlate: ${amb.plate}\n\nThis will take the ambulance offline permanently. Confirm?`
    );
    if (!confirmed) return;
    map.removeLayer(ambMarkers[ambId]);
    ambulances = ambulances.filter(a => a.id !== ambId);
    delete ambMarkers[ambId];
    let card = document.getElementById('amb-card-' + ambId);
    if (card) card.remove();
    let list = document.getElementById('dRegisteredList');
    if (list && list.children.length === 0) {
        list.innerHTML = '<p style="color: #64748b; font-size: 13px; font-style: italic;">No fleet online yet.</p>';
    }
}
map.on('click', function (e) {
    let lat      = e.latlng.lat;
    let lng      = e.latlng.lng;
    let nearest  = getNearestNode(lat, lng);
    let activeTab = document.querySelector('.tab-btn.active').innerText;
    if (activeTab.includes('Patient')) {
        if (StateHub.appStatus !== 'idle') return;
        StateHub.victimNodeId  = nearest.id;
        StateHub.victimLatLng  = { lat, lng };
        if (StateHub.tempVictimMarker) map.removeLayer(StateHub.tempVictimMarker);
        let html = `
<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38" style="cursor:pointer;filter:drop-shadow(0 0 8px #fbbf24) drop-shadow(0 0 14px rgba(251,191,36,0.7));" title="Click to Cancel Incident">
  <polygon points="19,3 23.5,14.5 36,14.5 26,22 30,34 19,27 8,34 12,22 2,14.5 14.5,14.5" fill="#fbbf24" stroke="#fff" stroke-width="1.8"/>
</svg>`;
        StateHub.tempVictimMarker = L.marker([lat, lng], {
            icon: L.divIcon({ className: 'custom-icon', html, iconSize: [38, 38], iconAnchor: [19, 19] })
        }).addTo(map);
        StateHub.tempVictimMarker.on('click', (ev) => {
            L.DomEvent.stopPropagation(ev);
            map.removeLayer(StateHub.tempVictimMarker);
            StateHub.tempVictimMarker = null;
            document.getElementById('victimFormCard').classList.add('hidden');
        });
        document.getElementById('victimFormCard').classList.remove('hidden');
    } else if (activeTab.includes('Driver')) {
        if (!StateHub.driverRegOpen) {
            alert("Registrations are currently closed. Please click '▶ Start Registration' first!");
            return;
        }
        StateHub.tempDriverLatLng = { lat, lng };
        document.getElementById('driverRegistrationModal').classList.remove('hidden');
    }
});
function submitDriverRegistration() {
    let lat   = StateHub.tempDriverLatLng.lat;
    let lng   = StateHub.tempDriverLatLng.lng;
    let name  = document.getElementById('dRegName').value  || 'Guest Driver';
    let phone = document.getElementById('dRegPhone').value || 'No Contact';
    let plate = document.getElementById('dRegPlate').value || 'UK--Temp';
    let newAmb = spawnDriver(lat, lng, name, phone, plate);
    document.getElementById('driverRegistrationModal').classList.add('hidden');
    document.getElementById('dRegName').value  = '';
    document.getElementById('dRegPhone').value = '';
    document.getElementById('dRegPlate').value = '';
    let driverHtml = `<div id="amb-card-${newAmb.id}" style="background:rgba(59,130,246,0.1);border:1px solid #3b82f6;padding:10px;border-radius:6px;margin-bottom:8px;">
        <p style="color:white;font-size:13px;font-weight:bold;">${name} (${plate})</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:2px;">Contact: ${phone}</p>
        <p style="color:#3b82f6;font-size:12px;margin-top:5px;">Status: Online &amp; Mapped</p>
        <button onclick="removeAmbulance(${newAmb.id})" style="margin-top:8px;width:100%;padding:6px;background:rgba(239,68,68,0.15);border:1px solid #ef4444;color:#ef4444;border-radius:5px;font-size:12px;cursor:pointer;font-weight:600;">🗑 Remove / Cancel</button>
    </div>`;
    let listContainer = document.getElementById('dRegisteredList');
    if (listContainer.innerText.includes('No fleet')) listContainer.innerHTML = '';
    listContainer.innerHTML += driverHtml;
}
function toggleDriverReg(isOpen) {
    StateHub.driverRegOpen = isOpen;
    let sText = document.getElementById('dRegStatusText');
    if (isOpen) {
        sText.innerText   = 'Registrations OPEN. Click map to register a driver.';
        sText.style.color = 'var(--success)';
    } else {
        sText.innerText   = 'Driver Registrations CLOSED.';
        sText.style.color = 'var(--danger)';
        document.getElementById('driverRegistrationModal').classList.add('hidden');
    }
}
let StateHub = {
    victimNodeId:     null,
    victimLatLng:     null,
    tempVictimMarker: null,
    tempDriverLatLng: null,
    condition:        null,
    severity:         null,
    strategy:         null,
    hospitalLogic:    null,
    specificHospId:   null,
    assignedAmbId:    null,
    selectedHospitalId: null,
    appStatus:        'idle', 
    pingTimerInt:     null,
    goldenTimerInt:   null,
    pingCount:        0,
    victimPhone:      '--',
    patientCount:     1,
    driverRegOpen:    false,
    missionPanelReady: false
};
function switchModule(moduleName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.module-overlay').forEach(el => el.classList.add('hidden'));
    document.getElementById(moduleName + 'UI').classList.remove('hidden');
    setTimeout(() => { map.invalidateSize(); }, 300);
    if (moduleName === 'victim') {
        maybeShowPatientMissionPanel();
    } else {
        document.getElementById('patientMissionCard').classList.add('hidden');
    }
}
function updateStatusUI(stepNumber) {
    document.querySelectorAll('.step').forEach((el, index) => {
        if      (index + 1 < stepNumber)  el.className = 'step done';
        else if (index + 1 === stepNumber) el.className = 'step active';
        else                               el.className = 'step pending';
    });
}
function startGoldenHour() {
    if (StateHub.goldenTimerInt) return;
    let secs = 3600;
    StateHub.goldenTimerInt = setInterval(() => {
        secs--;
        let m = Math.floor(secs / 60).toString().padStart(2, '0');
        let s = (secs % 60).toString().padStart(2, '0');
        document.getElementById('goldenHourClock').innerText = `${m}:${s}`;
    }, 1000);
}
function toggleHospList() {
    let v = document.getElementById('vHospLogic').value;
    document.getElementById('vSpecificHosp').classList.toggle('hidden', v === 'system');
}
function cancelVictimIntake() {
    if (StateHub.tempVictimMarker) map.removeLayer(StateHub.tempVictimMarker);
    StateHub.tempVictimMarker = null;
    document.getElementById('victimFormCard').classList.add('hidden');
    document.getElementById('victimFinalDetails').classList.add('hidden');
}
document.getElementById('btnSubmitVictim').addEventListener('click', () => {

    // ✅ PHONE VALIDATION
    if (!validatePhoneNumber()) return;

    StateHub.patientCount  = document.getElementById('vPatientCount').value || 1;
    StateHub.condition     = document.getElementById('vCondition').value || 'Unknown Emergency';
    StateHub.severity      = document.getElementById('vSeverity').value;
    StateHub.strategy      = document.getElementById('vStrategy').value;

    StateHub.victimPhone   = document.getElementById('vInitPhone').value;

    StateHub.hospitalLogic = document.getElementById('vHospLogic').value;

    if (StateHub.hospitalLogic === 'specific') {
        StateHub.specificHospId = document.getElementById('vSpecificHosp').value;
    }

    document.getElementById('victimFormCard').classList.add('hidden');
    updateStatusUI(1);

    StateHub.appStatus = 'pinging';
    StateHub.pingCount = 0;

    setTimeout(() => triggerDriverPing(), 1000);
});
function triggerDriverPing() {
    StateHub.pingCount++;
    if (StateHub.pingCount > 3) {
        alert('CRITICAL WARNING: All nearby drivers rejected or timed out. Mission Failed.');
        StateHub.appStatus = 'idle';
        updateStatusUI(0);
        return;
    }
    StateHub.appStatus    = 'pinging';
    StateHub.assignedAmbId = ambulances[StateHub.pingCount - 1]?.id || ambulances[0].id;
    document.getElementById('dPingCondition').innerText = 'Condition: ' + StateHub.condition;
    document.getElementById('dPingETA').innerText       = 'ETA: ' + (StateHub.pingCount * 3 + 1) + ' mins (Pinging Driver ' + StateHub.pingCount + ' / 3)';
    document.getElementById('driverPingOverlay').classList.remove('hidden');
    let timeLeft = 15;
    document.getElementById('pingTimer').innerText = timeLeft;
    StateHub.pingTimerInt = setInterval(() => {
        timeLeft--;
        document.getElementById('pingTimer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(StateHub.pingTimerInt);
            document.getElementById('driverPingOverlay').classList.add('hidden');
            alert('No response in 15 seconds! Locating next available driver...');
            setTimeout(() => triggerDriverPing(), 1000);
        }
    }, 1000);
}
function driverReject() {
    clearInterval(StateHub.pingTimerInt);
    document.getElementById('driverPingOverlay').classList.add('hidden');
    alert('Request Rejected! Alerting next nearest driver...');
    setTimeout(() => triggerDriverPing(), 1000);
}
function driverAccept() {
    clearInterval(StateHub.pingTimerInt);
    document.getElementById('driverPingOverlay').classList.add('hidden');
    document.getElementById('driverDashboard').classList.remove('hidden');
    alert('Ride accepted. Awaiting Hospital Confirmation... Meanwhile, your GPS is routing to Patient location.');
    drawDriverToVictimRoute();
    updateStatusUI(2);
    if (StateHub.hospitalLogic === 'system') {
        StateHub.appStatus = 'driver_negotiating';
        document.getElementById('driverNegotiationPhase').classList.remove('hidden');
    } else {
        StateHub.selectedHospitalId = StateHub.specificHospId;
        proceedToHospitalGatekeeper();
    }
}
function driverSubmitRecommendation() {
    StateHub.selectedHospitalId = document.getElementById('dRecommendationSelect').value;
    document.getElementById('driverNegotiationPhase').classList.add('hidden');
    proceedToHospitalGatekeeper();
}
function showPatientMissionPanel() {
    let hospName = '--', hospContact = '--', driverName = '--', driverPhone = '--', driverPlate = '--';
    if (StateHub.selectedHospitalId) {
        let n = graphNodes.find(x => x.id == StateHub.selectedHospitalId);
        if (n) hospName = n.name;
    }
    hospContact = document.getElementById('hospDeskPhoneInput').value || '+91 (Hospital Reception)';
    let assignedAmb = ambulances.find(a => a.id == StateHub.assignedAmbId) || ambulances[0];
    if (assignedAmb) {
        driverName  = assignedAmb.name  || 'Guest Driver';
        driverPhone = assignedAmb.phone || '+91 (Dispatched)';
        driverPlate = assignedAmb.plate || 'UKXX-XXXX';
    }
    document.getElementById('pdHospName').innerText    = hospName;
    document.getElementById('pdHospContact').innerText = hospContact;
    document.getElementById('pdDriverName').innerText  = driverName;
    document.getElementById('pdDriverPhone').innerText = driverPhone;
    document.getElementById('pdDriverPlate').innerText = driverPlate;
    StateHub.missionPanelReady = true;
    let activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.innerText.includes('Patient')) {
        let panel = document.getElementById('patientMissionCard');
        panel.classList.remove('hidden');
    }
}
function maybeShowPatientMissionPanel() {
    if (StateHub.missionPanelReady) {
        document.getElementById('patientMissionCard').classList.remove('hidden');
    }
}
function dismissPatientMissionPanel() {
    let panel = document.getElementById('patientMissionCard');
    panel.classList.add('hidden');
    StateHub.missionPanelReady = false;
}
function callFromPatientDialog(type) {
    if (type === 'hospital') {
        alert('📞 Calling Hospital: ' + document.getElementById('pdHospContact').innerText);
    } else {
        alert('📞 Calling AMBULANCE Driver: ' + document.getElementById('pdDriverPhone').innerText);
    }
}
function proceedToHospitalGatekeeper() {
    StateHub.appStatus = 'awaiting_hospital';
    document.getElementById('driverWaitingPhase').classList.remove('hidden');
    updateStatusUI(3);
    document.getElementById('hospitalInquiryBox').classList.remove('hidden');
    document.getElementById('hInquiryCondition').innerText = 'Inquiry: ' + StateHub.condition;
    document.getElementById('hPatientCountVal').innerText  = StateHub.patientCount;
    document.getElementById('hPatientPhone').innerText     = StateHub.victimPhone;
    let sLabel = StateHub.severity == 1 ? 'HIGH/CRITICAL' : StateHub.severity == 2 ? 'MODERATE' : 'LOW';
    document.getElementById('hSeverity').innerText = sLabel;
}
function hospitalConfirm() {
    document.getElementById('hospitalInquiryBox').classList.add('hidden');
    document.getElementById('hospitalConfirmedTools').classList.remove('hidden');
    document.getElementById('driverWaitingPhase').classList.add('hidden');
    document.getElementById('driverConfirmedPhase').classList.remove('hidden');
    if (StateHub.severity == 1) {
        document.getElementById('btnRequestHalfway').classList.remove('hidden');
    } else {
        document.getElementById('btnRequestHalfway').classList.add('hidden');
    }
    StateHub.appStatus = 'confirmed';
    updateStatusUI(4);
    startGoldenHour();
    let hospName = 'System Selected';
    if (StateHub.selectedHospitalId) {
        let n = graphNodes.find(x => x.id == StateHub.selectedHospitalId);
        if (n) hospName = n.name;
    }
    let deskPhone = document.getElementById('hospDeskPhoneInput').value || '+91 (Hospital Reception)';
    let vWard     = (StateHub.severity == 1 ? 'ICU (Trauma) - Bed 04' : 'ER Triage Area - Bed 12');
    let assignedAmb = ambulances.find(a => a.id == StateHub.assignedAmbId) || ambulances[0];
    document.getElementById('vpInfoCount').innerText = StateHub.patientCount;
    document.getElementById('vpInfoPhone').innerText = StateHub.victimPhone;
    document.getElementById('vpInfoCond').innerText  = StateHub.condition;
    document.getElementById('vpInfoStrat').innerText = StateHub.strategy;
    document.getElementById('vdInfoName').innerText  = assignedAmb.name  || 'Guest Driver';
    document.getElementById('vdInfoPhone').innerText = assignedAmb.phone || '+91 (Dispatched)';
    document.getElementById('vdInfoCar').innerText   = assignedAmb.plate || 'UKXX-XXXX';
    document.getElementById('vhInfoName').innerText    = hospName;
    document.getElementById('vhInfoWard').innerText    = vWard;
    document.getElementById('vhInfoContact').innerText = deskPhone;
    showPatientMissionPanel();
    let caseHtml = `<div style="background:rgba(16,185,129,0.1);border:1px solid #10b981;padding:10px;border-radius:6px;">
        <p style="color:white;font-size:13px;font-weight:bold;">Patient: ${StateHub.victimPhone} (Count: ${StateHub.patientCount})</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:2px;">Condition: ${StateHub.condition}</p>
        <p style="color:#10b981;font-size:12px;margin-top:5px;">Assigned Bed: ${vWard}</p>
    </div>`;
    let listContainer = document.getElementById('hRegisteredCasesList');
    if (listContainer.innerText.includes('No cases')) listContainer.innerHTML = '';
    listContainer.innerHTML += caseHtml;
    drawFinalRoute();
}
function hospitalReject() {
    document.getElementById('hospitalInquiryBox').classList.add('hidden');
    alert('Hospital Rejected! Triggering Call Patient Protocol to suggest Alternate.');
    document.getElementById('driverWaitingPhase').classList.add('hidden');
    document.getElementById('driverNegotiationPhase').classList.remove('hidden');
    StateHub.appStatus = 'driver_negotiating';
    updateStatusUI(2);
}
function simulateGeoSearch() {
    let q = document.getElementById('vLocationSearch').value.toLowerCase();
    if (!q) return;
    let n = graphNodes.find(n => n.name.toLowerCase().includes(q));
    if (!n) n = graphNodes[4]; 
    let lat = n.lat + 0.002;
    let lng = n.lng + 0.002;
    map.fireEvent('click', { latlng: { lat, lng } });
    map.flyTo([lat, lng], 15);
}
function submitVictimPhone() {
    let p = document.getElementById('vPhoneInput').value;
    if (!p) return;
    document.getElementById('vContactForm').classList.add('hidden');
    document.getElementById('vContactSuccess').classList.remove('hidden');
    document.getElementById('hPatientPhone').innerText = p;
    document.getElementById('hospContactBox').classList.remove('hidden');
}
function requestHalfwayDoc() {
    let btn         = document.getElementById('btnRequestHalfway');
    btn.innerText   = '⏳ Waiting for Hospital...';
    btn.disabled    = true;
    btn.style.opacity = '0.7';
    document.getElementById('hospHalfwayBox').classList.remove('hidden');
    alert('Request sent to hospital! Check the Hospital tab to simulate approval.');
}
function replyHalfway(approved) {
    document.getElementById('hospHalfwayBox').classList.add('hidden');
    let btn = document.getElementById('btnRequestHalfway');
    if (approved) {
        btn.innerText   = '✅ Doctor Dispatched!';
        btn.className   = 'btn btn-success';
        btn.style.color = 'white';
    } else {
        btn.innerText   = '❌ Doctor Unavailable';
        btn.className   = 'btn btn-danger';
        btn.style.color = 'white';
    }
}
function callPatientFromDriver() {
    let vp = StateHub.victimPhone;
    if (vp === '--' || vp === 'No Number Provided') {
        alert('Patient did not provide a contact number.');
    } else {
        alert('Dialing Patient: ' + vp);
    }
}
function drawDriverToVictimRoute() {
    if (!StateHub.victimLatLng) return;
    let assignedAmb = ambulances.find(a => a.id == StateHub.assignedAmbId) || ambulances[0];
    if (!assignedAmb) return;
    clearRouteLines();
    const waypoints = [
        { lat: assignedAmb.lat, lng: assignedAmb.lng },
        { lat: StateHub.victimLatLng.lat, lng: StateHub.victimLatLng.lng }
    ];
    fetchOsrmRoute(waypoints, '#10b981', (line) => {
        map.fitBounds(line.getBounds(), { padding: [50, 50] });
    });
}
function drawFinalRoute() {
    if (!StateHub.victimLatLng || !StateHub.selectedHospitalId) return;
    let assignedAmb = ambulances.find(a => a.id == StateHub.assignedAmbId) || ambulances[0];
    if (!assignedAmb) return;
    const hosp = graphNodes.find(n => n.id == StateHub.selectedHospitalId);
    if (!hosp) return;
    clearRouteLines();
    
    // Green path: Ambulance to Victim
    const waypointsLeg1 = [
        { lat: assignedAmb.lat, lng: assignedAmb.lng },
        { lat: StateHub.victimLatLng.lat, lng: StateHub.victimLatLng.lng }
    ];
    
    // Red path: Hospital to Ambulance (Halfway Doctor Service)
    const waypointsLeg2 = [
        { lat: hosp.lat, lng: hosp.lng },
        { lat: assignedAmb.lat, lng: assignedAmb.lng }
    ];
    
    fetchOsrmRoute(waypointsLeg1, '#10b981', (line1) => {
        if (line1) map.fitBounds(line1.getBounds(), { padding: [50, 50] });
    });
    fetchOsrmRoute(waypointsLeg2, '#ef4444', (line2) => {
        if (line2) {
            const currentBounds = map.getBounds();
            currentBounds.extend(line2.getBounds());
            map.fitBounds(currentBounds, { padding: [50, 50] });
        }
    });
}
buildMapUI();
