<script>
  import { onMount } from 'svelte';
  import { JSONEditor, Mode } from 'svelte-jsoneditor';
  import { onRenderMenu, onRenderContextMenu, setupI18nObserver } from './i18n.js';

  let content = $state({
    json: [
      {
        "id": 1,
        "name": "JSON Editor Pro",
        "category": "Developer Tool",
        "status": "Active",
        "version": "1.0.0",
        "offlineSupport": true,
        "description": "오프라인 및 정적 웹 환경을 지원하는 JSON 에디터"
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

  onMount(() => {
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
      <h1>JSON Editor Pro</h1>
      <span class="badge">오프라인 / 정적 웹</span>
    </div>

    <div class="toolbar">
      <div class="button-group">
        <label class="btn-label">
          <span>Mode:</span>
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
          <svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          JSON 파일 열기
        </button>
        <input bind:this={fileInput} type="file" accept=".json,application/json,text/plain" onchange={handleFileUpload} style="display: none;" />
      </div>
    </div>
  </header>

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
    padding: 0.75rem 1.25rem;
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    z-index: 10;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    background-color: #3b82f6;
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.1rem;
    font-family: monospace;
  }

  .brand h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.025em;
  }

  .badge {
    background-color: #e0f2fe;
    color: #0369a1;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .button-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .divider {
    height: 24px;
    width: 1px;
    background-color: #e2e8f0;
  }

  .btn-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
  }

  .select-mode {
    padding: 0.4rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
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
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
    font-size: 0.875rem;
    font-weight: 500;
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

  .icon {
    flex-shrink: 0;
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
