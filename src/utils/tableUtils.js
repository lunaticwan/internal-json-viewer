/**
 * @file tableUtils.js
 * @description 테이블 모드용 순수 데이터 정렬 및 필터링 유틸리티 모듈.
 */

/**
 * 정렬 규칙 정의 객체.
 * @typedef {Object} SortRule
 * @property {string} key - 정렬 대상 컬럼/속성 이름
 * @property {'asc'|'desc'} dir - 정렬 방향 ('asc': 오름차순, 'desc': 내림차순)
 */

/**
 * 테이블 행 데이터 배열에 대해 필터링 및 다중 정렬을 수행.
 *
 * @param {Array<Record<string, any>>} source - 원본 객체 배열 데이터
 * @param {SortRule[]} sorts - 적용할 정렬 규칙 배열
 * @param {Record<string, Set<string>>} filters - 컬럼별 허용 값 집합 필터 맵
 * @returns {Array<Record<string, any>>} 정렬 및 필터링이 적용된 새로운 배열 데이터
 */
export function getProcessedData(source, sorts, filters) {
  if (!Array.isArray(source)) return source;

  let result = [...source];

  // 1. 컬럼 필터링 적용
  if (filters && Object.keys(filters).length > 0) {
    result = result.filter((row) => {
      if (!row || typeof row !== 'object') return true;
      for (const [key, allowedSet] of Object.entries(filters)) {
        if (!allowedSet || allowedSet.size === 0) continue;
        const valStr = String(row[key] ?? '');
        if (!allowedSet.has(valStr)) return false;
      }
      return true;
    });
  }

  // 2. 다중 컬럼 정렬 적용
  if (sorts && sorts.length > 0) {
    result.sort((a, b) => {
      for (const rule of sorts) {
        const valA = a?.[rule.key];
        const valB = b?.[rule.key];
        if (valA === valB) continue;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        let cmp = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          cmp = valA - valB;
        } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
          cmp = valA === valB ? 0 : valA ? 1 : -1;
        } else {
          cmp = String(valA).localeCompare(String(valB), undefined, {
            numeric: true,
            sensitivity: 'base'
          });
        }

        if (cmp !== 0) {
          return rule.dir === 'asc' ? cmp : -cmp;
        }
      }
      return 0;
    });
  }

  return result;
}
