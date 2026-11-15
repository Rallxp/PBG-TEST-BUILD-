export type BackAction = "web" | "native" | "system";

export interface BackNavigationState {
  hasError: boolean;
  hasWebView: boolean;
  webCanGoBack: boolean;
  nativeCanGoBack: boolean;
}

export function resolveBackAction({
  hasError,
  hasWebView,
  webCanGoBack,
  nativeCanGoBack,
}: BackNavigationState): BackAction {
  if (hasError || !hasWebView) return "system";
  if (webCanGoBack) return "web";
  if (nativeCanGoBack) return "native";
  return "system";
}

export type NavigationAction = "allow" | "external" | "block";

export function classifyNavigationRequest(rawUrl: string, cloneOrigin: string): NavigationAction {
  if (rawUrl === "about:blank") return "allow";

  try {
    const url = new URL(rawUrl);
    if (url.origin === cloneOrigin) return "allow";
    if (url.protocol === "https:") return "external";
  } catch {
    // Malformed and unknown URLs stay blocked.
  }

  return "block";
}
