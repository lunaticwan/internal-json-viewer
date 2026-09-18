/**
 * @file csvUtils.js
 * @description JSON 데이터를 CSV 형식으로 변환하고 UTF-8 BOM을 지원하는 유틸리티 모듈.
 */

/**
 * 단일 셀 값을 CSV에 안전하게 삽입되도록 이스케이프 및 서식화함.
 *
 * @param {any} value - 셀 데이터 값
 * @returns {string} 이스케이프된 CSV 셀 문자열
 */
export function formatCsvCell(value) {
  if (value === null || value === undefined) {
    return '';
  }

  let str = '';
  if (typeof value === 'object') {
    try {
      str = JSON.stringify(value);
    } catch {
      str = String(value);
    }
  } else {
    str = String(value);
  }

  // 큰따옴표, 콤마, 줄바꿈이 포함된 경우 큰따옴표 감싸기 및 큰따옴표 이스케이프 (" -> "")
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * JSON 데이터(객체 배열 또는 단일 객체)를 CSV 문자열로 변환함.
 * MS Excel 한글 깨짐 방지를 위해 UTF-8 BOM (\uFEFF)을 포함함.
 *
 * @param {any} data - 원본 JSON 데이터
 * @returns {string} UTF-8 BOM이 포함된 CSV 문자열
 */
export function jsonToCsv(data) {
  if (data === null || data === undefined) return '\uFEFF';

  let rows = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (typeof data === 'object') {
    rows = [data];
  } else {
    return '\uFEFF' + formatCsvCell(data);
  }

  if (rows.length === 0) return '\uFEFF';

  // 배열의 요소들이 객체인지 확인하여 모든 키(컬럼) 수집
  const isObjectArray = rows.every((row) => row !== null && typeof row === 'object' && !Array.isArray(row));

  if (isObjectArray) {
    const headers = [];
    const headerSet = new Set();

    for (const row of rows) {
      if (row && typeof row === 'object') {
        for (const key of Object.keys(row)) {
          if (!headerSet.has(key)) {
            headerSet.add(key);
            headers.push(key);
          }
        }
      }
    }

    const csvLines = [];
    // 헤더 행 생성
    csvLines.push(headers.map(formatCsvCell).join(','));

    // 데이터 행 생성
    for (const row of rows) {
      const line = headers.map((header) => formatCsvCell(row?.[header])).join(',');
      csvLines.push(line);
    }

    return '\uFEFF' + csvLines.join('\r\n');
  }

  // 객체가 아닌 일반 1차원/2차원 배열 데이터 처리
  const csvLines = rows.map((row) => {
    if (Array.isArray(row)) {
      return row.map(formatCsvCell).join(',');
    }
    return formatCsvCell(row);
  });

  return '\uFEFF' + csvLines.join('\r\n');
}
