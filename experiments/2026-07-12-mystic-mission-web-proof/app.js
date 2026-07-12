document.addEventListener('DOMContentLoaded', async () => {
  let storyData = null;

  try {
    const response = await fetch('public-export.mock.json');
    storyData = await response.json();
    populateContent(storyData.experience);
  } catch (err) {
    console.error('Failed to load transmission data:', err);
    return;
  }

  // UI Elements
  const landingSection = document.getElementById('landing');
  const btnEnter = document.getElementById('btn-enter');

  const transmissionView = document.getElementById('transmission-view');
  const revelationView = document.getElementById('revelation-view');

  const freqSlider = document.getElementById('freq-slider');
  const phaseSlider = document.getElementById('phase-slider');
  const meterFill = document.getElementById('meter-fill');

  // Navigation
  btnEnter.addEventListener('click', () => {
    landingSection.classList.remove('active');
    setTimeout(() => {
      landingSection.classList.add('hidden');
      transmissionView.classList.remove('hidden');
      // trigger reflow
      void transmissionView.offsetWidth;
      transmissionView.classList.add('active');
      initPuzzle();
    }, 1000);
  });

  function populateContent(exp) {
    document.getElementById('site-title').textContent = exp.title;
    document.getElementById('site-subtitle').textContent = exp.subtitle;

    const introContainer = document.getElementById('intro-container');
    exp.intro.forEach(line => {
      const p = document.createElement('p');
      p.textContent = line;
      introContainer.appendChild(p);
    });

    document.getElementById('trans-timestamp').textContent = exp.transmission.timestamp;
    const transLines = document.getElementById('trans-lines');
    exp.transmission.lines.forEach(line => {
      const p = document.createElement('p');
      // basic highlighting of missing parts
      if (line.includes('[')) {
        p.innerHTML = line.replace(/\[(.*?)\]/g, '<span class="glitch-text">[$1]</span>');
      } else {
        p.textContent = line;
      }
      transLines.appendChild(p);
    });

    const revText = document.getElementById('revelation-text');
    exp.revelation.forEach(line => {
      const p = document.createElement('p');
      p.textContent = line;
      revText.appendChild(p);
    });

    const gatewaysGrid = document.getElementById('gateways-grid');
    exp.gateways.forEach(gw => {
      const div = document.createElement('div');
      div.className = 'gateway-card';
      div.innerHTML = `
        <h3 class="gateway-name">${gw.name}</h3>
        <p class="gateway-desc">${gw.description}</p>
      `;
      gatewaysGrid.appendChild(div);
    });
  }

  // Puzzle Logic
  // Target values to align the signal
  const TARGET_FREQ = 73;
  const TARGET_PHASE = 42;
  const TOLERANCE = 5;

  function initPuzzle() {
    freqSlider.addEventListener('input', checkSignal);
    phaseSlider.addEventListener('input', checkSignal);
    checkSignal(); // initial state
  }

  function checkSignal() {
    const f = parseInt(freqSlider.value, 10);
    const p = parseInt(phaseSlider.value, 10);

    const fDist = Math.abs(f - TARGET_FREQ);
    const pDist = Math.abs(p - TARGET_PHASE);

    // Max distance is 100 for each, total 200
    const totalDist = fDist + pDist;

    // Calculate signal strength 0-100%
    // If totally off (dist 200), strength 0.
    // If exact (dist 0), strength 100.
    let strength = Math.max(0, 100 - (totalDist / 2));

    meterFill.style.width = `${strength}%`;

    if (strength > 50) {
      meterFill.style.backgroundColor = 'var(--accent-sunlight)';
    } else {
      meterFill.style.backgroundColor = 'var(--accent-damaged)';
    }

    if (fDist <= TOLERANCE && pDist <= TOLERANCE) {
      signalLocked();
    }
  }

  function signalLocked() {
    // Disable sliders
    freqSlider.disabled = true;
    phaseSlider.disabled = true;
    meterFill.style.width = '100%';
    meterFill.style.backgroundColor = 'var(--accent-sunlight)';

    // Smooth transition
    setTimeout(() => {
      transmissionView.classList.remove('active');
      setTimeout(() => {
        transmissionView.classList.add('hidden');
        revelationView.classList.remove('hidden');
        void revelationView.offsetWidth;
        revelationView.classList.add('active');
      }, 1000);
    }, 500);
  }

});