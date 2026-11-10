import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CloneView from "../../components/clone-view";
import { WRAPPER_BACKGROUND } from "../../constants/clone";

export default function Index() {
  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <CloneView />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WRAPPER_BACKGROUND },
});
