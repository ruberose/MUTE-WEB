/**
 * MUTE-WEB 다국어(한국어/English) 문구 사전
 *
 * - HTML: data-i18n="키" → textContent, data-i18n-attr="속성:키,속성:키" → 속성값
 * - JS:   t('키', { 변수 }) → '{변수}' 자리에 값을 넣은 문구
 * 문구를 추가할 때는 ko / en 양쪽에 같은 키로 넣어 주세요.
 */
const I18N = {
  ko: {
    pageDescription: '의식의 가장 고요한 곳으로. 나만을 위한 커스텀 ASMR 믹서와 감각적인 멍 비주얼을 경험하세요.',
    langToggle: 'English',
    langToggleAria: 'Switch to English',

    // 테마 선택 화면
    subtitle: '의식의 가장 고요한 곳으로. 오늘의 호흡에 어울리는 소리 무드를 선택하세요.',
    themeListAria: '소리 테마',
    sharedMix: '공유받은 믹스 · {theme}',
    listen: '들어보기',
    close: '닫기',
    resumeLast: '이어 듣기 · {theme}',
    shareSite: '감성 공유하기',
    shareSiteTitle: '웹사이트 공유',

    // 믹서 화면
    backToThemes: '테마 선택',
    focusMode: '전체 화면 멍',
    focusModeTitle: '전체 UI 숨기기 (몰입 모드)',
    mixerSettings: '믹서 설정',
    appDescription: '복잡한 설정은 숨겨두고, 비주얼과 소리에 깊이 몰입해 보세요.',
    playAll: '전체 재생',
    stopAll: '전체 정지',
    masterVolume: '마스터 볼륨',
    visualSub: '공간의 흐름',
    visualSpaceAria: '전체 화면 멍 켜기 / 끄기',
    timerTitle: '취침 예약 타이머',
    timerPresetsAria: '타이머 빠른 선택',
    min15: '15분', min30: '30분', min60: '1시간', min90: '1시간 30분',
    timerInputAria: '타이머 시간(분)',
    timerPlaceholder: '분',
    start: '시작',
    cancel: '취소',
    timeLeft: '남은 시간: {time}',
    timerIdle: '대기',
    timerDone: '시간 종료',
    shareMix: '이 믹스 공유하기',
    shareMixTitle: '지금 믹스를 링크로 공유',
    showControls: '모든 UI 다시 보이기',
    openMixer: '믹서 설정 열기',

    // 설정 서랍
    drawerHeading: '{theme} 소리 조절',
    backdrop: '배경',
    myMixes: '내 믹스',
    presetPlaceholder: '믹스 이름 (예: 비 오는 밤)',
    presetNameAria: '믹스 이름',
    save: '저장',
    presetEmpty: '지금 소리 조합을 이름 붙여 저장해 두세요.',
    deletePreset: '{name} 삭제',
    shortcutsAria: '키보드 단축키',
    keyPlayPause: '재생 / 일시정지',
    keySounds: '소리 켜기 / 끄기',
    keyFocus: '전체 화면 멍',
    keyEsc: '닫기 / 나가기',

    // 소리 항목
    on: '켜짐',
    off: '꺼짐',
    soundVolume: '{name} 볼륨',
    soundToggle: '{name} 켜기 / 끄기',
    status_idle: '대기',
    status_loading: '불러오는 중',
    status_ready: '준비 완료',
    status_playing: '재생 중',
    status_stopped: '정지됨',
    status_failed: '불러오기 실패',

    // 알림
    linkCopied: '🔗 링크가 클립보드에 복사되었어요',
    offlineNotice: '오프라인이에요. 인터넷에 연결된 상태에서 한 번 들은 테마만 재생돼요.',
    sharedMixLoaded: '공유받은 믹스를 불러왔어요 · {theme}',
    presetSaved: "'{name}' 믹스를 저장했어요",
    presetOverwritten: "'{name}' 믹스를 덮어썼어요",
    presetDeleted: "'{name}' 믹스를 지웠어요",
    presetLoaded: "'{name}' 믹스를 불러왔어요",
    customHint: '켜고 싶은 소리를 골라 나만의 조합을 만들어 보세요.',
    shareSiteText: '의식의 가장 고요한 곳으로. 나만을 위한 커스텀 ASMR 믹서와 감각적인 멍 비주얼을 경험해 보세요.',
    shareMixText: "MUTE에서 만든 '{theme}' 소리 조합을 들어보세요."
  },

  en: {
    pageDescription: 'Drift into stillness. Mix your own ambient soundscape and lose yourself in calm visuals.',
    langToggle: '한국어',
    langToggleAria: '한국어로 보기',

    subtitle: 'Drift into stillness. Choose a sound mood that matches your breath today.',
    themeListAria: 'Sound themes',
    sharedMix: 'Shared mix · {theme}',
    listen: 'Listen',
    close: 'Close',
    resumeLast: 'Continue · {theme}',
    shareSite: 'Share MUTE',
    shareSiteTitle: 'Share this website',

    backToThemes: 'Themes',
    focusMode: 'Zen mode',
    focusModeTitle: 'Hide all controls (zen mode)',
    mixerSettings: 'Mixer',
    appDescription: 'Settings tucked away — just sink into the sound and visuals.',
    playAll: 'Play all',
    stopAll: 'Stop all',
    masterVolume: 'Master volume',
    visualSub: 'Current space',
    visualSpaceAria: 'Toggle zen mode',
    timerTitle: 'Sleep timer',
    timerPresetsAria: 'Timer presets',
    min15: '15 min', min30: '30 min', min60: '1 hr', min90: '1.5 hr',
    timerInputAria: 'Timer length (minutes)',
    timerPlaceholder: 'min',
    start: 'Start',
    cancel: 'Cancel',
    timeLeft: 'Time left: {time}',
    timerIdle: 'Off',
    timerDone: 'Done',
    shareMix: 'Share this mix',
    shareMixTitle: 'Share the current mix as a link',
    showControls: 'Show all controls',
    openMixer: 'Open mixer',

    drawerHeading: '{theme} sounds',
    backdrop: 'Backdrop',
    myMixes: 'My mixes',
    presetPlaceholder: 'Mix name (e.g. Rainy night)',
    presetNameAria: 'Mix name',
    save: 'Save',
    presetEmpty: 'Save the current combination under a name.',
    deletePreset: 'Delete {name}',
    shortcutsAria: 'Keyboard shortcuts',
    keyPlayPause: 'Play / pause',
    keySounds: 'Toggle sounds',
    keyFocus: 'Zen mode',
    keyEsc: 'Close / exit',

    on: 'On',
    off: 'Off',
    soundVolume: '{name} volume',
    soundToggle: 'Toggle {name}',
    status_idle: 'Idle',
    status_loading: 'Loading',
    status_ready: 'Ready',
    status_playing: 'Playing',
    status_stopped: 'Stopped',
    status_failed: 'Failed',

    linkCopied: '🔗 Link copied to clipboard',
    offlineNotice: "You're offline. Only themes you've played while online are available.",
    sharedMixLoaded: 'Loaded shared mix · {theme}',
    presetSaved: "Saved '{name}'",
    presetOverwritten: "Updated '{name}'",
    presetDeleted: "Deleted '{name}'",
    presetLoaded: "Loaded '{name}'",
    customHint: 'Turn on the sounds you like to build your own mix.',
    shareSiteText: 'Drift into stillness. Mix your own ambient soundscape on MUTE.',
    shareMixText: "Listen to my '{theme}' mix on MUTE."
  }
};

const LANG_STORAGE_KEY = 'mute_lang';

function detectLanguage() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && I18N[saved]) return saved;
  } catch (e) { /* 저장소 접근 불가 */ }
  return (navigator.language || 'ko').toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

let currentLang = detectLanguage();

/** 키에 해당하는 문구를 현재 언어로 돌려줍니다. {이름} 자리는 vars 값으로 채웁니다. */
function t(key, vars = {}) {
  const text = (I18N[currentLang] && I18N[currentLang][key]) ?? I18N.ko[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => (name in vars ? vars[name] : `{${name}}`));
}

/** { ko, en } 형태의 값에서 현재 언어 값을 꺼냅니다. 그냥 문자열이면 그대로. */
function localized(value) {
  if (value && typeof value === 'object') return value[currentLang] ?? value.ko;
  return value;
}

/** 페이지의 정적 문구(data-i18n / data-i18n-attr)를 현재 언어로 바꿉니다. */
function applyStaticI18n(root = document) {
  document.documentElement.lang = currentLang;
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      el.setAttribute(attr, t(key));
    });
  });
}

function setLanguage(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) { /* 무시 */ }
  applyStaticI18n();
}
