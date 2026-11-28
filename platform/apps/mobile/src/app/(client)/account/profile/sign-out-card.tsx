import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { styles } from './profile-styles';
import { dialog } from './unsaved-styles';
import { SIGN_OUT, SIGN_OUT_CANCEL, SIGN_OUT_TITLE, signOutThisDevice } from './sign-out';

/** «Вийти» окремим контролом від перемикача push (T-4723c). */
export function SignOutCard() {
  const [asking, setAsking] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const confirm = async () => {
    setLeaving(true);
    await signOutThisDevice();
    setLeaving(false);
    setAsking(false);
  };

  return (
    <View style={styles.section} testID="profile-sign-out">
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={SIGN_OUT}
          testID="profile-sign-out-trigger"
          onPress={() => setAsking(true)}
        >
          <Text style={styles.dangerButton}>{SIGN_OUT}</Text>
        </Pressable>
      </View>
      <Modal
        visible={asking}
        transparent
        animationType="fade"
        onRequestClose={() => setAsking(false)}
      >
        <View style={dialog.backdrop} testID="profile-sign-out-confirm">
          <View style={dialog.dialog}>
            <Text style={dialog.title}>{SIGN_OUT_TITLE}</Text>
            <View style={dialog.actions}>
              <Pressable
                testID="profile-sign-out-confirm-yes"
                accessibilityRole="button"
                accessibilityLabel={SIGN_OUT}
                style={[dialog.primary, leaving && dialog.disabled]}
                onPress={() => void confirm()}
                disabled={leaving}
              >
                <Text style={dialog.primaryText}>{SIGN_OUT}</Text>
              </Pressable>
              <Pressable
                testID="profile-sign-out-cancel"
                accessibilityRole="button"
                accessibilityLabel={SIGN_OUT_CANCEL}
                style={dialog.secondary}
                onPress={() => setAsking(false)}
                disabled={leaving}
              >
                <Text style={dialog.secondaryText}>{SIGN_OUT_CANCEL}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
