#include "../include/assignment.h"

// Build cost matrix using Dijkstra for each ambulance
// cost[i][j] = travel time from ambulance i to accident j
vector<vector<int>> buildCostMatrix(vector<Ambulance>& ambulances, vector<Accident>& accidents) {
    int n = ambulances.size();
    int m = accidents.size();

    vector<vector<int>> cost(n, vector<int>(m, 0));

    for (int i = 0; i < n; i++) {
        // Run Dijkstra from this ambulance's location
        vector<int> dist = dijkstra(ambulances[i].location);

        for (int j = 0; j < m; j++) {
            int raw_dist = dist[accidents[j].location];

            // Apply priority factor: critical patients get lower effective cost
            // so they are assigned faster
            float priority_factor = 1.0;
            if (accidents[j].priority == 1) priority_factor = 0.7;  // critical
            if (accidents[j].priority == 2) priority_factor = 0.85; // high

            cost[i][j] = (int)(raw_dist * priority_factor);
        }
    }

    return cost;
}

// Print cost matrix in a clean table format
void printCostMatrix(vector<vector<int>>& cost, vector<Ambulance>& ambulances, vector<Accident>& accidents) {
    int n = ambulances.size();
    int m = accidents.size();

    cout << "\n=== Cost Matrix (Effective Travel Time in mins) ===" << endl;
    cout << "       ";
    for (int j = 0; j < m; j++) {
        cout << "  Acc" << accidents[j].id << "  ";
    }
    cout << endl;
    cout << "       ";
    for (int j = 0; j < m; j++) {
        string pLabel = (accidents[j].priority == 1) ? "[CRIT]" :
                        (accidents[j].priority == 2) ? "[HIGH]" : "[NORM]";
        cout << pLabel << " ";
    }
    cout << endl;
    cout << "---------------------------------------------------" << endl;

    for (int i = 0; i < n; i++) {
        cout << "Amb " << ambulances[i].id << " | ";
        for (int j = 0; j < m; j++) {
            if (cost[i][j] == INF)
                cout << "  INF  ";
            else
                cout << "   " << cost[i][j] << "   ";
        }
        cout << endl;
    }
    cout << "---------------------------------------------------" << endl;
}

// Greedy Assignment Algorithm
// Picks the minimum cost (ambulance, accident) pair each iteration
void assignAmbulances(vector<Ambulance>& ambulances, vector<Accident>& accidents, vector<vector<int>>& cost) {
    int n = ambulances.size();
    int m = accidents.size();

    vector<bool> usedAmb(n, false);
    vector<bool> usedAcc(m, false);

    int totalTime = 0;
    int assigned = 0;

    cout << "\n=== Ambulance Assignments ===" << endl;
    cout << "---------------------------------------------------" << endl;

    for (int k = 0; k < min(n, m); k++) {
        int minCost = INF;
        int bestAmb = -1, bestAcc = -1;

        // Find minimum cost pair not yet assigned
        for (int i = 0; i < n; i++) {
            if (usedAmb[i]) continue;
            for (int j = 0; j < m; j++) {
                if (usedAcc[j]) continue;
                if (cost[i][j] < minCost) {
                    minCost = cost[i][j];
                    bestAmb = i;
                    bestAcc = j;
                }
            }
        }

        if (bestAmb != -1 && bestAcc != -1) {
            string pLabel = (accidents[bestAcc].priority == 1) ? "CRITICAL" :
                            (accidents[bestAcc].priority == 2) ? "HIGH"     : "NORMAL";

            cout << "Ambulance " << ambulances[bestAmb].id
                 << " (at Location " << ambulances[bestAmb].location << ")"
                 << "  -->  Accident " << accidents[bestAcc].id
                 << " (at Location " << accidents[bestAcc].location << ")"
                 << "  |  Priority: " << pLabel
                 << "  |  ETA: " << minCost << " mins"
                 << endl;

            usedAmb[bestAmb] = true;
            usedAcc[bestAcc] = true;
            totalTime += minCost;
            assigned++;
        }
    }

    // Report unhandled accidents if ambulances < accidents
    for (int j = 0; j < m; j++) {
        if (!usedAcc[j]) {
            cout << "WARNING: Accident " << accidents[j].id
                 << " at Location " << accidents[j].location
                 << " has NO ambulance available!" << endl;
        }
    }

    cout << "---------------------------------------------------" << endl;
    cout << "Total Assignments  : " << assigned << endl;
    cout << "Total Response Time: " << totalTime << " mins" << endl;
    cout << "---------------------------------------------------" << endl;
}
