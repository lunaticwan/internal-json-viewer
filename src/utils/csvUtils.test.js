import { describe, it, expect } from 'vitest';
import { jsonToCsv, formatCsvCell } from './csvUtils.js';

describe('csvUtils', () => {
  describe('formatCsvCell', () => {
    it('null 및 undefined는 빈 문자열을 반환해야 함', () => {
      expect(formatCsvCell(null)).toBe('');
      expect(formatCsvCell(undefined)).toBe('');
    });

    it('일반 문자열 및 숫자를 올바르게 반환해야 함', () => {
      expect(formatCsvCell('iMJSON')).toBe('iMJSON');
      expect(formatCsvCell(123)).toBe('123');
      expect(formatCsvCell(true)).toBe('true');
    });

    it('콤마, 큰따옴표, 줄바꿈이 포함된 값을 올바르게 이스케이프해야 함', () => {
      expect(formatCsvCell('Hello, World')).toBe('"Hello, World"');
      expect(formatCsvCell('Hello "World"')).toBe('"Hello ""World"""');
      expect(formatCsvCell('Line1\nLine2')).toBe('"Line1\nLine2"');
    });

    it('객체 및 배열을 JSON 문자열로 변환 후 이스케이프해야 함', () => {
      expect(formatCsvCell({ a: 1 })).toBe('"{""a"":1}"');
    });
  });

  describe('jsonToCsv', () => {
    it('UTF-8 BOM(\\uFEFF)을 포함해야 함', () => {
      const csv = jsonToCsv([]);
      expect(csv.startsWith('\uFEFF')).toBe(true);
    });

    it('객체 배열을 CSV 문자열로 정상 변환해야 함', () => {
      const data = [
        { id: 1, name: 'iMBank', active: true },
        { id: 2, name: 'iMJSON', active: false }
      ];
      const csv = jsonToCsv(data);
      expect(csv).toBe('\uFEFFid,name,active\r\n1,iMBank,true\r\n2,iMJSON,false');
    });

    it('다양한 키 조합을 가진 객체 배열의 헤더를 결합해야 함', () => {
      const data = [
        { id: 1, name: 'A' },
        { id: 2, age: 30 }
      ];
      const csv = jsonToCsv(data);
      expect(csv).toBe('\uFEFFid,name,age\r\n1,A,\r\n2,,30');
    });

    it('단일 객체를 CSV로 변환해야 함', () => {
      const data = { title: 'Test', count: 5 };
      const csv = jsonToCsv(data);
      expect(csv).toBe('\uFEFFtitle,count\r\nTest,5');
    });
  });
});
