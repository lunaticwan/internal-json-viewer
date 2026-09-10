# AGENTS.md - LLM 및 AI 개발 에디터 지침서

이 문서는 AI 에이전트(예: **Jules**)가 iMJSON 에디터 프로젝트를 이해하고, 확장 및 유지보수 작업을 수행할 때 반드시 준수해야 하는 시스템 아키텍처 및 개발 표준 가이드라인입니다.

---

## 1. 프로젝트 개요 (Overview)

- **프로젝트 명칭**: iMJSON 에디터 (`imjson-editor`)
- **핵심 특징**: 인터넷 연결이 차단된 사내 내부망(Intranet) 환경에서 독립적으로 실행되는 오프라인 완결형 JSON 에디터 (PWA 지원)
- **주요 기술 스택**:
  - **Framework**: Svelte 5 (Svelte 5 Runes: `$state`, `$derived`, `mount()`)
  - **Build Tool**: Vite 8
  - **JSON Engine**: `svelte-jsoneditor` (v3.13)
  - **PWA**: `vite-plugin-pwa` (v1.3)
  - **Schema & Validation**: Zod (v4)
  - **Testing**: Vitest (v5)

---

## 2. 코드 및 소통 표준 (Code & Communication Rules)

### 2.1 대화 및 답변 표준
- **100% 한국어 사용**: 모든 설명 및 문서 작성 시 한국어를 사용함.
- **기술 고유 명사 원형 유지**: Git 브랜치 이름, 파일/디렉토리 경로, 변수/함수/클래스 명칭, CLI 명령어는 억지 번역하지 않고 영문 원형을 유지함.
- **단정형 개조식 작성**: 사족 및 존댓말을 배제하고 개조식 및 단정형 어미(`~함`, `~기`, `~금지`, `~필수`) 사용.

### 2.2 코드 주석 및 작성 표준
- **주석 내 이모지 금지**: 소스 코드 내 주석(`//`, `/* */`) 및 TSDoc(`/** ... */`) 작성 시 이모지 사용을 엄격히 금지함.
- **담백한 비즈니스 의도 작성**: `[1단계]`와 같은 메커니즘 설명용AI 태그 기재를 금지하고, 비즈니스 동작 의도만 간결하게 서술함.
- **빌드 아티팩트 직접 수정 금지**: `dist/` 디렉토리 파일은 직접 수정하지 않으며, 항상 `src/` 내부 소스 코드를 수정한 후 빌드를 통해 재생성함.

---

## 3. 핵심 모듈 및 데이터 흐름 (Architecture & Modules)

### 3.1 `src/App.svelte` (최상위 에디터 컴포넌트)
- Svelte 5 Runes 기반 반응형 상태 관리.
- `rawData`, `sortRules`, `filterRules` 상태가 업데이트되면 `updateProcessedContent()`를 통해 `content` 상태를 조율함.
- `MutationObserver` + `requestAnimationFrame`을 활용하여 Table 모드의 인라인 정렬/필터 버튼 및 컬럼 리사이저 패드(`.excel-col-resizer`)를 DOM에 동적 주입함.

### 3.2 `src/utils/llmUtils.js` (LLM 유틸리티)
- **`repairJsonString(text)`**: LLM 및 사람 작업자가 작성한 손상된 JSON 문자열 수리. 마크다운 코드 블록 제거, 주석 제거, 따옴표 대치, 미인용 키 정제, Python/JS 리터럴 변환, LIFO 스택 기반 괄호 및 문자열 복구 수행.
- **`estimateTokens(text)`**: GPT-4 / Claude 기준 한글 및 영문 텍스트 토큰 수 계산.
- **`calculateDatasetMetrics(data)`**: 노드 수, 키/값 개수, 바이트 용량, 포맷된 크기 통계 산출.
- **`generateJsonSchema(val)`**, **`generateTypeScriptTypes(val)`**: JSON 기반 스키마 및 TypeScript 인터페이스 추출.

### 3.3 `src/utils/schemaUtils.js` (Zod 기반 로컬 저장소 검증)
- `localStorage`에 저장되는 테마(`imjson_theme`), 폰트 크기(`imjson_font_size`), 행 높이(`imjson_row_height`), 폰트 설정(`imjson_font_settings`) 데이터를 Zod 스키마로 검증 및 정제하여 런타임 안정성을 확보함.

### 3.4 `src/utils/tableUtils.js` (Table 데이터 가공)
- **`getProcessedData(source, sorts, filters)`**: 객체 배열 데이터에 대해 다중 컬럼 정렬(`sorts`) 및 컬럼별 값 검색 필터링(`filters`)을 적용하는 순수 유틸리티.

### 3.5 `src/constants/editor.js` (에디터 상수)
- UI 및 Code 폰트 프리셋(`PRESET_UI_FONTS`, `PRESET_CODE_FONTS`), 허용 폰트 크기(`FONT_SIZES`), 행 높이 옵션(`ROW_HEIGHTS`), 샘플 데이터 세트(`SAMPLE_PRESETS`) 관리.

### 3.6 `src/i18n.js` (한국어 번역)
- `onRenderMenu`, `onRenderContextMenu` 렌더링 훅 및 `setupI18nObserver` DOM 감지기를 통해 `svelte-jsoneditor` UI를 한국어로 다듬음. 기술 용어(JSON, Tree, Table, Code, Sort, Transform 등)는 영문 원형 유지.

---

## 4. 실행 및 테스트 검증 (Execution & Verification)

코드 변경을 완료한 후에는 반드시 다음 명령어들을 통해 동작 및 무결성을 검증함.

```bash
# 1. 단위 테스트 실행 (Vitest)
npm test

# 2. 프로덕션 빌드 성공 여부 검증
npm run build
```

- 단위 테스트 모듈:
  - `src/utils/llmUtils.test.js`
  - `src/utils/schemaUtils.test.js`
  - `src/utils/tableUtils.test.js`
