#ifndef DIJKSTRA_H
#define DIJKSTRA_H

#include "graph.h"

// Returns shortest distances from src to all nodes
pair<vector<int>, vector<int>> dijkstra(int src);

// Prints the shortest path from src to dest
void printPath(int src, int dest, vector<int>& parent);

#endif
