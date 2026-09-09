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

  let systemFonts = $state([]);

  // 상태 관리
  let selectedUiFontMode = $state('preset'); // 'preset', 'system', 'custom'
  let selectedUiFontValue = $state(presetUiFonts[0].value);
  let customUiFont = $state('');

  let selectedCodeFontMode = $state('preset'); // 'preset', 'system', 'custom'
  let selectedCodeFontValue = $state(presetCodeFonts[0].value);
  let customCodeFont = $state('');

  let showFontModal = $state(false);

  let content = $state({
    json: [
      {
        "id": 1,
        "name": "iM뱅크 JSON 에디터",
        "category": "Developer Tool",
        "status": "Active",
        "version": "1.0.0",
        "offlineSupport": true,
        "description": "iM뱅크 사내 오프라인 및 웹 지원 JSON 에디터"
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
    loadSystemFonts();
    applyFonts();

    const cleanup = setupI18nObserver();
    return cleanup;
  });

  function handleModeChange(newMode) {
    mode = newMode;
  }

  function handleContentChange(newContent) {
    content = newContent;
  }

  function triggerFileUpload() {
    fileInput.click();
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
</script>

<div class="container">
  <header class="header">
    <div class="brand">
      <div class="logo-icon">&#123;&#125;</div>
      <h1>iM뱅크 JSON 에디터</h1>
      <span class="badge">iM뱅크 오프라인</span>
    </div>

    <div class="toolbar">
      <div class="button-group">
        <label class="btn-label">
          <span>모드:</span>
          <select value={mode} onchange={(e) => handleModeChange(e.target.value)} class="select-mode">
            <option value={Mode.tree}>Tree 모드</option>
            <option value={Mode.table}>Table 모드</option>
            <option value={Mode.text}>Code 모드</option>
          </select>
        </label>
      </div>

      <div class="divider"></div>

      <div class="button-group">
        <button onclick={triggerFileUpload} class="btn btn-primary" title="JSON 파일 열기">
          <svg class="icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          JSON 파일 열기
        </button>
        <input bind:this={fileInput} type="file" accept=".json,application/json,text/plain" onchange={handleFileUpload} style="display: none;" />
      </div>

      <div class="divider"></div>

      <div class="button-group">
        <button onclick={() => (showFontModal = true)} class="btn btn-secondary" title="폰트 설정">
          <svg class="icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M4 7V4h16v3"></path>
            <path d="M9 20h6"></path>
            <path d="M12 4v16"></path>
          </svg>
          폰트 설정
        </button>
      </div>
    </div>
  </header>

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
              <span>[UI 폰트 영역] iM뱅크 JSON 에디터 - 메뉴 &amp; 컨트롤</span>
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
      {onRenderMenu}
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

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    z-index: 10;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .logo-icon {
    width: 38px;
    height: 38px;
    background-color: #3b82f6;
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.25rem;
    font-family: monospace;
  }

  .brand h1 {
    font-size: 1.4rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.025em;
  }

  .badge {
    background-color: #e0f2fe;
    color: #0369a1;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .button-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .divider {
    height: 28px;
    width: 1px;
    background-color: #cbd5e1;
  }

  .btn-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1rem;
    font-weight: 600;
    color: #334155;
  }

  .select-mode {
    padding: 0.6rem 1rem;
    font-size: 1rem;
    font-weight: 500;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background-color: #ffffff;
    color: #1e293b;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s ease-in-out;
  }

  .select-mode:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.1rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 8px;
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

  .btn-secondary {
    background-color: #f1f5f9;
    color: #334155;
    border: 1px solid #cbd5e1;
  }

  .btn-secondary:hover {
    background-color: #e2e8f0;
    color: #0f172a;
  }

  .icon {
    flex-shrink: 0;
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
    border-radius: 12px;
    width: 520px;
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
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h2 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: #64748b;
    cursor: pointer;
    padding: 0 0.25rem;
  }

  .close-btn:hover {
    color: #0f172a;
  }

  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-height: 70vh;
    overflow-y: auto;
  }

  .font-section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .font-section h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #334155;
  }

  .mode-selector {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    font-size: 0.8125rem;
    color: #475569;
  }

  .mode-selector label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
  }

  .font-select,
  .font-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
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
    margin-top: 0.5rem;
    padding-top: 1rem;
    border-top: 1px dashed #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .font-preview h4 {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #64748b;
  }

  .preview-box {
    padding: 0.6rem 0.8rem;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    font-size: 0.875rem;
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
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    background-color: #f8fafc;
    display: flex;
    justify-content: flex-end;
  }

  .editor-container {
    flex: 1;
    width: 100%;
    height: calc(100vh - 61px);
    overflow: hidden;
  }

  .editor-container :global(.jse-main) {
    height: 100% !important;
    border: none !important;
  }
</style>
