/**
 * ==========================================================================
 * MUTE-WEB ASMR White Noise Web Application (Step 10 - Isolated Storage & Focus Mode)
 * ==========================================================================
 * 
 * [역할 및 작동 방식]
 * 본 자바스크립트 파일은 ASMR 백색소음 플레이어의 'Step 10' 전체 비즈니스 엔진 및 Focus Mode를 담당합니다.
 * 기존의 테마별 개별 키 분리형 LocalStorage(예: 'mute_settings_nature') 저장/로드 파이프라인을 온전히 계승하며,
 * 불멍 및 몰입 감상을 극대화하기 위해 메인 아레나의 각 주요 제어 구역(항목)마다 개별 UI 임시 제거(✕) 단추를 배치하고,
 * 중앙의 대형 멍 공간을 클릭하거나 마스터 복구 버튼을 누를 시 숨겨졌던 모든 UI가 스르륵 복원되는 
 * 고품격 Focus Mode(Cinema Mode) 엔진을 새롭게 추가하여 융합 구현하였습니다.
 * 
 * 주요 기능:
 * 1. 테마별 사운드 데이터 구조화 (nature, fantasy, horror) 관리
 * 2. 테마 셋업 파이프라인(setupTheme) 및 UI 렌더링 호환
 * 3. 테마별 개별 Key 분리형 LocalStorage 자동 저장 엔진 (saveSettings)
 * 4. 신규 테마 접속 시 볼륨 0.5, 전체 ON 기본값 초기화 로드 엔진 (loadSettings)
 * 5. 홈 복귀(👈 버튼) 시 안전 자동 저장 및 메모리 격리 소멸 시퀀스 (goToThemeSelectPage)
 * 6. [New] Focus Mode (개별 UI 임시 가리기 및 복원) 제어 핸들러 (hideUiSegment, restoreAllUiSegments):
 *    - 상단 제어부, 하단 타이머부, 최상단 버튼부에 개별 ✕ 단추 바인딩 및 부드러운 소멸 구현
 *    - 대형 멍 타겟 공간 클릭 또는 복구 힌트 단추 클릭 시 가려졌던 UI 일괄 복구 결합
 *    - 테마 전환 및 홈 복귀 시 UI 상태 일괄 자동 복구 예외 설계 완료
 * 7. 마스터 볼륨 슬라이더 및 타이머/페이드아웃 통합 제어 엔진 완전 계승
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
    title: "자연",
    bgName: "모닥불",
    emoji: "🌊",
    visualText: "마음의 평화를 위한 대형 비주얼 멍 타겟 공간",
    sounds: [
      {
        id: 'rain',
        name: '🌧️ 차분한 빗소리',
        url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/rain.mp3'
      },
      {
        id: 'campfire',
        name: '🔥 따뜻한 장작 소리',
        url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/campfire.mp3'
      },
      {
        id: 'stream',
        name: '🏞️ 맑은 시냇물 소리',
        url: 'https://raw.githubusercontent.com/karthiknvd/noctune/master/sounds/river.mp3'
      }
    ]
  },
  fantasy: {
    title: "판타지",
    bgName: "마법 상점",
    emoji: "🔮",
    visualText: "신비롭고 몽환적인 판타지 상점 속 멍 타겟 공간",
    sounds: [
      {
        id: 'fantasy_melody',
        name: '✨ 신비한 선율',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      },
      {
        id: 'clock',
        name: '🕰️ 시계탑 소리',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
      },
      {
        id: 'potion',
        name: '🧪 물약 끓는 소리',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
      }
    ]
  },
  horror: {
    title: "공포",
    bgName: "폐가",
    emoji: "👻",
    visualText: "서늘한 기운이 맴도는 으스스한 폐가 속 멍 타겟 공간",
    sounds: [
      {
        id: 'spooky_wind',
        name: '💨 으스스한 바람',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
      },
      {
        id: 'creaky_door',
        name: '🚪 문 삐걱 소리',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
      },
      {
        id: 'footstep',
        name: '👣 발소리',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
      }
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
let asmrSounds = []; // 선택한 테마에 의해 동적으로 구성 및 채워지는 활성 사운드 리스트

// 유저가 선택한 테마 ID를 저장하는 전역 변수
let currentThemeId = ''; 

// 마스터 볼륨 및 타이머 제어용 전역 변수
let masterVolume = 1.0; // 마스터 볼륨 기본값
let timerSecondsRemaining = 0; // 남은 전체 초
let countdownIntervalId = null; // 카운트다운 타이머 인터벌 ID
let isFadingOut = false; // 현재 페이드아웃 감쇄 동작이 가동 중인지 여부

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
  console.log(`[테마 셋업] 선택된 테마: ${themeId}에 따라 믹서 환경을 동적 빌드합니다.`);

  // 1. 오디오 데이터 매핑 (기존 오디오 주소를 새 테마 URL로 완전히 교체 및 초기화)
  asmrSounds = themeInfo.sounds.map(sound => ({
    id: sound.id,
    name: sound.name,
    url: sound.url,
    audioInstance: null,
    status: '준비 대기 중',
    volume: 0.5,
    isPlaying: false
  }));

  // 2. 메인 화면 멍 타겟 이름 및 이모지/텍스트 갱신
  const appTitle = document.getElementById('app-title');
  const currentBgName = document.getElementById('current-bg-name');
  const visualEmoji = document.getElementById('theme-visual-emoji');
  const visualText = document.getElementById('theme-visual-text');

  if (appTitle) appTitle.textContent = `MUTE-WEB [${themeInfo.title}]`;
  if (currentBgName) currentBgName.textContent = themeInfo.bgName;
  if (visualEmoji) visualEmoji.textContent = themeInfo.emoji;
  if (visualText) visualText.textContent = themeInfo.visualText;

  // 3. 서랍장 헤더 타이틀에 현재 테마 이름 바인딩
  const drawerHeading = document.getElementById('drawer-heading');
  if (drawerHeading) {
    drawerHeading.textContent = `⚙️ ${themeInfo.title} 테마 상세 믹서`;
  }

  // 4. 설정 서랍 내부 오디오 조절 UI 및 라벨 텍스트 동적 생성 주입
  renderAudioControls();

  // 5. 교체된 URL 기반 신규 오디오 인스턴스 생성 및 스트리밍 개시
  initializeAudioSources();

  // 6. 새로 구성된 동적 엘리먼트들에 대하여 개별 이벤트 리스너 재바인딩
  setupAudioEventListeners();
}

/**
 * 가동 중인 오디오 엔진 및 취침 예약 타이머를 안전하고 깨끗하게 정지시키는 공통 리셋 모듈
 * 테마를 바꾸거나 홈 화면으로 복귀할 때 중복 백그라운드 오디오 및 유령 소리를 원천 소거합니다.
 */
function resetEngine() {
  console.log('[엔진 리셋] 가동 중인 오디오 정지 및 취침 타이머 초기화를 수행합니다.');

  // 1. 모든 가동 중인 오디오 스트리밍을 정지
  stopAllSounds();

  // 2. 가동 중인 카운트다운 타이머 인터벌 취소 및 UI 표시 리셋
  handleCancelTimer();

  // 3. 기존 오디오 인스턴스를 명시적으로 일시정지 및 완전 해제 (유령 오디오 방지)
  asmrSounds.forEach((sound) => {
    if (sound.audioInstance) {
      sound.audioInstance.pause();
      sound.audioInstance = null;
    }
  });
  asmrSounds = [];
}

/**
 * 유저가 첫 화면에서 특정 테마를 선택했을 때 동작하는 이벤트 트리거 및 화면 전환 처리기
 * 
 * @param {string} themeId - 선택된 테마 식별자 ('nature', 'fantasy', 'horror')
 */
function selectTheme(themeId) {
  if (!themeData[themeId]) {
    console.error(`[에러] 존재하지 않는 테마 ID입니다: ${themeId}`);
    return;
  }

  // 1. 기존에 돌던 테마가 있다면 안전하고 깨끗하게 소거
  resetEngine();

  // 2. 새로운 테마 UI 및 오디오 셋업 파이프라인 가동
  setupTheme(themeId);

  // 3. LocalStorage 로드: 해당 테마에 저장되어 있는 세팅값이 있다면 강제 복구
  loadSettings();

  // 4. [New] 테마를 변경하여 신규 진입할 때는 가려진 모든 UI를 깨끗하게 원상복구하여 노출
  restoreAllUiSegments();

  // 5. 화면 전환 처리 (theme-select-page 숨김, mixer-page 노출)
  const themePage = document.getElementById('theme-select-page');
  const mixerPage = document.getElementById('mixer-page');
  
  if (themePage) themePage.style.display = 'none';
  if (mixerPage) mixerPage.style.display = 'block';
}

/**
 * 메인 믹서 화면에서 좌측 상단 '👈 테마 선택으로' 버튼 클릭 시 
 * 작동 중인 모든 리소스를 안전하게 강제 자동 저장한 후 초기 테마 선택 화면으로 복귀합니다.
 */
function goToThemeSelectPage() {
  console.log('[화면 복귀] 테마 선택 페이지로 복귀를 시작합니다.');

  // 1. 유저가 복귀 버튼을 누를 때 현재 상태를 안전하게 선제적으로 자동 저장
  saveSettings();

  // 2. 공통 안전 리셋 엔진 호출 (오디오 소멸 및 타이머 취소)
  resetEngine();

  // 3. [New] 홈으로 나갈 때는 가려졌던 메인 아레나의 개별 UI들을 원래 상태로 일괄 복구
  restoreAllUiSegments();

  // 4. 전역 테마 ID 리셋
  currentThemeId = '';

  // 5. 화면 스위칭 (mixer-page 숨김, theme-select-page 노출)
  const themePage = document.getElementById('theme-select-page');
  const mixerPage = document.getElementById('mixer-page');
  
  if (themePage) themePage.style.display = 'flex';
  if (mixerPage) mixerPage.style.display = 'none';

  // 6. 설정 서랍(Drawer)이 열려있다면 자연스럽게 닫기 처리
  toggleSettingsDrawer(false);
}

/**
 * 선택된 테마의 sounds 배열 데이터를 바탕으로 
 * 설정 서랍 내의 `#sounds-list` 영역에 개별 오디오 제어 UI 엘리먼트들을 동적으로 주입합니다.
 */
function renderAudioControls() {
  const soundsList = document.getElementById('sounds-list');
  if (!soundsList) return;

  // 기존 렌더링 내용 소거
  soundsList.innerHTML = '';

  asmrSounds.forEach((sound) => {
    // <li> 엘리먼트 생성
    const li = document.createElement('li');
    li.className = 'audio-control-item';
    li.id = `item-${sound.id}`;

    // 내부 HTML 내용 템플릿 리터럴로 조합
    li.innerHTML = `
      <span class="sound-label" id="label-${sound.id}">${sound.name}</span>
      <div class="audio-control-row">
        <input type="range" class="volume-slider" id="volume-${sound.id}" min="0" max="1" step="0.01" value="${sound.volume}" aria-label="${sound.name} 볼륨 조절">
        <button type="button" class="btn-toggle-switch" id="btn-switch-${sound.id}">OFF</button>
        <span class="sound-status" id="status-${sound.id}" data-status="${sound.status}">${sound.status}</span>
      </div>
    `;

    soundsList.appendChild(li);
  });
}

// ==========================================================================
// 3. 오디오 초기화 및 기본값 매핑 함수
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
// 4. LocalStorage 유저 설정 저장 및 로드 모듈 (테마별 독립적 격리 공간)
// ==========================================================================

/**
 * 테마별 개별 독립 Key 기반의 LocalStorage 자동 저장 함수
 * 유저가 볼륨을 조정하거나 스위치를 건드릴 때마다, 'mute_settings_nature'와 같이 
 * 테마 ID가 접미사로 붙은 별도 키에 격리하여 영구 백업을 수행합니다.
 */
function saveSettings() {
  if (!currentThemeId) return; // 선택된 테마가 없으면 저장하지 않음

  try {
    const storageKey = `mute_settings_${currentThemeId}`;

    const userSettings = {
      masterVolume: masterVolume,
      sounds: asmrSounds.map((sound) => ({
        id: sound.id,
        volume: sound.volume,
        isPlaying: sound.isPlaying
      }))
    };

    localStorage.setItem(storageKey, JSON.stringify(userSettings));
    console.log(`[설정 자동 저장] '${storageKey}' 격리 키에 유저 설정이 안전하게 저장되었습니다.`);
  } catch (error) {
    console.error('[설정 저장 실패] LocalStorage 접근 에러:', error);
  }
}

/**
 * 격리 키 로드 및 미경험 유저 기본값(볼륨 0.5, 모두 ON) 예외 처리 로드 함수
 * 선택 테마 ID에 맵핑되는 'mute_settings_${currentThemeId}' 키로부터 설정을 불러와 복원합니다.
 * 저장된 데이터가 없는 신규 접속 상태라면 타 테마 데이터를 간섭하지 않고 안전하게 볼륨 0.5 + 모두 ON으로 초기화합니다.
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
      if (masterSlider) {
        masterSlider.value = 1.0;
      }

      asmrSounds.forEach((sound) => {
        sound.volume = 0.5;
        sound.isPlaying = true;

        const sliderElement = document.getElementById(`volume-${sound.id}`);
        if (sliderElement) {
          sliderElement.value = 0.5;
        }

        if (sound.audioInstance) {
          sound.audioInstance.volume = getCalculatedVolume(sound);

          sound.audioInstance.play()
            .then(() => {
              sound.status = '재생 중';
              renderStatus();
            })
            .catch((autoplayError) => {
              console.warn(`[자동재생 안전 차단] 브라우저 정책으로 '${sound.name}' 재생이 대기 상태입니다. (유저 상호작용 필요)`);
              sound.status = '준비 완료'; 
              renderStatus();
            });
        }
      });

      renderStatus();
      console.log(`[신규 초기화 완료] '${currentThemeId}' 테마의 믹서 인테리어가 볼륨 0.5, 전체 재생 ON 상태로 박제되었습니다.`);
      return;
    }

    const themeSettings = JSON.parse(rawData);
    console.log(`[설정 로드 성공] '${storageKey}' 키로부터 기존 설정을 발견하여 동기화합니다:`, themeSettings);

    if (typeof themeSettings.masterVolume === 'number') {
      masterVolume = themeSettings.masterVolume;
      const masterSlider = document.getElementById('master-volume');
      if (masterSlider) {
        masterSlider.value = masterVolume;
      }
    }

    if (Array.isArray(themeSettings.sounds)) {
      themeSettings.sounds.forEach((savedSound) => {
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
                  console.warn(`[자동재생 제한] 브라우저 보안 정책으로 인해 '${sound.name}' 재생이 대기 상태입니다. (유저 액션 필요)`);
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
    console.log(`[설정 복원 완료] '${currentThemeId}' 테마의 이전 믹서 세팅이 완벽히 동기화 복구되었습니다.`);
  } catch (error) {
    console.error('[설정 로드 실패] 데이터를 읽어오는 중 에러가 발생하여 기본값으로 구동합니다:', error);
  }
}

// ==========================================================================
// 5. 볼륨 연산 엔진 함수
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
// 6. UI 렌더링 함수
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
// 7. 오디오 제어 핵심 함수
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
// 8. 직접 입력 방식 오디오 타이머 로직
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
 * 페이드아웃이 가동되어 깎여있던 오디오 볼륨을 원래 지정 비율 강도로 즉시 복구합니다.
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
// 9. 설정 서랍(Sidebar Drawer) 토글 모듈
// ==========================================================================

/**
 * [설정 서랍 상태 토글 함수]
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
    drawerElement.classList.toggle('active');
  }

  const isCurrentActive = drawerElement.classList.contains('active');
  console.log(`[설정 서랍] 서랍장 창이 ${isCurrentActive ? '열렸습니다.' : '닫혔습니다.'}`);
}

// ==========================================================================
// 10. Focus Mode (UI 개별 가리기 및 일괄 복구) 비즈니스 엔진 (요구사항 1 & 2)
// ==========================================================================

/**
 * [Focus Mode] 유저가 개별 ✕ 단추 클릭 시 특정 컴포넌트 구획을 부드럽게 가리는 함수
 * 
 * @param {string} targetId - 가려야 할 DOM 엘리먼트 타겟 ID 또는 구분값
 */
function hideUiSegment(targetId) {
  console.log(`[UI 가리기] '${targetId}' 영역을 화면에서 임시 가립니다.`);

  // 1. 헤더 복귀/설정 버튼들 일괄 가리기 분기
  if (targetId === 'header-buttons') {
    const btnBack = document.getElementById('btn-theme-back');
    const btnDrawer = document.getElementById('btn-drawer-toggle');
    const btnHide = document.getElementById('btn-hide-header');

    if (btnBack) btnBack.classList.add('ui-hidden-fade');
    if (btnDrawer) btnDrawer.classList.add('ui-hidden-fade');
    if (btnHide) btnHide.classList.add('ui-hidden-fade');
  } else {
    // 2. 일반 제어 구역(마스터 볼륨부, 타이머부)에 페이드 소실 스타일 주입
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.classList.add('ui-hidden-fade');
    }
  }

  // 3. 하나라도 가려지면 중앙 멍 공간 안의 '🔄 숨겨진 UI 모두 복구' 마스터 버튼을 노출
  const restoreBtn = document.getElementById('btn-ui-restore');
  if (restoreBtn) {
    restoreBtn.style.display = 'inline-block';
  }
}

/**
 * [Focus Mode] 가려졌던 모든 제어 컴포넌트들을 원상태로 일괄 오픈 복구시키는 함수 (요구사항 2)
 */
function restoreAllUiSegments() {
  console.log('[UI 복구] 가려져 있던 모든 화면 제어부들을 원상태로 일괄 복구시킵니다.');

  // 1. 볼륨 제어부 및 타이머부 복원
  const topControls = document.getElementById('top-controls');
  const timerSection = document.getElementById('timer-section');
  if (topControls) topControls.classList.remove('ui-hidden-fade');
  if (timerSection) timerSection.classList.remove('ui-hidden-fade');

  // 2. 상단 버튼 및 헤더 가리기 단추 복원
  const btnBack = document.getElementById('btn-theme-back');
  const btnDrawer = document.getElementById('btn-drawer-toggle');
  const btnHide = document.getElementById('btn-hide-header');

  if (btnBack) btnBack.classList.remove('ui-hidden-fade');
  if (btnDrawer) btnDrawer.classList.remove('ui-hidden-fade');
  if (btnHide) btnHide.classList.remove('ui-hidden-fade');

  // 3. 복구 마스터 힌트 단추 다시 숨김
  const restoreBtn = document.getElementById('btn-ui-restore');
  if (restoreBtn) {
    restoreBtn.style.display = 'none';
  }
}

// ==========================================================================
// 11. 이벤트 바인딩 및 어플리케이션 진입점
// ==========================================================================

/**
 * 동적으로 렌더링된 각 사운드 컨트롤러 엘리먼트(볼륨 슬라이더, ON/OFF 스위치)에 
 * 실시간 오디오 이벤트 리스너를 안전하게 개별 바인딩합니다.
 */
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

/**
 * 공통 제어 버튼 및 테마 선택 버튼 등에 대하여 전체 이벤트 바인딩을 수행합니다.
 */
function setupEventListeners() {
  // 1. 테마 선택 버튼 리스너 바인딩
  const btnNature = document.getElementById('btn-theme-nature');
  const btnFantasy = document.getElementById('btn-theme-fantasy');
  const btnHorror = document.getElementById('btn-theme-horror');

  if (btnNature) {
    btnNature.addEventListener('click', () => selectTheme('nature'));
  }
  if (btnFantasy) {
    btnFantasy.addEventListener('click', () => selectTheme('fantasy'));
  }
  if (btnHorror) {
    btnHorror.addEventListener('click', () => selectTheme('horror'));
  }

  // 테마 선택 화면 복귀 버튼 이벤트 바인딩
  const btnThemeBack = document.getElementById('btn-theme-back');
  if (btnThemeBack) {
    btnThemeBack.addEventListener('click', goToThemeSelectPage);
  }

  // 2. 전체 제어 상단 버튼 바인딩
  const playAllButton = document.getElementById('btn-play-all');
  const stopAllButton = document.getElementById('btn-stop-all');

  if (playAllButton) {
    playAllButton.addEventListener('click', playAllSounds);
  }

  if (stopAllButton) {
    stopAllButton.addEventListener('click', stopAllSounds);
  }

  // 3. 마스터 볼륨 슬라이더 조절 이벤트 감지 등록
  const masterVolumeSlider = document.getElementById('master-volume');
  if (masterVolumeSlider) {
    masterVolumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      updateMasterVolume(val);
    });
  }

  // 4. 직접 입력 방식 타이머 제어용 버튼 이벤트 등록
  const timerStartBtn = document.getElementById('btn-timer-start');
  const timerCancelBtn = document.getElementById('btn-timer-cancel');

  if (timerStartBtn) {
    timerStartBtn.addEventListener('click', handleStartTimer);
  }
  if (timerCancelBtn) {
    timerCancelBtn.addEventListener('click', handleCancelTimer);
  }

  // 5. 설정 서랍(Sidebar Drawer) 열기 및 닫기 버튼 이벤트 바인딩
  const drawerToggleBtn = document.getElementById('btn-drawer-toggle');
  const drawerCloseBtn = document.getElementById('btn-drawer-close');

  if (drawerToggleBtn) {
    drawerToggleBtn.addEventListener('click', () => toggleSettingsDrawer(true));
  }
  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', () => toggleSettingsDrawer(false));
  }

  // 6. [New] Focus Mode 개별 가리기 버튼 이벤트 연결 (요구사항 1)
  const hideButtons = document.querySelectorAll('.btn-ui-hide');
  hideButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // 멍 타겟 복구 이벤트와 겹쳐서 바로 복구되는 버그 원천 차단
      const targetId = btn.getAttribute('data-target');
      hideUiSegment(targetId);
    });
  });

  // 7. [New] Focus Mode 복구 버튼 및 중앙 멍 공간 일괄 복구 리스너 바인딩 (요구사항 2)
  const visualSpaceZone = document.getElementById('visual-space-zone');
  const restoreButton = document.getElementById('btn-ui-restore');

  if (visualSpaceZone) {
    visualSpaceZone.addEventListener('click', () => {
      restoreAllUiSegments();
    });
  }

  if (restoreButton) {
    restoreButton.addEventListener('click', (e) => {
      e.stopPropagation(); // 버블링 제한
      restoreAllUiSegments();
    });
  }
}

// 문서 로드가 완료되면 초기 이벤트 리스너 실행 (첫 화면 테마 선택 대기)
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();    // 테마 선택 및 전체 공통 이벤트 바인딩 설정
});
