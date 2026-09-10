/**
 * @file llmUtils.test.js
 * @description llmUtils 구문 자동 복구 및 이스케이프, 메트릭 산출 유틸리티 유닛 테스트.
 */

import { describe, it, expect } from 'vitest';
import {
  repairJsonString,
  escapeJsonString,
  unescapeJsonString,
  estimateTokens,
  calculateDatasetMetrics
} from './llmUtils.js';

describe('llmUtils - repairJsonString', () => {
  it('Markdown 코드 블록과 주석 및 단일 따옴표를 정제함', () => {
    const raw = "```json\n// 주석\n{ 'name': 'iMJSON', 'valid': True, }\n```";
    const repaired = repairJsonString(raw);
    const parsed = JSON.parse(repaired);
    expect(parsed).toEqual({ name: 'iMJSON', valid: true });
  });

  it('미인용 키와 Trailing Comma 및 Python None 리터럴을 수리함', () => {
    const raw = '{ name: "test", value: None, }';
    const repaired = repairJsonString(raw);
    const parsed = JSON.parse(repaired);
    expect(parsed).toEqual({ name: 'test', value: null });
  });

  it('닫히지 않은 괄호를 보완하여 복구함', () => {
    const raw = '{"items": [{"id": 1}';
    const repaired = repairJsonString(raw);
    const parsed = JSON.parse(repaired);
    expect(parsed).toEqual({ items: [{ id: 1 }] });
  });
});

describe('llmUtils - escapeJsonString & unescapeJsonString', () => {
  it('JSON 이스케이프 및 언이스케이프 상호 변환을 올바르게 수행함', () => {
    const rawText = '{\n  "message": "Hello World"\n}';
    const escaped = escapeJsonString(rawText);
    expect(typeof escaped).toBe('string');
    const unescaped = unescapeJsonString(escaped);
    expect(unescaped).toBe(rawText);
  });
});

describe('llmUtils - estimateTokens & calculateDatasetMetrics', () => {
  it('토큰 수 추정 기능이 영문 및 한글에 대해 양수를 반환함', () => {
    const tokens = estimateTokens('안녕하세요 iMJSON Editor입니다.');
    expect(tokens).toBeGreaterThan(0);
  });

  it('데이터 세트 메트릭 산출이 올바르게 구성됨', () => {
    const data = [{ a: 1 }, { b: 2 }];
    const metrics = calculateDatasetMetrics(data);
    expect(metrics.nodeCount).toBeGreaterThan(0);
    expect(metrics.keyCount).toBe(2);
    expect(metrics.valueCount).toBe(2);
    expect(typeof metrics.formattedSize).toBe('string');
  });
});
