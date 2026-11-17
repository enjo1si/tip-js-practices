import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, createApiClient } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
import { variantFilters } from "../src/variant.js";

const baseUrl = "http://example.test/api";

test("Фильтр варианта с дополнительным условием completed=false", async () => {
  const filters = { ...variantFilters, completed: false };
  const client = createApiClient({
    baseUrl,
    async fetchFn(url) {
      assert.equal(url, `${baseUrl}/tasks?categoryId=1&completed=false`);
      return Response.json({ data: [], meta: { total: 0, filters } });
    },
  });
  assert.deepEqual(await createTaskApi(client).getTasks(filters), {
    tasks: [], meta: { total: 0, filters },
  });
});

test("Повреждённое тело ответа 429 сохраняет HTTP-статус", async () => {
  const client = createApiClient({
    baseUrl,
    fetchFn: async () => new Response("{", {
      status: 429, headers: { "Content-Type": "application/json" },
    }),
  });
  await assert.rejects(client.requestJson("/tasks"),
    (error) => error instanceof ApiError && error.kind === "http" && error.status === 429 && error.code === null);
});

test("Заранее отменённый запрос не вызывает fetch", async () => {
  let calls = 0;
  const client = createApiClient({
    baseUrl,
    fetchFn: async () => { calls += 1; },
  });
  await assert.rejects(client.requestJson("/tasks", { signal: AbortSignal.abort() }),
    (error) => error instanceof ApiError && error.kind === "aborted");
  assert.equal(calls, 0);
});
