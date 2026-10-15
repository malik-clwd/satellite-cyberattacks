/**
 * SAT-DEFENSE // Orbital Physics & Canvas Simulation Engine
 * Renders Earth, Keplerian elliptical orbits, procedural satellite, thruster physics,
 * RF ground links, spoofed ghost tracks, and defensive cyber-shields.
 */

class OrbitalSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Simulation State
    this.isRunning = true;
    this.simSpeed = 1.0;
    this.cameraMode = 'orbital'; // 'orbital', 'earth', 'satellite'
    this.showBeam = true;
    this.showStars = true;

    // Simulation Time & Orbital True Anomaly (radians)
    this.theta = 0.0; // Current orbital angle
    this.earthRotation = 0.0;
    this.elapsedSeconds = 0;
    this.lastFrameTime = performance.now();

    // Orbital Parameters (Keplerian Ellipse)
    this.semiMajorAxis = 220; // Nominal semi-major axis (pixels)
    this.eccentricity = 0.16;  // Nominal visible ellipse
    this.orbitInclinationAngle = -0.38; // Tilt angle of orbit on 2D plane (radians)
    this.orbitalPeriodSec = 45; // Real seconds for 1 complete revolution at 1x

    // Active Attack State (Managed by AttackDefenseEngine)
    this.currentAttack = null; // null or 1, 2, 3, 4, 5
    this.isDefenseActive = false;
    this.defensePhase = 0;

    // Trajectory Deviation Variables (Attack 1)
    this.trajectoryPerturbation = 0.0; // 0.0 = nominal, 1.0 = fully altered
    this.alteredSemiMajorAxis = 250;
    this.alteredEccentricity = 0.42;
    this.alteredTilt = -0.15;

    // GPS Spoofing Variables (Attack 2)
    this.ghostOffsetTheta = 0.0; // Angle lead/lag for spoofed phantom satellite
    this.ghostDistanceKm = 0.0;

    // Satellite Attitude & Thruster State (Attack 5 / Attack 1)
    this.satelliteAttitudeAngle = 0;
    this.isTumbling = false;
    this.tumbleVelocity = 0;
    this.thrusterActive = false;
    this.thrusterType = 'chemical'; // 'chemical' (red rogue) or 'ion' (blue defense)
    this.thrusterParticles = [];

    // Shield effect particles
    this.shieldRadius = 28;
    this.shieldAlpha = 0;

    // Starfield & Particle Dust
    this.stars = [];
    this.initStars(160);

    // Setup Canvas & Event Listeners
    this.setupCanvas();
    window.addEventListener('resize', () => this.setupCanvas());

    // Start Rendering Loop
    requestAnimationFrame((t) => this.renderLoop(t));
  }

  setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    // Dynamic orbital radius based on canvas size
    const minDim = Math.min(this.width, this.height);
    this.baseOrbitA = Math.max(160, minDim * 0.38);
    this.semiMajorAxis = this.baseOrbitA;
    this.alteredSemiMajorAxis = this.baseOrbitA * 1.25;
    this.earthRadius = Math.max(50, minDim * 0.16);
  }

  initStars(count) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.8 + 0.4,
        brightness: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // Set Attack Mode (Invoked by AttackDefenseEngine)
  setAttack(attackId) {
    this.currentAttack = attackId;
    this.isDefenseActive = false;

    if (attackId === 1) {
      // Trajectory manipulation: start rogue thruster burn and deviate orbit
      this.thrusterActive = true;
      this.thrusterType = 'chemical';
      if (window.soundFX) window.soundFX.playThrusterBurn(2.0);
    } else if (attackId === 2) {
      // GPS Spoofing: trigger ghost deviation
      this.ghostOffsetTheta = 0.05;
    } else if (attackId === 4) {
      // Communication Jamming
      if (window.soundFX) window.soundFX.playJammingStatic(1.2);
    } else if (attackId === 5) {
      // Command injection: trigger violent tumble
      this.isTumbling = true;
      this.tumbleVelocity = 0.08;
    }
  }

  // Activate Cyber Defense (Invoked by AttackDefenseEngine)
  setDefenseActive(active = true) {
    this.isDefenseActive = active;
    if (active) {
      this.shieldAlpha = 0.9;
      // Ion thruster pulse to correct trajectory
      if (this.currentAttack === 1) {
        this.thrusterActive = true;
        this.thrusterType = 'ion';
      }
    }
  }

  // Reset Everything to Normal Baseline
  resetToNormal() {
    this.currentAttack = null;
    this.isDefenseActive = false;
    this.trajectoryPerturbation = 0.0;
    this.ghostOffsetTheta = 0.0;
    this.ghostDistanceKm = 0.0;
    this.isTumbling = false;
    this.tumbleVelocity = 0;
    this.thrusterActive = false;
    this.shieldAlpha = 0;
  }

  // Reset Orbit Position
  resetSimulation() {
    this.theta = 0;
    this.elapsedSeconds = 0;
    this.thrusterParticles = [];
  }

  setSpeed(speed) {
    this.simSpeed = speed;
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
  }

  togglePlayPause() {
    this.isRunning = !this.isRunning;
    return this.isRunning;
  }

  // Calculate Keplerian Ellipse Radius at angle theta: r = a(1 - e^2) / (1 + e*cos(theta))
  getOrbitRadius(a, e, theta) {
    return (a * (1 - e * e)) / (1 + e * Math.cos(theta));
  }

  // Main Render & Physics Loop
  renderLoop(timestamp) {
    const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = timestamp;

    if (this.isRunning) {
      this.updatePhysics(dt);
    }

    this.draw();

    requestAnimationFrame((t) => this.renderLoop(t));
  }

  updatePhysics(dt) {
    const effectiveDt = dt * this.simSpeed;
    this.elapsedSeconds += effectiveDt;

    // Orbital Motion: Mean angular velocity = 2*PI / period
    const baseAngularVel = (Math.PI * 2) / this.orbitalPeriodSec;
    // Kepler's 2nd law approximation (sweeps equal areas: faster at periapsis)
    const nominalR = this.getOrbitRadius(this.semiMajorAxis, this.eccentricity, this.theta);
    const speedFactor = Math.pow(this.semiMajorAxis / nominalR, 1.8);

    this.theta = (this.theta + baseAngularVel * speedFactor * effectiveDt) % (Math.PI * 2);
    this.earthRotation = (this.earthRotation + 0.05 * effectiveDt) % (Math.PI * 2);

    // Update Trajectory Deviation (Attack 1)
    if (this.currentAttack === 1) {
      if (this.isDefenseActive) {
        // Recovery smoothly restores original orbit
        this.trajectoryPerturbation = Math.max(0, this.trajectoryPerturbation - 0.35 * effectiveDt);
        if (this.trajectoryPerturbation === 0) {
          this.thrusterActive = false;
        }
      } else {
        // Trajectory deviates outward
        this.trajectoryPerturbation = Math.min(1.0, this.trajectoryPerturbation + 0.25 * effectiveDt);
      }
    } else {
      if (this.trajectoryPerturbation > 0) {
        this.trajectoryPerturbation = Math.max(0, this.trajectoryPerturbation - 0.5 * effectiveDt);
      }
    }

    // Update GPS Spoofing Offset (Attack 2)
    if (this.currentAttack === 2) {
      if (this.isDefenseActive) {
        this.ghostOffsetTheta = Math.max(0, this.ghostOffsetTheta - 0.3 * effectiveDt);
      } else {
        this.ghostOffsetTheta = Math.min(0.35, this.ghostOffsetTheta + 0.08 * effectiveDt);
      }
      this.ghostDistanceKm = this.ghostOffsetTheta * 3500; // Scaled physical delta km
    } else {
      this.ghostOffsetTheta = 0;
      this.ghostDistanceKm = 0;
    }

    // Update Command Injection Tumble (Attack 5)
    if (this.currentAttack === 5) {
      if (this.isDefenseActive) {
        // Reaction wheels despin satellite
        this.tumbleVelocity = Math.max(0, this.tumbleVelocity - 0.05 * effectiveDt);
        if (this.tumbleVelocity === 0) this.isTumbling = false;
      } else {
        this.isTumbling = true;
        this.tumbleVelocity = Math.min(0.12, this.tumbleVelocity + 0.02 * effectiveDt);
      }
      this.satelliteAttitudeAngle += this.tumbleVelocity * 60 * effectiveDt;
    } else {
      this.isTumbling = false;
      this.satelliteAttitudeAngle = 0;
    }

    // Update Shield Glow (Cyber Defense)
    if (this.isDefenseActive) {
      this.shieldAlpha = Math.min(1.0, this.shieldAlpha + 1.2 * effectiveDt);
    } else if (this.shieldAlpha > 0) {
      this.shieldAlpha = Math.max(0, this.shieldAlpha - 1.0 * effectiveDt);
    }

    // Update Thruster Particles
    if (this.thrusterActive) {
      this.spawnThrusterParticles(effectiveDt);
    }
    this.updateParticles(effectiveDt);
  }

  // Draw Scene
  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Starfield & Space Dust
    if (this.showStars) {
      this.drawStarfield(ctx);
    }

    // Calculate Viewport Center & Camera Offsets
    let centerX = this.width / 2;
    let centerY = this.height / 2;

    // Nominal Satellite Position
    const rNominal = this.getOrbitRadius(this.semiMajorAxis, this.eccentricity, this.theta);
    const nominalAngle = this.theta + this.orbitInclinationAngle;
    const satNominalX = centerX + rNominal * Math.cos(nominalAngle);
    const satNominalY = centerY + rNominal * Math.sin(nominalAngle) * 0.65; // Project inclination foreshortening

    // Actual Satellite Position (Interpolates if altered by Attack 1)
    let satX = satNominalX;
    let satY = satNominalY;

    if (this.trajectoryPerturbation > 0) {
      const currentA = this.semiMajorAxis + (this.alteredSemiMajorAxis - this.semiMajorAxis) * this.trajectoryPerturbation;
      const currentE = this.eccentricity + (this.alteredEccentricity - this.eccentricity) * this.trajectoryPerturbation;
      const currentTilt = this.orbitInclinationAngle + (this.alteredTilt - this.orbitInclinationAngle) * this.trajectoryPerturbation;
      
      const rAltered = this.getOrbitRadius(currentA, currentE, this.theta);
      const alteredAngle = this.theta + currentTilt;
      satX = centerX + rAltered * Math.cos(alteredAngle);
      satY = centerY + rAltered * Math.sin(alteredAngle) * 0.72;
    }

    // Camera Mode Adjustments
    if (this.cameraMode === 'earth') {
      ctx.translate(centerX * (1 - 1.35), centerY * (1 - 1.35));
      ctx.scale(1.35, 1.35);
    } else if (this.cameraMode === 'satellite') {
      const zoom = 1.6;
      ctx.translate(centerX - satX * zoom, centerY - satY * zoom);
      ctx.scale(zoom, zoom);
    }

    // 2. Draw Orbital Grids & Radial Distance Markers
    this.drawOrbitalGrid(ctx, centerX, centerY);

    // 3. Draw Nominal Orbit (Green Ellipse)
    this.drawNominalOrbit(ctx, centerX, centerY);

    // 4. Draw Compromised Trajectory (Red Ellipse) if Attack 1 active
    if (this.trajectoryPerturbation > 0 || this.currentAttack === 1) {
      this.drawCompromisedOrbit(ctx, centerX, centerY);
    }

    // 5. Draw Earth & Atmosphere
    this.drawEarth(ctx, centerX, centerY);

    // 6. Draw Ground Station & Ground-to-Satellite RF Beam
    this.drawGroundStationAndBeam(ctx, centerX, centerY, satX, satY);

    // 7. Draw Thruster Particles
    this.drawThrusterParticles(ctx);

    // 8. Draw Ghost Satellite (GPS Spoofing - Attack 2)
    if (this.ghostOffsetTheta > 0.005) {
      this.drawGhostSatellite(ctx, centerX, centerY, satX, satY);
    }

    // 9. Draw Satellite Bus & Solar Panels
    this.drawSatellite(ctx, satX, satY);

    // 10. Draw Defensive Cyber Shield if Active
    if (this.shieldAlpha > 0.01) {
      this.drawCyberShield(ctx, satX, satY);
    }

    ctx.restore();
  }

  // Draw Starfield
  drawStarfield(ctx) {
    const time = this.elapsedSeconds;
    this.stars.forEach((star) => {
      const px = star.x * this.width;
      const py = star.y * this.height;
      const flicker = Math.sin(time * star.twinkleSpeed * 15 + star.phase) * 0.35 + 0.65;
      const alpha = Math.min(1, Math.max(0.1, star.brightness * flicker));

      ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Subtle coordinate grid around Earth
  drawOrbitalGrid(ctx, cx, cy) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.06)';
    ctx.lineWidth = 1;

    // Concentric range rings
    [this.earthRadius * 1.5, this.earthRadius * 2.2, this.earthRadius * 3.0].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy);
    ctx.lineTo(cx + 30, cy);
    ctx.moveTo(cx, cy - 30);
    ctx.lineTo(cx, cy + 30);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Nominal Orbit Path (Green Glowing Ellipse)
  drawNominalOrbit(ctx, cx, cy) {
    ctx.save();
    const a = this.semiMajorAxis;
    const e = this.eccentricity;
    const tilt = this.orbitInclinationAngle;

    // Glowing outer stroke
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.2)';
    ctx.lineWidth = 5;
    this.strokeEllipsePath(ctx, cx, cy, a, e, tilt, 0.65);

    // Crisp inner line
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 4]);
    this.strokeEllipsePath(ctx, cx, cy, a, e, tilt, 0.65);
    ctx.setLineDash([]);

    // Apogee and Perigee markers
    const rPe = this.getOrbitRadius(a, e, 0);
    const peX = cx + rPe * Math.cos(tilt);
    const peY = cy + rPe * Math.sin(tilt) * 0.65;

    const rAp = this.getOrbitRadius(a, e, Math.PI);
    const apX = cx + rAp * Math.cos(Math.PI + tilt);
    const apY = cy + rAp * Math.sin(Math.PI + tilt) * 0.65;

    ctx.fillStyle = '#00ff9d';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('Pe (540 km)', peX + 6, peY - 4);
    ctx.fillText('Ap (565 km)', apX - 60, apY + 12);

    ctx.beginPath();
    ctx.arc(peX, peY, 3, 0, Math.PI * 2);
    ctx.arc(apX, apY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Compromised Trajectory (Red Ellipse)
  drawCompromisedOrbit(ctx, cx, cy) {
    ctx.save();
    const currentA = this.semiMajorAxis + (this.alteredSemiMajorAxis - this.semiMajorAxis) * this.trajectoryPerturbation;
    const currentE = this.eccentricity + (this.alteredEccentricity - this.eccentricity) * this.trajectoryPerturbation;
    const currentTilt = this.orbitInclinationAngle + (this.alteredTilt - this.orbitInclinationAngle) * this.trajectoryPerturbation;

    // Glow
    ctx.strokeStyle = `rgba(255, 42, 85, ${0.3 * this.trajectoryPerturbation})`;
    ctx.lineWidth = 6;
    this.strokeEllipsePath(ctx, cx, cy, currentA, currentE, currentTilt, 0.72);

    // Red solid/dashed stroke
    ctx.strokeStyle = '#ff2a55';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 3]);
    this.strokeEllipsePath(ctx, cx, cy, currentA, currentE, currentTilt, 0.72);
    ctx.setLineDash([]);

    // Warning marker on decayed perigee
    const rPe = this.getOrbitRadius(currentA, currentE, 0);
    const peX = cx + rPe * Math.cos(currentTilt);
    const peY = cy + rPe * Math.sin(currentTilt) * 0.72;

    ctx.fillStyle = '#ff2a55';
    ctx.font = '10px "Orbitron", sans-serif';
    ctx.fillText('⚠️ DECAY PERIGEE (310 km)', peX + 8, peY + 4);

    ctx.restore();
  }

  // Helper to trace an ellipse with Keplerian eccentricity
  strokeEllipsePath(ctx, cx, cy, a, e, tilt, ySquash) {
    ctx.beginPath();
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * Math.PI * 2;
      const r = this.getOrbitRadius(a, e, th);
      const angle = th + tilt;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle) * ySquash;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Draw Earth at Center with Continents & Atmosphere
  drawEarth(ctx, cx, cy) {
    ctx.save();
    const r = this.earthRadius;

    // Atmospheric outer glow
    const atmoGrad = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.35);
    atmoGrad.addColorStop(0, 'rgba(0, 180, 255, 0.35)');
    atmoGrad.addColorStop(0.5, 'rgba(0, 120, 255, 0.15)');
    atmoGrad.addColorStop(1, 'rgba(0, 50, 150, 0)');

    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
    ctx.fill();

    // Ocean Globe Base
    const oceanGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
    oceanGrad.addColorStop(0, '#1a5f96');
    oceanGrad.addColorStop(0.7, '#0c2e55');
    oceanGrad.addColorStop(1, '#051428');

    ctx.fillStyle = oceanGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Clip to Earth Sphere for Continents & Shading
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Procedural Continents (Rotating with Earth)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.earthRotation);

    ctx.fillStyle = '#2d6a4f'; // Deep vegetation green
    // North America
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.3, r * 0.28, r * 0.2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // South America
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, r * 0.32, r * 0.2, r * 0.3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Eurasia
    ctx.beginPath();
    ctx.ellipse(r * 0.35, -r * 0.35, r * 0.35, r * 0.22, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Africa
    ctx.beginPath();
    ctx.ellipse(r * 0.25, r * 0.15, r * 0.22, r * 0.28, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Australia
    ctx.beginPath();
    ctx.ellipse(r * 0.6, r * 0.45, r * 0.14, r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Polar ice caps
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.88, r * 0.45, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, r * 0.88, r * 0.45, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Graticules (Latitude & Longitude)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.stroke();

    ctx.restore();

    // Day/Night Terminator Shading (Right half shadowed)
    const shadowGrad = ctx.createLinearGradient(cx - r * 0.2, cy, cx + r, cy);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
    shadowGrad.addColorStop(1, 'rgba(1, 4, 15, 0.85)');

    ctx.fillStyle = shadowGrad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    ctx.restore(); // Restore clip

    // Earth Perimeter Rim
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Ground Station on Earth and RF Uplink/Downlink Beam
  drawGroundStationAndBeam(ctx, cx, cy, satX, satY) {
    ctx.save();
    const r = this.earthRadius;

    // Ground station coordinates on Earth perimeter (pointing generally upward toward orbit)
    const stationAngle = this.earthRotation * 0.6 - 0.7;
    const gsX = cx + (r * 0.95) * Math.cos(stationAngle);
    const gsY = cy + (r * 0.95) * Math.sin(stationAngle);

    // Ground Station Pin
    ctx.fillStyle = '#ffb020';
    ctx.beginPath();
    ctx.arc(gsX, gsY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Antenna dish icon
    ctx.strokeStyle = '#ffb020';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(gsX, gsY, 7, stationAngle - 0.7, stationAngle + 0.7);
    ctx.stroke();

    // Ground station text label
    ctx.fillStyle = '#ffb020';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillText('MADRID-DSN', gsX + 8, gsY - 6);

    // RF Telemetry Beam to Satellite
    if (this.showBeam) {
      if (this.currentAttack === 4) {
        // Communication Jamming Attack: Jagged, flickering red electric static
        ctx.strokeStyle = '#ff2a55';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(gsX, gsY);

        const segments = 12;
        const dx = (satX - gsX) / segments;
        const dy = (satY - gsY) / segments;
        for (let i = 1; i < segments; i++) {
          const jitterX = (Math.random() - 0.5) * 22;
          const jitterY = (Math.random() - 0.5) * 22;
          ctx.lineTo(gsX + dx * i + jitterX, gsY + dy * i + jitterY);
        }
        ctx.lineTo(satX, satY);
        ctx.stroke();

        // RF Jamming Noise Burst Tag
        const midX = (gsX + satX) / 2;
        const midY = (gsY + satY) / 2;
        ctx.fillStyle = '#ff2a55';
        ctx.font = '9px "Orbitron", sans-serif';
        ctx.fillText('⚡ RF JAMMED (98% LOSS)', midX + 10, midY);
      } else {
        // Nominal or Defended Beam: Glowing cyan dashed beam with traveling pulses
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -this.elapsedSeconds * 40;
        ctx.beginPath();
        ctx.moveTo(gsX, gsY);
        ctx.lineTo(satX, satY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pulse signal blip traveling along beam
        const pulseT = (this.elapsedSeconds * 0.8) % 1.0;
        const pulseX = gsX + (satX - gsX) * pulseT;
        const pulseY = gsY + (satY - gsY) * pulseT;

        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }

  // Draw Ghost Satellite (GPS Spoofing - Attack 2)
  drawGhostSatellite(ctx, cx, cy, satX, satY) {
    ctx.save();
    const ghostTheta = this.theta + this.ghostOffsetTheta;
    const rGhost = this.getOrbitRadius(this.semiMajorAxis, this.eccentricity, ghostTheta);
    const ghostAngle = ghostTheta + this.orbitInclinationAngle;
    const ghostX = cx + rGhost * Math.cos(ghostAngle);
    const ghostY = cy + rGhost * Math.sin(ghostAngle) * 0.65;

    // Vector line between actual satellite and spoofed ghost
    ctx.strokeStyle = '#d946ef';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(satX, satY);
    ctx.lineTo(ghostX, ghostY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Delta distance label
    const midX = (satX + ghostX) / 2;
    const midY = (satY + ghostY) / 2;
    ctx.fillStyle = '#d946ef';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(`Δ POS: +${Math.round(this.ghostDistanceKm)} km [SPOOFED]`, midX + 8, midY - 6);

    // Ghost Satellite Body (Translucent Holographic Purple)
    ctx.translate(ghostX, ghostY);
    ctx.strokeStyle = 'rgba(217, 70, 239, 0.85)';
    ctx.fillStyle = 'rgba(217, 70, 239, 0.2)';
    ctx.lineWidth = 1.5;

    // Ghost Bus
    ctx.strokeRect(-8, -6, 16, 12);
    ctx.fillRect(-8, -6, 16, 12);

    // Ghost Solar Panels
    ctx.strokeRect(-24, -4, 14, 8);
    ctx.strokeRect(10, -4, 14, 8);

    // Ghost Target Reticle
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Satellite Graphic (Procedural Vector Model)
  drawSatellite(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Calculate heading angle along the orbit
    let heading = this.theta + this.orbitInclinationAngle + Math.PI / 2;
    if (this.isTumbling) {
      heading += this.satelliteAttitudeAngle;
    }
    ctx.rotate(heading);

    // 1. Solar Array Wings (+Y and -Y)
    const panelWidth = 24;
    const panelHeight = 11;
    const wingOffset = 10;

    // Left Wing
    ctx.fillStyle = '#1e3a8a'; // Photovoltaic deep blue
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.fillRect(-wingOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);
    ctx.strokeRect(-wingOffset - panelWidth, -panelHeight / 2, panelWidth, panelHeight);

    // Left Solar Cells Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(-wingOffset - panelWidth * 0.5, -panelHeight / 2);
    ctx.lineTo(-wingOffset - panelWidth * 0.5, panelHeight / 2);
    ctx.moveTo(-wingOffset - panelWidth, 0);
    ctx.lineTo(-wingOffset, 0);
    ctx.stroke();

    // Right Wing
    ctx.fillStyle = '#1e3a8a';
    ctx.strokeStyle = '#60a5fa';
    ctx.fillRect(wingOffset, -panelHeight / 2, panelWidth, panelHeight);
    ctx.strokeRect(wingOffset, -panelHeight / 2, panelWidth, panelHeight);

    // Right Solar Cells Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(wingOffset + panelWidth * 0.5, -panelHeight / 2);
    ctx.lineTo(wingOffset + panelWidth * 0.5, panelHeight / 2);
    ctx.moveTo(wingOffset, 0);
    ctx.lineTo(wingOffset + panelWidth, 0);
    ctx.stroke();

    // Solar Panel Booms / Mounts
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-wingOffset, 0);
    ctx.lineTo(-6, 0);
    ctx.moveTo(wingOffset, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();

    // 2. Central Satellite Chassis / Bus (Gold thermal multilayer insulation)
    const busW = 14;
    const busH = 18;
    const goldGrad = ctx.createLinearGradient(-busW / 2, -busH / 2, busW / 2, busH / 2);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.5, '#eab308');
    goldGrad.addColorStop(1, '#a16207');

    ctx.fillStyle = goldGrad;
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.fillRect(-busW / 2, -busH / 2, busW, busH);
    ctx.strokeRect(-busW / 2, -busH / 2, busW, busH);

    // 3. Parabolic High-Gain Dish Antenna (Facing Earth / Nadir)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, busH / 2 + 2, 7, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    // Antenna feed horn
    ctx.beginPath();
    ctx.moveTo(0, busH / 2);
    ctx.lineTo(0, busH / 2 + 5);
    ctx.stroke();

    // 4. Thruster Nozzle at rear (-Y)
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(-3, -busH / 2);
    ctx.lineTo(3, -busH / 2);
    ctx.lineTo(5, -busH / 2 - 4);
    ctx.lineTo(-5, -busH / 2 - 4);
    ctx.closePath();
    ctx.fill();

    // 5. Warning Beacon / Status LED on bus
    ctx.beginPath();
    if (this.currentAttack) {
      ctx.fillStyle = '#ff2a55';
      ctx.shadowColor = '#ff2a55';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = '#00ff9d';
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 6;
    }
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Thruster Position relative to heading for spawning particles
    this.thrusterExitWorld = {
      x: x + Math.cos(heading - Math.PI / 2) * (busH / 2 + 4),
      y: y + Math.sin(heading - Math.PI / 2) * (busH / 2 + 4),
      heading: heading
    };

    ctx.restore();
  }

  // Spawn Thruster Exhaust Particles
  spawnThrusterParticles(dt) {
    if (!this.thrusterExitWorld) return;
    const count = this.thrusterType === 'chemical' ? 5 : 3;

    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      const angle = this.thrusterExitWorld.heading - Math.PI / 2 + spread;
      const speed = this.thrusterType === 'chemical' ? Math.random() * 90 + 60 : Math.random() * 45 + 30;

      this.thrusterParticles.push({
        x: this.thrusterExitWorld.x,
        y: this.thrusterExitWorld.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 2.5 + 2.0,
        type: this.thrusterType,
        size: Math.random() * 3 + 1.5
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.thrusterParticles.length - 1; i >= 0; i--) {
      const p = this.thrusterParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.thrusterParticles.splice(i, 1);
      }
    }
  }

  drawThrusterParticles(ctx) {
    ctx.save();
    this.thrusterParticles.forEach((p) => {
      ctx.beginPath();
      if (p.type === 'chemical') {
        // Red / Orange / Yellow fiery exhaust
        ctx.fillStyle = `rgba(255, ${Math.floor(p.life * 200)}, 40, ${p.life})`;
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 8;
      } else {
        // Electric Blue / Cyan ion thruster glow
        ctx.fillStyle = `rgba(0, 229, 255, ${p.life * 0.9})`;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
      }
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Draw Defensive Energetic Cyber Shield Dome
  drawCyberShield(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    const r = this.shieldRadius;
    const time = this.elapsedSeconds * 4;

    // Glowing Hexagonal / Spherical Barrier
    ctx.strokeStyle = `rgba(0, 255, 157, ${this.shieldAlpha * 0.8})`;
    ctx.fillStyle = `rgba(0, 229, 255, ${this.shieldAlpha * 0.15})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff9d';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(0, 0, r + Math.sin(time) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    // Rotating energetic shield ring
    ctx.strokeStyle = `rgba(0, 229, 255, ${this.shieldAlpha * 0.7})`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = time * 10;
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

// Global Orbital Simulation Instance
window.orbitalSim = new OrbitalSimulation('orbitalCanvas');
