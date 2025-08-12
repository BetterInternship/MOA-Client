import { defineConfig } from "orval";

export default defineConfig({
  myApi: {
    input: { target: "./app/api/spec.json" },
    output: {
      mode: "tags-split",
      target: "./app/api/endpoints",
      schemas: "./app/api/models",
      workspace: "./app/api/",
      client: "react-query",
      prettier: true,
      allParamsOptional: true,
      override: {
        query: {
          useQuery: true,
          signal: true,
          useSuspenseQuery: true,
        },
      },
    },
  },
});
