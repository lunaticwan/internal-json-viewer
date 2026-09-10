/**
 * @file llmUtils.js
 * @description LLM 개발자 툴박스 유틸리티 모듈.
 * JSON 구문 자동 복구, Prompt 문자열 Escaping/Unescaping, JSON Schema(Draft-07) 생성,
 * TypeScript 인터페이스 추출 및 토큰/메트릭 계산 기능 제공.
 */

/**
 * LLM이 생성한 손상된 JSON 문자열을 수리 및 복구.
 * 주석(//, /* *\/), 단일 따옴표, 미인용 키명, Trailing Comma, Python/JS 리터럴(None, True 등) 수정.
 *
 * @param {string} text - 원본 JSON 또는 손상된 텍스트
 * @returns {string} 복구 시도된 JSON 규격 문자열
 */
export function repairJsonString(text) {
  if (!text || typeof text !== 'string') return text;

  let cleaned = text.trim();

  // Markdown 코드 블록 문법 제거 (```json ... ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  // 주석 제거: 단일 행 주석(//) 및 다중 행 주석(/* ... */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned = cleaned.replace(/(^|[^:])\/\/[^\n]*/g, '$1');

  // 단일 따옴표 키 및 문자열 값을 쌍따옴표로 대치 ('key': -> "key":, : 'val' -> : "val")
  cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '"$1":');
  cleaned = cleaned.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');

  // 미인용 객체 키 수정 ({ key: "val" } -> { "key": "val" })
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');

  // 닫는 괄호 앞의 불필요한 Trailing Comma 제거
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // Python 및 JavaScript 특수 리터럴 변환 (None, True, False, undefined, NaN)
  cleaned = cleaned.replace(/\bNone\b/g, 'null');
  cleaned = cleaned.replace(/\bTrue\b/g, 'true');
  cleaned = cleaned.replace(/\bFalse\b/g, 'false');
  cleaned = cleaned.replace(/\bundefined\b/g, 'null');
  cleaned = cleaned.replace(/\bNaN\b/g, 'null');

  // LIFO 스택 기반 미완성 괄호 및 문자열 닫기 처리
  const stack = [];
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (char === '\\') {
      isEscaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') stack.push('}');
      else if (char === '[') stack.push(']');
      else if (char === '}') {
        const lastIdx = stack.lastIndexOf('}');
        if (lastIdx !== -1) stack.splice(lastIdx, 1);
      } else if (char === ']') {
        const lastIdx = stack.lastIndexOf(']');
        if (lastIdx !== -1) stack.splice(lastIdx, 1);
      }
    }
  }

  // 닫히지 않은 문자열 닫기
  if (inString) {
    cleaned += '"';
  }

  // 끝부분에 남은 콤마 제거
  cleaned = cleaned.replace(/,\s*$/, '');

  // 누락된 닫는 괄호/대괄호 LIFO 순서 보완
  while (stack.length > 0) {
    cleaned += stack.pop();
  }

  return cleaned;
}

/**
 * LLM 프롬프트에 직접 삽입 가능하도록 JSON 데이터를 이스케이프된 문자열로 변환.
 *
 * @param {any} text - 이스케이프 처리 대상 (객체 또는 문자열)
 * @returns {string} 이스케이프 처리된 JSON 문자열
 */
export function escapeJsonString(text) {
  if (typeof text !== 'string') {
    text = JSON.stringify(text, null, 2);
  }
  return JSON.stringify(text);
}

/**
 * 이스케이프 처리된 JSON 프롬프트 문자열을 원본 JSON 문자열로 복원.
 *
 * @param {string} text - 이스케이프된 JSON 문자열
 * @returns {string} 복원된 JSON 문자열
 */
export function unescapeJsonString(text) {
  if (!text || typeof text !== 'string') return text;
  let trimmed = text.trim();

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string') {
        trimmed = parsed;
      }
    } catch {
      trimmed = trimmed.substring(1, trimmed.length - 1);
    }
  }

  trimmed = trimmed
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');

  return trimmed;
}

/**
 * JSON 데이터를 기반으로 JSON Schema (Draft-07) 구조 자동 생성.
 *
 * @param {any} val - 스키마 추론 대상 데이터
 * @param {string} [title='Root'] - 루트 스키마 타이틀
 * @returns {string} JSON Schema 포맷의 formatted JSON 문자열
 */
export function generateJsonSchema(val, title = 'Root') {
  function getType(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    return typeof v;
  }

  function parseNode(node, keyName) {
    const type = getType(node);

    if (type === 'object') {
      const properties = {};
      const required = [];
      for (const k of Object.keys(node)) {
        properties[k] = parseNode(node[k], k);
        required.push(k);
      }
      return {
        type: 'object',
        properties,
        ...(required.length > 0 ? { required } : {})
      };
    }

    if (type === 'array') {
      if (node.length === 0) {
        return { type: 'array', items: {} };
      }
      const itemSchema = parseNode(node[0], 'item');
      return {
        type: 'array',
        items: itemSchema
      };
    }

    if (type === 'number') {
      return { type: Number.isInteger(node) ? 'integer' : 'number' };
    }

    return { type };
  }

  const rootSchema = parseNode(val, title);
  return JSON.stringify(
    {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title,
      ...rootSchema
    },
    null,
    2
  );
}

/**
 * JSON 데이터 구조로부터 TypeScript Interface 정의 코드 생성.
 *
 * @param {any} val - 타입 추출 대상 객체
 * @param {string} [rootName='RootObject'] - 루트 인터페이스 명칭
 * @returns {string} 생성된 TypeScript 인터페이스 코드
 */
export function generateTypeScriptTypes(val, rootName = 'RootObject') {
  const interfaces = [];
  let interfaceCount = 0;

  function toPascalCase(str) {
    return str.replace(/(^\w|-\w|_\w)/g, (m) => m.replace(/[-_]/g, '').toUpperCase());
  }

  function parseNode(node, name) {
    if (node === null) return 'any';
    if (Array.isArray(node)) {
      if (node.length === 0) return 'any[]';
      const itemType = parseNode(node[0], name + 'Item');
      return `${itemType}[]`;
    }
    if (typeof node === 'object') {
      const typeName = interfaceCount === 0 ? rootName : toPascalCase(name);
      interfaceCount++;

      const fields = [];
      for (const [k, v] of Object.entries(node)) {
        const fieldType = parseNode(v, k);
        const validKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
        fields.push(`  ${validKey}: ${fieldType};`);
      }

      interfaces.push(`export interface ${typeName} {\n${fields.join('\n')}\n}`);
      return typeName;
    }

    if (typeof node === 'number') return Number.isInteger(node) ? 'number' : 'number';
    if (typeof node === 'boolean') return 'boolean';
    if (typeof node === 'string') return 'string';

    return 'any';
  }

  parseNode(val, rootName);
  return interfaces.reverse().join('\n\n');
}

/**
 * JSON 및 텍스트 데이터의 LLM 토큰 수 추정 (GPT-4 / Claude 휴리스틱 알고리즘).
 *
 * @param {string|object} text - 토큰 측정 대상 데이터
 * @returns {number} 추정 토큰 수
 */
export function estimateTokens(text) {
  if (!text) return 0;
  if (typeof text !== 'string') {
    text = JSON.stringify(text);
  }

  let tokenCount = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // 한글 및 CJK 유니코드 영역 (자당 약 1.5 토큰)
    if ((code >= 0xac00 && code <= 0xd7a3) || (code >= 0x4e00 && code <= 0x9fff)) {
      tokenCount += 1.5;
    } else if (code <= 127) {
      tokenCount += 0.28; // 영문/기호 약 3.5자당 1 토큰
    } else {
      tokenCount += 1;
    }
  }

  return Math.ceil(tokenCount);
}

/**
 * 데이터 세트의 노드 개수, 키/값 수, 바이트 용량 및 추정 토큰 수 메트릭 산출.
 *
 * @param {any} data - 분석 대상 JSON 데이터
 * @returns {{nodeCount: number, keyCount: number, valueCount: number, byteSize: number, formattedSize: string, estimatedTokens: number}} 통계 객체
 */
export function calculateDatasetMetrics(data) {
  let nodeCount = 0;
  let keyCount = 0;
  let valueCount = 0;

  function traverse(node) {
    if (node === null || typeof node !== 'object') {
      valueCount++;
      nodeCount++;
      return;
    }

    if (Array.isArray(node)) {
      nodeCount++;
      for (const item of node) {
        traverse(item);
      }
      return;
    }

    nodeCount++;
    for (const [k, v] of Object.entries(node)) {
      keyCount++;
      traverse(v);
    }
  }

  traverse(data);

  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const byteSize = new Blob([jsonStr]).size;

  let formattedSize = `${byteSize} B`;
  if (byteSize >= 1024 * 1024) {
    formattedSize = `${(byteSize / (1024 * 1024)).toFixed(2)} MB`;
  } else if (byteSize >= 1024) {
    formattedSize = `${(byteSize / 1024).toFixed(1)} KB`;
  }

  return {
    nodeCount,
    keyCount,
    valueCount,
    byteSize,
    formattedSize,
    estimatedTokens: estimateTokens(jsonStr)
  };
}
