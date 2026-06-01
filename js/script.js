/**
 * ==========================================================================
 * MUTE-WEB ASMR White Noise Web Application (Step 7 - Sidebar Drawer & Ads)
 * ==========================================================================
 * 
 * [역할 및 작동 방식]
 * 본 자바스크립트 파일은 ASMR 백색소음 플레이어의 'Step 7' 전체 비즈니스 엔진을 담당합니다.
 * 기존의 마스터 볼륨 조절, 커스텀 취침 타이머, 10초 페이드아웃 및 LocalStorage 저장/로드 모듈을 
 * 완벽히 계승하면서, 메인 화면을 정화하고 설정을 숨겨두는 '설정 서랍(Drawer)'의 개폐(Toggle) 엔진을 추가했습니다.
 * 
 * 주요 기능:
 * 1. 무료 라이센스 및 CORS 허용 고안정성 GitHub Raw MP3 음원 3개 관리
 * 2. 각 오디오 객체 초기화, 무한 반복(loop) 및 초기 볼륨(0.5) 설정
 * 3. 개별 볼륨 슬라이더 조절 시 실시간 오디오 볼륨 크기 동기화 (마스터 볼륨 공식 대입)
 * 4. 통합 ON/OFF 스위치: 개별 재생/정지 제어
 * 5. 사용자 직접 입력 타이머: 유효성 검사 및 카운트다운 타이머 구동
 * 6. 마스터 볼륨 슬라이더: 비례 볼륨 조절
 * 7. LocalStorage 설정 백업/로드 기능 탑재
 * 8. [New] 설정 서랍(Sidebar Drawer) 제어 로직 (요구사항 2-1):
 *    - 메인 화면 우측 상단 [⚙️] 버튼 클릭 시 서랍장에 'active' 클래스를 붙여 부드럽게 열기
 *    - 서랍 내부의 [✕ 닫기] 버튼 클릭 시 서랍장을 닫아 메인 화면 몰입감 복구
 *    - HTML의 위치 구조가 사이드바로 전부 변경되었음에도, 모든 오디오 볼륨 제어 및 스위치 바인딩이 100% 정상 연동 동작
 */

// ==========================================================================
// 1. 전역 상태 관리
// ==========================================================================

/**
 * @typedef {Object} AsmrSound
 * @property {string} id - 고유 식별자 (HTML 요소 매칭용)
 * @property {string} name - 사용자에게 표시될 이름
 * @property {string} url - 오디오 스트리밍용 GitHub Raw MP3 주소
 * @property {HTMLAudioElement|null} audioInstance - 실제 재생을 담당할 오디오 객체
 * @property {string} status - 현재 재생 상태 ('준비 대기 중', '준비 완료', '재생 중', '정지됨')
 * @property {number} volume - 개별 지정 볼륨 크기 (0.0 ~ 1.0, 기본값: 0.5)
 * @property {boolean} isPlaying - 개별 ON/OFF 상태 (기본값: false)
 */

/** @type {AsmrSound[]} */
const asmrSounds = [
  {
    id: 'rain',
    name: '차분한 빗소리',
    url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/rain.mp3',
    audioInstance: null,
    status: '준비 대기 중',
    volume: 0.5,
    isPlaying: false
  },
  {
    id: 'campfire',
    name: '따뜻한 장작 소리',
    url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/campfire.mp3',
    audioInstance: null,
    status: '준비 대기 중',
    volume: 0.5,
    isPlaying: false
  },
  {
    id: 'stream',
    name: '맑은 시냇물 소리',
    url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/river.mp3',
    audioInstance: null,
    status: '준비 대기 중',
    volume: 0.5,
    isPlaying: false
  }
];

// LocalStorage 키값 설정
const STORAGE_KEY = 'mute_web_user_settings';

// 마스터 볼륨 및 타이머 제어용 전역 변수
let masterVolume = 1.0; // 마스터 볼륨 기본값
let timerSecondsRemaining = 0; // 남은 전체 초
let countdownIntervalId = null; // 카운트다운 타이머 인터벌 ID
let isFadingOut = false; // 현재 페이드아웃 감쇄 동작이 가동 중인지 여부

// ==========================================================================
// 2. 오디오 초기화 및 기본값 매핑 함수
// ==========================================================================

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
      if (sound.status === '준비 대기 중') {
        sound.status = '준비 완료';
        renderStatus();
      }
    });

    audio.addEventListener('error', (e) => {
      console.error(`${sound.name} 로드 에러:`, e);
      sound.status = '로드 실패';
      renderStatus();
    });
  });

  renderStatus();
}

// ==========================================================================
// 3. LocalStorage 유저 설정 저장 및 로드 모듈
// ==========================================================================

/**
 * [LocalStorage 설정 자동 저장 함수]
 * 유저가 볼륨을 조정하거나 스위치를 건드릴 때마다, 
 * 마스터 볼륨과 개별 오디오들의 볼륨 및 ON/OFF 상태를 직렬화하여 브라우저에 비동기식 반영합니다.
 */
function saveSettings() {
  try {
    const userSettings = {
      masterVolume: masterVolume,
      sounds: asmrSounds.map((sound) => ({
        id: sound.id,
        volume: sound.volume,
        isPlaying: sound.isPlaying
      }))
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userSettings));
    console.log('[설정 자동 저장] 유저의 사운드 설정 상태가 성공적으로 스토리지에 백업되었습니다.');
  } catch (error) {
    console.error('[설정 저장 실패] LocalStorage에 접근할 수 없습니다:', error);
  }
}

/**
 * [LocalStorage 설정 자동 로드 및 상태 복원 함수]
 * 페이지가 최초 실행될 때 로컬 저장소에 백업해 두었던 유저 설정 데이터를 불러옵니다.
 * 데이터가 존재하면 슬라이더 위치, 스위치 배지 상태, 오디오 실제 볼륨을 완벽하게 강제 복구(동기화)합니다.
 */
function loadSettings() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    
    if (!rawData) {
      console.log('[설정 로드] 저장된 이전 유저 설정 데이터가 존재하지 않아 기본값으로 초기 구동을 유지합니다.');
      return;
    }

    const savedSettings = JSON.parse(rawData);
    console.log('[설정 로드 성공] 이전 유저 세팅을 발견하여 복원 프로세스를 가동합니다:', savedSettings);

    // 1. 마스터 볼륨 상태 복원 및 HTML 마스터 슬라이더 위치 동기화
    if (typeof savedSettings.masterVolume === 'number') {
      masterVolume = savedSettings.masterVolume;
      const masterSlider = document.getElementById('master-volume');
      if (masterSlider) {
        masterSlider.value = masterVolume;
      }
    }

    // 2. 개별 오디오 설정 복원 및 HTML 엘리먼트 위치/텍스트 강제 동기화
    if (Array.isArray(savedSettings.sounds)) {
      savedSettings.sounds.forEach((savedSound) => {
        const sound = asmrSounds.find((s) => s.id === savedSound.id);
        
        if (sound) {
          sound.volume = savedSound.volume;
          sound.isPlaying = savedSound.isPlaying;

          const sliderElement = document.getElementById(`volume-${sound.id}`);
          if (sliderElement) {
            sliderElement.value = sound.volume;
          }

          if (sound.audioInstance) {
            sound.audioInstance.volume = getCalculatedVolume(sound);

            if (sound.isPlaying) {
              sound.audioInstance.play()
                .then(() => {
                  sound.status = '재생 중';
                  renderStatus();
                })
                .catch((autoplayError) => {
                  console.warn(`[자동재생 제한] 브라우저 보안 정책에 의해 ${sound.name}의 자동 재생이 대기 상태입니다. (유저 액션 시 재생)`);
                  sound.status = '준비 완료'; 
                  renderStatus();
                });
            } else {
              sound.status = '준비 완료';
            }
          }
        }
      });
    }

    renderStatus();
    console.log('[설정 복원 완료] 모든 슬라이더 위치 및 음소거/스위치 배지가 실시간 동기화되었습니다.');
  } catch (error) {
    console.error('[설정 로드 실패] 데이터를 읽어오는 중 에러가 발생하여 기본값으로 구동합니다:', error);
  }
}

// ==========================================================================
// 4. 볼륨 연산 엔진 함수
// ==========================================================================

/**
 * 수학적 볼륨 공식을 기반으로 개별 사운드의 실제 출력 오디오 볼륨을 계산합니다.
 * 계산식: [개별 지정 볼륨] × [마스터 볼륨] × [타이머 페이드아웃 비율 (동작 시)]
 * 
 * @param {AsmrSound} sound - 계산 대상 사운드 상태 객체
 * @returns {number} 실제 HTML5 Audio 객체에 주입할 볼륨 값 (0.0 ~ 1.0)
 */
function getCalculatedVolume(sound) {
  let fadeRatio = 1.0;

  if (isFadingOut) {
    fadeRatio = Math.max(0, Math.min(1, timerSecondsRemaining / 10));
  }

  const targetVolume = sound.volume * masterVolume * fadeRatio;
  return Math.max(0, Math.min(1, targetVolume));
}

/**
 * 전역 상태에 맞춰 가동 중인 모든 오디오의 실제 출력 볼륨을 강제 동기화합니다.
 */
function syncAllAudioVolumes() {
  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    if (audio) {
      audio.volume = getCalculatedVolume(sound);
    }
  });
}

// ==========================================================================
// 5. UI 렌더링 함수
// ==========================================================================

/**
 * 현재 asmrSounds 배열에 저장된 상태를 화면의 텍스트 라벨과 스위치 텍스트에 반영합니다.
 */
function renderStatus() {
  asmrSounds.forEach((sound) => {
    // 1. 상태 배지 텍스트 및 데이터 속성 업데이트
    const labelElement = document.getElementById(`status-${sound.id}`);
    if (labelElement) {
      labelElement.textContent = sound.status;
      labelElement.setAttribute('data-status', sound.status);
    }

    // 2. 통합 ON/OFF 스위치 버튼 텍스트 및 클래스 갱신
    const switchBtn = document.getElementById(`btn-switch-${sound.id}`);
    if (switchBtn) {
      switchBtn.textContent = sound.isPlaying ? 'ON' : 'OFF';
      
      if (sound.isPlaying) {
        switchBtn.classList.add('active-on');
      } else {
        switchBtn.classList.remove('active-on');
      }
    }
  });
}

// ==========================================================================
// 6. 오디오 제어 핵심 함수
// ==========================================================================

/**
 * 등록된 모든 ASMR 오디오를 동시에 재생하는 전체 제어 함수입니다.
 * 모든 음원의 개별 상태를 ON(isPlaying = true)으로 설정하고 재생을 실행합니다.
 */
function playAllSounds() {
  if (isFadingOut) {
    resetFadeOutVolume();
  }

  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    
    if (!audio) return;

    audio.volume = getCalculatedVolume(sound);

    audio.play()
      .then(() => {
        sound.status = '재생 중';
        sound.isPlaying = true;
        renderStatus();
        saveSettings(); // 설정 변경 자동 백업
      })
      .catch((error) => {
        console.error(`${sound.name} 재생 시작 실패:`, error);
        sound.status = '재생 오류';
        renderStatus();
      });
  });
}

/**
 * 모든 오디오 재생을 일시정지하고 재생 시간을 처음(0) 상태로 되돌립니다.
 * 개별 통합 스위치 상태를 모두 OFF(isPlaying = false)로 갱신합니다.
 */
function stopAllSounds() {
  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    sound.isPlaying = false;
    sound.status = '정지됨';
  });
  
  resetFadeOutVolume();
  renderStatus();
  saveSettings(); // 설정 변경 자동 백업
}

/**
 * 특정 단일 사운드의 [ON/OFF] 토글 상태를 전환합니다.
 * 볼륨 슬라이더 값은 엄격하게 유지한 채 해당 사운드만 재생하거나 정지시킵니다.
 * 
 * @param {string} soundId - 대상 사운드 ID
 */
function toggleSoundSwitch(soundId) {
  const sound = asmrSounds.find(s => s.id === soundId);
  if (!sound || !sound.audioInstance) return;

  const audio = sound.audioInstance;

  if (isFadingOut) {
    resetFadeOutVolume();
  }

  if (sound.isPlaying) {
    audio.pause();
    sound.isPlaying = false;
    sound.status = '정지됨';
    saveSettings(); // 스위치 해제 시 저장
  } else {
    audio.volume = getCalculatedVolume(sound); 
    
    audio.play()
      .then(() => {
        sound.isPlaying = true;
        sound.status = '재생 중';
        renderStatus();
        saveSettings(); // 스위치 켬 시 저장
      })
      .catch((err) => {
        console.error(`${sound.name} 개별 재생 실패:`, err);
        sound.status = '재생 오류';
        renderStatus();
      });
  }
  
  renderStatus();
}

/**
 * 특정 오디오 소스의 슬라이더 볼륨 크기를 실시간 동기화합니다.
 * 
 * @param {string} soundId - 대상 사운드 ID
 * @param {number} newVolume - 변경할 볼륨 값 (0.0 ~ 1.0)
 */
function updateVolume(soundId, newVolume) {
  const sound = asmrSounds.find(s => s.id === soundId);
  
  if (sound) {
    sound.volume = newVolume;
    
    if (sound.audioInstance) {
      sound.audioInstance.volume = getCalculatedVolume(sound);
    }
    
    saveSettings(); // 개별 볼륨 조정 시 실시간 자동 저장
  }
}

/**
 * 유저가 마스터 볼륨을 제어할 때 동작하는 실시간 조절 함수입니다.
 * 
 * @param {number} newMasterVolume - 변경할 마스터 볼륨 값 (0.0 ~ 1.0)
 */
function updateMasterVolume(newMasterVolume) {
  masterVolume = newMasterVolume;
  syncAllAudioVolumes();
  saveSettings(); // 마스터 볼륨 조정 시 실시간 자동 저장
}

// ==========================================================================
// 7. 직접 입력 방식 오디오 타이머 로직
// ==========================================================================

/**
 * 사용자가 입력한 사용자 지정 분 단위를 받아 타이머를 시작하는 함수입니다.
 */
function handleStartTimer() {
  const timerInput = document.getElementById('timer-input');
  if (!timerInput) return;

  const valueString = timerInput.value.trim();

  if (valueString === '') {
    alert('시간(분)을 입력해 주세요!');
    return;
  }

  const minutes = parseInt(valueString, 10);

  if (isNaN(minutes) || minutes <= 0) {
    alert('1분 이상의 올바른 숫자를 입력해 주세요!');
    timerInput.value = '';
    return;
  }

  startAudioTimer(minutes);
}

/**
 * 카운트다운 타이머 인터벌을 등록하고 UI 통제를 적용합니다.
 * 
 * @param {number} minutes - 구동할 분 단위 시간
 */
function startAudioTimer(minutes) {
  clearAllIntervals();
  resetFadeOutVolume();

  setTimerControlsDisabled(true);

  timerSecondsRemaining = minutes * 60;
  updateTimerDisplay(formatTime(timerSecondsRemaining));
  console.log(`[타이머 시작] 사용자가 ${minutes}분 취침 예약을 설정했습니다.`);

  countdownIntervalId = setInterval(() => {
    timerSecondsRemaining--;

    updateTimerDisplay(formatTime(timerSecondsRemaining));

    if (timerSecondsRemaining <= 10 && timerSecondsRemaining > 0) {
      applyFadeOutEffect();
    }

    if (timerSecondsRemaining <= 0) {
      console.log('[타이머 종료] 예약 시간이 완료되어 백색소음을 전체 정지합니다.');
      clearAllIntervals();
      stopAllSounds();
      
      setTimerControlsDisabled(false);
      updateTimerDisplay('완료');
    }
  }, 1000);
}

/**
 * [타이머 취소] 버튼 클릭 시 동작하는 처리기입니다.
 */
function handleCancelTimer() {
  clearAllIntervals();
  resetFadeOutVolume();

  setTimerControlsDisabled(false);

  const timerInput = document.getElementById('timer-input');
  if (timerInput) {
    timerInput.value = '';
  }
  updateTimerDisplay('없음');

  console.log('[타이머 취소] 사용자가 취침 예약을 취소했습니다. 재생 상태는 온전히 유지됩니다.');
}

/**
 * 타이머 조작 입력 요소들의 비활성화/활성화 상태를 제어하는 함수입니다.
 */
function setTimerControlsDisabled(disabled) {
  const timerInput = document.getElementById('timer-input');
  const timerStartBtn = document.getElementById('btn-timer-start');

  if (timerInput) {
    timerInput.disabled = disabled;
  }
  if (timerStartBtn) {
    timerStartBtn.disabled = disabled;
  }
}

/**
 * 타이머 종료 전 마지막 10초 동안 선형적으로 볼륨을 점차 낮추는 페이드아웃 감쇠 함수입니다.
 */
function applyFadeOutEffect() {
  isFadingOut = true;
  syncAllAudioVolumes();
}

/**
 * 페이드아웃이 가동되어 깎여있던 오디오 볼륨을 
 * 슬라이더가 지정한 원래 유저 지정 볼륨 강도로 즉시 100% 복원하는 복구 함수입니다.
 */
function resetFadeOutVolume() {
  isFadingOut = false;
  syncAllAudioVolumes();
}

/**
 * 현재 가동 중인 카운트다운 타이머 인터벌을 깨끗하게 소거합니다.
 */
function clearAllIntervals() {
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
}

/**
 * 초 단위 숫자를 "MM:SS" 형태의 예쁜 분:초 텍스트 포맷으로 바꾸어줍니다.
 */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  
  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * 화면 하단에 있는 타이머 텍스트 디스플레이 영역의 텍스트를 안전하게 변경합니다.
 */
function updateTimerDisplay(text) {
  const displayElement = document.getElementById('timer-display');
  if (displayElement) {
    displayElement.textContent = `남은 시간: ${text}`;
  }
}

// ==========================================================================
// 8. 설정 서랍(Sidebar Drawer) 토글 모듈 (Step 7 핵심 추가 기능)
// ==========================================================================

/**
 * [설정 서랍 상태 토글 함수] (요구사항 2-1)
 * 우측 상단 기어 버튼 클릭 시 Drawer를 스르륵 열고 닫도록 'active' 클래스를 토글 제어합니다.
 * 
 * @param {boolean} isOpen - 명시적으로 열거나 닫을지 여부 (생략 시 토글)
 */
function toggleSettingsDrawer(isOpen) {
  const drawerElement = document.getElementById('settings-drawer');
  if (!drawerElement) return;

  if (typeof isOpen === 'boolean') {
    if (isOpen) {
      drawerElement.classList.add('active');
    } else {
      drawerElement.classList.remove('active');
    }
  } else {
    // 인자 생략 시 active 클래스 토글
    drawerElement.classList.toggle('active');
  }

  const isCurrentActive = drawerElement.classList.contains('active');
  console.log(`[설정 서랍] 서랍장 창이 ${isCurrentActive ? '열렸습니다.' : '닫혔습니다.'}`);
}

// ==========================================================================
// 9. 이벤트 바인딩 및 어플리케이션 진입점
// ==========================================================================

/**
 * 버튼 및 슬라이더, 타이머 등과 비즈니스 제어 로직 간의 이벤트 연동을 수행합니다.
 */
function setupEventListeners() {
  // 1. 전체 제어 상단 버튼 바인딩
  const playAllButton = document.getElementById('btn-play-all');
  const stopAllButton = document.getElementById('btn-stop-all');

  if (playAllButton) {
    playAllButton.addEventListener('click', playAllSounds);
  }

  if (stopAllButton) {
    stopAllButton.addEventListener('click', stopAllSounds);
  }

  // 2. 마스터 볼륨 슬라이더 조절 이벤트 감지 등록
  const masterVolumeSlider = document.getElementById('master-volume');
  if (masterVolumeSlider) {
    masterVolumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      updateMasterVolume(val);
    });
  }

  // 3. 각 사운드별 개별 엘리먼트(볼륨 슬라이더, ON/OFF 스위치) 이벤트 등록
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

  // 4. 직접 입력 방식 타이머 제어용 버튼 이벤트 등록
  const timerStartBtn = document.getElementById('btn-timer-start');
  const timerCancelBtn = document.getElementById('btn-timer-cancel');

  if (timerStartBtn) {
    timerStartBtn.addEventListener('click', handleStartTimer);
  }
  if (timerCancelBtn) {
    timerCancelBtn.addEventListener('click', handleCancelTimer);
  }

  // 5. [New] 설정 서랍(Sidebar Drawer) 열기 및 닫기 버튼 이벤트 바인딩 (요구사항 2-1)
  const drawerToggleBtn = document.getElementById('btn-drawer-toggle');
  const drawerCloseBtn = document.getElementById('btn-drawer-close');

  if (drawerToggleBtn) {
    drawerToggleBtn.addEventListener('click', () => toggleSettingsDrawer(true));
  }
  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', () => toggleSettingsDrawer(false));
  }
}

// 문서 로드가 완료되면 오디오 초기화, 유저 세팅 로드 및 이벤트 리스너 실행
document.addEventListener('DOMContentLoaded', () => {
  initializeAudioSources(); // 1. 오디오 객체들 메모리 가동
  loadSettings();           // 2. LocalStorage에서 백업 데이터 확인 및 복구 동기화
  setupEventListeners();    // 3. 브라우저 이벤트 바인딩 설정
});
