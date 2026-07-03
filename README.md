# Space Escape Runner 🚀🌌

Space Escape Runner is a premium, retro-futuristic arcade game built with React Native and Expo. Maneuver your spaceship, dodge falling asteroids, rack up high scores, and experience satisfying, tactile haptic feedback in this neon-lit space adventure.

---

## 🌟 Key Features

* **Premium Sci-Fi Aesthetics:** Built using rich, multi-stop cosmic gradients (`expo-linear-gradient`) and glassmorphic panels for a polished, App Store-quality interface.
* **Tactile Haptic Feedback:** Physical rumble alerts powered by `expo-haptics` that trigger on ship movements, score increments, game starts, and asteroid collisions.
* **Smooth Micro-Animations:**
  * Animated spaceship engine flame that flickers dynamically.
  * Score ticking animations that pulse visually upon dodging.
  * Spring-based modal transitions for the game-over screen.
* **Modern Iconography:** Crisp vector icons from `@expo/vector-icons` replacing default system emojis.
* **High Score Persistence:** Utilizes `@react-native-async-storage/async-storage` to save and display your personal best score across app restarts.
* **Clean & Responsive Layout:** Fully optimized for different screen sizes with robust `SafeAreaView` boundary support.

---

## 🛠️ Built With

* [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/)
* [React Native](https://reactnative.dev/)
* [React 19](https://react.dev/)
* [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)
* [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
* [Async Storage](https://react-native-async-storage.github.io/async-storage/)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js and the Expo Go app installed on your mobile device.

* **Expo Go Version Compatibility:** This project is configured to target **Expo SDK 54** to align with the Expo Go app (v54.x) running on older devices.

### Installation

1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/Sharan126/SpaceEscapeRunner-APP.git
   cd SpaceEscapeRunner-APP
   ```

2. Install the project dependencies (using `--legacy-peer-deps` to ensure smooth resolution with React 19):
   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

4. Scan the QR code displayed in the terminal with your phone:
   * **Android:** Open the Expo Go app and scan the QR code.
   * **iOS:** Open the default Camera app and scan the QR code to launch Expo Go.

---

## 📂 Project Structure

```
├── assets/                  # App icons, splash screens, and other static assets
├── App.js                   # Main application code (state machine, game loop, rendering, and styles)
├── app.json                 # Expo configuration file
├── index.js                 # Entry point registering the root App component
├── package.json             # Project dependencies and custom scripts
└── README.md                # Project documentation
```

---

## 🎮 How to Play

1. Tap **START MISSION** to launch the spacecraft.
2. Tap **LEFT** and **RIGHT** buttons to maneuver the spaceship sideways.
3. Dodge the incoming asteroids falling from the top of the screen.
4. Each successfully dodged asteroid awards you **10 points**.
5. Avoid colliding with asteroids! A crash will trigger a critical system failure (Game Over).
6. Tap **RE-LAUNCH MISSION** to reset and try to beat your High Score!
