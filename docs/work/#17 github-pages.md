# GitHub 공개 저장소와 Pages 배포

- 날짜: 2026-11-12
- 요청 목적: `gracefully91/Travel`에 프로젝트를 푸시하고 GitHub 사이트에서 앱을 볼 수 있게 한다. 정적 사이트에서도 외부 API 없이 쓸 교통 자료를 저장소 데이터로 제공한다.
- 계획: [GitHub Pages 공개 배포](../plans/2026-11-12-github-pages.md)

## 변경

- 비어 있던 Git 저장소를 초기화해 기존 프로젝트 파일 268개를 `main` 브랜치 첫 커밋 `078d354`로 푸시했다. `.env`, 런타임 SQLite는 `.gitignore`로 제외했다. 원본 GLB 등 기존 에셋은 보존했다.
- 사용자가 GitHub 저장소를 공개로 변경했다고 알려줬다. 저장소 공개 여부는 이 작업 중 바꾸지 않았다.
- GitHub Pages 배포 workflow와 Vite `/Travel/` base 경로 지원을 추가했다. 구역/소형 맵 JSON, 역사·열차 GLB, Draco decoder, 홈 링크가 프로젝트 경로를 따르도록 조정했다.
- 공개판용 `scripts/fetch-public-transit.mjs`와 `npm run data:transit:fetch`를 추가했다. 평창 BIS 노선 8개·정류장 216개·시간표 원본을 `data/raw/transit-updates/`에 저장하고, 정적 브라우저 데이터 `public/data/transport-snapshot.json`을 생성한다. 기존 코레일 진부역 시간표 32개, 택시 거리 요금 규칙, 6개 기본 장소의 자동차/도보 행렬도 함께 담는다.
- Pages 정적 모드의 일정 계산을 로컬 snapshot에 연결했다. 외부 검색·실시간 열차 API·경로 API 호출은 하지 않는다. 저장된 이동 행렬의 범위가 아닌 장소는 경로 미확인으로 남긴다.

## 교통 데이터 상태와 한계

- 저장소에 확인 가능한 코레일 KTX 정차 시간표와 평창 BIS 노선/정류장 원본, 일부 도로 시간 행렬이 있다.
- 서버 SQLite `data/runtime/transit.sqlite`는 로컬 전용이며 Git에서 제외된다. 현재 DB에는 공식 버스 노선 3개와 정류장 정보가 있지만, 출처·운행일을 검증해 등록한 버스 운행 시간표는 0건이다.
- 공식 BIS endpoint를 2026-11-12 확인해 21·224·225·226·240·420·440·441번 자료를 저장했다. 21번에만 요일별 6개 시각(기점발·종점발)이 응답했으나 게시일이 2025-12-30으로 오래되어 자동 일정에서 제외한다. 나머지 7개 노선 시간표는 빈 응답이었다. 노선의 `avgTime`은 출발 시각으로 취급하지 않는다.
- 저장된 KTX 자료에는 진부 정차편 32개가 있다. 실시간 위치·지연·정체는 없다. 공개판은 고정된 6개 장소 간 OSM 경로 행렬만 지원하고, 검색/조회형 외부 API를 쓰지 않는다.

## 검증 및 상태

- 첫 푸시 완료: `078d354` (`main`).
- 일반 프로덕션 `npm run build` 통과.
- `GITHUB_PAGES=true npm run build` 통과. 산출물에 `/Travel/` base 경로가 적용되는 것을 확인했다.
- `npm run test:docs` 통과: 문서 링크 누락 없음.
- GitHub Pages 사이트 생성 설정 후 `Deploy GitHub Pages` workflow 성공.
- 배포 주소: https://gracefully91.github.io/Travel/ · 저장소: https://github.com/gracefully91/Travel
- `curl`에서 페이지 HTML, 진부 구역 JSON, 진부역 GLB, Draco WASM 응답 모두 HTTP 200이었다. 실제 브라우저 화면/콘솔은 직접 확인하지 않았다.
- `npm run data:transit:fetch`에서 8개 노선·216개 정류장·KTX 32개 항목을 내보냈다. 버스 자동 일정에서 쓸 수 있는 최신 검증 시각은 0건이다.
