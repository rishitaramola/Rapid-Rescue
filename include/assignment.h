#ifndef ASSIGNMENT_H
#define ASSIGNMENT_H

#include "graph.h"
#include "dijkstra.h"

// Ambulance structure
struct Ambulance {
    int id;
    int location;
    bool available;
};

// Accident/Emergency structure
struct Accident {
    int id;
    int location;
    int priority;   // 1 = critical, 2 = high, 3 = normal
};

// Build cost matrix: cost[i][j] = time for ambulance i to reach accident j
vector<vector<int>> buildCostMatrix(vector<Ambulance>& ambulances, vector<Accident>& accidents);

// Greedy assignment: assigns ambulances to accidents
void assignAmbulances(vector<Ambulance>& ambulances, vector<Accident>& accidents, vector<vector<int>>& cost);

// Print cost matrix
void printCostMatrix(vector<vector<int>>& cost, vector<Ambulance>& ambulances, vector<Accident>& accidents);

#endif
