import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface CancellationFeeModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  cancellationFee: number;
}

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_100 = '#1A1A1A';
const GRAY_200 = '#333333';
const GRAY_700 = '#AAAAAA';

export const CancellationFeeModal: React.FC<CancellationFeeModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  cancellationFee,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="alert-circle" size={48} color="#007AFF" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Cancel Ride?</Text>

          {/* Description */}
          <Text style={styles.description}>
            Cancelling this ride will result in a cancellation fee
          </Text>

          {/* Fee Display */}
          <View style={styles.feeContainer}>
            <Text style={styles.feeLabel}>Cancellation Fee</Text>
            <Text style={styles.feeAmount}>€{cancellationFee.toFixed(2)}</Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#94A3B8" />
            <Text style={styles.infoText}>
              You'll be redirected to select a payment method to process this fee
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Keep Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.1)', // Blue Tint
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: GRAY_700,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  feeContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  feeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  feeAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: WHITE,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 10,
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF', // Blue Button
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: WHITE, // White text
  },
});

export default CancellationFeeModal;
