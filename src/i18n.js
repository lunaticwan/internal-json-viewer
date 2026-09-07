// Korean translation mapping and i18n helpers for JSON Editor Pro

const menuTitleMap = {
  'Expand all': '전체 펼치기',
  'Collapse all': '전체 접기',
  'Format JSON: add proper indentation and new lines (Ctrl+I)': 'JSON 포맷팅: 들여쓰기 및 줄바꿈 적용 (Ctrl+I)',
  'Compact JSON: remove all white spacing and new lines (Ctrl+Shift+I)': 'JSON 압축: 공백 및 줄바꿈 제거 (Ctrl+Shift+I)',
  'Sort': '정렬',
  'Transform contents (filter, sort, project)': '데이터 변환 (필터, 정렬, 프로젝션)',
  'Search (Ctrl+F)': '검색 (Ctrl+F)',
  'Undo (Ctrl+Z)': '실행 취소 (Ctrl+Z)',
  'Redo (Ctrl+Shift+Z)': '다시 실행 (Ctrl+Shift+Z)',
  'Copy (Ctrl+C)': '복사 (Ctrl+C)',
  'Open context menu (Click or Right-click on a key or value)': '컨텍스트 메뉴 열기 (키/값을 클릭하거나 마우스 우클릭)',
  'Open context menu': '컨텍스트 메뉴 열기'
};

const contextTextMap = {
  'Edit key': '키 편집',
  'Edit array': '배열 편집',
  'Edit object': '객체 편집',
  'Edit value': '값 편집',
  'Edit': '편집',
  'Edit row': '행 편집',
  'Enforce string': '문자열 타입 강제',
  'Cut': '잘라내기',
  'Cut formatted': '서식 있게 잘라내기',
  'Cut compacted': '압축해서 잘라내기',
  'Copy': '복사',
  'Copy formatted': '서식 있게 복사',
  'Copy compacted': '압축해서 복사',
  'Paste': '붙여넣기',
  'Duplicate': '복제',
  'Duplicate row': '행 복제',
  'Extract': '추출',
  'Sort': '정렬',
  'Transform': '변환',
  'Remove': '삭제',
  'Remove row': '행 삭제',
  'Structure': '구조',
  'Object': '객체',
  'Array': '배열',
  'Value': '값',
  'Insert before': '이전에 삽입',
  'Insert after': '이후에 삽입',
  'Convert to:': '변환:',
  'Insert:': '추가:',
  'Table cell:': '테이블 셀:',
  'Table row:': '테이블 행:'
};

const contextTitleMap = {
  'Edit the key (Double-click on the key)': '키 편집 (키 더블 클릭)',
  'Edit the value (Double-click on the value)': '값 편집 (값 더블 클릭)',
  'Enforce keeping the value as string when it contains a numeric value': '숫자 형태여도 문자열 타입으로 유지',
  'Cut selected contents, formatted with indentation (Ctrl+X)': '선택한 내용 들여쓰기 포함 잘라내기 (Ctrl+X)',
  'Cut selected contents, without indentation (Ctrl+Shift+X)': '선택한 내용 들여쓰기 없이 잘라내기 (Ctrl+Shift+X)',
  'Copy selected contents, formatted with indentation (Ctrl+C)': '선택한 내용 들여쓰기 포함 복사 (Ctrl+C)',
  'Copy selected contents, without indentation (Ctrl+Shift+C)': '선택한 내용 들여쓰기 없이 복사 (Ctrl+Shift+C)',
  'Paste clipboard contents (Ctrl+V)': '클립보드 내용 붙여넣기 (Ctrl+V)',
  'Duplicate selected contents (Ctrl+D)': '선택한 내용 복제 (Ctrl+D)',
  'Extract selected contents': '선택한 내용만 추출',
  'Sort array or object contents': '배열 또는 객체 내용 정렬',
  'Transform array or object contents (filter, sort, project)': '배열 또는 객체 내용 변환 (필터, 정렬, 프로젝션)',
  'Remove selected contents (Delete)': '선택한 내용 삭제 (Delete)',
  'Select area before current entry to insert or paste contents': '현재 항목 이전에 내용 삽입/붙여넣기 위치 선택',
  'Select area after current entry to insert or paste contents': '현재 항목 이후에 내용 삽입/붙여넣기 위치 선택',
  'Edit the current row': '현재 행 편집',
  'Duplicate the current row (Ctrl+D)': '현재 행 복제 (Ctrl+D)',
  'Insert a row before the current row': '현재 행 이전에 행 삽입',
  'Insert a row after the current row': '현재 행 이후에 행 삽입',
  'Remove current row': '현재 행 삭제'
};

function translateMenuTitle(title) {
  if (!title) return title;
  if (menuTitleMap[title]) return menuTitleMap[title];

  if (title.startsWith('Switch to text mode')) {
    const currentMode = title.match(/\(current mode: ([^)]+)\)/)?.[1] || 'text';
    return `Code (텍스트) 모드로 전환 (현재 모드: ${currentMode})`;
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
    return '컨텍스트 메뉴 열기 (키/값을 클릭하거나 마우스 우클릭)';
  }

  return title;
}

function translateContextTitle(title) {
  if (!title) return title;
  if (contextTitleMap[title]) return contextTitleMap[title];

  if (title.includes('structure like the first item in the array')) {
    return '배열의 첫 번째 항목 구조로 추가/변환';
  }
  if (title.endsWith('object')) {
    return '객체 추가/변환';
  }
  if (title.endsWith('array')) {
    return '배열 추가/변환';
  }
  if (title.endsWith('value')) {
    return '값 추가/변환';
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
      if (input.placeholder === 'Find') input.placeholder = '검색어 입력';
      if (input.title === 'Enter text to search') input.title = '검색할 텍스트 입력 (Ctrl+F)';
    });

    const replaceToggles = document.querySelectorAll('.jse-replace-toggle');
    replaceToggles.forEach((btn) => {
      if (btn.title === 'Toggle visibility of replace options (Ctrl+H)') {
        btn.title = '바꾸기 옵션 토글 (Ctrl+H)';
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
        btn.title = '검색창 닫기 (Esc)';
      }
    });

    const replaceInputs = document.querySelectorAll('.jse-replace-input');
    replaceInputs.forEach((input) => {
      if (input.placeholder === 'Replace') input.placeholder = '바꿀 내용';
      if (input.title === 'Enter replacement text') input.title = '바꿀 텍스트 입력';
    });

    const replaceSectionBtns = document.querySelectorAll('.jse-replace-section button');
    replaceSectionBtns.forEach((btn) => {
      if (btn.textContent.trim() === 'Replace') {
        btn.textContent = '바꾸기';
        btn.title = '현재 항목 바꾸기 (Ctrl+Enter)';
      } else if (btn.textContent.trim() === 'All') {
        btn.textContent = '모두 바꾸기';
        btn.title = '모든 항목 바꾸기';
      }
    });

    // 2. NavigationBar
    const pathBtns = document.querySelectorAll('.jse-navigation-bar button.jse-path');
    pathBtns.forEach((btn) => {
      if (btn.title === 'Edit the selected path') {
        btn.title = '선택한 경로 편집';
      } else if (btn.title === 'Cancel editing the selected path') {
        btn.title = '선택한 경로 편집 취소';
      }
    });

    const copyPathBtns = document.querySelectorAll('.jse-navigation-bar button.jse-copy-path');
    copyPathBtns.forEach((btn) => {
      if (btn.title === 'Copy selected path to the clipboard') {
        btn.title = '선택한 경로를 클립보드에 복사';
      }
    });

    // 3. Welcome Screen
    const welcomeTitle = document.querySelector('.jse-welcome-title');
    if (welcomeTitle && welcomeTitle.textContent === 'Empty document') {
      welcomeTitle.textContent = '빈 문서';
    }

    const welcomeInfo = document.querySelector('.jse-welcome-info');
    if (welcomeInfo && welcomeInfo.textContent.includes('You can paste clipboard data using')) {
      welcomeInfo.innerHTML = '<b>Ctrl+V</b>를 눌러 클립보드 데이터를 붙여넣거나, 아래 버튼을 클릭하세요:';
    }

    const welcomeBtns = document.querySelectorAll('.jse-welcome button');
    welcomeBtns.forEach((btn) => {
      if (btn.textContent.trim() === 'Create object') {
        btn.textContent = '객체 생성';
        btn.title = "빈 JSON 객체 생성 ('{' 입력)";
      } else if (btn.textContent.trim() === 'Create array') {
        btn.textContent = '배열 생성';
        btn.title = "빈 JSON 배열 생성 ('[' 입력)";
      }
    });

    // 4. Tree Node Tooltips
    const expandArrayBtns = document.querySelectorAll('[title*="Expand or collapse this array"]');
    expandArrayBtns.forEach((btn) => {
      btn.title = '배열 펼치기/접기 (Ctrl+클릭으로 하위 항목 포함 전체 펼치기/접기)';
    });

    const expandObjBtns = document.querySelectorAll('[title*="Expand or collapse this object"]');
    expandObjBtns.forEach((btn) => {
      btn.title = '객체 펼치기/접기 (Ctrl+클릭으로 하위 항목 포함 전체 펼치기/접기)';
    });

    const contextExplanationBtns = document.querySelectorAll('[title*="Click or Right-click to open context menu"]');
    contextExplanationBtns.forEach((btn) => {
      btn.title = '클립 또는 우클릭하여 컨텍스트 메뉴 열기';
    });

    // 5. Modals (Sort / Transform)
    const modalHeaderTitle = document.querySelector('.jse-modal .jse-header-title, .jse-sort-modal .jse-title');
    if (modalHeaderTitle) {
      if (modalHeaderTitle.textContent.trim() === 'Sort array items') {
        modalHeaderTitle.textContent = '배열 항목 정렬';
      } else if (modalHeaderTitle.textContent.trim() === 'Sort object keys') {
        modalHeaderTitle.textContent = '객체 키 정렬';
      }
    }

    const tableHeaders = document.querySelectorAll('.jse-modal-contents table th');
    tableHeaders.forEach((th) => {
      if (th.textContent.trim() === 'Path') th.textContent = '경로';
      if (th.textContent.trim() === 'Property') th.textContent = '속성';
      if (th.textContent.trim() === 'Direction') th.textContent = '정렬 방향';
    });

    const modalPrimaryBtns = document.querySelectorAll('.jse-modal-contents .jse-actions button.jse-primary');
    modalPrimaryBtns.forEach((btn) => {
      if (btn.textContent.trim() === 'Sort') {
        btn.textContent = '정렬';
      } else if (btn.textContent.trim() === 'Transform') {
        btn.textContent = '변환 적용';
      }
    });

    const transformLabels = document.querySelectorAll('.jse-transform-modal .jse-label-inner');
    transformLabels.forEach((label) => {
      const text = label.textContent.trim();
      if (text === 'Language') label.textContent = '언어';
      if (text === 'Path') label.textContent = '경로';
      if (text.includes('Wizard')) label.childNodes[label.childNodes.length - 1].nodeValue = ' 위저드';
      if (text === 'Query') label.textContent = '쿼리';
      if (text.includes('Original')) label.childNodes[label.childNodes.length - 1].nodeValue = ' 원본';
      if (text === 'Preview') label.textContent = '미리보기';
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
