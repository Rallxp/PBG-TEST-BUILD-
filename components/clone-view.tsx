import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';
import { CLONE_URL, CLONE_ORIGIN, WRAPPER_BACKGROUND } from '../constants/clone';

export default function CloneView() {
  const webview = useRef<WebView>(null);
  const canGoBack = useRef(false);
  const webCanGoBack = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if(webCanGoBack.current){webview.current?.injectJavaScript("window.dispatchEvent(new Event('pokefightz-back'));true;");return true;}
      if (!canGoBack.current) return false;
      webview.current?.goBack();
      return true;
    });
    return () => back.remove();
  }, []);

  const retry = () => { canGoBack.current=false;webCanGoBack.current=false;setError(''); setLoading(true); setAttempt(a => a + 1); };
  const openExternal = (url: string) => {
    Linking.openURL(url).catch(() => { setLoading(false);setError('No browser could open this link. Retry to return to the game.'); });
  };

  return <View style={styles.container}>
    {!error && <WebView
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
      onLoadStart={() => setLoading(true)}
      onLoadEnd={() => setLoading(false)}
      onNavigationStateChange={state => { canGoBack.current = state.canGoBack; }}
      onMessage={event=>{try{const message=JSON.parse(event.nativeEvent.data);if(message.type==='pokefightz-state'&&typeof message.canGoBack==='boolean')webCanGoBack.current=message.canGoBack;}catch{/* Ignore unrelated page messages. */}}}
      onShouldStartLoadWithRequest={request => {
        if (request.url === 'about:blank') return true;
        try {
          const url = new URL(request.url);
          if (url.origin === CLONE_ORIGIN) return true;
          if (url.protocol === 'https:') openExternal(request.url);
        } catch { /* Reject unknown URL schemes. */ }
        return false;
      }}
      onOpenWindow={event => {
        try { if (new URL(event.nativeEvent.targetUrl).protocol === 'https:') openExternal(event.nativeEvent.targetUrl); }
        catch { /* Reject malformed URLs. */ }
      }}
      onError={event => { setLoading(false); setError(event.nativeEvent.description || 'The website could not load. Check your connection.'); }}
      onHttpError={event => {
        const { statusCode, url } = event.nativeEvent;
        if (url.replace(/\/$/, '') !== CLONE_URL.replace(/\/$/, '')) return;
        setLoading(false);
        setError(statusCode === 403 ? 'The hosted site is private. Its owner must change its visibility to public in Runable.' : `The hosted website returned HTTP ${statusCode}. Try again shortly.`);
      }}
      onRenderProcessGone={() => { setLoading(false); setError('The battle renderer stopped. Reload to restart the game.'); }}
    />}
    {loading && !error && <View style={styles.overlay} accessibilityRole="progressbar" accessibilityLabel="Loading PokeFightz">
      <ActivityIndicator size="large" color="#e3262f" />
      <Text style={styles.title}>PokeFightz</Text>
      <Text style={styles.body}>Loading the hosted game…</Text>
    </View>}
    {!!error && <ScrollView style={styles.errorScroll} contentContainerStyle={styles.errorContent}>
      <Text style={styles.title}>CAN’T LOAD THE GAME</Text>
      <Text style={styles.body}>{error}</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={retry}><Text style={styles.buttonText}>Retry</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => openExternal(CLONE_URL)}><Text style={styles.link}>Open website in browser</Text></Pressable>
      <Text style={styles.note}>This Android wrapper requires internet access and the published clone. Teams are stored in this app’s WebView, separately from your browser.</Text>
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WRAPPER_BACKGROUND },
  webview: { flex: 1, backgroundColor: WRAPPER_BACKGROUND },
  errorScroll: { flex:1,backgroundColor:WRAPPER_BACKGROUND },
  errorContent: { flexGrow:1,alignItems:'center',justifyContent:'center',padding:24,gap:16 },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: WRAPPER_BACKGROUND, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 18 },
  title: { fontFamily: 'sans-serif-condensed', fontSize: 28, fontWeight: '800', fontStyle: 'italic', color: '#f2efe8', textAlign: 'center' },
  body: { fontFamily: 'sans-serif', color: '#a4a9b5', fontSize: 16, lineHeight: 24, textAlign: 'center' },
  button: { backgroundColor: '#e3262f', paddingVertical: 14, paddingHorizontal: 40 },
  buttonText: { fontFamily: 'sans-serif-condensed', color: '#fff', fontSize: 20, fontWeight: '800' },
  link: { fontFamily: 'sans-serif', color: '#ffd23f', fontSize: 15, textDecorationLine: 'underline' },
  note: { fontFamily: 'sans-serif', color: '#8f94a1', fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 340 },
});