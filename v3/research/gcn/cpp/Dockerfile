# Railway container for the GCN substrate service.
# Multi-stage: compile with g++, build the substrate from the bundled sample data, then
# ship a slim runtime that just runs the HTTP server.

# ---- build stage ----
FROM gcc:13 AS build
WORKDIR /src
COPY json.hpp substrate.hpp linkpred.hpp suggest.hpp ./
COPY build_substrate.cpp server.cpp ./
RUN g++ -std=c++17 -O2 -o build_substrate build_substrate.cpp \
 && g++ -std=c++17 -O2 -pthread -o server server.cpp
COPY sample-data ./sample-data
# Bake a substrate.bin from the SYNTHETIC sample data so the service boots with content.
# Swap this COPY + --data path for the real harvest output to serve real suggestions.
RUN ./build_substrate --data ./sample-data

# ---- runtime stage ----
FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends libstdc++6 \
 && rm -rf /var/lib/apt/lists/*
COPY --from=build /src/server /app/server
COPY --from=build /src/substrate.bin /app/substrate.bin
# Honesty defaults: the baked data is synthetic. Set SYNTHETIC=0 (and rebuild with real
# data) once the Phase 0 harvest is wired in.
ENV DATASET_LABEL=synthetic-sample
ENV SYNTHETIC=1
# Railway injects PORT at runtime; the server honours it (defaults to 8080 locally).
EXPOSE 8080
CMD ["/app/server", "--bin", "/app/substrate.bin"]
