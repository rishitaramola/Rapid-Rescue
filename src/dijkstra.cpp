#include "../include/dijkstra.h"
#include <queue>     // ✅ ensure included
#include <vector>
#include <utility>   // ✅ for pair
#include <functional> // ✅ for greater

using namespace std;

pair<vector<int>, vector<int>> dijkstra(int src) {

    vector<int> dist(V, INF);
    vector<int> parent(V, -1);

    // Min-heap (distance, node)
    priority_queue<
        pair<int,int>,
        vector<pair<int,int>>,
        greater<pair<int,int>>
    > pq;

    dist[src] = 0;
    pq.push({0, src});

    while (!pq.empty()) {
        auto top = pq.top();
        pq.pop();

        int d = top.first;
        int node = top.second;

        // Skip outdated entries
        if (d != dist[node]) continue;

        for (auto &edge : adj[node]) {
            int neighbor = edge.first;
            int weight = edge.second;

            // Relaxation
            if (dist[node] + weight < dist[neighbor]) {
                dist[neighbor] = dist[node] + weight;
                parent[neighbor] = node;
                pq.push({dist[neighbor], neighbor});
            }
        }
    }

    return {dist, parent};
}
