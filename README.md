# iM뱅크 JSON 에디터 (사내 내부망 전용)

인터넷 연결 없이 사내 내부망 환경에서 독립적으로 동작하는 JSON 에디터입니다.

## 주요 기능

- **다양한 편집 모드 제공**
  - **Tree 모드**: JSON 데이터 구조를 시각적 트리 형태로 편집.
  - **Table 모드**: 배열 및 객체 데이터를 테이블 형태로 정렬 및 편집.
  - **Code 모드**: 구문 강조 기능이 포함된 텍스트 에디터 모드.
- **내부망 단독 실행 지원**: Service Worker를 통한 클라이언트 브라우저 단독 실행 및 PWA 지원.
- **편리한 데이터 입출력**:
  - `.json` 및 텍스트 파일 불러오기 지원.
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

### 미리보기 (Preview)

```bash
npm run preview
```

## GitHub Pages 배포

이 프로젝트는 GitHub Actions를 통해 GitHub Pages로 자동 배포되도록 설정되어 있습니다.
1. GitHub 저장소의 `Settings` > `Pages` 이동.
2. **Source** 항목을 **GitHub Actions**로 설정.
3. `main` 브랜치에 코드를 `push`하면 `.github/workflows/deploy.yml` 워크플로우가 자동으로 실행되어 배포 완료.

## 기술 스택

- **Framework**: Svelte 5
- **Build Tool**: Vite
- **JSON Editor**: `svelte-jsoneditor`
- **PWA**: `vite-plugin-pwa`
