# Satellite Cyberattack Simulation & Orbital Defense System

> **Aero-Cyber Command Center // College Project Demonstration**
> A modern, interactive web application simulating space-segment cyber threats, orbital perturbations, telemetry anomalies, and autonomous defensive countermeasures on Low Earth Orbit (LEO) satellites.

---

## 🌟 Key Features

### 1. Main Orbital Mechanics & Telemetry Simulation
- **Central 2.5D Orbital Canvas**: Real-time simulation of Earth with rotating continents, atmospheric haze, day-night terminator, and a satellite traveling along a clear Keplerian elliptical orbit ($e = 0.16$, inclination $i = 51.6^\circ$, altitude $550\text{ km}$).
- **Procedural Satellite Bus**: Animated solar arrays, high-gain parabolic antenna dish, thruster nozzles, and status LED.
- **Ground Station Link**: Madrid Deep Space Network (DSN 34m) tracking line with animated RF packet transmissions.
- **Live Ephemeris & Avionics Telemetry**:
  - ECI Coordinates: $X, Y, Z$ (km)
  - Geodetic Positioning: Latitude, Longitude, Altitude, Velocity
  - Subsystems: Li-Ion Battery State (%), Solar Array Output (W), OBC CPU Temperature (°C), Gyro Spin Rates (°/s), RF SNR (dB), Packet Loss (%)
- **Real-Time Rolling Charts**: Dynamic Canvas waveform rendering for Altitude, Velocity, and Communication SNR.
- **Interactive Transport Controls**: Play/Pause, Reset Simulation, 1x/2x/5x speed selectors, and Orbital/Earth/Satellite camera modes.

---

### 2. Five Interactive Cyberattack Simulations
1. **Trajectory Manipulation Attack (Thruster Hijack)**:
   - *Simulation*: Rogue telecommand fires thrusters, altering the nominal green orbit into a crimson red decay trajectory ($e = 0.42$, perigee descending to $310\text{ km}$).
   - *Visuals*: Continuous fiery thruster plume, decaying periapsis warning, and critical Delta-V burn notifications.
2. **GPS / GNSS Spoofing Attack (Navigation Falsehood)**:
   - *Simulation*: Forged GNSS signals overpower authentic constellations. Actual satellite remains on physical course, while reported coordinates drift $+428\text{ km}$ into false airspace.
   - *Visuals*: Translucent magenta "Ghost Satellite" marker separates with a real-time delta distance vector line.
3. **Telemetry Data Manipulation (False Data Injection)**:
   - *Simulation*: Man-in-the-Middle bit-flipping alters downlink packets. Battery falsely reads $4.2\%$, CPU temperature spikes to $118^\circ\text{C}$, and altitude oscillates erratically with parity failure.
   - *Visuals*: Pulsating red alert cells, corrupted CRC checksum flags, and side-by-side discrepancy highlights.
4. **Communication Jamming Attack (RF Flooding DoS)**:
   - *Simulation*: Electronic warfare transmitters saturate uplink frequencies. Signal SNR plunges to $-4.2\text{ dB}$, packet loss spikes to $98.4\%$, and ground link drops to `OFFLINE / JAMMED`.
   - *Visuals*: RF beam transforms into jagged flickering red electromagnetic static lightning.
5. **Command Injection Attack (Buffer Overflow)**:
   - *Simulation*: Malicious telecommand frames exploit flight software parser vulnerability, issuing `CMD_SLEW_SOLAR_OFFLINE` and disabling reaction wheel saturation control.
   - *Visuals*: Satellite visibly enters uncontrolled $14.8^\circ/\text{s}$ tumble, solar array generation drops to $42\text{W}$, and unverified command alert triggers.

---

### 3. Autonomous Cyber Defense & Recovery System
- **Intrusion Detection System (IDS)**: Continuous monitoring of Kalman filter innovation residuals, RF spectrum noise, and telemetry checksums.
- **Automated Mitigation Protocols**:
  - *Trajectory*: Autonomous ion station-keeping retro-burn restores original green orbit.
  - *GPS*: RAIM and Star Tracker optical cross-validation discard spoofed GNSS signals.
  - *Telemetry*: End-to-end cryptographic handshake (CCSDS SDLS AES-256-GCM) restores authentic data streams.
  - *Jamming*: Frequency Hopping Spread Spectrum (FHSS at 50 hops/s) restores clean link.
  - *Command Injection*: Watchdog fail-safe firmware rollback to golden read-only ROM, automated reaction wheel despin, and solar array sun-lock recovery.
- **Defense Event Log**: Military-style UTC timestamped event feed with filter tabs (`ALL`, `THREATS`, `DEFENSE`, `SYSTEM`).
- **Pulsing Cyber Shield Dome**: Energetic hexagonal force field envelopes the satellite during defensive engagement.
- **Audio Synthesizer**: Procedural Web Audio API sound effects (telemetry pings, red alert klaxon, thruster roar, defense chimes) requiring zero external media files.

---

### 4. Before-and-After Comparison Panel (5-Factor Matrix)
Dedicated side-by-side analysis comparing:
1. **Orbital Trajectory**: Nominal Keplerian Ellipse vs Altered Decay Trajectory.
2. **Coordinates**: Actual Physical Coordinates vs Spoofed Reported Position.
3. **Telemetry Integrity**: Genuine Sensor Bus vs Manipulated Downlink Readings.
4. **Communication Link**: Clean S-Band Carrier vs Jammed Gaussian Noise.
5. **Security Posture**: Attack Detected vs Defense Countermeasure Prevented.

---

### 5. Presentation & 5-Mark College Viva Guide
- **Live Demo Flow Controller**: An on-screen guided presentation prompter walking the student through:
  - Step 1: Nominal Baseline (1 Mark)
  - Step 2: Trigger Attack (1 Mark)
  - Step 3: Anomaly Detection (1 Mark)
  - Step 4: Deploy Cyber Defense (1 Mark)
  - Step 5: Before & After Analysis (1 Mark)
- **Model Viva Q&A**: Ready-to-answer explanations on CCSDS standards, jamming vs. spoofing, and Kalman filter anomaly detection.

---

## 🚀 How to Run

### Method 1: Direct Browser Launch
Simply double-click `index.html` in your file explorer to open it directly in Chrome, Edge, Firefox, or Safari.

### Method 2: Local Web Server
You can also launch a lightweight local server:
```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve .
```
Then navigate to `http://localhost:8080/` in your browser.
