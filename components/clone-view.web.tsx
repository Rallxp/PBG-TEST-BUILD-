import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CLONE_URL, WRAPPER_BACKGROUND } from '../constants/clone';

// Runable mobile preview is web; Android uses the native WebView implementation.
export default function CloneView() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <View style={styles.container}>
    <iframe key={attempt} src={CLONE_URL} title="PokeFightz hosted game" allow="fullscreen; autoplay" allowFullScreen
      style={{ border: 0, width: '100%', height: '100%', flex: 1, background: WRAPPER_BACKGROUND }}
      onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />
    {(loading || failed) && <View style={styles.overlay}>
      {loading ? <><ActivityIndicator color="#e3262f" size="large" /><Text style={styles.text}>Loading PokeFightz…</Text></> : <>
        <Text style={styles.text}>The hosted clone could not load.</Text>
        <Pressable accessibilityRole="button" onPress={() => { setFailed(false); setLoading(true); setAttempt(a => a + 1); }}><Text style={styles.link}>Retry</Text></Pressable>
        <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(CLONE_URL); }}><Text style={styles.link}>Open website</Text></Pressable>
      </>}
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WRAPPER_BACKGROUND },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: WRAPPER_BACKGROUND, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  text: { fontFamily: 'system-ui', fontSize: 17, color: '#f2efe8', textAlign: 'center' },
  link: { fontFamily: 'system-ui', color: '#ffd23f', fontSize: 16 },
});