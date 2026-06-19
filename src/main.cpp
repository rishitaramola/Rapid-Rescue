#include "../include/graph.h"
#include "../include/dijkstra.h"
#include "../include/assignment.h"
#include <iostream>
using namespace std;

int main() {
    cout << "=============================================\n";
    cout << "     SMART AMBULANCE ROUTING SYSTEM\n";
    cout << "          (DEHRADUN CITY MAP)\n";
    cout << "=============================================\n";

    V = 21; // 21 total nodes (0 to 20)
    clearGraph();

    // Mirroring exactly the graphEdges from frontend (app.js)
    addEdge(0, 2, 5);
    addEdge(0, 8, 3);
    addEdge(0, 11, 4);
    addEdge(0, 7, 15);
    addEdge(2, 8, 4);
    addEdge(8, 9, 8);
    addEdge(9, 1, 10);
    addEdge(1, 10, 5);
    addEdge(3, 0, 10);
    addEdge(3, 6, 4);
    addEdge(6, 5, 3);
    addEdge(5, 4, 2);
    addEdge(7, 12, 5);
    addEdge(2, 11, 2);
    addEdge(3, 1, 15);

    // New Edges
    addEdge(8, 17, 5);
    addEdge(17, 1, 10);
    addEdge(17, 18, 3);
    addEdge(13, 1, 5);
    addEdge(13, 9, 6);
    addEdge(13, 14, 5);
    addEdge(9, 15, 5);
    addEdge(9, 20, 8);
    addEdge(0, 16, 4);
    addEdge(16, 7, 10);
    addEdge(3, 19, 3);

    vector<Ambulance> ambulances = {
        {1, 13, true}, // Kargi Chowk
        {2, 14, true}, // Bengali Kothi
        {3, 1, true},  // ISBT
        {4, 0, true}   // Clock Tower
    };

    vector<Accident> accidents = {
        {1, 7, 1},  // Rajpur Road (priority 1)
        {2, 15, 2}, // Fountain Chowk
        {3, 6, 3},  // FRI
        {4, 10, 2}  // GEU
    };

    vector<Hospital> hospitals = {
        {1, 11, 8, "Doon Govt Hospital"},
        {2, 12, 10, "Max Super Speciality Hospital"},
        {3, 18, 9, "Shri Mahant Indiresh Hospital"},
        {4, 19, 9, "Synergy Hospital"},
        {5, 20, 8, "Kailash Hospital"}
    };

    doctorQueue.push("Dr. Sharma");
    doctorQueue.push("Dr. Verma");
    doctorQueue.push("Dr. Kapoor");
    doctorQueue.push("Dr. Rawat");

    vector<vector<int>> cost = buildCostMatrix(ambulances, accidents);
    printCostMatrix(cost, ambulances, accidents);

    assignAmbulances(ambulances, accidents, cost, hospitals);

    return 0;
}
