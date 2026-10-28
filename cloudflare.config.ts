import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    "name": "volamidle",
    "compatibilityDate": "2026-10-19",
    "observability": {
      "enabled": true
    }
  }
});
