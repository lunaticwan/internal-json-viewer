/**
 * @file tableUtils.test.js
 * @description tableUtils 데이터 정렬 및 필터링 유틸리티 유닛 테스트.
 */

import { describe, it, expect } from 'vitest';
import { getProcessedData } from './tableUtils.js';

describe('tableUtils - getProcessedData', () => {
  const sampleData = [
    { id: 1, name: 'Alice', age: 30, active: true },
    { id: 2, name: 'Bob', age: 25, active: false },
    { id: 3, name: 'Charlie', age: 35, active: true },
    { id: 4, name: 'David', age: 25, active: true }
  ];

  it('비배열 입력 시 원본 그대로 반환함', () => {
    expect(getProcessedData(null, [], {})).toBeNull();
    expect(getProcessedData(undefined, [], {})).toBeUndefined();
  });

  it('단일 컬럼 숫자 오름차순 정렬을 올바르게 수행함', () => {
    const sorted = getProcessedData(sampleData, [{ key: 'age', dir: 'asc' }], {});
    expect(sorted.map((item) => item.id)).toEqual([2, 4, 1, 3]);
  });

  it('단일 컬럼 숫자 내림차순 정렬을 올바르게 수행함', () => {
    const sorted = getProcessedData(sampleData, [{ key: 'age', dir: 'desc' }], {});
    expect(sorted.map((item) => item.id)).toEqual([3, 1, 2, 4]);
  });

  it('다중 컬럼 정렬(나이 오름차순 후 이름 오름차순)을 올바르게 수행함', () => {
    const sorted = getProcessedData(sampleData, [
      { key: 'age', dir: 'asc' },
      { key: 'name', dir: 'asc' }
    ], {});
    expect(sorted.map((item) => item.name)).toEqual(['Bob', 'David', 'Alice', 'Charlie']);
  });

  it('컬럼 값 필터링을 올바르게 수행함', () => {
    const filters = {
      active: new Set(['true'])
    };
    const filtered = getProcessedData(sampleData, [], filters);
    expect(filtered.map((item) => item.id)).toEqual([1, 3, 4]);
  });
});
