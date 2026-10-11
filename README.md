# MUTE-WEB

테마별 앰비언트 사운드를 겹쳐 듣는 웹 믹서입니다. 빌드 과정 없는 정적 사이트(HTML/CSS/JS)입니다.

## 기능
- 테마 선택: NATURE / FANTASY / EERIE NIGHT / OCEAN / DEEP SPACE
- MY MIX: 모든 테마의 소리 15개를 자유롭게 섞고 배경도 직접 선택 (켠 소리만 내려받음)
- 이어 듣기: 첫 화면에서 마지막으로 들은 테마를 바로 열기
- 한국어 / English 전환 (브라우저 언어로 자동 선택, 선택은 저장됨 — 문구는 `js/i18n.js`)
- 접근성: 화면 낭독기용 이름표·상태(aria), 키보드 포커스 표시, 설정 서랍 포커스 관리, '동작 줄이기' 설정 존중
- 테마별 배경과 분위기 입자 (반딧불 / 별·마법 가루 / 안개 / 달빛 물비늘 / 별·별똥별)
- 내 믹스: 테마별로 지금 소리 조합을 이름 붙여 저장·불러오기
- 믹스 링크 공유: `#mix=ocean.70.50,80,50x` 형태의 링크로 소리 조합 그대로 공유
- 오프라인 재생(PWA): 홈 화면에 앱처럼 설치 가능, 한 번 들은 테마는 인터넷 없이 재생
- 사운드 레이어별 켜기·끄기(페이드인·아웃), 개별 볼륨과 마스터 볼륨
- 끊김 없는 반복 재생 (Web Audio API)
- 취침 타이머: 15분·30분·1시간·1시간 30분 빠른 선택 또는 직접 입력, 마지막 1분 동안 서서히 페이드아웃
- 몰입 모드: 브라우저 전체화면 + UI 숨김, 움직임이 없으면 버튼·커서 자동 숨김, 화면 클릭으로 진입/해제
- 잠금화면·미디어 키로 재생/일시정지 (Media Session API)
- 키보드 단축키: `Space` 재생/일시정지, `1`~`3` 소리 켜기/끄기, `F` 몰입 모드, `Esc` 닫기/나가기
- 테마별 설정 자동 저장 (LocalStorage)
- 웹 공유 / 링크 복사

## 로컬에서 실행
[Node.js](https://nodejs.org/)가 설치되어 있다면 저장소 폴더에서:

```bash
npx live-server --port=5500
```

브라우저에서 http://127.0.0.1:5500 을 엽니다. 파일을 저장하면 자동으로 새로고침됩니다.

## 구조
```
index.html              화면 마크업
css/style.css           스타일
js/i18n.js              한국어/영어 문구 사전
js/script.js            테마 데이터, 오디오/타이머/몰입 모드/믹스 로직
sw.js                   서비스 워커 (오프라인 재생)
manifest.webmanifest    홈 화면 설치 정보 (PWA)
assets/images/          배경 이미지
assets/icons/           앱 아이콘
assets/sounds/          테마 사운드 (40초 루프 mp3)
tools/                  사운드·아이콘 생성 스크립트
```

## 오프라인(PWA) 참고
- 서비스 워커는 `http://localhost`나 `https://` 주소에서만 작동합니다.
- 화면 파일(HTML/CSS/JS)은 항상 네트워크를 먼저 확인하므로 수정 사항이 바로 반영됩니다.
- 파일 구성을 크게 바꿨다면 `sw.js`의 `CACHE_VERSION`을 올려 이전 저장본을 정리하세요.
- 테마 추가 방법: `tools/generate_sounds.py`에 사운드 함수 추가 → `js/script.js`의 `themeData`에 테마 추가(이름·설명은 `{ ko, en }`) → `BACKDROP_THEMES`에 id 추가 → `index.html`에 카드(`data-theme`)와 MY MIX 배경 선택지 추가 → `css/style.css`에 `body.theme-<id>` 배경 추가. 새 테마의 소리는 MY MIX에도 자동으로 들어갑니다.

## 사운드
`assets/sounds/`의 기본 사운드는 `tools/generate_sounds.py`로 합성한 것입니다(외부 음원 없음, 저작권 문제 없음).
사운드는 Web Audio API로 재생되어 반복 지점에서 끊기지 않습니다.

다른 음원으로 바꾸려면:
1. `assets/sounds/`에 같은 이름으로 덮어쓰고
2. `js/script.js`의 해당 사운드 항목에서 `loop: GENERATED_LOOP`를 지웁니다.
   (생성 파일은 앞뒤 0.25초 여유분이 붙어 있어 그 구간만 반복하도록 설정한 것이라, 직접 넣은 파일은 전체를 반복해야 합니다)

다시 생성하려면 (Python 3, `pip install numpy scipy lameenc` 필요):

```bash
python tools/generate_sounds.py            # 전체
python tools/generate_sounds.py rain potion # 일부만
```
