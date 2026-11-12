# 진부 시내 불규칙 경계 3D 맵

- 작업 번호: #10
- 날짜: 2026-11-12
- 상태: 완료
- 관련 계획: [진부 시내 맵](../plans/2026-11-12-jinbu-city-map.md)

## 요청과 결정

사용자가 표시한 진부 시내 빨간 경계 안을 작은 3D 맵으로 만들기로 했다. 맵은 정사각형 타일일 필요가 없으므로, 기존 저장 OSM 자료로 도로·건물·하천을 만들고 지면을 불규칙 다각형으로 구성했다. 사용자가 그린 경계는 화면으로부터 근사한 탐험 영역이며 공식 행정선이나 측량 결과로 표기하지 않는다.

## 변경 내용

| 파일 | 변경 내용 |
| --- | --- |
| scripts/process-regions.py | jinbu-town용 18점 근사 경계를 추가. 원본 OSM 좌표를 기존 BIS 터미널 중심의 동/북 미터 좌표로 변환하고, 선형 지형은 다각형 경계에서 자른 뒤 분리된 segment로 내보냄. 건물·면적은 경계 안의 도형만 선택. |
| public/maps/jinbu-town.json | 기존 225m 원형 주변 기본 맵을 불규칙 시내 맵으로 재생성. OSM 건물 182개와 도로·수로·철도·녹지 feature를 포함. 고도 없는 평탄 지면과 추정 경계 가정을 저장. |
| src/world/registry.ts | 장소 표시 설명을 진부 시내/하천 범위에 맞춰 갱신하고 OSM 원본 출처를 연결. 기존 좌표와 장소 ID는 유지. |
| src/world/BasicScene.tsx | 불규칙 다각형 지면을 렌더링하고 맵 extent에 맞춰 초기 카메라, 줌, shadow camera, clipping planes를 조정. 큰 녹지/도로의 깊이 충돌을 줄이도록 표면 높이를 분리. |
| src/world/ScenePortals.tsx | 역에서 연결되는 표지에 진부 시내 맵 목적지를 표시. 연결 도로와 양방향 장소 ID는 유지. |
| tests/world-browser.mjs, tests/portals-trains-browser.mjs | 고정 51개 대신 변환 맵의 실제 건물 수를 확인하고 불규칙 경계·큰 extent·하천 데이터와 포털을 확인. 시내 맵 스크린샷 추가. |
| MAPS.md, BRAIN.md, docs/plans, docs/work/summary-index.md | 지도 범위·출처·경계의 근사 성격과 완료 상태를 반영. |

## 검증

| 명령/방법 | 결과 |
| --- | --- |
| `python scripts/process-regions.py` | 통과. `jinbu-town`: OSM 건물 182개, 18점 경계 및 도로/수로 분할 생성. 기존 횡계 데이터도 다시 생성. |
| `npm run test:world` | 통과, 20개 검사. 마커/키보드/모바일 입장, 맵 데이터, 로딩 취소, 단일 Canvas, planner, 브라우저 오류 없음. |
| `npm run test:portals-trains` | 통과, 17개 검사. 진부역→시내·시내→역 포털, 모바일 전환 및 기존 KTX GLB/시간표 동작. |
| `npm run build` | 통과. Three.js 공유 chunk 500KB 초과 경고와 Node SQLite 실험 경고는 기존과 동일. |
| 브라우저 스크린샷 | `artifacts/jinbu-city-map.png`에서 불규칙 지면, 실제 도로망·건물·하천 배치를 확인. |

## 남은 한계

경계는 사용자가 제공한 이미지 외곽을 지리상 대략 배치한 앱 전용 탐험 범위다. 이미지에 표시된 선의 실제 위경도를 정밀 측량한 것은 아니다. OSM 누락/관계형 다각형 단순화가 있을 수 있고, DEM·건물 높이 검증·상점 외관은 없다. 차와 보행자 애니메이션은 역 맵에서만 동작한다. 원본 OSM은 `data/raw/regions/jinbu.osm`, 데이터 변환 코드는 `scripts/process-regions.py`, 변환 결과는 `public/maps/jinbu-town.json`에 있다.
