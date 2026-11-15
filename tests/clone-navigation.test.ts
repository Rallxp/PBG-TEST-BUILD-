import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyNavigationRequest, resolveBackAction } from "../lib/clone-navigation";

const CLONE_ORIGIN = "https://pbranke-cw8e4hd.runable.site";

test("allows about:blank and same-origin game navigation", () => {
  assert.equal(classifyNavigationRequest("about:blank", CLONE_ORIGIN), "allow");
  assert.equal(classifyNavigationRequest(CLONE_ORIGIN, CLONE_ORIGIN), "allow");
  assert.equal(classifyNavigationRequest(`${CLONE_ORIGIN}/battle?team=1`, CLONE_ORIGIN), "allow");
});

test("opens only external HTTPS pages outside the game", () => {
  assert.equal(classifyNavigationRequest("https://example.com/help", CLONE_ORIGIN), "external");
  assert.equal(classifyNavigationRequest("http://example.com/help", CLONE_ORIGIN), "block");
});

test("blocks unsafe, unsupported and malformed URLs", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,test", "mailto:test@example.com", "not a URL"]) {
    assert.equal(classifyNavigationRequest(url, CLONE_ORIGIN), "block");
  }
});

test("prefers the hosted SPA back bridge when both histories are available", () => {
  assert.equal(
    resolveBackAction({ hasError: false, hasWebView: true, webCanGoBack: true, nativeCanGoBack: true }),
    "web",
  );
});

test("uses native WebView history when the SPA has no back entry", () => {
  assert.equal(
    resolveBackAction({ hasError: false, hasWebView: true, webCanGoBack: false, nativeCanGoBack: true }),
    "native",
  );
});

test("returns control to Android when there is no available history", () => {
  assert.equal(
    resolveBackAction({ hasError: false, hasWebView: true, webCanGoBack: false, nativeCanGoBack: false }),
    "system",
  );
});

test("does not swallow Android back on an error screen", () => {
  assert.equal(
    resolveBackAction({ hasError: true, hasWebView: false, webCanGoBack: true, nativeCanGoBack: true }),
    "system",
  );
});

test("does not attempt WebView navigation without a live WebView", () => {
  assert.equal(
    resolveBackAction({ hasError: false, hasWebView: false, webCanGoBack: true, nativeCanGoBack: true }),
    "system",
  );
});
