#include "../include/graph.h"

int V;
vector<pair<int,int>> adj[MAX];

void addEdge(int u, int v, int w) {
    adj[u].push_back({v, w});
    adj[v].push_back({u, w});
}

void clearGraph() {
    for (int i = 0; i < V; i++) {
        adj[i].clear();
    }
}
