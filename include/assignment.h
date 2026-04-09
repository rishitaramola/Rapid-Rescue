#ifndef ASSIGNMENT_H
#define ASSIGNMENT_H

#include "graph.h"
#include "dijkstra.h"
#include <queue>
#include <string>

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

// Hospital structure for priority checking
struct Hospital {
    int id;
    int location;
    int priorityFacility; // Higher is better
    std::string name;
};

// Global Doctor Queue
extern std::queue<std::string> doctorQueue;

// Build cost matrix: cost[i][j] = time for ambulance i to reach accident j
vector<vector<int>> buildCostMatrix(vector<Ambulance>& ambulances, vector<Accident>& accidents);

// Evaluate Hospital Priority
int getBestHospital(vector<Hospital>& hospitals, int accidentLocation);

// Phase 3 Optimal Assignment (Hungarian Alg + Priority Logic)
void assignAmbulances(vector<Ambulance>& ambulances, vector<Accident>& accidents, vector<vector<int>>& cost, vector<Hospital>& hospitals);

// Print cost matrix
void printCostMatrix(vector<vector<int>>& cost, vector<Ambulance>& ambulances, vector<Accident>& accidents);

#endif
