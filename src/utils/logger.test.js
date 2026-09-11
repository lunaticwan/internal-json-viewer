import { describe, it, expect, vi } from 'vitest';
import { logEvent } from './logger.js';

describe('logger.js', () => {
  it('이벤트 카테고리, 액션 및 상세 데이터를 콘솔에 올바르게 출력함', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logEvent('BUTTON', 'sample_click', { id: 'preset_1', active: true });

    expect(consoleSpy).toHaveBeenCalledOnce();
    const [header, details] = consoleSpy.mock.calls[0];
    expect(header).toContain('[iMJSON Event]');
    expect(header).toContain('[BUTTON] sample_click');
    expect(details).toEqual({ id: 'preset_1', active: true });

    consoleSpy.mockRestore();
  });

  it('Set 및 Map 객체를 직렬화 가능한 구조로 변환함', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const testSet = new Set(['value1', 'value2']);
    const testMap = new Map([['key1', 'val1']]);

    logEvent('TABLE', 'filter_change', { filterSet: testSet, filterMap: testMap });

    expect(consoleSpy).toHaveBeenCalledOnce();
    const [, details] = consoleSpy.mock.calls[0];
    expect(details.filterSet).toEqual(['value1', 'value2']);
    expect(details.filterMap).toEqual({ key1: 'val1' });

    consoleSpy.mockRestore();
  });
});
