/**
 * ==========================================================================
 * MUTE-WEB ASMR White Noise Web Application (Step 5-2 - Master Volume Integration)
 * ==========================================================================
 * 
 * [역할 및 작동 방식]
 * 본 자바스크립트 파일은 ASMR 백색소음 플레이어의 '마스터 볼륨 슬라이더 연동' 로직을 담당합니다.
 * 기존의 사용자 직접 지정 타이머, 10초 선형 페이드아웃, 개별 ON/OFF 토글 스위치 기능을 보존하면서,
 * 상단에 전체 소리의 크기를 한 번에 조절할 수 있는 마스터 볼륨(Master Volume) 제어기를 연동했습니다.
 * 
 * [수학적 볼륨 감쇠 공식]
 * 각 사운드의 실제 최종 오디오 출력 음량은 아래와 같이 계산됩니다:
 * 최종 출력 음량 = [개별 지정 볼륨] × [마스터 볼륨] × [타이머 페이드아웃 감쇠 비율 (동작 시)]
 * 
 * 주요 기능:
 * 1. 무료 라이센스 및 CORS 허용 고안정성 GitHub Raw MP3 음원 3개 관리
 * 2. 각 오디오 객체 초기화, 무한 반복(loop) 및 초기 볼륨(0.5) 설정
 * 3. 개별 볼륨 슬라이더 조절 시 실시간 오디오 볼륨 크기 동기화 (마스터 볼륨 공식 대입)
 * 4. 통합 ON/OFF 스위치: 개별 재생/정지 제어
 * 5. 사용자 직접 입력 타이머: 유효성 검사 및 카운트다운 타이머 구동
 * 6. [New] 마스터 볼륨 슬라이더: 유저가 믹싱해 둔 개별 볼륨 비율을 훼손하지 않고 전체 볼륨을 실시간 비례 조절
 * 7. [New] 정밀 페이드아웃: 취침 예약 타이머의 10초 감쇄 동작이 마스터 볼륨이 곱해진 최종 볼륨선에서부터 선형적으로 0까지 감쇄되도록 제어 정밀도 개선
 */

// ==========================================================================
// 1. 전역 상태 관리 (마스터 볼륨 필드 추가)
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

// 마스터 볼륨 및 타이머 제어용 전역 변수 (요구사항 2-1)
let masterVolume = 1.0; // 마스터 볼륨 기본값 (0.0 ~ 1.0, 기본값: 1.0)
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
    // 1. 오디오 객체 동적 생성 및 소스 연결
    const audio = new Audio(sound.url);
    
    // 2. 백색소음을 위한 무한 반복 재생 활성화
    audio.loop = true;
    
    // 3. 현재 저장된 [개별 볼륨 × 마스터 볼륨] 최종 볼륨으로 오디오 볼륨 설정 (요구사항 2-2)
    audio.volume = getCalculatedVolume(sound);

    // 4. 오디오 인스턴스 전역 객체에 매핑
    sound.audioInstance = audio;

    // 5. 오디오 로딩 상태 이벤트 추적
    audio.addEventListener('canplaythrough', () => {
      if (sound.status === '준비 대기 중') {
        sound.status = '준비 완료';
        renderStatus();
      }
    });

    // 6. 에러 발생 시 처리
    audio.addEventListener('error', (e) => {
      console.error(`${sound.name} 로드 에러:`, e);
      sound.status = '로드 실패';
      renderStatus();
    });
  });

  // 최초 1회 화면 갱신
  renderStatus();
}

// ==========================================================================
// 3. 볼륨 연산 엔진 함수 (요구사항 2-2, 2-5)
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

  // 타이머 종료 마지막 10초 동안 선형 페이드아웃 적용
  if (isFadingOut) {
    fadeRatio = Math.max(0, Math.min(1, timerSecondsRemaining / 10));
  }

  // 최종 수학적 계산: 개별 슬라이더 값 * 마스터 볼륨 값 * 페이드아웃 비율
  const targetVolume = sound.volume * masterVolume * fadeRatio;

  // HTML5 Audio는 0.0 ~ 1.0 사이 값만 허용하므로 안전 장치 랩핑
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
// 4. UI 렌더링 함수
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
// 5. 오디오 제어 핵심 함수
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

    // 재생 전 최종 수학적 공식 볼륨 동기화 (개별 볼륨 * 마스터 볼륨)
    audio.volume = getCalculatedVolume(sound);

    audio.play()
      .then(() => {
        sound.status = '재생 중';
        sound.isPlaying = true;
        renderStatus();
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

    // 1. 오디오 재생 정지
    audio.pause();
    
    // 2. 재생 시점 초기화
    audio.currentTime = 0;
    
    // 3. 상태 플래그 초기화
    sound.isPlaying = false;
    sound.status = '정지됨';
  });
  
  // 페이드아웃 상태 및 볼륨 초기 복원 가동
  resetFadeOutVolume();
  renderStatus();
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
    // ON -> OFF (일시정지 처리)
    audio.pause();
    sound.isPlaying = false;
    sound.status = '정지됨';
  } else {
    // OFF -> ON (재생 처리, 슬라이더 볼륨에 마스터 볼륨 배율 곱하여 대입)
    audio.volume = getCalculatedVolume(sound); 
    
    audio.play()
      .then(() => {
        sound.isPlaying = true;
        sound.status = '재생 중';
        renderStatus();
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
 * 개별 슬라이더를 조절할 때도 항상 마스터 볼륨 값이 곱해진 최종 연산값이 적용됩니다. (요구사항 2-4)
 * 
 * @param {string} soundId - 대상 사운드 ID
 * @param {number} newVolume - 변경할 볼륨 값 (0.0 ~ 1.0)
 */
function updateVolume(soundId, newVolume) {
  const sound = asmrSounds.find(s => s.id === soundId);
  
  if (sound) {
    // 1. 개별 기본 볼륨 상태 업데이트
    sound.volume = newVolume;
    
    // 2. 오디오 인프라의 실제 출력 볼륨 동기화 (공식 적용)
    if (sound.audioInstance) {
      sound.audioInstance.volume = getCalculatedVolume(sound);
    }
  }
}

/**
 * 유저가 마스터 볼륨을 제어할 때 동작하는 실시간 조절 함수입니다. (요구사항 2-3)
 * 
 * @param {number} newMasterVolume - 변경할 마스터 볼륨 값 (0.0 ~ 1.0)
 */
function updateMasterVolume(newMasterVolume) {
  // 1. 전역 마스터 볼륨 변수 값 저장
  masterVolume = newMasterVolume;

  // 2. 공식에 맞추어 모든 작동 중인 오디오 볼륨을 일시에 동기화 수행
  syncAllAudioVolumes();

  console.log(`[마스터 볼륨] 전체 오디오 크기가 ${Math.round(newMasterVolume * 100)}% 배율로 통합 조정되었습니다.`);
}

// ==========================================================================
// 6. 직접 입력 방식 오디오 타이머 로직
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

    // 마지막 10초 선형 감쇄 페이드아웃 효과 (요구사항 2-5)
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
 * 마스터 볼륨과 개별 볼륨이 적용된 최종 실제 출력값 기준으로 부드럽게 0으로 수렴합니다. (요구사항 2-5)
 */
function applyFadeOutEffect() {
  isFadingOut = true;
  syncAllAudioVolumes(); // getCalculatedVolume 연산이 내부에서 자동으로 감쇄 비율을 적용함
}

/**
 * 페이드아웃이 가동되어 깎여있던 오디오 볼륨을 
 * 슬라이더가 지정한 원래 유저 지정 볼륨 강도로 즉시 100% 복원하는 복구 함수입니다.
 */
function resetFadeOutVolume() {
  isFadingOut = false;
  syncAllAudioVolumes(); // getCalculatedVolume을 통해 [개별 볼륨 * 마스터 볼륨] 상태로 자동 롤백
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
// 7. 이벤트 바인딩 및 어플리케이션 진입점
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

  // 2. 마스터 볼륨 슬라이더 조절 이벤트 감지 등록 (요구사항 1-1, 2-3)
  const masterVolumeSlider = document.getElementById('master-volume');
  if (masterVolumeSlider) {
    masterVolumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      updateMasterVolume(val);
    });
  }

  // 3. 각 사운드별 개별 엘리먼트(볼륨 슬라이더, ON/OFF 스위치) 이벤트 등록
  asmrSounds.forEach((sound) => {
    // A. 볼륨 조절 슬라이더
    const sliderElement = document.getElementById(`volume-${sound.id}`);
    if (sliderElement) {
      sliderElement.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        updateVolume(sound.id, value);
      });
    }

    // B. 통합 [ON/OFF] 토글 스위치 버튼
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
}

// 문서 로드가 완료되면 오디오 초기화 및 이벤트 리스너 리얼타임 실행
document.addEventListener('DOMContentLoaded', () => {
  initializeAudioSources();
  setupEventListeners();
});
