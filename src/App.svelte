<script>
  import { onMount } from 'svelte';
  import { JSONEditor, Mode } from 'svelte-jsoneditor';
  import { onRenderMenu, onRenderContextMenu, setupI18nObserver } from './i18n.js';
  import {
    repairJsonString,
    escapeJsonString,
    unescapeJsonString,
    generateJsonSchema,
    generateTypeScriptTypes,
    calculateDatasetMetrics
  } from './utils/llmUtils.js';

  // 기본 프리셋 폰트 정의
  const presetUiFonts = [
    { label: 'Pretendard (기본)', value: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif" },
    { label: '맑은 고딕 (Malgun Gothic)', value: "'Malgun Gothic', '맑은 고딕', sans-serif" },
    { label: '나눔고딕 (NanumGothic)', value: "'NanumGothic', '나눔고딕', sans-serif" },
    { label: '돋움 (Dotum)', value: "'Dotum', '돋움', sans-serif" },
    { label: '굴림 (Gulim)', value: "'Gulim', '굴림', sans-serif" },
    { label: 'Arial', value: "Arial, sans-serif" },
    { label: 'Segoe UI', value: "'Segoe UI', sans-serif" }
  ];

  const presetCodeFonts = [
    { label: 'Cascadia Code (기본)', value: "'Cascadia Code', 'Cascadia Mono', Consolas, monospace" },
    { label: 'Consolas', value: "Consolas, 'Courier New', monospace" },
    { label: 'D2Coding', value: "'D2Coding', 'D2 coding', monospace" },
    { label: 'Fira Code', value: "'Fira Code', monospace" },
    { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
    { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
    { label: 'Courier New', value: "'Courier New', monospace" }
  ];

  // 폰트 크기 및 행높이 선택 리스트 (px)
  const fontSizes = [11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28];
  const rowHeights = [
    { label: '좁게 (18px)', value: '18px' },
    { label: '기본 (24px)', value: '24px' },
    { label: '넓게 (30px)', value: '30px' },
    { label: '매우 넓게 (36px)', value: '36px' }
  ];

  // 샘플 데이터 프리셋 정의
  const samplePresets = [
    {
      id: 'default',
      name: '기본 iMJSON 샘플',
      data: [
        {
          "id": 1,
          "name": "iMJSON",
          "category": "Developer Tool",
          "status": "Active",
          "version": "1.0.0",
          "offlineSupport": true,
          "description": "iMJSON 사내 내부망 JSON 에디터"
        },
        {
          "id": 2,
          "name": "Tree Mode Visualizer",
          "category": "Feature",
          "status": "Active",
          "version": "1.2.0",
          "offlineSupport": true,
          "description": "JSON 구조를 계층적 트리 형태로 시각화 및 편집"
        },
        {
          "id": 3,
          "name": "Table Grid Viewer",
          "category": "Feature",
          "status": "Active",
          "version": "1.1.0",
          "offlineSupport": true,
          "description": "객체 배열 데이터를 표(Table) 형태로 조회 및 수정"
        }
      ]
    },
    {
      id: 'llm_tool_call',
      name: 'LLM Function Call 스키마 응답',
      data: {
        "tool_call_id": "call_98f12a3d_banking_transfer",
        "name": "execute_fund_transfer",
        "arguments": {
          "source_account": "110-123-456789",
          "target_account": "100-987-654321",
          "amount": 500000,
          "currency": "KRW",
          "memo": "iMJSON LLM 개발 도구 테스트 송금",
          "verification_token": "a8f3-4d2c-9810-e2ff"
        },
        "response_status": "success",
        "execution_time_ms": 42.8,
        "audit": {
          "ip_address": "10.100.24.15",
          "system_env": "Internal Intranet"
        }
      }
    },
    {
      id: 'banking_api',
      name: '사내 금융 API 응답 데이터',
      data: {
        "header": {
          "tr_code": "M3002_ACC_LIST",
          "status_code": "200",
          "message": "정상 처리되었습니다.",
          "timestamp": "2025-05-18T14:20:00+09:00"
        },
        "body": {
          "user_id": "usr_99812",
          "user_name": "홍길동",
          "accounts": [
            { "acc_num": "110-12-34567", "type": "보통예금", "balance": 15420000, "is_active": true },
            { "acc_num": "210-98-76543", "type": "정기적금", "balance": 50000000, "is_active": true },
            { "acc_num": "330-11-22334", "type": "주택청약", "balance": 12000000, "is_active": false }
          ]
        }
      }
    }
  ];

  let systemFonts = $state([]);

  // 상태 관리
  let selectedUiFontMode = $state('preset'); // 'preset', 'system', 'custom'
  let selectedUiFontValue = $state(presetUiFonts[0].value);
  let customUiFont = $state('');

  let selectedCodeFontMode = $state('preset'); // 'preset', 'system', 'custom'
  let selectedCodeFontValue = $state(presetCodeFonts[0].value);
  let customCodeFont = $state('');

  let fontSize = $state(15);
  let rowHeight = $state('24px');
  let theme = $state('light'); // 'light' or 'dark'
  let toolbarControlsEl = $state();

  let showFontModal = $state(false);
  let showLlmToolModal = $state(false);
  let activeLlmTab = $state('schema'); // 'schema', 'types', 'escape'

  // 드래그 앤 드롭 상태
  let isDraggingFile = $state(false);
  let dragLeaveTimer;

  // 알림 토스트 메시지
  let toastMessage = $state('');
  let toastTimer;

  function showToast(msg) {
    toastMessage = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage = '';
    }, 2500);
  }

  // 원본 데이터 저장소
  let rawData = $state(samplePresets[0].data);

  // 다중 정렬 규칙: [{ key: 'category', dir: 'asc' }, { key: 'name', dir: 'desc' }]
  let sortRules = $state([]);
  // 필터 규칙: { category: Set(['Developer Tool']), ... }
  let filterRules = $state({});

  // Memoization 캐시
  let uniqueValuesCache = new Map();

  // 팝업 오픈 상태
  let activeMenuCol = $state(null); // 연 열(Column) 이름
  let menuPos = $state({ top: 0, left: 0 });
  let filterSearchQuery = $state('');
  let tempSelectedValues = $state(new Set());

  // 계산된 JSON 에디터 전달용 content
  let content = $state({ json: samplePresets[0].data });

  let mode = $state(Mode.tree);
  let fileInput = $state();

  // 현재 활성화된 테이블 셀 인덱스 레퍼런스 (행, 열)
  let currentActiveCellIndex = $state({ row: 0, col: 0 });

  // 실시간 메트릭스 계산
  let datasetMetrics = $derived.by(() => {
    const raw = content?.json !== undefined ? content.json : content?.text || '';
    return calculateDatasetMetrics(raw);
  });

  // 데이터 정렬 & 필터링 계산 함수
  function getProcessedData(source, sorts, filters) {
    if (!Array.isArray(source)) return source;

    let result = [...source];

    // 1. 필터링 적용
    if (filters && Object.keys(filters).length > 0) {
      result = result.filter(row => {
        if (!row || typeof row !== 'object') return true;
        for (const [key, allowedSet] of Object.entries(filters)) {
          if (!allowedSet || allowedSet.size === 0) continue;
          const valStr = String(row[key] ?? '');
          if (!allowedSet.has(valStr)) return false;
        }
        return true;
      });
    }

    // 2. 다중 정렬 적용
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
            cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
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

  // 데이터 변경 시 content 업데이트
  function updateProcessedContent() {
    uniqueValuesCache.clear();
    if (Array.isArray(rawData)) {
      const processed = getProcessedData(rawData, sortRules, filterRules);
      content = { json: processed };
    }
  }

  function loadSamplePreset(presetId) {
    const preset = samplePresets.find(p => p.id === presetId);
    if (preset) {
      rawData = preset.data;
      sortRules = [];
      filterRules = {};
      uniqueValuesCache.clear();
      content = { json: preset.data };
      showToast(`'${preset.name}' 샘플 데이터 로드 완료`);
    }
  }

  function triggerFileUpload() {
    if (fileInput) fileInput.click();
  }

  function handleFileContent(text, fileName = '') {
    try {
      // 1. 일반 JSON 파싱 시도
      try {
        const parsed = JSON.parse(text);
        rawData = parsed;
        sortRules = [];
        filterRules = {};
        uniqueValuesCache.clear();
        content = { json: parsed };
        showToast(`파일 로드 완료: ${fileName || 'JSON Data'}`);
      } catch (jsonErr) {
        // 2. LLM JSON Repair 복구 시도
        const repairedText = repairJsonString(text);
        const parsed = JSON.parse(repairedText);
        rawData = parsed;
        sortRules = [];
        filterRules = {};
        uniqueValuesCache.clear();
        content = { json: parsed };
        showToast('손상된 JSON 구문 자동 복구 및 로드 성공');
      }
    } catch (err) {
      content = { text: text };
      showToast('텍스트 모드로 로드되었습니다 (JSON 파싱 불가)');
    }
  }

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      handleFileContent(e.target.result, file.name);
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // 전체 화면 드래그 앤 드롭 파일 로더
  function setupDragAndDrop() {
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(dragLeaveTimer);
      isDraggingFile = true;
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragLeaveTimer = setTimeout(() => {
        isDraggingFile = false;
      }, 100);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingFile = false;

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
          handleFileContent(evt.target.result, file.name);
        };
        reader.readAsText(file);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }

  // --- 빠른 복사 및 LLM 툴바 기능 ---
  function handleCopyFormatted() {
    const targetData = content?.json !== undefined ? content.json : content?.text;
    const str = typeof targetData === 'string' ? targetData : JSON.stringify(targetData, null, 2);
    navigator.clipboard.writeText(str);
    showToast('Formatted JSON 클립보드 복사 완료');
  }

  function handleCopyMinified() {
    const targetData = content?.json !== undefined ? content.json : content?.text;
    const str = typeof targetData === 'string' ? targetData : JSON.stringify(targetData);
    navigator.clipboard.writeText(str);
    showToast('Minified JSON 클립보드 복사 완료');
  }

  function handleCopyLlmEscaped() {
    const targetData = content?.json !== undefined ? content.json : content?.text;
    const str = escapeJsonString(targetData);
    navigator.clipboard.writeText(str);
    showToast('LLM Prompt용 Escaped JSON 복사 완료');
  }

  function handleRepairJsonAction() {
    if (content?.text) {
      try {
        const repaired = repairJsonString(content.text);
        const parsed = JSON.parse(repaired);
        rawData = parsed;
        content = { json: parsed };
        showToast('JSON 구문 자동 복구 완료');
      } catch (err) {
        alert('복구 중 오류 발생: ' + err.message);
      }
    } else {
      showToast('이미 유효한 JSON 형식입니다');
    }
  }

  function applyFontSize() {
    document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
    document.documentElement.style.setProperty('--jse-font-size', `${fontSize}px`);
    document.documentElement.style.setProperty('--jse-font-size-mono', `${fontSize}px`);
    try {
      localStorage.setItem('imjson_font_size', String(fontSize));
    } catch (err) {
      console.error('Failed to save font size:', err);
    }
  }

  function applyRowHeight() {
    document.documentElement.style.setProperty('--app-row-height', rowHeight);
    try {
      localStorage.setItem('imjson_row_height', rowHeight);
    } catch (err) {
      console.error('Failed to save row height:', err);
    }
  }

  function applyTheme() {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('jse-theme-dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('jse-theme-dark');
    }
    try {
      localStorage.setItem('imjson_theme', theme);
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  }

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    applyTheme();
  }

  function loadTheme() {
    try {
      const saved = localStorage.getItem('imjson_theme');
      if (saved === 'dark' || saved === 'light') {
        theme = saved;
      }
    } catch (err) {
      console.error('Failed to load theme:', err);
    }
  }

  function loadFontSize() {
    try {
      const saved = localStorage.getItem('imjson_font_size') || localStorage.getItem('imbank_font_size');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && fontSizes.includes(parsed)) {
          fontSize = parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load font size:', err);
    }
  }

  function loadRowHeight() {
    try {
      const saved = localStorage.getItem('imjson_row_height');
      if (saved && rowHeights.some(r => r.value === saved)) {
        rowHeight = saved;
      }
    } catch (err) {
      console.error('Failed to load row height:', err);
    }
  }

  function decreaseFontSize() {
    const currentIndex = fontSizes.indexOf(fontSize);
    if (currentIndex > 0) {
      fontSize = fontSizes[currentIndex - 1];
      applyFontSize();
    }
  }

  function increaseFontSize() {
    const currentIndex = fontSizes.indexOf(fontSize);
    if (currentIndex < fontSizes.length - 1) {
      fontSize = fontSizes[currentIndex + 1];
      applyFontSize();
    }
  }

  function handleFontSizeSelect(e) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      fontSize = val;
      applyFontSize();
    }
  }

  function handleRowHeightSelect(e) {
    rowHeight = e.target.value;
    applyRowHeight();
  }

  function attachFontSizeControl() {
    if (!toolbarControlsEl) return;
    const placeholder = document.querySelector('.jse-font-size-slot-placeholder');
    if (placeholder && placeholder.parentNode) {
      if (placeholder.parentNode !== toolbarControlsEl.parentNode || toolbarControlsEl.nextSibling !== placeholder) {
        placeholder.parentNode.insertBefore(toolbarControlsEl, placeholder);
        placeholder.style.display = 'none';
      }
    }
  }

  function handleRenderMenu(items, context) {
    const translatedItems = onRenderMenu(items, context) || items;

    const customBrandLabel = {
      type: 'button',
      text: 'iMJSON',
      className: 'jse-brand-label',
      onClick: () => {}
    };

    const openFileButton = {
      type: 'button',
      text: '파일 열기',
      title: 'JSON 파일 열기',
      className: 'jse-custom-btn',
      onClick: () => triggerFileUpload()
    };

    const llmToolboxButton = {
      type: 'button',
      text: '🤖 LLM 도구',
      title: 'LLM Schema / TypeScript Type / Prompt 변환 도구',
      className: 'jse-custom-btn jse-llm-btn',
      onClick: () => {
        showLlmToolModal = true;
      }
    };

    const fontSettingsButton = {
      type: 'button',
      text: '폰트 설정',
      title: '폰트 설정',
      className: 'jse-custom-btn',
      onClick: () => {
        showFontModal = true;
      }
    };

    const fontControlSlotPlaceholder = {
      type: 'button',
      text: '',
      className: 'jse-font-size-slot-placeholder',
      onClick: () => {}
    };

    const separator = {
      type: 'separator'
    };

    setTimeout(() => {
      attachFontSizeControl();
    }, 0);

    return [
      customBrandLabel,
      separator,
      openFileButton,
      llmToolboxButton,
      fontSettingsButton,
      separator,
      fontControlSlotPlaceholder,
      separator,
      ...translatedItems
    ];
  }

  function applyFonts() {
    let uiFontCSS = '';
    if (selectedUiFontMode === 'custom') {
      const font = customUiFont.trim();
      uiFontCSS = font ? `'${font}', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` : presetUiFonts[0].value;
    } else if (selectedUiFontMode === 'system') {
      uiFontCSS = selectedUiFontValue ? `'${selectedUiFontValue}', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` : presetUiFonts[0].value;
    } else {
      uiFontCSS = selectedUiFontValue || presetUiFonts[0].value;
    }

    let codeFontCSS = '';
    if (selectedCodeFontMode === 'custom') {
      const font = customCodeFont.trim();
      codeFontCSS = font ? `'${font}', Consolas, monospace` : presetCodeFonts[0].value;
    } else if (selectedCodeFontMode === 'system') {
      codeFontCSS = selectedCodeFontValue ? `'${selectedCodeFontValue}', Consolas, monospace` : presetCodeFonts[0].value;
    } else {
      codeFontCSS = selectedCodeFontValue || presetCodeFonts[0].value;
    }

    document.documentElement.style.setProperty('--app-font-ui', uiFontCSS);
    document.documentElement.style.setProperty('--app-font-code', codeFontCSS);

    localStorage.setItem('imjson_font_settings', JSON.stringify({
      selectedUiFontMode,
      selectedUiFontValue,
      customUiFont,
      selectedCodeFontMode,
      selectedCodeFontValue,
      customCodeFont
    }));
  }

  async function loadSystemFonts() {
    try {
      if ('queryLocalFonts' in window) {
        const fontData = await window.queryLocalFonts();
        const fontNames = Array.from(new Set(fontData.map((f) => f.family))).sort((a, b) => a.localeCompare(b));
        if (fontNames.length > 0) {
          systemFonts = fontNames;
        }
      }
    } catch (err) {
      console.warn('Local fonts query failed:', err);
    }
  }

  function loadFontSettings() {
    try {
      const saved = localStorage.getItem('imjson_font_settings') || localStorage.getItem('imbank_font_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedUiFontMode) selectedUiFontMode = parsed.selectedUiFontMode;
        if (parsed.selectedUiFontValue) selectedUiFontValue = parsed.selectedUiFontValue;
        if (parsed.customUiFont) customUiFont = parsed.customUiFont;
        if (parsed.selectedCodeFontMode) selectedCodeFontMode = parsed.selectedCodeFontMode;
        if (parsed.selectedCodeFontValue) selectedCodeFontValue = parsed.selectedCodeFontValue;
        if (parsed.customCodeFont) customCodeFont = parsed.customCodeFont;
      }
    } catch (err) {
      console.error('Failed to load font settings:', err);
    }
  }

  // Memoization 기반 유니크 컬럼 값 추출
  function getUniqueValuesForColumn(colKey) {
    if (!Array.isArray(rawData)) return [];
    if (uniqueValuesCache.has(colKey)) {
      return uniqueValuesCache.get(colKey);
    }

    const values = new Set();
    for (const row of rawData) {
      if (row && typeof row === 'object' && colKey in row) {
        values.add(String(row[colKey] ?? ''));
      }
    }
    const sorted = Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    uniqueValuesCache.set(colKey, sorted);
    return sorted;
  }

  function openHeaderMenu(colKey, targetEl) {
    const rect = targetEl.getBoundingClientRect();
    activeMenuCol = colKey;
    menuPos = {
      top: rect.bottom + window.scrollY + 2,
      left: Math.max(10, Math.min(rect.left + window.scrollX, window.innerWidth - 280))
    };
    filterSearchQuery = '';

    const allVals = getUniqueValuesForColumn(colKey);
    if (filterRules[colKey]) {
      tempSelectedValues = new Set(filterRules[colKey]);
    } else {
      tempSelectedValues = new Set(allVals);
    }
  }

  function closeHeaderMenu() {
    activeMenuCol = null;
  }

  // 정렬 핸들러
  function handleSingleSort(colKey, dir) {
    sortRules = [{ key: colKey, dir }];
    updateProcessedContent();
    closeHeaderMenu();
  }

  function handleAddMultiSort(colKey, dir) {
    const existingIdx = sortRules.findIndex(r => r.key === colKey);
    if (existingIdx >= 0) {
      sortRules[existingIdx].dir = dir;
    } else {
      sortRules = [...sortRules, { key: colKey, dir }];
    }
    updateProcessedContent();
    closeHeaderMenu();
  }

  function handleClearSort(colKey) {
    sortRules = sortRules.filter(r => r.key !== colKey);
    updateProcessedContent();
    closeHeaderMenu();
  }

  function handleClearAllSortAndFilter() {
    sortRules = [];
    filterRules = {};
    updateProcessedContent();
    closeHeaderMenu();
  }

  // 필터 핸들러
  function toggleSelectAllValues(colKey) {
    const allVals = getUniqueValuesForColumn(colKey);
    if (tempSelectedValues.size === allVals.length) {
      tempSelectedValues = new Set();
    } else {
      tempSelectedValues = new Set(allVals);
    }
  }

  function toggleValueSelection(val) {
    const next = new Set(tempSelectedValues);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    tempSelectedValues = next;
  }

  function applyColumnFilter(colKey) {
    const allVals = getUniqueValuesForColumn(colKey);
    if (tempSelectedValues.size === allVals.length) {
      delete filterRules[colKey];
      filterRules = { ...filterRules };
    } else {
      filterRules = {
        ...filterRules,
        [colKey]: new Set(tempSelectedValues)
      };
    }
    updateProcessedContent();
    closeHeaderMenu();
  }

  function clearColumnFilter(colKey) {
    delete filterRules[colKey];
    filterRules = { ...filterRules };
    updateProcessedContent();
    closeHeaderMenu();
  }

  // DOM mutation observer for table header decorator (최적화: MutationObserver + requestAnimationFrame)
  let headerObserver;
  let rafHeaderId;

  function decorateTableHeaders() {
    if (mode !== Mode.table) return;
    const thEls = document.querySelectorAll('.jse-table-mode table th:not(.jse-table-cell-gutter)');
    thEls.forEach((th) => {
      let colName = '';
      const colNameSpan = th.querySelector('.jse-column-name');
      if (colNameSpan) {
        colName = colNameSpan.textContent.trim();
      } else {
        colName = th.textContent.replace(/[▲▼🔍0-9]/g, '').trim();
      }

      if (!colName) return;

      let btn = th.querySelector('.excel-header-trigger');
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'excel-header-trigger';
        th.appendChild(btn);
      }

      const sortIdx = sortRules.findIndex(r => r.key === colName);
      let sortBadge = '';
      if (sortIdx >= 0) {
        const rule = sortRules[sortIdx];
        const arrow = rule.dir === 'asc' ? '▲' : '▼';
        sortBadge = sortRules.length > 1 ? `${arrow}${sortIdx + 1}` : arrow;
      }

      const isFiltered = filterRules[colName] && filterRules[colName].size < getUniqueValuesForColumn(colName).length;
      let filterBadge = isFiltered ? '🔍' : '';

      btn.innerHTML = `<span class="excel-badge">${sortBadge}${filterBadge}</span><span class="excel-arrow">▼</span>`;
      btn.onclick = (e) => {
        e.stopPropagation();
        openHeaderMenu(colName, btn);
      };
    });
  }

  function setupHeaderObserver() {
    const scheduleDecorate = () => {
      if (rafHeaderId) cancelAnimationFrame(rafHeaderId);
      rafHeaderId = requestAnimationFrame(() => {
        decorateTableHeaders();
      });
    };

    headerObserver = new MutationObserver(() => {
      scheduleDecorate();
    });

    headerObserver.observe(document.body, { childList: true, subtree: true });
    scheduleDecorate();

    return () => {
      if (headerObserver) headerObserver.disconnect();
      if (rafHeaderId) cancelAnimationFrame(rafHeaderId);
    };
  }

  // 특정 셀 활성화 및 편집 모드 트리거 지원 함수
  function activateCellAt(rowIndex, colIndex) {
    const rows = Array.from(document.querySelectorAll('.jse-table-mode tr.jse-table-row'));
    if (rowIndex < 0 || rowIndex >= rows.length) return;

    const row = rows[rowIndex];
    const cells = Array.from(row.querySelectorAll('td.jse-table-cell'));
    if (colIndex < 0 || colIndex >= cells.length) return;

    const targetTd = cells[colIndex];
    currentActiveCellIndex = { row: rowIndex, col: colIndex };

    const valEl = targetTd.querySelector('.jse-value');
    if (valEl) {
      const dblEvent = new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window });
      valEl.dispatchEvent(dblEvent);
    } else {
      targetTd.focus();
    }
  }

  // --- 구글 스프레드시트 UX: 단일 클릭 편집, 전체 선택, Tab/방향키 이동 ---
  function setupSpreadsheetUX() {
    const handleGlobalClick = (e) => {
      const target = e.target;
      if (!target || typeof target.closest !== 'function') return;

      if (target.closest('.excel-header-trigger') || target.closest('.excel-menu-popup')) return;

      const cellVal = target.closest('.jse-value, .jse-key');
      if (cellVal && !cellVal.classList.contains('jse-editing')) {
        const td = cellVal.closest('td.jse-table-cell');
        if (td) {
          const row = td.closest('tr.jse-table-row');
          if (row) {
            const rows = Array.from(document.querySelectorAll('.jse-table-mode tr.jse-table-row'));
            const cells = Array.from(row.querySelectorAll('td.jse-table-cell'));
            currentActiveCellIndex = {
              row: rows.indexOf(row),
              col: cells.indexOf(td)
            };
          }
        }

        const dblEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        cellVal.dispatchEvent(dblEvent);
      }
    };

    const handleGlobalFocusIn = (e) => {
      const target = e.target;
      if (!target) return;

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (!target.classList.contains('jse-hidden-input')) {
          setTimeout(() => {
            target.select?.();
          }, 10);
        }
      } else if (target.isContentEditable || target.classList.contains('cm-content')) {
        setTimeout(() => {
          const range = document.createRange();
          range.selectNodeContents(target);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }, 10);
      }
    };

    const handleGlobalKeyDown = (e) => {
      if (mode !== Mode.table) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();

        const rows = Array.from(document.querySelectorAll('.jse-table-mode tr.jse-table-row'));
        if (rows.length === 0) return;

        let { row, col } = currentActiveCellIndex;
        const currentRowCells = Array.from(rows[row]?.querySelectorAll('td.jse-table-cell') || []);

        if (!e.shiftKey) {
          if (col < currentRowCells.length - 1) {
            col += 1;
          } else if (row < rows.length - 1) {
            row += 1;
            col = 0;
          }
        } else {
          if (col > 0) {
            col -= 1;
          } else if (row > 0) {
            row -= 1;
            const prevRowCells = Array.from(rows[row].querySelectorAll('td.jse-table-cell'));
            col = prevRowCells.length - 1;
          }
        }

        activateCellAt(row, col);
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const active = document.activeElement;
        const isEditingInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) && !active.classList.contains('jse-hidden-input');

        if (!isEditingInput || e.ctrlKey || e.altKey) {
          e.preventDefault();
          e.stopPropagation();

          const rows = Array.from(document.querySelectorAll('.jse-table-mode tr.jse-table-row'));
          if (rows.length === 0) return;

          let { row, col } = currentActiveCellIndex;
          if (e.key === 'ArrowRight') col += 1;
          if (e.key === 'ArrowLeft') col -= 1;
          if (e.key === 'ArrowDown') row += 1;
          if (e.key === 'ArrowUp') row -= 1;

          activateCellAt(row, col);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    document.addEventListener('focusin', handleGlobalFocusIn, true);
    document.addEventListener('keydown', handleGlobalKeyDown, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      document.removeEventListener('focusin', handleGlobalFocusIn, true);
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }

  onMount(() => {
    loadFontSettings();
    loadFontSize();
    loadRowHeight();
    loadTheme();
    loadSystemFonts();
    applyFonts();
    applyFontSize();
    applyRowHeight();
    applyTheme();

    setTimeout(() => {
      attachFontSizeControl();
    }, 50);

    const cleanupI18n = setupI18nObserver();
    const cleanupUX = setupSpreadsheetUX();
    const cleanupHeader = setupHeaderObserver();
    const cleanupDragDrop = setupDragAndDrop();

    return () => {
      cleanupI18n();
      cleanupUX();
      cleanupHeader();
      cleanupDragDrop();
    };
  });

  function handleModeChange(newMode) {
    mode = newMode;
    setTimeout(() => {
      attachFontSizeControl();
      decorateTableHeaders();
    }, 50);
  }

  function handleContentChange(newContent) {
    uniqueValuesCache.clear();
    if (newContent && newContent.json) {
      rawData = newContent.json;
      updateProcessedContent();
    } else {
      content = newContent;
    }
  }
</script>

<div class="container">
  <input bind:this={fileInput} type="file" accept=".json,application/json,text/plain" onchange={handleFileUpload} style="display: none;" />

  <!-- 알림 토스트 UI -->
  {#if toastMessage}
    <div class="toast-notification">
      ✨ {toastMessage}
    </div>
  {/if}

  <!-- 전체 화면 드래그 앤 드롭 오버레이 -->
  {#if isDraggingFile}
    <div class="drag-drop-overlay">
      <div class="drag-drop-box">
        <div class="drag-icon">📁</div>
        <h3>JSON 파일 놓기 (Drop File Here)</h3>
        <p>어디서든 JSON 또는 텍스트 파일을 드롭하면 에디터에 로드됩니다.</p>
      </div>
    </div>
  {/if}

  <!-- 툴바 삽입용 커스텀 컨트롤 그룹 -->
  <div bind:this={toolbarControlsEl} class="jse-toolbar-controls">
    <!-- 샘플 데이터 빠른 선택기 -->
    <div class="jse-sample-group">
      <span class="jse-control-label">샘플</span>
      <select
        class="jse-font-size-select jse-sample-select"
        onchange={(e) => loadSamplePreset(e.target.value)}
        title="테스트용 샘플 데이터 세트 불러오기"
      >
        <option value="" disabled selected>샘플 선택</option>
        {#each samplePresets as preset}
          <option value={preset.id}>{preset.name}</option>
        {/each}
      </select>
    </div>

    <!-- 폰트 크기 조절 -->
    <div class="jse-font-size-group">
      <span class="jse-control-label">크기</span>
      <button
        type="button"
        class="jse-font-size-btn"
        onclick={decreaseFontSize}
        disabled={fontSize <= fontSizes[0]}
        title="폰트 크기 작게 (A-)"
      >
        A-
      </button>
      <select
        class="jse-font-size-select"
        value={fontSize}
        onchange={handleFontSizeSelect}
        title="폰트 크기 선택"
      >
        {#each fontSizes as size}
          <option value={size}>{size}px</option>
        {/each}
      </select>
      <button
        type="button"
        class="jse-font-size-btn"
        onclick={increaseFontSize}
        disabled={fontSize >= fontSizes[fontSizes.length - 1]}
        title="폰트 크기 크게 (A+)"
      >
        A+
      </button>
    </div>

    <!-- 행 높이 -->
    <div class="jse-row-height-group">
      <span class="jse-control-label">행높이</span>
      <select
        class="jse-font-size-select"
        value={rowHeight}
        onchange={handleRowHeightSelect}
        title="행 높이 선택"
      >
        {#each rowHeights as rh}
          <option value={rh.value}>{rh.label}</option>
        {/each}
      </select>
    </div>

    <!-- 빠른 복사 도구 버튼 그룹 -->
    <div class="jse-quick-action-group">
      <button
        type="button"
        class="jse-action-chip"
        onclick={handleCopyFormatted}
        title="Formatted JSON 클립보드 복사"
      >
        📋 Format 복사
      </button>
      <button
        type="button"
        class="jse-action-chip"
        onclick={handleCopyMinified}
        title="Minified JSON (한 줄) 복사"
      >
        ⚡ Compact 복사
      </button>
      <button
        type="button"
        class="jse-action-chip highlight-chip"
        onclick={handleCopyLlmEscaped}
        title="LLM Prompt용 Escaped String 복사"
      >
        🤖 LLM Escaped
      </button>
      {#if content?.text}
        <button
          type="button"
          class="jse-action-chip repair-chip"
          onclick={handleRepairJsonAction}
          title="손상된 LLM JSON 구문 자동 복구"
        >
          🔧 JSON 수리
        </button>
      {/if}
    </div>

    <!-- 테마 토글 -->
    <div class="jse-theme-group">
      <button
        type="button"
        class="jse-theme-toggle-btn"
        onclick={toggleTheme}
        title={theme === 'light' ? '다크 테마로 변경' : '라이트 테마로 변경'}
      >
        {theme === 'light' ? '🌙 다크' : '☀️ 라이트'}
      </button>
    </div>
  </div>

  <!-- 데이터 통계 & LLM 지표 서브 스탯바 -->
  <div class="jse-stats-bar">
    <div class="stats-item">
      <span class="stats-label">용량:</span>
      <span class="stats-value">{datasetMetrics.formattedSize}</span>
    </div>
    <div class="stats-divider"></div>
    <div class="stats-item">
      <span class="stats-label">노드/항목:</span>
      <span class="stats-value">{datasetMetrics.nodeCount.toLocaleString()}개</span>
    </div>
    <div class="stats-divider"></div>
    <div class="stats-item highlight-stat">
      <span class="stats-label">🤖 추정 LLM 토큰:</span>
      <span class="stats-value">~{datasetMetrics.estimatedTokens.toLocaleString()} Tokens</span>
    </div>
  </div>

  <!-- 폰트 설정 모달 -->
  {#if showFontModal}
    <div class="modal-backdrop" onclick={() => (showFontModal = false)} onkeydown={(e) => e.key === 'Escape' && (showFontModal = false)} role="presentation" tabindex="-1">
      <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
        <div class="modal-header">
          <h2 id="modal-title">폰트 설정</h2>
          <button class="close-btn" onclick={() => (showFontModal = false)} aria-label="닫기">&times;</button>
        </div>
        <div class="modal-body">
          <div class="font-section">
            <h3>기본 UI 폰트 (메뉴 및 레이아웃)</h3>
            <div class="mode-selector">
              <label>
                <input type="radio" name="uiFontMode" value="preset" bind:group={selectedUiFontMode} onchange={applyFonts} />
                프리셋
              </label>
              {#if systemFonts.length > 0}
                <label>
                  <input type="radio" name="uiFontMode" value="system" bind:group={selectedUiFontMode} onchange={applyFonts} />
                  시스템 폰트 ({systemFonts.length}개)
                </label>
              {/if}
              <label>
                <input type="radio" name="uiFontMode" value="custom" bind:group={selectedUiFontMode} onchange={applyFonts} />
                직접 입력
              </label>
            </div>

            {#if selectedUiFontMode === 'preset'}
              <select bind:value={selectedUiFontValue} onchange={applyFonts} class="font-select">
                {#each presetUiFonts as font}
                  <option value={font.value}>{font.label}</option>
                {/each}
              </select>
            {:else if selectedUiFontMode === 'system'}
              <select bind:value={selectedUiFontValue} onchange={applyFonts} class="font-select">
                {#each systemFonts as fontName}
                  <option value={fontName}>{fontName}</option>
                {/each}
              </select>
            {:else if selectedUiFontMode === 'custom'}
              <input
                type="text"
                bind:value={customUiFont}
                oninput={applyFonts}
                placeholder="예: Pretendard, Malgun Gothic"
                class="font-input"
              />
            {/if}
          </div>

          <div class="font-section">
            <h3>코드 폰트 (데이터 및 에디터 편집 영역)</h3>
            <div class="mode-selector">
              <label>
                <input type="radio" name="codeFontMode" value="preset" bind:group={selectedCodeFontMode} onchange={applyFonts} />
                프리셋
              </label>
              {#if systemFonts.length > 0}
                <label>
                  <input type="radio" name="codeFontMode" value="system" bind:group={selectedCodeFontMode} onchange={applyFonts} />
                  시스템 폰트 ({systemFonts.length}개)
                </label>
              {/if}
              <label>
                <input type="radio" name="codeFontMode" value="custom" bind:group={selectedCodeFontMode} onchange={applyFonts} />
                직접 입력
              </label>
            </div>

            {#if selectedCodeFontMode === 'preset'}
              <select bind:value={selectedCodeFontValue} onchange={applyFonts} class="font-select">
                {#each presetCodeFonts as font}
                  <option value={font.value}>{font.label}</option>
                {/each}
              </select>
            {:else if selectedCodeFontMode === 'system'}
              <select bind:value={selectedCodeFontValue} onchange={applyFonts} class="font-select">
                {#each systemFonts as fontName}
                  <option value={fontName}>{fontName}</option>
                {/each}
              </select>
            {:else if selectedCodeFontMode === 'custom'}
              <input
                type="text"
                bind:value={customCodeFont}
                oninput={applyFonts}
                placeholder="예: Cascadia Code, Consolas"
                class="font-input"
              />
            {/if}
          </div>

          <div class="font-preview">
            <h4>폰트 적용 미리보기</h4>
            <div class="preview-box ui-preview">
              <span>[UI 폰트 영역] iMJSON - 메뉴 &amp; 컨트롤</span>
            </div>
            <div class="preview-box code-preview">
              <span>[Code 폰트 영역] "status": "Active", "count": 100</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" onclick={() => (showFontModal = false)}>확인</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- LLM 개발자 툴박스 모달 -->
  {#if showLlmToolModal}
    <div class="modal-backdrop" onclick={() => (showLlmToolModal = false)} onkeydown={(e) => e.key === 'Escape' && (showLlmToolModal = false)} role="presentation" tabindex="-1">
      <div class="modal-content llm-modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="llm-modal-title" tabindex="-1">
        <div class="modal-header">
          <h2 id="llm-modal-title">🤖 LLM Developer Toolbox</h2>
          <button class="close-btn" onclick={() => (showLlmToolModal = false)} aria-label="닫기">&times;</button>
        </div>
        <div class="modal-body">
          <div class="llm-tab-bar">
            <button class="llm-tab-btn" class:active={activeLlmTab === 'schema'} onclick={() => activeLlmTab = 'schema'}>
              📐 JSON Schema 추출
            </button>
            <button class="llm-tab-btn" class:active={activeLlmTab === 'types'} onclick={() => activeLlmTab = 'types'}>
              🏷️ TypeScript Type
            </button>
            <button class="llm-tab-btn" class:active={activeLlmTab === 'escape'} onclick={() => activeLlmTab = 'escape'}>
              💬 Prompt Escaped String
            </button>
          </div>

          {#if activeLlmTab === 'schema'}
            {@const schemaText = generateJsonSchema(content?.json !== undefined ? content.json : {})}
            <div class="llm-output-box">
              <div class="llm-box-header">
                <span>LLM Function Calling용 JSON Schema (Draft 7)</span>
                <button class="copy-code-btn" onclick={() => { navigator.clipboard.writeText(schemaText); showToast('JSON Schema 복사 완료'); }}>
                  📋 스키마 복사
                </button>
              </div>
              <pre class="code-area"><code>{schemaText}</code></pre>
            </div>
          {:else if activeLlmTab === 'types'}
            {@const typesText = generateTypeScriptTypes(content?.json !== undefined ? content.json : {})}
            <div class="llm-output-box">
              <div class="llm-box-header">
                <span>TypeScript Interface / Type 정의</span>
                <button class="copy-code-btn" onclick={() => { navigator.clipboard.writeText(typesText); showToast('TypeScript Type 복사 완료'); }}>
                  📋 타입 복사
                </button>
              </div>
              <pre class="code-area"><code>{typesText}</code></pre>
            </div>
          {:else if activeLlmTab === 'escape'}
            {@const escapedText = escapeJsonString(content?.json !== undefined ? content.json : content?.text)}
            <div class="llm-output-box">
              <div class="llm-box-header">
                <span>LLM System / User Prompt 삽입용 Escaped String</span>
                <button class="copy-code-btn" onclick={() => { navigator.clipboard.writeText(escapedText); showToast('Escaped String 복사 완료'); }}>
                  📋 Escaped 복사
                </button>
              </div>
              <pre class="code-area"><code>{escapedText}</code></pre>
            </div>
          {/if}
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick={() => (showLlmToolModal = false)}>닫기</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- 활성 정렬 & 필터 상태 정보 바 (테이블 모드 전용) -->
  {#if mode === Mode.table && (sortRules.length > 0 || Object.keys(filterRules).length > 0)}
    <div class="excel-status-bar">
      <div class="excel-status-info">
        {#if sortRules.length > 0}
          <span class="status-tag sort-tag">
            📊 정렬: {sortRules.map((r, i) => `${r.key} (${r.dir === 'asc' ? '오름차순' : '내림차순'}${sortRules.length > 1 ? ' #' + (i + 1) : ''})`).join(', ')}
          </span>
        {/if}
        {#if Object.keys(filterRules).length > 0}
          <span class="status-tag filter-tag">
            🔍 필터 적용 중 ({Object.keys(filterRules).join(', ')})
          </span>
        {/if}
      </div>
      <button class="excel-reset-btn" onclick={handleClearAllSortAndFilter}>
        🔄 전체 정렬 &amp; 필터 초기화
      </button>
    </div>
  {/if}

  <!-- 엑셀 스타일 헤더 정렬 & 필터 팝업 메뉴 -->
  {#if activeMenuCol}
    <div class="excel-backdrop" onclick={closeHeaderMenu} onkeydown={(e) => e.key === 'Escape' && closeHeaderMenu()} role="presentation" tabindex="-1">
      <div
        class="excel-menu-popup"
        style="top: {menuPos.top}px; left: {menuPos.left}px;"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="dialog"
        tabindex="-1"
      >
        <div class="popup-header">
          <span class="col-title">열: <strong>{activeMenuCol}</strong></span>
          <button class="popup-close" onclick={closeHeaderMenu}>&times;</button>
        </div>

        <!-- 정렬 섹션 -->
        <div class="popup-section">
          <div class="section-title">정렬 옵션</div>
          <button class="menu-action-btn" onclick={() => handleSingleSort(activeMenuCol, 'asc')}>
            <span class="icon">▲</span> 오름차순 정렬 (A-Z / 0-9)
          </button>
          <button class="menu-action-btn" onclick={() => handleSingleSort(activeMenuCol, 'desc')}>
            <span class="icon">▼</span> 내림차순 정렬 (Z-A / 9-0)
          </button>
          <button class="menu-action-btn highlight" onclick={() => handleAddMultiSort(activeMenuCol, 'asc')}>
            <span class="icon">➕</span> 다중 정렬 추가 (오름차순)
          </button>
          <button class="menu-action-btn highlight" onclick={() => handleAddMultiSort(activeMenuCol, 'desc')}>
            <span class="icon">➕</span> 다중 정렬 추가 (내림차순)
          </button>
          {#if sortRules.some(r => r.key === activeMenuCol)}
            <button class="menu-action-btn danger" onclick={() => handleClearSort(activeMenuCol)}>
              <span class="icon">❌</span> 이 열 정렬 해제
            </button>
          {/if}
        </div>

        <div class="popup-divider"></div>

        <!-- 필터 섹션 -->
        <div class="popup-section">
          <div class="section-title">값 필터링 (Filter)</div>
          <input
            type="text"
            class="filter-search-input"
            bind:value={filterSearchQuery}
            placeholder="🔍 값 검색..."
          />

          {#key activeMenuCol}
            {@const uniqueVals = getUniqueValuesForColumn(activeMenuCol).filter(v => v.toLowerCase().includes(filterSearchQuery.toLowerCase()))}
            <div class="value-list-container">
              <label class="value-item select-all">
                <input
                  type="checkbox"
                  checked={tempSelectedValues.size === getUniqueValuesForColumn(activeMenuCol).length}
                  onchange={() => toggleSelectAllValues(activeMenuCol)}
                />
                <strong>(전체 선택)</strong>
              </label>

              {#each uniqueVals as val}
                <label class="value-item">
                  <input
                    type="checkbox"
                    checked={tempSelectedValues.has(val)}
                    onchange={() => toggleValueSelection(val)}
                  />
                  <span>{val === '' ? '(빈 값)' : val}</span>
                </label>
              {:else}
                <div class="no-result">검색 결과가 없습니다.</div>
              {/each}
            </div>
          {/key}

          <div class="filter-actions">
            {#if filterRules[activeMenuCol]}
              <button class="btn-sub danger-sub" onclick={() => clearColumnFilter(activeMenuCol)}>필터 해제</button>
            {/if}
            <button class="btn-sub" onclick={closeHeaderMenu}>취소</button>
            <button class="btn-sub primary-sub" onclick={() => applyColumnFilter(activeMenuCol)}>적용</button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <main class="editor-container">
    <JSONEditor
      {content}
      {mode}
      className={theme === 'dark' ? 'jse-theme-dark' : ''}
      onRenderMenu={handleRenderMenu}
      {onRenderContextMenu}
      onChange={handleContentChange}
      onChangeMode={handleModeChange}
    />
  </main>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background-color: #f8fafc;
    position: relative;
  }

  /* 알림 토스트 UI */
  .toast-notification {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0f172a;
    color: #38bdf8;
    border: 1px solid #0284c7;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    z-index: 3000;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* 드래그 앤 드롭 오버레이 */
  .drag-drop-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(4px);
    z-index: 5000;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .drag-drop-box {
    border: 3px dashed #38bdf8;
    background: rgba(15, 23, 42, 0.9);
    border-radius: 16px;
    padding: 40px 60px;
    text-align: center;
    color: #ffffff;
  }

  .drag-icon {
    font-size: 50px;
    margin-bottom: 12px;
  }

  .drag-drop-box h3 {
    font-size: 20px;
    color: #38bdf8;
    margin-bottom: 8px;
  }

  .drag-drop-box p {
    font-size: 14px;
    color: #cbd5e1;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .btn-primary {
    background-color: #2563eb;
    color: #ffffff;
  }

  .btn-primary:hover {
    background-color: #1d4ed8;
  }

  /* 서브 통계 바 스타일 */
  .jse-stats-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 16px;
    background-color: #1e293b;
    border-bottom: 1px solid #334155;
    font-size: 12px;
    color: #94a3b8;
  }

  .stats-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stats-label {
    color: #64748b;
  }

  .stats-value {
    color: #f1f5f9;
    font-weight: 600;
    font-family: var(--app-font-code);
  }

  .stats-item.highlight-stat .stats-value {
    color: #38bdf8;
    font-weight: 700;
  }

  .stats-divider {
    width: 1px;
    height: 12px;
    background-color: #334155;
  }

  /* Status Bar Style */
  .excel-status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 12px;
    background-color: #e0f2fe;
    border-bottom: 1px solid #bae6fd;
    font-size: 12px;
    color: #0369a1;
  }

  :global([data-theme="dark"]) .excel-status-bar {
    background-color: #0f2942;
    border-bottom-color: #1e40af;
    color: #7dd3fc;
  }

  .excel-status-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .status-tag {
    font-weight: 600;
  }

  .excel-reset-btn {
    background: #ffffff;
    border: 1px solid #0284c7;
    color: #0284c7;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  :global([data-theme="dark"]) .excel-reset-btn {
    background: #1e293b;
    border-color: #38bdf8;
    color: #38bdf8;
  }

  /* Modal Style */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(15, 23, 42, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
  }

  .modal-content {
    background: #ffffff;
    border-radius: 10px;
    width: 460px;
    max-width: 90vw;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-content.llm-modal-content {
    width: 680px;
    max-width: 95vw;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.125rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h2 {
    font-size: 1rem;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 1.25rem;
    line-height: 1;
    color: #64748b;
    cursor: pointer;
    padding: 0 0.25rem;
  }

  .close-btn:hover {
    color: #0f172a;
  }

  .modal-body {
    padding: 1.125rem;
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
    max-height: 70vh;
    overflow-y: auto;
  }

  /* LLM 툴박스 탭 및 출력 스타일 */
  .llm-tab-bar {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
  }

  .llm-tab-btn {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #475569;
    cursor: pointer;
    transition: all 0.12s;
  }

  .llm-tab-btn.active {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
  }

  .llm-output-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .llm-box-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 700;
    color: #334155;
  }

  .copy-code-btn {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 700;
    background: #0f172a;
    color: #38bdf8;
    border: 1px solid #0284c7;
    border-radius: 4px;
    cursor: pointer;
  }

  .copy-code-btn:hover {
    background: #1e293b;
  }

  .code-area {
    background: #0f172a;
    color: #38bdf8;
    padding: 12px;
    border-radius: 8px;
    font-family: var(--app-font-code);
    font-size: 13px;
    max-height: 320px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .font-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .font-section h3 {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #334155;
  }

  .mode-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.75rem;
    color: #475569;
  }

  .mode-selector label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
  }

  .font-select,
  .font-input {
    width: 100%;
    padding: 0.4rem 0.6rem;
    font-size: 0.8125rem;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background-color: #ffffff;
    color: #0f172a;
    outline: none;
    transition: border-color 0.15s ease-in-out;
  }

  .font-select:focus,
  .font-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .font-preview {
    margin-top: 0.25rem;
    padding-top: 0.75rem;
    border-top: 1px dashed #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .font-preview h4 {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
  }

  .preview-box {
    padding: 0.45rem 0.65rem;
    border-radius: 5px;
    border: 1px solid #e2e8f0;
    font-size: 0.8125rem;
  }

  .ui-preview {
    background-color: #f8fafc;
    font-family: var(--app-font-ui);
    color: #1e293b;
  }

  .code-preview {
    background-color: #1e293b;
    color: #38bdf8;
    font-family: var(--app-font-code);
  }

  .modal-footer {
    padding: 0.75rem 1.125rem;
    border-top: 1px solid #e2e8f0;
    background-color: #f8fafc;
    display: flex;
    justify-content: flex-end;
  }

  /* Excel Header Dropdown Menu Style */
  .excel-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2000;
  }

  .excel-menu-popup {
    position: absolute;
    width: 270px;
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    padding: 8px;
    z-index: 2001;
    font-family: var(--app-font-ui);
  }

  :global([data-theme="dark"]) .excel-menu-popup {
    background-color: #1e293b;
    border-color: #334155;
    color: #f8fafc;
  }

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px 8px 6px;
    border-bottom: 1px solid #e2e8f0;
  }

  :global([data-theme="dark"]) .popup-header {
    border-bottom-color: #334155;
  }

  .col-title {
    font-size: 13px;
    color: #334155;
  }

  :global([data-theme="dark"]) .col-title {
    color: #cbd5e1;
  }

  .popup-close {
    background: transparent;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: #64748b;
  }

  .popup-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 0;
  }

  .section-title {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    padding: 2px 6px;
    text-transform: uppercase;
  }

  .menu-action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 6px 8px;
    font-size: 12px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    color: #0f172a;
    transition: background 0.12s;
  }

  :global([data-theme="dark"]) .menu-action-btn {
    color: #f1f5f9;
  }

  .menu-action-btn:hover {
    background-color: #f1f5f9;
  }

  :global([data-theme="dark"]) .menu-action-btn:hover {
    background-color: #334155;
  }

  .menu-action-btn.highlight {
    color: #0284c7;
    font-weight: 600;
  }

  :global([data-theme="dark"]) .menu-action-btn.highlight {
    color: #38bdf8;
  }

  .menu-action-btn.danger {
    color: #dc2626;
  }

  .popup-divider {
    height: 1px;
    background-color: #e2e8f0;
    margin: 4px 0;
  }

  :global([data-theme="dark"]) .popup-divider {
    background-color: #334155;
  }

  .filter-search-input {
    width: 100%;
    padding: 5px 8px;
    font-size: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    outline: none;
    margin-bottom: 4px;
  }

  :global([data-theme="dark"]) .filter-search-input {
    background-color: #0f172a;
    border-color: #475569;
    color: #ffffff;
  }

  .value-list-container {
    max-height: 140px;
    overflow-y: auto;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  :global([data-theme="dark"]) .value-list-container {
    border-color: #334155;
  }

  .value-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 2px 4px;
    cursor: pointer;
    border-radius: 3px;
  }

  .value-item:hover {
    background-color: #f8fafc;
  }

  :global([data-theme="dark"]) .value-item:hover {
    background-color: #334155;
  }

  .no-result {
    font-size: 12px;
    color: #94a3b8;
    padding: 8px;
    text-align: center;
  }

  .filter-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 6px;
  }

  .btn-sub {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
    background-color: #ffffff;
    cursor: pointer;
  }

  :global([data-theme="dark"]) .btn-sub {
    background-color: #334155;
    border-color: #475569;
    color: #f8fafc;
  }

  .btn-sub.primary-sub {
    background-color: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
  }

  .btn-sub.danger-sub {
    color: #dc2626;
    border-color: #fca5a5;
  }

  .editor-container {
    flex: 1;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  .editor-container :global(.jse-main) {
    height: 100% !important;
    border: none !important;
  }

  /* 글로벌 엑셀 헤더 트리거 버튼 스타일 */
  :global(.excel-header-trigger) {
    background: transparent !important;
    border: none !important;
    cursor: pointer !important;
    padding: 1px 4px !important;
    margin-left: 4px !important;
    font-size: 11px !important;
    color: #475569 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 2px !important;
    border-radius: 3px !important;
  }

  :global([data-theme="dark"] .excel-header-trigger) {
    color: #cbd5e1 !important;
  }

  :global(.excel-header-trigger:hover) {
    background: rgba(0, 0, 0, 0.08) !important;
  }

  :global([data-theme="dark"] .excel-header-trigger:hover) {
    background: rgba(255, 255, 255, 0.15) !important;
  }

  :global(.excel-badge) {
    font-weight: 800 !important;
    color: #0284c7 !important;
    font-size: 11px !important;
  }

  :global([data-theme="dark"] .excel-badge) {
    color: #38bdf8 !important;
  }

  :global(.excel-arrow) {
    font-size: 9px !important;
    opacity: 0.7;
  }
</style>
