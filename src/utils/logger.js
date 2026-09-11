/**
 * @file logger.js
 * @description 에디터 이벤트, 버튼 클릭, 네비게이션, 데이터 변경 로깅 유틸리티 모듈.
 * Jules AI 디버깅 및 분석을 위해 카테고리, 액션, 파싱된 객체 데이터를 상세하게 콘솔에 출력함.
 */

/**
 * 이벤트 정보를 구조화하여 콘솔에 출력함.
 *
 * @param {string} category - 이벤트 카테고리 (예: 'BUTTON', 'NAVIGATION', 'TABLE', 'FILE', 'EDITOR')
 * @param {string} action - 수행된 액션 명칭
 * @param {Record<string, any>} [details={}] - 디버깅용 상세 객체 데이터
 */
export function logEvent(category, action, details = {}) {
  const timestamp = new Date().toISOString();

  let parsedDetails;
  try {
    // 순환 참조 방지 및 구조화된 파싱 데이터 생성을 위해 JSON 직렬화/파싱
    parsedDetails = JSON.parse(JSON.stringify(details, (key, value) => {
      if (typeof value === 'function') return '[Function]';
      if (value instanceof Set) return Array.from(value);
      if (value instanceof Map) return Object.fromEntries(value);
      if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
        return `<${value.tagName.toLowerCase()} class="${value.className}">`;
      }
      return value;
    }));
  } catch (err) {
    parsedDetails = { rawDetails: String(details), parseError: err.message };
  }

  const logHeader = `[iMJSON Event] [${timestamp}] [${category.toUpperCase()}] ${action}`;

  console.log(logHeader, parsedDetails);
}
