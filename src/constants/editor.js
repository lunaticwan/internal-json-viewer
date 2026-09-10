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
 * 에디터 초기화 및 신규 로드용 샘플 데이터 프리셋.
 * @type {Array<{id: string, name: string, data: any}>}
 */
export const SAMPLE_PRESETS = [
  {
    id: 'default',
    name: '기본 iMJSON 샘플',
    data: [
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
    ]
  },
  {
    id: 'llm_tool_call',
    name: 'LLM Function Call 스키마 응답',
    data: {
      "tool_call_id": "call_98f12a3d_banking_transfer",
      "name": "execute_fund_transfer",
      "arguments": {
        "source_account": "110-123-456789",
        "target_account": "100-987-654321",
        "amount": 500000,
        "currency": "KRW",
        "memo": "iMJSON LLM 개발 도구 테스트 송금",
        "verification_token": "a8f3-4d2c-9810-e2ff"
      },
      "response_status": "success",
      "execution_time_ms": 42.8,
      "audit": {
        "ip_address": "10.100.24.15",
        "system_env": "Internal Intranet"
      }
    }
  },
  {
    id: 'banking_api',
    name: '사내 금융 API 응답 데이터',
    data: {
      "header": {
        "tr_code": "M3002_ACC_LIST",
        "status_code": "200",
        "message": "정상 처리되었습니다.",
        "timestamp": "2025-05-18T14:20:00+09:00"
      },
      "body": {
        "user_id": "usr_99812",
        "user_name": "홍길동",
        "accounts": [
          { "acc_num": "110-12-34567", "type": "보통예금", "balance": 15420000, "is_active": true },
          { "acc_num": "210-98-76543", "type": "정기적금", "balance": 50000000, "is_active": true },
          { "acc_num": "330-11-22334", "type": "주택청약", "balance": 12000000, "is_active": false }
        ]
      }
    }
  }
];
