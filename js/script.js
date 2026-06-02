/**
 * ==========================================================================
 * MUTE-WEB ASMR White Noise Web Application (Step 10 - Premium Minimal Layout Integration)
 * ==========================================================================
 * 
 * [역할 및 작동 방식]
 * 본 자바스크립트 파일은 ASMR 백색소음 플레이어의 'feat/new-design' 브랜치 비즈니스 엔진을 담당합니다.
 * 기존의 마스터 볼륨, 커스텀 취침 타이머, 10초 페이드아웃, 설정 서랍, Focus Mode(UI 개별 가리기/복원)를 
 * 온전히 계승하면서, 사용자가 요청한 메인 화면 중앙의 [불멍 비디오 mp4 연동]을 위해
 * 테마별 로컬 비디오 매핑 주소와 온라인 고화질 Fallback CDN 주소를 융합한 동적 비디오 셋업 엔진을 구축했습니다.
 * 
 * 주요 튜닝 내역:
 * 1. [New] 테마별 다이내믹 비디오 매핑 (themeData 확장):
 *    - 로컬 mp4 파일 경로(`video/nature.mp4` 등)를 우선 재생하도록 매핑
 *    - 로컬에 파일이 아직 복사되지 않았을 때를 대비해 실시간 고화질 스톡 비디오 CDN 주소를 Fallback으로 융합
 * 2. [New] setupTheme(themeId) 내 비디오 로드 및 자동 재생 파이프라인 추가:
 *    - 비디오 에러 핸들러를 바인딩하여 로컬에 영상이 없을 시 자동으로 고품격 CDN 영상으로 스위칭하는 자가 복원 탑재
 *    - 모바일 및 PC 브라우저 자동 재생 정책에 맞추어 playsinline 무음 가동 및 ASMR 음악 엔진과의 완벽한 싱크
 * 3. [New] resetEngine() 내 비디오 일시 정지 및 리소스 완전 소멸 연동 완료
 */

// ==========================================================================
// 0. 테마별 오디오 & 비디오 메타데이터 정의 (비디오 엔진 확장)
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
 * @property {string} videoUrl - 로컬 mp4 비디오 탑재 경로 (사용자 복사용)
 * @property {string} fallbackVideoUrl - 인터넷 연결 시 즉시 작동하는 온라인 고화질 스톡 비디오 CDN 주소
 * @property {SoundInfo[]} sounds - 해당 테마가 가지는 3가지 상세 백색소음 목록
 */

/** @type {Object.<string, ThemeData>} */
const themeData = {
  nature: {
    title: "NATURE",
    bgName: "RAINY CAMPFIRE",
    emoji: "🌳",
    visualText: "나뭇잎에 떨어지는 부드러운 빗소리와 화로의 조용한 불꽃",
    // [요구사항] 사용자가 다운받은 mp4 비디오를 믹서 폴더 내부 'video/' 폴더에 넣을 수 있도록 로컬 경로 매핑
    videoUrl: "video/nature.mp4",
    // [Fallback] 로컬 파일이 아직 복사되지 않은 신규 접속 장소에서도 눈으로 확인할 수 있는 Pexels 고화질 direct CDN 불멍 비디오
    fallbackVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-fire-in-a-fireplace-in-close-up-40348-large.mp4",
    sounds: [
      { id: 'rain', name: '🌧️ 자갈 빗소리', url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/rain.mp3' },
      { id: 'campfire', name: '🔥 자작나무 모닥불', url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/campfire.mp3' },
      { id: 'stream', name: '🏞️ 숲속 시냇물', url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/river.mp3' }
    ]
  },
  fantasy: {
    title: "FANTASY",
    bgName: "ETHER MARKET",
    emoji: "🔮",
    visualText: "시간이 정지된 공중 마법 상점의 오묘하고 신비로운 선율",
    videoUrl: "video/fantasy.mp4",
    fallbackVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-light-particles-loop-39909-large.mp4",
    sounds: [
      { id: 'fantasy_melody', name: '✨ 은하수 성가대', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { id: 'clock', name: '🕰️ 유리 풍경 소리', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      { id: 'potion', name: '🧪 마법 물약 보글보글', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
    ]
  },
  horror: {
    title: "HORROR",
    bgName: "ABANDONED MANOR",
    emoji: "👻",
    visualText: "짙은 안개 속 버려진 고성의 서늘한 돌풍과 삐걱임",
    videoUrl: "video/horror.mp4",
    fallbackVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-dense-mist-in-a-forest-41618-large.mp4",
    sounds: [
      { id: 'spooky_wind', name: '💨 안개 낀 강풍', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
      { id: 'creaky_door', name: '🚪 문 삐걱임', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
      { id: 'footstep', name: '👣 무거운 발소리', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
    ]
  }
};

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
 * 선택된 테마 정보를 바탕으로 오디오 URL 주소 및 비디오 쉘을 갈아끼우고 
 * 멍 타겟 명칭 및 믹서 라벨을 실시간 동적 매핑하는 핵심 셋업 함수
 * 
 * @param {string} themeId - 셋업할 테마 ID
 */
function setupTheme(themeId) {
  const themeInfo = themeData[themeId];
  if (!themeInfo) return;

  currentThemeId = themeId;

  // 1. 오디오 데이터 매핑 (기존 오디오 주소를 새 테마 URL로 완전히 교체 및 초기화)
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
  if (drawerHeading) drawerHeading.textContent = `${themeInfo.title} 소리 조절`;

  renderAudioControls();
  initializeAudioSources();
  setupAudioEventListeners();

  // 2. 🎨 [New] 다이내믹 백그라운드 mp4 비디오 셋업 및 자동 재생 개시 (요구사항 1)
  const video = document.getElementById('mung-video');
  if (video) {
    // 로컬 경로의 mp4 우선 할당 (video/nature.mp4 등)
    video.src = themeInfo.videoUrl;
    
    // [중요] 사용자의 로컬 컴퓨터에 mp4 파일이 아직 복사되지 않았을 때의 자가 치유 Fallback 옵션 결합
    video.onerror = () => {
      console.warn(`[로컬 영상 부재] '${themeInfo.videoUrl}' 로컬 비디오가 감지되지 않아, 고화질 온라인 CDN 비디오로 임시 우회 연동합니다.`);
      // 온라인 실시간 고화질 무음 스톡 CDN 영상 주소 대입 및 자동 로드
      video.src = themeInfo.fallbackVideoUrl;
      video.load();
      video.play().catch(() => {});
    };

    video.load();
    video.play().catch((err) => {
      console.warn('[비디오 자동재생 제한] 브라우저 보안 정책에 의해 비디오 시작이 지연되었습니다. (음소거 상태로 우회 구동)', err);
    });
  }

  // 3. 🎨 [디자인 알파] 테마별 제네러티브 캔버스 아트 구동 연동
  initCanvasEffect(themeId);
}

/**
 * 가동 중인 오디오 엔진, 백그라운드 비디오 및 취침 예약 타이머를 안전하고 깨끗하게 정지시키는 공통 리셋 모듈
 */
function resetEngine() {
  stopAllSounds();
  handleCancelTimer();
  
  // 1. 오디오 소멸
  asmrSounds.forEach((sound) => {
    if (sound.audioInstance) {
      sound.audioInstance.pause();
      sound.audioInstance = null;
    }
  });
  asmrSounds = [];

  // 2. 캔버스 루프 애니메이션 일시 정지
  cancelAnimationFrame(canvasAnimId); 

  // 3. 🎨 [New] 백그라운드 비디오 정지 및 리소스 메모리 완전 해제 (유령 오디오 및 메모리 누수 원천 방지)
  const video = document.getElementById('mung-video');
  if (video) {
    video.pause();
    video.removeAttribute('src'); // 오디오처럼 src 해제를 통한 인스턴스 소멸 유도
    video.load();
  }
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
  enableFocusMode(false);

  // [디테일 패키지 3] 웰컴 터치 오버레이 노출 및 리셋
  const welcomeOverlay = document.getElementById('welcome-overlay');
  if (welcomeOverlay) {
    welcomeOverlay.classList.remove('fade-out');
  }

  document.getElementById('theme-select-page').style.display = 'none';
  document.getElementById('mixer-page').style.display = 'flex';
}

/**
 * [디테일 패키지 3] 자동 재생 차단 해제를 위한 웰컴 오버레이 터치 이벤트 핸들러
 * 유저의 이전 세션 복원 상태(isPlaying)를 보존하면서 일제히 오디오 재생을 개시합니다.
 */
function startAsmrOnTouch() {
  const welcomeOverlay = document.getElementById('welcome-overlay');
  if (welcomeOverlay) {
    welcomeOverlay.classList.add('fade-out');
  }

  // 브라우저 터치 맥락이 확보되었으므로, 복원된 재생 목록 중 켜져 있어야 하는 소리만 골라 재생
  let anyPlaying = false;
  asmrSounds.forEach((sound) => {
    if (sound.isPlaying && sound.audioInstance) {
      sound.audioInstance.play()
        .then(() => {
          sound.status = '재생 중';
          renderStatus();
        })
        .catch((err) => {
          console.warn(`[터치 자동재생 차단 해제 시도] ${sound.name} 재생 시작 지연`, err);
        });
      anyPlaying = true;
    }
  });

  // 만약 유저 기록이 아예 없는 최초 방문이거나 모든 소리가 꺼져 있던 상태였다면 디폴트로 전체 재생
  if (!anyPlaying) {
    playAllSounds();
  } else {
    // 하나 이상 켜져 있는 사운드가 복원 재생되었으므로 전체 재생 버튼 활성화
    const btnPlayAll = document.getElementById('btn-play-all');
    if (btnPlayAll) btnPlayAll.classList.add('active-play');
  }
}


/**
 * 메인 믹서 화면에서 좌측 상단 복귀 버튼 클릭 시 
 * 작동 중인 모든 리소스를 안전하게 강제 자동 저장한 후 초기 테마 선택 화면으로 복귀합니다.
 */
function goToThemeSelectPage() {
  saveSettings();
  resetEngine();
  enableFocusMode(false);
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
        <button type="button" class="btn-toggle-switch" id="btn-switch-${sound.id}">꺼짐</button>
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
// 4. LocalStorage 유저 설정 저장 및 로드 모듈 (테마별 독립 격리 공간)
// ==========================================================================

/**
 * 테마별 개별 독립 Key 기반의 LocalStorage 자동 저장 함수
 */
function saveSettings() {
  if (!currentThemeId) return;
  try {
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
      labelElement.textContent = sound.status;
      labelElement.setAttribute('data-status', sound.status);
    }
    const switchBtn = document.getElementById('btn-switch-' + sound.id);
    if (switchBtn) {
      switchBtn.textContent = sound.isPlaying ? '켜짐' : '꺼짐';
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
      updateTimerDisplay('시간 종료');
    }
  }, 1000);
}

function handleCancelTimer() {
  clearAllIntervals(); resetFadeOutVolume();
  setTimerControlsDisabled(false);
  const timerInput = document.getElementById('timer-input');
  if (timerInput) timerInput.value = '';
  updateTimerDisplay('대기');
}

function setTimerControlsDisabled(disabled) {
  const timerInput = document.getElementById('timer-input');
  const timerStartBtn = document.getElementById('btn-timer-start');
  if (timerInput) timerInput.disabled = disabled;
  if (timerStartBtn) timerStartBtn.disabled = disabled;
}

/**
 * 타이머 페이드아웃 적용
 */
function applyFadeOutEffect() { isFadingOut = true; syncAllAudioVolumes(); }
function resetFadeOutVolume() { isFadingOut = false; syncAllAudioVolumes(); }
function clearAllIntervals() { if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; } }

function formatTime(totalSeconds) {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function updateTimerDisplay(text) {
  const displayElement = document.getElementById('timer-display');
  if (displayElement) displayElement.textContent = `남은 시간: ${text}`;
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

/**
 * [디테일 패키지 5] 전체 UI 숨기기 (몰입 모드) 토글 제어 함수
 * @param {boolean} active - 몰입 모드 활성화 여부
 */
function enableFocusMode(active) {
  const mixerPage = document.getElementById('mixer-page');
  const focusOverlay = document.getElementById('focus-overlay-controls');
  const welcomeOverlay = document.getElementById('welcome-overlay');

  if (active) {
    if (mixerPage) mixerPage.classList.add('focus-mode-active');
    if (focusOverlay) focusOverlay.style.display = 'flex';
    
    // 웰컴 오버레이도 몰입감을 방해하지 않게 만약 존재한다면 즉시 감춤
    if (welcomeOverlay) welcomeOverlay.classList.add('fade-out');

    // 캔버스 크기를 브라우저 전체화면 크기로 확장 (generative wave를 전체화면으로 수놓음)
    resizeCanvasToFullscreen(true);
  } else {
    if (mixerPage) mixerPage.classList.remove('focus-mode-active');
    if (focusOverlay) focusOverlay.style.display = 'none';

    // 캔버스 크기를 원래의 멍 공간 상자 규격으로 복구
    resizeCanvasToFullscreen(false);
  }
}

/**
 * 몰입 모드 시 캔버스를 전체화면으로 리사이징하여 파형 입자가 화면 전체에 공명하도록 보정하는 유틸
 */
function resizeCanvasToFullscreen(isFullscreen) {
  const canvas = document.getElementById('mung-canvas');
  if (!canvas) return;
  if (isFullscreen) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    canvas.width = 280;
    canvas.height = 240;
  }
}

// 윈도우 크기 변경 시 전체 화면 캔버스 리사이징 리스너 연결
window.addEventListener('resize', () => {
  const mixerPage = document.getElementById('mixer-page');
  if (mixerPage && mixerPage.classList.contains('focus-mode-active')) {
    resizeCanvasToFullscreen(true);
  }
});

// ==========================================================================
// 10. 🎨 [디자인 알파] 제네러티브 노이즈 라인 웨이브 드로잉 시스템
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
 * 파형 애니메이션 루프
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

// ==========================================================================
// 12. [디테일 패키지 4] 웹사이트 공유 및 감성 토스트 시스템
// ==========================================================================

/**
 * 웹사이트 URL 주소를 네이티브 다이얼로그로 공유하거나, 미지원 환경 시 클립보드로 복사합니다.
 */
async function shareWebsite() {
  const shareData = {
    title: 'Mute — Quietude Ambient Mixer',
    text: '의식의 가장 고요한 곳으로. 나만을 위한 커스텀 ASMR 믹서와 감각적인 멍 비주얼을 경험해 보세요.',
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      console.log('[공유 완료] 네이티브 공유 다이얼로그 호출 성공');
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast('🔗 클립보드에 웹사이트 주소가 복사되었습니다!');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('[공유 시도 중 폴백 실행]', err);
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('🔗 클립보드에 웹사이트 주소가 복사되었습니다!');
      } catch (clipErr) {
        console.error('[클립보드 복사 실패]', clipErr);
      }
    }
  }
}

/**
 * 하단에 부드럽게 떠오르는 미니멀 반투명 토스트 메시지 렌더러
 */
function showToast(message) {
  const existingToast = document.getElementById('mute-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'mute-toast';
  toast.className = 'mute-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // 브라우저 렌더링 동기화를 위한 미세 딜레이
  setTimeout(() => {
    toast.classList.add('show');
  }, 30);

  // 2.5초 노출 후 스르륵 제거
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  }, 2500);
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
  document.getElementById('btn-drawer-toggle').addEventListener('click', () => toggleSettingsDrawer());
  document.getElementById('btn-drawer-close').addEventListener('click', () => toggleSettingsDrawer(false));

  // [디테일 패키지 4] 웹사이트 공유 단추 리스너 연결
  const btnShareMain = document.getElementById('btn-share-main');
  const btnShareMixer = document.getElementById('btn-share-mixer');
  if (btnShareMain) btnShareMain.addEventListener('click', shareWebsite);
  if (btnShareMixer) btnShareMixer.addEventListener('click', shareWebsite);

  // [디테일 패키지 5] 전체화면 멍 (몰입 모드) 토글 리스너 연결
  const btnFocusToggle = document.getElementById('btn-focus-toggle');
  const btnFocusRestore = document.getElementById('btn-focus-restore');
  const btnDrawerToggleFocus = document.getElementById('btn-drawer-toggle-focus');

  if (btnFocusToggle) btnFocusToggle.addEventListener('click', () => enableFocusMode(true));
  if (btnFocusRestore) btnFocusRestore.addEventListener('click', () => enableFocusMode(false));
  if (btnDrawerToggleFocus) btnDrawerToggleFocus.addEventListener('click', () => toggleSettingsDrawer());

  // [디테일 패키지 3] 웰컴 터치 오버레이 리스너 바인딩
  const welcomeOverlay = document.getElementById('welcome-overlay');
  if (welcomeOverlay) {
    welcomeOverlay.addEventListener('click', (e) => {
      e.stopPropagation(); // 오버레이 클릭 전파 방지
      startAsmrOnTouch();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => { setupEventListeners(); });