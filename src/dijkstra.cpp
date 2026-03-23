#include "../include/dijkstra.h"

// Dijkstra's Algorithm
// Returns: dist[] array where dist[i] = shortest time from src to node i
vector<int> dijkstra(int src) {
    // dist[i] = shortest distance from src to node i
    vector<int> dist(V, INF);

    // parent[i] = previous node in shortest path to i (for path printing)
    vector<int> parent(V, -1);

    // Min-heap priority queue: {distance, node}
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;

    dist[src] = 0;
    pq.push({0, src});

    while (!pq.empty()) {
        int d    = pq.top().first;   // current shortest distance
        int node = pq.top().second;  // current node
        pq.pop();

        // Skip if we already found a better path
        if (d > dist[node]) continue;

        // Explore all neighbors
        for (auto& edge : adj[node]) {
            int neighbor = edge.first;
            int weight   = edge.second;

            // Relaxation step (core of Dijkstra)
            if (dist[node] + weight < dist[neighbor]) {
                dist[neighbor] = dist[node] + weight;
                parent[neighbor] = node;
                pq.push({dist[neighbor], neighbor});
            }
        }
    }

    return dist;
}

// Print the actual path from src to dest
void printPath(int src, int dest, vector<int>& parent) {
    if (parent[dest] == -1 && dest != src) {
        cout << "No path found";
        return;
    }

    vector<int> path;
    int curr = dest;
    while (curr != -1) {
        path.push_back(curr);
        curr = parent[curr];
    }

    // Reverse to get src -> dest order
    for (int i = path.size() - 1; i >= 0; i--) {
        cout << path[i];
        if (i != 0) cout << " -> ";
    }
}
