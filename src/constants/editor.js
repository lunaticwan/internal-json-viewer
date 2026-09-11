/**
 * @fileeditor.js
 * @description iMJSON 에디터 상수 정의 모듈.
 * 에디터 기본 폰트 목록, 폰트 크기 옵션, 행높이 옵션 및 샘플 데이터 세트 정의.
 */

/**
 * 기본 UI 폰트 프리셋 목록.
 * @type {Array<{label: string, value: string}>}
 */
export const PRESET_UI_FONTS = [
  { label: 'Pretendard (기본)', value: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif" },
  { label: '맑은 고딕 (Malgun Gothic)', value: "'Malgun Gothic', '맑은 고딕', sans-serif" },
  { label: '나눔고딕 (NanumGothic)', value: "'NanumGothic', '나눔고딕', sans-serif" },
  { label: '돋움 (Dotum)', value: "'Dotum', '돋움', sans-serif" },
  { label: '굴림 (Gulim)', value: "'Gulim', '굴림', sans-serif" },
  { label: 'Arial', value: "Arial, sans-serif" },
  { label: 'Segoe UI', value: "'Segoe UI', sans-serif" }
];

/**
 * 기본 코드 폰트 프리셋 목록.
 * @type {Array<{label: string, value: string}>}
 */
export const PRESET_CODE_FONTS = [
  { label: 'Cascadia Code (기본)', value: "'Cascadia Code', 'Cascadia Mono', Consolas, monospace" },
  { label: 'Consolas', value: "Consolas, 'Courier New', monospace" },
  { label: 'D2Coding', value: "'D2Coding', 'D2 coding', monospace" },
  { label: 'Fira Code', value: "'Fira Code', monospace" },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
  { label: 'Courier New', value: "'Courier New', monospace" }
];

/**
 * 에디터 지원 폰트 크기 목록 (단위: px).
 * @type {number[]}
 */
export const FONT_SIZES = [11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28];

/**
 * 에디터 행 높이 옵션 목록.
 * @type {Array<{label: string, value: string}>}
 */
export const ROW_HEIGHTS = [
  { label: '좁게 (18px)', value: '18px' },
  { label: '기본 (24px)', value: '24px' },
  { label: '넓게 (30px)', value: '30px' },
  { label: '매우 넓게 (36px)', value: '36px' }
];

/**
 * 에디터 최초 진입 시 로드되는 기본 샘플 JSON 데이터.
 * @type {Array<Record<string, any>>}
 */
export const DEFAULT_SAMPLE_DATA = [
  {
    "id": 1,
    "name": "iMJSON",
    "category": "Developer Tool",
    "status": "Active",
    "version": "1.0.0",
    "offlineSupport": true,
    "description": "iMJSON 사내 내부망 JSON 에디터"
  },
  {
    "id": 2,
    "name": "Tree Mode Visualizer",
    "category": "Feature",
    "status": "Active",
    "version": "1.2.0",
    "offlineSupport": true,
    "description": "JSON 구조를 계층적 트리 형태로 시각화 및 편집"
  },
  {
    "id": 3,
    "name": "Table Grid Viewer",
    "category": "Feature",
    "status": "Active",
    "version": "1.1.0",
    "offlineSupport": true,
    "description": "객체 배열 데이터를 표(Table) 형태로 조회 및 수정"
  }
];
