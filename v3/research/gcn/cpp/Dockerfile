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
COPY real-data ./real-data
# Prefer the REAL harvest data if both files are present in real-data/; otherwise fall back
# to the SYNTHETIC sample. The dataset choice also decides the runtime honesty flag, written
# to dataset.env so the server reports synthetic:false only when it is actually serving real
# data. Dropping the two harvested .jsonl into real-data/ and redeploying is the ONLY step
# needed to go live - no code change.
RUN if [ -f ./real-data/esco_occupation_skills.jsonl ] && [ -f ./real-data/mcf_postings.jsonl ]; then \
      echo "[build] real-data present -> building REAL substrate"; \
      ./build_substrate --data ./real-data; \
      printf 'SYNTHETIC=0\nDATASET_LABEL=esco+mcf\n' > dataset.env; \
    else \
      echo "[build] no real-data -> building SYNTHETIC sample substrate"; \
      ./build_substrate --data ./sample-data; \
      printf 'SYNTHETIC=1\nDATASET_LABEL=synthetic-sample\n' > dataset.env; \
    fi

# ---- runtime stage ----
# No apt-get: the server is statically linked against libstdc++/libgcc and only needs the
# glibc that debian:bookworm-slim already ships. Faster, and nothing to stall on.
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=build /src/server /app/server
COPY --from=build /src/substrate.bin /app/substrate.bin
COPY --from=build /src/dataset.env /app/dataset.env
# Railway injects PORT at runtime; the server honours it. The SYNTHETIC / DATASET_LABEL flags
# come from the build-time dataset.env (sourced here) so they always match the baked data.
EXPOSE 8080
CMD ["sh", "-c", "set -a; . /app/dataset.env; set +a; exec /app/server --bin /app/substrate.bin"]
