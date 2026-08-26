// vite.config.js
import { defineConfig } from "file:///Users/akla/Library/Mobile%20Documents/com%7Eapple%7ECloudDocs/Downloads/Github/2026-0313_AI-JS/v3/node_modules/vite/dist/node/index.js";
import react from "file:///Users/akla/Library/Mobile%20Documents/com%7Eapple%7ECloudDocs/Downloads/Github/2026-0313_AI-JS/v3/node_modules/@vitejs/plugin-react/dist/index.mjs";

// vite-debug-plugin.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
var __vite_injected_original_import_meta_url = "file:///Users/akla/Library/Mobile%20Documents/com%7Eapple%7ECloudDocs/Downloads/Github/2026-0313_AI-JS/v3/vite-debug-plugin.js";
function debugSinkPlugin() {
  const dir = path.join(path.dirname(fileURLToPath(__vite_injected_original_import_meta_url)), "debug");
  return {
    name: "v3-debug-sink",
    apply: "serve",
    // dev server only
    configureServer(server) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (_) {
      }
      const write = (body, res) => {
        try {
          const data = JSON.parse(body || "{}");
          const sess = String(data.session || "").replace(/[^a-z0-9]/gi, "").slice(0, 16) || "unknown";
          const entries = Array.isArray(data.entries) ? data.entries : [];
          const day = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          const file = path.join(dir, `${sess}-${day}.jsonl`);
          const lines = entries.map((e) => JSON.stringify(e)).join("\n") + (entries.length ? "\n" : "");
          fs.appendFile(file, lines, () => {
          });
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: true, written: entries.length }));
        } catch (_) {
          res.statusCode = 500;
          res.end('{"ok":false}');
        }
      };
      server.middlewares.use("/__debug/log", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("method");
          return;
        }
        const chunks = [];
        let size = 0;
        req.on("data", (c) => {
          size += c.length;
          if (size > 8 * 1024 * 1024)
            req.destroy();
          else
            chunks.push(c);
        });
        req.on("end", () => write(Buffer.concat(chunks).toString("utf8"), res));
        req.on("error", () => {
          try {
            res.statusCode = 400;
            res.end('{"ok":false}');
          } catch (_) {
          }
        });
        setTimeout(() => {
          if (!res.writableEnded)
            write(Buffer.concat(chunks).toString("utf8"), res);
        }, 1500);
      });
    }
  };
}

// vite.config.js
var vite_config_default = defineConfig({
  plugins: [react(), debugSinkPlugin()]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAidml0ZS1kZWJ1Zy1wbHVnaW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYWtsYS9MaWJyYXJ5L01vYmlsZSBEb2N1bWVudHMvY29tfmFwcGxlfkNsb3VkRG9jcy9Eb3dubG9hZHMvR2l0aHViLzIwMjYtMDMxM19BSS1KUy92M1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2FrbGEvTGlicmFyeS9Nb2JpbGUgRG9jdW1lbnRzL2NvbX5hcHBsZX5DbG91ZERvY3MvRG93bmxvYWRzL0dpdGh1Yi8yMDI2LTAzMTNfQUktSlMvdjMvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2FrbGEvTGlicmFyeS9Nb2JpbGUlMjBEb2N1bWVudHMvY29tJTdFYXBwbGUlN0VDbG91ZERvY3MvRG93bmxvYWRzL0dpdGh1Yi8yMDI2LTAzMTNfQUktSlMvdjMvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHsgZGVidWdTaW5rUGx1Z2luIH0gZnJvbSAnLi92aXRlLWRlYnVnLXBsdWdpbi5qcydcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCksIGRlYnVnU2lua1BsdWdpbigpXSxcbn0pXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9ha2xhL0xpYnJhcnkvTW9iaWxlIERvY3VtZW50cy9jb21+YXBwbGV+Q2xvdWREb2NzL0Rvd25sb2Fkcy9HaXRodWIvMjAyNi0wMzEzX0FJLUpTL3YzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvYWtsYS9MaWJyYXJ5L01vYmlsZSBEb2N1bWVudHMvY29tfmFwcGxlfkNsb3VkRG9jcy9Eb3dubG9hZHMvR2l0aHViLzIwMjYtMDMxM19BSS1KUy92My92aXRlLWRlYnVnLXBsdWdpbi5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYWtsYS9MaWJyYXJ5L01vYmlsZSUyMERvY3VtZW50cy9jb20lN0VhcHBsZSU3RUNsb3VkRG9jcy9Eb3dubG9hZHMvR2l0aHViLzIwMjYtMDMxM19BSS1KUy92My92aXRlLWRlYnVnLXBsdWdpbi5qc1wiOy8vIHYzL3ZpdGUtZGVidWctcGx1Z2luLmpzIFx1MjAxNCBERVYtT05MWSBzaW5rIGZvciBkZWJ1ZyBtb2RlLlxuLy8gQWRkcyBQT1NUIC9fX2RlYnVnL2xvZyB0byB0aGUgVml0ZSBkZXYgc2VydmVyOyBhcHBlbmRzIE5ESlNPTiB0b1xuLy8gdjMvZGVidWcvPHNlc3Npb24+LTxZWVlZLU1NLUREPi5qc29ubC4gYXBwbHk6J3NlcnZlJyBcdTIxOTIgbmV2ZXIgaW4gdGhlIHByb2R1Y3Rpb24gYnVpbGQsXG4vLyBzbyBpdCBjYW5ub3QgYWZmZWN0IHRoZSBkZXBsb3llZCBzaXRlIChhbmQgdjEvdjIgbmV2ZXIgbG9hZCBpdCkuXG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ25vZGU6dXJsJztcblxuZXhwb3J0IGZ1bmN0aW9uIGRlYnVnU2lua1BsdWdpbigpIHtcbiAgY29uc3QgZGlyID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpLCAnZGVidWcnKTtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAndjMtZGVidWctc2luaycsXG4gICAgYXBwbHk6ICdzZXJ2ZScsIC8vIGRldiBzZXJ2ZXIgb25seVxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIHRyeSB7IGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pOyB9IGNhdGNoIChfKSB7fVxuICAgICAgY29uc3Qgd3JpdGUgPSAoYm9keSwgcmVzKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoYm9keSB8fCAne30nKTtcbiAgICAgICAgICBjb25zdCBzZXNzID0gU3RyaW5nKGRhdGEuc2Vzc2lvbiB8fCAnJykucmVwbGFjZSgvW15hLXowLTldL2dpLCAnJykuc2xpY2UoMCwgMTYpIHx8ICd1bmtub3duJzsgLy8gbm8gcGF0aCB0cmF2ZXJzYWxcbiAgICAgICAgICBjb25zdCBlbnRyaWVzID0gQXJyYXkuaXNBcnJheShkYXRhLmVudHJpZXMpID8gZGF0YS5lbnRyaWVzIDogW107XG4gICAgICAgICAgY29uc3QgZGF5ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgICAgICAgICBjb25zdCBmaWxlID0gcGF0aC5qb2luKGRpciwgYCR7c2Vzc30tJHtkYXl9Lmpzb25sYCk7XG4gICAgICAgICAgY29uc3QgbGluZXMgPSBlbnRyaWVzLm1hcCgoZSkgPT4gSlNPTi5zdHJpbmdpZnkoZSkpLmpvaW4oJ1xcbicpICsgKGVudHJpZXMubGVuZ3RoID8gJ1xcbicgOiAnJyk7XG4gICAgICAgICAgZnMuYXBwZW5kRmlsZShmaWxlLCBsaW5lcywgKCkgPT4ge30pO1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwOyByZXMuc2V0SGVhZGVyKCdjb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpOyByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgb2s6IHRydWUsIHdyaXR0ZW46IGVudHJpZXMubGVuZ3RoIH0pKTtcbiAgICAgICAgfSBjYXRjaCAoXykgeyByZXMuc3RhdHVzQ29kZSA9IDUwMDsgcmVzLmVuZCgne1wib2tcIjpmYWxzZX0nKTsgfVxuICAgICAgfTtcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9fX2RlYnVnL2xvZycsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7IHJlcy5zdGF0dXNDb2RlID0gNDA1OyByZXMuZW5kKCdtZXRob2QnKTsgcmV0dXJuOyB9XG4gICAgICAgIGNvbnN0IGNodW5rcyA9IFtdO1xuICAgICAgICBsZXQgc2l6ZSA9IDA7XG4gICAgICAgIHJlcS5vbignZGF0YScsIChjKSA9PiB7IHNpemUgKz0gYy5sZW5ndGg7IGlmIChzaXplID4gOCAqIDEwMjQgKiAxMDI0KSByZXEuZGVzdHJveSgpOyBlbHNlIGNodW5rcy5wdXNoKGMpOyB9KTtcbiAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB3cml0ZShCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoJ3V0ZjgnKSwgcmVzKSk7XG4gICAgICAgIHJlcS5vbignZXJyb3InLCAoKSA9PiB7IHRyeSB7IHJlcy5zdGF0dXNDb2RlID0gNDAwOyByZXMuZW5kKCd7XCJva1wiOmZhbHNlfScpOyB9IGNhdGNoIChfKSB7fSB9KTtcbiAgICAgICAgLy8gU2FmZXR5OiBpZiB0aGUgc3RyZWFtIG5ldmVyIGVtaXRzICdlbmQnIChzb21lIGRldi1zZXJ2ZXIgc3RhdGVzKSwgZmx1c2ggd2hhdCB3ZSBoYXZlLlxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgaWYgKCFyZXMud3JpdGFibGVFbmRlZCkgd3JpdGUoQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKCd1dGY4JyksIHJlcyk7IH0sIDE1MDApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNGMsU0FBUyxvQkFBb0I7QUFDemUsT0FBTyxXQUFXOzs7QUNHbEIsT0FBTyxRQUFR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
