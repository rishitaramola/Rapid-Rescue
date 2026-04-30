#ifndef ASSIGNMENT_H
#define ASSIGNMENT_H

#include "graph.h"
#include "dijkstra.h"

#include <vector>     // ✅ REQUIRED
#include <queue>
#include <string>

using namespace std;  // ✅ keep consistent with rest of your code

// ================= STRUCTURES =================

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

// Hospital structure
struct Hospital {
    int id;
    int location;
    int priorityFacility; // Higher is better
    string name;
};

// ================= GLOBALS =================

extern queue<string> doctorQueue;

// ================= FUNCTIONS =================

// Build cost matrix using UPDATED dijkstra (pair return)
vector<vector<int>> buildCostMatrix(vector<Ambulance>& ambulances, vector<Accident>& accidents);

// Choose best hospital based on priority + distance
int getBestHospital(vector<Hospital>& hospitals, int accidentLocation);

// Assignment logic (Hungarian + priority)
void assignAmbulances(vector<Ambulance>& ambulances,
                     vector<Accident>& accidents,
                     vector<vector<int>>& cost,
                     vector<Hospital>& hospitals);

// Print cost matrix
void printCostMatrix(vector<vector<int>>& cost,
                     vector<Ambulance>& ambulances,
                     vector<Accident>& accidents);

#endif
