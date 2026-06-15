#include "../include/assignment.h"
#include <iostream>
#include <iomanip>
#include <algorithm>

using namespace std;

queue<string> doctorQueue;

// ================= BUILD COST MATRIX =================
vector<vector<int>> buildCostMatrix(vector<Ambulance>& ambulances, vector<Accident>& accidents) {
    int n = ambulances.size();
    int m = accidents.size();

    vector<vector<int>> cost(n, vector<int>(m, 0));

    for (int i = 0; i < n; i++) {
        // ✅ FIX: use new dijkstra return type
        auto result = dijkstra(ambulances[i].location);
        vector<int> dist = result.first;

        for (int j = 0; j < m; j++) {
            int raw_dist = dist[accidents[j].location];

            float priority_factor = 1.0;
            if (accidents[j].priority == 1) priority_factor = 0.7;
            else if (accidents[j].priority == 2) priority_factor = 0.85;

            cost[i][j] = (int)(raw_dist * priority_factor);
        }
    }
    return cost;
}

// ================= PRINT MATRIX =================
void printCostMatrix(vector<vector<int>>& cost, vector<Ambulance>& ambulances, vector<Accident>& accidents) {
    int n = ambulances.size();
    int m = accidents.size();

    cout << "\n=== Cost Matrix (Effective Travel Time in mins) ===" << endl;

    cout << "         ";
    for (int j = 0; j < m; j++) cout << "Acc" << accidents[j].id << "    ";
    cout << endl;

    cout << "       ";
    for (int j = 0; j < m; j++) {
        string pLabel = (accidents[j].priority == 1) ? "[CRIT] " :
                        (accidents[j].priority == 2) ? "[HIGH] " : "[NORM] ";
        cout << pLabel;
    }
    cout << endl;

    cout << "---------------------------------------------------" << endl;

    for (int i = 0; i < n; i++) {
        cout << "Amb " << ambulances[i].id << " | ";
        for (int j = 0; j < m; j++) {
            if (cost[i][j] == INF) cout << "  INF   ";
            else cout << setw(5) << cost[i][j] << "  ";
        }
        cout << endl;
    }

    cout << "---------------------------------------------------" << endl;
}

// ================= ASSIGN AMBULANCES =================
void assignAmbulances(vector<Ambulance>& ambulances,
                     vector<Accident>& accidents,
                     vector<vector<int>>& cost,
                     vector<Hospital>& hospitals) {

    int n = cost.size();
    if (n == 0) return;
    int m = cost[0].size();
    int size = max(n, m);

    vector<vector<int>> A(size + 1, vector<int>(size + 1, 0));

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) A[i + 1][j + 1] = cost[i][j];
        for (int j = m; j < size; j++) A[i + 1][j + 1] = 99999;
    }

    for (int i = n; i < size; i++)
        for (int j = 0; j < size; j++)
            A[i + 1][j + 1] = 99999;

    vector<int> u(size + 1), v(size + 1), p(size + 1), way(size + 1);

    // Hungarian Algorithm
    for (int i = 1; i <= size; ++i) {
        p[0] = i;
        int j0 = 0;
        vector<int> minv(size + 1, INF);
        vector<bool> used(size + 1, false);

        do {
            used[j0] = true;
            int i0 = p[j0], delta = INF, j1 = 0;

            for (int j = 1; j <= size; ++j) {
                if (!used[j]) {
                    int cur = A[i0][j] - u[i0] - v[j];
                    if (cur < minv[j]) {
                        minv[j] = cur;
                        way[j] = j0;
                    }
                    if (minv[j] < delta) {
                        delta = minv[j];
                        j1 = j;
                    }
                }
            }

            for (int j = 0; j <= size; ++j) {
                if (used[j]) {
                    u[p[j]] += delta;
                    v[j] -= delta;
                } else {
                    minv[j] -= delta;
                }
            }

            j0 = j1;
        } while (p[j0] != 0);

        do {
            int j1 = way[j0];
            p[j0] = p[j1];
            j0 = j1;
        } while (j0);
    }

    vector<int> ans(size + 1);
    for (int j = 1; j <= size; ++j) ans[p[j]] = j;

    cout << "\n=== Ambulance Assignments ===" << endl;
    cout << "---------------------------------------------------" << endl;

    int totalTime = 0, assigned = 0;

    for (int i = 1; i <= n; i++) {
        int bestAccIndex = ans[i] - 1;

        if (bestAccIndex < m) {
            int originalCost = cost[i - 1][bestAccIndex];
            totalTime += originalCost;
            assigned++;

            Accident& acc = accidents[bestAccIndex];
            Ambulance& amb = ambulances[i - 1];

            cout << "Ambulance " << amb.id
                 << " -> Accident " << acc.id
                 << " | ETA: " << originalCost << " mins" << endl;

            // ================= HOSPITAL LOGIC =================
            if (acc.priority == 1) {
                string doc = "Emergency On-Call";
                if (!doctorQueue.empty()) {
                    doc = doctorQueue.front();
                    doctorQueue.pop();
                }

                cout << "   [!] Doctor Assigned: " << doc << endl;

                // ✅ FIX: use new dijkstra
                auto result = dijkstra(acc.location);
                vector<int> distToHosp = result.first;

                int bestScore = -1, selectedHosp = -1;

                for (int h = 0; h < hospitals.size(); h++) {
                    int d = distToHosp[hospitals[h].location];
                    int score = hospitals[h].priorityFacility * 10 - d;

                    if (score > bestScore) {
                        bestScore = score;
                        selectedHosp = h;
                    }
                }

                if (selectedHosp != -1) {
                    cout << "   [+] Hospital: " << hospitals[selectedHosp].name << endl;
                }
            }
        }
    }

    cout << "---------------------------------------------------" << endl;
    cout << "Total Assignments  : " << assigned << endl;
    cout << "Total Response Time: " << totalTime << " mins" << endl;
    cout << "---------------------------------------------------" << endl;
}
