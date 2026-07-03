import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// Game constants
const SHIP_WIDTH = 50;
const SHIP_HEIGHT = 50;
const SHIP_SPEED = 25;
const ASTEROID_WIDTH = 40;
const ASTEROID_HEIGHT = 40;
const ASTEROID_SPEED = 8;
const GAME_TICK_RATE = 30;

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [gameAreaWidth, setGameAreaWidth] = useState(0);
  const [gameAreaHeight, setGameAreaHeight] = useState(0);

  const [shipX, setShipX] = useState(0);
  const [asteroidX, setAsteroidX] = useState(0);
  const [asteroidY, setAsteroidY] = useState(-ASTEROID_HEIGHT);

  // --- Animation Refs ---
  const thrusterAnim = useRef(new Animated.Value(1)).current;
  const gameOverOpacity = useRef(new Animated.Value(0)).current;
  const gameOverScale = useRef(new Animated.Value(0.9)).current;
  const scoreScale = useRef(new Animated.Value(1)).current;

  // Load high score
  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const savedScore = await AsyncStorage.getItem('@high_score');
        if (savedScore !== null) {
          setHighScore(parseInt(savedScore, 10));
        }
      } catch (error) {
        console.log('Failed to load high score:', error);
      }
    };
    loadHighScore();
  }, []);

  // Save score and trigger high-score beat haptics
  useEffect(() => {
    if (isGameOver) {
      // Trigger Heavy Haptic impact on crash
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const saveHighScore = async () => {
        try {
          if (score > highScore) {
            setHighScore(score);
            await AsyncStorage.setItem('@high_score', score.toString());
          }
        } catch (error) {
          console.log('Failed to save high score:', error);
        }
      };
      saveHighScore();

      // Trigger Game Over overlay animations
      Animated.parallel([
        Animated.timing(gameOverOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(gameOverScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset GameOver overlay animations
      gameOverOpacity.setValue(0);
      gameOverScale.setValue(0.9);
    }
  }, [isGameOver]);

  // Thruster flickering loop
  useEffect(() => {
    let animation;
    if (isPlaying && !isGameOver) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(thrusterAnim, {
            toValue: 0.6,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(thrusterAnim, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      thrusterAnim.setValue(1);
    }
    return () => animation && animation.stop();
  }, [isPlaying, isGameOver]);

  // Handle game area dimensions
  const handleGameAreaLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setGameAreaWidth(width);
    setGameAreaHeight(height);

    if (gameAreaWidth === 0) {
      setShipX((width - SHIP_WIDTH) / 2);
      setAsteroidX(Math.random() * (width - ASTEROID_WIDTH));
      setAsteroidY(-ASTEROID_HEIGHT);
    }
  };

  // Game loop
  useEffect(() => {
    let loopInterval;

    if (isPlaying && !isGameOver && gameAreaHeight > 0) {
      loopInterval = setInterval(() => {
        setAsteroidY((currentY) => {
          const nextY = currentY + ASTEROID_SPEED;

          const shipLeft = shipX;
          const shipRight = shipX + SHIP_WIDTH;
          const shipTop = gameAreaHeight - 20 - SHIP_HEIGHT;
          const shipBottom = gameAreaHeight - 20;

          const asteroidLeft = asteroidX;
          const asteroidRight = asteroidX + ASTEROID_WIDTH;
          const asteroidTop = nextY;
          const asteroidBottom = nextY + ASTEROID_HEIGHT;

          const isColliding =
            asteroidRight > shipLeft &&
            asteroidLeft < shipRight &&
            asteroidBottom > shipTop &&
            asteroidTop < shipBottom;

          if (isColliding) {
            setIsGameOver(true);
            setIsPlaying(false);
            clearInterval(loopInterval);
            return currentY;
          }

          if (nextY >= gameAreaHeight) {
            // Success: Dodge and score
            setAsteroidX(Math.random() * (gameAreaWidth - ASTEROID_WIDTH));
            setScore((prevScore) => {
              const newScore = prevScore + 10;
              // Animate score ticker pulse
              Animated.sequence([
                Animated.timing(scoreScale, {
                  toValue: 1.2,
                  duration: 80,
                  useNativeDriver: true,
                }),
                Animated.timing(scoreScale, {
                  toValue: 1,
                  duration: 80,
                  useNativeDriver: true,
                }),
              ]).start();
              
              // Light haptic tick
              Haptics.selectionAsync();

              return newScore;
            });
            return -ASTEROID_HEIGHT;
          }

          return nextY;
        });
      }, GAME_TICK_RATE);
    }

    return () => clearInterval(loopInterval);
  }, [isPlaying, isGameOver, shipX, asteroidX, gameAreaHeight, gameAreaWidth]);

  const restartGame = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScore(0);
    setIsGameOver(false);
    
    if (gameAreaWidth > 0) {
      setShipX((gameAreaWidth - SHIP_WIDTH) / 2);
      setAsteroidX(Math.random() * (gameAreaWidth - ASTEROID_WIDTH));
      setAsteroidY(-ASTEROID_HEIGHT);
    }
    
    setIsPlaying(true);
  };

  const handleStartGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      setIsPlaying(false);
    } else if (isGameOver) {
      restartGame();
    } else {
      setScore(0);
      setIsGameOver(false);
      if (gameAreaWidth > 0) {
        setShipX((gameAreaWidth - SHIP_WIDTH) / 2);
        setAsteroidX(Math.random() * (gameAreaWidth - ASTEROID_WIDTH));
        setAsteroidY(-ASTEROID_HEIGHT);
      }
      setIsPlaying(true);
    }
  };

  const moveLeft = () => {
    if (!isPlaying || isGameOver) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShipX((prevX) => Math.max(0, prevX - SHIP_SPEED));
  };

  const moveRight = () => {
    if (!isPlaying || isGameOver) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShipX((prevX) => Math.min(gameAreaWidth - SHIP_WIDTH, prevX + SHIP_SPEED));
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar style="light" />
      
      {/* Premium Cosmic background gradient */}
      <LinearGradient
        colors={['#06040A', '#0D0818', '#1A0F2E', '#090510']}
        style={styles.gradientBg}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          
          {/* Subtle glowing spatial decorations */}
          <View style={styles.glowCyan} />
          <View style={styles.glowPink} />

          {/* Header Title Section */}
          <View style={styles.header}>
            <Text style={styles.titleSub}>NEON ARCADE</Text>
            <View style={styles.titleRow}>
              <Text style={styles.titleMain}>SPACE ESCAPE</Text>
              <Text style={styles.titleAccent}>RUNNER</Text>
            </View>
          </View>

          {/* Glassmorphic Scoreboard Display Card */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              {/* Left: Current Score */}
              <View style={styles.scoreColumn}>
                <Text style={styles.scoreLabel}>SCORE</Text>
                <Animated.Text style={[styles.scoreValue, { transform: [{ scale: scoreScale }] }]}>
                  {score}
                </Animated.Text>
              </View>
              
              <View style={styles.scoreDivider} />
              
              {/* Right: High Score */}
              <View style={styles.scoreColumn}>
                <View style={styles.highScoreLabelRow}>
                  <Feather name="award" size={10} color="#FFD700" style={{ marginRight: 3 }} />
                  <Text style={styles.scoreLabelHighScore}>HIGH SCORE</Text>
                </View>
                <Text style={styles.scoreValueHighScore}>{highScore}</Text>
              </View>
            </View>

            {/* Status indicators */}
            {isPlaying ? (
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: '#FFD700' }]} />
                <Text style={styles.gameStatusActive}>ESCAPING ASTEROIDS...</Text>
              </View>
            ) : isGameOver ? (
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: '#FF007F' }]} />
                <Text style={styles.gameStatusFailed}>SYSTEM FAILURE</Text>
              </View>
            ) : (
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: '#8B9BB4' }]} />
                <Text style={styles.gameStatusIdle}>READY FOR LAUNCH</Text>
              </View>
            )}
          </View>

          {/* Game Arena Board */}
          <View style={styles.gameArea} onLayout={handleGameAreaLayout}>
            
            {/* Spaceship */}
            {!isGameOver && (
              <View style={[styles.spaceship, { left: shipX }]}>
                {/* Engine Flame with Scale animation */}
                {isPlaying && (
                  <Animated.View 
                    style={[
                      styles.thrusterFlame, 
                      { transform: [{ scaleY: thrusterAnim }] }
                    ]} 
                  />
                )}
                {/* Wing Left */}
                <View style={styles.leftWing} />
                {/* Wing Right */}
                <View style={styles.rightWing} />
                {/* Hull */}
                <View style={styles.shipBody}>
                  {/* Cockpit Glass */}
                  <View style={styles.shipWindow} />
                </View>
                {/* Engine Core */}
                <View style={styles.shipNose} />
              </View>
            )}

            {/* Falling Asteroid */}
            {isPlaying && !isGameOver && (
              <View style={[styles.asteroid, { left: asteroidX, top: asteroidY }]}>
                <View style={styles.asteroidCore}>
                  <View style={[styles.crater, { top: 6, left: 6, width: 6, height: 6 }]} />
                  <View style={[styles.crater, { bottom: 8, right: 8, width: 8, height: 8 }]} />
                  <View style={[styles.crater, { top: 12, right: 6, width: 5, height: 5 }]} />
                </View>
              </View>
            )}

            {/* Game Over Screen Overlay (Animated) */}
            {isGameOver && (
              <Animated.View style={[styles.gameOverOverlay, { opacity: gameOverOpacity }]}>
                <Animated.View style={[styles.gameOverModal, { transform: [{ scale: gameOverScale }] }]}>
                  <MaterialCommunityIcons name="alert-decagram-outline" size={48} color="#FF007F" style={styles.errorIcon} />
                  
                  <Text style={styles.gameOverTitle}>MISSION FAILED</Text>
                  <Text style={styles.gameOverSubtitle}>VESSEL COLLIDED WITH AN ASTEROID</Text>
                  
                  <View style={styles.finalScoreContainer}>
                    <Text style={styles.finalScoreLabel}>FINAL SCORE</Text>
                    <Text style={styles.finalScoreValue}>{score}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.restartOverlayButtonContainer}
                    onPress={restartGame}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#FF007F', '#A30050']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.restartOverlayButton}
                    >
                      <Text style={styles.restartOverlayButtonText}>RE-LAUNCH MISSION</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            )}
          </View>

          {/* Controls Container */}
          <View style={styles.bottomControlsContainer}>
            {/* Movement Controls */}
            <View style={styles.movementRow}>
              <TouchableOpacity
                style={[styles.moveButton, (!isPlaying || isGameOver) && styles.moveButtonDisabled]}
                onPress={moveLeft}
                disabled={!isPlaying || isGameOver}
                activeOpacity={0.6}
              >
                <Feather 
                  name="arrow-left" 
                  size={16} 
                  color={(!isPlaying || isGameOver) ? 'rgba(255, 255, 255, 0.2)' : '#00F0FF'} 
                />
                <Text style={[styles.moveButtonText, (!isPlaying || isGameOver) && styles.moveButtonTextDisabled]}>
                  LEFT
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.moveButton, (!isPlaying || isGameOver) && styles.moveButtonDisabled]}
                onPress={moveRight}
                disabled={!isPlaying || isGameOver}
                activeOpacity={0.6}
              >
                <Text style={[styles.moveButtonText, (!isPlaying || isGameOver) && styles.moveButtonTextDisabled]}>
                  RIGHT
                </Text>
                <Feather 
                  name="arrow-right" 
                  size={16} 
                  color={(!isPlaying || isGameOver) ? 'rgba(255, 255, 255, 0.2)' : '#00F0FF'} 
                />
              </TouchableOpacity>
            </View>

            {/* Launch / Operations Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={handleStartGame}
                activeOpacity={0.85}
              >
                {isPlaying ? (
                  <View style={[styles.button, styles.buttonActive]}>
                    <Text style={styles.buttonText}>ABORT MISSION</Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={isGameOver ? ['#FF007F', '#A30050'] : ['#00F0FF', '#007FA3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>
                      {isGameOver ? 'RE-LAUNCH MISSION' : 'START MISSION'}
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>

              {/* Reset Score Button */}
              {!isPlaying && !isGameOver && score > 0 && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setScore(0);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resetButtonText}>RESET SCORE</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer version label */}
          <Text style={styles.footerText}>v1.4.0 • Made with Expo & React Native</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#06040A',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  glowCyan: {
    position: 'absolute',
    top: '10%',
    left: '-25%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#00F0FF',
    opacity: 0.08,
    shadowColor: '#00F0FF',
    shadowRadius: 100,
    elevation: 0,
  },
  glowPink: {
    position: 'absolute',
    bottom: '25%',
    right: '-25%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF007F',
    opacity: 0.07,
    shadowColor: '#FF007F',
    shadowRadius: 120,
    elevation: 0,
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
  },
  titleSub: {
    color: '#8B9BB4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 4,
    opacity: 0.8,
  },
  titleRow: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  titleMain: {
    color: '#00F0FF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 240, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  titleAccent: {
    color: '#FF007F',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 6,
    textShadowColor: 'rgba(255, 0, 127, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginTop: -2,
  },
  scoreCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  scoreColumn: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  scoreLabel: {
    color: '#8B9BB4',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 4,
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  highScoreLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreLabelHighScore: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  scoreValueHighScore: {
    color: '#FFD700',
    fontSize: 30,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(255, 215, 0, 0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  gameStatusIdle: {
    color: '#8B9BB4',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  gameStatusActive: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  gameStatusFailed: {
    color: '#FF007F',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  gameArea: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 24,
    marginVertical: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  spaceship: {
    position: 'absolute',
    bottom: 20,
    width: SHIP_WIDTH,
    height: SHIP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipBody: {
    position: 'absolute',
    bottom: 8,
    width: 18,
    height: 26,
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    zIndex: 2,
  },
  shipNose: {
    position: 'absolute',
    top: 6,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF007F',
    zIndex: 3,
  },
  shipWindow: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  leftWing: {
    position: 'absolute',
    bottom: 4,
    left: 6,
    width: 10,
    height: 16,
    backgroundColor: '#FF007F',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 10,
    zIndex: 1,
  },
  rightWing: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    width: 10,
    height: 16,
    backgroundColor: '#FF007F',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 10,
    zIndex: 1,
  },
  thrusterFlame: {
    position: 'absolute',
    bottom: -6,
    width: 8,
    height: 14,
    backgroundColor: '#FF8A00',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  asteroid: {
    position: 'absolute',
    width: ASTEROID_WIDTH,
    height: ASTEROID_HEIGHT,
  },
  asteroidCore: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3F3F46',
    borderWidth: 2,
    borderColor: '#52525B',
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  crater: {
    position: 'absolute',
    backgroundColor: '#27272A',
    borderRadius: 99,
  },
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 4, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  gameOverModal: {
    width: '90%',
    backgroundColor: 'rgba(20, 15, 35, 0.95)',
    borderWidth: 1.5,
    borderColor: '#FF007F',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  errorIcon: {
    marginBottom: 12,
    textShadowColor: 'rgba(255, 0, 127, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  gameOverTitle: {
    color: '#FF007F',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
    textShadowColor: 'rgba(255, 0, 127, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  gameOverSubtitle: {
    color: '#8B9BB4',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
    opacity: 0.9,
  },
  finalScoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginBottom: 20,
    width: '100%',
  },
  finalScoreLabel: {
    color: '#8B9BB4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  finalScoreValue: {
    color: '#00F0FF',
    fontSize: 36,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 240, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  restartOverlayButtonContainer: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  restartOverlayButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restartOverlayButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  bottomControlsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  movementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  moveButton: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  moveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    shadowOpacity: 0,
    elevation: 0,
  },
  moveButtonText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginHorizontal: 6,
  },
  moveButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.15)',
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },
  buttonContainer: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  button: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  resetButton: {
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  resetButtonText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 8,
  },
});
