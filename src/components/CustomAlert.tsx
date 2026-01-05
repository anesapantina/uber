import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface CustomAlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
    color?: string;
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message?: string;
    icon?: string;
    buttons?: CustomAlertButton[];
    onDismiss?: () => void; // Optional fallback if no buttons provided
}

const { width } = Dimensions.get('window');

const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY_800 = '#1C1C1E';
const GRAY_600 = '#3A3A3C';
const GRAY_400 = '#8E8E93';

export const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    icon,
    buttons = [{ text: 'OK', style: 'default' }],
    onDismiss,
}) => {
    const [show, setShow] = React.useState(visible);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

    React.useEffect(() => {
        if (visible) {
            setShow(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start(() => setShow(false));
        }
    }, [visible]);

    if (!show) return null;

    return (
        <Modal
            transparent
            visible={show}
            animationType="none"
            onRequestClose={onDismiss}
        >
            <View style={styles.container}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

                <Animated.View
                    style={[
                        styles.alertContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    {icon && (
                        <View style={styles.iconContainer}>
                            <Ionicons name={icon as any} size={48} color={WHITE} />
                        </View>
                    )}

                    <Text style={styles.title}>{title}</Text>
                    {message && <Text style={styles.message}>{message}</Text>}

                    <View style={styles.buttonContainer}>
                        {buttons.map((btn, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    btn.style === 'cancel' && styles.buttonCancel,
                                    btn.style === 'destructive' && styles.buttonDestructive,
                                    btn.color ? { backgroundColor: btn.color, borderWidth: 0 } : {},
                                    // Add margin between buttons if multiple
                                    index > 0 && { marginTop: 10 }
                                ]}
                                onPress={btn.onPress || onDismiss}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        btn.style === 'cancel' && styles.buttonTextCancel,
                                        btn.style === 'destructive' && styles.buttonTextDestructive,
                                        btn.color ? { color: WHITE } : {},
                                    ]}
                                >
                                    {btn.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    alertContainer: {
        width: width * 0.85,
        maxWidth: 340,
        backgroundColor: BLACK,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    iconContainer: {
        marginBottom: 20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: WHITE,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#CCC',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        backgroundColor: WHITE,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        width: '100%',
    },
    buttonCancel: {
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#333',
    },
    buttonDestructive: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: BLACK,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextCancel: {
        color: WHITE,
    },
    buttonTextDestructive: {
        color: WHITE,
    },
});
