/**
 * ==========================================================================
 * MUTE-WEB ASMR White Noise Web Application (Step 3 - Individual Mute & Play Control)
 * ==========================================================================
 * 
 * [역할 및 작동 방식]
 * 본 자바스크립트 파일은 ASMR 백색소음 플레이어의 'Step 3' 비즈니스 로직을 담당합니다.
 * 기존의 전체 제어 및 개별 볼륨 조절 기능을 온전히 유지하면서,
 * 각 음원별로 '개별 재생/정지 토글' 및 '개별 음소거(Mute) 온/오프' 제어가 가능하도록 대폭 확장되었습니다.
 * 
 * 주요 기능:
 * 1. 무료 라이센스 및 CORS 허용 고안정성 GitHub Raw MP3 음원 3개 관리
 * 2. 각 오디오 객체 초기화, 무한 반복(loop) 및 초기 볼륨(0.5) 설정
 * 3. 개별 볼륨 슬라이더 조절 시 실시간 오디오 볼륨 크기 동기화
 * 4. [New] 개별 재생/정지 기능: 각 음원을 독립적으로 켜고 끌 수 있는 기능 구현
 * 5. [New] 개별 음소거 기능: 특정 음원만 실시간으로 음소거(muted) 처리하고, 버튼 텍스트("음소거" <-> "음소거 해제") 동적 변환
 * 6. [전체 정지] 시 개별 음소거 상태는 '유지'되도록 설계 (유저 편의성 극대화, 상세 주석 기재)
 */

// ==========================================================================
// 1. 전역 상태 관리 (개별 재생 상태 및 음소거 상태 필드 추가)
// ==========================================================================

/**
 * @typedef {Object} AsmrSound
 * @property {string} id - 고유 식별자 (HTML 요소 매칭용)
 * @property {string} name - 사용자에게 표시될 이름
 * @property {string} url - 오디오 스트리밍용 GitHub Raw MP3 주소
 * @property {HTMLAudioElement|null} audioInstance - 실제 재생을 담당할 오디오 객체
 * @property {string} status - 현재 재생 상태 ('준비 대기 중', '준비 완료', '재생 중', '정지됨')
 * @property {number} volume - 개별 볼륨 크기 (0.0 ~ 1.0, 기본값: 0.5)
 * @property {boolean} isMuted - 개별 음소거 활성화 여부 (기본값: false)
 * @property {boolean} isPlaying - 개별 재생 중 여부 (기본값: false)
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
    isMuted: false, // 개별 음소거 기본 상태 (요구사항 1-2, 2-1)
    isPlaying: false // 개별 재생 기본 상태 (요구사항 1-2, 2-1)
  },
  {
    id: 'campfire',
    name: '따뜻한 장작 소리',
    url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/campfire.mp3',
    audioInstance: null,
    status: '준비 대기 중',
    volume: 0.5,
    isMuted: false,
    isPlaying: false
  },
  {
    id: 'stream',
    name: '맑은 시냇물 소리',
    url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/river.mp3',
    audioInstance: null,
    status: '준비 대기 중',
    volume: 0.5,
    isMuted: false,
    isPlaying: false
  }
];

// ==========================================================================
// 2. 오디오 초기화 및 기본값 매핑 함수
// ==========================================================================

/**
 * 각 오디오 소스 파일의 인스턴스를 생성하고 기본 루프, 볼륨 및 음소거 설정을 구성합니다.
 */
function initializeAudioSources() {
  asmrSounds.forEach((sound) => {
    // 1. 오디오 객체 동적 생성 및 소스 연결
    const audio = new Audio(sound.url);
    
    // 2. 백색소음을 위한 무한 반복 재생 활성화
    audio.loop = true;
    
    // 3. 현재 저장된 볼륨 기본값(0.5)으로 오디오 볼륨 설정
    audio.volume = sound.volume;

    // 4. 음소거 초기 상태(false) 동기화
    audio.muted = sound.isMuted;

    // 5. 오디오 인스턴스 전역 객체에 매핑
    sound.audioInstance = audio;

    // 6. 오디오 로딩 상태 이벤트 추적
    audio.addEventListener('canplaythrough', () => {
      if (sound.status === '준비 대기 중') {
        sound.status = '준비 완료';
        renderStatus();
      }
    });

    // 7. 에러 발생 시 처리
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
// 3. UI 렌더링 함수 (상태 배지 및 버튼 텍스트 실시간 매핑)
// ==========================================================================

/**
 * 현재 asmrSounds 배열에 저장된 상태를 화면의 텍스트 라벨과 버튼 텍스트에 반영합니다.
 */
function renderStatus() {
  asmrSounds.forEach((sound) => {
    // 1. 상태 배지 텍스트 및 데이터 속성 업데이트
    const labelElement = document.getElementById(`status-${sound.id}`);
    if (labelElement) {
      labelElement.textContent = sound.status;
      labelElement.setAttribute('data-status', sound.status);
    }

    // 2. 개별 재생/정지 버튼 텍스트 갱신 (요구사항 2-1)
    const toggleBtn = document.getElementById(`btn-toggle-${sound.id}`);
    if (toggleBtn) {
      toggleBtn.textContent = sound.isPlaying ? '정지' : '재생';
    }

    // 3. 개별 음소거 버튼 텍스트 갱신 (요구사항 2-2)
    const muteBtn = document.getElementById(`btn-mute-${sound.id}`);
    if (muteBtn) {
      muteBtn.textContent = sound.isMuted ? '음소거 해제' : '음소거';
      
      // 음소거 상태일 때 시각적 피드백을 위해 클래스 추가/제거 (선택)
      if (sound.isMuted) {
        muteBtn.classList.add('active-mute');
      } else {
        muteBtn.classList.remove('active-mute');
      }
    }
  });
}

// ==========================================================================
// 4. 오디오 제어 핵심 함수 (Step 3 확장)
// ==========================================================================

/**
 * 등록된 모든 ASMR 오디오를 동시에 재생하는 전체 제어 함수입니다.
 * 모든 음원의 개별 재생 플래그(isPlaying)를 true로 바꾸고 재생을 실행합니다.
 */
function playAllSounds() {
  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    
    if (!audio) return;

    // 현재 슬라이더 볼륨 및 음소거 상태 강제 동기화
    audio.volume = sound.volume;
    audio.muted = sound.isMuted;

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
 * 
 * [설계 결정 사항: 전체 정지 시 개별 음소거 상태 유지 여부] (요구사항 2-3)
 * - 결정: 개별 음소거(isMuted) 상태는 **'유지(Maintain)'**하도록 설계했습니다.
 * - 이유: 사용자가 특정 소리를 원치 않아 '음소거'를 설정해 두었다면, 
 *   전체 재생을 멈췄다가 다시 켤 때도 해당 소리는 계속 무음 상태로 유지되는 것이 
 *   사용자 친화적인 UX(사용자 경험)이기 때문입니다. 
 *   따라서 개별 재생 시간과 재생 상태만 초기화하고, 음소거 잠금 상태는 온전히 보존합니다.
 */
function stopAllSounds() {
  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    
    if (!audio) return;

    // 1. 오디오 재생 정지
    audio.pause();
    
    // 2. 재생 시점 초기화 (요구사항 3-3)
    audio.currentTime = 0;
    
    // 3. 재생 상태 플래그 초기화
    sound.isPlaying = false;
    sound.status = '정지됨';

    // * 음소거 상태(sound.isMuted)는 초기화하지 않고 그대로 유지합니다!
  });
  
  renderStatus();
}

/**
 * 특정 단일 사운드의 재생/정지 상태를 토글합니다. (요구사항 2-1)
 * 
 * @param {string} soundId - 대상 사운드 ID
 */
function toggleSoundPlay(soundId) {
  const sound = asmrSounds.find(s => s.id === soundId);
  if (!sound || !sound.audioInstance) return;

  const audio = sound.audioInstance;

  if (sound.isPlaying) {
    // 재생 중 -> 정지
    audio.pause();
    sound.isPlaying = false;
    sound.status = '정지됨';
  } else {
    // 정지 중 -> 재생
    audio.volume = sound.volume; // 최신 슬라이더 볼륨 반영
    audio.muted = sound.isMuted; // 최신 음소거 상태 반영
    
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
 * 특정 단일 사운드의 음소거 상태를 토글합니다. (요구사항 2-2)
 * 음소거 해제 시, 기존에 조절해 둔 슬라이더 볼륨 크기로 자동 복원됩니다.
 * 
 * @param {string} soundId - 대상 사운드 ID
 */
function toggleSoundMute(soundId) {
  const sound = asmrSounds.find(s => s.id === soundId);
  if (!sound || !sound.audioInstance) return;

  const audio = sound.audioInstance;

  // 1. 음소거 토글 처리 (true <-> false)
  sound.isMuted = !sound.isMuted;
  
  // 2. 오디오 인스턴스의 실제 muted 프로퍼티 동기화 (HTML5 오디오 기능 활용)
  audio.muted = sound.isMuted;

  // 3. 만약 음소거 해제(false) 상태가 되었다면, 원래 슬라이더 볼륨으로 음량이 유지됨을 확인
  if (!sound.isMuted) {
    audio.volume = sound.volume;
  }

  console.log(`[음소거 토글] ${sound.name} : ${sound.isMuted ? '음소거 설정됨' : '음소거 해제됨 (볼륨: ' + Math.round(sound.volume * 100) + '%)'}`);
  
  renderStatus();
}

/**
 * 특정 오디오 소스의 볼륨 크기를 실시간 동기화합니다.
 * 
 * @param {string} soundId - 대상 사운드 ID
 * @param {number} newVolume - 변경할 볼륨 값 (0.0 ~ 1.0)
 */
function updateVolume(soundId, newVolume) {
  const sound = asmrSounds.find(s => s.id === soundId);
  
  if (sound) {
    sound.volume = newVolume;
    
    if (sound.audioInstance) {
      sound.audioInstance.volume = newVolume;
    }
  }
}

// ==========================================================================
// 5. 이벤트 바인딩 및 어플리케이션 진입점
// ==========================================================================

/**
 * HTML 요소들과 제어 로직 간의 이벤트 리스너 바인딩을 총괄합니다.
 */
function setupEventListeners() {
  // 1. 전체 제어 버튼 이벤트 등록
  const playAllButton = document.getElementById('btn-play-all');
  const stopAllButton = document.getElementById('btn-stop-all');

  if (playAllButton) {
    playAllButton.addEventListener('click', playAllSounds);
  }

  if (stopAllButton) {
    stopAllButton.addEventListener('click', stopAllSounds);
  }

  // 2. 각 사운드별 개별 엘리먼트(슬라이더, 재생토글, 음소거토글) 이벤트 등록
  asmrSounds.forEach((sound) => {
    // A. 볼륨 슬라이더
    const sliderElement = document.getElementById(`volume-${sound.id}`);
    if (sliderElement) {
      sliderElement.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        updateVolume(sound.id, value);
      });
    }

    // B. 개별 재생/정지 토글 버튼 (요구사항 1-2, 2-1)
    const toggleButton = document.getElementById(`btn-toggle-${sound.id}`);
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        toggleSoundPlay(sound.id);
      });
    }

    // C. 개별 음소거 버튼 (요구사항 1-1, 2-2)
    const muteButton = document.getElementById(`btn-mute-${sound.id}`);
    if (muteButton) {
      muteButton.addEventListener('click', () => {
        toggleSoundMute(sound.id);
      });
    }
  });
}

// 문서 로드가 완료되면 초기화 및 바인딩 가동
document.addEventListener('DOMContentLoaded', () => {
  initializeAudioSources();
  setupEventListeners();
});
