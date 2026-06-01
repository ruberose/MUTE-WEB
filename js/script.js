/**
 * ==========================================================================
 * MUTE-WEB ASMR White Noise Web Application (Step 4 - Toggle Switch & Timer)
 * ==========================================================================
 * 
 * [역할 및 작동 방식]
 * 본 자바스크립트 파일은 ASMR 백색소음 플레이어의 'Step 4' 비즈니스 로직을 담당합니다.
 * 기존의 번잡했던 개별 재생 및 음소거 버튼들을 단 하나의 [ON/OFF] 토글 스위치로 통합하여 
 * UI 시각적 명료성을 확보했으며, 편안한 수면 및 휴식을 위한 [페이드아웃 타이머] 기능을 구현했습니다.
 * 
 * 주요 기능:
 * 1. 무료 라이센스 및 CORS 허용 고안정성 GitHub Raw MP3 음원 3개 관리
 * 2. 각 오디오 객체 초기화, 무한 반복(loop) 및 초기 볼륨(0.5) 설정
 * 3. 개별 볼륨 슬라이더 조절 시 실시간 오디오 볼륨 크기 동기화
 * 4. [New] 통합 ON/OFF 스위치: 유저가 켜고 끄는 직관적인 단일 버튼 제어 (기존 슬라이더 볼륨 값 완전 유지)
 * 5. [New] 오디오 카운트다운 타이머: 안 함 / 1분 / 5분 / 10분 설정 및 실시간 남은 시간 표시
 * 6. [New] 10초 페이드아웃(Fade-out) 효과: 타이머 종료 10초 전부터 전체 사운드가 선형적으로 서서히 감소하여 소리가 뚝 끊기는 불쾌감 방지
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
    isPlaying: false // ON/OFF 통합 제어를 위한 상태 (요구사항 1-1, 3-1)
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

// 타이머 관련 제어 변수들 (요구사항 2, 3-2, 3-3)
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

    // 2. 통합 ON/OFF 스위치 버튼 텍스트 및 클래스 갱신 (요구사항 1-1, 3-1)
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
// 4. 오디오 제어 핵심 함수 (Step 4 통합 토글 개편)
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

    // 슬라이더에 세팅되어 있는 기존 볼륨 크기 그대로 소리 세팅 (요구사항 3-1)
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
 * 특정 단일 사운드의 [ON/OFF] 토글 상태를 전환합니다. (요구사항 3-1)
 * 볼륨 슬라이더 값은 엄격하게 유지한 채 해당 사운드만 재생하거나 정지시킵니다.
 * 
 * @param {string} soundId - 대상 사운드 ID
 */
function toggleSoundSwitch(soundId) {
  const sound = asmrSounds.find(s => s.id === soundId);
  if (!sound || !sound.audioInstance) return;

  const audio = sound.audioInstance;

  // 타이머가 동작하여 감쇠가 이루어지던 중 토글 스위치 변경 시 원격 볼륨 복구
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
    
    // 타이머 페이드아웃 감쇠 진행 중이 아닐 때만 실제 오디오 객체 볼륨을 동기화
    if (sound.audioInstance && !isFadingOut) {
      sound.audioInstance.volume = newVolume;
    }
  }
}

// ==========================================================================
// 5. 페이드아웃 오디오 타이머 로직 (Step 4 핵심 기능 추가)
// ==========================================================================

/**
 * 타이머 카운트다운을 가동하는 함수입니다. (요구사항 3-2)
 * 기존 작동하던 모든 타이머 인터벌을 깨끗이 청소하고 지정한 시간으로 카운트다운을 시작합니다.
 * 
 * @param {number} minutes - 설정할 타이머 분 단위 시간 (0 이면 타이머 끔)
 */
function startAudioTimer(minutes) {
  // 1. 기존 동작 중이던 타이머 및 페이드아웃 상태 초기화
  clearAllIntervals();
  resetFadeOutVolume();

  if (minutes === 0) {
    updateTimerDisplay('없음');
    console.log('[타이머] 타이머 기능이 비활성화되었습니다.');
    return;
  }

  // 2. 남은 시간 초 단위 환산 (테스트 및 기능 검증용)
  timerSecondsRemaining = minutes * 60;
  updateTimerDisplay(formatTime(timerSecondsRemaining));
  console.log(`[타이머] ${minutes}분 타이머가 시작되었습니다.`);

  // 3. 1초마다 카운트다운을 수행하는 타이머 인터벌 등록
  countdownIntervalId = setInterval(() => {
    timerSecondsRemaining--;

    // A. 남은 시간 텍스트 업데이트
    updateTimerDisplay(formatTime(timerSecondsRemaining));

    // B. 페이드아웃 동작 감지: 타이머 종료 마지막 10초 전부터 작동 (요구사항 3-3)
    if (timerSecondsRemaining <= 10 && timerSecondsRemaining > 0) {
      applyFadeOutEffect(timerSecondsRemaining);
    }

    // C. 타이머 시간 완료 시
    if (timerSecondsRemaining <= 0) {
      console.log('[타이머] 설정된 시간이 완료되어 모든 소리가 자동으로 정지됩니다.');
      clearAllIntervals();
      stopAllSounds(); // 모든 오디오 일시정지 (요구사항 3-3)
      updateTimerDisplay('완료');
    }
  }, 1000);
}

/**
 * 타이머 종료 전 마지막 10초 동안 선형적으로 볼륨을 점차 낮추는 페이드아웃 감쇠 함수입니다. (요구사항 3-3)
 * 
 * @param {number} secondsLeft - 남은 초 단위 시간 (1~10)
 */
function applyFadeOutEffect(secondsLeft) {
  isFadingOut = true;

  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    if (audio && sound.isPlaying) {
      // 10초 남았을 때 100%, 9초 남았을 때 90%, ..., 1초 남았을 때 10% 비율로 볼륨을 유저 설정 슬라이더 볼륨에서 선형 감쇄
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
      audio.volume = sound.volume; // 유저 설정 볼륨 상태로 완전 롤백
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
  
  // 두 자리 숫자로 패딩
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

    // B. 통합 [ON/OFF] 토글 스위치 버튼 (요구사항 1-1, 3-1)
    const switchButton = document.getElementById(`btn-switch-${sound.id}`);
    if (switchButton) {
      switchButton.addEventListener('click', () => {
        toggleSoundSwitch(sound.id);
      });
    }
  });

  // 3. 타이머 제어용 버튼 이벤트 등록 (요구사항 2, 3-2)
  const btnTimerOff = document.getElementById('btn-timer-off');
  const btnTimer1m = document.getElementById('btn-timer-1m');
  const btnTimer5m = document.getElementById('btn-timer-5m');
  const btnTimer10m = document.getElementById('btn-timer-10m');

  if (btnTimerOff) {
    btnTimerOff.addEventListener('click', () => startAudioTimer(0));
  }
  if (btnTimer1m) {
    btnTimer1m.addEventListener('click', () => startAudioTimer(1)); // 테스트를 위한 1분
  }
  if (btnTimer5m) {
    btnTimer5m.addEventListener('click', () => startAudioTimer(5)); // 5분
  }
  if (btnTimer10m) {
    btnTimer10m.addEventListener('click', () => startAudioTimer(10)); // 10분
  }
}

// 문서 로드가 완료되면 오디오 초기화 및 이벤트 리스너 리얼타임 실행
document.addEventListener('DOMContentLoaded', () => {
  initializeAudioSources();
  setupEventListeners();
});
