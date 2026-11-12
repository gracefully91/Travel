# 사용자 표시 경계로 횡계 시내 맵 자르기

- 날짜: 2026-11-12
- 요청 목적: 사용자가 제공한 횡계 지도에서 빨간 선으로 표시한 범위만 작은 3D 맵으로 만들고, 여러 차례 확인한다.
- 결정 배경: 기존 횡계 기본 맵은 면사무소 중심 반경 약 225m만 표시했다. 진부 때의 임의 타원 문제를 반복하지 않도록 사용자 표시 외곽을 44개 지점으로 옮기고 실제 OSM 기준점에 맞췄다.
- 좌표 대조 및 수정: 사용자가 제공한 1226×835 지도는 북쪽 위다. 첫 변환에서 면사무소와 학교 간 픽셀 차이를 회전으로 설명해 약 12도 돌린 것이 오류였다. 사용자의 정정 후 회전을 제거하고 면사무소 OSM way/474530094의 이미지 점 `(580,455)` px, 횡계초등학교 OSM way/425693217 부지 중심 추정 `(700,393)` px를 사용해 동쪽=화면 오른쪽·북쪽=화면 위인 축 정렬 변환으로 재생성했다. 이 좌표 근거를 `boundaryReference`에 저장한다.
- 변경 파일:
  - `scripts/process-regions.py`: 횡계 경계 픽셀 좌표를 OSM 대관령면사무소 way/474530094 및 횡계초등학교 way/425693217에 맞춰 로컬 동·북 좌표로 변환한다. 도로는 경계와 교차하는 점에서 잘라 출력하고 건물·수계·녹지는 경계 안 feature만 선택한다. 경계 bounding box의 중심으로 카메라 위치를 설정한다.
  - `data/raw/regions/hoenggye.osm`, `hoenggye-source.json`: 원본 bbox의 북쪽 경계가 표시 영역을 덮지 않아 bbox를 북쪽 37.692까지 확장해 OSM 원본을 새로 받았다. 이전 원본과 메타데이터는 `hoenggye-before-north-up-boundary.osm` 및 `hoenggye-before-north-up-boundary-source.json`으로 보존했다.
  - `scripts/fetch-regions.mjs`, `src/world/registry.ts`: 향후 원본 갱신 및 구역 개요의 횡계 bbox를 37.692까지 일치시켰다.
  - `public/maps/hoenggye-center.json`: 무회전 44점 경계, 건물 245개, 도로 segment 215개, 하천 6개, 녹지 22개 생성. 평탄 지면/추정 높이 가정을 유지한다.
  - `tests/world-browser.mjs`: 경계 크기·북쪽 위/무회전 기준·경계 전체의 원본 bbox 포함·면사무소/학교 포함·도시 feature 및 장소 정보 UI 검증을 추가하고 122개 고정 건물 수를 실제 변환 자료 기반 검사로 바꿨다.
  - `MAPS.md`, `BRAIN.md`, 계획·작업 인덱스: 출처·범위·한계를 반영했다.
- 검증:
  - `python scripts/process-regions.py`: 확장된 원본에서 연속 두 번 재생성. 최종 SHA-256 `CAB0F2F095B2E24BE889F80232F79947C8010FC752877D52691DDF33D21F58DE`가 동일해 변환 결정성을 확인.
  - 공간 검사: 경계 44점 모두 새 원본 bbox 안. `boundaryReference.orientation`이 `north-up`이고 변환 방식이 axis-aligned인지 확인. 면사무소·횡계초등학교 기준 좌표가 경계 안에 포함.
  - `npm run test:world`: 28개 검사 통과. 횡계 지도 데스크톱/모바일 진입·정보 패널, 북쪽 위/무회전 좌표 및 경계 전체의 원본 bbox 포함, 기존 역·진부 맵·로딩·콘솔 검사를 포함.
  - 브라우저 화면을 갱신해 `artifacts/world-direct-hoenggye.png`에서 새 시내 경계 지면과 도로·건물 배치를 확인.
  - `npm run build`: 성공. Vite가 500kB 초과 청크 경고를 출력했으나 빌드 완료.
- 남은 한계: 빨간 선은 스크린샷에서 수작업으로 픽셀화했고, 두 OSM 기준점의 이미지 내 위치도 육안 추정이다. 따라서 경계는 사용자 표시를 최대한 따른 앱 탐험 범위이지 정확한 측량이나 공식 경계가 아니다. 고도 DEM은 미적용이며 높이 미상 건물은 7m 기본값이다.
- 관련 계획: [횡계 시내 경계 적용](../plans/2026-11-12-hoenggye-boundary.md)


## 사용자 표시 범위로 둥근 경계 재적용

- 사용자가 이전 경계가 실제 모양과 다르다고 지적하고 최신 지도 화면에 빨간색으로 원하는 횡계 마을 범위를 표시했다.
- `scripts/process-regions.py`의 이전 경계와 임시 사각형을 교체했다. 대관령면사무소 OSM 중심 좌표 주변의 북쪽 위 둥근 경계(동서 반경 850m, 남북 반경 500m)를 사용한다. 외곽은 이미지 기반 임시 근사이며 사용자 확인 후 조정한다.
- 변환 결과 `public/maps/hoenggye-center.json`: 건물 217개, 도로 segment 140개, 하천 2개, 녹지 13개. OSM 원본과 취득 메타데이터는 보존했다.
- `tests/world-browser.mjs`의 경계 전제를 새 둥근 범위 검사로 갱신했다. 요청에 따라 브라우저 캡처/육안 검토는 생략한다. 빌드 및 문서 링크 검사를 기록한다.
## 둥근 경계 되돌림

- 사용자가 화면에 표시한 외곽을 바탕으로 적용한 둥근 근사 절단이 잘못됐다고 하여 바로 되돌렸다.
- 현재 `scripts/process-regions.py`와 `public/maps/hoenggye-center.json`은 대관령면사무소 중심 북쪽 위 임시 사각 범위 3.2km × 3.2km(로컬 [-1400,-1400]~[1800,1800])로 복구했다. 원본 OSM은 변경하지 않았다.
- 관련 브라우저 캡처는 사용자 요청에 따라 생략한다. 이번 되돌림에서는 빌드 및 문서 링크 확인만 진행한다.
- 사용자 상세 안내를 받은 뒤에만 경계를 다시 자른다.
## OSM 내보내기 범위로 직접 좌표화 (2026-11-12)

사용자가 OSM 지도와 내보내기 bbox [128.67973,37.65766,128.74711,37.68674]를 제공했다. 과거 임의 기준점·타원 근사를 폐기하고, 지도 전체 807×715px에 export bbox를 대응시킨 후 빨간 선의 67점 픽셀을 Web Mercator 역변환했다. 수작업 픽셀 오차는 남으며 bbox가 지도 전체 이미지 범위를 뜻한다는 사용자 설명을 따른다.

- `data/raw/regions/hoenggye-user-export-boundary.json`: 내보내기 좌표, 이미지 치수, 픽셀 추적 원본.
- `scripts/process-regions.py`: 위도는 Mercator 역변환, 경도는 가로 비례 변환 후 기존 로컬 좌표로 변환. 임의 회전 없음.
- OSM 원본 bbox를 [128.67973,37.65,128.74711,37.692]로 확장. 이전 원본은 `hoenggye-before-export-trace.osm` 및 `hoenggye-before-export-trace-source.json`으로 보존. 취득 시각은 새 source.json에 기록.
- fetch 스크립트/registry의 bbox와 장소 설명, 기존 world 검사 전제를 갱신. 결과 건물 294개·도로 segment 392개·하천 10개·녹지 27개.
- 사용자 요청에 따라 브라우저 캡처/화면 확인은 생략. 데이터 공간 검사와 빌드/문서 검사 결과는 아래에 기록한다.
- 검증 결과: 67점 모두 사용자 export bbox와 수집 OSM bbox 안에 포함. JSON 변환 및 node --check tests/world-browser.mjs 통과. npm run build 성공(기존 500kB 청크 경고), npm run test:docs 문서 30개·링크 74개 누락 없음. 브라우저 검사는 미실행.

## 3D 화면 표시선을 따른 부분 절단 (2026-11-12)

- 사용자가 최신 3D 지도에 열린 빨간 선으로 외곽을 표시했다. 아래쪽 기존 경계 유지 여부를 질문했고 사용자가 동의하여 왼쪽/위/오른쪽만 줄였다.
- `scripts/refine-hoenggye-boundary.mjs`: 제공 화면 1073×669px의 기존 외곽 실루엣을 이전 OSM export 외곽에 평면 투영 정합(원근/회전 포함, RMS 약 2.96px). 빨간 표시선을 역변환하고 양끝을 기존 경계에 연결했다. 원래 아래쪽 11개 점을 보존하고 밖으로 나가는 끝부분은 기존 외곽에 제한한다. 도로 기준점에 대한 초기 가정은 정합에 사용하지 않았으며 경계 실루엣만 사용한다.
- `data/raw/regions/hoenggye-screen-refinement.json`: 화면 외곽/빨간 선 픽셀, 투영 행렬, 정합 오차, 보존점 개수, 새 경계 70점 저장. 최초 export 픽셀 원본은 보존했다.
- `scripts/process-regions.py`, `public/maps/hoenggye-center.json`: 새 경계 입력으로 재변환. `tests/world-browser.mjs`의 기존 경계 전제를 새 메타데이터로 갱신했다.
- 결과: 건물 292개·도로 segment 300개·하천 8개·녹지 23개. 상세 아트나 OSM 원본은 바꾸지 않았다.
- 한계: 실제 카메라 행렬이 없는 이미지이므로 경계 실루엣과 수작업 픽셀에 근거한 투영 근사다. 사용자가 요청한 브라우저 캡처 생략을 지켰다.
- 검증: 원래 아래쪽 11점의 좌표 보존, 새 외곽 70점의 자기교차 없음, 전체 OSM bbox 내 포함을 데이터 검사로 확인했다. npm run build 성공(기존 청크 크기 경고), npm run test:docs 문서 30개·링크 74개 누락 없음. node --check tests/world-browser.mjs 성공. 브라우저 검사/캡처는 미실행.
