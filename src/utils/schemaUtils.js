/**
 * @file schemaUtils.js
 * @description Zod 기반 애플리케이션 설정 및 데이터 검증 유틸리티 모듈.
 * 로컬 스토리지에 저장된 테마, 폰트 크기, 행 높이, 폰트 프리셋 설정의 안정성을 검증함.
 */

import { z } from 'zod';
import { FONT_SIZES, ROW_HEIGHTS } from '../constants/editor.js';

/** 테마 스키마 ('light' | 'dark') */
export const themeSchema = z.enum(['light', 'dark']).catch('light');

/** 폰트 크기 스키마 (허용 폰트 크기 배열 포함 여부 검증) */
export const fontSizeSchema = z.number().refine((val) => FONT_SIZES.includes(val), {
  message: '지원하지 않는 폰트 크기임'
}).catch(15);

/** 행 높이 스키마 (허용 행 높이 값 배열 검증) */
const validRowHeights = ROW_HEIGHTS.map((r) => r.value);
export const rowHeightSchema = z.string().refine((val) => validRowHeights.includes(val), {
  message: '지원하지 않는 행 높이임'
}).catch('24px');

/** 폰트 상세 설정 스키마 */
export const fontSettingsSchema = z.object({
  selectedUiFontMode: z.enum(['preset', 'system', 'custom']).catch('preset'),
  selectedUiFontValue: z.string().default('Pretendard, -apple-system, sans-serif'),
  customUiFont: z.string().default(''),
  selectedCodeFontMode: z.enum(['preset', 'system', 'custom']).catch('preset'),
  selectedCodeFontValue: z.string().default('Cascadia Code, Consolas, monospace'),
  customCodeFont: z.string().default('')
}).catch({
  selectedUiFontMode: 'preset',
  selectedUiFontValue: 'Pretendard, -apple-system, sans-serif',
  customUiFont: '',
  selectedCodeFontMode: 'preset',
  selectedCodeFontValue: 'Cascadia Code, Consolas, monospace',
  customCodeFont: ''
});

/**
 * 저장된 테마 값을 검증하여 정제된 테마 반환.
 * @param {any} input - 검증 대상 입력값
 * @returns {'light'|'dark'} 정제된 테마 값
 */
export function parseTheme(input) {
  return themeSchema.parse(input);
}

/**
 * 저장된 폰트 크기를 검증하여 허용된 폰트 크기 반환.
 * @param {any} input - 검증 대상 입력값
 * @returns {number} 정제된 폰트 크기 (px)
 */
export function parseFontSize(input) {
  const num = typeof input === 'string' ? parseInt(input, 10) : input;
  return fontSizeSchema.parse(num);
}

/**
 * 저장된 행 높이 수치를 검증하여 정제된 행 높이 문자열 반환.
 * @param {any} input - 검증 대상 입력값
 * @returns {string} 정제된 행 높이
 */
export function parseRowHeight(input) {
  return rowHeightSchema.parse(input);
}

/**
 * 저장된 JSON 형태의 폰트 설정을 검증하여 안전한 객체로 반환.
 * @param {any} input - JSON 문자열 또는 객체
 * @returns {z.infer<typeof fontSettingsSchema>} 검증된 폰트 설정 객체
 */
export function parseFontSettings(input) {
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return fontSettingsSchema.parse(parsed);
    } catch {
      return fontSettingsSchema.parse({});
    }
  }
  return fontSettingsSchema.parse(input ?? {});
}
