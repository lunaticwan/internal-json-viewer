<script>
  /**
   * @file App.svelte
   * @description iMJSON 최상위 에디터 애플리케이션 컴포넌트.
   * JSON 트리/테이블/코드 모드 편집, LLM 도구 연동, 엑셀/스프레드시트 UX, 폰트 및 테마 설정 제공.
   */
  import { onMount } from 'svelte';
  import { JSONEditor, Mode } from 'svelte-jsoneditor';
  import clsx from 'clsx';
  import { onRenderMenu, onRenderContextMenu, setupI18nObserver } from './i18n.js';
  import {
    PRESET_UI_FONTS,
    PRESET_CODE_FONTS,
    FONT_SIZES,
    ROW_HEIGHTS,
    DEFAULT_SAMPLE_DATA
  } from './constants/editor.js';
  import {
    repairJsonString,
    calculateDatasetMetrics
  } from './utils/llmUtils.js';
  import { getProcessedData } from './utils/tableUtils.js';
  import {
    parseTheme,
    parseFontSize,
    parseRowHeight,
    parseFontSettings
  } from './utils/schemaUtils.js';
  import { logEvent } from './utils/logger.js';

  // ---------------------------------------------------------------------------
  // [상태 관리: UI 커스텀 설정 및 모달]
  // ---------------------------------------------------------------------------

  /** 시스템 제공 설치 폰트 목록 배열 */
  let systemFonts = $state([]);

  /** UI 폰트 선택 모드 및 선택 값 ('preset' | 'system' | 'custom') */
  let selectedUiFontMode = $state('preset');
  let selectedUiFontValue = $state(PRESET_UI_FONTS[0].value);
  let customUiFont = $state('');

  /** Code 폰트 선택 모드 및 선택 값 ('preset' | 'system' | 'custom') */
  let selectedCodeFontMode = $state('preset');
  let selectedCodeFontValue = $state(PRESET_CODE_FONTS[0].value);
  let customCodeFont = $state('');

  /** 폰트 크기(px), 행 높이(px) 및 테마 상태 ('light' | 'dark') */
  let fontSize = $state(15);
  let rowHeight = $state('24px');
  let theme = $state('light');

  /** 에디터 상단 커스텀 툴바 영역 Element 레퍼런스 */
  let toolbarControlsEl = $state();

  /** 모달 표시 상태 */
  let showFontModal = $state(false);

  // ---------------------------------------------------------------------------
  // [상태 관리: 드래그 앤 드롭 & 토스트 알림]
  // ---------------------------------------------------------------------------

  /** 전체 화면 파일 드롭 오버레이 감지 상태 및 타이머 */
  let isDraggingFile = $state(false);
  let dragLeaveTimer;

  /** 하단 알림 토스트 메시지 및 타이머 레퍼런스 */
  let toastMessage = $state('');
  let toastTimer;

  /**
   * 알림 토스트 팝업을 표시함.
   * @param {string} msg - 표시할 메시지
   */
  function showToast(msg) {
    logEvent('TOAST', 'show_toast', { message: msg });
    toastMessage = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage = '';
    }, 2500);
  }

  // ---------------------------------------------------------------------------
  // [상태 관리: 데이터 원본, 정렬 & 필터]
  // ---------------------------------------------------------------------------

  /** 원본 JSON 데이터 저장소 */
  let rawData = $state(DEFAULT_SAMPLE_DATA);

  /** 다중 정렬 규칙 배열 [{ key: 'category', dir: 'asc' }] */
  let sortRules = $state([]);

  /** 컬럼별 필터 규칙 맵 { category: Set(['Developer Tool']) } */
  let filterRules = $state({});

  /** 컬럼별 유니크 값 추출 캐시 맵 */
  let uniqueValuesCache = new Map();

  /** 테이블 헤더 정렬/필터 팝업 열기 상태 및 좌표 정보 */
  let activeMenuCol = $state(null);
  let menuPos = $state({ top: 0, left: 0 });
  let filterSearchQuery = $state('');
  let tempSelectedValues = $state(new Set());

  /** svelte-jsoneditor 전달용 content 바인딩 상태 */
  let content = $state({ json: DEFAULT_SAMPLE_DATA });

  /** 에디터 뷰 모드 및 파일 업로드 input 레퍼런스 */
  let mode = $state(Mode.tree);
  let fileInput = $state();

  /** 테이블 모드 현재 활성화된 셀 위치 좌표 ({ row: number, col: number }) */
  let currentActiveCellIndex = $state({ row: 0, col: 0 });

  // ---------------------------------------------------------------------------
  // [상태 관리: 멀티 탭 관리 (Multi-Tab)]
  // ---------------------------------------------------------------------------

  /** 탭 목록 상태 배열 */
  let tabs = $state([
    {
      id: 'tab-1',
      title: '새 문서 1',
      rawData: DEFAULT_SAMPLE_DATA,
      content: { json: DEFAULT_SAMPLE_DATA },
      sortRules: [],
      filterRules: {},
      mode: Mode.tree
    }
  ]);

  /** 현재 활성화된 탭 ID */
  let activeTabId = $state('tab-1');

  /** 탭 일련번호 카운터 */
  let tabCounter = $state(1);

  /** 탭 바 Element 레퍼런스 */
  let tabBarEl = $state();

  // ---------------------------------------------------------------------------
  // [파생 상태 (Derived State)]
  // ---------------------------------------------------------------------------

  /** 실시간 데이터 세트 노드 수, 바이트 용량 및 추정 LLM 토큰 수 계산 */
  let datasetMetrics = $derived.by(() => {
    const raw = content?.json !== undefined ? content.json : content?.text || '';
    return calculateDatasetMetrics(raw);
  });

  // ---------------------------------------------------------------------------
  // [비즈니스 로직: 데이터 가공 및 파싱]
  // ---------------------------------------------------------------------------

  /**
   * 데이터 정렬 및 필터 변경 사항 반영 및 content 동기화.
   */
  function updateProcessedContent() {
    logEvent('DATA', 'update_processed_content', {
      sortRules,
      filterRulesKeys: Object.keys(filterRules),
      rawDataIsArray: Array.isArray(rawData)
    });
    uniqueValuesCache.clear();
    if (Array.isArray(rawData)) {
      const processed = getProcessedData(rawData, sortRules, filterRules);
      content = { json: processed };
    }
    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (currentTab) {
      currentTab.content = content;
      currentTab.sortRules = sortRules;
      currentTab.filterRules = filterRules;
    }
  }

  /** 현재 활성 탭 상태 동기화 저장 */
  function saveCurrentTabState() {
    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (currentTab) {
      currentTab.rawData = rawData;
      currentTab.content = content;
      currentTab.sortRules = sortRules;
      currentTab.filterRules = filterRules;
      currentTab.mode = mode;
    }
  }

  /** 특정 탭 상태를 활성화 상태로 불러오기 */
  function loadTabState(tabId) {
    const targetTab = tabs.find((t) => t.id === tabId);
    if (targetTab) {
      activeTabId = tabId;
      rawData = targetTab.rawData;
      content = targetTab.content;
      sortRules = targetTab.sortRules;
      filterRules = targetTab.filterRules;
      mode = targetTab.mode;
      uniqueValuesCache.clear();
      setTimeout(() => {
        attachFontSizeControl();
        attachTabBar();
        decorateTableHeaders();
      }, 50);
    }
  }

  /** 탭 전환 처리 */
  function switchTab(tabId) {
    if (tabId === activeTabId) return;
    logEvent('TAB', 'switch_tab', { from: activeTabId, to: tabId });
    saveCurrentTabState();
    loadTabState(tabId);
  }

  /** 새 탭 생성 처리 */
  function createNewTab(initialData = {}, titleName = null) {
    saveCurrentTabState();
    tabCounter += 1;
    const newTabId = `tab-${Date.now()}-${tabCounter}`;
    const newTitle = titleName || `새 문서 ${tabCounter}`;
    const defaultContent = typeof initialData === 'string' ? { text: initialData } : { json: initialData };
    const newTab = {
      id: newTabId,
      title: newTitle,
      rawData: initialData,
      content: defaultContent,
      sortRules: [],
      filterRules: {},
      mode: Mode.tree
    };
    tabs = [...tabs, newTab];
    loadTabState(newTabId);
    logEvent('TAB', 'create_tab', { id: newTabId, title: newTitle });
  }

  /** 탭 닫기 처리 */
  function closeTab(tabId) {
    logEvent('TAB', 'close_tab', { tabId });
    if (tabs.length === 1) {
      tabCounter += 1;
      const newTabId = `tab-${Date.now()}-${tabCounter}`;
      const newTitle = `새 문서 ${tabCounter}`;
      const newTab = {
        id: newTabId,
        title: newTitle,
        rawData: {},
        content: { json: {} },
        sortRules: [],
        filterRules: {},
        mode: Mode.tree
      };
      tabs = [newTab];
      loadTabState(newTabId);
      showToast('모든 탭이 닫혀 새 문서를 생성했습니다.');
      return;
    }

    const index = tabs.findIndex((t) => t.id === tabId);
    const isClosingActive = tabId === activeTabId;
    tabs = tabs.filter((t) => t.id !== tabId);

    if (isClosingActive) {
      const nextTab = tabs[Math.max(0, index - 1)];
      loadTabState(nextTab.id);
    }
  }

  /**
   * 파일 선택 다이얼로그를 호출함.
   */
  function triggerFileUpload() {
    logEvent('BUTTON', 'trigger_file_upload');
    if (fileInput) fileInput.click();
  }

  /**
   * 입력된 텍스트 데이터를 JSON 파싱 또는 LLM JSON 수리 처리하여 에디터에 로드함.
   * @param {string} text - 원본 데이터 텍스트
   * @param {string} [fileName=''] - 파일 이름
   */
  function handleFileContent(text, fileName = '') {
    logEvent('FILE', 'handle_file_content', { fileName, textLength: text?.length });
    try {
      // 1. 표준 JSON 파싱 시도
      try {
        const parsed = JSON.parse(text);
        rawData = parsed;
        sortRules = [];
        filterRules = {};
        uniqueValuesCache.clear();
        content = { json: parsed };

        const currentTab = tabs.find((t) => t.id === activeTabId);
        if (currentTab) {
          currentTab.title = fileName || currentTab.title;
          currentTab.rawData = parsed;
          currentTab.content = content;
          currentTab.sortRules = [];
          currentTab.filterRules = {};
        }

        showToast(`파일 로드 완료: ${fileName || 'JSON Data'}`);
      } catch (jsonErr) {
        logEvent('FILE', 'json_parse_failed_trying_repair', { fileName, error: jsonErr.message });
        // 2. 파싱 실패 시 LLM JSON 수리 유틸리티로 자동 복구 시도
        const repairedText = repairJsonString(text);
        const parsed = JSON.parse(repairedText);
        rawData = parsed;
        sortRules = [];
        filterRules = {};
        uniqueValuesCache.clear();
        content = { json: parsed };

        const currentTab = tabs.find((t) => t.id === activeTabId);
        if (currentTab) {
          currentTab.title = fileName || currentTab.title;
          currentTab.rawData = parsed;
          currentTab.content = content;
          currentTab.sortRules = [];
          currentTab.filterRules = {};
        }

        showToast('손상된 JSON 구문 자동 복구 및 로드 성공');
      }
    } catch (err) {
      logEvent('FILE', 'file_load_fallback_to_text', { fileName, error: err.message });
      content = { text: text };

      const currentTab = tabs.find((t) => t.id === activeTabId);
      if (currentTab) {
        currentTab.title = fileName || currentTab.title;
        currentTab.content = content;
      }

      showToast('텍스트 모드로 로드되었습니다 (JSON 파싱 불가)');
    }
  }

  /**
   * input file 이벤트 처리.
   * @param {Event} event - change 이벤트 객체
   */
  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    logEvent('FILE', 'file_input_change', { fileName: file?.name, fileSize: file?.size });
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      handleFileContent(e.target.result, file.name);
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  /**
   * 창 전체 영역 파일 드래그 앤 드롭 이벤트를 바인딩함.
   * @returns {Function} 이벤트 해제 클린업 함수
   */
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
      logEvent('FILE', 'file_drop', { fileCount: files?.length, fileName: files?.[0]?.name });
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

  // ---------------------------------------------------------------------------
  // [빠른 클립보드 복사 & LLM 액션]
  // ---------------------------------------------------------------------------

  /** Formatted JSON 클립보드 복사 */
  function handleCopyFormatted() {
    const targetData = content?.json !== undefined ? content.json : content?.text;
    const str = typeof targetData === 'string' ? targetData : JSON.stringify(targetData, null, 2);
    logEvent('BUTTON', 'copy_formatted', { dataLength: str.length });
    navigator.clipboard.writeText(str);
    showToast('Formatted JSON 클립보드 복사 완료');
  }

  /** Minified JSON 클립보드 복사 */
  function handleCopyMinified() {
    const targetData = content?.json !== undefined ? content.json : content?.text;
    const str = typeof targetData === 'string' ? targetData : JSON.stringify(targetData);
    logEvent('BUTTON', 'copy_minified', { dataLength: str.length });
    navigator.clipboard.writeText(str);
    showToast('Minified JSON 클립보드 복사 완료');
  }

  /** 에디터 내 텍스트 수동 JSON 자동 복구 실행 */
  function handleRepairJsonAction() {
    logEvent('BUTTON', 'repair_json_action', { hasTextContent: Boolean(content?.text) });
    if (content?.text) {
      try {
        const repaired = repairJsonString(content.text);
        const parsed = JSON.parse(repaired);
        rawData = parsed;
        content = { json: parsed };
        showToast('JSON 구문 자동 복구 완료');
      } catch (err) {
        logEvent('BUTTON', 'repair_json_failed', { error: err.message });
        alert('복구 중 오류 발생: ' + err.message);
      }
    } else {
      showToast('이미 유효한 JSON 형식입니다');
    }
  }

  // ---------------------------------------------------------------------------
  // [스타일, 폰트 및 테마 설정]
  // ---------------------------------------------------------------------------

  /** CSS 변수에 폰트 크기 반영 및 로컬 스토리지 저장 */
  function applyFontSize() {
    logEvent('SETTING', 'apply_font_size', { fontSize });
    document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
    document.documentElement.style.setProperty('--jse-font-size', `${fontSize}px`);
    document.documentElement.style.setProperty('--jse-font-size-mono', `${fontSize}px`);
    try {
      localStorage.setItem('imjson_font_size', String(fontSize));
    } catch (err) {
      console.error('Failed to save font size:', err);
    }
  }

  /** CSS 변수에 행 높이 반영 및 로컬 스토리지 저장 */
  function applyRowHeight() {
    logEvent('SETTING', 'apply_row_height', { rowHeight });
    document.documentElement.style.setProperty('--app-row-height', rowHeight);
    try {
      localStorage.setItem('imjson_row_height', rowHeight);
    } catch (err) {
      console.error('Failed to save row height:', err);
    }
  }

  /** 테마 속성 적용 및 로컬 스토리지 저장 */
  function applyTheme() {
    logEvent('SETTING', 'apply_theme', { theme });
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

  /** 라이트/다크 테마 토글 */
  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    logEvent('BUTTON', 'toggle_theme', { from: theme, to: nextTheme });
    theme = nextTheme;
    applyTheme();
  }

  /** 저장된 테마 설정 로드 (Zod 검증 적용) */
  function loadTheme() {
    try {
      const saved = localStorage.getItem('imjson_theme');
      theme = parseTheme(saved);
      logEvent('SETTING', 'load_theme', { theme });
    } catch (err) {
      console.error('Failed to load theme:', err);
    }
  }

  /** 저장된 폰트 크기 로드 (Zod 검증 적용) */
  function loadFontSize() {
    try {
      const saved = localStorage.getItem('imjson_font_size') || localStorage.getItem('imbank_font_size');
      fontSize = parseFontSize(saved);
      logEvent('SETTING', 'load_font_size', { fontSize });
    } catch (err) {
      console.error('Failed to load font size:', err);
    }
  }

  /** 저장된 행 높이 로드 (Zod 검증 적용) */
  function loadRowHeight() {
    try {
      const saved = localStorage.getItem('imjson_row_height');
      rowHeight = parseRowHeight(saved);
      logEvent('SETTING', 'load_row_height', { rowHeight });
    } catch (err) {
      console.error('Failed to load row height:', err);
    }
  }

  /** 폰트 크기 감소 */
  function decreaseFontSize() {
    logEvent('BUTTON', 'decrease_font_size', { currentFontSize: fontSize });
    const currentIndex = FONT_SIZES.indexOf(fontSize);
    if (currentIndex > 0) {
      fontSize = FONT_SIZES[currentIndex - 1];
      applyFontSize();
    }
  }

  /** 폰트 크기 증가 */
  function increaseFontSize() {
    logEvent('BUTTON', 'increase_font_size', { currentFontSize: fontSize });
    const currentIndex = FONT_SIZES.indexOf(fontSize);
    if (currentIndex < FONT_SIZES.length - 1) {
      fontSize = FONT_SIZES[currentIndex + 1];
      applyFontSize();
    }
  }

  /** 폰트 크기 셀렉트 변경 처리 */
  function handleFontSizeSelect(e) {
    const val = parseInt(e.target.value, 10);
    logEvent('BUTTON', 'select_font_size', { val });
    if (!isNaN(val)) {
      fontSize = val;
      applyFontSize();
    }
  }

  /** 행 높이 셀렉트 변경 처리 */
  function handleRowHeightSelect(e) {
    rowHeight = e.target.value;
    logEvent('BUTTON', 'select_row_height', { rowHeight });
    applyRowHeight();
  }

  /** svelte-jsoneditor 내부 툴바 슬롯 영역에 커스텀 컨트롤 및 탭 바 부착 */
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

  function attachTabBar() {
    if (!tabBarEl) return;
    const menuContainer = document.querySelector('.jse-menu');
    if (menuContainer && menuContainer.parentNode) {
      if (tabBarEl.parentNode !== menuContainer.parentNode || menuContainer.nextSibling !== tabBarEl) {
        menuContainer.parentNode.insertBefore(tabBarEl, menuContainer.nextSibling);
      }
    }
  }

  /**
   * svelte-jsoneditor 툴바 항목 커스터마이징 렌더러.
   */
  function handleRenderMenu(items, context) {
    const translatedItems = onRenderMenu(items, context) || items;

    const customBrandButton = {
      type: 'button',
      text: 'iMJSON',
      title: 'iMJSON',
      className: 'jse-brand-button',
      onClick: () => {}
    };

    const newFileButton = {
      type: 'button',
      text: 'NEW',
      title: '새 문서 (NEW)',
      className: 'jse-custom-btn new-doc-btn',
      onClick: () => {
        logEvent('BUTTON', 'click_new_file_menu_item');
        createNewTab({}, null);
      }
    };

    const openFileButton = {
      type: 'button',
      text: '파일 열기',
      title: 'JSON 파일 열기',
      className: 'jse-custom-btn',
      onClick: () => {
        logEvent('BUTTON', 'click_open_file_menu_item');
        triggerFileUpload();
      }
    };

    const fontSettingsButton = {
      type: 'button',
      text: '폰트 설정',
      title: '폰트 설정',
      className: 'jse-custom-btn',
      onClick: () => {
        logEvent('BUTTON', 'open_font_modal');
        loadSystemFonts();
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
      attachTabBar();
    }, 0);

    return [
      customBrandButton,
      separator,
      newFileButton,
      openFileButton,
      fontSettingsButton,
      separator,
      fontControlSlotPlaceholder,
      separator,
      ...translatedItems
    ];
  }

  /** 설정된 폰트 CSS 변수 적용 및 로컬 스토리지 저장 */
  function applyFonts() {
    logEvent('SETTING', 'apply_fonts', {
      selectedUiFontMode,
      selectedUiFontValue,
      customUiFont,
      selectedCodeFontMode,
      selectedCodeFontValue,
      customCodeFont
    });
    let uiFontCSS = '';
    if (selectedUiFontMode === 'custom') {
      const font = customUiFont.trim();
      uiFontCSS = font ? `'${font}', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` : PRESET_UI_FONTS[0].value;
    } else if (selectedUiFontMode === 'system') {
      uiFontCSS = selectedUiFontValue ? `'${selectedUiFontValue}', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` : PRESET_UI_FONTS[0].value;
    } else {
      uiFontCSS = selectedUiFontValue || PRESET_UI_FONTS[0].value;
    }

    let codeFontCSS = '';
    if (selectedCodeFontMode === 'custom') {
      const font = customCodeFont.trim();
      codeFontCSS = font ? `'${font}', Consolas, monospace` : PRESET_CODE_FONTS[0].value;
    } else if (selectedCodeFontMode === 'system') {
      codeFontCSS = selectedCodeFontValue ? `'${selectedCodeFontValue}', Consolas, monospace` : PRESET_CODE_FONTS[0].value;
    } else {
      codeFontCSS = selectedCodeFontValue || PRESET_CODE_FONTS[0].value;
    }

    document.documentElement.style.setProperty('--app-font-ui', uiFontCSS);
    document.documentElement.style.setProperty('--app-font-code', codeFontCSS);

    localStorage.setItem(
      'imjson_font_settings',
      JSON.stringify({
        selectedUiFontMode,
        selectedUiFontValue,
        customUiFont,
        selectedCodeFontMode,
        selectedCodeFontValue,
        customCodeFont
      })
    );
  }

  /** 시스템 로컬 폰트 열람 (Chromium queryLocalFonts API 지원) */
  async function loadSystemFonts() {
    try {
      if ('queryLocalFonts' in window) {
        const fontData = await window.queryLocalFonts();
        const fontNames = Array.from(new Set(fontData.map((f) => f.family))).sort((a, b) => a.localeCompare(b));
        if (fontNames.length > 0) {
          systemFonts = fontNames;
          logEvent('SETTING', 'load_system_fonts', { fontCount: fontNames.length });
        }
      }
    } catch (err) {
      console.warn('Local fonts query failed:', err);
    }
  }

  /** 저장된 폰트 설정 로드 (Zod 검증 적용) */
  function loadFontSettings() {
    try {
      const saved = localStorage.getItem('imjson_font_settings') || localStorage.getItem('imbank_font_settings');
      const settings = parseFontSettings(saved);
      selectedUiFontMode = settings.selectedUiFontMode;
      selectedUiFontValue = settings.selectedUiFontValue;
      customUiFont = settings.customUiFont;
      selectedCodeFontMode = settings.selectedCodeFontMode;
      selectedCodeFontValue = settings.selectedCodeFontValue;
      customCodeFont = settings.customCodeFont;
      logEvent('SETTING', 'load_font_settings', settings);
    } catch (err) {
      console.error('Failed to load font settings:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // [엑셀 스타일 필터 & 정렬 UI 로직]
  // ---------------------------------------------------------------------------

  /**
   * 컬럼별 유니크 고유 값 추출 (메모이제이션 캐시 사용).
   * @param {string} colKey - 컬럼 키 명칭
   * @returns {string[]} 정렬된 고유 값 목록
   */
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

  /** 테이블 헤더 정렬/필터 드롭다운 팝업 열기 */
  function openHeaderMenu(colKey, targetEl) {
    logEvent('TABLE', 'open_header_menu', { colKey });
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

  /** 테이블 헤더 드롭다운 팝업 닫기 */
  function closeHeaderMenu() {
    logEvent('TABLE', 'close_header_menu', { colKey: activeMenuCol });
    activeMenuCol = null;
  }

  /** 단일 정렬 처리 */
  function handleSingleSort(colKey, dir) {
    logEvent('TABLE', 'single_sort', { colKey, dir });
    sortRules = [{ key: colKey, dir }];
    updateProcessedContent();
    closeHeaderMenu();
  }

  /** 다중 정렬 규칙 추가 처리 */
  function handleAddMultiSort(colKey, dir) {
    logEvent('TABLE', 'add_multi_sort', { colKey, dir });
    const existingIdx = sortRules.findIndex((r) => r.key === colKey);
    if (existingIdx >= 0) {
      sortRules[existingIdx].dir = dir;
    } else {
      sortRules = [...sortRules, { key: colKey, dir }];
    }
    updateProcessedContent();
    closeHeaderMenu();
  }

  /** 단일 컬럼 정렬 해제 */
  function handleClearSort(colKey) {
    logEvent('TABLE', 'clear_sort', { colKey });
    sortRules = sortRules.filter((r) => r.key !== colKey);
    updateProcessedContent();
    closeHeaderMenu();
  }

  /** 모든 정렬 및 필터 초기화 */
  function handleClearAllSortAndFilter() {
    logEvent('BUTTON', 'clear_all_sort_and_filter');
    sortRules = [];
    filterRules = {};
    updateProcessedContent();
    closeHeaderMenu();
  }

  /** 필터 팝업 내 전체 값 선택/해제 토글 */
  function toggleSelectAllValues(colKey) {
    const allVals = getUniqueValuesForColumn(colKey);
    const willSelectAll = tempSelectedValues.size !== allVals.length;
    logEvent('TABLE', 'toggle_select_all_values', { colKey, willSelectAll });
    if (tempSelectedValues.size === allVals.length) {
      tempSelectedValues = new Set();
    } else {
      tempSelectedValues = new Set(allVals);
    }
  }

  /** 개별 값 선택/해제 토글 */
  function toggleValueSelection(val) {
    logEvent('TABLE', 'toggle_value_selection', { val, wasSelected: tempSelectedValues.has(val) });
    const next = new Set(tempSelectedValues);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    tempSelectedValues = next;
  }

  /** 선택한 값 필터 규칙 적용 */
  function applyColumnFilter(colKey) {
    logEvent('TABLE', 'apply_column_filter', { colKey, selectedCount: tempSelectedValues.size });
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

  /** 단일 컬럼 필터 해제 */
  function clearColumnFilter(colKey) {
    logEvent('TABLE', 'clear_column_filter', { colKey });
    delete filterRules[colKey];
    filterRules = { ...filterRules };
    updateProcessedContent();
    closeHeaderMenu();
  }

  // ---------------------------------------------------------------------------
  // [DOM Observer: 테이블 헤더 엑셀 버튼 데코레이터]
  // ---------------------------------------------------------------------------

  let headerObserver;
  let rafHeaderId;

  /** 테이블 모드 렌더링 헤더에 정렬/필터 트리거 버튼 및 리사이저 삽입 */
  function decorateTableHeaders() {
    if (mode !== Mode.table) return;
    const thEls = document.querySelectorAll('.jse-table-mode table th:not(.jse-table-cell-gutter)');
    thEls.forEach((th) => {
      let colName = '';
      const colNameSpan = th.querySelector('.jse-column-name');
      if (colNameSpan) {
        colName = colNameSpan.textContent.trim();
      } else {
        colName = Array.from(th.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE || (node.classList && !node.classList.contains('excel-header-trigger') && !node.classList.contains('excel-col-resizer')))
          .map((node) => node.textContent)
          .join('')
          .replace(/[▲▼🔍0-9]/g, '')
          .trim();
      }

      if (!colName) return;

      let headerInner = th.querySelector('.jse-column-header');
      if (headerInner) {
        headerInner.style.display = 'flex';
        headerInner.style.flexDirection = 'row';
        headerInner.style.alignItems = 'center';
        headerInner.style.justifyContent = 'space-between';
      } else {
        headerInner = th;
      }

      // 기존 외부 정렬 화살표 요소가 숨겨지거나 깨지는 부분 정리
      const nativeSort = th.querySelector('.jse-sort-arrow, .jse-context-menu-button');
      if (nativeSort) {
        nativeSort.style.display = 'none';
      }

      let btn = th.querySelector('.excel-header-trigger');
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'excel-header-trigger';
        headerInner.appendChild(btn);
      } else if (btn.parentNode !== headerInner) {
        headerInner.appendChild(btn);
      }

      const sortIdx = sortRules.findIndex((r) => r.key === colName);
      let sortBadge = '';
      if (sortIdx >= 0) {
        const rule = sortRules[sortIdx];
        const arrow = rule.dir === 'asc' ? '▲' : '▼';
        sortBadge = sortRules.length > 1 ? `${arrow}${sortIdx + 1}` : arrow;
      }

      const isFiltered = filterRules[colName] && filterRules[colName].size < getUniqueValuesForColumn(colName).length;
      let filterBadge = isFiltered ? '🔍' : '';

      btn.innerHTML = `<span class="excel-badge">${sortBadge}${filterBadge}</span><span class="excel-arrow">▼</span>`;

      const handleMenuTrigger = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openHeaderMenu(colName, btn);
      };

      btn.onmousedown = (e) => e.stopPropagation();
      btn.onclick = handleMenuTrigger;

      // 2. 마우스 구글 스프레드시트 방식 컬럼 리사이저 패드 생성
      let resizer = th.querySelector('.excel-col-resizer');
      if (!resizer) {
        resizer = document.createElement('div');
        resizer.className = 'excel-col-resizer';
        th.appendChild(resizer);

        resizer.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();

          logEvent('TABLE', 'start_column_resize', { colName });
          const startX = e.clientX;
          const startWidth = th.offsetWidth;
          const colIndex = Array.from(th.parentNode.children).indexOf(th);
          const table = th.closest('table');
          resizer.classList.add('resizing');

          const onMouseMove = (moveEvent) => {
            const diff = moveEvent.clientX - startX;
            const newWidth = Math.max(50, startWidth + diff);
            const pxWidth = `${newWidth}px`;

            th.style.width = pxWidth;
            th.style.minWidth = pxWidth;
            th.style.maxWidth = pxWidth;

            if (table) {
              const cells = table.querySelectorAll(`tr td:nth-child(${colIndex + 1})`);
              cells.forEach((td) => {
                td.style.width = pxWidth;
                td.style.minWidth = pxWidth;
                td.style.maxWidth = pxWidth;
              });
            }
          };

          const onMouseUp = () => {
            logEvent('TABLE', 'end_column_resize', { colName, finalWidth: th.style.width });
            resizer.classList.remove('resizing');
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          };

          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        });
      }
    });
  }

  /** MutationObserver와 requestAnimationFrame을 이용한 테이블 헤더 감지기 설정 */
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

  // ---------------------------------------------------------------------------
  // [구글 스프레드시트/엑셀 UX: 클릭 및 키보드 탐색 인터랙션]
  // ---------------------------------------------------------------------------

  /** 지정한 좌표 (행, 열)의 셀을 활성화하고 편집 상태로 전환 */
  function activateCellAt(rowIndex, colIndex) {
    logEvent('SPREADSHEET', 'activate_cell', { rowIndex, colIndex });
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

  /** 단일 클릭 편집, 전체 선택, Tab/방향키 셀 이동 스프레드시트 UX 감지기 이벤트 핸들러 바인딩 */
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
            logEvent('SPREADSHEET', 'cell_click', { activeCell: currentActiveCellIndex });
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
          logEvent('SPREADSHEET', 'focus_in_input', { tagName: target.tagName, className: target.className });
          setTimeout(() => {
            target.select?.();
          }, 10);
        }
      } else if (target.isContentEditable || target.classList.contains('cm-content')) {
        logEvent('SPREADSHEET', 'focus_in_editable', { className: target.className });
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

        logEvent('NAVIGATION', 'tab_key_navigate', { prevCell: currentActiveCellIndex, nextCell: { row, col }, shiftKey: e.shiftKey });
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

          logEvent('NAVIGATION', 'arrow_key_navigate', { key: e.key, prevCell: currentActiveCellIndex, nextCell: { row, col } });
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

  // ---------------------------------------------------------------------------
  // [컴포넌트 생명주기 (Life Cycle)]
  // ---------------------------------------------------------------------------

  onMount(() => {
    logEvent('LIFECYCLE', 'app_mounted');
    loadFontSettings();
    loadFontSize();
    loadRowHeight();
    loadTheme();
    applyFonts();
    applyFontSize();
    applyRowHeight();
    applyTheme();

    setTimeout(() => {
      attachFontSizeControl();
      attachTabBar();
    }, 50);
  });

  $effect(() => {
    // 탭 렌더링 변경 감지 시 탭 바 위치 동기화
    if (tabs.length) {
      attachTabBar();
    }

    const cleanupI18n = setupI18nObserver();
    const cleanupUX = setupSpreadsheetUX();
    const cleanupHeader = setupHeaderObserver();
    const cleanupDragDrop = setupDragAndDrop();

    return () => {
      logEvent('LIFECYCLE', 'app_unmounted');
      cleanupI18n();
      cleanupUX();
      cleanupHeader();
      cleanupDragDrop();
    };
  });

  /** 에디터 모드 변경 처리 */
  function handleModeChange(newMode) {
    logEvent('NAVIGATION', 'change_editor_mode', { fromMode: mode, toMode: newMode });
    mode = newMode;
    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (currentTab) {
      currentTab.mode = newMode;
    }
    setTimeout(() => {
      attachFontSizeControl();
      attachTabBar();
      decorateTableHeaders();
    }, 50);
  }

  /** 에디터 내부 데이터 내용 변경 처리 */
  function handleContentChange(newContent, previousContent, changeStatus) {
    logEvent('EDITOR', 'handle_content_change', {
      changeStatus,
      hasJson: newContent?.json !== undefined,
      hasText: newContent?.text !== undefined
    });
    uniqueValuesCache.clear();
    if (newContent && newContent.json !== undefined) {
      rawData = newContent.json;
      content = newContent;
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

  <!-- 멀티 탭 바 UI -->
  <div bind:this={tabBarEl} class="imjson-tab-bar">
    <div class="tab-list">
      {#each tabs as tab (tab.id)}
        <div
          class={clsx('tab-item', tab.id === activeTabId && 'active')}
          onclick={() => switchTab(tab.id)}
          onkeydown={(e) => e.key === 'Enter' && switchTab(tab.id)}
          role="button"
          tabindex="0"
        >
          <span class="tab-icon">📄</span>
          <span class="tab-title" title={tab.title}>{tab.title}</span>
          <button
            type="button"
            class="tab-close-btn"
            onclick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            title="탭 닫기"
          >
            &times;
          </button>
        </div>
      {/each}
      <button
        type="button"
        class="tab-add-btn"
        onclick={() => createNewTab({}, null)}
        title="새 문서 탭 추가"
      >
        + 새 문서
      </button>
    </div>
  </div>

  <!-- 툴바 삽입용 커스텀 컨트롤 그룹 -->
  <div bind:this={toolbarControlsEl} class="jse-toolbar-controls">
    <!-- 폰트 크기 조절 -->
    <div class="jse-font-size-group">
      <span class="jse-control-label">크기</span>
      <button
        type="button"
        class="jse-font-size-btn"
        onclick={decreaseFontSize}
        disabled={fontSize <= FONT_SIZES[0]}
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
        {#each FONT_SIZES as size}
          <option value={size}>{size}px</option>
        {/each}
      </select>
      <button
        type="button"
        class="jse-font-size-btn"
        onclick={increaseFontSize}
        disabled={fontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
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
        {#each ROW_HEIGHTS as rh}
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
      {#if content?.text}
        <button
          type="button"
          class="jse-action-chip repair-chip"
          onclick={handleRepairJsonAction}
          title="손상된 JSON 구문 자동 복구"
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
        {theme === 'light' ? '☀️ 라이트' : '🌙 다크'}
      </button>
    </div>
  </div>

  <!-- 폰트 설정 모달 -->
  {#if showFontModal}
    <div
      class="modal-backdrop"
      onclick={() => {
        logEvent('BUTTON', 'close_font_modal_backdrop');
        showFontModal = false;
      }}
      onkeydown={(e) => {
        if (e.key === 'Escape') {
          logEvent('BUTTON', 'close_font_modal_key');
          showFontModal = false;
        }
      }}
      role="presentation"
      tabindex="-1"
    >
      <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
        <div class="modal-header">
          <h2 id="modal-title">폰트 설정</h2>
          <button class="close-btn" onclick={() => {
            logEvent('BUTTON', 'close_font_modal_btn');
            showFontModal = false;
          }} aria-label="닫기">&times;</button>
        </div>
        <div class="modal-body">
          <div class="font-section">
            <h3>기본 UI 폰트 (메뉴 및 레이아웃)</h3>
            <div class="mode-selector">
              <label>
                <input
                  type="radio"
                  name="uiFontMode"
                  value="preset"
                  bind:group={selectedUiFontMode}
                  onchange={() => {
                    logEvent('SETTING', 'select_ui_font_mode', { mode: 'preset' });
                    applyFonts();
                  }}
                />
                프리셋
              </label>
              {#if systemFonts.length > 0}
                <label>
                  <input
                    type="radio"
                    name="uiFontMode"
                    value="system"
                    bind:group={selectedUiFontMode}
                    onchange={() => {
                      logEvent('SETTING', 'select_ui_font_mode', { mode: 'system' });
                      applyFonts();
                    }}
                  />
                  시스템 폰트 ({systemFonts.length}개)
                </label>
              {/if}
              <label>
                <input
                  type="radio"
                  name="uiFontMode"
                  value="custom"
                  bind:group={selectedUiFontMode}
                  onchange={() => {
                    logEvent('SETTING', 'select_ui_font_mode', { mode: 'custom' });
                    applyFonts();
                  }}
                />
                직접 입력
              </label>
            </div>

            {#if selectedUiFontMode === 'preset'}
              <select
                bind:value={selectedUiFontValue}
                onchange={() => {
                  logEvent('SETTING', 'select_ui_font_value', { value: selectedUiFontValue });
                  applyFonts();
                }}
                class="font-select"
              >
                {#each PRESET_UI_FONTS as font}
                  <option value={font.value}>{font.label}</option>
                {/each}
              </select>
            {:else if selectedUiFontMode === 'system'}
              <select
                bind:value={selectedUiFontValue}
                onchange={() => {
                  logEvent('SETTING', 'select_ui_font_value', { value: selectedUiFontValue });
                  applyFonts();
                }}
                class="font-select"
              >
                {#each systemFonts as fontName}
                  <option value={fontName}>{fontName}</option>
                {/each}
              </select>
            {:else if selectedUiFontMode === 'custom'}
              <input
                type="text"
                bind:value={customUiFont}
                oninput={() => {
                  logEvent('SETTING', 'input_custom_ui_font', { font: customUiFont });
                  applyFonts();
                }}
                placeholder="예: Pretendard, Malgun Gothic"
                class="font-input"
              />
            {/if}
          </div>

          <div class="font-section">
            <h3>코드 폰트 (데이터 및 에디터 편집 영역)</h3>
            <div class="mode-selector">
              <label>
                <input
                  type="radio"
                  name="codeFontMode"
                  value="preset"
                  bind:group={selectedCodeFontMode}
                  onchange={() => {
                    logEvent('SETTING', 'select_code_font_mode', { mode: 'preset' });
                    applyFonts();
                  }}
                />
                프리셋
              </label>
              {#if systemFonts.length > 0}
                <label>
                  <input
                    type="radio"
                    name="codeFontMode"
                    value="system"
                    bind:group={selectedCodeFontMode}
                    onchange={() => {
                      logEvent('SETTING', 'select_code_font_mode', { mode: 'system' });
                      applyFonts();
                    }}
                  />
                  시스템 폰트 ({systemFonts.length}개)
                </label>
              {/if}
              <label>
                <input
                  type="radio"
                  name="codeFontMode"
                  value="custom"
                  bind:group={selectedCodeFontMode}
                  onchange={() => {
                    logEvent('SETTING', 'select_code_font_mode', { mode: 'custom' });
                    applyFonts();
                  }}
                />
                직접 입력
              </label>
            </div>

            {#if selectedCodeFontMode === 'preset'}
              <select
                bind:value={selectedCodeFontValue}
                onchange={() => {
                  logEvent('SETTING', 'select_code_font_value', { value: selectedCodeFontValue });
                  applyFonts();
                }}
                class="font-select"
              >
                {#each PRESET_CODE_FONTS as font}
                  <option value={font.value}>{font.label}</option>
                {/each}
              </select>
            {:else if selectedCodeFontMode === 'system'}
              <select
                bind:value={selectedCodeFontValue}
                onchange={() => {
                  logEvent('SETTING', 'select_code_font_value', { value: selectedCodeFontValue });
                  applyFonts();
                }}
                class="font-select"
              >
                {#each systemFonts as fontName}
                  <option value={fontName}>{fontName}</option>
                {/each}
              </select>
            {:else if selectedCodeFontMode === 'custom'}
              <input
                type="text"
                bind:value={customCodeFont}
                oninput={() => {
                  logEvent('SETTING', 'input_custom_code_font', { font: customCodeFont });
                  applyFonts();
                }}
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
          <button class="btn btn-primary" onclick={() => {
            logEvent('BUTTON', 'confirm_font_modal');
            showFontModal = false;
          }}>확인</button>
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
          {#if sortRules.some((r) => r.key === activeMenuCol)}
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
            oninput={() => logEvent('TABLE', 'filter_search_query_input', { query: filterSearchQuery })}
            placeholder="🔍 값 검색..."
          />

          {#key activeMenuCol}
            {@const uniqueVals = getUniqueValuesForColumn(activeMenuCol).filter((v) => v.toLowerCase().includes(filterSearchQuery.toLowerCase()))}
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
      className={clsx(theme === 'dark' && 'jse-theme-dark')}
      onRenderMenu={handleRenderMenu}
      {onRenderContextMenu}
      onChange={handleContentChange}
      onChangeMode={handleModeChange}
    />
  </main>

  <!-- 데이터 통계 서브 스탯바 (VS Code UX 하단 배치) -->
  <footer class="jse-stats-bar">
    <div class="stats-item">
      <span class="stats-label">용량:</span>
      <span class="stats-value">{datasetMetrics.formattedSize}</span>
    </div>
    <div class="stats-divider"></div>
    <div class="stats-item">
      <span class="stats-label">노드/항목:</span>
      <span class="stats-value">{datasetMetrics.nodeCount.toLocaleString()}개</span>
    </div>
  </footer>
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
    gap: 8px;
    padding: 8px 16px;
    font-size: 14px;
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

  /* 멀티 탭 바 스타일 */
  .imjson-tab-bar {
    display: flex;
    align-items: center;
    background-color: #f1f5f9;
    border-bottom: 1px solid #cbd5e1;
    padding: 2px 8px 0 8px;
    overflow-x: auto;
    font-size: 12px;
  }

  :global([data-theme="dark"]) .imjson-tab-bar {
    background-color: #0f172a;
    border-bottom-color: #334155;
  }

  .tab-list {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tab-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background-color: #e2e8f0;
    color: #475569;
    border: 1px solid #cbd5e1;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    cursor: pointer;
    user-select: none;
    max-width: 180px;
    transition: background-color 0.12s, color 0.12s;
  }

  :global([data-theme="dark"]) .tab-item {
    background-color: #1e293b;
    color: #94a3b8;
    border-color: #334155;
  }

  .tab-item:hover {
    background-color: #cbd5e1;
    color: #0f172a;
  }

  :global([data-theme="dark"]) .tab-item:hover {
    background-color: #334155;
    color: #f8fafc;
  }

  .tab-item.active {
    background-color: #ffffff;
    color: #2563eb;
    font-weight: 700;
    border-color: #cbd5e1;
    border-bottom: 2px solid #2563eb;
  }

  :global([data-theme="dark"]) .tab-item.active {
    background-color: #1e293b;
    color: #38bdf8;
    border-color: #334155;
    border-bottom: 2px solid #38bdf8;
  }

  .tab-icon {
    font-size: 11px;
  }

  .tab-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
  }

  .tab-close-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 14px;
    line-height: 1;
    padding: 0 2px;
    border-radius: 3px;
    cursor: pointer;
  }

  .tab-close-btn:hover {
    background-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .tab-add-btn {
    background: transparent;
    border: 1px dashed #cbd5e1;
    color: #64748b;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 4px;
    transition: all 0.12s;
  }

  :global([data-theme="dark"]) .tab-add-btn {
    border-color: #475569;
    color: #94a3b8;
  }

  .tab-add-btn:hover {
    background-color: #2563eb;
    border-color: #2563eb;
    color: #ffffff;
  }

  /* 서브 통계 바 스타일 (VS Code Status Bar UX) */
  .jse-stats-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 16px;
    background-color: #1e293b;
    border-top: 1px solid #334155;
    font-size: 12px;
    color: #94a3b8;
    flex-shrink: 0;
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

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h2 {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 20px;
    line-height: 1;
    color: #64748b;
    cursor: pointer;
    padding: 0 4px;
  }

  .close-btn:hover {
    color: #0f172a;
  }

  .modal-body {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .font-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .font-section h3 {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }

  .mode-selector {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 12px;
    color: #475569;
  }

  .mode-selector label {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }

  .font-select,
  .font-input {
    width: 100%;
    padding: 6px 10px;
    font-size: 13px;
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
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px dashed #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .font-preview h4 {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }

  .preview-box {
    padding: 7px 10px;
    border-radius: 5px;
    border: 1px solid #e2e8f0;
    font-size: 13px;
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
    padding: 12px 18px;
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
    flex-shrink: 0 !important;
    vertical-align: middle !important;
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
