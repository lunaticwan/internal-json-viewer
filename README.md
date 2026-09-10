# iMJSON 에디터

iMJSON은 사내 내부망(Intranet) 및 미연결 환경에서 독립적으로 작동하도록 설계된 고성능 Web / PWA 기반 JSON 에디터입니다.
Svelte 5 Runes 기반의 현대적인 반응형 구조와 `svelte-jsoneditor`를 결합하여 대용량 JSON 데이터의 시각적 편집, 고급 정렬/필터링, 자동 구문 수리 및 폰트/테마 커스터마이징을 지원합니다.

---

## 🚀 주요 기능 (Key Features)

- **3가지 데이터 편집 모드 (View Modes)**
  - **Tree 모드**: 계층적 구조 시각화, 노드 접기/펼치기 및 드래그 앤 드롭 편집.
  - **Table 모드**: 객체 배열 데이터를 스프레드시트 형태로 정렬, 필터링 및 셀 단위 수정.
  - **Code 모드**: 구문 강조(Syntax Highlighting) 및 텍스트 기반 직관적 데이터 수정.
- **구글 스프레드시트 / 엑셀 스타일 Table UX**
  - **마우스 컬럼 리사이징**: `.excel-col-resizer` 패드를 이용한 자유로운 열 너비 조절.
  - **단일 클릭 셀 편집**: 마우스 클릭 시 자동 텍스트 선택 및 다중 셀 탐색.
  - **Tab & 방향키 키보드 탐색**: spreadsheet 셀 이동 인터랙션 지원.
  - **컬럼 헤더 인라인 정렬 & 필터**: 단일/다중 정렬(Multi-Sort) 및 값 검색/선택 필터 팝업 제공.
- **손상된 JSON 자동 수리 (JSON Auto-Repair)**
  - LLM 또는 작업자가 작성한 미완성/손상된 JSON 구문 자동 복구 (`repairJsonString`).
  - 마크다운 코드 블록(````json ... ````), 주석(`//`, `/* */`), 단일 따옴표, 미인용 키, Trailing Comma, Python/JS 리터럴(`None`, `True`, `undefined`, `NaN` 등) 자동 변환 및 LIFO 스택 기반 괄호 보완.
- **사용자 맞춤형 폰트 & 레이아웃 커스터마이징**
  - **UI / Code 폰트 분리**: Pretendard, Cascadia Code 등 프리셋, 로컬 시스템 폰트 탐색(`queryLocalFonts`), 직접 입력 커스텀 폰트 지원.
  - **폰트 크기 및 행 높이 조절**: `A-`/`A+` 및 드롭다운 선택, CSS 변수(`--app-font-size`, `--app-row-height`) 기반 전역 적용.
- **다크 / 라이트 테마 (Theme Support)**
  - 다크 모드(`data-theme="dark"`, `.jse-theme-dark`) 및 라이트 모드 원클릭 토글.
  - `localStorage` 상태 보존으로 재접속 시 이전 테마 유지.
- **편리한 데이터 입출력 & 클립보드 액션**
  - drag-and-drop 파일 드롭 오버레이 지원 (`.json`, `.txt`).
  - **Format 복사** (Formatted JSON) & **Compact 복사** (Minified JSON) 빠른 클립보드 복사.
  - 실시간 데이터 용량(B, KB, MB) 및 노드/항목 개수 메트릭 표시.
- **사내 내부망 전용 및 PWA 완결성**
  - Service Worker (`vite-plugin-pwa`) 기반 완전 오프라인 지원.
  - 외부 네트워크 요청 없이 모든 자원이 단독 실행 환경에서 완전하게 작동.
- **직관적인 한국어 UI**
  - 메뉴, 컨텍스트 메뉴, 검색창, 경로 탐색 바 한국어 번역 적용.
  - JSON, Tree, Table, Code, Sort, Transform 등 표준 개발 용어의 식별성은 그대로 유지.

---

## 🛠 기술 스택 (Tech Stack)

| 구분 | 기술 / 라이브러리 | 용도 및 설명 |
| :--- | :--- | :--- |
| **Framework** | **Svelte 5** | Svelte 5 Runes (`$state`, `$derived`, `mount()`) 기반 상태 관리 |
| **Build Tool** | **Vite 8** | 차세대 초고속 번들러 및 개발 서버 |
| **JSON Editor** | **svelte-jsoneditor** (v3.13) | 핵심 트리/테이블/코드 에디터 엔진 |
| **Offline / PWA** | **vite-plugin-pwa** (v1.3) | Service Worker 자동 등록 및 캐싱 지원 |
| **Validation** | **Zod** (v4) | 런타임 설정 스키마 및 설정 파싱 검증 (`src/utils/schemaUtils.js`) |
| **Testing** | **Vitest** (v5) | 빠른 고성능 단위 테스트 프레임워크 |
| **Utility** | **clsx** (v2) | 조건부 CSS 클래스명 유틸리티 |

---

## 📁 프로젝트 디렉토리 구조 (Directory Structure)

```text
imjson-editor/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions (단위 테스트 후 Pages 자동 배포)
├── public/                       # PWA 파비콘 및 매니페스트 아이콘 자원
├── src/
│   ├── constants/
│   │   └── editor.js             # 폰트 프리셋, 크기, 행높이, 샘플 데이터 세트 정의
│   ├── utils/
│   │   ├── llmUtils.js           # JSON 수리, 프롬프트 이스케이프, 스키마/타입 생성, 토큰/메트릭 계산
│   │   ├── llmUtils.test.js      # llmUtils 단위 테스트
│   │   ├── schemaUtils.js        # Zod 기반 로컬 저장소 설정 검증 유틸리티
│   │   ├── schemaUtils.test.js   # schemaUtils 단위 테스트
│   │   ├── tableUtils.js         # 순수 데이터 정렬(Multi-Sort) 및 필터링 유틸리티
│   │   └── tableUtils.test.js    # tableUtils 단위 테스트
│   ├── App.svelte                # 최상위 에디터 컴포넌트 (상태, 이벤트, 툴바, 모달)
│   ├── app.css                   # 전역 CSS 스타일 및 폰트/테마 CSS 변수
│   ├── i18n.js                   # svelte-jsoneditor 메뉴/컨텍스트 메뉴 한글화 렌더러
│   └── main.js                   # Svelte 5 애플리케이션 진입점 및 Service Worker 등록
├── index.html                    # HTML 템플릿
├── package.json                  # 프로젝트 의존성 및 스크립트 정의
└── vite.config.js                # Vite, PWA, Rollup 분할 빌드 설정
```

---

## 💻 개발 및 실행 가이드 (Getting Started)

### 1. 의존성 패키지 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속하여 에디터 확인.

### 3. 단위 테스트 실행

```bash
npm test
```

Vitest를 실행하여 `llmUtils`, `schemaUtils`, `tableUtils` 단위 테스트 검증.
Watch 모드로 실행 시:

```bash
npm run test:watch
```

### 4. 프로덕션 빌드

```bash
npm run build
```

빌드 산출물은 `dist/` 디렉토리에 생성되며, Rollup manualChunks 설정에 따라 최적화 번들링됩니다.

### 5. 프로덕션 빌드 미리보기 (Preview)

```bash
npm run preview
```

---

## 🤖 LLM & AI 에이전트 파악용 핵심 노트 (Architecture Note for LLMs)

LLM 및 AI 시스템(예: **Jules**)이 프로젝트의 동작 원리와 구현 구조를 신속하게 이해할 수 있도록 정리된 주요 기술 특징입니다.

1. **상태 관리 메커니즘**:
   - `App.svelte`는 Svelte 5 Runes (`$state`, `$derived.by`)를 적극 활용합니다.
   - 데이터 원본(`rawData`), 정렬 규칙(`sortRules`), 필터 규칙(`filterRules`)이 변경되면 `updateProcessedContent()`를 통해 `content` 바인딩을 동기화합니다.
2. **Table 모드 DOM 처리**:
   - 테이블 헤더 인라인 정렬/필터 버튼 및 리사이저는 `MutationObserver`와 `requestAnimationFrame`을 조합하여 DOM에 동적으로 주입됩니다 (`decorateTableHeaders`).
3. **Zod 런타임 안정성**:
   - `localStorage`에 저장된 테마, 폰트 크기, 행 높이, 폰트 객체는 `src/utils/schemaUtils.js`의 Zod 스키마를 통해 런타임에 항상 검증되고 올바른 fallback 값을 보장받습니다.
4. **JSON 수리 유틸리티 (`llmUtils.js`)**:
   - `repairJsonString` 함수는 단순 regex 대치가 아니라, 마크다운 제거, 주석 제거, 따옴표 대치, LIFO 스택 기반의 미닫힘 괄호/문자열 자동 복구 알고리즘을 사용합니다.
5. **i18n 렌더러 (`i18n.js`)**:
   - `svelte-jsoneditor`의 `onRenderMenu` 및 `onRenderContextMenu` 훅에 바인딩되어 있으며, DOM 변환 observer (`setupI18nObserver`)로 검색창, 모달 등의 텍스트를 실시간 한글화합니다.
6. **AI 에이전트용 추가 가이드**:
   - 프로젝트 루트의 `AGENTS.md` 파일에 개발 규칙, 모듈별 규칙, 테스팅 전략 및 수정 시 주의사항이 자세히 정리되어 있습니다.
