import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedOrbProps {
    isListening?: boolean;
    isSpeaking?: boolean;
    isThinking?: boolean;
    size?: number;
    style?: ViewStyle;
}

export default function AnimatedOrb({
    isListening = false,
    isSpeaking = false,
    isThinking = false,
    size = 120,
    style,
}: AnimatedOrbProps) {
    // Animations
    const breatheAnim = useRef(new Animated.Value(1)).current;
    const speakAnimY = useRef(new Animated.Value(1)).current;
    const speakAnimX = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.5)).current;

    // Track the component's unmount status
    const isUnmounted = useRef(false);

    useEffect(() => {
        isUnmounted.current = false;
        return () => {
            isUnmounted.current = true;
        };
    }, []);

    useEffect(() => {
        // Cleanup previous animations
        breatheAnim.stopAnimation();
        speakAnimY.stopAnimation();
        speakAnimX.stopAnimation();
        glowAnim.stopAnimation();

        let loopAnim: Animated.CompositeAnimation | null = null;
        let timeout: NodeJS.Timeout | undefined;

        if (isSpeaking) {
            // Simulate mouth moving by rapidly changing scaleY and scaleX
            const createMouthMovement = () => {
                if (isUnmounted.current || !isSpeaking) return;

                const randomY = 1.05 + Math.random() * 0.25; // Scale between 1.05 and 1.3
                const randomX = 1 - (randomY - 1) * 0.4; // Squash horizontally when stretching vertically
                const duration = 120 + Math.random() * 80;

                Animated.parallel([
                    Animated.timing(speakAnimY, {
                        toValue: randomY,
                        duration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(speakAnimX, {
                        toValue: randomX,
                        duration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0.8 + Math.random() * 0.2, // Flashing glow while speaking
                        duration,
                        useNativeDriver: true,
                    }),
                ]).start(({ finished }) => {
                    if (finished && isSpeaking && !isUnmounted.current) {
                        // Rapidly return to near normal, then go again
                        Animated.parallel([
                            Animated.timing(speakAnimY, { toValue: 1, duration: 80, useNativeDriver: true }),
                            Animated.timing(speakAnimX, { toValue: 1, duration: 80, useNativeDriver: true }),
                        ]).start(({ finished: f2 }) => {
                            if (f2 && isSpeaking && !isUnmounted.current) {
                                createMouthMovement();
                            }
                        });
                    }
                });
            };

            createMouthMovement();

        } else if (isListening) {
            // Fast breathing and bright glow when listening
            loopAnim = Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(breatheAnim, {
                            toValue: 1.15,
                            duration: 800,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.ease),
                        }),
                        Animated.timing(breatheAnim, {
                            toValue: 1,
                            duration: 800,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.ease),
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(glowAnim, {
                            toValue: 1,
                            duration: 800,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.ease),
                        }),
                        Animated.timing(glowAnim, {
                            toValue: 0.7,
                            duration: 800,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.ease),
                        }),
                    ]),
                ])
            );
            loopAnim.start();

            Animated.spring(speakAnimY, { toValue: 1, useNativeDriver: true }).start();
            Animated.spring(speakAnimX, { toValue: 1, useNativeDriver: true }).start();

        } else if (isThinking) {
            // Pulsing, ponderous state
            loopAnim = Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(breatheAnim, {
                            toValue: 1.05,
                            duration: 1500,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.ease),
                        }),
                        Animated.timing(breatheAnim, {
                            toValue: 0.95,
                            duration: 1500,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.ease),
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(glowAnim, {
                            toValue: 0.9,
                            duration: 1500,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.ease),
                        }),
                        Animated.timing(glowAnim, {
                            toValue: 0.4,
                            duration: 1500,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.ease),
                        }),
                    ]),
                ])
            );
            loopAnim.start();

            Animated.spring(speakAnimY, { toValue: 1, useNativeDriver: true }).start();
            Animated.spring(speakAnimX, { toValue: 1, useNativeDriver: true }).start();

        } else {
            // Idle state: Slow, organic breathing
            loopAnim = Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(breatheAnim, {
                            toValue: 1.05,
                            duration: 3000,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.sin),
                        }),
                        Animated.timing(breatheAnim, {
                            toValue: 1,
                            duration: 3000,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.sin),
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(glowAnim, {
                            toValue: 0.7,
                            duration: 3000,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.sin),
                        }),
                        Animated.timing(glowAnim, {
                            toValue: 0.4,
                            duration: 3000,
                            useNativeDriver: true,
                            easing: Easing.inOut(Easing.sin),
                        }),
                    ]),
                ])
            );
            loopAnim.start();

            Animated.spring(speakAnimY, { toValue: 1, useNativeDriver: true }).start();
            Animated.spring(speakAnimX, { toValue: 1, useNativeDriver: true }).start();
        }

        return () => {
            if (loopAnim) {
                loopAnim.stop();
            }
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [isListening, isSpeaking, isThinking]);

    // Combine transforms
    const combinedScaleX = Animated.multiply(breatheAnim, speakAnimX);
    const combinedScaleY = Animated.multiply(breatheAnim, speakAnimY);

    // Dynamic colors based on state
    let gradientColors = ['#A7F3D0', '#34D399', '#059669']; // Default Idle (Greenish)
    if (isSpeaking) {
        gradientColors = ['#93C5FD', '#3B82F6', '#2563EB']; // Blue for speaking
    } else if (isListening) {
        gradientColors = ['#FCD34D', '#F59E0B', '#D97706']; // Orange/Yellow for listening
    } else if (isThinking) {
        gradientColors = ['#C4B5FD', '#8B5CF6', '#6D28D9']; // Purple for thinking
    }

    return (
        <View style={[styles.container, { width: size + 40, height: size + 40 }, style]}>
            {/* Outer soft glow drop-shadow layer */}
            <Animated.View
                style={[
                    styles.glowLayer,
                    {
                        width: size + 20,
                        height: size + 20,
                        borderRadius: (size + 20) / 2,
                        opacity: glowAnim,
                        transform: [
                            { scaleX: combinedScaleX },
                            { scaleY: combinedScaleY }
                        ],
                        shadowColor: gradientColors[1],
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 1,
                        shadowRadius: 15,
                        elevation: 10,
                        backgroundColor: gradientColors[2],
                    }
                ]}
            />

            {/* Main core orb */}
            <Animated.View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    overflow: 'hidden',
                    transform: [
                        { scaleX: combinedScaleX },
                        { scaleY: combinedScaleY }
                    ]
                }}
            >
                <LinearGradient
                    colors={gradientColors as [string, string, ...string[]]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowLayer: {
        position: 'absolute',
    },
});
