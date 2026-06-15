#ifndef GRAPH_H
#define GRAPH_H

#include <iostream>
#include <vector>
#include <utility>
#include <queue>
#include <climits>

using namespace std;

#define INF INT_MAX
#define MAX 100

// Global graph variables
extern int V;
extern vector<pair<int,int>> adj[MAX];

// Function declarations
void addEdge(int u, int v, int w);
void printGraph();
void clearGraph();

#endif
