# C++ port of the GCN substrate compute core. Standard library only - no third-party
# deps (matches the numpy-only ethos of the Python reference). C++17, g++ or clang++.
#
#   make            build both binaries
#   make test       build + run both self-tests (structural parity with the Python)
#   make clean      remove binaries and local substrate.bin
CXX      ?= g++
CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra
HEADERS   = json.hpp substrate.hpp linkpred.hpp

all: build_substrate linkpred

build_substrate: build_substrate.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) -o $@ build_substrate.cpp

linkpred: linkpred.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) -o $@ linkpred.cpp

test: all
	./build_substrate --self-test
	./linkpred --self-test

clean:
	rm -f build_substrate linkpred substrate.bin substrate_meta.json

.PHONY: all test clean
