/**
 * SAT-DEFENSE // Cyberattack Simulation & Autonomous Defense Engine
 * Coordinates the 5 cyberattack state machines, automated defense mitigation protocols,
 * audit logging, and before-and-after comparison updates.
 */

class AttackDefenseEngine {
  constructor() {
    this.currentAttackId = 1;
    this.attackState = 'SECURE'; // 'SECURE', 'ATTACK_ACTIVE', 'DEFENSE_ACTIVE', 'RECOVERED'
    this.attackStartTime = null;
    this.defenseTimer = null;

    // Defense Event Log Store
    this.logs = [];
    this.activeLogFilter = 'all';

    // 5 Cyberattack Scenario Definitions
    this.attackProfiles = {
      1: {
        id: 1,
        title: "Trajectory Manipulation Attack",
        target: "PROPULSION & GNC",
        severity: "CRITICAL (CAT 1)",
        vuln: "Unauthenticated Uplink (CCSDS Replay & Frame Injection)",
        description: "Simulates unauthorized uplink telecommands executing rogue delta-V thruster burns. The satellite deviates from its safe orbital corridor into an unstable high-drag or decay trajectory.",
        mitigation: "Autonomous station-keeping retro-burns, telecommand signature validation via CCSDS SDLS, and Kalman filter orbital sanity enforcement.",
        alertText: "ATTACK DETECTED: UNAUTHORIZED ROGUE THRUSTER BURNING",
        subsystemImpact: "Propulsion valve locked 100% duty cycle, orbital decay to 310 km perigee"
      },
      2: {
        id: 2,
        title: "GPS Spoofing Attack",
        target: "NAVIGATION & POSITIONING (GNSS)",
        severity: "HIGH (CAT 2)",
        vuln: "Lack of Cryptographic GNSS Carrier Authentication (Civilian L1/L2)",
        description: "High-power false GNSS signals broadcast toward the satellite overpower real GPS constellations, broadcasting forged pseudo-ranges. The GNC displays fake coordinates while the physical satellite remains unchanged.",
        mitigation: "Multi-constellation Receiver Autonomous Integrity Monitoring (RAIM) and optical Star Tracker cross-verification, discarding spoofed GNSS.",
        alertText: "ATTACK DETECTED: GNSS CARRIER SPOOFING DETECTED",
        subsystemImpact: "Reported coordinates drifting +428 km into southern Indian Ocean"
      },
      3: {
        id: 3,
        title: "Telemetry Data Manipulation",
        target: "DOWNLINK TELEMETRY & MONITORING",
        severity: "HIGH (CAT 2)",
        vuln: "Unencrypted Telemetry Framing / Man-in-the-Middle Packet Tampering",
        description: "Attacker man-in-the-middle alters telemetry frames before ground station downlink decoding. Battery falsely reads critical 4%, CPU temperature spikes to 118°C, and altitude jitters wildly to fool operators into shutting down systems.",
        mitigation: "End-to-end cryptographic telemetry packet signing (AES-256-GCM), sensor fusion parity validation, and Kalman filter innovation thresholding.",
        alertText: "ATTACK DETECTED: DOWNLINK TELEMETRY BIT-FLIPPING INJECTED",
        subsystemImpact: "False battery critical drain (4%), false CPU overheat (118°C), CRC failure"
      },
      4: {
        id: 4,
        title: "Communication Jamming Attack",
        target: "S-BAND / X-BAND RF FRONT-END",
        severity: "CRITICAL (CAT 1)",
        vuln: "Narrowband Uplink Channel without Dynamic Frequency Hopping",
        description: "High-power electronic warfare transmitters flood the satellite's uplink receiver frequency with Gaussian noise. Signal SNR plunges from +24.8 dB to -4.2 dB, packet loss hits 98.4%, and carrier lock drops to OFFLINE / JAMMED.",
        mitigation: "Autonomous engagement of Frequency Hopping Spread Spectrum (FHSS at 50 hops/s) and switching to inter-satellite crosslink relay.",
        alertText: "ATTACK DETECTED: HIGH-POWER RF JAMMING NOISE DETECTED",
        subsystemImpact: "Carrier loss, SNR plunging to -4.2 dB, 98.4% packet loss"
      },
      5: {
        id: 5,
        title: "Command Injection Attack",
        target: "FLIGHT SOFTWARE & ATTITUDE CONTROL",
        severity: "CRITICAL (CAT 1)",
        vuln: "Memory Corruption (Buffer Overflow) in Legacy CCSDS Packet Parser",
        description: "Exploitation of memory corruption in flight software telecommand decoder executes arbitrary unauthorized commands (CMD_SLEW_SOLAR_OFFLINE, DESATURATE_WHEELS_OFF), causing uncontrolled tumbling, solar array misalignment, and power starvation.",
        mitigation: "Hardware Memory Protection Unit (MPU) quarantine, watchdog firmware rollback to golden read-only ROM, and reaction wheel automated despin.",
        alertText: "ATTACK DETECTED: MALICIOUS TELECOMMAND INJECTION EXECUTED",
        subsystemImpact: "Uncontrolled 14.8°/s tumble, solar generation drops to 42W, attitude unlock"
      }
    };

    // Initialize with standard system start logs
    this.addLog('SYSTEM', 'AERO-CYBER System initialized. Satellite AEGIS-7 telemetry stream nominal.');
    this.addLog('SYSTEM', 'CCSDS 133.0-B-1 protocol handler active. Carrier locked with MADRID-DSN (34m).');
    this.addLog('DEFENSE', 'Autonomous Kalman Filter IDS active. Residual threshold nominal (0.012 < 0.85).');
    
    // Initial comparison panel state
    this.updateComparisonPanel();
  }

  // Get current military UTC timestamp string
  getTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}.${String(now.getUTCMilliseconds()).padStart(3, '0').slice(0, 2)}Z`;
  }

  // Add an entry to the Defense Event Log
  addLog(category, message) {
    const time = this.getTimestamp();
    const entry = { id: Date.now() + Math.random(), time, category, message };
    this.logs.unshift(entry); // Prepend to show latest on top

    // Keep max 100 entries
    if (this.logs.length > 100) this.logs.pop();

    this.renderLogs();
  }

  // Render Defense Event Log in HTML
  renderLogs() {
    const container = document.getElementById('defenseLogContainer');
    const badge = document.getElementById('logCountBadge');
    if (!container) return;

    if (badge) badge.textContent = `${this.logs.length} EVENTS`;

    const filtered = this.logs.filter((item) => {
      if (this.activeLogFilter === 'all') return true;
      if (this.activeLogFilter === 'threat') return item.category === 'THREAT';
      if (this.activeLogFilter === 'defense') return item.category === 'DEFENSE';
      if (this.activeLogFilter === 'system') return item.category === 'SYSTEM';
      return true;
    });

    container.innerHTML = filtered.map((item) => {
      let badgeClass = 'log-badge-info';
      if (item.category === 'THREAT') badgeClass = 'log-badge-threat';
      else if (item.category === 'DEFENSE') badgeClass = 'log-badge-defense';
      else if (item.category === 'WARN') badgeClass = 'log-badge-warn';

      return `
        <div class="log-entry">
          <span class="log-time">[${item.time}]</span>
          <span class="log-badge ${badgeClass}">${item.category}</span>
          <span class="log-text">${item.message}</span>
        </div>
      `;
    }).join('');
  }

  setLogFilter(filter) {
    this.activeLogFilter = filter;
    this.renderLogs();
  }

  clearLogs() {
    this.logs = [];
    this.addLog('SYSTEM', 'Event log cleared by operator.');
  }

  // Select Cyberattack Vector
  selectAttack(attackId) {
    this.currentAttackId = parseInt(attackId, 10);
    const profile = this.attackProfiles[this.currentAttackId];
    if (!profile) return;

    // Update attack profile info card in UI
    const el = (id) => document.getElementById(id);
    if (el('infoAttackTitle')) el('infoAttackTitle').textContent = profile.title;
    if (el('infoAttackTarget')) el('infoAttackTarget').textContent = `TARGET: ${profile.target}`;
    if (el('infoAttackDescription')) el('infoAttackDescription').textContent = profile.description;
    if (el('infoAttackSeverity')) el('infoAttackSeverity').textContent = profile.severity;
    if (el('infoAttackVuln')) el('infoAttackVuln').textContent = profile.vuln;

    if (window.soundFX) window.soundFX.playBeep(900, 0.04);
  }

  // Launch Simulated Cyberattack
  launchAttack() {
    const profile = this.attackProfiles[this.currentAttackId];
    if (!profile) return;

    this.attackState = 'ATTACK_ACTIVE';
    this.attackStartTime = Date.now();

    // 1. Notify Simulation & Telemetry Engines
    if (window.orbitalSim) window.orbitalSim.setAttack(this.currentAttackId);
    if (window.telemetry) window.telemetry.setAttack(this.currentAttackId);

    // 2. Audio Effects
    if (window.soundFX) {
      window.soundFX.startAlarm();
    }

    // 3. UI Status Badges
    const masterBadge = document.getElementById('masterStatusBadge');
    const masterText = document.getElementById('masterStatusText');
    if (masterBadge && masterText) {
      masterBadge.className = 'status-badge state-attack';
      masterText.textContent = `CRITICAL // ATTACK: ${profile.title.toUpperCase()}`;
    }

    // Canvas Alert Banner
    const simAlertBanner = document.getElementById('simAlertBanner');
    const simAlertMessage = document.getElementById('simAlertMessage');
    if (simAlertBanner && simAlertMessage) {
      simAlertMessage.textContent = profile.alertText;
      simAlertBanner.className = 'sim-alert-banner';
    }

    // Canvas Legend rows
    const compromisedLegend = document.getElementById('legendCompromisedRow');
    const ghostLegend = document.getElementById('legendGhostRow');
    if (compromisedLegend) {
      compromisedLegend.className = this.currentAttackId === 1 ? 'legend-row' : 'legend-row legend-inactive';
    }
    if (ghostLegend) {
      ghostLegend.className = this.currentAttackId === 2 ? 'legend-row' : 'legend-row legend-inactive';
    }

    // 4. Defense Pipeline Indicators
    const statAttack = document.getElementById('statAttackValue');
    const statDetect = document.getElementById('statDetectionValue');
    const statRecov = document.getElementById('statRecoveryValue');
    const step1 = document.getElementById('stepThreatStatus');
    const step2 = document.getElementById('stepDetectionStatus');
    const step3 = document.getElementById('stepRecoveryStatus');

    if (statAttack) statAttack.textContent = `ACTIVE: ${profile.title}`;
    if (statDetect) statDetect.textContent = 'ANOMALY DETECTED (SEV 1)';
    if (statRecov) statRecov.textContent = 'PENDING MITIGATION';

    if (step1) step1.className = 'pipeline-step step-attack';
    if (step2) step2.className = 'pipeline-step step-attack';
    if (step3) step3.className = 'pipeline-step';

    // 5. Add Detailed Audit Trail Logs
    this.addLog('THREAT', `CYBERATTACK LAUNCHED: [${profile.title}] on target ${profile.target}.`);
    this.addLog('THREAT', `Vulnerability exploited: ${profile.vuln}`);
    this.addLog('WARN', `Subsystem telemetry affected: ${profile.subsystemImpact}`);
    this.addLog('DEFENSE', `Autonomous IDS flagged anomaly. Kalman Filter residual spike: 1.84 (Threshold 0.85).`);

    // 6. Update Subsystem Inspector Details
    this.updateSubsystemsInspector();

    // 7. Update Before-and-After Comparison Panel
    this.updateComparisonPanel();
  }

  // Activate Cyber Defense System (Autonomous Multi-Stage Mitigation)
  activateDefense() {
    if (this.attackState !== 'ATTACK_ACTIVE') {
      this.addLog('SYSTEM', 'Defense system scan complete. No active cyber threats detected.');
      if (window.soundFX) window.soundFX.playBeep(1200, 0.08);
      return;
    }

    const profile = this.attackProfiles[this.currentAttackId];
    this.attackState = 'DEFENSE_ACTIVE';

    // Stop klaxon and play high-tech shield activation sound
    if (window.soundFX) {
      window.soundFX.stopAlarm();
      window.soundFX.playDefenseShield();
    }

    // Visual Defense Shield in Simulation
    if (window.orbitalSim) window.orbitalSim.setDefenseActive(true);
    if (window.telemetry) window.telemetry.setDefenseActive(true);

    // Update Header Status
    const masterBadge = document.getElementById('masterStatusBadge');
    const masterText = document.getElementById('masterStatusText');
    if (masterBadge && masterText) {
      masterBadge.className = 'status-badge state-defense';
      masterText.textContent = 'DEFENSE ACTIVE // COUNTERMEASURE ENGAGED';
    }

    // Pipeline Step 3 - Defense Active
    const statRecov = document.getElementById('statRecoveryValue');
    const step3 = document.getElementById('stepRecoveryStatus');
    if (statRecov) statRecov.textContent = 'EXECUTING MITIGATION PROTOCOL';
    if (step3) step3.className = 'pipeline-step step-defense';

    // Log Defense Initialization
    this.addLog('DEFENSE', `OPERATOR TRIGGERED: Cyber Defense System engaged for ${profile.title}.`);
    this.addLog('DEFENSE', `Deploying countermeasure: ${profile.mitigation}`);

    // Multi-stage mitigation sequence
    setTimeout(() => {
      this.addLog('DEFENSE', 'Step 1/3: Cryptographic re-authentication (CCSDS SDLS AES-256 HMAC handshake) verified.');
      const ttcCrypto = document.getElementById('ttcCryptoText');
      if (ttcCrypto) ttcCrypto.textContent = 'AES-256-GCM SDLS (RE-KEYED)';
    }, 700);

    setTimeout(() => {
      this.addLog('DEFENSE', 'Step 2/3: Autonomous fail-safe rollback & subsystem parity quarantine successful.');
      const kfCrc = document.getElementById('kfCrc');
      if (kfCrc) kfCrc.textContent = 'CRC-32 PASS (RESTORED)';
    }, 1500);

    setTimeout(() => {
      // Step 3: Complete Restoration
      this.attackState = 'RECOVERED';

      if (window.soundFX) window.soundFX.playRecoveryChime();

      if (masterBadge && masterText) {
        masterBadge.className = 'status-badge state-recovered';
        masterText.textContent = 'THREAT NEUTRALIZED // RESTORED & SECURE';
      }

      // Hide canvas alert banner
      const simAlertBanner = document.getElementById('simAlertBanner');
      if (simAlertBanner) simAlertBanner.className = 'sim-alert-banner alert-hidden';

      const statAttack = document.getElementById('statAttackValue');
      const statDetect = document.getElementById('statDetectionValue');
      const statRecov = document.getElementById('statRecoveryValue');
      const step1 = document.getElementById('stepThreatStatus');
      const step2 = document.getElementById('stepDetectionStatus');

      if (statAttack) statAttack.textContent = 'THREAT MITIGATED';
      if (statDetect) statDetect.textContent = 'IDS VERIFIED NORMAL';
      if (statRecov) statRecov.textContent = 'NOMINAL STATE RESTORED';

      if (step1) step1.className = 'pipeline-step step-nominal';
      if (step2) step2.className = 'pipeline-step step-nominal';
      if (step3) step3.className = 'pipeline-step step-nominal';

      this.addLog('DEFENSE', `Step 3/3: Telemetry restored to baseline. Satellite AEGIS-7 fully secure.`);

      // Update Subsystem Inspector and Comparison Panel
      this.updateSubsystemsInspector();
      this.updateComparisonPanel();
    }, 2400);
  }

  // Reset to Normal Baseline Slate
  resetToNormal() {
    this.attackState = 'SECURE';
    this.attackStartTime = null;

    if (window.soundFX) {
      window.soundFX.stopAlarm();
      window.soundFX.playBeep(650, 0.05);
    }

    if (window.orbitalSim) window.orbitalSim.resetToNormal();
    if (window.telemetry) window.telemetry.resetToNormal();

    // Master Status Badge
    const masterBadge = document.getElementById('masterStatusBadge');
    const masterText = document.getElementById('masterStatusText');
    if (masterBadge && masterText) {
      masterBadge.className = 'status-badge state-secure';
      masterText.textContent = 'NORMAL // SECURE';
    }

    // Hide Canvas Alert Banner
    const simAlertBanner = document.getElementById('simAlertBanner');
    if (simAlertBanner) simAlertBanner.className = 'sim-alert-banner alert-hidden';

    // Hide legend altered rows
    const compromisedLegend = document.getElementById('legendCompromisedRow');
    const ghostLegend = document.getElementById('legendGhostRow');
    if (compromisedLegend) compromisedLegend.className = 'legend-row legend-inactive';
    if (ghostLegend) ghostLegend.className = 'legend-row legend-inactive';

    // Pipeline Steps
    const statAttack = document.getElementById('statAttackValue');
    const statDetect = document.getElementById('statDetectionValue');
    const statRecov = document.getElementById('statRecoveryValue');
    const step1 = document.getElementById('stepThreatStatus');
    const step2 = document.getElementById('stepDetectionStatus');
    const step3 = document.getElementById('stepRecoveryStatus');

    if (statAttack) statAttack.textContent = 'NONE (STANDBY)';
    if (statDetect) statDetect.textContent = 'CONTINUOUS MONITOR';
    if (statRecov) statRecov.textContent = 'SYSTEM READY';

    if (step1) step1.className = 'pipeline-step step-nominal';
    if (step2) step2.className = 'pipeline-step step-nominal';
    if (step3) step3.className = 'pipeline-step step-nominal';

    this.addLog('SYSTEM', 'System baseline reset. Nominal orbital telemetry confirmed.');
    this.updateSubsystemsInspector();
    this.updateComparisonPanel();
  }

  // Update Subsystem Inspector Details (Tab 2)
  updateSubsystemsInspector() {
    const el = (id) => document.getElementById(id);
    const isAttacking = this.attackState === 'ATTACK_ACTIVE';

    if (el('adcsStatusText')) {
      if (isAttacking && this.currentAttackId === 5) {
        el('adcsStatusText').textContent = 'UNCONTROLLED TUMBLE (14.8°/s)';
        el('adcsStatusText').className = 'highlight-red';
      } else {
        el('adcsStatusText').textContent = 'NADIR POINTING (STABLE)';
        el('adcsStatusText').className = 'highlight-green';
      }
    }

    if (el('epsStatusText')) {
      if (isAttacking && (this.currentAttackId === 3 || this.currentAttackId === 5)) {
        el('epsStatusText').textContent = 'CRITICAL UNDERVOLT ANOMALY';
        el('epsStatusText').className = 'highlight-red';
      } else {
        el('epsStatusText').textContent = 'DISENGAGED (NOMINAL)';
        el('epsStatusText').className = 'highlight-green';
      }
    }

    if (el('ttcBufferText')) {
      if (isAttacking && this.currentAttackId === 5) {
        el('ttcBufferText').textContent = '1 MALICIOUS TELECOMMAND INJECTED';
        el('ttcBufferText').className = 'highlight-red';
      } else {
        el('ttcBufferText').textContent = '0 UNVERIFIED FRAMES';
        el('ttcBufferText').className = 'stat-highlight';
      }
    }

    if (el('ttcFhssText')) {
      if (this.attackState === 'DEFENSE_ACTIVE' || this.attackState === 'RECOVERED') {
        el('ttcFhssText').textContent = 'ENGAGED (50 HOPS/SEC)';
        el('ttcFhssText').className = 'highlight-green';
      } else {
        el('ttcFhssText').textContent = 'STANDBY (50 hops/s)';
        el('ttcFhssText').className = 'stat-highlight';
      }
    }

    if (el('kfResidual')) {
      if (isAttacking) {
        el('kfResidual').textContent = '1.842 (THRESHOLD EXCEEDED)';
        el('kfResidual').className = 'highlight-red';
      } else {
        el('kfResidual').textContent = '0.012 (Threshold: 0.85)';
        el('kfResidual').className = 'stat-highlight';
      }
    }

    if (el('kfConsistency')) {
      if (isAttacking) {
        el('kfConsistency').textContent = 'DIVERGENT (INNOVATION FAIL)';
        el('kfConsistency').className = 'highlight-red';
      } else {
        el('kfConsistency').textContent = '99.8% CONVERGENT';
        el('kfConsistency').className = 'highlight-green';
      }
    }

    if (el('kfCrc')) {
      if (isAttacking && this.currentAttackId === 3) {
        el('kfCrc').textContent = 'CRC-32 FAILED (BIT-FLIP)';
        el('kfCrc').className = 'highlight-red';
      } else {
        el('kfCrc').textContent = 'CRC-32 PASS';
        el('kfCrc').className = 'highlight-green';
      }
    }

    if (el('kfIsolation')) {
      if (isAttacking) {
        el('kfIsolation').textContent = 'INTRUSION ACTIVE';
        el('kfIsolation').className = 'highlight-red';
      } else if (this.attackState === 'RECOVERED') {
        el('kfIsolation').textContent = 'THREAT ISOLATED & RESTORED';
        el('kfIsolation').className = 'highlight-green';
      } else {
        el('kfIsolation').textContent = 'ZERO INTRUSION';
        el('kfIsolation').className = 'highlight-green';
      }
    }
  }

  // Update Before-and-After Comparison Matrix (Tab 1)
  updateComparisonPanel() {
    const el = (id) => document.getElementById(id);
    const isAttacking = this.attackState === 'ATTACK_ACTIVE';
    const isRecovered = this.attackState === 'RECOVERED';

    // 1. Orbit Comparison
    if (el('cmpNominalOrbit')) {
      el('cmpNominalOrbit').textContent = 'Circular LEO (550 km), Ecc: 0.0012, Safe';
    }
    if (el('cmpAlteredOrbit')) {
      if (isAttacking && this.currentAttackId === 1) {
        el('cmpAlteredOrbit').textContent = 'Perturbed Ellipse (Pe: 310 km, Ap: 680 km), Ecc: 0.42, DECAY DANGER';
        el('cmpAlteredOrbit').className = 'highlight-red';
      } else if (isRecovered && this.currentAttackId === 1) {
        el('cmpAlteredOrbit').textContent = 'Restored Circular LEO (550 km via Ion Retro-burn)';
        el('cmpAlteredOrbit').className = 'highlight-green';
      } else {
        el('cmpAlteredOrbit').textContent = 'No deviation detected (Green path nominal)';
        el('cmpAlteredOrbit').className = '';
      }
    }
    if (el('cmpOrbitDelta')) {
      const deltaSpan = el('cmpOrbitDelta').querySelector('.delta-val');
      if (deltaSpan) {
        if (isAttacking && this.currentAttackId === 1) {
          deltaSpan.textContent = 'Δ Alt: -240 km / Δv: +0.42 km/s (CRITICAL DECAY)';
          deltaSpan.className = 'delta-val highlight-red';
        } else {
          deltaSpan.textContent = '0.0 km trajectory perturbation (SAFE)';
          deltaSpan.className = 'delta-val highlight-green';
        }
      }
    }

    // 2. Coordinate Comparison
    if (el('cmpActualCoords')) {
      el('cmpActualCoords').textContent = 'Lat: 28.57° N, Lon: -80.65° W, Alt: 552.4 km';
    }
    if (el('cmpReportedCoords')) {
      if (isAttacking && this.currentAttackId === 2) {
        el('cmpReportedCoords').textContent = 'Lat: -43.18° S, Lon: +124.62° E, Alt: 835.2 km (SPOOFED)';
        el('cmpReportedCoords').className = 'highlight-ghost';
      } else if (isRecovered && this.currentAttackId === 2) {
        el('cmpReportedCoords').textContent = 'Lat: 28.57° N, Lon: -80.65° W (RAIM Validated)';
        el('cmpReportedCoords').className = 'highlight-green';
      } else {
        el('cmpReportedCoords').textContent = 'Lat: 28.57° N, Lon: -80.65° W, Alt: 552.4 km';
        el('cmpReportedCoords').className = '';
      }
    }
    if (el('cmpCoordsDelta')) {
      const deltaSpan = el('cmpCoordsDelta').querySelector('.delta-val');
      if (deltaSpan) {
        if (isAttacking && this.currentAttackId === 2) {
          deltaSpan.textContent = 'Δ Bias: +428.6 km error (FORGED GNSS)';
          deltaSpan.className = 'delta-val highlight-ghost';
        } else {
          deltaSpan.textContent = '0.00 km (Perfect Star Tracker Alignment)';
          deltaSpan.className = 'delta-val highlight-green';
        }
      }
    }

    // 3. Telemetry Integrity
    if (el('cmpGenuineTelem')) {
      el('cmpGenuineTelem').textContent = 'Batt: 94.2%, Temp: 31.4°C, Vel: 7.59 km/s';
    }
    if (el('cmpManipulatedTelem')) {
      if (isAttacking && this.currentAttackId === 3) {
        el('cmpManipulatedTelem').textContent = 'Batt: 4.2% [FALSE], Temp: 118.4°C [CRITICAL], Alt: 720 km [JITTER]';
        el('cmpManipulatedTelem').className = 'highlight-red';
      } else if (isRecovered && this.currentAttackId === 3) {
        el('cmpManipulatedTelem').textContent = 'Batt: 94.2%, Temp: 31.4°C, Vel: 7.59 km/s (HMAC Verified)';
        el('cmpManipulatedTelem').className = 'highlight-green';
      } else {
        el('cmpManipulatedTelem').textContent = 'Batt: 94.2%, Temp: 31.4°C, Vel: 7.59 km/s';
        el('cmpManipulatedTelem').className = '';
      }
    }
    if (el('cmpTelemDelta')) {
      const deltaSpan = el('cmpTelemDelta').querySelector('.delta-val');
      if (deltaSpan) {
        if (isAttacking && this.currentAttackId === 3) {
          deltaSpan.textContent = 'CRC CORRUPTED // 90% DEVIATION DETECTED';
          deltaSpan.className = 'delta-val highlight-red';
        } else {
          deltaSpan.textContent = 'PARITY VALIDATED (CRC-32 OK)';
          deltaSpan.className = 'delta-val highlight-green';
        }
      }
    }

    // 4. Communication Link
    if (el('cmpNominalComm')) {
      el('cmpNominalComm').textContent = 'SNR: 24.8 dB, Loss: 0.00%, Uplink Secure';
    }
    if (el('cmpCurrentComm')) {
      if (isAttacking && this.currentAttackId === 4) {
        el('cmpCurrentComm').textContent = 'SNR: -4.2 dB [NOISE], Loss: 98.40%, LINK DROPPED';
        el('cmpCurrentComm').className = 'highlight-red';
      } else if (isRecovered && this.currentAttackId === 4) {
        el('cmpCurrentComm').textContent = 'SNR: 24.8 dB, Loss: 0.00% (FHSS Anti-Jam Active)';
        el('cmpCurrentComm').className = 'highlight-green';
      } else {
        el('cmpCurrentComm').textContent = 'SNR: 24.8 dB, Loss: 0.00%, Link Active';
        el('cmpCurrentComm').className = '';
      }
    }
    if (el('cmpCommDelta')) {
      const deltaSpan = el('cmpCommDelta').querySelector('.delta-val');
      if (deltaSpan) {
        if (isAttacking && this.currentAttackId === 4) {
          deltaSpan.textContent = '-29.0 dB Jamming Degradation (CARRIER LOST)';
          deltaSpan.className = 'delta-val highlight-red';
        } else {
          deltaSpan.textContent = '0.0 dB Jamming Noise (CLEAN CARRIER)';
          deltaSpan.className = 'delta-val highlight-green';
        }
      }
    }

    // 5. Security Posture (Attack Detected vs Prevented)
    const profile = this.attackProfiles[this.currentAttackId];
    if (el('cmpThreatDetected')) {
      if (isAttacking) {
        el('cmpThreatDetected').textContent = `INTRUSION DETECTED: ${profile.title} (${profile.severity})`;
        el('cmpThreatDetected').className = 'highlight-red';
      } else if (isRecovered) {
        el('cmpThreatDetected').textContent = `INTRUSION LOGGED: ${profile.title} (Quarantined)`;
        el('cmpThreatDetected').className = 'highlight-green';
      } else {
        el('cmpThreatDetected').textContent = 'Continuous Heuristic & Residual Monitoring (0 Flags)';
        el('cmpThreatDetected').className = '';
      }
    }

    if (el('cmpThreatPrevented')) {
      if (isAttacking) {
        el('cmpThreatPrevented').textContent = 'EXPLOIT EXECUTING // MITIGATION PENDING ACTIVATION';
        el('cmpThreatPrevented').className = 'highlight-red';
      } else if (isRecovered) {
        el('cmpThreatPrevented').textContent = `PREVENTED: ${profile.mitigation}`;
        el('cmpThreatPrevented').className = 'highlight-green';
      } else {
        el('cmpThreatPrevented').textContent = 'Autonomous Defense Ready (CCSDS SDLS + MPU Armed)';
        el('cmpThreatPrevented').className = '';
      }
    }

    if (el('cmpDefenseDelta')) {
      const deltaSpan = el('cmpDefenseDelta').querySelector('.delta-val');
      if (deltaSpan) {
        if (isAttacking) {
          deltaSpan.textContent = 'DEFENSE POSTURE: DEFCON 1 (ACTIVE ATTACK)';
          deltaSpan.className = 'delta-val highlight-red';
        } else if (isRecovered) {
          deltaSpan.textContent = 'DEFENSE POSTURE: ATTACK NEUTRALIZED & SECURED';
          deltaSpan.className = 'delta-val highlight-green';
        } else {
          deltaSpan.textContent = 'SYSTEM HARDENED & SECURED (NOMINAL)';
          deltaSpan.className = 'delta-val highlight-green';
        }
      }
    }
  }
}

// Global Attack/Defense Engine
window.attackDefense = new AttackDefenseEngine();
