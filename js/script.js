/**
 * ==========================================================================
 * MUSE-WEB ASMR White Noise Web Application (Step 1 - Core Functionality)
 * ==========================================================================
 * 
 * [역할 및 작동 방식]
 * 본 자바스크립트 파일은 서버와 데이터베이스 없이 프론트엔드에서 동작하는 
 * ASMR 백색소음 플레이어의 핵심 비즈니스 로직을 담당합니다.
 * 
 * 주요 기능:
 * 1. 무료 라이센스 ASMR 오디오 소스 3개 관리 (빗소리, 장작 소리, 시냇물 소리)
 * 2. 오디오 객체(Audio Element) 초기화 및 무한 반복(loop) 설정
 * 3. 전체 재생 및 전체 정지 기능 제어 및 동시 트래킹
 * 4. 각 오디오 소스의 실시간 작동 상태(준비됨, 재생 중, 정지됨)를 화면에 반영
 */

// ==========================================================================
// 1. 전역 상태 관리 (최소화)
// ==========================================================================

/**
 * @typedef {Object} AsmrSound
 * @property {string} id - 고유 식별자
 * @property {string} name - 사용자에게 표시될 이름
 * @property {string} url - 오디오 스트리밍 MP3 주소
 * @property {HTMLAudioElement|null} audioInstance - 실제 재생을 담당할 오디오 인스턴스
 * @property {string} status - 현재 재생 상태 ('준비 대기 중', '준비 완료', '재생 중', '정지됨')
 */

/** @type {AsmrSound[]} */
const asmrSounds = [
  {
    id: 'rain',
    name: '차분한 빗소리',
    url: 'https://www.soundjay.com/nature/sounds/rain-07.mp3',
    audioInstance: null,
    status: '준비 대기 중'
  },
  {
    id: 'campfire',
    name: '따뜻한 장작 소리',
    url: 'https://www.soundjay.com/nature/sounds/camp-fire-1.mp3',
    audioInstance: null,
    status: '준비 대기 중'
  },
  {
    id: 'stream',
    name: '맑은 시냇물 소리',
    url: 'https://www.soundjay.com/nature/sounds/river-1.mp3',
    audioInstance: null,
    status: '준비 대기 중'
  }
];

// ==========================================================================
// 2. 오디오 및 UI 초기화 함수
// ==========================================================================

/**
 * 각 오디오 소스 파일의 인스턴스를 생성하고 무한 루프 설정을 구성합니다.
 * HTMLAudioElement의 이벤트 리스너를 활용해 로딩 완료 시 상태를 업데이트합니다.
 */
function initializeAudioSources() {
  asmrSounds.forEach((sound) => {
    // 1. 오디오 객체 동적 생성 및 소스 연결
    const audio = new Audio(sound.url);
    
    // 2. 백색소음을 위한 무한 반복 재생 활성화 (요구사항 3-2)
    audio.loop = true;
    
    // 3. 크로스오리진 스트리밍 허용 설정 (필요시 대비)
    audio.crossOrigin = 'anonymous';

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
    // 각 사운드의 ID를 기준으로 매칭되는 HTML 라벨 요소를 찾음
    const labelElement = document.getElementById(`status-${sound.id}`);
    
    if (labelElement) {
      labelElement.textContent = sound.status;
      
      // 상태별 스타일 구분을 위해 데이터 속성 업데이트 (선택 사항)
      labelElement.setAttribute('data-status', sound.status);
    }
  });
}

// ==========================================================================
// 4. 오디오 제어 핵심 함수
// ==========================================================================

/**
 * 등록된 모든 ASMR 오디오를 동시에 재생하는 제어 함수입니다.
 * 비동기 오디오 재생(Promise) 정책을 준수하여 구현되었습니다.
 */
function playAllSounds() {
  asmrSounds.forEach((sound) => {
    const audio = sound.audioInstance;
    
    if (!audio) return;

    // 오디오 재생 시도 (브라우저 보안상 유저 상호작용 후 실행되어야 함)
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

// ==========================================================================
// 5. 이벤트 바인딩 및 어플리케이션 진입점
// ==========================================================================

/**
 * HTML 요소들과 제어 함수들을 연결하는 이벤트 리스너를 설정합니다.
 */
function setupEventListeners() {
  const playAllButton = document.getElementById('btn-play-all');
  const stopAllButton = document.getElementById('btn-stop-all');

  // 전체 재생 이벤트 바인딩
  if (playAllButton) {
    playAllButton.addEventListener('click', playAllSounds);
  }

  // 전체 정지 이벤트 바인딩
  if (stopAllButton) {
    stopAllButton.addEventListener('click', stopAllSounds);
  }
}

// 문서 로드가 완료되면 오디오 초기화 및 이벤트 리스너 실행
document.addEventListener('DOMContentLoaded', () => {
  initializeAudioSources();
  setupEventListeners();
});
