// ============================================
// Ecosystem Logic: Map & Graph Definition
// ============================================

const graphNodes = [
    { id: 0, name: "Clock Tower (Ghantaghar)", lat: 30.3243, lng: 78.0418, type: "junction" },
    { id: 1, name: "ISBT (Clement Town)", lat: 30.2872, lng: 78.0039, type: "junction" },
    { id: 2, name: "Railway Station", lat: 30.3165, lng: 78.0322, type: "junction" },
    { id: 3, name: "Ballupur Chowk", lat: 30.3315, lng: 78.0050, type: "junction" },
    { id: 4, name: "Premnagar", lat: 30.3340, lng: 77.9540, type: "junction" },
    { id: 5, name: "Nanda Ki Chowki", lat: 30.3370, lng: 77.9640, type: "junction" },
    { id: 6, name: "FRI", lat: 30.3392, lng: 77.9942, type: "junction" },
    { id: 7, name: "Rajpur Road", lat: 30.3601, lng: 78.0772, type: "junction" },
    { id: 8, name: "Prince Chowk", lat: 30.3160, lng: 78.0423, type: "junction" },
    { id: 9, name: "Rispana Pull", lat: 30.2974, lng: 78.0384, type: "junction" },
    { id: 10, name: "GEU / GEHU", lat: 30.2687, lng: 77.9945, type: "junction" },
    { id: 11, name: "Doon Hospital", lat: 30.3193, lng: 78.0354, type: "hospital" },
    { id: 12, name: "Max Hospital", lat: 30.3662, lng: 78.0772, type: "hospital" }
];

const graphEdges = [
    [0, 2, 5], [0, 8, 3], [0, 11, 4], [0, 7, 15], 
    [2, 8, 4], [8, 9, 8], [9, 1, 10], [1, 10, 5], 
    [3, 0, 10], [3, 6, 4], [6, 5, 3], [5, 4, 2],
    [7, 12, 5], [2, 11, 2], [3, 1, 15]
];

// Map Setup without Dark Filters
const map = L.map('map').setView([30.3160, 78.0200], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, attribution: '© CartoDB'
}).addTo(map);

const nodeMarkers = {};
let ambMarkers = {};
let routeLines = [];
let globalAmbCount = 0;

let ambulances = []; 

function getNearestNode(lat, lng) {
    let bestDist = 999999;
    let bestNode = null;
    graphNodes.forEach(n => {
        // Simple euclidean distance for snapping
        let d = Math.pow(n.lat - lat, 2) + Math.pow(n.lng - lng, 2);
        if(d < bestDist) { bestDist = d; bestNode = n; }
    });
    return bestNode;
}

function buildMapUI() {
    // Draw edges
    graphEdges.forEach(edge => {
        const u = graphNodes[edge[0]], v = graphNodes[edge[1]], w = edge[2];
        L.polyline([[u.lat, u.lng], [v.lat, v.lng]], {
            color: '#cbd5e1', weight: 2, opacity: 0.5, dashArray: '5, 5'
        }).addTo(map).bindTooltip(`${w} mins`, {direction: 'center'});
    });

    // Draw strictly hubs
    graphNodes.forEach(node => {
        let isHosp = node.type === 'hospital';
        let bg = isHosp ? '#10b981' : '#94a3b8';
        let html = `<div style="background: ${bg}; width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`;
        
        let m = L.marker([node.lat, node.lng], {
            icon: L.divIcon({ className: 'custom-icon', html: html, iconSize:[20,20], iconAnchor:[10,10]})
        }).addTo(map);
        
        m.bindTooltip(`<b>${node.name}</b>`, {direction:'top'});
        nodeMarkers[node.id] = m;
    });

    // Preseed Drivers
    spawnDriver(30.2872, 78.0039); // Near ISBT
    spawnDriver(30.3340, 77.9540); // Near Premnagar
}

function spawnDriver(lat, lng) {
    let nearest = getNearestNode(lat, lng);
    globalAmbCount++;
    let newAmb = { id: globalAmbCount, locationNodeId: nearest.id, lat: lat, lng: lng, busy: false };
    ambulances.push(newAmb);
    
    let html = `<div style="background: #3b82f6; width:28px; height:28px; border-radius:50%; border:3px solid #fff; box-shadow: 0 0 15px #3b82f6; display:flex; align-items:center; justify-content:center; font-size:14px; cursor:pointer;" title="Click to Remove Driver">🚑</div>`;
    let m = L.marker([lat, lng], {
        icon: L.divIcon({ className: 'custom-icon', html: html, iconSize:[34,34], iconAnchor:[17,17]})
    }).addTo(map);

    // CLICK TO REMOVE DRIVER
    m.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (newAmb.busy) { alert("Cannot remove an ambulance currently in an active rescue!"); return; }
        map.removeLayer(m);
        ambulances = ambulances.filter(a => a.id !== newAmb.id);
    });
    
    ambMarkers[newAmb.id] = m;
}

// Global Map Click Handler
map.on('click', function(e) {
    if (StateHub.appStatus !== 'idle') return;

    let lat = e.latlng.lat;
    let lng = e.latlng.lng;
    let nearest = getNearestNode(lat, lng);
    let activeTab = document.querySelector('.tab-btn.active').innerText;

    if (activeTab.includes('Victim')) {
        StateHub.victimNodeId = nearest.id;
        StateHub.victimLatLng = {lat, lng};
        
        if (StateHub.tempVictimMarker) map.removeLayer(StateHub.tempVictimMarker);
        
        let html = `<div style="background: #ef4444; width:28px; height:28px; border-radius:50%; border:3px solid #fff; box-shadow: 0 0 15px #ef4444; display:flex; align-items:center; justify-content:center; font-size:14px; cursor:pointer;" title="Click to Cancel Incident">⭐</div>`;
        StateHub.tempVictimMarker = L.marker([lat, lng], {
            icon: L.divIcon({ className: 'custom-icon', html: html, iconSize:[34,34], iconAnchor:[17,17]})
        }).addTo(map);

        // CLICK TO REMOVE VICTIM
        StateHub.tempVictimMarker.on('click', (ev) => {
            L.DomEvent.stopPropagation(ev);
            map.removeLayer(StateHub.tempVictimMarker);
            StateHub.tempVictimMarker = null;
            document.getElementById('victimFormCard').classList.add('hidden');
        });

        document.getElementById('victimFormCard').classList.remove('hidden');
    } else if (activeTab.includes('Driver')) {
        spawnDriver(lat, lng);
    }
});


// ============================================
// Central Hub State Machine
// ============================================

let StateHub = {
    victimNodeId: null,
    victimLatLng: null,
    tempVictimMarker: null,
    
    condition: null,
    severity: null,
    strategy: null,
    hospitalLogic: null,
    specificHospId: null,
    
    assignedAmbId: null,
    selectedHospitalId: null,
    
    appStatus: 'idle', // idle, pinging, driver_negotiating, awaiting_hospital, confirmed
    pingTimerInt: null,
    goldenTimerInt: null,
    pingCount: 0, // Track which driver we are pinging
    victimPhone: '--'
};

function switchModule(moduleName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.module-overlay').forEach(el => el.classList.add('hidden'));
    document.getElementById(moduleName + 'UI').classList.remove('hidden');

    setTimeout(() => { map.invalidateSize(); }, 300);
}

function updateStatusUI(stepNumber) {
    document.querySelectorAll('.step').forEach((el, index) => {
        if (index + 1 < stepNumber) {
            el.className = 'step done';
        } else if (index + 1 === stepNumber) {
            el.className = 'step active';
        } else {
            el.className = 'step pending';
        }
    });
}

function startGoldenHour() {
    if(StateHub.goldenTimerInt) return;
    let secs = 3600; // 60 mins
    StateHub.goldenTimerInt = setInterval(() => {
        secs--;
        let m = Math.floor(secs/60).toString().padStart(2, '0');
        let s = (secs%60).toString().padStart(2, '0');
        document.getElementById('goldenHourClock').innerText = `${m}:${s}`;
    }, 1000);
}

// ============================================
// 1. VICTIM / INTAKE LOGIC
// ============================================

function toggleHospList() {
    let v = document.getElementById('vHospLogic').value;
    document.getElementById('vSpecificHosp').classList.toggle('hidden', v === 'system');
}

// Added Cancel Button to Form logic
function cancelVictimIntake() {
    if (StateHub.tempVictimMarker) map.removeLayer(StateHub.tempVictimMarker);
    StateHub.tempVictimMarker = null;
    document.getElementById('victimFormCard').classList.add('hidden');
    document.getElementById('victimFinalDetails').classList.add('hidden');
}

document.getElementById('btnSubmitVictim').addEventListener('click', () => {
    StateHub.condition = document.getElementById('vCondition').value || "Unknown Emergency";
    StateHub.severity = document.getElementById('vSeverity').value;
    StateHub.strategy = document.getElementById('vStrategy').value;
    StateHub.victimPhone = document.getElementById('vInitPhone').value || "No Number Provided";
    StateHub.hospitalLogic = document.getElementById('vHospLogic').value;
    if (StateHub.hospitalLogic === 'specific') {
        StateHub.specificHospId = document.getElementById('vSpecificHosp').value;
    }

    document.getElementById('victimFormCard').classList.add('hidden');
    updateStatusUI(1); 
    StateHub.appStatus = 'pinging';
    StateHub.pingCount = 0; // Reset ping count

    // Simulate system finding nearest driver based on euclidean to nearest node mapping
    setTimeout(() => triggerDriverPing(), 1000);
});

// ============================================
// 2. DRIVER LOGIC
// ============================================

function triggerDriverPing() {
    StateHub.pingCount++;
    if (StateHub.pingCount > 3) {
        alert("CRITICAL WARNING: All nearby drivers rejected or timed out. Mission Failed.");
        StateHub.appStatus = 'idle';
        updateStatusUI(0);
        return;
    }

    StateHub.appStatus = 'pinging';
    StateHub.assignedAmbId = ambulances[StateHub.pingCount - 1]?.id || ambulances[0].id; // Track which driver we ping

    document.getElementById('dPingCondition').innerText = "Condition: " + StateHub.condition;
    document.getElementById('dPingETA').innerText = "ETA: " + (StateHub.pingCount * 3 + 1) + " mins (Pinging Driver " + StateHub.pingCount + " / 3)"; 
    document.getElementById('driverPingOverlay').classList.remove('hidden');
    
    let timeLeft = 15;
    document.getElementById('pingTimer').innerText = timeLeft;
    StateHub.pingTimerInt = setInterval(() => {
        timeLeft--;
        document.getElementById('pingTimer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(StateHub.pingTimerInt);
            document.getElementById('driverPingOverlay').classList.add('hidden');
            alert("No response in 15 seconds! Locating next available driver...");
            setTimeout(() => triggerDriverPing(), 1000);
        }
    }, 1000);
}

function driverReject() {
    clearInterval(StateHub.pingTimerInt);
    document.getElementById('driverPingOverlay').classList.add('hidden');
    alert("Request Rejected! Alerting next nearest driver...");
    setTimeout(() => triggerDriverPing(), 1000);
}

function driverAccept() {
    clearInterval(StateHub.pingTimerInt);
    document.getElementById('driverPingOverlay').classList.add('hidden');
    document.getElementById('driverDashboard').classList.remove('hidden');
    
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

function proceedToHospitalGatekeeper() {
    StateHub.appStatus = 'awaiting_hospital';
    document.getElementById('driverWaitingPhase').classList.remove('hidden');
    updateStatusUI(3);

    document.getElementById('hospitalInquiryBox').classList.remove('hidden');
    document.getElementById('hInquiryCondition').innerText = "Inquiry: " + StateHub.condition;
    document.getElementById('hPatientPhone').innerText = StateHub.victimPhone;
    
    let sLabel = StateHub.severity == 1 ? "HIGH/CRITICAL" : StateHub.severity == 2 ? "MODERATE" : "LOW";
    document.getElementById('hSeverity').innerText = sLabel;
}

// ============================================
// 3. HOSPITAL GATEKEEPER LOGIC
// ============================================

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

    // VICTIM NOTIFICATION FEATURE
    document.getElementById('victimFinalDetails').classList.remove('hidden');
    let hospName = "Option B Selected System";
    if (StateHub.selectedHospitalId) {
        let n = graphNodes.find(x => x.id == StateHub.selectedHospitalId);
        if(n) hospName = n.name;
    }
    document.getElementById('vDetailHospName').innerText = "Hospital: " + hospName;
    document.getElementById('vDetailWard').innerText = "Ward: " + (StateHub.severity == 1 ? "ICU (Trauma) - Bed 04" : "ER Triage Area - Bed 12");
    
    // Wire up Hospital Desk Number to Victim
    let deskPhone = document.getElementById('hospDeskPhoneInput').value || "+91 (Hospital Reception)";
    document.getElementById('vDetailDoc').innerText = "Hospital Desk: " + deskPhone;
    document.getElementById('btnCallHospital').onclick = function() {
        alert("Dialing Hospital Desk: " + deskPhone);
    };

    // Reset contact form
    document.getElementById('vContactForm').classList.remove('hidden');
    document.getElementById('vPhoneInput').value = '';
    document.getElementById('vContactSuccess').classList.add('hidden');
    document.getElementById('hospContactBox').classList.add('hidden');

    drawFinalRoute();
}

// ============================================
// NEW: GPS Search & Contact Sync
// ============================================

function simulateGeoSearch() {
    let q = document.getElementById('vLocationSearch').value.toLowerCase();
    if(!q) return;
    
    // Find closest match or fallback
    let n = graphNodes.find(n => n.name.toLowerCase().includes(q));
    if(!n) n = graphNodes[4]; // Default to Premnagar based on user chat history
    
    let lat = n.lat + 0.002;
    let lng = n.lng + 0.002;
    
    // Trigger map click exactly at this GPS location
    let e = { latlng: { lat: lat, lng: lng } };
    map.fireEvent('click', e);
    map.flyTo([lat, lng], 15);
}

function submitVictimPhone() {
    let p = document.getElementById('vPhoneInput').value;
    if(!p) return;
    
    // Hide form, show success
    document.getElementById('vContactForm').classList.add('hidden');
    document.getElementById('vContactSuccess').classList.remove('hidden');
    
    // Magically sync directly to Hospital Admin Dashboard
    document.getElementById('hPatientPhone').innerText = p;
    document.getElementById('hospContactBox').classList.remove('hidden');
}

// ============================================
// NEW: Halfway Doctor Negotiation Workflow
// ============================================

function requestHalfwayDoc() {
    let btn = document.getElementById('btnRequestHalfway');
    btn.innerText = "⏳ Waiting for Hospital...";
    btn.disabled = true;
    btn.style.opacity = "0.7";
    
    // Ping Hospital
    document.getElementById('hospHalfwayBox').classList.remove('hidden');
    alert("Request sent to hospital! Check the Hospital tab to simulate approval.");
}

function replyHalfway(approved) {
    document.getElementById('hospHalfwayBox').classList.add('hidden');
    let btn = document.getElementById('btnRequestHalfway');
    
    if (approved) {
        btn.innerText = "✅ Doctor Dispatched!";
        btn.className = "btn btn-success";
        btn.style.color = "white";
    } else {
        btn.innerText = "❌ Doctor Unavailable";
        btn.className = "btn btn-danger";
        btn.style.color = "white";
    }
}

function hospitalReject() {
    document.getElementById('hospitalInquiryBox').classList.add('hidden');
    alert("Hospital Rejected! Triggering Call Victim Protocol to suggest Alternate.");
    document.getElementById('driverWaitingPhase').classList.add('hidden');
    document.getElementById('driverNegotiationPhase').classList.remove('hidden');
    StateHub.appStatus = 'driver_negotiating';
    updateStatusUI(2);
}

function callVictimFromDriver() {
    let vp = StateHub.victimPhone;
    if (vp === '--' || vp === 'No Number Provided') {
        alert("Victim did not provide a contact number.");
    } else {
        alert("Dialing Victim: " + vp);
    }
}

let currentRoutingControl = null;

function drawFinalRoute() {
    if(!StateHub.victimLatLng || !StateHub.selectedHospitalId) return;
    
    // Find assigned ambulance & hospital details
    let assignedAmb = ambulances.find(a => a.id == StateHub.assignedAmbId) || ambulances[0];
    let v = graphNodes.find(n => n.id == StateHub.selectedHospitalId);
    
    // Remove old route if exists
    if(currentRoutingControl) {
        map.removeControl(currentRoutingControl);
    }
    
    // Use true OSRM Street Mapping API (The physical route way)
    currentRoutingControl = L.Routing.control({
        waypoints: [
            L.latLng(assignedAmb.lat, assignedAmb.lng),
            L.latLng(StateHub.victimLatLng.lat, StateHub.victimLatLng.lng),
            L.latLng(v.lat, v.lng)
        ],
        lineOptions: {
            styles: [{color: '#ef4444', opacity: 0.9, weight: 6}]
        },
        createMarker: function() { return null; }, // Hide default green markers
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        show: false // Hide the step-by-step box natively
    }).addTo(map);
}

// Boot
buildMapUI();
