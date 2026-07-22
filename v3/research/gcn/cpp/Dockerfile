# Railway container for the GCN substrate service.
# Multi-stage: compile with g++, build the substrate from the bundled sample data, then
# ship a slim runtime that just runs the HTTP server.

# ---- build stage ----
FROM gcc:13 AS build
WORKDIR /src
COPY json.hpp substrate.hpp linkpred.hpp suggest.hpp ./
COPY build_substrate.cpp server.cpp ./
# Statically link libstdc++/libgcc so the runtime image needs NO apt-get (the previous
# `apt-get install libstdc++6` step could stall for many minutes on a slow Debian mirror -
# the likely cause of a 20-minute Railway build). The binary then needs only libc, which
# every base image already has.
RUN g++ -std=c++17 -O2 -o build_substrate build_substrate.cpp \
 && g++ -std=c++17 -O2 -pthread -static-libgcc -static-libstdc++ -o server server.cpp
COPY sample-data ./sample-data
# Bake a substrate.bin from the SYNTHETIC sample data so the service boots with content.
# Swap this COPY + --data path for the real harvest output to serve real suggestions.
RUN ./build_substrate --data ./sample-data

# ---- runtime stage ----
# No apt-get: the server is statically linked against libstdc++/libgcc and only needs the
# glibc that debian:bookworm-slim already ships. Faster, and nothing to stall on.
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=build /src/server /app/server
COPY --from=build /src/substrate.bin /app/substrate.bin
# Honesty defaults: the baked data is synthetic. Set SYNTHETIC=0 (and rebuild with real
# data) once the Phase 0 harvest is wired in.
ENV DATASET_LABEL=synthetic-sample
ENV SYNTHETIC=1
# Railway injects PORT at runtime; the server honours it (defaults to 8080 locally).
EXPOSE 8080
CMD ["/app/server", "--bin", "/app/substrate.bin"]
