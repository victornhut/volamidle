import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    "name": "my-worker",
    "compatibilityDate": "2026-10-19",
    "observability": {
      "enabled": true
    }
  }
});
