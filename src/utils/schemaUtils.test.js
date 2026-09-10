/**
 * @file schemaUtils.test.js
 * @description Zod 기반 설정 스키마 및 검증 유틸리티 유닛 테스트.
 */

import { describe, it, expect } from 'vitest';
import {
  parseTheme,
  parseFontSize,
  parseRowHeight,
  parseFontSettings
} from './schemaUtils.js';

describe('schemaUtils - Zod 설정 파싱 검증', () => {
  it('유효한 테마 수용 및 잘못된 테마 기본값(light) 처리', () => {
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('invalid_theme')).toBe('light');
    expect(parseTheme(null)).toBe('light');
  });

  it('허용된 폰트 크기 파싱 및 범위 벗어난 경우 기본값(15) 반환', () => {
    expect(parseFontSize(14)).toBe(14);
    expect(parseFontSize('18')).toBe(18);
    expect(parseFontSize(999)).toBe(15);
    expect(parseFontSize(null)).toBe(15);
  });

  it('허용된 행 높이 파싱 및 미지원 규격의 기본값(24px) 처리', () => {
    expect(parseRowHeight('18px')).toBe('18px');
    expect(parseRowHeight('30px')).toBe('30px');
    expect(parseRowHeight('100px')).toBe('24px');
  });

  it('폰트 설정 JSON/객체 안전 파싱', () => {
    const jsonStr = JSON.stringify({
      selectedUiFontMode: 'custom',
      customUiFont: 'Arial'
    });
    const parsed = parseFontSettings(jsonStr);
    expect(parsed.selectedUiFontMode).toBe('custom');
    expect(parsed.customUiFont).toBe('Arial');

    // 손상된 JSON 또는 유효하지 않은 입력의 경우 안전 기본값 파싱
    const fallback = parseFontSettings('{ invalid json ');
    expect(fallback.selectedUiFontMode).toBe('preset');
  });
});
