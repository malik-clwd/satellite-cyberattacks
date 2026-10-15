/**
 * SAT-DEFENSE // Live Telemetry Engine & Waveform Visualizer
 * Calculates orbital ephemeris (ECI X/Y/Z, Lat/Lon, Velocity, Altitude),
 * subsystem health metrics (Battery, Solar, Thermal, Comms), and renders real-time Canvas charts.
 */

class TelemetryEngine {
  constructor(chartCanvasId) {
    this.chartCanvas = document.getElementById(chartCanvasId);
    this.chartCtx = this.chartCanvas ? this.chartCanvas.getContext('2d') : null;

    // Active Attack & Defense States (Synced from AttackDefenseEngine)
    this.currentAttack = null;
    this.isDefenseActive = false;

    // Physical Constants
    this.earthRadiusKm = 6378.137;
    this.nominalAltitudeKm = 552.4;
    this.nominalVelocityKms = 7.592;
    this.nominalSnrDb = 24.8;
    this.nominalBatteryPct = 94.2;
    this.nominalSolarW = 1480;
    this.nominalCpuTempC = 31.4;

    // Dynamic Live Values
    this.live = {
      xKm: 4218.4,
      yKm: -5102.1,
      zKm: 2840.6,
      altitudeKm: 552.4,
      velocityKms: 7.592,
      latitudeDeg: 28.57,
      longitudeDeg: -80.65,
      // Reported vs Genuine (GPS Spoofing)
      reportedLatDeg: 28.57,
      reportedLonDeg: -80.65,
      reportedAltKm: 552.4,
      // Subsystems
      batteryPct: 94.2,
      solarW: 1480,
      cpuTempC: 31.4,
      attitudeRateDegs: 0.02,
      snrDb: 24.8,
      packetLossPct: 0.0,
      commStatus: 'ONLINE / NOMINAL',
      orbitStatus: 'NOMINAL KEPLERIAN',
      trueAnomalyDeg: 142.8
    };

    // Manipulation Offsets (Attacks 1, 2, 3, 4, 5)
    this.manipulated = {
      batteryPct: 94.2,
      cpuTempC: 31.4,
      altJitterKm: 0,
      velJitterKms: 0
    };

    // Rolling History Buffers for Canvas Charts
    this.activeChartStream = 'alt'; // 'alt', 'vel', 'snr'
    this.maxHistory = 50;
    this.chartHistory = {
      alt: new Array(this.maxHistory).fill(this.nominalAltitudeKm),
      vel: new Array(this.maxHistory).fill(this.nominalVelocityKms),
      snr: new Array(this.maxHistory).fill(this.nominalSnrDb)
    };

    // Clock
    this.simStartTime = Date.now();

    // Chart Canvas Resizing
    if (this.chartCanvas) {
      this.resizeChart();
      window.addEventListener('resize', () => this.resizeChart());
    }

    // Start Telemetry Ticker (Updates 10 times per second)
    this.tickerInterval = setInterval(() => this.tick(), 100);
    // Start Chart Renderer (Updates 20 times per second)
    this.chartInterval = setInterval(() => this.drawChart(), 50);
  }

  resizeChart() {
    if (!this.chartCanvas) return;
    const rect = this.chartCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.chartCanvas.width = rect.width * dpr;
    this.chartCanvas.height = rect.height * dpr;
    if (this.chartCtx) {
      this.chartCtx.resetTransform();
      this.chartCtx.scale(dpr, dpr);
    }
    this.chartWidth = rect.width;
    this.chartHeight = rect.height;
  }

  setChartStream(stream) {
    this.activeChartStream = stream;
  }

  setAttack(attackId) {
    this.currentAttack = attackId;
    this.isDefenseActive = false;
  }

  setDefenseActive(active = true) {
    this.isDefenseActive = active;
  }

  resetToNormal() {
    this.currentAttack = null;
    this.isDefenseActive = false;
    this.manipulated.batteryPct = this.nominalBatteryPct;
    this.manipulated.cpuTempC = this.nominalCpuTempC;
    this.manipulated.altJitterKm = 0;
    this.manipulated.velJitterKms = 0;
    this.live.commStatus = 'ONLINE / NOMINAL';
    this.live.orbitStatus = 'NOMINAL KEPLERIAN';
  }

  // Periodic Telemetry Calculations
  tick() {
    if (!window.orbitalSim) return;
    const sim = window.orbitalSim;
    const theta = sim.theta;
    const inc = 51.6 * (Math.PI / 180); // 51.6 degrees inclination
    const time = sim.elapsedSeconds;

    // Nominal orbital radius (km) with 0.0018 eccentricity
    const baseR = this.earthRadiusKm + this.nominalAltitudeKm;
    const rKm = baseR / (1 + 0.002 * Math.cos(theta));

    // Calculate ECI Coordinates (X, Y, Z in km)
    let curAlt = rKm - this.earthRadiusKm;
    let curVel = Math.sqrt(398600.44 / rKm); // Orbital speed formula v = sqrt(GM/r)

    // Calculate Geodetic Latitude and Longitude
    const lat = Math.asin(Math.sin(inc) * Math.sin(theta)) * (180 / Math.PI);
    const lon = ((theta * (180 / Math.PI) - sim.earthRotation * (180 / Math.PI) * 1.5) % 360);
    const normalizedLon = lon > 180 ? lon - 360 : lon < -180 ? lon + 360 : lon;

    // Apply Cyberattack Perturbations
    if (this.currentAttack === 1) {
      // Attack 1: Trajectory Manipulation (Thruster burn alters orbit to decaying profile)
      const perturb = sim.trajectoryPerturbation;
      curAlt -= perturb * 242; // Altitude plunges down to ~310 km
      curVel += perturb * 0.42; // Velocity increases as perigee drops
      this.live.orbitStatus = perturb > 0.4 ? 'CRITICAL // TRAJECTORY DECAY' : 'PERTURBED ORBIT';
    } else {
      this.live.orbitStatus = 'NOMINAL KEPLERIAN';
    }

    // Attack 2: GPS Spoofing (Actual coordinates stay genuine; reported coordinates diverge)
    this.live.latitudeDeg = lat;
    this.live.longitudeDeg = normalizedLon;
    this.live.altitudeKm = curAlt;

    if (this.currentAttack === 2 && !this.isDefenseActive) {
      // Fake reported coordinates drift far into the southern Indian Ocean / false altitude
      this.live.reportedLatDeg = -43.18 + Math.sin(time * 0.5) * 2;
      this.live.reportedLonDeg = 124.62 + Math.cos(time * 0.5) * 3;
      this.live.reportedAltKm = 835.2 + Math.sin(time) * 15;
    } else {
      this.live.reportedLatDeg = lat;
      this.live.reportedLonDeg = normalizedLon;
      this.live.reportedAltKm = curAlt;
    }

    // Attack 3: Telemetry Data Manipulation (FDI / Bit-Flipping)
    if (this.currentAttack === 3 && !this.isDefenseActive) {
      // Battery falsely drops to 4%, Temp surges to 118°C, Altitude oscillates erratically
      this.manipulated.batteryPct = 4.2 + Math.random() * 0.8;
      this.manipulated.cpuTempC = 118.4 + Math.random() * 4.2;
      this.manipulated.altJitterKm = (Math.sin(time * 5) * 180);
      this.manipulated.velJitterKms = (Math.cos(time * 4) * 1.2);
    } else {
      this.manipulated.batteryPct = this.nominalBatteryPct + (Math.random() - 0.5) * 0.4;
      this.manipulated.cpuTempC = this.nominalCpuTempC + (Math.random() - 0.5) * 0.3;
      this.manipulated.altJitterKm = 0;
      this.manipulated.velJitterKms = 0;
    }

    // Attack 4: Communication Jamming (RF Noise Saturation)
    if (this.currentAttack === 4 && !this.isDefenseActive) {
      this.live.snrDb = -4.2 + (Math.random() - 0.5) * 1.5; // Negative SNR = buried in noise
      this.live.packetLossPct = 98.4 + Math.random() * 1.2;
      this.live.commStatus = 'JAMMED / CARRIER LOST';
    } else {
      this.live.snrDb = this.nominalSnrDb + (Math.random() - 0.5) * 0.6;
      this.live.packetLossPct = 0.0;
      this.live.commStatus = 'ONLINE / NOMINAL';
    }

    // Attack 5: Command Injection (Violent tumble & solar arrays turned away)
    if (this.currentAttack === 5 && !this.isDefenseActive) {
      this.live.attitudeRateDegs = 14.8 + Math.random() * 1.5; // High spin
      this.live.solarW = 42 + Math.random() * 15; // Starved of sunlight
      this.live.batteryPct = Math.max(12, this.nominalBatteryPct - (time % 100) * 0.3);
    } else {
      this.live.attitudeRateDegs = 0.02 + (Math.random() - 0.5) * 0.01;
      this.live.solarW = this.nominalSolarW + (Math.random() - 0.5) * 20;
      this.live.batteryPct = this.nominalBatteryPct;
    }

    // ECI Coordinates
    this.live.xKm = rKm * Math.cos(theta);
    this.live.yKm = rKm * Math.sin(theta) * Math.cos(inc);
    this.live.zKm = rKm * Math.sin(theta) * Math.sin(inc);
    this.live.velocityKms = curVel + this.manipulated.velJitterKms;
    this.live.trueAnomalyDeg = ((theta * 180) / Math.PI) % 360;

    // Push into Rolling History Buffers
    const displayedAlt = this.currentAttack === 3 ? curAlt + this.manipulated.altJitterKm : curAlt;
    const displayedVel = this.currentAttack === 3 ? curVel + this.manipulated.velJitterKms : curVel;
    const displayedSnr = Math.max(-10, this.live.snrDb);

    this.chartHistory.alt.push(displayedAlt);
    this.chartHistory.alt.shift();
    this.chartHistory.vel.push(displayedVel);
    this.chartHistory.vel.shift();
    this.chartHistory.snr.push(displayedSnr);
    this.chartHistory.snr.shift();

    // Update DOM UI elements
    this.updateDomElements();
  }

  // Update HTML DOM Displays
  updateDomElements() {
    const el = (id) => document.getElementById(id);

    // Ephemeris Panel
    if (el('valPosX')) el('valPosX').textContent = `${this.live.xKm >= 0 ? '+' : ''}${this.live.xKm.toFixed(1)} km`;
    if (el('valPosY')) el('valPosY').textContent = `${this.live.yKm >= 0 ? '+' : ''}${this.live.yKm.toFixed(1)} km`;
    if (el('valPosZ')) el('valPosZ').textContent = `${this.live.zKm >= 0 ? '+' : ''}${this.live.zKm.toFixed(1)} km`;
    
    // Altitude & Velocity (with Attack 3 corruption if active)
    const displayedAlt = (this.currentAttack === 3 && !this.isDefenseActive)
      ? this.live.altitudeKm + this.manipulated.altJitterKm
      : this.live.altitudeKm;
    const displayedVel = (this.currentAttack === 3 && !this.isDefenseActive)
      ? this.live.velocityKms + this.manipulated.velJitterKms
      : this.live.velocityKms;

    if (el('valAltitude')) {
      el('valAltitude').textContent = `${displayedAlt.toFixed(2)} km`;
      el('valAltitude').className = (this.currentAttack === 1 || this.currentAttack === 3) && !this.isDefenseActive
        ? 'val-number highlight-red' : 'val-number highlight-cyan';
    }

    if (el('valVelocity')) {
      el('valVelocity').textContent = `${displayedVel.toFixed(3)} km/s`;
      el('valVelocity').className = (this.currentAttack === 1 || this.currentAttack === 3) && !this.isDefenseActive
        ? 'val-number highlight-red' : 'val-number highlight-cyan';
    }

    if (el('valTrueAnomaly')) el('valTrueAnomaly').textContent = `${this.live.trueAnomalyDeg.toFixed(1)}°`;
    if (el('barOrbitProgress')) el('barOrbitProgress').style.width = `${(this.live.trueAnomalyDeg / 360) * 100}%`;

    // Coordinates (Actual vs Reported)
    if (el('valLatitude')) {
      const latVal = this.currentAttack === 2 && !this.isDefenseActive ? this.live.reportedLatDeg : this.live.latitudeDeg;
      el('valLatitude').textContent = `${Math.abs(latVal).toFixed(4)}° ${latVal >= 0 ? 'N' : 'S'}`;
      el('valLatitude').className = this.currentAttack === 2 && !this.isDefenseActive ? 'val-number highlight-ghost' : 'val-number';
    }

    if (el('valLongitude')) {
      const lonVal = this.currentAttack === 2 && !this.isDefenseActive ? this.live.reportedLonDeg : this.live.longitudeDeg;
      el('valLongitude').textContent = `${Math.abs(lonVal).toFixed(4)}° ${lonVal >= 0 ? 'E' : 'W'}`;
      el('valLongitude').className = this.currentAttack === 2 && !this.isDefenseActive ? 'val-number highlight-ghost' : 'val-number';
    }

    // RF & Comms
    if (el('valSignalStrength')) {
      el('valSignalStrength').textContent = `${this.live.snrDb.toFixed(1)} dB (${Math.max(0, Math.min(100, (this.live.snrDb + 10) * 3)).toFixed(0)}%)`;
      el('valSignalStrength').className = this.currentAttack === 4 && !this.isDefenseActive ? 'val-number highlight-red' : 'val-number highlight-green';
    }

    if (el('valPacketLoss')) {
      el('valPacketLoss').textContent = `${this.live.packetLossPct.toFixed(2)} %`;
      el('valPacketLoss').className = this.currentAttack === 4 && !this.isDefenseActive ? 'val-number highlight-red' : 'val-number';
    }

    if (el('valCommStatus')) {
      el('valCommStatus').textContent = this.live.commStatus;
      el('valCommStatus').className = this.currentAttack === 4 && !this.isDefenseActive ? 'val-number highlight-red' : 'val-number highlight-green';
    }

    if (el('commsBadge')) {
      if (this.currentAttack === 4 && !this.isDefenseActive) {
        el('commsBadge').textContent = 'CARRIER LOST';
        el('commsBadge').className = 'badge badge-red font-mono';
      } else {
        el('commsBadge').textContent = 'CARRIER LOCKED';
        el('commsBadge').className = 'badge badge-green font-mono';
      }
    }

    // Subsystems
    const batt = this.currentAttack === 3 && !this.isDefenseActive ? this.manipulated.batteryPct : this.live.batteryPct;
    if (el('valBattery')) {
      el('valBattery').textContent = `${batt.toFixed(1)}% (${(batt * 0.28).toFixed(1)}V)`;
      el('valBattery').className = batt < 20 ? 'subsystem-val font-mono highlight-red' : 'subsystem-val font-mono';
    }
    if (el('barBattery')) {
      el('barBattery').style.width = `${Math.max(5, Math.min(100, batt))}%`;
      el('barBattery').className = batt < 20 ? 'progress-fill fill-red' : 'progress-fill fill-green';
    }

    if (el('valSolar')) {
      el('valSolar').textContent = `${Math.round(this.live.solarW)} W ${this.live.solarW < 200 ? '(OFF-SUN)' : '(SUN-FACING)'}`;
      el('valSolar').className = this.live.solarW < 200 ? 'subsystem-val font-mono highlight-red' : 'subsystem-val font-mono';
    }
    if (el('barSolar')) {
      el('barSolar').style.width = `${Math.min(100, (this.live.solarW / 1600) * 100)}%`;
      el('barSolar').className = this.live.solarW < 200 ? 'progress-fill fill-red' : 'progress-fill fill-cyan';
    }

    const cpuT = this.currentAttack === 3 && !this.isDefenseActive ? this.manipulated.cpuTempC : this.live.cpuTempC;
    if (el('valCpuTemp')) {
      el('valCpuTemp').textContent = `${cpuT.toFixed(1)} °C`;
      el('valCpuTemp').className = cpuT > 80 ? 'subsystem-val font-mono highlight-red' : 'subsystem-val font-mono';
    }
    if (el('barCpuTemp')) {
      el('barCpuTemp').style.width = `${Math.min(100, (cpuT / 120) * 100)}%`;
      el('barCpuTemp').className = cpuT > 80 ? 'progress-fill fill-red' : 'progress-fill fill-green';
    }

    if (el('valAttitudeRate')) {
      el('valAttitudeRate').textContent = `${this.live.attitudeRateDegs.toFixed(2)} °/s ${this.live.attitudeRateDegs > 2 ? '(TUMBLING)' : '(LOCKED)'}`;
      el('valAttitudeRate').className = this.live.attitudeRateDegs > 2 ? 'subsystem-val font-mono highlight-red' : 'subsystem-val font-mono';
    }
    if (el('barAttitudeRate')) {
      el('barAttitudeRate').style.width = `${Math.min(100, this.live.attitudeRateDegs * 6)}%`;
      el('barAttitudeRate').className = this.live.attitudeRateDegs > 2 ? 'progress-fill fill-red' : 'progress-fill fill-green';
    }

    // Simulation Theater Top Status
    if (el('valOrbitStatusText')) {
      el('valOrbitStatusText').textContent = this.live.orbitStatus;
      el('valOrbitStatusText').className = this.live.orbitStatus.includes('NOMINAL')
        ? 'val-highlight highlight-green' : 'val-highlight highlight-red';
    }

    // Health Badge
    if (el('healthBadge')) {
      if (this.currentAttack && !this.isDefenseActive) {
        el('healthBadge').textContent = 'ANOMALY DETECTED';
        el('healthBadge').className = 'badge badge-red font-mono';
      } else {
        el('healthBadge').textContent = '100% HEALTH';
        el('healthBadge').className = 'badge badge-green font-mono';
      }
    }
  }

  // Draw Rolling Canvas Graph
  drawChart() {
    if (!this.chartCtx || !this.chartWidth) return;
    const ctx = this.chartCtx;
    const w = this.chartWidth;
    const h = this.chartHeight;

    ctx.clearRect(0, 0, w, h);

    // Background & Subtle Grid
    ctx.fillStyle = 'rgba(2, 5, 15, 0.95)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    [0.25, 0.5, 0.75].forEach((pct) => {
      ctx.beginPath();
      ctx.moveTo(0, h * pct);
      ctx.lineTo(w, h * pct);
      ctx.stroke();
    });

    const data = this.chartHistory[this.activeChartStream];
    if (!data || data.length < 2) return;

    // Determine Min & Max bounds for normalization
    let minVal, maxVal, nominalVal, unit;
    if (this.activeChartStream === 'alt') {
      minVal = 250; maxVal = 700; nominalVal = this.nominalAltitudeKm; unit = 'km';
    } else if (this.activeChartStream === 'vel') {
      minVal = 6.8; maxVal = 8.4; nominalVal = this.nominalVelocityKms; unit = 'km/s';
    } else {
      minVal = -10; maxVal = 32; nominalVal = this.nominalSnrDb; unit = 'dB';
    }

    // Draw Baseline Nominal Reference Line (Green Dotted)
    const baselineY = h - ((nominalVal - minVal) / (maxVal - minVal)) * h;
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(w, baselineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Waveform Line
    const stepX = w / (data.length - 1);
    ctx.beginPath();

    const points = [];
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      const clamped = Math.max(minVal, Math.min(maxVal, val));
      const y = h - ((clamped - minVal) / (maxVal - minVal)) * h;
      const x = i * stepX;
      points.push({ x, y });
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // Determine Color: Cyan if normal, Red if attack is actively causing divergence
    const isAnomalous = this.currentAttack && !this.isDefenseActive;
    ctx.strokeStyle = isAnomalous ? '#ff2a55' : '#00e5ff';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = isAnomalous ? '#ff2a55' : '#00e5ff';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fill underneath with translucent gradient
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (isAnomalous) {
      fillGrad.addColorStop(0, 'rgba(255, 42, 85, 0.25)');
      fillGrad.addColorStop(1, 'rgba(255, 42, 85, 0)');
    } else {
      fillGrad.addColorStop(0, 'rgba(0, 229, 255, 0.2)');
      fillGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    }
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Current Value Watermark
    const lastVal = data[data.length - 1];
    ctx.fillStyle = isAnomalous ? '#ff2a55' : '#00e5ff';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`${lastVal.toFixed(2)} ${unit}`, w - 75, 16);
  }
}

// Global Telemetry Instance
window.telemetry = new TelemetryEngine('telemetryChartCanvas');
