/* ==========================================================================
   MUSE-WEB Interactive Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Setup Dynamic Background Blobs ---
  const blobs = document.querySelectorAll('.blob');
  document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const moveX = (clientX - window.innerWidth / 2) * 0.05;
    const moveY = (clientY - window.innerHeight / 2) * 0.05;
    
    blobs.forEach((blob, idx) => {
      const factor = (idx + 1) * 0.5;
      blob.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
    });
  });

  // --- Dynamic Audio Visualizer Simulation ---
  const playBtn = document.getElementById('play-btn');
  const playIcon = document.getElementById('play-icon');
  const visualizer = document.getElementById('visualizer');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  
  let isPlaying = false;
  let visualizerInterval = null;
  const totalBars = 36;

  // Initialize visualizer bars
  for (let i = 0; i < totalBars; i++) {
    const bar = document.createElement('div');
    bar.classList.add('bar');
    visualizer.appendChild(bar);
  }

  const bars = document.querySelectorAll('.bar');

  function startVisualizer() {
    visualizerInterval = setInterval(() => {
      bars.forEach(bar => {
        const height = Math.random() * 96 + 4; // Height from 4px to 100px
        bar.style.height = `${height}px`;
      });
    }, 100);
  }

  function stopVisualizer() {
    clearInterval(visualizerInterval);
    bars.forEach(bar => {
      bar.style.height = '4px';
    });
  }

  const playlist = [
    { title: "Synthetic Inspiration", artist: "MUSE Synth" },
    { title: "Quantum Dreams", artist: "Aether Echo" },
    { title: "Nebula Symphonia", artist: "Stellar Orchestral" }
  ];
  let currentTrackIdx = 0;

  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      playIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      `;
      startVisualizer();
    } else {
      playIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="8,5 19,12 8,19" />
        </svg>
      `;
      stopVisualizer();
    }
  }

  playBtn.addEventListener('click', togglePlay);

  // Next Track Simulation
  const nextBtn = document.getElementById('next-btn');
  nextBtn.addEventListener('click', () => {
    currentTrackIdx = (currentTrackIdx + 1) % playlist.length;
    trackTitle.textContent = playlist[currentTrackIdx].title;
    trackArtist.textContent = playlist[currentTrackIdx].artist;
    
    if (isPlaying) {
      stopVisualizer();
      startVisualizer();
    }
  });

  // Previous Track Simulation
  const prevBtn = document.getElementById('prev-btn');
  prevBtn.addEventListener('click', () => {
    currentTrackIdx = (currentTrackIdx - 1 + playlist.length) % playlist.length;
    trackTitle.textContent = playlist[currentTrackIdx].title;
    trackArtist.textContent = playlist[currentTrackIdx].artist;
    
    if (isPlaying) {
      stopVisualizer();
      startVisualizer();
    }
  });


  // --- Creative Muse Quote Generator ---
  const museQuotes = [
    { text: "“Creativity takes courage.”", author: "Henri Matisse" },
    { text: "“Art washes away from the soul the dust of everyday life.”", author: "Pablo Picasso" },
    { text: "“The essence of all beautiful art, all great art, is gratitude.”", author: "Friedrich Nietzsche" },
    { text: "“To be creative means to be in love with life.”", author: "Osho" },
    { text: "“We do not need more copyists. We need creators who speak to our time.”", author: "The Muse" }
  ];

  const quoteEl = document.getElementById('quote-text');
  const authorEl = document.getElementById('quote-author');
  const generateBtn = document.getElementById('generate-quote-btn');

  function generateQuote() {
    quoteEl.style.opacity = 0;
    authorEl.style.opacity = 0;

    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * museQuotes.length);
      quoteEl.textContent = museQuotes[randomIdx].text;
      authorEl.textContent = `- ${museQuotes[randomIdx].author}`;
      
      quoteEl.style.transition = 'opacity 0.5s ease';
      authorEl.style.transition = 'opacity 0.5s ease';
      quoteEl.style.opacity = 1;
      authorEl.style.opacity = 1;
    }, 300);
  }

  generateBtn.addEventListener('click', generateQuote);
  
  // Set initial quote
  generateQuote();
});
