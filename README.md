# JSON Editor Pro (오프라인 / 정적 웹 JSON 에디터)

웹 브라우저에서 독립적으로 작동하며, 인터넷 연결 없이도 완전하게 사용할 수 있는 PWA 지원 JSON 에디터입니다.

## 주요 기능

- **다양한 편집 모드 제공**
  - **Tree 모드**: JSON 데이터 구조를 시각적 트리 형태로 편집.
  - **Table 모드**: 배열 및 객체 데이터를 테이블 형태로 정렬 및 편집.
  - **Code 모드**: 구문 강조 기능이 포함된 텍스트 에디터 모드.
- **오프라인 / PWA 및 데스크톱 앱 지원**: Service Worker를 통한 클라이언트 단독 실행 및 데스크톱 실행 파일(.exe) 제공.
- **편리한 데이터 입출력**:
  - `.json` 및 텍스트 파일 불러오기 지원.
  - 직접 붙여넣기 Modal 지원.
- **강력한 데이터 조작**: Filter, Sort, Transform 기능 제공.
- **한국어 UI 지원**: 기술 용어(Tree, Table, Code, JSON 등)의 직관성은 유지하면서 메뉴 및 컨텍스트 메뉴 한국어화 적용.

## 시작하기

### 설치 및 의존성 다운로드

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

### 일렉트론 실행 파일 빌드 (Windows .exe)

```bash
npm run electron:build
```

빌드 결과물(.exe 파일)은 `dist-electron/` 디렉토리에 생성됩니다.

### 미리보기 (Preview)

```bash
npm run preview
```

## GitHub Pages 배포 및 일렉트론 빌드 다운로드

### 1. GitHub Pages 배포 (정적 웹)
이 프로젝트는 GitHub Actions를 통해 GitHub Pages로 자동 배포되도록 설정되어 있습니다.
1. GitHub 저장소의 `Settings` > `Pages` 이동.
2. **Source** 항목을 **GitHub Actions**로 설정.
3. `main` 브랜치에 코드를 `push`하면 `.github/workflows/deploy.yml` 워크플로우가 자동으로 실행되어 배포 완료.

### 2. 일렉트론 실행 파일 (.exe) 다운로드
GitHub Actions 자동 빌드를 통해 항상 최신 실행 파일을 다운로드할 수 있습니다.
- **GitHub Releases**: [Releases 페이지]에서 최신 버전의 설치형(`-setup.exe`) 및 포터블(`-portable.exe`) 실행 파일 바로 다운로드 가능.
- **Actions Artifacts**: GitHub Actions의 `Build Windows Electron App` 실행 결과 페이지 하단 **Artifacts** 영역에서도 `iM-Bank-JSON-Editor-Windows` 압축파일 다운로드 가능.

## 기술 스택

- **Framework**: Svelte 5
- **Build Tool**: Vite
- **JSON Editor**: `svelte-jsoneditor`
- **Desktop**: Electron / electron-builder
- **PWA**: `vite-plugin-pwa`
