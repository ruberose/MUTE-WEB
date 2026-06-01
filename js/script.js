/**
 * ==========================================================================
 * MUTE-WEB ASMR White Noise Web Application (Step 2 - Individual Volume Sliders)
 * ==========================================================================
 * 
 * [역할 및 작동 방식]
 * 본 자바스크립트 파일은 ASMR 백색소음 플레이어의 'Step 2' 비즈니스 로직을 담당합니다.
 * 기존의 전체 재생, 전체 정지, 무한 반복(Loop) 기능을 온전히 보존하면서,
 * 각 음원별로 볼륨을 개별적이고 독립적으로 조절할 수 있도록 리팩토링되었습니다.
 * 
 * 주요 기능:
 * 1. 무료 라이센스 및 CORS 허용 고안정성 GitHub Raw MP3 음원 3개 관리
 * 2. 각 오디오 객체(Audio Element) 초기화, 무한 반복(loop) 및 초기 볼륨(0.5) 설정
 * 3. 개별 볼륨 슬라이더(input type="range") 변경에 따른 실시간 볼륨 업데이트 매핑
 * 4. 전체 재생 시 현재 슬라이더가 지닌 볼륨 설정 그대로 재생 시작
 * 5. 각 오디오 소스의 실시간 작동 상태(준비 완료, 재생 중, 정지됨) UI 연동
 */

// ==========================================================================
// 1. 전역 상태 관리 (볼륨 상태 필드 추가)
// ==========================================================================

/**
 * @typedef {Object} AsmrSound
 * @property {string} id - 고유 식별자 (HTML 요소의 ID 매칭용)
 * @property {string} name - 사용자에게 표시될 이름
 * @property {string} url - 오디오 스트리밍용 GitHub Raw MP3 주소
 * @property {HTMLAudioElement|null} audioInstance - 실제 재생을 담당할 오디오 객체
 * @property {string} status - 현재 재생 상태 ('준비 대기 중', '준비 완료', '재생 중', '정지됨')
 * @property {number} volume - 개별 볼륨 크기 (0.0 ~ 1.0, 기본값: 0.5)
 */

/** @type {AsmrSound[]} */
const asmrSounds = [
  {
    id: 'rain',
    name: '차분한 빗소리',
    url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/rain.mp3',
    audioInstance: null,
    status: '준비 대기 중',
    volume: 0.5 // 개별 기본 볼륨 설정 (요구사항 2-1)
  },
  {
    id: 'campfire',
    name: '따뜻한 장작 소리',
    url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/campfire.mp3',
    audioInstance: null,
    status: '준비 대기 중',
    volume: 0.5 // 개별 기본 볼륨 설정 (요구사항 2-1)
  },
  {
    id: 'stream',
    name: '맑은 시냇물 소리',
    url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/river.mp3',
    audioInstance: null,
    status: '준비 대기 중',
    volume: 0.5 // 개별 기본 볼륨 설정 (요구사항 2-1)
  }
];

// ==========================================================================
// 2. 오디오 초기화 및 볼륨 매핑 함수
// ==========================================================================

/**
 * 각 오디오 소스 파일의 인스턴스를 생성하고 기본 루프 및 볼륨 강도를 설정합니다.
 * 에러 방지를 위해 CORS 요청 방식을 제거한 단순 미디어 요청 방식으로 통신합니다.
 */
function initializeAudioSources() {
  asmrSounds.forEach((sound) => {
    // 1. 오디오 객체 동적 생성 및 소스 연결
    const audio = new Audio(sound.url);
    
    // 2. 백색소음을 위한 무한 반복 재생 활성화 (요구사항 3-2)
    audio.loop = true;
    
    // 3. 현재 저장된 볼륨 기본값(0.5)으로 오디오 볼륨 설정 (요구사항 2-3)
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
 * 현재 asmrSounds 배열에 저장된 오디오 상태를 읽어와 
 * HTML 화면의 해당 텍스트 라벨에 실시간으로 반영합니다.
 */
function renderStatus() {
  asmrSounds.forEach((sound) => {
    const labelElement = document.getElementById(`status-${sound.id}`);
    
    if (labelElement) {
      labelElement.textContent = sound.status;
      labelElement.setAttribute('data-status', sound.status);
    }
  });
}

// ==========================================================================
// 4. 오디오 및 볼륨 제어 핵심 함수
// ==========================================================================

/**
 * 등록된 모든 ASMR 오디오를 동시에 재생하는 제어 함수입니다.
 * 비동기 오디오 재생(Promise) 정책을 준수하여 구현되었습니다.
 * 재생할 때, 각 오디오 객체는 현재 슬라이더가 설정한 최신 볼륨 값을 그대로 반영합니다. (요구사항 2-3)
 */
function playAllSounds() {
  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    
    if (!audio) return;

    // 재생 직전, 전역 상태의 볼륨 값을 다시 한번 오디오 객체에 동기화
    audio.volume = sound.volume;

    // 오디오 재생 시도 (브라우저 정책에 따라 사용자 액션 이후 정상 동작 가능)
    audio.play()
      .then(() => {
        sound.status = '재생 중';
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
 */
function stopAllSounds() {
  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    
    if (!audio) return;

    // 1. 오디오 일시정지
    audio.pause();
    
    // 2. 재생 시점을 처음 위치로 초기화 (요구사항 3-3)
    audio.currentTime = 0;
    
    // 3. 상태 값 갱신 및 화면 출력
    sound.status = '정지됨';
  });
  
  renderStatus();
}

/**
 * 특정 오디오 소스의 볼륨을 업데이트하는 함수입니다. (요구사항 2-2)
 * 
 * @param {string} soundId - 변경 대상 사운드 ID
 * @param {number} newVolume - 변경할 새로운 볼륨 값 (0.0 ~ 1.0)
 */
function updateVolume(soundId, newVolume) {
  // 전역 상태 배열에서 매칭되는 사운드 객체 탐색
  const sound = asmrSounds.find(s => s.id === soundId);
  
  if (sound) {
    // 1. 상태 값 업데이트
    sound.volume = newVolume;
    
    // 2. 오디오 인스턴스가 존재할 경우 실시간으로 오디오 볼륨값 반영
    if (sound.audioInstance) {
      sound.audioInstance.volume = newVolume;
    }
    
    console.log(`[볼륨 조절] ${sound.name}의 볼륨이 ${Math.round(newVolume * 100)}%로 설정되었습니다.`);
  }
}

// ==========================================================================
// 5. 이벤트 바인딩 및 어플리케이션 진입점
// ==========================================================================

/**
 * HTML 요소들과 제어 함수들을 연결하는 이벤트 리스너를 구성합니다.
 * 전체 재생/정지 버튼 외에, 각 볼륨 슬라이더의 input 이벤트를 실시간 바인딩합니다. (요구사항 2-2)
 */
function setupEventListeners() {
  // 1. 버튼 요소 획득 및 리스너 등록
  const playAllButton = document.getElementById('btn-play-all');
  const stopAllButton = document.getElementById('btn-stop-all');

  if (playAllButton) {
    playAllButton.addEventListener('click', playAllSounds);
  }

  if (stopAllButton) {
    stopAllButton.addEventListener('click', stopAllSounds);
  }

  // 2. 개별 오디오 슬라이더(input) 변경 이벤트 바인딩 (요구사항 2-2)
  asmrSounds.forEach((sound) => {
    const sliderElement = document.getElementById(`volume-${sound.id}`);
    
    if (sliderElement) {
      // 슬라이더 조절 중 즉각적으로 반영되도록 'input' 이벤트를 추적
      sliderElement.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        updateVolume(sound.id, value);
      });
    }
  });
}

// 문서 로드가 완료되면 오디오 초기화 및 이벤트 리스너 실행
document.addEventListener('DOMContentLoaded', () => {
  initializeAudioSources();
  setupEventListeners();
});
