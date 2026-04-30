#include "../include/graph.h"
#include "../include/dijkstra.h"
#include "../include/assignment.h"
#include <iostream>
#include <cmath>
using namespace std;

// Coordinates for each node (align roughly with your map)
vector<pair<int,int>> coords = {
    {0,0}, {2,1}, {1,3}, {4,2},
    {3,5}, {6,3}, {5,6}, {7,7}
};

// Distance calculator
int getDistance(int u, int v) {
    int x1 = coords[u].first;
    int y1 = coords[u].second;
    int x2 = coords[v].first;
    int y2 = coords[v].second;

    return sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

int main() {
    cout << "=============================================\n";
    cout << "     SMART AMBULANCE ROUTING SYSTEM\n";
    cout << "=============================================\n";

    V = 8;
    clearGraph();

    // Use REALISTIC weights
    addEdge(0, 1, getDistance(0,1));
    addEdge(0, 2, getDistance(0,2));
    addEdge(1, 2, getDistance(1,2));
    addEdge(1, 3, getDistance(1,3));
    addEdge(2, 4, getDistance(2,4));
    addEdge(3, 5, getDistance(3,5));
    addEdge(3, 6, getDistance(3,6));
    addEdge(4, 6, getDistance(4,6));
    addEdge(5, 7, getDistance(5,7));
    addEdge(6, 7, getDistance(6,7));

    vector<Ambulance> ambulances = {
        {1, 0, true},
        {2, 2, true},
        {3, 6, true}
    };

    vector<Accident> accidents = {
        {1, 7, 1},
        {2, 5, 2},
        {3, 3, 3}
    };

    vector<Hospital> hospitals = {
        {1, 1, 10, "Max Super Speciality Hospital"},
        {2, 4, 8, "Doon Govt Hospital"}
    };

    doctorQueue.push("Dr. Sharma");
    doctorQueue.push("Dr. Verma");
    doctorQueue.push("Dr. Kapoor");

    vector<vector<int>> cost = buildCostMatrix(ambulances, accidents);
    printCostMatrix(cost, ambulances, accidents);

    assignAmbulances(ambulances, accidents, cost, hospitals);

    return 0;
}
