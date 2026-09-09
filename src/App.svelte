<script>
  import { onMount } from 'svelte';
  import { JSONEditor, Mode } from 'svelte-jsoneditor';
  import { onRenderMenu, onRenderContextMenu, setupI18nObserver } from './i18n.js';

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

  // 폰트 크기 선택 리스트 (px)
  const fontSizes = [11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28];

  let systemFonts = $state([]);

  // 상태 관리
  let selectedUiFontMode = $state('preset'); // 'preset', 'system', 'custom'
  let selectedUiFontValue = $state(presetUiFonts[0].value);
  let customUiFont = $state('');

  let selectedCodeFontMode = $state('preset'); // 'preset', 'system', 'custom'
  let selectedCodeFontValue = $state(presetCodeFonts[0].value);
  let customCodeFont = $state('');

  let fontSize = $state(15);
  let fontSizeGroupEl = $state();

  let showFontModal = $state(false);

  let content = $state({
    json: [
      {
        "id": 1,
        "name": "iM뱅크JSON",
        "category": "Developer Tool",
        "status": "Active",
        "version": "1.0.0",
        "offlineSupport": true,
        "description": "iM뱅크 사내 내부망 JSON 에디터"
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
  });

  let mode = $state(Mode.tree);
  let fileInput = $state();

  function triggerFileUpload() {
    if (fileInput) fileInput.click();
  }

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        try {
          const parsed = JSON.parse(text);
          content = { json: parsed };
        } catch {
          content = { text: text };
        }
      } catch (err) {
        alert('파일을 읽는 중 오류가 발생했습니다: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function applyFontSize() {
    document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
    document.documentElement.style.setProperty('--jse-font-size', `${fontSize}px`);
    document.documentElement.style.setProperty('--jse-font-size-mono', `${fontSize}px`);
    try {
      localStorage.setItem('imbank_font_size', String(fontSize));
    } catch (err) {
      console.error('Failed to save font size:', err);
    }
  }

  function loadFontSize() {
    try {
      const saved = localStorage.getItem('imbank_font_size');
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

  function attachFontSizeControl() {
    if (!fontSizeGroupEl) return;
    const placeholder = document.querySelector('.jse-font-size-slot-placeholder');
    if (placeholder && placeholder.parentNode) {
      if (placeholder.parentNode !== fontSizeGroupEl.parentNode || fontSizeGroupEl.nextSibling !== placeholder) {
        placeholder.parentNode.insertBefore(fontSizeGroupEl, placeholder);
        placeholder.style.display = 'none';
      }
    }
  }

  function handleRenderMenu(items, context) {
    // 1. i18n 기본 번역 적용
    const translatedItems = onRenderMenu(items, context) || items;

    // 2. 툴바 좌측 상단에 브랜딩 및 개별 기능 버튼 흡수
    const customBrandLabel = {
      type: 'button',
      text: 'iM뱅크JSON',
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

    // Save settings
    localStorage.setItem('imbank_font_settings', JSON.stringify({
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
      const saved = localStorage.getItem('imbank_font_settings');
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

  onMount(() => {
    loadFontSettings();
    loadFontSize();
    loadSystemFonts();
    applyFonts();
    applyFontSize();

    setTimeout(() => {
      attachFontSizeControl();
    }, 50);

    const cleanup = setupI18nObserver();
    return cleanup;
  });

  function handleModeChange(newMode) {
    mode = newMode;
    setTimeout(() => {
      attachFontSizeControl();
    }, 50);
  }

  function handleContentChange(newContent) {
    content = newContent;
  }
</script>

<div class="container">
  <input bind:this={fileInput} type="file" accept=".json,application/json,text/plain" onchange={handleFileUpload} style="display: none;" />

  <!-- 툴바 삽입용 폰트 크기 컨트롤 그룹 -->
  <div bind:this={fontSizeGroupEl} class="jse-font-size-group">
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
              <span>[UI 폰트 영역] iM뱅크JSON - 메뉴 &amp; 컨트롤</span>
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

  <main class="editor-container">
    <JSONEditor
      {content}
      {mode}
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
</style>
