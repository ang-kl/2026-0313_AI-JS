# C++ port of the GCN substrate compute core. Standard library only - no third-party
# deps (matches the numpy-only ethos of the Python reference). C++17, g++ or clang++.
#
#   make            build both binaries
#   make test       build + run both self-tests (structural parity with the Python)
#   make clean      remove binaries and local substrate.bin
CXX      ?= g++
CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra
HEADERS   = json.hpp substrate.hpp linkpred.hpp
SRV_HEADERS = $(HEADERS) suggest.hpp similar.hpp resolve.hpp classify.hpp classify_ssoc.hpp

all: build_substrate linkpred gcn server

build_substrate: build_substrate.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) -o $@ build_substrate.cpp

linkpred: linkpred.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) -o $@ linkpred.cpp

gcn: gcn.cpp gcn.hpp
	$(CXX) $(CXXFLAGS) -o $@ gcn.cpp

server: server.cpp $(SRV_HEADERS)
	$(CXX) $(CXXFLAGS) -pthread -o $@ server.cpp

classify_selftest: classify_selftest.cpp classify.hpp json.hpp
	$(CXX) $(CXXFLAGS) -o $@ classify_selftest.cpp

classify_ssoc_selftest: classify_ssoc_selftest.cpp classify_ssoc.hpp json.hpp
	$(CXX) $(CXXFLAGS) -o $@ classify_ssoc_selftest.cpp

test: build_substrate linkpred gcn classify_selftest classify_ssoc_selftest
	./build_substrate --self-test
	./linkpred --self-test
	./gcn --self-test
	./classify_selftest --index taxonomy-data/ssic2020-index.json
	./classify_ssoc_selftest --hierarchy taxonomy-data/ssoc2024-hierarchy.json --changes taxonomy-data/ssoc2024-type-of-change.json

clean:
	rm -f build_substrate linkpred gcn server classify_selftest classify_ssoc_selftest substrate.bin substrate_meta.json

.PHONY: all test clean
