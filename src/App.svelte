<script>
  import { JSONEditor, Mode } from 'svelte-jsoneditor';

  let content = $state({
    json: {
      appName: "Offline JSON Editor",
      version: "1.0.0",
      features: [
        "Tree Mode",
        "Table Mode",
        "Code Text Mode",
        "Transform / Sort / Filter",
        "File Load & Paste"
      ],
      settings: {
        offline: true,
        networkCalls: false
      }
    }
  });

  let mode = $state(Mode.tree);
  let editorRef = $state();
  let fileInput = $state();

  let isPasteModalOpen = $state(false);
  let pasteTextValue = $state('');
  let pasteError = $state('');

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

  function openPasteModal() {
    pasteTextValue = '';
    pasteError = '';
    isPasteModalOpen = true;
  }

  function closePasteModal() {
    isPasteModalOpen = false;
  }

  function applyPaste() {
    if (!pasteTextValue.trim()) {
      pasteError = '내용을 입력하세요.';
      return;
    }

    try {
      const parsed = JSON.parse(pasteTextValue);
      content = { json: parsed };
      isPasteModalOpen = false;
    } catch (err) {
      content = { text: pasteTextValue };
      isPasteModalOpen = false;
    }
  }

  function triggerTransform() {
    if (editorRef) {
      editorRef.transform();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && isPasteModalOpen) {
      closePasteModal();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="container">
  <header class="header">
    <div class="brand">
      <div class="logo-icon">&#123;&#125;</div>
      <h1>JSON Editor Pro</h1>
      <span class="badge">Offline / Static</span>
    </div>

    <div class="toolbar">
      <div class="button-group">
        <label class="btn-label">
          <span>모드:</span>
          <select value={mode} onchange={(e) => handleModeChange(e.target.value)} class="select-mode">
            <option value={Mode.tree}>Tree 모드</option>
            <option value={Mode.table}>Table 모드</option>
            <option value={Mode.text}>Code (텍스트) 모드</option>
          </select>
        </label>
      </div>

      <div class="divider"></div>

      <div class="button-group">
        <button onclick={triggerFileUpload} class="btn btn-primary">
          <svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          파일 열기 (JSON)
        </button>
        <input bind:this={fileInput} type="file" accept=".json,application/json,text/plain" onchange={handleFileUpload} style="display: none;" />

        <button onclick={openPasteModal} class="btn btn-secondary">
          <svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          직접 붙여넣기
        </button>

        <button onclick={triggerTransform} class="btn btn-secondary">
          <svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          정렬 / 필터 (Transform)
        </button>
      </div>
    </div>
  </header>

  <main class="editor-container">
    <JSONEditor
      bind:this={editorRef}
      {content}
      {mode}
      onChange={handleContentChange}
      onChangeMode={handleModeChange}
    />
  </main>
</div>

{#if isPasteModalOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="modal-backdrop" onclick={closePasteModal} role="presentation">
    <div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
      <div class="modal-header">
        <h2 id="modal-title">JSON 데이터 붙여넣기</h2>
        <button class="modal-close-btn" onclick={closePasteModal}>&times;</button>
      </div>
      <div class="modal-body">
        <p class="modal-desc">JSON 텍스트를 입력창에 붙여넣고 적용 버튼을 누르세요.</p>
        <textarea
          bind:value={pasteTextValue}
          placeholder="&#123; &quot;key&quot;: &quot;value&quot; &#125;"
          rows="10"
          class="paste-textarea"
        ></textarea>
        {#if pasteError}
          <div class="modal-error">{pasteError}</div>
        {/if}
      </div>
      <div class="modal-footer">
        <button onclick={closePasteModal} class="btn btn-secondary">취소</button>
        <button onclick={applyPaste} class="btn btn-primary">적용하기</button>
      </div>
    </div>
  </div>
{/if}

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

  .btn-secondary {
    background-color: #ffffff;
    color: #334155;
    border-color: #cbd5e1;
  }

  .btn-secondary:hover {
    background-color: #f1f5f9;
    border-color: #94a3b8;
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

  /* Modal styling */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(15, 23, 42, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
  }

  .modal-content {
    background-color: #ffffff;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h2 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #0f172a;
  }

  .modal-close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #64748b;
    cursor: pointer;
    line-height: 1;
  }

  .modal-close-btn:hover {
    color: #0f172a;
  }

  .modal-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .modal-desc {
    font-size: 0.875rem;
    color: #64748b;
  }

  .paste-textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 0.75rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.875rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    outline: none;
    resize: vertical;
  }

  .paste-textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .modal-error {
    color: #ef4444;
    font-size: 0.875rem;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
  }
</style>
