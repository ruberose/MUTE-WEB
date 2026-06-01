/**
 * ==========================================================================
 * MUTE-WEB ASMR White Noise Web Application (Step 5 - Custom Input Timer)
 * ==========================================================================
 * 
 * [역할 및 작동 방식]
 * 본 자바스크립트 파일은 ASMR 백색소음 플레이어의 'Step 5' 비즈니스 로직을 담당합니다.
 * 기존의 고정 시간 버튼 방식 타이머를 개선하여 사용자가 직접 원하는 '분(Minute)' 단위를 
 * 입력하여 예약 정지할 수 있는 '사용자 직접 입력 방식 타이머'를 구현했습니다.
 * 
 * 주요 기능:
 * 1. 무료 라이센스 및 CORS 허용 고안정성 GitHub Raw MP3 음원 3개 관리
 * 2. 각 오디오 객체 초기화, 무한 반복(loop) 및 초기 볼륨(0.5) 설정
 * 3. 개별 볼륨 슬라이더 조절 시 실시간 오디오 볼륨 크기 동기화
 * 4. 통합 ON/OFF 스위치: 유저가 켜고 끄는 직관적인 단일 버튼 제어 (기존 슬라이더 볼륨 값 완전 유지)
 * 5. [New] 사용자 직접 입력 타이머: 유효성 검사(빈 값, 0 이하 수 제한)를 적용한 자유 시간 타이머 구동
 * 6. [New] 타이머 구동 중 안전 잠금: 카운트다운 도중 입력 필드와 시작 버튼을 비활성화(disabled)하여 오작동 차단
 * 7. [New] 타이머 취소 기능: 소리는 유지한 채 카운트다운을 즉시 멈추고 제어창을 다시 활성화
 * 8. 페이드아웃(Fade-out) 연동: 커스텀 타이머 종료 10초 전부터 전체 사운드가 선형적으로 감쇄되어 자동 정지
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
 * @property {number} volume - 개별 볼륨 크기 (0.0 ~ 1.0, 기본값: 0.5)
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

// 타이머 관련 제어 변수들
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
    
    // 3. 현재 저장된 볼륨 기본값(0.5)으로 오디오 볼륨 설정
    audio.volume = sound.volume;

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
// 3. UI 렌더링 함수
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
      
      // ON 상태일 때 시각적인 활성화 클래스 분기 처리
      if (sound.isPlaying) {
        switchBtn.classList.add('active-on');
      } else {
        switchBtn.classList.remove('active-on');
      }
    }
  });
}

// ==========================================================================
// 4. 오디오 제어 핵심 함수
// ==========================================================================

/**
 * 등록된 모든 ASMR 오디오를 동시에 재생하는 전체 제어 함수입니다.
 * 모든 음원의 개별 상태를 ON(isPlaying = true)으로 설정하고 재생을 실행합니다.
 */
function playAllSounds() {
  // 타이머 페이드아웃 상태 진행 중이었다면 볼륨 초기 복원 가동
  if (isFadingOut) {
    resetFadeOutVolume();
  }

  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    
    if (!audio) return;

    // 슬라이더에 세팅되어 있는 기존 볼륨 크기 그대로 소리 세팅
    audio.volume = sound.volume;

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
  
  // 페이드아웃이 동작하여 볼륨이 깎여 있던 상황을 대비해 볼륨을 슬라이더 원래 상태로 복원
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

  // 타이머가 동작하여 감쇄가 이루어지던 중 토글 스위치 변경 시 원격 볼륨 복구
  if (isFadingOut) {
    resetFadeOutVolume();
  }

  if (sound.isPlaying) {
    // ON -> OFF (일시정지 처리)
    audio.pause();
    sound.isPlaying = false;
    sound.status = '정지됨';
  } else {
    // OFF -> ON (재생 처리, 슬라이더 볼륨 크기 완전 보존)
    audio.volume = sound.volume; 
    
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
 * 
 * @param {string} soundId - 대상 사운드 ID
 * @param {number} newVolume - 변경할 볼륨 값 (0.0 ~ 1.0)
 */
function updateVolume(soundId, newVolume) {
  const sound = asmrSounds.find(s => s.id === soundId);
  
  if (sound) {
    sound.volume = newVolume;
    
    // 타이머 페이드아웃 감쇄 진행 중이 아닐 때만 실제 오디오 객체 볼륨을 동기화
    if (sound.audioInstance && !isFadingOut) {
      sound.audioInstance.volume = newVolume;
    }
  }
}

// ==========================================================================
// 5. 직접 입력 방식 오디오 타이머 로직 (Step 5 변경 사항)
// ==========================================================================

/**
 * 사용자가 입력한 사용자 지정 분 단위를 받아 타이머를 시작하는 함수입니다. (요구사항 2)
 * 빈 값이거나 0 이하의 비정상적인 정수 값일 경우의 예외 처리가 가동됩니다.
 */
function handleStartTimer() {
  const timerInput = document.getElementById('timer-input');
  if (!timerInput) return;

  // 1. 입력된 값 읽기 및 공백 제거
  const valueString = timerInput.value.trim();

  // 2. 예외 처리: 빈 값이거나 숫자가 아닌 경우 거름 (요구사항 2-1)
  if (valueString === '') {
    alert('시간(분)을 입력해 주세요!');
    return;
  }

  const minutes = parseInt(valueString, 10);

  // 3. 예외 처리: 0 이하의 값 또는 정상 숫자가 아닌 경우 가동 제한 (요구사항 2-1)
  if (isNaN(minutes) || minutes <= 0) {
    alert('1분 이상의 올바른 숫자를 입력해 주세요!');
    timerInput.value = '';
    return;
  }

  // 4. 타이머 기능 가동
  startAudioTimer(minutes);
}

/**
 * 카운트다운 타이머 인터벌을 등록하고 UI 통제를 적용합니다. (요구사항 2)
 * 
 * @param {number} minutes - 구동할 분 단위 시간
 */
function startAudioTimer(minutes) {
  // 1. 기존 가동되던 인터벌 청소 및 볼륨 복구
  clearAllIntervals();
  resetFadeOutVolume();

  // 2. 입력 제어창 및 구동 버튼 실시간 비활성화 (요구사항 2-2)
  setTimerControlsDisabled(true);

  // 3. 남은 시간 초 단위 환산 및 저장
  timerSecondsRemaining = minutes * 60;
  updateTimerDisplay(formatTime(timerSecondsRemaining));
  console.log(`[타이머 시작] 사용자가 ${minutes}분 취침 예약을 설정했습니다.`);

  // 4. 1초마다 반응하는 카운트다운 가동
  countdownIntervalId = setInterval(() => {
    timerSecondsRemaining--;

    // A. 남은 시간 실시간 출력 갱신
    updateTimerDisplay(formatTime(timerSecondsRemaining));

    // B. 마지막 10초 선형 감쇄 페이드아웃 효과 (요구사항 2-4)
    if (timerSecondsRemaining <= 10 && timerSecondsRemaining > 0) {
      applyFadeOutEffect(timerSecondsRemaining);
    }

    // C. 카운트다운 시간이 완료된 경우
    if (timerSecondsRemaining <= 0) {
      console.log('[타이머 종료] 예약 시간이 완료되어 백색소음을 전체 정지합니다.');
      clearAllIntervals();
      stopAllSounds(); // 전체 오디오 일시정지
      
      // 제어 요소 활성화 복원 및 시간 완료 출력
      setTimerControlsDisabled(false);
      updateTimerDisplay('완료');
    }
  }, 1000);
}

/**
 * [타이머 취소] 버튼 클릭 시 동작하는 처리기입니다. (요구사항 2-3)
 * 소리는 전혀 정지시키지 않은 채, 타이머 인터벌만 즉시 멈추고 
 * 깎여있던 페이드아웃 볼륨을 원상태로 되돌린 뒤 입력창을 초기화 및 활성화합니다.
 */
function handleCancelTimer() {
  // 1. 카운트다운 인터벌 소거 (음원 재생은 그대로 유지)
  clearAllIntervals();

  // 2. 페이드아웃에 의해 작아진 볼륨을 원래 지정 볼륨 상태로 즉각 복구 (요구사항 2-3)
  resetFadeOutVolume();

  // 3. 입력 필드 및 시작 단추 활성화 원상복귀 (요구사항 2-3)
  setTimerControlsDisabled(false);

  // 4. 입력창 값 및 잔여 시간 표시 라벨 초기화 (요구사항 2-3)
  const timerInput = document.getElementById('timer-input');
  if (timerInput) {
    timerInput.value = '';
  }
  updateTimerDisplay('없음');

  console.log('[타이머 취소] 사용자가 취침 예약을 취소했습니다. 재생 상태는 온전히 유지됩니다.');
}

/**
 * 타이머 조작 입력 요소들의 비활성화/활성화 상태를 제어하는 함수입니다. (요구사항 2-2)
 * 
 * @param {boolean} disabled - 비활성화 적용 여부 (true: 잠금, false: 해제)
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
 * 
 * @param {number} secondsLeft - 남은 초 단위 시간 (1~10)
 */
function applyFadeOutEffect(secondsLeft) {
  isFadingOut = true;

  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    if (audio && sound.isPlaying) {
      const fadeRatio = secondsLeft / 10;
      const targetVolume = sound.volume * fadeRatio;
      
      audio.volume = Math.max(0, Math.min(sound.volume, targetVolume));
    }
  });

  console.log(`[페이드아웃] 볼륨 감쇄 진행 중... 남은 시간: ${secondsLeft}초`);
}

/**
 * 페이드아웃이 가동되어 깎여있던 오디오 볼륨을 
 * 슬라이더가 지정한 원래 유저 지정 볼륨 강도로 즉시 100% 복원하는 복구 함수입니다.
 */
function resetFadeOutVolume() {
  isFadingOut = false;
  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    if (audio) {
      audio.volume = sound.volume; // 원래 볼륨으로 복원
    }
  });
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
 * 
 * @param {number} totalSeconds - 변환할 초 단위 시간
 * @returns {string} 포맷팅된 시간 문자열
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
 * 
 * @param {string} text - 출력할 텍스트
 */
function updateTimerDisplay(text) {
  const displayElement = document.getElementById('timer-display');
  if (displayElement) {
    displayElement.textContent = `남은 시간: ${text}`;
  }
}

// ==========================================================================
// 6. 이벤트 바인딩 및 어플리케이션 진입점
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

  // 2. 각 사운드별 개별 엘리먼트(볼륨 슬라이더, ON/OFF 스위치) 이벤트 등록
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

  // 3. 직접 입력 방식 타이머 제어용 버튼 이벤트 등록 (요구사항 1-1, 2)
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
