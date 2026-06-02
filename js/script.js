/**
 * ==========================================================================
 * MUTE-WEB ASMR White Noise Web Application (Step 10 - Premium Minimal Layout Integration)
 * ==========================================================================
 * 
 * [역할 및 작동 방식]
 * 본 자바스크립트 파일은 ASMR 백색소음 플레이어의 'feat/new-design' 브랜치 비즈니스 엔진을 담당합니다.
 * 기존의 마스터 볼륨, 커스텀 취침 타이머, 10초 페이드아웃, 설정 서랍, Focus Mode(UI 개별 가리기/복원)를 
 * 온전히 계승하면서, 제미나이와 공동 작업한 웰컴 카드 아이콘 SVG화, 미니멀 초다크 테마 디자인 규격 및 
 * 실시간 제네러티브 파형 드로잉 시스템(HTML5 Canvas)을 에러 없이 안정적으로 융합하였습니다.
 * 
 * 주요 디버깅 내역:
 * 1. [Fix] runCanvasLoop() 내 AppState.currentTheme 미정의 참조 오류를 전역 currentThemeId로 정밀 정정 완료
 * 2. [Fix] LocalStorage 키 명칭을 기존 Step 10 사양인 'mute_settings_${currentThemeId}'로 복구하여 완벽한 호환성 확보
 */

// ==========================================================================
// 0. 테마별 오디오 메타데이터 정의
// ==========================================================================

/**
 * @typedef {Object} SoundInfo
 * @property {string} id - 사운드 고유 식별자 (DOM 생성 및 오디오 바인딩용)
 * @property {string} name - 한글 표시용 이름
 * @property {string} url - CORS가 허용된 직렬 스트리밍용 MP3 음원 주소
 */

/**
 * @typedef {Object} ThemeData
 * @property {string} title - 테마 타이틀
 * @property {string} bgName - 테마의 주 배경 개념
 * @property {string} emoji - 멍 공간에 매핑할 중앙 비주얼 이모지
 * @property {string} visualText - 멍 공간에 매핑할 하단 텍스트 설명
 * @property {SoundInfo[]} sounds - 해당 테마가 가지는 3가지 상세 백색소음 목록
 */

/** @type {Object.<string, ThemeData>} */
const themeData = {
  nature: {
    title: "NATURE",
    bgName: "RAINY CAMPFIRE",
    emoji: "🌳",
    visualText: "나뭇잎에 떨어지는 부드러운 빗소리와 화로의 조용한 불꽃",
    sounds: [
      { id: 'rain', name: '🌧️ Pebble Rain', url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/rain.mp3' },
      { id: 'campfire', name: '🔥 Birch Fire', url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/campfire.mp3' },
      { id: 'stream', name: '🏞️ Fresh Stream', url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/river.mp3' }
    ]
  },
  fantasy: {
    title: "FANTASY",
    bgName: "ETHER MARKET",
    emoji: "🔮",
    visualText: "시간이 정지된 공중 마법 상점의 오묘하고 신비로운 선율",
    sounds: [
      { id: 'fantasy_melody', name: '✨ Star Choir', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { id: 'clock', name: '🕰️ Glass Chimes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      { id: 'potion', name: '🧪 Mana Bubbler', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
    ]
  },
  horror: {
    title: "HORROR",
    bgName: "ABANDONED MANOR",
    emoji: "👻",
    visualText: "짙은 안개 속 버려진 고성의 서늘한 돌풍과 삐걱임",
    sounds: [
      { id: 'spooky_wind', name: '💨 Mist Gale', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
      { id: 'creaky_door', name: '🚪 Timber Creak', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
      { id: 'footstep', name: '👣 Heartbeat', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
    ]
  }
};

// ==========================================================================
// 1. 전역 상태 관리
// ==========================================================================

/**
 * @typedef {Object} AsmrSound
 * @property {string} id - 고유 식별자 (HTML 요소 매칭용)
 * @property {string} name - 사용자에게 표시될 이름
 * @property {string} url - 오디오 스트리밍용 MP3 주소
 * @property {HTMLAudioElement|null} audioInstance - 실제 재생을 담당할 오디오 객체
 * @property {string} status - 현재 재생 상태 ('준비 대기 중', '준비 완료', '재생 중', '정지됨')
 * @property {number} volume - 개별 지정 볼륨 크기 (0.0 ~ 1.0, 기본값: 0.5)
 * @property {boolean} isPlaying - 개별 ON/OFF 상태 (기본값: false)
 */

/** @type {AsmrSound[]} */
let asmrSounds = []; 
let currentThemeId = ''; 
let masterVolume = 1.0; 
let timerSecondsRemaining = 0; 
let countdownIntervalId = null; 
let isFadingOut = false; 

// ==========================================================================
// 2. 화면 전환 및 동적 DOM 렌더링 모듈
// ==========================================================================

/**
 * 선택된 테마 정보를 바탕으로 오디오 URL 주소를 갈아끼우고 
 * 멍 타겟 명칭 및 믹서 라벨을 실시간 동적 매핑하는 핵심 셋업 함수
 * 
 * @param {string} themeId - 셋업할 테마 ID
 */
function setupTheme(themeId) {
  const themeInfo = themeData[themeId];
  if (!themeInfo) return;

  currentThemeId = themeId;

  asmrSounds = themeInfo.sounds.map(sound => ({
    id: sound.id,
    name: sound.name,
    url: sound.url,
    audioInstance: null,
    status: '대기 중',
    volume: 0.5,
    isPlaying: false
  }));

  const appTitle = document.getElementById('app-title');
  const currentBgName = document.getElementById('current-bg-name');
  const visualText = document.getElementById('theme-visual-text');
  const drawerHeading = document.getElementById('drawer-heading');

  if (appTitle) appTitle.textContent = `MUTE [${themeInfo.title}]`;
  if (currentBgName) currentBgName.textContent = themeInfo.bgName;
  if (visualText) visualText.textContent = themeInfo.visualText;
  if (drawerHeading) drawerHeading.textContent = `${themeInfo.title} LAYERS`;

  renderAudioControls();
  initializeAudioSources();
  setupAudioEventListeners();

  // 🎨 [디자인 알파: 테마별 제네러티브 캔버스 아트 구동 연동]
  initCanvasEffect(themeId);
}

/**
 * 가동 중인 오디오 엔진 및 취침 예약 타이머를 안전하고 깨끗하게 정지시키는 공통 리셋 모듈
 */
function resetEngine() {
  stopAllSounds();
  handleCancelTimer();
  asmrSounds.forEach((sound) => {
    if (sound.audioInstance) {
      sound.audioInstance.pause();
      sound.audioInstance = null;
    }
  });
  asmrSounds = [];
  cancelAnimationFrame(canvasAnimId); // 캔버스 루프 애니메이션 일시 정지
}

/**
 * 유저가 첫 화면에서 특정 테마를 선택했을 때 동작하는 이벤트 트리거 및 화면 전환 처리기
 * 
 * @param {string} themeId - 선택된 테마 식별자 ('nature', 'fantasy', 'horror')
 */
function selectTheme(themeId) {
  if (!themeData[themeId]) return;
  resetEngine();
  setupTheme(themeId);
  loadSettings();
  restoreAllUiSegments();

  document.getElementById('theme-select-page').style.display = 'none';
  document.getElementById('mixer-page').style.display = 'flex';
}

/**
 * 메인 믹서 화면에서 좌측 상단 복귀 버튼 클릭 시 
 * 작동 중인 모든 리소스를 안전하게 강제 자동 저장한 후 초기 테마 선택 화면으로 복귀합니다.
 */
function goToThemeSelectPage() {
  saveSettings();
  resetEngine();
  restoreAllUiSegments();
  currentThemeId = '';

  document.getElementById('theme-select-page').style.display = 'flex';
  document.getElementById('mixer-page').style.display = 'none';
  toggleSettingsDrawer(false);
}

/**
 * 선택된 테마의 sounds 배열 데이터를 바탕으로 
 * 설정 서랍 내의 `#sounds-list` 영역에 개별 오디오 제어 UI 엘리먼트들을 동적으로 주입합니다.
 */
function renderAudioControls() {
  const soundsList = document.getElementById('sounds-list');
  if (!soundsList) return;
  soundsList.innerHTML = '';

  asmrSounds.forEach((sound) => {
    const li = document.createElement('li');
    li.className = 'audio-control-item';
    li.id = `item-${sound.id}`;
    li.innerHTML = `
      <span class="sound-label" id="label-${sound.id}">${sound.name}</span>
      <div class="audio-control-row">
        <input type="range" class="volume-slider" id="volume-${sound.id}" min="0" max="1" step="0.01" value="${sound.volume}">
        <button type="button" class="btn-toggle-switch" id="btn-switch-${sound.id}">OFF</button>
        <span class="sound-status" id="status-${sound.id}" data-status="${sound.status}">${sound.status}</span>
      </div>
    `;
    soundsList.appendChild(li);
  });
}

/**
 * 각 오디오 소스 파일의 인스턴스를 생성하고 기본 루프 및 볼륨 설정을 구성합니다.
 */
function initializeAudioSources() {
  asmrSounds.forEach((sound) => {
    const audio = new Audio(sound.url);
    audio.loop = true;
    audio.volume = getCalculatedVolume(sound);
    sound.audioInstance = audio;

    audio.addEventListener('canplaythrough', () => {
      if (sound.status === '대기 중') {
        sound.status = '준비 완료';
        renderStatus();
      }
    });
    audio.addEventListener('error', () => {
      sound.status = 'FAIL';
      renderStatus();
    });
  });
  renderStatus();
}

// ==========================================================================
// 4. LocalStorage 유저 설정 저장 및 로드 모듈 (Step 10 규격 하위호환 복원)
// ==========================================================================

/**
 * 테마별 개별 독립 Key 기반의 LocalStorage 자동 저장 함수
 */
function saveSettings() {
  if (!currentThemeId) return;
  try {
    // [Fix] 기존 Step 10 저장 방식과의 하위 호환성을 위해 키 명칭을 원래대로 복구
    const storageKey = `mute_settings_${currentThemeId}`;
    const userSettings = {
      masterVolume: masterVolume,
      sounds: asmrSounds.map((sound) => ({ id: sound.id, volume: sound.volume, isPlaying: sound.isPlaying }))
    };
    localStorage.setItem(storageKey, JSON.stringify(userSettings));
    console.log(`[설정 자동 저장] '${storageKey}' 격리 키에 유저 설정이 안전하게 저장되었습니다.`);
  } catch (error) { console.error(error); }
}

/**
 * 격리 키 로드 및 미경험 유저 기본값(볼륨 0.5, 모두 ON) 예외 처리 로드 함수
 */
function loadSettings() {
  if (!currentThemeId) return;
  try {
    // [Fix] 기존 Step 10 저장 방식과의 하위 호환성을 위해 키 명칭을 원래대로 복구
    const storageKey = `mute_settings_${currentThemeId}`;
    const rawData = localStorage.getItem(storageKey);
    
    if (!rawData) {
      console.log(`[신규 테마 발견] '${storageKey}' 키의 기존 기록이 없어 기본값(볼륨 0.5, 모두 ON)으로 초기화합니다.`);
      masterVolume = 1.0;
      const masterSlider = document.getElementById('master-volume');
      if (masterSlider) masterSlider.value = 1.0;

      asmrSounds.forEach((sound) => {
        sound.volume = 0.5; sound.isPlaying = true;
        const sliderElement = document.getElementById(`volume-${sound.id}`);
        if (sliderElement) sliderElement.value = 0.5;
        if (sound.audioInstance) {
          sound.audioInstance.volume = getCalculatedVolume(sound);
          sound.audioInstance.play()
            .then(() => { sound.status = '재생 중'; renderStatus(); })
            .catch(() => { sound.status = '준비 완료'; renderStatus(); });
        }
      });
      return;
    }

    const themeSettings = JSON.parse(rawData);
    if (typeof themeSettings.masterVolume === 'number') {
      masterVolume = themeSettings.masterVolume;
      const masterSlider = document.getElementById('master-volume');
      if (masterSlider) masterSlider.value = masterVolume;
    }

    if (Array.isArray(themeSettings.sounds)) {
      themeSettings.sounds.forEach((savedSound) => {
        const sound = asmrSounds.find((s) => s.id === savedSound.id);
        if (sound) {
          sound.volume = savedSound.volume; sound.isPlaying = savedSound.isPlaying;
          const sliderElement = document.getElementById(`volume-${sound.id}`);
          if (sliderElement) sliderElement.value = sound.volume;
          if (sound.audioInstance) {
            sound.audioInstance.volume = getCalculatedVolume(sound);
            if (sound.isPlaying) {
              sound.audioInstance.play()
                .then(() => { sound.status = '재생 중'; renderStatus(); })
                .catch(() => { sound.status = '준비 완료'; renderStatus(); });
            } else { sound.status = '준비 완료'; }
          }
        }
      });
    }
    renderStatus();
    console.log(`[설정 복원 완료] '${storageKey}' 키로부터 기존 설정을 동기화하였습니다.`);
  } catch (error) { console.error(error); }
}

// ==========================================================================
// 5. 볼륨 연산 엔진 함수
// ==========================================================================

/**
 * 수학적 볼륨 공식을 기반으로 개별 사운드의 실제 출력 오디오 볼륨을 계산합니다.
 */
function getCalculatedVolume(sound) {
  let fadeRatio = 1.0;
  if (isFadingOut) fadeRatio = Math.max(0, Math.min(1, timerSecondsRemaining / 10));
  return Math.max(0, Math.min(1, sound.volume * masterVolume * fadeRatio));
}

function syncAllAudioVolumes() {
  asmrSounds.forEach((sound) => { if (sound.audioInstance) sound.audioInstance.volume = getCalculatedVolume(sound); });
}

// ==========================================================================
// 6. UI 렌더링 함수
// ==========================================================================

/**
 * 현재 asmrSounds 배열에 저장된 상태를 화면의 텍스트 라벨과 스위치 텍스트에 반영합니다.
 */
function renderStatus() {
  asmrSounds.forEach((sound) => {
    const labelElement = document.getElementById(`status-${sound.id}`);
    if (labelElement) {
      labelElement.textContent = sound.status === '재생 중' ? 'RUNNING' : sound.status;
      labelElement.setAttribute('data-status', sound.status);
    }
    const switchBtn = document.getElementById(`btn-switch-${sound.id}`);
    if (switchBtn) {
      switchBtn.textContent = sound.isPlaying ? 'ON' : 'OFF';
      if (sound.isPlaying) switchBtn.classList.add('active-on');
      else switchBtn.classList.remove('active-on');
    }
  });
}

// ==========================================================================
// 7. 오디오 제어 핵심 함수
// ==========================================================================

function playAllSounds() {
  if (isFadingOut) resetFadeOutVolume();
  document.getElementById('btn-play-all').classList.add('active-play');
  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    if (!audio) return;
    audio.volume = getCalculatedVolume(sound);
    audio.play()
      .then(() => { sound.status = '재생 중'; sound.isPlaying = true; renderStatus(); saveSettings(); })
      .catch(() => {});
  });
}

function stopAllSounds() {
  document.getElementById('btn-play-all').classList.remove('active-play');
  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    if (!audio) return;
    audio.pause(); audio.currentTime = 0; sound.isPlaying = false; sound.status = '정지됨';
  });
  resetFadeOutVolume(); renderStatus(); saveSettings();
}

function toggleSoundSwitch(soundId) {
  const sound = asmrSounds.find(s => s.id === soundId);
  if (!sound || !sound.audioInstance) return;
  const audio = sound.audioInstance;

  if (isFadingOut) resetFadeOutVolume();

  if (sound.isPlaying) {
    audio.pause(); sound.isPlaying = false; sound.status = '정지됨'; saveSettings();
  } else {
    audio.volume = getCalculatedVolume(sound); 
    audio.play()
      .then(() => { sound.isPlaying = true; sound.status = '재생 중'; renderStatus(); saveSettings(); })
      .catch(() => {});
  }
  renderStatus();
}

function updateVolume(soundId, newVolume) {
  const sound = asmrSounds.find(s => s.id === soundId);
  if (sound) {
    sound.volume = newVolume;
    if (sound.audioInstance) sound.audioInstance.volume = getCalculatedVolume(sound);
    saveSettings();
  }
}

function updateMasterVolume(newMasterVolume) {
  masterVolume = newMasterVolume;
  syncAllAudioVolumes();
  saveSettings();
}

// ==========================================================================
// 8. 직접 입력 방식 오디오 타이머 로직
// ==========================================================================

function handleStartTimer() {
  const timerInput = document.getElementById('timer-input');
  if (!timerInput) return;
  const valueString = timerInput.value.trim();
  if (valueString === '') return;
  const minutes = parseInt(valueString, 10);
  if (isNaN(minutes) || minutes <= 0) return;
  startAudioTimer(minutes);
}

function startAudioTimer(minutes) {
  clearAllIntervals(); resetFadeOutVolume();
  setTimerControlsDisabled(true);
  timerSecondsRemaining = minutes * 60;
  updateTimerDisplay(formatTime(timerSecondsRemaining));

  countdownIntervalId = setInterval(() => {
    timerSecondsRemaining--;
    updateTimerDisplay(formatTime(timerSecondsRemaining));
    if (timerSecondsRemaining <= 10 && timerSecondsRemaining > 0) applyFadeOutEffect();
    if (timerSecondsRemaining <= 0) {
      clearAllIntervals(); stopAllSounds();
      setTimerControlsDisabled(false);
      updateTimerDisplay('LIMIT');
    }
  }, 1000);
}

function handleCancelTimer() {
  clearAllIntervals(); resetFadeOutVolume();
  setTimerControlsDisabled(false);
  const timerInput = document.getElementById('timer-input');
  if (timerInput) timerInput.value = '';
  updateTimerDisplay('OFF');
}

function setTimerControlsDisabled(disabled) {
  const timerInput = document.getElementById('timer-input');
  const timerStartBtn = document.getElementById('btn-timer-start');
  if (timerInput) timerInput.disabled = disabled;
  if (timerStartBtn) timerStartBtn.disabled = disabled;
}

function applyFadeOutEffect() { isFadingOut = true; syncAllAudioVolumes(); }
function resetFadeOutVolume() { isFadingOut = false; syncAllAudioVolumes(); }
function clearAllIntervals() { if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; } }

function formatTime(totalSeconds) {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function updateTimerDisplay(text) {
  const displayElement = document.getElementById('timer-display');
  if (displayElement) displayElement.textContent = `TIME REMAINING: ${text}`;
}

function toggleSettingsDrawer(isOpen) {
  const drawerElement = document.getElementById('settings-drawer');
  if (!drawerElement) return;
  if (typeof isOpen === 'boolean') {
    if (isOpen) drawerElement.classList.add('active');
    else drawerElement.classList.remove('active');
  } else { drawerElement.classList.toggle('active'); }
}

// ==========================================================================
// 9. Focus Mode (UI 개별 가리기 및 일괄 복구) 제어
// ==========================================================================

function hideUiSegment(targetId) {
  if (targetId === 'header-buttons') {
    document.getElementById('btn-theme-back').classList.add('ui-hidden-fade');
    document.getElementById('btn-drawer-toggle').classList.add('ui-hidden-fade');
    document.getElementById('btn-hide-header').classList.add('ui-hidden-fade');
  } else {
    const targetElement = document.getElementById(targetId);
    if (targetElement) targetElement.classList.add('ui-hidden-fade');
  }
  const restoreBtn = document.getElementById('btn-ui-restore');
  if (restoreBtn) restoreBtn.style.display = 'inline-block';
}

function restoreAllUiSegments() {
  const topControls = document.getElementById('top-controls');
  const timerSection = document.getElementById('timer-section');
  if (topControls) topControls.classList.remove('ui-hidden-fade');
  if (timerSection) timerSection.classList.remove('ui-hidden-fade');

  document.getElementById('btn-theme-back').classList.remove('ui-hidden-fade');
  document.getElementById('btn-drawer-toggle').classList.remove('ui-hidden-fade');
  document.getElementById('btn-hide-header').classList.remove('ui-hidden-fade');

  const restoreBtn = document.getElementById('btn-ui-restore');
  if (restoreBtn) restoreBtn.style.display = 'none';
}

// ==========================================================================
// 10. 🎨 [디자인 알파] 제네러티브 노이즈 라인 웨이브 드로잉 시스템 (CORS / 런타임 오류 디버깅 완료)
// ==========================================================================
const canvas = document.getElementById('mung-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 280; canvas.height = 240;

let canvasAnimId = null;
let timeRotation = 0;

/**
 * 테마에 최적화된 노이즈 아트 캔버스 루프 시각화를 개시합니다.
 */
function initCanvasEffect(themeId) {
  cancelAnimationFrame(canvasAnimId);
  runCanvasLoop();
}

/**
 * [Step 10 Fix] AppState가 정의되지 않아 브라우저가 정지하던 치명적인 런타임 버그를 
 * 전역 변수인 currentThemeId 매핑으로 수정하여 안전하고 완벽하게 파형 애니메이션을 요동치게 합니다.
 */
function runCanvasLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  timeRotation += 0.012;
  ctx.lineWidth = 1.0;
  
  if (currentThemeId === 'nature') {
    // 🌳 자연: 잔잔하게 중첩되어 요동치는 3가닥 유기적 호흡선
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(250, 250, 249, ${0.12 - i * 0.03})`;
      for (let x = 0; x < canvas.width; x++) {
        const wave = Math.sin(x * 0.02 + timeRotation + i * 1.2) * Math.cos(x * 0.006 - timeRotation * 0.4);
        const y = canvas.height / 2 + wave * (40 + i * 12);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (currentThemeId === 'fantasy') {
    // 🔮 판타지: 기하학적으로 미세하게 궤도를 회전하는 4중 동심 오라 원선
    ctx.strokeStyle = 'rgba(250, 250, 249, 0.06)';
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      const radius = 35 + r * 22 + Math.sin(timeRotation + r) * 5;
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.fillStyle = 'rgba(250, 250, 249, 0.25)';
      const oX = canvas.width / 2 + Math.cos(timeRotation + r * 1.3) * radius;
      const oY = canvas.height / 2 + Math.sin(timeRotation + r * 1.3) * radius;
      ctx.arc(oX, oY, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // 👻 공포: 중앙에서 날카롭게 심장박동처럼 튀는 노이즈 글리치 맥박선
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.12)';
    for (let x = 0; x < canvas.width; x++) {
      let pulseNoise = 0;
      if (x > 90 && x < 190) {
        pulseNoise = Math.sin(x * 0.25 + timeRotation * 10) * Math.cos(x * 0.07) * 16;
      }
      const y = canvas.height / 2 + pulseNoise + (Math.random() - 0.5) * 1.2;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  canvasAnimId = requestAnimationFrame(runCanvasLoop);
}

// ==========================================================================
// 11. 이벤트 바인딩 및 어플리케이션 진입점
// ==========================================================================

function setupAudioEventListeners() {
  asmrSounds.forEach((sound) => {
    const sliderElement = document.getElementById(`volume-${sound.id}`);
    if (sliderElement) {
      sliderElement.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        updateVolume(sound.id, value);
      });
    }

    const switchButton = document.getElementById(`btn-switch-${sound.id}`);
    if (switchButton) {
      switchButton.addEventListener('click', () => {
        toggleSoundSwitch(sound.id);
      });
    }
  });
}

function setupEventListeners() {
  document.getElementById('btn-theme-nature').addEventListener('click', () => selectTheme('nature'));
  document.getElementById('btn-theme-fantasy').addEventListener('click', () => selectTheme('fantasy'));
  document.getElementById('btn-theme-horror').addEventListener('click', () => selectTheme('horror'));
  document.getElementById('btn-theme-back').addEventListener('click', goToThemeSelectPage);
  document.getElementById('btn-play-all').addEventListener('click', playAllSounds);
  document.getElementById('btn-stop-all').addEventListener('click', stopAllSounds);

  document.getElementById('master-volume').addEventListener('input', (e) => {
    updateMasterVolume(parseFloat(e.target.value));
  });

  document.getElementById('btn-timer-start').addEventListener('click', handleStartTimer);
  document.getElementById('btn-timer-cancel').addEventListener('click', handleCancelTimer);
  document.getElementById('btn-drawer-toggle').addEventListener('click', () => toggleSettingsDrawer(true));
  document.getElementById('btn-drawer-close').addEventListener('click', () => toggleSettingsDrawer(false));

  // Focus Mode 가리기 이벤트 위임 바인딩
  document.querySelectorAll('.btn-ui-hide').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideUiSegment(btn.getAttribute('data-target'));
    });
  });

  document.getElementById('visual-space-zone').addEventListener('click', () => restoreAllUiSegments());
  document.getElementById('btn-ui-restore').addEventListener('click', (e) => {
    e.stopPropagation();
    restoreAllUiSegments();
  });
}

document.addEventListener('DOMContentLoaded', () => { setupEventListeners(); });