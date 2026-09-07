// Korean translation mapping and i18n helpers for JSON Editor Pro

const menuTitleMap = {
  'Expand all': '전체 펼치기',
  'Collapse all': '전체 접기',
  'Format JSON: add proper indentation and new lines (Ctrl+I)': 'JSON Format: 들여쓰기 및 줄바꿈 (Ctrl+I)',
  'Compact JSON: remove all white spacing and new lines (Ctrl+Shift+I)': 'JSON Compact: 공백 및 줄바꿈 제거 (Ctrl+Shift+I)',
  'Sort': 'Sort',
  'Transform contents (filter, sort, project)': 'Transform (필터, Sort, Project)',
  'Search (Ctrl+F)': 'Search (Ctrl+F)',
  'Undo (Ctrl+Z)': 'Undo (Ctrl+Z)',
  'Redo (Ctrl+Shift+Z)': 'Redo (Ctrl+Shift+Z)',
  'Copy (Ctrl+C)': 'Copy (Ctrl+C)',
  'Open context menu (Click or Right-click on a key or value)': 'Context Menu 열기 (Key/Value 클릭 또는 마우스 우클릭)',
  'Open context menu': 'Context Menu 열기'
};

const contextTextMap = {
  'Edit key': 'Key 편집',
  'Edit array': 'Array 편집',
  'Edit object': 'Object 편집',
  'Edit value': 'Value 편집',
  'Edit': '편집',
  'Edit row': 'Row 편집',
  'Enforce string': 'String 타입 유지',
  'Cut': 'Cut',
  'Cut formatted': 'Cut (Formatted)',
  'Cut compacted': 'Cut (Compacted)',
  'Copy': 'Copy',
  'Copy formatted': 'Copy (Formatted)',
  'Copy compacted': 'Copy (Compacted)',
  'Paste': 'Paste',
  'Duplicate': 'Duplicate',
  'Duplicate row': 'Row Duplicate',
  'Extract': 'Extract',
  'Sort': 'Sort',
  'Transform': 'Transform',
  'Remove': 'Remove',
  'Remove row': 'Row 삭제',
  'Structure': 'Structure',
  'Object': 'Object',
  'Array': 'Array',
  'Value': 'Value',
  'Insert before': '이전에 삽입',
  'Insert after': '이후에 삽입',
  'Convert to:': 'Convert to:',
  'Insert:': 'Insert:',
  'Table cell:': 'Table 셀:',
  'Table row:': 'Table 행:'
};

const contextTitleMap = {
  'Edit the key (Double-click on the key)': 'Key 편집 (Double-click)',
  'Edit the value (Double-click on the value)': 'Value 편집 (Double-click)',
  'Enforce keeping the value as string when it contains a numeric value': '숫자 형태여도 String 타입으로 유지',
  'Cut selected contents, formatted with indentation (Ctrl+X)': '선택 항목 Formatted Cut (Ctrl+X)',
  'Cut selected contents, without indentation (Ctrl+Shift+X)': '선택 항목 Compact Cut (Ctrl+Shift+X)',
  'Copy selected contents, formatted with indentation (Ctrl+C)': '선택 항목 Formatted Copy (Ctrl+C)',
  'Copy selected contents, without indentation (Ctrl+Shift+C)': '선택 항목 Compact Copy (Ctrl+Shift+C)',
  'Paste clipboard contents (Ctrl+V)': '클립보드 내용 Paste (Ctrl+V)',
  'Duplicate selected contents (Ctrl+D)': '선택 항목 Duplicate (Ctrl+D)',
  'Extract selected contents': '선택 항목 Extract',
  'Sort array or object contents': 'Array 또는 Object 항목 Sort',
  'Transform array or object contents (filter, sort, project)': 'Array 또는 Object 항목 Transform (필터, Sort, Project)',
  'Remove selected contents (Delete)': '선택 항목 Remove (Delete)',
  'Select area before current entry to insert or paste contents': '현재 항목 이전에 삽입/붙여넣기',
  'Select area after current entry to insert or paste contents': '현재 항목 이후에 삽입/붙여넣기',
  'Edit the current row': '현재 Row 편집',
  'Duplicate the current row (Ctrl+D)': '현재 Row Duplicate (Ctrl+D)',
  'Insert a row before the current row': '현재 Row 이전에 Row 삽입',
  'Insert a row after the current row': '현재 Row 이후에 Row 삽입',
  'Remove current row': '현재 Row 삭제'
};

function translateMenuTitle(title) {
  if (!title) return title;
  if (menuTitleMap[title]) return menuTitleMap[title];

  if (title.startsWith('Switch to text mode')) {
    const currentMode = title.match(/\(current mode: ([^)]+)\)/)?.[1] || 'text';
    return `Code 모드로 전환 (현재 모드: ${currentMode})`;
  }
  if (title.startsWith('Switch to tree mode')) {
    const currentMode = title.match(/\(current mode: ([^)]+)\)/)?.[1] || 'tree';
    return `Tree 모드로 전환 (현재 모드: ${currentMode})`;
  }
  if (title.startsWith('Switch to table mode')) {
    const currentMode = title.match(/\(current mode: ([^)]+)\)/)?.[1] || 'table';
    return `Table 모드로 전환 (현재 모드: ${currentMode})`;
  }
  if (title.includes('Open context menu')) {
    return 'Context Menu 열기 (Key/Value 클릭 또는 마우스 우클릭)';
  }

  return title;
}

function translateContextTitle(title) {
  if (!title) return title;
  if (contextTitleMap[title]) return contextTitleMap[title];

  if (title.includes('structure like the first item in the array')) {
    return 'Array의 첫 번째 항목 Structure로 추가/변환';
  }
  if (title.endsWith('object')) {
    return 'Object 추가/변환';
  }
  if (title.endsWith('array')) {
    return 'Array 추가/변환';
  }
  if (title.endsWith('value')) {
    return 'Value 추가/변환';
  }

  return title;
}

export function onRenderMenu(items, context) {
  if (!Array.isArray(items)) return items;

  function processItem(item) {
    if (!item) return item;

    const newItem = { ...item };

    if (newItem.title) {
      newItem.title = translateMenuTitle(newItem.title);
    }

    if (Array.isArray(newItem.items)) {
      newItem.items = newItem.items.map(processItem);
    }

    return newItem;
  }

  return items.map(processItem);
}

export function onRenderContextMenu(items, context) {
  if (!Array.isArray(items)) return items;

  function processItem(item) {
    if (!item) return item;

    const newItem = { ...item };

    if (newItem.text && contextTextMap[newItem.text]) {
      newItem.text = contextTextMap[newItem.text];
    }

    if (newItem.title) {
      newItem.title = translateContextTitle(newItem.title);
    }

    if (newItem.main) {
      newItem.main = processItem(newItem.main);
    }

    if (Array.isArray(newItem.items)) {
      newItem.items = newItem.items.map(processItem);
    }

    return newItem;
  }

  return items.map(processItem);
}

// DOM Translation observer for elements like SearchBox, NavigationBar, Welcome screen, Node tooltips, Modals
export function setupI18nObserver() {
  if (typeof document === 'undefined') return;

  function translateDOM() {
    // 1. SearchBox elements
    const searchInputs = document.querySelectorAll('.jse-search-input');
    searchInputs.forEach((input) => {
      if (input.placeholder === 'Find') input.placeholder = 'Search';
      if (input.title === 'Enter text to search') input.title = '검색할 텍스트 입력 (Ctrl+F)';
    });

    const replaceToggles = document.querySelectorAll('.jse-replace-toggle');
    replaceToggles.forEach((btn) => {
      if (btn.title === 'Toggle visibility of replace options (Ctrl+H)') {
        btn.title = 'Replace 옵션 토글 (Ctrl+H)';
      }
    });

    const searchNextBtns = document.querySelectorAll('.jse-search-next');
    searchNextBtns.forEach((btn) => {
      if (btn.title === 'Go to next search result (Enter)') {
        btn.title = '다음 검색 결과 (Enter)';
      }
    });

    const searchPrevBtns = document.querySelectorAll('.jse-search-previous');
    searchPrevBtns.forEach((btn) => {
      if (btn.title === 'Go to previous search result (Shift+Enter)') {
        btn.title = '이전 검색 결과 (Shift+Enter)';
      }
    });

    const searchClearBtns = document.querySelectorAll('.jse-search-clear');
    searchClearBtns.forEach((btn) => {
      if (btn.title === 'Close search box (Esc)') {
        btn.title = 'Search창 닫기 (Esc)';
      }
    });

    const replaceInputs = document.querySelectorAll('.jse-replace-input');
    replaceInputs.forEach((input) => {
      if (input.placeholder === 'Replace') input.placeholder = 'Replace';
      if (input.title === 'Enter replacement text') input.title = '바꿀 텍스트 입력';
    });

    const replaceSectionBtns = document.querySelectorAll('.jse-replace-section button');
    replaceSectionBtns.forEach((btn) => {
      if (btn.textContent.trim() === 'Replace') {
        btn.textContent = 'Replace';
        btn.title = '현재 항목 Replace (Ctrl+Enter)';
      } else if (btn.textContent.trim() === 'All') {
        btn.textContent = 'Replace All';
        btn.title = '모든 항목 Replace';
      }
    });

    // 2. NavigationBar
    const pathBtns = document.querySelectorAll('.jse-navigation-bar button.jse-path');
    pathBtns.forEach((btn) => {
      if (btn.title === 'Edit the selected path') {
        btn.title = '선택한 Path 편집';
      } else if (btn.title === 'Cancel editing the selected path') {
        btn.title = '선택한 Path 편집 취소';
      }
    });

    const copyPathBtns = document.querySelectorAll('.jse-navigation-bar button.jse-copy-path');
    copyPathBtns.forEach((btn) => {
      if (btn.title === 'Copy selected path to the clipboard') {
        btn.title = '선택한 Path를 클립보드에 복사';
      }
    });

    // 3. Welcome Screen
    const welcomeTitle = document.querySelector('.jse-welcome-title');
    if (welcomeTitle && welcomeTitle.textContent === 'Empty document') {
      welcomeTitle.textContent = 'Empty document';
    }

    const welcomeInfo = document.querySelector('.jse-welcome-info');
    if (welcomeInfo && welcomeInfo.textContent.includes('You can paste clipboard data using')) {
      welcomeInfo.innerHTML = '<b>Ctrl+V</b>를 눌러 클립보드 데이터를 Paste 하거나, 아래 버튼을 클릭하세요:';
    }

    const welcomeBtns = document.querySelectorAll('.jse-welcome button');
    welcomeBtns.forEach((btn) => {
      if (btn.textContent.trim() === 'Create object') {
        btn.textContent = 'Object 생성';
        btn.title = "빈 JSON Object 생성 ('{' 입력)";
      } else if (btn.textContent.trim() === 'Create array') {
        btn.textContent = 'Array 생성';
        btn.title = "빈 JSON Array 생성 ('[' 입력)";
      }
    });

    // 4. Tree Node Tooltips
    const expandArrayBtns = document.querySelectorAll('[title*="Expand or collapse this array"]');
    expandArrayBtns.forEach((btn) => {
      btn.title = 'Array 펼치기/접기 (Ctrl+클릭으로 하위 항목 포함 전체 펼치기/접기)';
    });

    const expandObjBtns = document.querySelectorAll('[title*="Expand or collapse this object"]');
    expandObjBtns.forEach((btn) => {
      btn.title = 'Object 펼치기/접기 (Ctrl+클릭으로 하위 항목 포함 전체 펼치기/접기)';
    });

    const contextExplanationBtns = document.querySelectorAll('[title*="Click or Right-click to open context menu"]');
    contextExplanationBtns.forEach((btn) => {
      btn.title = '클릭 또는 우클릭하여 Context Menu 열기';
    });

    // 5. Modals (Sort / Transform)
    const modalHeaderTitle = document.querySelector('.jse-modal .jse-header-title, .jse-sort-modal .jse-title');
    if (modalHeaderTitle) {
      if (modalHeaderTitle.textContent.trim() === 'Sort array items') {
        modalHeaderTitle.textContent = 'Sort Array Items';
      } else if (modalHeaderTitle.textContent.trim() === 'Sort object keys') {
        modalHeaderTitle.textContent = 'Sort Object Keys';
      }
    }

    const tableHeaders = document.querySelectorAll('.jse-modal-contents table th');
    tableHeaders.forEach((th) => {
      if (th.textContent.trim() === 'Path') th.textContent = 'Path';
      if (th.textContent.trim() === 'Property') th.textContent = 'Property';
      if (th.textContent.trim() === 'Direction') th.textContent = 'Direction';
    });

    const modalPrimaryBtns = document.querySelectorAll('.jse-modal-contents .jse-actions button.jse-primary');
    modalPrimaryBtns.forEach((btn) => {
      if (btn.textContent.trim() === 'Sort') {
        btn.textContent = 'Sort';
      } else if (btn.textContent.trim() === 'Transform') {
        btn.textContent = 'Transform';
      }
    });

    const transformLabels = document.querySelectorAll('.jse-transform-modal .jse-label-inner');
    transformLabels.forEach((label) => {
      const text = label.textContent.trim();
      if (text === 'Language') label.textContent = 'Language';
      if (text === 'Path') label.textContent = 'Path';
      if (text.includes('Wizard')) label.childNodes[label.childNodes.length - 1].nodeValue = ' Wizard';
      if (text === 'Query') label.textContent = 'Query';
      if (text.includes('Original')) label.childNodes[label.childNodes.length - 1].nodeValue = ' Original';
      if (text === 'Preview') label.textContent = 'Preview';
    });
  }

  // Initial translation check
  translateDOM();

  // Observer for dynamic element updates
  const observer = new MutationObserver(() => {
    translateDOM();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  return () => observer.disconnect();
}
