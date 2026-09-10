# 변경 이력 (Changelog)

이 프로젝트의 주요 변경 사항 및 버전별 릴리즈 내역입니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/) 규격을 준수합니다.

---

## [1.0.0] - 2026-09-11

### ✨ 추가됨 (Added)
- **3가지 JSON 편집 모드**:
  - Tree 모드: 계층적 트리 구조 시각화 및 노드 조작.
  - Table 모드: 객체 배열 데이터 대상 테이블 형태 조회 및 편집.
  - Code 모드: 구문 강조 및 텍스트 기반 에디팅.
- **Svelte 5 반응형 아키텍처**:
  - Svelte 5 Runes (`$state`, `$derived.by`, `mount()`) 적용.
- **스프레드시트 / 엑셀 스타일 Table UX**:
  - 마우스 드래그 컬럼 리사이징 패드 (`.excel-col-resizer`).
  - 단일 클릭 셀 편집 및 전체 텍스트 자동 선택.
  - Tab 및 방향키 키보드 탐색.
  - 컬럼 헤더 인라인 단일/다중 정렬 (Multi-Sort) 및 값 검색 필터 팝업.
- **JSON 자동 수리 유틸리티 (`llmUtils.js`)**:
  - 손상된 JSON 구문, 마크다운 코드 블록, 주석, 단일 따옴표, 미인용 키, Trailing Comma, Python/JS 리터럴 복구.
  - LIFO 스택 기반 미닫힘 괄호 및 문자열 자동 수리.
- **폰트 & 레이아웃 커스터마이징**:
  - UI 폰트 (Pretendard 등) 및 Code 폰트 (Cascadia Code 등) 분리 지정.
  - Chromium `queryLocalFonts` API 연동 시스템 폰트 탐색 및 커스텀 폰트 직접 입력.
  - 폰트 크기 조절 (`A-`, `A+`, 선택기) 및 행 높이 조절 (`18px`~`36px`).
- **테마 지원 & Zod 런타임 검증**:
  - 라이트 / 다크 테마 원클릭 토글.
  - Zod (`schemaUtils.js`) 기반 로컬 저장소 설정 검증 및 정제.
- **PWA & 사내 내부망 전용 오프라인 지원**:
  - `vite-plugin-pwa` 및 Service Worker 자일 등록으로 오프라인 완전 실행.
- **한국어 UI 지원 (`i18n.js`)**:
  - 툴바 메뉴, 컨텍스트 메뉴 및 검색창/모달/트리 노드 DOM 요소 한글화 (표준 개발 용어 영문 원형 유지).
- **단위 테스트 구축**:
  - Vitest 기반 `llmUtils`, `schemaUtils`, `tableUtils` 단위 테스트 작성.
- **GitHub Pages CI/CD 워크플로우**:
  - Push 시 자동 테스트 및 빌드/배포 워크플로우 (`.github/workflows/deploy.yml`).
