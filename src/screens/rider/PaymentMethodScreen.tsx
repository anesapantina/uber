import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CustomAlert } from '../../components/CustomAlert';

interface PaymentMethodScreenProps {
  navigation: any;
  route: any;
}

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_50 = '#0A0A0A';
const GRAY_100 = '#1A1A1A';
const GRAY_200 = '#2A2A2A';
const GRAY_300 = '#3A3A3A';
const GRAY_700 = '#CCCCCC';
const GRAY_800 = '#E5E5E5';
const ORANGE = '#FF6B35';

export const PaymentMethodScreen: React.FC<PaymentMethodScreenProps> = ({ navigation, route }) => {
  const { isCancellation, rideId, cancellationFee } = route.params || {};
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showConfirmFeeAlert, setShowConfirmFeeAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Mock saved payment methods
  const paymentMethods = [
    { id: 'paypal', name: 'Paypal', icon: 'logo-paypal', color: '#003087' },
    { id: 'card', name: 'Credit Card', icon: 'card', color: BLACK },
    { id: 'apple', name: 'Apple pay', icon: 'logo-apple', color: BLACK },
    { id: 'google', name: 'Google pay', icon: 'logo-google', color: '#4285F4' },
  ];

  const webMoneyMethods = [
    { id: 'webmoney', name: 'WebMoney', icon: 'wallet', color: BLACK },
  ];

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleAddPayment = async () => {
    if (isCancellation) {
      // Process cancellation fee payment
      setShowConfirmFeeAlert(true);
    } else {
      Alert.alert('Success', 'Payment method added successfully!');
      navigation.goBack();
    }
  };

  const processCancellation = async () => {
    setShowConfirmFeeAlert(false);
    try {
      const { riderService } = await import('../../services/supabase');
      await riderService.cancelRide(rideId, 'Cancelled by rider after driver acceptance');

      setShowSuccessAlert(true);
    } catch (error) {
      console.error('Error cancelling ride:', error);
      Alert.alert('Error', 'Failed to cancel ride. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment method</Text>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={20} color={WHITE} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Cancellation Warning */}
          {isCancellation && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={24} color="#FF6B6B" />
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>Cancellation Fee</Text>
                <Text style={styles.warningText}>
                  You will be charged €{cancellationFee?.toFixed(2)} for cancelling this ride.
                  Please select a payment method to proceed.
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Select your payment method.</Text>

          {/* Add New Card Section */}
          {!showAddCard && (
            <TouchableOpacity
              style={styles.addCardButton}
              onPress={() => setShowAddCard(true)}
            >
              <Text style={styles.addCardText}>Add a new credit/debit card</Text>
            </TouchableOpacity>
          )}

          {/* Add Card Form */}
          {showAddCard && (
            <View style={styles.cardFormContainer}>
              <Text style={styles.cardFormTitle}>My card</Text>

              {/* Card Preview */}
              <View style={styles.cardPreview}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{cardName || 'Card Holder'}</Text>
                </View>
                <Text style={styles.cardNumberPreview}>
                  {cardNumber || '0000 0000 0000 0000'}
                </Text>
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.cardLabel}>CVV</Text>
                    <Text style={styles.cardValue}>{cvv || '***'}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardLabel}>EXPIRED DATE</Text>
                    <Text style={styles.cardValue}>{expiryDate || 'MM/YY'}</Text>
                  </View>
                </View>
                <View style={styles.cardChip}>
                  <Ionicons name="card" size={32} color={GRAY_300} />
                </View>
              </View>

              {/* Card Name */}
              <Text style={styles.inputLabel}>{cardName || 'Card Holder'}</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Card holder name"
                  placeholderTextColor={GRAY_700}
                  value={cardName}
                  onChangeText={setCardName}
                />
              </View>

              {/* Card Number */}
              <Text style={styles.inputLabel}>
                {cardNumber ? formatCardNumber(cardNumber) : '0000 0000 0000 0000'}
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Card number"
                  placeholderTextColor={GRAY_700}
                  keyboardType="number-pad"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                />
              </View>

              {/* CVV and Expiry Date */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="***"
                      placeholderTextColor={GRAY_700}
                      keyboardType="number-pad"
                      maxLength={3}
                      secureTextEntry
                      value={cvv}
                      onChangeText={setCvv}
                    />
                  </View>
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>EXPIRED DATE</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor={GRAY_700}
                      keyboardType="number-pad"
                      maxLength={5}
                      value={expiryDate}
                      onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                    />
                  </View>
                </View>
              </View>

              {/* Save Card Toggle */}
              <View style={styles.saveCardContainer}>
                <Text style={styles.saveCardText}>Save your card information</Text>
                <Switch
                  value={saveCard}
                  onValueChange={setSaveCard}
                  trackColor={{ false: GRAY_300, true: '#007AFF' }}
                  thumbColor={WHITE}
                />
              </View>
            </View>
          )}

          {/* Payment Methods */}
          <View style={styles.methodsContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodItem,
                  selectedMethod === method.id && styles.methodItemSelected,
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={styles.methodLeft}>
                  <Ionicons name={method.icon as any} size={24} color={method.color} />
                  <Text style={styles.methodName}>{method.name}</Text>
                </View>
                <View style={[styles.radio, selectedMethod === method.id && styles.radioSelected]}>
                  {selectedMethod === method.id && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>


        </ScrollView>

        {/* Add Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.addButton, !selectedMethod && !showAddCard && styles.addButtonDisabled]}
            onPress={handleAddPayment}
            disabled={!selectedMethod && !showAddCard}
          >
            <Text style={styles.addButtonText}>
              {isCancellation ? `Pay €${cancellationFee?.toFixed(2)}` : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlert
        visible={showConfirmFeeAlert}
        title="Cancellation Fee"
        message={`€${cancellationFee?.toFixed(2)} will be charged to your payment method.`}
        icon="alert-circle"
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setShowConfirmFeeAlert(false),
          },
          {
            text: 'Pay & Cancel',
            color: '#007AFF',
            onPress: processCancellation,
          },
        ]}
      />

      <CustomAlert
        visible={showSuccessAlert}
        title="Ride Cancelled"
        message="Your ride has been cancelled successfully."
        icon="checkmark-circle"
        buttons={[
          {
            text: 'OK',
            style: 'default',
            // Hard reset to ensure navigation works
            onPress: () => {
              // Reset current stack to DestinationSelect
              navigation.reset({
                index: 0,
                routes: [{
                  name: 'DestinationSelect',
                  params: { reset: true }
                }]
              });
            },
          },
        ]}
      />
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BLACK,
  },
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: WHITE,
  },
  profileButton: {
    padding: 5,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GRAY_200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#2A1A1A',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A2A2A',
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: GRAY_700,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: GRAY_700,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  addCardButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: GRAY_100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: GRAY_200,
    borderStyle: 'dashed',
  },
  addCardText: {
    fontSize: 14,
    color: GRAY_700,
    textAlign: 'center',
    fontWeight: '500',
  },
  cardFormContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  cardFormTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 15,
  },
  cardPreview: {
    backgroundColor: '#007AFF', // Blue Card
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    minHeight: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    marginBottom: 40,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE, // White text
  },
  cardNumberPreview: {
    fontSize: 20,
    fontWeight: '600',
    color: WHITE, // White text
    letterSpacing: 2,
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 10,
    color: '#EEEEEE', // Slightly lighter gray for blue bg
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE, // White text
  },
  cardChip: {
    position: 'absolute',
    right: 20,
    top: 20,
    opacity: 0.2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: GRAY_100,
    borderRadius: 10,
    marginBottom: 15,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: WHITE,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
  saveCardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  saveCardText: {
    fontSize: 14,
    color: WHITE,
  },
  methodsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  methodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: GRAY_100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GRAY_200,
    marginBottom: 10,
  },
  methodItemSelected: {
    borderColor: WHITE,
    borderWidth: 2,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodName: {
    fontSize: 15,
    color: WHITE,
    marginLeft: 12,
    fontWeight: '500',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: WHITE,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: WHITE,
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: GRAY_200,
  },
  addButton: {
    backgroundColor: WHITE,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: WHITE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  addButtonDisabled: {
    backgroundColor: GRAY_300,
    opacity: 0.6,
  },
  addButtonText: {
    color: BLACK,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PaymentMethodScreen;
