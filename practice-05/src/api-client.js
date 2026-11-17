export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}


function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || /[?#]/.test(baseUrl)) {
    throw new TypeError("Ожидался URL без query и hash.");
  }
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new TypeError("Ожидался HTTP(S) URL.");
  }
  return url;
}

export function buildUrl(baseUrl, path, query = {}) {
  const url = normalizeBaseUrl(baseUrl);
  if (typeof path !== "string" || !path.replaceAll("/", "").trim()
      || /[:?#\\]/.test(path) || path.split("/").some((part) => /^(?:\.|%2e){1,2}$/i.test(part))) {
    throw new TypeError("Ожидался относительный путь.");
  }
  if (!query || ![Object.prototype, null].includes(Object.getPrototypeOf(query))) {
    throw new TypeError("Параметры запроса должны быть объектом.");
  }
  url.pathname = url.pathname.replace(/\/+$/, "") + "/" + path.replace(/^\/+|\/+$/g, "");
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.href;
}

function checkTimeout(value) {
  if (!Number.isInteger(value) || value < 1 || value > 2 ** 32 - 1) {
    throw new TypeError("Тайм-аут должен быть положительным целым числом миллисекунд.");
  }
}

function isJson(response) {
  return response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json";
}

export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000,
} = {}) {
  const base = normalizeBaseUrl(baseUrl).href;
  checkTimeout(timeoutMs);
  if (typeof fetchFn !== "function") throw new TypeError("Ожидалась функция fetch.");

  async function requestJson(path, { query, signal, timeoutMs: limit = timeoutMs } = {}) {
    const url = buildUrl(base, path, query);
    checkTimeout(limit);
    const deadline = AbortSignal.timeout(limit);
    const combined = signal ? AbortSignal.any([signal, deadline]) : deadline;
    const headers = { Accept: "application/json" };
    const method = "GET";
    const request = { method, headers, signal: combined };

    function requestError(cause, fallback) {
      if (combined.aborted) {
        const timedOut = deadline.aborted && combined.reason === deadline.reason;
        return new ApiError(timedOut ? "Превышено время ожидания." : "Запрос отменён.", {
          kind: timedOut ? "timeout" : "aborted", url, cause,
        });
      }
      return new ApiError(fallback === "network" ? "Нет соединения с API." : "Некорректный JSON.", {
        kind: fallback, url, cause,
      });
    }

    let response;
    try {
      combined.throwIfAborted();
      response = await fetchFn(url, request);
      combined.throwIfAborted();
    } catch (cause) {
      throw requestError(cause, "network");
    }

    if (!(response instanceof Response)) {
      throw new ApiError("Ожидался объект Response.", { kind: "invalid-response", url });
    }
    if (!response.ok) {
      let error;
      if (isJson(response)) {
        try {
          error = (await response.json())?.error;
        } catch (cause) {
          if (combined.aborted) throw requestError(cause, "invalid-response");
        }
      }
      throw new ApiError(error?.message || `HTTP ${response.status}`, {
        kind: "http", status: response.status, code: error?.code,
        details: error?.details, url,
      });
    }
    if (response.status === 204) return null;
    if (!isJson(response)) {
      throw new ApiError("Ожидался ответ application/json.", { kind: "invalid-response", url });
    }
    try {
      const payload = await response.json();
      combined.throwIfAborted();
      return payload;
    } catch (cause) {
      throw requestError(cause, "invalid-response");
    }
  }

  return { requestJson };
}
