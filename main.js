/**
 * SAT-DEFENSE // Main Dashboard Orchestration & Event Controller
 * Integrates simulation, telemetry, audio, cyber operations, and presentation modes.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mission Clocks (UTC & Mission Elapsed Time)
  const utcClockEl = document.getElementById('utcClock');
  const missionElapsedEl = document.getElementById('missionElapsed');
  const simStartMs = Date.now();

  function updateClocks() {
    const now = new Date();
    // Format UTC
    const pad = (n) => String(n).padStart(2, '0');
    const utcStr = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;
    if (utcClockEl) utcClockEl.textContent = utcStr;

    // Mission Elapsed
    const elapsedSec = Math.floor((Date.now() - simStartMs) / 1000);
    const hrs = pad(Math.floor(elapsedSec / 3600));
    const mins = pad(Math.floor((elapsedSec % 3600) / 60));
    const secs = pad(elapsedSec % 60);
    if (missionElapsedEl) missionElapsedEl.textContent = `T+ ${hrs}:${mins}:${secs}`;
  }
  setInterval(updateClocks, 1000);
  updateClocks();

  // 2. Audio Effects Toggle Button
  const btnAudioToggle = document.getElementById('btnAudioToggle');
  const audioIcon = document.getElementById('audioIcon');
  if (btnAudioToggle) {
    btnAudioToggle.addEventListener('click', () => {
      if (window.soundFX) {
        const isMuted = window.soundFX.toggleMute();
        if (audioIcon) {
          audioIcon.textContent = isMuted ? '🔇' : '🔊';
        }
        btnAudioToggle.classList.toggle('muted', isMuted);
        if (!isMuted) {
          window.soundFX.playBeep(900, 0.05);
        }
      }
    });
  }

  // 3. Cyberattack Selection Dropdown
  const attackSelect = document.getElementById('attackSelect');
  if (attackSelect) {
    attackSelect.addEventListener('change', (e) => {
      if (window.attackDefense) {
        window.attackDefense.selectAttack(e.target.value);
      }
    });
  }

  // 4. Action Buttons (Launch Attack, Activate Defense, Reset to Normal)
  const btnLaunchAttack = document.getElementById('btnLaunchAttack');
  if (btnLaunchAttack) {
    btnLaunchAttack.addEventListener('click', () => {
      if (window.attackDefense) {
        window.attackDefense.launchAttack();
      }
    });
  }

  const btnActivateDefense = document.getElementById('btnActivateDefense');
  if (btnActivateDefense) {
    btnActivateDefense.addEventListener('click', () => {
      if (window.attackDefense) {
        window.attackDefense.activateDefense();
      }
    });
  }

  const btnResetNormal = document.getElementById('btnResetNormal');
  if (btnResetNormal) {
    btnResetNormal.addEventListener('click', () => {
      if (window.attackDefense) {
        window.attackDefense.resetToNormal();
      }
    });
  }

  // 5. Simulation Transport Controls
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const playPauseText = document.getElementById('playPauseText');
  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', () => {
      if (window.orbitalSim) {
        const isRunning = window.orbitalSim.togglePlayPause();
        if (playPauseIcon) playPauseIcon.textContent = isRunning ? '⏸️' : '▶️';
        if (playPauseText) playPauseText.textContent = isRunning ? 'Pause' : 'Resume';
        if (window.soundFX) window.soundFX.playBeep(700, 0.03);
      }
    });
  }

  const btnResetSim = document.getElementById('btnResetSim');
  if (btnResetSim) {
    btnResetSim.addEventListener('click', () => {
      if (window.orbitalSim) {
        window.orbitalSim.resetSimulation();
        if (window.soundFX) window.soundFX.playBeep(500, 0.04);
      }
    });
  }

  // Speed Buttons (1x, 2x, 5x)
  const speedButtons = document.querySelectorAll('.btn-speed');
  speedButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      speedButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const speed = parseFloat(btn.dataset.speed);
      if (window.orbitalSim) {
        window.orbitalSim.setSpeed(speed);
        if (window.soundFX) window.soundFX.playBeep(800 + speed * 100, 0.03);
      }
    });
  });

  // Camera Mode Buttons (orbital, earth, satellite)
  const cameraButtons = document.querySelectorAll('.btn-camera');
  cameraButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      cameraButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cam = btn.dataset.cam;
      if (window.orbitalSim) {
        window.orbitalSim.setCameraMode(cam);
        if (window.soundFX) window.soundFX.playBeep(1000, 0.03);
      }
    });
  });

  // Toggle RF Beam & Deep Space Stars
  const toggleBeam = document.getElementById('toggleBeam');
  if (toggleBeam) {
    toggleBeam.addEventListener('change', (e) => {
      if (window.orbitalSim) window.orbitalSim.showBeam = e.target.checked;
    });
  }

  const toggleStars = document.getElementById('toggleStars');
  if (toggleStars) {
    toggleStars.addEventListener('change', (e) => {
      if (window.orbitalSim) window.orbitalSim.showStars = e.target.checked;
    });
  }

  // 6. Chart Stream Selector (alt, vel, snr)
  const chartButtons = document.querySelectorAll('.btn-chart-tag');
  chartButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      chartButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const stream = btn.dataset.chart;
      if (window.telemetry) {
        window.telemetry.setChartStream(stream);
        if (window.soundFX) window.soundFX.playBeep(1100, 0.02);
      }
    });
  });

  // 7. Defense Log Filter Chips & Clear Action
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      if (window.attackDefense) {
        window.attackDefense.setLogFilter(filter);
      }
    });
  });

  const btnClearLogs = document.getElementById('btnClearLogs');
  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', () => {
      if (window.attackDefense) {
        window.attackDefense.clearLogs();
      }
    });
  }

  // 8. Bottom Deck Tabs Switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(targetId) {
    tabButtons.forEach((btn) => {
      if (btn.dataset.tab === targetId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    tabContents.forEach((tab) => {
      if (tab.id === targetId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
      if (window.soundFX) window.soundFX.playBeep(900, 0.03);
    });
  });

  // 9. Viva / Presentation Guide Trigger in Header
  const btnDemoGuide = document.getElementById('btnDemoGuide');
  if (btnDemoGuide) {
    btnDemoGuide.addEventListener('click', () => {
      switchTab('tabVivaGuide');
      const footer = document.querySelector('.dashboard-footer');
      if (footer) {
        footer.scrollIntoView({ behavior: 'smooth' });
      }
      if (window.soundFX) window.soundFX.playBeep(1200, 0.05);
    });
  }

  // 10. Interactive 5-Step Viva Presentation Runner
  const btnAutoDemo = document.getElementById('btnAutoDemo');
  const vivaGuidedBar = document.getElementById('vivaGuidedBar');
  const btnCloseGuided = document.getElementById('btnCloseGuided');
  const guidedPromptText = document.getElementById('guidedPromptText');
  const stepButtons = document.querySelectorAll('.step-btn[data-step]');
  const btnAutoStepNext = document.getElementById('btnAutoStepNext');

  let currentGuidedStep = 1;

  const stepPrompts = {
    1: '<strong>Step 1 (1 Mark): Nominal Baseline</strong> — Demonstrating nominal circular LEO orbit (green ellipse, 550 km altitude, 7.59 km/s orbital speed) and 100% healthy telemetry.',
    2: '<strong>Step 2 (1 Mark): Trigger Cyberattack</strong> — Rogue thruster hijack burn launched! Note the red altered decay trajectory, thruster fire, and critical warnings.',
    3: '<strong>Step 3 (1 Mark): Anomaly Logs & Detection</strong> — Inspecting Autonomous Kalman Filter IDS residual spike (1.84 > 0.85 threshold) and unverified telecommand frame.',
    4: '<strong>Step 4 (1 Mark): Deploy Cyber Defense</strong> — Engaging autonomous cyber defense: CCSDS SDLS cryptographic re-authentication, ion thruster retro-burn, and shield dome.',
    5: '<strong>Step 5 (1 Mark): Before & After Verification</strong> — Demonstrating Before-and-After matrix: Orbit, Coordinates, Telemetry, RF Link, and Threat Mitigation proving full recovery.'
  };

  function executeGuidedStep(stepNum) {
    currentGuidedStep = stepNum;
    stepButtons.forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.step, 10) === stepNum);
    });

    if (guidedPromptText) {
      guidedPromptText.innerHTML = stepPrompts[stepNum] || '';
    }

    if (stepNum === 1) {
      if (window.attackDefense) window.attackDefense.resetToNormal();
      const viewport = document.querySelector('.simulation-viewport-container');
      if (viewport) viewport.scrollIntoView({ behavior: 'smooth' });
    } else if (stepNum === 2) {
      if (window.attackDefense) {
        const select = document.getElementById('attackSelect');
        if (select) select.value = "1";
        window.attackDefense.selectAttack(1);
        window.attackDefense.launchAttack();
      }
      const viewport = document.querySelector('.simulation-viewport-container');
      if (viewport) viewport.scrollIntoView({ behavior: 'smooth' });
    } else if (stepNum === 3) {
      switchTab('tabSubsystems');
      const footer = document.querySelector('.dashboard-footer');
      if (footer) footer.scrollIntoView({ behavior: 'smooth' });
    } else if (stepNum === 4) {
      if (window.attackDefense) window.attackDefense.activateDefense();
      const viewport = document.querySelector('.simulation-viewport-container');
      if (viewport) viewport.scrollIntoView({ behavior: 'smooth' });
    } else if (stepNum === 5) {
      switchTab('tabComparison');
      const footer = document.querySelector('.dashboard-footer');
      if (footer) footer.scrollIntoView({ behavior: 'smooth' });
    }

    if (window.soundFX) window.soundFX.playBeep(900 + stepNum * 80, 0.04);
  }

  if (btnAutoDemo && vivaGuidedBar) {
    btnAutoDemo.addEventListener('click', () => {
      vivaGuidedBar.classList.toggle('guided-hidden');
      if (!vivaGuidedBar.classList.contains('guided-hidden')) {
        executeGuidedStep(1);
      }
    });
  }

  if (btnCloseGuided && vivaGuidedBar) {
    btnCloseGuided.addEventListener('click', () => {
      vivaGuidedBar.classList.add('guided-hidden');
    });
  }

  stepButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.dataset.step, 10);
      executeGuidedStep(step);
    });
  });

  if (btnAutoStepNext) {
    btnAutoStepNext.addEventListener('click', () => {
      const nextStep = currentGuidedStep >= 5 ? 1 : currentGuidedStep + 1;
      executeGuidedStep(nextStep);
    });
  }

  // Log Ready
  console.log('🛰️ SAT-DEFENSE Dashboard initialized and operational.');
});
