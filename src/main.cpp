#include "../include/graph.h"
#include "../include/dijkstra.h"
#include "../include/assignment.h"

// ============================================================
//  SMART AMBULANCE ROUTING SYSTEM - Phase 2
//  DAA Project | Algorithms: Dijkstra + Greedy Assignment
// ============================================================

void printHeader() {
    cout << "=============================================" << endl;
    cout << "     SMART AMBULANCE ROUTING SYSTEM         " << endl;
    cout << "     Phase 2: Routing + Assignment          " << endl;
    cout << "=============================================" << endl;
}

void setupCityMap() {
    // City has 8 locations (nodes 0 to 7)
    // Nodes: 0=Hospital, 1=CrossroadA, 2=CrossroadB, 3=Market,
    //        4=School, 5=Park, 6=Station, 7=Highway
    V = 8;

    // Roads (edges with travel time in minutes)
    addEdge(0, 1, 4);   // Hospital <-> CrossroadA
    addEdge(0, 2, 3);   // Hospital <-> CrossroadB
    addEdge(1, 2, 1);   // CrossroadA <-> CrossroadB
    addEdge(1, 3, 6);   // CrossroadA <-> Market
    addEdge(2, 4, 5);   // CrossroadB <-> School
    addEdge(3, 5, 4);   // Market <-> Park
    addEdge(3, 6, 2);   // Market <-> Station
    addEdge(4, 6, 3);   // School <-> Station
    addEdge(5, 7, 5);   // Park <-> Highway
    addEdge(6, 7, 2);   // Station <-> Highway
}

int main() {

    printHeader();

    // ---- STEP 1: Build City Map ----
    setupCityMap();
    printGraph();

    // ---- STEP 2: Set Ambulance Locations ----
    vector<Ambulance> ambulances = {
        {1, 0, true},   // Ambulance 1 at Hospital (node 0)
        {2, 2, true},   // Ambulance 2 at CrossroadB (node 2)
        {3, 6, true}    // Ambulance 3 at Station (node 6)
    };

    cout << "\n=== Ambulances ===" << endl;
    for (auto& a : ambulances) {
        cout << "Ambulance " << a.id << " -> Location " << a.location << endl;
    }

    // ---- STEP 3: Register Emergency Accidents ----
    // priority: 1=Critical, 2=High, 3=Normal
    vector<Accident> accidents = {
        {1, 7, 1},   // Accident 1 at Highway - CRITICAL
        {2, 5, 2},   // Accident 2 at Park - HIGH
        {3, 3, 3}    // Accident 3 at Market - NORMAL
    };

    cout << "\n=== Emergency Requests ===" << endl;
    for (auto& acc : accidents) {
        string p = (acc.priority == 1) ? "CRITICAL" : (acc.priority == 2) ? "HIGH" : "NORMAL";
        cout << "Accident " << acc.id << " -> Location " << acc.location << " | Priority: " << p << endl;
    }

    // ---- STEP 4: Build Cost Matrix ----
    cout << "\n[Running Dijkstra for each ambulance...]" << endl;
    vector<vector<int>> cost = buildCostMatrix(ambulances, accidents);
    printCostMatrix(cost, ambulances, accidents);

    // ---- STEP 5: Assign Ambulances (Greedy) ----
    assignAmbulances(ambulances, accidents, cost);

    // ---- STEP 6: Dijkstra Demo ----
    cout << "\n=== Shortest Distances from Ambulance 1 (Location 0) ===" << endl;
    vector<int> dist = dijkstra(0);
    for (int i = 0; i < V; i++) {
        if (dist[i] == INF)
            cout << "Location " << i << " : Unreachable" << endl;
        else
            cout << "Location " << i << " : " << dist[i] << " mins" << endl;
    }

    return 0;
}
