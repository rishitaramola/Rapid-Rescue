# 🚑 Smart Ambulance Routing System

A C++ based system that assigns ambulances to accident locations 
using shortest path and optimal assignment algorithms.

## Problem Statement
Given multiple ambulances and multiple accident locations in a city,
assign ambulances such that total response time is minimum.

## Algorithms Used
- **Dijkstra's Algorithm** - Shortest path from ambulance to accident
- **Greedy Assignment** - Minimum cost ambulance-accident matching
- **Priority Queue (Min Heap)** - Core of Dijkstra

## Data Structures Used
- Adjacency List - City graph representation
- Min Heap - Priority queue in Dijkstra
- 2D Matrix - Cost matrix for assignment
- Structs - Ambulance and Accident data

## Project Structure
```
SmartAmbulance/
├── src/
│   ├── main.cpp
│   ├── graph.cpp
│   ├── dijkstra.cpp
│   └── assignment.cpp
└── include/
    ├── graph.h
    ├── dijkstra.h
    └── assignment.h
```

## How to Run
```
g++ src/main.cpp src/graph.cpp src/dijkstra.cpp src/assignment.cpp -I include -std=c++17 -o run
.\run.exe
```

