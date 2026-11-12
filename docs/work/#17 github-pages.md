# GitHub 공개 저장소와 Pages 배포

- 날짜: 2026-11-12
- 요청 목적: `gracefully91/Travel`에 프로젝트를 푸시하고 GitHub 사이트에서 앱을 볼 수 있게 한다. 정적 사이트에서도 외부 API 없이 쓸 교통 자료를 저장소 데이터로 제공한다.
- 계획: [GitHub Pages 공개 배포](../plans/2026-11-12-github-pages.md)

## 변경

- 비어 있던 Git 저장소를 초기화해 기존 프로젝트 파일 268개를 `main` 브랜치 첫 커밋 `078d354`로 푸시했다. `.env`, 런타임 SQLite는 `.gitignore`로 제외했다. 원본 GLB 등 기존 에셋은 보존했다.
- 사용자가 GitHub 저장소를 공개로 변경했다고 알려줬다. 저장소 공개 여부는 이 작업 중 바꾸지 않았다.
- GitHub Pages 배포 workflow와 Vite `/Travel/` base 경로 지원을 추가했다. 구역/소형 맵 JSON, 역사·열차 GLB, Draco decoder, 홈 링크가 프로젝트 경로를 따르도록 조정했다.

## 교통 데이터 상태와 한계

- 저장소에 확인 가능한 코레일 KTX 정차 시간표와 평창 BIS 노선/정류장 원본, 일부 도로 시간 행렬이 있다.
- 서버 SQLite `data/runtime/transit.sqlite`는 로컬 전용이며 Git에서 제외된다. 현재 DB에는 공식 버스 노선 3개와 정류장 정보가 있지만, 출처·운행일을 검증해 등록한 버스 운행 시간표는 0건이다.
- 평창 BIS 시간표 웹페이지는 공개 확인했지만, 수집된 로컬 JSON 파일은 오류 화면이어서 공식 시간표 값으로 사용할 수 없다. 노선의 `avgTime`은 실제 날짜별 출발 시각이 아니다.
- Pages는 서버를 실행하지 않으므로 `/api/travel/*`를 호출하는 일정 생성·경로/장소 검색은 아직 Pages에서 동작하지 않는다. 공개된 정적 원본 자료와 확인된 운행표를 브라우저가 읽는 형태로 전환해야 “API 없이 일정 생성” 완료로 볼 수 있다. 이때까지 없는 버스 시간표는 생성하지 않는다.

## 검증 및 상태

- 첫 푸시 완료: `078d354` (`main`).
- 일반 프로덕션 `npm run build` 통과.
- `GITHUB_PAGES=true npm run build` 통과. 산출물에 `/Travel/` base 경로가 적용되는 것을 확인했다.
- `npm run test:docs` 통과: 문서 36개, 링크 86개, 누락 없음.
- GitHub Actions Pages 배포는 workflow를 main에 푸시한 뒤 실행된다. 배포 URL과 브라우저에서의 실제 화면 확인은 완료 후 갱신한다.
- 런타임 API 의존 일정 기능은 아직 미완료다.
