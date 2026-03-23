#include "../include/graph.h"

// Define global variables
int V;
vector<pair<int,int>> adj[MAX];

// Add undirected weighted edge
void addEdge(int u, int v, int w) {
    adj[u].push_back({v, w});
    adj[v].push_back({u, w});
}

// Print the adjacency list
void printGraph() {
    cout << "\n=== City Map (Graph) ===" << endl;
    cout << "Nodes = Locations, Edges = Roads, Weight = Travel Time (mins)" << endl;
    cout << "-------------------------------------------" << endl;
    for (int i = 0; i < V; i++) {
        cout << "Location " << i << " connects to: ";
        for (auto& edge : adj[i]) {
            cout << "[Location " << edge.first << ", Time: " << edge.second << " min]  ";
        }
        cout << endl;
    }
    cout << "-------------------------------------------" << endl;
}
