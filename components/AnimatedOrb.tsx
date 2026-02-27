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

// State-aware color palettes
const THEMES = {
    idle: {
        core: ['#4ADE80', '#16A34A', '#14532D'] as [string, string, string],
        glow: '#22C55E',
        ring: 'rgba(74,222,128,0.25)',
        halo: 'rgba(34,197,94,0.10)',
    },
    listening: {
        core: ['#FDE68A', '#F59E0B', '#B45309'] as [string, string, string],
        glow: '#F59E0B',
        ring: 'rgba(245,158,11,0.30)',
        halo: 'rgba(245,158,11,0.10)',
    },
    speaking: {
        core: ['#93C5FD', '#3B82F6', '#1E40AF'] as [string, string, string],
        glow: '#3B82F6',
        ring: 'rgba(59,130,246,0.30)',
        halo: 'rgba(59,130,246,0.10)',
    },
    thinking: {
        core: ['#DDD6FE', '#8B5CF6', '#5B21B6'] as [string, string, string],
        glow: '#8B5CF6',
        ring: 'rgba(139,92,246,0.30)',
        halo: 'rgba(139,92,246,0.10)',
    },
};

export default function AnimatedOrb({
    isListening = false,
    isSpeaking = false,
    isThinking = false,
    size = 120,
    style,
}: AnimatedOrbProps) {
    // Core animations
    const breatheAnim = useRef(new Animated.Value(1)).current;
    const speakAnimY = useRef(new Animated.Value(1)).current;
    const speakAnimX = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.4)).current;

    // Premium additions
    const pulseRingAnim = useRef(new Animated.Value(0.7)).current; // outer pulsing ring scale
    const pulseRingOpacity = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;     // shimmer position
    const rotateAnim = useRef(new Animated.Value(0)).current;      // slow gradient rotation feel

    const isUnmounted = useRef(false);

    useEffect(() => {
        isUnmounted.current = false;
        return () => { isUnmounted.current = true; };
    }, []);

    // Shimmer loop — always runs
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 2600,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 2600,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        breatheAnim.stopAnimation();
        speakAnimY.stopAnimation();
        speakAnimX.stopAnimation();
        glowAnim.stopAnimation();
        pulseRingAnim.stopAnimation();
        pulseRingOpacity.stopAnimation();
        rotateAnim.stopAnimation();

        let loopAnim: Animated.CompositeAnimation | null = null;

        if (isSpeaking) {
            // Mouth-like organic Y/X distortion — fast and alive
            const createMouthMovement = () => {
                if (isUnmounted.current || !isSpeaking) return;
                const randomY = 1.06 + Math.random() * 0.22;
                const randomX = 1 - (randomY - 1) * 0.5;
                const dur = 100 + Math.random() * 80;

                Animated.parallel([
                    Animated.timing(speakAnimY, { toValue: randomY, duration: dur, useNativeDriver: true }),
                    Animated.timing(speakAnimX, { toValue: randomX, duration: dur, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 0.7 + Math.random() * 0.3, duration: dur, useNativeDriver: true }),
                ]).start(({ finished }) => {
                    if (finished && isSpeaking && !isUnmounted.current) {
                        Animated.parallel([
                            Animated.timing(speakAnimY, { toValue: 1, duration: 70, useNativeDriver: true }),
                            Animated.timing(speakAnimX, { toValue: 1, duration: 70, useNativeDriver: true }),
                        ]).start(({ finished: f2 }) => {
                            if (f2 && isSpeaking && !isUnmounted.current) createMouthMovement();
                        });
                    }
                });
            };
            createMouthMovement();

            // Pulsing halo ring while speaking
            loopAnim = Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(pulseRingAnim, { toValue: 1.5, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
                        Animated.timing(pulseRingOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                    ]),
                    Animated.parallel([
                        Animated.timing(pulseRingAnim, { toValue: 1.9, duration: 400, useNativeDriver: true }),
                        Animated.timing(pulseRingOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
                    ]),
                ])
            );
            loopAnim.start();

        } else if (isListening) {
            loopAnim = Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(breatheAnim, { toValue: 1.13, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                        Animated.timing(breatheAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                    ]),
                    Animated.sequence([
                        Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                        Animated.timing(glowAnim, { toValue: 0.55, duration: 600, useNativeDriver: true }),
                    ]),
                    // Expanding pulse ring
                    Animated.sequence([
                        Animated.parallel([
                            Animated.timing(pulseRingAnim, { toValue: 1.6, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
                            Animated.timing(pulseRingOpacity, { toValue: 0.8, duration: 400, useNativeDriver: true }),
                        ]),
                        Animated.parallel([
                            Animated.timing(pulseRingAnim, { toValue: 2.0, duration: 400, useNativeDriver: true }),
                            Animated.timing(pulseRingOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
                        ]),
                    ]),
                ])
            );
            loopAnim.start();
            Animated.spring(speakAnimY, { toValue: 1, useNativeDriver: true }).start();
            Animated.spring(speakAnimX, { toValue: 1, useNativeDriver: true }).start();

        } else if (isThinking) {
            // Slow, ponderous, mysterious
            loopAnim = Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(breatheAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
                        Animated.timing(breatheAnim, { toValue: 0.96, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
                    ]),
                    Animated.sequence([
                        Animated.timing(glowAnim, { toValue: 0.9, duration: 1800, useNativeDriver: true }),
                        Animated.timing(glowAnim, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
                    ]),
                    Animated.sequence([
                        Animated.parallel([
                            Animated.timing(pulseRingAnim, { toValue: 1.4, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                            Animated.timing(pulseRingOpacity, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
                        ]),
                        Animated.parallel([
                            Animated.timing(pulseRingAnim, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
                            Animated.timing(pulseRingOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
                        ]),
                    ]),
                ])
            );
            loopAnim.start();
            Animated.spring(speakAnimY, { toValue: 1, useNativeDriver: true }).start();
            Animated.spring(speakAnimX, { toValue: 1, useNativeDriver: true }).start();

        } else {
            // Idle — slow organic breathing + faint ring
            loopAnim = Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(breatheAnim, { toValue: 1.06, duration: 3200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
                        Animated.timing(breatheAnim, { toValue: 1, duration: 3200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
                    ]),
                    Animated.sequence([
                        Animated.timing(glowAnim, { toValue: 0.65, duration: 3200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
                        Animated.timing(glowAnim, { toValue: 0.3, duration: 3200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
                    ]),
                    // Very gentle idle ring pulse
                    Animated.sequence([
                        Animated.parallel([
                            Animated.timing(pulseRingAnim, { toValue: 1.3, duration: 3800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                            Animated.timing(pulseRingOpacity, { toValue: 0.35, duration: 1900, useNativeDriver: true }),
                        ]),
                        Animated.parallel([
                            Animated.timing(pulseRingAnim, { toValue: 1.6, duration: 2400, useNativeDriver: true }),
                            Animated.timing(pulseRingOpacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
                        ]),
                    ]),
                ])
            );
            loopAnim.start();
            Animated.spring(speakAnimY, { toValue: 1, useNativeDriver: true }).start();
            Animated.spring(speakAnimX, { toValue: 1, useNativeDriver: true }).start();
        }

        return () => { if (loopAnim) loopAnim.stop(); };
    }, [isListening, isSpeaking, isThinking]);

    const theme = isSpeaking ? THEMES.speaking
        : isListening ? THEMES.listening
            : isThinking ? THEMES.thinking
                : THEMES.idle;

    const combinedScaleX = Animated.multiply(breatheAnim, speakAnimX);
    const combinedScaleY = Animated.multiply(breatheAnim, speakAnimY);

    // Shimmer translateX inside the orb (moves highlight across)
    const shimmerTranslateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-size * 0.6, size * 0.6],
    });

    return (
        <View style={[styles.container, { width: size + 60, height: size + 60 }, style]}>

            {/* Layer 1: Outermost diffuse halo — very soft, very large */}
            <Animated.View
                style={{
                    position: 'absolute',
                    width: size + 50,
                    height: size + 50,
                    borderRadius: (size + 50) / 2,
                    backgroundColor: theme.glow,
                    opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }),
                    transform: [{ scale: breatheAnim }],
                }}
            />

            {/* Layer 2: Expanding pulse ring — ripple outward on active states */}
            <Animated.View
                style={{
                    position: 'absolute',
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 2,
                    borderColor: theme.glow,
                    opacity: pulseRingOpacity,
                    transform: [{ scale: pulseRingAnim }],
                }}
            />

            {/* Layer 3: Inner glow ring — solid color halo close to the orb surface */}
            <Animated.View
                style={{
                    position: 'absolute',
                    width: size + 14,
                    height: size + 14,
                    borderRadius: (size + 14) / 2,
                    backgroundColor: theme.glow,
                    opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.35] }),
                    transform: [
                        { scaleX: combinedScaleX },
                        { scaleY: combinedScaleY },
                    ],
                }}
            />

            {/* Layer 4: Main orb sphere with gradient */}
            <Animated.View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    overflow: 'hidden',
                    transform: [
                        { scaleX: combinedScaleX },
                        { scaleY: combinedScaleY },
                    ],
                    shadowColor: theme.glow,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 20,
                    elevation: 14,
                }}
            >
                {/* Core gradient */}
                <LinearGradient
                    colors={theme.core}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.15, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
                />

                {/* Layer 5: Inner white shine — top-left highlight sphere */}
                <View
                    style={{
                        position: 'absolute',
                        top: size * 0.08,
                        left: size * 0.12,
                        width: size * 0.38,
                        height: size * 0.28,
                        borderRadius: size * 0.2,
                        backgroundColor: 'rgba(255,255,255,0.28)',
                        transform: [{ rotate: '-20deg' }],
                    }}
                />

                {/* Layer 6: Animated shimmer highlight — slides across */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: -size * 0.25,
                        width: size * 0.22,
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        transform: [{ translateX: shimmerTranslateX }, { rotate: '15deg' }],
                    }}
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
});
