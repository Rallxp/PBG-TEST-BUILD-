import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { CLONE_URL, CLONE_ORIGIN, WRAPPER_BACKGROUND } from "../constants/clone";
import { classifyNavigationRequest, resolveBackAction } from "../lib/clone-navigation";

const LOAD_TIMEOUT_MS = 25_000;
const WEB_BACK_SCRIPT = "window.dispatchEvent(new Event('pokefightz-back'));true;";

export default function CloneView() {
  const webview = useRef<WebView>(null);
  const canGoBack = useRef(false);
  const webCanGoBack = useRef(false);
  const loadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeout.current) clearTimeout(loadTimeout.current);
    loadTimeout.current = null;
  }, []);

  const showError = useCallback((message: string) => {
    clearLoadTimeout();
    canGoBack.current = false;
    webCanGoBack.current = false;
    setLoading(false);
    setError(message);
  }, [clearLoadTimeout]);

  const beginLoading = useCallback(() => {
    clearLoadTimeout();
    webCanGoBack.current = false;
    setLoading(true);
    loadTimeout.current = setTimeout(() => {
      showError("The hosted game took too long to respond. Check your connection and try again.");
    }, LOAD_TIMEOUT_MS);
  }, [clearLoadTimeout, showError]);

  const finishLoading = useCallback(() => {
    clearLoadTimeout();
    setLoading(false);
  }, [clearLoadTimeout]);

  useEffect(() => {
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      const view = webview.current;
      const action = resolveBackAction({
        hasError: Boolean(error),
        hasWebView: view !== null,
        webCanGoBack: webCanGoBack.current,
        nativeCanGoBack: canGoBack.current,
      });

      if (action === "web" && view) {
        view.injectJavaScript(WEB_BACK_SCRIPT);
        return true;
      }
      if (action === "native" && view) {
        view.goBack();
        return true;
      }
      return false;
    });

    return () => back.remove();
  }, [error]);

  useEffect(() => clearLoadTimeout, [clearLoadTimeout]);

  const retry = () => {
    clearLoadTimeout();
    canGoBack.current = false;
    webCanGoBack.current = false;
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  };

  const openExternal = useCallback((url: string) => {
    clearLoadTimeout();
    setLoading(false);
    Linking.openURL(url).catch(() => {
      showError("No browser could open this link. Retry to return to the game.");
    });
  }, [clearLoadTimeout, showError]);

  return (
    <View style={styles.container}>
      {!error && (
        <WebView
          key={attempt}
          ref={webview}
          source={{ uri: CLONE_URL }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          incognito={false}
          cacheEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled={false}
          mixedContentMode="never"
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          setSupportMultipleWindows
          onLoadStart={beginLoading}
          onLoadEnd={finishLoading}
          onNavigationStateChange={(state) => {
            canGoBack.current = state.canGoBack;
          }}
          onMessage={(event) => {
            try {
              const message = JSON.parse(event.nativeEvent.data);
              if (message.type === "pokefightz-state" && typeof message.canGoBack === "boolean") {
                webCanGoBack.current = message.canGoBack;
              }
            } catch {
              // Ignore unrelated page messages.
            }
          }}
          onShouldStartLoadWithRequest={(request) => {
            const action = classifyNavigationRequest(request.url, CLONE_ORIGIN);
            if (action === "external") openExternal(request.url);
            return action === "allow";
          }}
          onOpenWindow={(event) => {
            try {
              if (new URL(event.nativeEvent.targetUrl).protocol === "https:") {
                openExternal(event.nativeEvent.targetUrl);
              }
            } catch {
              // Reject malformed URLs.
            }
          }}
          onError={(event) => {
            showError(event.nativeEvent.description || "The website could not load. Check your connection.");
          }}
          onHttpError={(event) => {
            const { statusCode, url } = event.nativeEvent;
            if (url.replace(/\/$/, "") !== CLONE_URL.replace(/\/$/, "")) return;
            showError(
              statusCode === 403
                ? "The hosted site is private. Its owner must change its visibility to public in Runable."
                : `The hosted website returned HTTP ${statusCode}. Try again shortly.`,
            );
          }}
          onRenderProcessGone={() => {
            showError("The battle renderer stopped. Reload to restart the game.");
          }}
        />
      )}

      {loading && !error && (
        <View style={styles.overlay} accessibilityRole="progressbar" accessibilityLabel="Loading PokeFightz">
          <ActivityIndicator size="large" color="#e3262f" />
          <Text style={styles.title}>PokeFightz</Text>
          <Text style={styles.body}>Loading the hosted game…</Text>
        </View>
      )}

      {!!error && (
        <ScrollView style={styles.errorScroll} contentContainerStyle={styles.errorContent}>
          <Text style={styles.title}>CAN’T LOAD THE GAME</Text>
          <Text style={styles.body}>{error}</Text>
          <Pressable accessibilityRole="button" style={styles.button} onPress={retry}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
          <Pressable accessibilityRole="link" onPress={() => openExternal(CLONE_URL)}>
            <Text style={styles.link}>Open website in browser</Text>
          </Pressable>
          <Text style={styles.note}>
            This Android wrapper requires internet access and the published clone. Teams are stored in this app’s
            WebView, separately from your browser.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WRAPPER_BACKGROUND },
  webview: { flex: 1, backgroundColor: WRAPPER_BACKGROUND },
  errorScroll: { flex: 1, backgroundColor: WRAPPER_BACKGROUND },
  errorContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WRAPPER_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 18,
  },
  title: {
    fontFamily: "sans-serif-condensed",
    fontSize: 28,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#f2efe8",
    textAlign: "center",
  },
  body: {
    fontFamily: "sans-serif",
    color: "#a4a9b5",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  button: { backgroundColor: "#e3262f", paddingVertical: 14, paddingHorizontal: 40 },
  buttonText: { fontFamily: "sans-serif-condensed", color: "#fff", fontSize: 20, fontWeight: "800" },
  link: {
    fontFamily: "sans-serif",
    color: "#ffd23f",
    fontSize: 15,
    textDecorationLine: "underline",
  },
  note: {
    fontFamily: "sans-serif",
    color: "#8f94a1",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 340,
  },
});
