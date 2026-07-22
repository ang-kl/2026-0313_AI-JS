// GCN encoder (C++ port of gcn_numpy.py) - a 2-layer Kipf & Welling graph convolution in
// dependency-free C++ (a tiny dense-matrix type, standard library only). Same architecture
// as the NumPy reference and the theory deck:
//     H^(l+1) = sigma( A_hat @ H^(l) @ W^(l) ),  A_hat = D^-1/2 (A+I) D^-1/2.
//
// Task: node classification. `--mlp` sets A_hat = I (features-only baseline); the gap
// between GCN and MLP is the value the graph structure adds. Offline research probe - it
// authors no number the app shows.
//
// RNG honesty (same as linkpred): NumPy's PRNG is not reproduced bit-for-bit, so on real
// data the accuracy is statistically comparable, not identical. The self-test asserts a
// STRUCTURAL fact (on a homophilous graph the GCN beats the features-only MLP) that holds
// regardless of the exact PRNG.
#pragma once
#include <vector>
#include <cmath>
#include <random>
#include <algorithm>
#include <cstdint>

namespace gcn {

// --- tiny row-major dense matrix ---
struct Mat {
  int r = 0, c = 0;
  std::vector<float> d;
  Mat() {}
  Mat(int rows, int cols, float v = 0.0f) : r(rows), c(cols), d((size_t)rows * cols, v) {}
  float& at(int i, int j) { return d[(size_t)i * c + j]; }
  float at(int i, int j) const { return d[(size_t)i * c + j]; }
};

inline Mat matmul(const Mat& A, const Mat& B) {
  Mat O(A.r, B.c, 0.0f);
  for (int i = 0; i < A.r; ++i)
    for (int k = 0; k < A.c; ++k) {
      float a = A.at(i, k);
      if (a == 0.0f) continue;
      const float* brow = &B.d[(size_t)k * B.c];
      float* orow = &O.d[(size_t)i * O.c];
      for (int j = 0; j < B.c; ++j) orow[j] += a * brow[j];
    }
  return O;
}

inline Mat transpose(const Mat& A) {
  Mat O(A.c, A.r);
  for (int i = 0; i < A.r; ++i)
    for (int j = 0; j < A.c; ++j) O.at(j, i) = A.at(i, j);
  return O;
}

inline Mat relu(const Mat& A) {
  Mat O = A;
  for (auto& x : O.d) if (x < 0) x = 0;
  return O;
}

inline void softmaxRows(Mat& Z) {
  for (int i = 0; i < Z.r; ++i) {
    float* row = &Z.d[(size_t)i * Z.c];
    float mx = row[0];
    for (int j = 1; j < Z.c; ++j) mx = std::max(mx, row[j]);
    float sum = 0;
    for (int j = 0; j < Z.c; ++j) { row[j] = std::exp(row[j] - mx); sum += row[j]; }
    float inv = sum > 0 ? 1.0f / sum : 0.0f;
    for (int j = 0; j < Z.c; ++j) row[j] *= inv;
  }
}

// A_hat = D^-1/2 (A+I) D^-1/2, or I when mlp=true (features-only baseline).
inline Mat normalizedAdj(const Mat& A, bool mlp) {
  int N = A.r;
  Mat Ah(N, N, 0.0f);
  if (mlp) { for (int i = 0; i < N; ++i) Ah.at(i, i) = 1.0f; return Ah; }
  std::vector<float> deg(N, 0.0f);
  for (int i = 0; i < N; ++i) {
    float s = 1.0f;  // +I self-loop
    for (int j = 0; j < N; ++j) s += A.at(i, j);
    deg[i] = s;
  }
  std::vector<float> dinv(N);
  for (int i = 0; i < N; ++i) dinv[i] = 1.0f / std::sqrt(std::max(deg[i], 1e-12f));
  for (int i = 0; i < N; ++i)
    for (int j = 0; j < N; ++j) {
      float aij = A.at(i, j) + (i == j ? 1.0f : 0.0f);
      if (aij != 0.0f) Ah.at(i, j) = dinv[i] * aij * dinv[j];
    }
  return Ah;
}

// Adam over a fixed set of parameter matrices (with L2 weight decay), mirroring gcn_numpy.py.
struct Adam {
  float lr, wd; int t = 0;
  std::vector<Mat*> p;
  std::vector<Mat> m, v;
  Adam(std::vector<Mat*> params, float lr_, float wd_) : lr(lr_), wd(wd_), p(params) {
    for (auto* x : p) { m.emplace_back(x->r, x->c, 0.0f); v.emplace_back(x->r, x->c, 0.0f); }
  }
  void step(const std::vector<Mat>& grads) {
    t++;
    float b1c = 1.0f - std::pow(0.9f, t), b2c = 1.0f - std::pow(0.999f, t);
    for (size_t i = 0; i < p.size(); ++i) {
      Mat& P = *p[i]; const Mat& G = grads[i];
      for (size_t k = 0; k < P.d.size(); ++k) {
        float g = G.d[k] + wd * P.d[k];
        m[i].d[k] = 0.9f * m[i].d[k] + 0.1f * g;
        v[i].d[k] = 0.999f * v[i].d[k] + 0.001f * g * g;
        float mh = m[i].d[k] / b1c, vh = v[i].d[k] / b2c;
        P.d[k] -= lr * mh / (std::sqrt(vh) + 1e-8f);
      }
    }
  }
};

struct Graph {
  Mat X, A;                    // features [N x F], adjacency [N x N]
  std::vector<int> y;          // labels [N]
  std::vector<char> tr, va, te;// masks [N]
  int nClasses = 0;
};

struct TrainResult { float valAcc = 0, testAcc = 0; int bestEpoch = 0; };

inline float accuracy(const Mat& logits, const std::vector<int>& y, const std::vector<char>& mask) {
  int correct = 0, n = 0;
  for (int i = 0; i < logits.r; ++i) {
    if (!mask[i]) continue;
    int arg = 0; float best = logits.at(i, 0);
    for (int j = 1; j < logits.c; ++j) if (logits.at(i, j) > best) { best = logits.at(i, j); arg = j; }
    if (arg == y[i]) correct++;
    n++;
  }
  return n ? (float)correct / n : 0.0f;
}

inline TrainResult train(const Graph& g, int hidden = 48, int epochs = 300, float lr = 0.02f,
                         float wd = 5e-4f, float dropout = 0.5f, bool mlp = false,
                         uint64_t seed = 0, int patience = 40) {
  std::mt19937_64 rng(seed);
  std::uniform_real_distribution<float> uni(0.0f, 1.0f);
  int N = g.X.r, F = g.X.c, C = g.nClasses;

  Mat Ah = normalizedAdj(g.A, mlp);
  Mat Y(N, C, 0.0f);
  for (int i = 0; i < N; ++i) Y.at(i, g.y[i]) = 1.0f;

  auto glorot = [&](int a, int b) {
    float s = std::sqrt(6.0f / (a + b));
    Mat W(a, b);
    for (auto& x : W.d) x = (uni(rng) * 2.0f - 1.0f) * s;
    return W;
  };
  Mat W0 = glorot(F, hidden), W1 = glorot(hidden, C);
  Adam opt({&W0, &W1}, lr, wd);

  Mat AX = matmul(Ah, g.X);   // precompute (static graph + features)
  int ntr = 0; for (char m : g.tr) ntr += m ? 1 : 0;

  TrainResult best; float bestVa = 0; int wait = 0;

  auto applyDropout = [&](const Mat& M) {
    if (dropout <= 0) return M;
    Mat O = M; float scale = 1.0f / (1.0f - dropout);
    for (auto& x : O.d) x = (uni(rng) > dropout) ? x * scale : 0.0f;
    return O;
  };

  for (int ep = 1; ep <= epochs; ++ep) {
    // forward (with input + hidden dropout)
    Mat Xin = applyDropout(g.X);
    Mat AXd = matmul(Ah, Xin);
    Mat Z1 = matmul(AXd, W0);
    Mat H1 = relu(Z1);
    Mat Hd = applyDropout(H1);
    Mat AhHd = matmul(Ah, Hd);
    Mat P = matmul(AhHd, W1);
    softmaxRows(P);

    // loss grad on TRAIN nodes
    Mat dZ2 = P;
    for (int i = 0; i < N; ++i)
      for (int j = 0; j < C; ++j) {
        float v = (P.at(i, j) - Y.at(i, j));
        dZ2.at(i, j) = g.tr[i] ? v / std::max(ntr, 1) : 0.0f;
      }
    Mat dW1 = matmul(transpose(AhHd), dZ2);
    Mat dH1 = matmul(matmul(Ah, dZ2), transpose(W1));  // Ah is symmetric -> Ah^T = Ah
    Mat dZ1 = dH1;
    for (int k = 0; k < (int)dZ1.d.size(); ++k) dZ1.d[k] *= (Z1.d[k] > 0 ? 1.0f : 0.0f);
    Mat dW0 = matmul(transpose(AXd), dZ1);
    opt.step({dW0, dW1});

    // eval (no dropout), every 5 epochs
    if (ep % 5 == 0 || ep == epochs) {
      Mat Zev = matmul(matmul(Ah, relu(matmul(AX, W0))), W1);
      float va = accuracy(Zev, g.y, g.va), te = accuracy(Zev, g.y, g.te);
      if (va > bestVa) { bestVa = va; best.valAcc = va; best.testAcc = te; best.bestEpoch = ep; wait = 0; }
      else { wait += 5; }
      if (wait >= patience) break;
    }
  }
  return best;
}

}  // namespace gcn
