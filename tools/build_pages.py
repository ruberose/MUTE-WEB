"""
MUTE-WEB 안내 페이지 생성기 (소개 · 테마 안내 · 가이드 · 개인정보처리방침 + sitemap.xml)

페이지 내용은 아래 PAGES 목록에 적고, 이 스크립트를 실행하면 공통 머리·메뉴·바닥글이 붙은
정적 HTML이 각 폴더의 index.html로 만들어집니다. (예: about/index.html → /about/)

- 글을 고칠 때: PAGES의 body를 고치고 다시 실행 → 결과 HTML을 함께 커밋
- 배포 주소가 바뀌면: SITE_URL 한 곳만 바꾸고 다시 실행 (canonical, 공유 미리보기, sitemap 모두 갱신)

실행: python tools/build_pages.py
"""
import os
from datetime import date
from html import escape

SITE_URL = 'https://mute-web.ruberose0205.workers.dev'
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
UPDATED = date(2026, 10, 11).isoformat()
CONTACT_URL = 'https://github.com/ruberose/MUTE-WEB/issues'


def mix(theme, master, vols, backdrop=None):
    """믹스 링크(/#mix=...) — 메인 화면에서 '들어보기' 한 번으로 그 조합이 열림. vols의 None은 꺼짐."""
    parts = ','.join('50x' if v is None else str(v) for v in vols)
    tail = f'.{backdrop}' if backdrop else ''
    return f'/#mix={theme}.{master}.{parts}{tail}'


def cta(href, label):
    return f'<p><a class="page-cta" href="{href}">▶ {escape(label)}</a></p>'


NAV = [('/themes/', '테마 안내'), ('/guides/sleep/', '수면 가이드'), ('/guides/focus/', '집중 가이드'), ('/about/', '소개')]
FOOTER = [('/', 'MUTE 열기'), ('/about/', '소개·사용법'), ('/themes/', '테마 안내'),
          ('/guides/sleep/', '수면 가이드'), ('/guides/focus/', '집중 가이드'), ('/privacy/', '개인정보처리방침')]

THEME_LINKS = '''
<ul class="page-cards">
  <li><a href="/themes/nature/"><strong>NATURE</strong><span>빗소리 · 모닥불 · 시냇물</span></a></li>
  <li><a href="/themes/fantasy/"><strong>FANTASY</strong><span>성가대 · 유리 풍경 · 물약 끓는 소리</span></a></li>
  <li><a href="/themes/eerie-night/"><strong>EERIE NIGHT</strong><span>안개 낀 바람 · 문 삐걱임 · 발소리</span></a></li>
  <li><a href="/themes/ocean/"><strong>OCEAN</strong><span>밤바다 파도 · 몽돌 · 바닷바람</span></a></li>
  <li><a href="/themes/space/"><strong>DEEP SPACE</strong><span>엔진 험 · 전파 잡음 · 별빛 신호</span></a></li>
</ul>'''

SOUND_NOTE = '''
<p class="page-note">MUTE의 소리는 모두 녹음이 아니라 프로그램으로 직접 합성한 소리입니다.
40초 길이의 소리가 이음매 없이 반복되도록 만들어, 오래 틀어 두어도 반복 지점에서 끊기지 않습니다.</p>'''

PAGES = [
    # ------------------------------------------------------------------ 소개
    {
        'path': 'about',
        'title': 'MUTE 소개와 사용법 — 무료 앰비언트 사운드 믹서',
        'description': 'MUTE는 빗소리, 모닥불, 파도, 우주 소리를 겹쳐 듣는 무료 앰비언트 사운드 믹서입니다. 사용법, 단축키, 자주 묻는 질문을 정리했습니다.',
        'h1': 'MUTE 소개와 사용법',
        'body': f'''
<p class="page-lead">MUTE는 여러 가지 배경 소리를 겹쳐 나만의 조합을 만드는 웹 사운드 믹서입니다.
잠들기 전, 공부나 작업에 집중할 때, 혹은 그냥 잠시 쉬고 싶을 때 브라우저에서 바로 쓸 수 있습니다.
회원가입이나 설치 없이 무료로 사용할 수 있습니다.</p>

{cta('/', 'MUTE 열기')}

<h2>어떤 소리가 있나요</h2>
<p>다섯 가지 테마에 각각 세 가지 소리가 들어 있습니다. 테마를 고르면 세 소리가 함께 재생되고,
소리마다 볼륨을 따로 조절하거나 끌 수 있습니다. <strong>MY MIX</strong>에서는 모든 테마의 소리 15가지를 자유롭게 섞을 수 있습니다.</p>
{THEME_LINKS}

<h2>사용법</h2>
<ol>
  <li><strong>테마 고르기</strong> — 첫 화면에서 테마 카드를 누르면 소리가 부드럽게 재생됩니다.</li>
  <li><strong>소리 조절</strong> — 오른쪽 위 <em>믹서 설정</em>을 열어 소리별 볼륨을 맞추거나 켜고 끕니다.
      화면의 <em>마스터 볼륨</em>은 전체 크기를 한 번에 조절합니다.</li>
  <li><strong>타이머 맞추기</strong> — 잠들 때는 취침 타이머(15분·30분·1시간·1시간 30분 또는 직접 입력)를 켜 두세요.
      끝나기 전 마지막 1분 동안 소리가 서서히 작아집니다.</li>
  <li><strong>전체 화면 멍</strong> — 가운데 화면을 누르면 버튼이 사라지고 움직이는 배경만 남습니다. 다시 누르면 돌아옵니다.</li>
  <li><strong>내 믹스 저장</strong> — 마음에 드는 조합은 이름을 붙여 저장해 두고, <em>이 믹스 공유하기</em>로 링크를 보낼 수도 있습니다.</li>
</ol>

<h2>키보드 단축키</h2>
<table class="page-table">
  <tr><th>Space</th><td>재생 / 일시정지 (멈추기 직전에 켜져 있던 소리만 다시 켭니다)</td></tr>
  <tr><th>1 – 9</th><td>목록 순서대로 소리 켜기 / 끄기</td></tr>
  <tr><th>F</th><td>전체 화면 멍 켜기 / 끄기</td></tr>
  <tr><th>Esc</th><td>설정 닫기 / 전체 화면 멍 나가기</td></tr>
</table>

<h2>자주 묻는 질문</h2>
<h3>정말 무료인가요?</h3>
<p>네. 모든 테마와 기능을 무료로 쓸 수 있고, 회원가입도 필요 없습니다.</p>

<h3>인터넷 없이도 들을 수 있나요?</h3>
<p>한 번이라도 인터넷에 연결된 상태에서 들었던 테마는 저장되어, 이후에는 오프라인에서도 재생됩니다.
휴대폰에서는 브라우저 메뉴의 <em>홈 화면에 추가</em>를 이용하면 앱처럼 실행할 수 있습니다.</p>

<h3>화면을 끄거나 다른 앱을 써도 소리가 나나요?</h3>
<p>대부분의 브라우저에서 계속 재생되며, 잠금화면이나 이어폰의 재생/일시정지 버튼으로도 조작할 수 있습니다.
다만 휴대폰의 절전 설정에 따라 오래 지나면 브라우저가 소리를 멈출 수 있습니다.</p>

<h3>설정은 어디에 저장되나요?</h3>
<p>볼륨, 켜 둔 소리, 저장한 믹스는 모두 사용 중인 브라우저 안에만 저장되고 서버로 전송되지 않습니다.
자세한 내용은 <a href="/privacy/">개인정보처리방침</a>을 참고하세요.</p>

<h3>소리는 어디서 가져왔나요?</h3>
{SOUND_NOTE}

<h2>문의</h2>
<p>버그 제보나 기능 제안은 <a href="{CONTACT_URL}" rel="noopener">GitHub 이슈</a>로 남겨 주세요.</p>
''',
    },
    # ------------------------------------------------------------------ 테마 허브
    {
        'path': 'themes',
        'title': '테마 안내 — 빗소리, 파도, 모닥불, 우주 배경음 | MUTE',
        'description': 'MUTE의 다섯 가지 사운드 테마(자연, 판타지, 으스스한 밤, 바다, 우주)와 각 테마에 들어 있는 소리, 어울리는 상황을 소개합니다.',
        'h1': '테마 안내',
        'body': f'''
<p class="page-lead">MUTE에는 분위기가 다른 다섯 가지 테마가 있습니다. 테마마다 세 가지 소리가 들어 있고,
배경 화면과 움직이는 효과도 테마에 맞게 바뀝니다. 각 테마를 눌러 소리 설명과 추천 조합을 확인해 보세요.</p>
{THEME_LINKS}

<h2>테마를 고르는 기준</h2>
<ul>
  <li><strong>잠들기 전</strong>에는 변화가 적고 고른 소리가 좋습니다. 빗소리, 파도, 바닷바람처럼 일정하게 이어지는 소리를 추천합니다.</li>
  <li><strong>공부·작업</strong>에는 주변 소음을 덮어 주되 귀를 끌지 않는 소리가 좋습니다. 시냇물, 모닥불, 우주 엔진 험이 잘 어울립니다.</li>
  <li><strong>독서·글쓰기</strong>처럼 분위기가 중요한 시간에는 판타지나 으스스한 밤 테마로 장면을 만들어 보세요.</li>
</ul>

<h2>테마를 섞고 싶다면</h2>
<p><strong>MY MIX</strong>에서는 다섯 테마의 소리 15가지를 모두 골라 섞을 수 있고, 배경 화면도 따로 고를 수 있습니다.
예를 들어 숲의 빗소리와 밤바다 파도를 함께 틀 수 있습니다.</p>
{cta(mix('custom', 90, [50, None, None, None, None, None, None, None, None, 55, None, None, None, None, None], 'ocean'), '빗소리 + 밤바다 파도 조합 듣기')}
''',
    },
    # ------------------------------------------------------------------ NATURE
    {
        'path': 'themes/nature',
        'title': '빗소리·모닥불·시냇물 백색소음 — NATURE 테마 | MUTE',
        'description': '자갈에 떨어지는 빗소리, 자작나무 모닥불, 숲속 시냇물 소리를 겹쳐 듣는 자연 앰비언트 사운드. 수면과 집중에 어울리는 조합을 소개합니다.',
        'h1': 'NATURE — 빗소리, 모닥불, 시냇물',
        'body': f'''
<p class="page-lead">비 오는 밤, 숲속 오두막 앞에 피워 둔 모닥불. NATURE 테마는 가장 익숙하고 편안한 자연의 소리를 모았습니다.
처음 MUTE를 써 본다면 이 테마부터 들어 보세요.</p>
{cta(mix('nature', 100, [50, 50, 50]), 'NATURE 바로 듣기')}

<h2>들어 있는 소리</h2>
<h3>🌧️ 자갈 빗소리</h3>
<p>넓게 퍼지는 빗줄기 소리 위에 자갈과 잎에 떨어지는 작은 빗방울 소리를 얹었습니다.
고르게 이어지는 소리라 주변의 말소리나 생활 소음을 부드럽게 덮어 주어, 잠들기 전에 특히 잘 어울립니다.</p>
<h3>🔥 자작나무 모닥불</h3>
<p>낮게 깔리는 불길 소리와 장작이 탁탁 튀는 소리입니다. 튀는 소리가 가끔 들어가 있어
너무 단조롭지 않고, 공부나 독서할 때 적당한 생동감을 줍니다.</p>
<h3>🏞️ 숲속 시냇물</h3>
<p>돌 사이로 흐르는 물소리와 작은 물방울 소리입니다. 소리의 높낮이가 넓게 퍼져 있어 주변 소음을 가리는 힘이 좋습니다.</p>

<h2>추천 조합</h2>
<ul>
  <li><strong>잠들기 전</strong> — 빗소리를 중심으로, 모닥불은 작게, 시냇물은 끕니다.
      {cta(mix('nature', 80, [60, 30, None]), '잠들기 전 조합 듣기')}</li>
  <li><strong>공부·작업</strong> — 빗소리는 끄고, 모닥불과 시냇물을 중간 크기로 섞습니다.
      {cta(mix('nature', 90, [None, 40, 55]), '집중 조합 듣기')}</li>
</ul>

<h2>이럴 때 들어 보세요</h2>
<ul>
  <li>창밖 소음이나 옆방 소리 때문에 잠들기 어려울 때</li>
  <li>카페처럼 적당히 소리가 있는 환경에서 더 집중이 잘 될 때</li>
  <li>비 오는 날의 분위기를 언제든 느끼고 싶을 때</li>
</ul>
<p>수면에 활용하는 방법은 <a href="/guides/sleep/">수면 가이드</a>에서 더 자세히 다룹니다.</p>
{SOUND_NOTE}
''',
    },
    # ------------------------------------------------------------------ FANTASY
    {
        'path': 'themes/fantasy',
        'title': '판타지 앰비언트 — 성가대, 유리 풍경, 마법 물약 소리 | MUTE',
        'description': '시간이 멈춘 공중 마법 상점을 상상하며 만든 판타지 배경음. 은하수 성가대, 유리 풍경, 보글보글 물약 소리로 독서와 글쓰기 분위기를 만들어 보세요.',
        'h1': 'FANTASY — 공중 마법 상점의 소리',
        'body': f'''
<p class="page-lead">시간이 멈춘 하늘 위의 마법 상점. FANTASY 테마는 판타지 소설이나 게임 속 한 장면처럼
신비로운 분위기를 만드는 소리들입니다. 화면도 보랏빛으로 물들고 마법 가루가 천천히 떠오릅니다.</p>
{cta(mix('fantasy', 100, [50, 50, 50]), 'FANTASY 바로 듣기')}

<h2>들어 있는 소리</h2>
<h3>✨ 은하수 성가대</h3>
<p>“아—” 하고 길게 이어지는 합창 화음이 10초마다 천천히 바뀝니다. 긴 잔향이 더해져 넓은 공간에 있는 듯한 느낌을 줍니다.</p>
<h3>🎐 유리 풍경 소리</h3>
<p>맑은 유리 풍경이 바람에 흔들리듯 가끔씩 울립니다. 규칙 없이 띄엄띄엄 울려서 배경에 은은한 반짝임을 더합니다.</p>
<h3>🧪 마법 물약 보글보글</h3>
<p>솥에서 물약이 끓어오르는 듯한 거품 소리입니다. 거품이 몰려서 터졌다가 잠잠해지기를 반복합니다.</p>

<h2>추천 조합</h2>
<ul>
  <li><strong>판타지 소설 읽기</strong> — 성가대는 작게 깔고, 풍경과 물약 소리를 살짝 섞습니다.
      {cta(mix('fantasy', 80, [35, 45, 30]), '독서 조합 듣기')}</li>
  <li><strong>잔잔한 휴식</strong> — 물약은 끄고 성가대와 풍경만 남깁니다.
      {cta(mix('fantasy', 75, [45, 40, None]), '휴식 조합 듣기')}</li>
</ul>

<h2>이럴 때 들어 보세요</h2>
<ul>
  <li>판타지 소설이나 웹툰을 볼 때 분위기를 더하고 싶을 때</li>
  <li>TRPG나 보드게임의 배경음이 필요할 때</li>
  <li>글이나 그림 작업에서 상상력을 끌어올리고 싶을 때</li>
</ul>
{SOUND_NOTE}
''',
    },
    # ------------------------------------------------------------------ EERIE NIGHT
    {
        'path': 'themes/eerie-night',
        'title': '으스스한 밤 배경음 — 안개 바람, 문 삐걱임, 발소리 | MUTE',
        'description': '짙은 안개 속 버려진 저택을 떠올리게 하는 으스스한 앰비언트 사운드. 공포 소설 읽기, 글쓰기, 게임 배경음으로 어울리는 소리와 조합을 소개합니다.',
        'h1': 'EERIE NIGHT — 안개 속 버려진 저택',
        'body': f'''
<p class="page-lead">짙은 안개가 내려앉은 밤, 아무도 살지 않는 오래된 저택. EERIE NIGHT 테마는
조용하지만 어딘가 서늘한 긴장감을 주는 소리들입니다. 화면은 빛이 빠진 회색 숲으로 바뀌고 안개가 낮게 흘러갑니다.</p>
{cta(mix('horror', 100, [50, 50, 50]), 'EERIE NIGHT 바로 듣기')}

<h2>들어 있는 소리</h2>
<h3>💨 안개 낀 강풍</h3>
<p>틈새로 휘파람처럼 새어 드는 바람 소리입니다. 바람의 세기와 높낮이가 천천히 계속 바뀝니다.</p>
<h3>🚪 문 삐걱임</h3>
<p>고요한 방 안에서 오래된 나무 문이 천천히 열리는 소리가 40초에 세 번 정도 들립니다.</p>
<h3>👣 무거운 발소리</h3>
<p>빈 집의 마룻바닥을 천천히 걷는 발소리입니다. 걸음마다 가끔 바닥이 삐걱거립니다.</p>

<h2>추천 조합</h2>
<ul>
  <li><strong>공포 소설 읽기</strong> — 바람을 중심으로 문소리를 작게 섞습니다.
      {cta(mix('horror', 80, [60, 25, None]), '독서 조합 듣기')}</li>
  <li><strong>본격적인 분위기</strong> — 세 소리를 모두 켭니다.
      {cta(mix('horror', 85, [55, 35, 35]), '전체 조합 듣기')}</li>
</ul>

<h2>참고</h2>
<p>문 삐걱임과 발소리는 가끔씩 갑자기 들리는 소리라, 잠들기 위한 용도로는 맞지 않을 수 있습니다.
잠잘 때 쓰고 싶다면 바람 소리만 켜 두는 것을 추천합니다.</p>
{SOUND_NOTE}
''',
    },
    # ------------------------------------------------------------------ OCEAN
    {
        'path': 'themes/ocean',
        'title': '밤바다 파도 소리 — 몽돌 해변, 바닷바람 ASMR | MUTE',
        'description': '8초마다 밀려왔다 빠지는 밤바다 파도, 몽돌 구르는 소리, 바닷바람을 겹쳐 듣는 바다 앰비언트 사운드. 잠들기 전에 듣기 좋은 조합을 소개합니다.',
        'h1': 'OCEAN — 달빛 아래 밤바다',
        'body': f'''
<p class="page-lead">달이 뜬 밤, 몽돌 해변에 천천히 밀려왔다 빠지는 파도. OCEAN 테마는 일정한 박자로 반복되는
파도 소리 덕분에 호흡을 고르고 마음을 가라앉히기 좋습니다. 화면에는 달빛이 수면 위에 반짝입니다.</p>
{cta(mix('ocean', 100, [50, 50, 50]), 'OCEAN 바로 듣기')}

<h2>들어 있는 소리</h2>
<h3>🌊 밤바다 파도</h3>
<p>약 8초마다 파도가 밀려오고 하얀 물거품이 부서지며 빠져나갑니다. 화면 가운데 물결도 같은 박자로 움직입니다.</p>
<h3>🪨 몽돌 구르는 소리</h3>
<p>파도가 빠져나갈 때 동글동글한 자갈이 함께 쓸려 내려가며 내는 잔잔한 달그락 소리입니다.</p>
<h3>🌬️ 바닷바람</h3>
<p>넓게 불어오는 부드러운 바람 소리입니다. 파도 사이의 빈자리를 채워 소리가 끊기지 않게 해 줍니다.</p>

<h2>추천 조합</h2>
<ul>
  <li><strong>잠들기 전</strong> — 파도를 중심으로 몽돌과 바람을 작게 섞습니다.
      {cta(mix('ocean', 80, [65, 30, 35]), '잠들기 전 조합 듣기')}</li>
  <li><strong>호흡 명상</strong> — 파도만 켜고, 밀려올 때 들이쉬고 빠질 때 내쉬어 보세요.
      {cta(mix('ocean', 75, [60, None, None]), '파도만 듣기')}</li>
</ul>

<h2>이럴 때 들어 보세요</h2>
<ul>
  <li>생각이 많아 잠이 오지 않을 때</li>
  <li>짧게 쉬면서 호흡을 고르고 싶을 때</li>
  <li>바다에 가고 싶지만 갈 수 없을 때</li>
</ul>
<p>더 많은 수면 활용법은 <a href="/guides/sleep/">수면 가이드</a>를 참고하세요.</p>
{SOUND_NOTE}
''',
    },
    # ------------------------------------------------------------------ DEEP SPACE
    {
        'path': 'themes/space',
        'title': '우주 앰비언트 사운드 — 우주선 엔진 험, 전파 잡음 | MUTE',
        'description': '별들 사이를 떠도는 우주 정거장의 낮은 엔진 소리, 전파 잡음, 별빛 신호를 겹쳐 듣는 우주 배경음. 집중과 작업에 어울리는 조합을 소개합니다.',
        'h1': 'DEEP SPACE — 궤도 위의 정거장',
        'body': f'''
<p class="page-lead">별들 사이를 천천히 떠도는 우주 정거장. DEEP SPACE 테마는 낮게 웅웅거리는 엔진 소리를 중심으로
깊고 조용한 우주의 분위기를 만듭니다. 화면에는 성운과 별이 흐르고, 가끔 별똥별이 지나갑니다.</p>
{cta(mix('space', 100, [50, 50, 50]), 'DEEP SPACE 바로 듣기')}

<h2>들어 있는 소리</h2>
<h3>🛰️ 정거장 엔진 험</h3>
<p>낮게 웅웅거리는 엔진 소리와 깊은 진동입니다. 변화가 거의 없어 주변 소음을 덮고 집중을 돕는 데 잘 맞습니다.</p>
<h3>📻 전파 잡음</h3>
<p>멀리서 들어오는 무전처럼 지직거리는 잡음과, 주파수를 맞추는 듯한 휘파람 소리가 가끔 섞입니다.</p>
<h3>✴️ 별빛 신호</h3>
<p>먼 곳에서 오는 신호처럼 맑은 '핑' 소리가 긴 여운을 남기며 띄엄띄엄 울립니다.</p>

<h2>추천 조합</h2>
<ul>
  <li><strong>집중·코딩</strong> — 엔진 험과 별빛 신호만 켭니다.
      {cta(mix('space', 80, [55, None, 40]), '집중 조합 듣기')}</li>
  <li><strong>SF 분위기</strong> — 세 소리를 모두 켜고 전파 잡음은 작게 둡니다.
      {cta(mix('space', 85, [50, 25, 45]), 'SF 조합 듣기')}</li>
</ul>

<h2>이럴 때 들어 보세요</h2>
<ul>
  <li>코딩이나 문서 작업처럼 오래 집중해야 할 때</li>
  <li>SF 소설이나 영화의 여운을 이어 가고 싶을 때</li>
  <li>낮은 소리가 편안하게 느껴질 때</li>
</ul>
<p>집중할 때 소리를 활용하는 방법은 <a href="/guides/focus/">집중 가이드</a>에 정리했습니다.</p>
{SOUND_NOTE}
''',
    },
    # ------------------------------------------------------------------ 수면 가이드
    {
        'path': 'guides/sleep',
        'title': '잠 안 올 때 소리 활용법 — 빗소리·파도 소리로 잠들기 | MUTE',
        'description': '잠들기 전 배경 소리를 활용하는 방법을 정리했습니다. 어떤 소리를 고를지, 볼륨과 타이머는 어떻게 맞출지, 이어폰을 쓸 때 주의할 점까지 소개합니다.',
        'h1': '잠 안 올 때, 소리로 잠드는 법',
        'type': 'article',
        'body': f'''
<p class="page-lead">조용해야 잠이 잘 올 것 같지만, 막상 완전히 조용하면 작은 소리 하나에도 신경이 쓰이곤 합니다.
이럴 때 일정하게 이어지는 배경 소리가 도움이 된다는 사람이 많습니다. MUTE로 잠들기 좋은 환경을 만드는 방법을 정리했습니다.</p>

<h2>왜 배경 소리가 도움이 될까</h2>
<p>밤에 잠을 깨우는 건 소리의 크기보다 <strong>갑작스러운 변화</strong>인 경우가 많습니다. 조용한 방에서는
문 닫히는 소리나 차 소리처럼 갑자기 튀는 소리가 크게 느껴집니다. 일정한 배경 소리를 깔아 두면
이런 소리와 주변의 차이가 줄어들어 덜 거슬리게 됩니다. 이를 흔히 <em>소리 가리기(마스킹)</em>라고 부릅니다.</p>
<p>다만 배경 소리가 수면에 얼마나 도움이 되는지는 사람마다 다르고, 연구 결과도 엇갈립니다.
오히려 소리가 있으면 잠이 안 온다는 사람도 있으니, 며칠 써 보며 나에게 맞는지 확인해 보세요.
잠을 이루기 어려운 상태가 오래 계속된다면 전문가와 상담하는 것이 좋습니다.</p>

<h2>어떤 소리를 고를까</h2>
<ul>
  <li><strong>고르게 이어지는 소리</strong>를 고르세요. 빗소리, 파도, 바닷바람, 시냇물이 잘 맞습니다.</li>
  <li><strong>갑자기 튀는 소리는 피하세요.</strong> 문 삐걱임, 발소리, 장작 튀는 소리는 잠들 무렵 오히려 신경을 깨울 수 있습니다.</li>
  <li><strong>낮은 소리</strong>가 편하다면 우주 엔진 험처럼 낮게 깔리는 소리도 좋습니다.</li>
</ul>
<p>처음이라면 아래 두 조합 중 하나로 시작해 보세요.</p>
{cta(mix('nature', 80, [60, 30, None]), '빗소리 중심 조합')}
{cta(mix('ocean', 80, [65, 30, 35]), '밤바다 파도 조합')}

<h2>볼륨은 생각보다 작게</h2>
<p>대화 소리보다 작게, 집중하지 않으면 거의 의식되지 않을 정도가 적당합니다.
먼저 <em>마스터 볼륨</em>을 낮춰 전체 크기를 정하고, 소리별 볼륨으로 균형을 맞추세요.
밤새 큰 소리를 틀어 두는 것은 귀에 부담이 될 수 있습니다.</p>

<h2>취침 타이머 켜 두기</h2>
<p>잠든 뒤에도 소리가 계속 날 필요는 없습니다. <em>취침 예약 타이머</em>를 30분이나 1시간으로 맞춰 두면
끝나기 전 마지막 1분 동안 소리가 서서히 작아지다 멈춰서, 갑자기 조용해져 깨는 일을 줄여 줍니다.</p>

<h2>화면과 이어폰</h2>
<ul>
  <li>가운데 화면을 눌러 <em>전체 화면 멍</em>으로 바꾸면 밝은 버튼이 사라집니다. 휴대폰 화면은 엎어 두거나 꺼도 소리는 계속 납니다.</li>
  <li>이어폰을 낀 채 잠들면 귀가 눌리거나 아플 수 있습니다. 가능하면 스피커로 작게 틀어 두세요.</li>
</ul>

<h2>이렇게 써 보세요</h2>
<ol>
  <li>잠자리에 들기 10분 전, 위 조합 중 하나를 열고 볼륨을 작게 맞춥니다.</li>
  <li>타이머를 30분~1시간으로 켭니다.</li>
  <li>전체 화면 멍으로 바꾸고 화면을 끈 뒤, 소리에만 귀를 기울입니다.</li>
  <li>마음에 든 조합은 <em>내 믹스</em>에 저장해 두면 다음 날 한 번에 열 수 있습니다.</li>
</ol>
''',
    },
    # ------------------------------------------------------------------ 집중 가이드
    {
        'path': 'guides/focus',
        'title': '공부·작업 집중용 배경음 활용법 — 백색소음 조합 추천 | MUTE',
        'description': '공부하거나 일할 때 배경 소리를 활용하는 방법. 집중에 어울리는 소리의 특징, 추천 조합, 타이머를 이용한 시간 관리 방법을 소개합니다.',
        'h1': '공부·작업할 때 소리로 집중하는 법',
        'type': 'article',
        'body': f'''
<p class="page-lead">도서관처럼 완전히 조용한 곳보다 카페에서 공부가 더 잘 된다는 사람이 있습니다.
적당한 배경 소리는 주변의 말소리나 소음을 덮어 주어, 하던 일에 머물러 있도록 도와줍니다. MUTE를 집중용으로 쓰는 방법을 정리했습니다.</p>

<h2>집중에 좋은 소리의 조건</h2>
<ul>
  <li><strong>가사가 없는 소리</strong> — 말이나 노랫말은 머릿속 언어 처리와 겹쳐 글을 읽거나 쓸 때 방해가 되기 쉽습니다.</li>
  <li><strong>변화가 적은 소리</strong> — 귀를 끌어당기는 갑작스러운 소리가 없어야 합니다.</li>
  <li><strong>주변 소음을 덮을 만큼 넓은 소리</strong> — 시냇물이나 빗소리처럼 높낮이가 고르게 퍼진 소리가 말소리를 잘 가립니다.</li>
</ul>
<p>어떤 소리가 집중에 좋은지는 사람과 작업에 따라 다릅니다. 계산이나 암기처럼 머리를 많이 쓰는 일에는
소리를 아주 작게 하거나 끄는 편이 나을 수도 있으니, 직접 비교해 보세요.</p>

<h2>추천 조합</h2>
<h3>카페 대신 — 모닥불과 시냇물</h3>
<p>적당한 생동감이 있어 혼자 있어도 처지지 않는 조합입니다.</p>
{cta(mix('nature', 90, [None, 40, 55]), '모닥불 + 시냇물 듣기')}
<h3>깊은 몰입 — 우주 엔진 험</h3>
<p>낮고 일정한 소리라 코딩이나 문서 작업처럼 오래 앉아 있는 일에 잘 맞습니다.</p>
{cta(mix('space', 80, [55, None, 40]), '엔진 험 + 별빛 신호 듣기')}
<h3>섞어 쓰기 — 빗소리와 엔진 험</h3>
<p><strong>MY MIX</strong>에서는 테마를 넘나들며 소리를 섞을 수 있습니다. 빗소리로 소음을 덮고, 엔진 험으로 바닥을 깔아 보세요.</p>
{cta(mix('custom', 85, [45, None, None, None, None, None, None, None, None, None, None, None, 45, None, None], 'space'), '빗소리 + 엔진 험 듣기')}

<h2>타이머로 시간 나누기</h2>
<p>한 번에 오래 버티기보다 시간을 나눠 집중하는 방법이 많이 쓰입니다. 예를 들어
<strong>25분 집중 → 5분 휴식</strong>을 반복하는 식입니다. MUTE의 타이머에 25를 입력해 두면,
시간이 끝날 때 소리가 서서히 사라지면서 자연스럽게 쉬는 시간을 알려 줍니다. 쉬고 나서 <kbd>Space</kbd>를 누르면 같은 소리가 다시 켜집니다.</p>

<h2>작은 팁</h2>
<ul>
  <li>볼륨은 주변 소음이 겨우 가려질 정도면 충분합니다. 너무 크면 오히려 피로해집니다.</li>
  <li>오래 들을 때는 이어폰보다 스피커가 귀에 부담이 적습니다.</li>
  <li>작업마다 쓰는 조합을 <em>내 믹스</em>에 저장해 두면, 소리를 켜는 것만으로 '작업 모드'에 들어가는 습관을 만들 수 있습니다.</li>
</ul>
''',
    },
    # ------------------------------------------------------------------ 개인정보처리방침
    {
        'path': 'privacy',
        'title': '개인정보처리방침 | MUTE',
        'description': 'MUTE는 회원가입이 없으며 개인정보를 수집하지 않습니다. 브라우저에 저장되는 설정 정보와 외부 서비스 이용에 대해 안내합니다.',
        'h1': '개인정보처리방침',
        'body': f'''
<p class="page-lead">MUTE(이하 “서비스”)는 이용자의 개인정보를 소중히 다룹니다. 이 방침은 서비스가 어떤 정보를 어떻게 다루는지 설명합니다.</p>
<p class="page-note">시행일: {UPDATED}</p>

<h2>1. 수집하는 개인정보</h2>
<p>서비스는 회원가입, 로그인, 문의 양식이 없으며, 이용자의 이름·이메일·연락처 등 개인정보를 수집하거나 서버에 저장하지 않습니다.</p>

<h2>2. 브라우저에 저장되는 정보</h2>
<p>서비스는 편의를 위해 아래 정보를 <strong>이용자의 브라우저 안(로컬 저장소)</strong>에만 저장합니다.
이 정보는 서버로 전송되지 않으며, 브라우저의 사이트 데이터 삭제 기능으로 언제든 지울 수 있습니다.</p>
<ul>
  <li>테마별 볼륨, 켜 둔 소리, MY MIX 배경 설정</li>
  <li>이용자가 이름을 붙여 저장한 믹스</li>
  <li>마지막으로 들은 테마(이어 듣기용), 화면 언어 설정</li>
</ul>
<p>또한 오프라인 재생을 위해 사이트 파일(화면, 소리, 서체)을 브라우저 캐시에 저장합니다. 이 역시 이용자의 기기 안에만 저장됩니다.</p>

<h2>3. 쿠키</h2>
<p>서비스는 현재 쿠키를 사용하지 않습니다.</p>

<h2>4. 외부 서비스</h2>
<ul>
  <li><strong>호스팅(Cloudflare)</strong> — 서비스는 Cloudflare를 통해 제공됩니다. 웹사이트 운영 과정에서 Cloudflare가 보안과 성능을 위해 접속 기록(IP 주소, 접속 시각 등)을 처리할 수 있습니다.</li>
  <li><strong>서체(jsDelivr)</strong> — 화면 글꼴(Pretendard)을 jsDelivr CDN에서 불러오며, 이 과정에서 해당 CDN에 접속 정보가 전달될 수 있습니다.</li>
</ul>
<p>각 서비스의 개인정보 처리는 해당 회사의 방침을 따릅니다.</p>

<h2>5. 광고</h2>
<p>서비스는 현재 광고를 게재하지 않습니다. 향후 광고(예: Google 애드센스)를 도입하는 경우,
광고 제공자가 쿠키를 사용해 맞춤 광고를 표시할 수 있으며, 도입 전에 이 방침을 개정하여 안내하겠습니다.</p>

<h2>6. 아동의 개인정보</h2>
<p>서비스는 개인정보를 수집하지 않으므로 아동의 개인정보 역시 수집하지 않습니다.</p>

<h2>7. 방침의 변경</h2>
<p>이 방침이 바뀌는 경우 이 페이지를 통해 변경 내용과 시행일을 알립니다.</p>

<h2>8. 문의</h2>
<p>개인정보와 관련한 문의는 <a href="{CONTACT_URL}" rel="noopener">GitHub 이슈</a>로 남겨 주세요.</p>
''',
    },
]


# --------------------------------------------------------------------------
# 템플릿
# --------------------------------------------------------------------------
def render(page):
    url = f"{SITE_URL}/{page['path']}/"
    nav = ''.join(f'<a href="{href}">{escape(label)}</a>' for href, label in NAV)
    footer = ' · '.join(f'<a href="{href}">{escape(label)}</a>' for href, label in FOOTER)
    og_type = page.get('type', 'website')
    title, desc = escape(page['title']), escape(page['description'])
    return f'''<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{url}">

  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32.png">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#07070a">

  <meta property="og:type" content="{og_type}">
  <meta property="og:site_name" content="MUTE">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{SITE_URL}/assets/images/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
  <link rel="stylesheet" href="/css/pages.css">
</head>
<body>
  <!-- 이 파일은 tools/build_pages.py로 생성됩니다. 직접 고치지 말고 스크립트의 PAGES를 수정하세요. -->
  <header class="page-header">
    <a class="page-logo" href="/">MUTE</a>
    <nav class="page-nav" aria-label="사이트 메뉴">{nav}</nav>
  </header>

  <main class="page-main">
    <article>
      <h1>{escape(page['h1'])}</h1>
{page['body']}
    </article>
  </main>

  <footer class="page-footer">
    <nav aria-label="바닥글 메뉴">{footer}</nav>
    <p>© MUTE · 무료 앰비언트 사운드 믹서</p>
  </footer>
</body>
</html>
'''


def write_sitemap():
    urls = [f'{SITE_URL}/'] + [f"{SITE_URL}/{p['path']}/" for p in PAGES]
    items = '\n'.join(f'  <url><loc>{u}</loc><lastmod>{UPDATED}</lastmod></url>' for u in urls)
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{items}\n</urlset>\n')
    with open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n')
    print(f'  sitemap.xml ({len(urls)} URLs), robots.txt')


if __name__ == '__main__':
    for page in PAGES:
        out_dir = os.path.join(ROOT, *page['path'].split('/'))
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8', newline='\n') as f:
            f.write(render(page))
        print(f"  /{page['path']}/")
    write_sitemap()
