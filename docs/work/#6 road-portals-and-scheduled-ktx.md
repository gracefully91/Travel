# 도로 포털과 공식 시간표 기반 KTX-산천 시각화

- 작업 번호: #6
- 날짜: 2026-11-12
- 상태: 완료
- 관련 계획: [맵 연결·KTX 계획](../plans/2026-11-12-scene-links-and-ktx.md)

## 요청과 완료 조건

실제 시내 방향 연결 도로에 다음 3D 맵으로 이동하는 표지를 둔다. 제공 KTX-Sancheon.glb를 실제 계획 시간표/요일/방향에 맞춰 표시하고, 열차 지나가기 버튼은 시간과 무관한 강릉 방면 데모로 한다. 사용자 지정 문서 체계를 적용하고 기존 작업도 기록한다.

## 원인 또는 결정 배경

- 기존 이동은 구역 개요 화면을 거쳐야 했다. 실제 OSRM 자동차 경로가 작은 맵 경계를 지나는 곳을 OSM 중심선에 스냅해 표지를 배치했다. 진부역 쪽은 송정길 way/548304660, 시내 쪽은 경강로 way/995805460이다.
- 기존 열차는 역 밖의 짧은 way/545414812 조각만 사용해 역 관통을 보장하지 못했다. 본선의 연결된 여러 way를 방향별로 이어 실제 역을 지나는 경로로 바꿨다.
- 모델은 Draco 압축이라 로컬 WASM 디코더를 추가했다. 반복 고밀도 부품은 원본 변경 없이 표시 최적화했다.
- 코레일의 2026-11-01 시행 공식 XLSX를 확보해 로컬 시간표로 사용한다. API 키나 매 프레임 서버 요청이 필요하지 않다.

## 변경 내용

| 파일/경로 | 결과 |
| --- | --- |
| src/App.tsx | 포털의 목적지 이동을 기존 안내/로딩으로 연결. preview 토큰과 활성 scene 토큰을 분리해 안내를 열어도 현재 맵이 재마운트되지 않도록 수정. Escape/취소는 현재 맵 유지 |
| src/world/ScenePortals.tsx, BasicScene.tsx, TravelGate.tsx, world.css | 역↔시내 도로 위 표지와 왕복. 알려진 자동차/택시 경로는 저장 자료로 안내 |
| data/raw/connections, data/processed/scene-connections.json | 두 방향의 실제 OSRM 원본과 OSM 도로상의 배치 좌표/출처 보존 |
| src/components/TrainModel.tsx, ScheduledTrains.tsx, RailStatus.tsx | 실제 GLB 로드·크기/진행축 보정, 양방향 본선 운행, 수동 강릉 데모, 일시정지, 모델 실패 경계와 시간표 상태 |
| src/lib/railPaths.ts, railSchedule.ts, src/data/railTimetable.ts | OSM 본선 연결, KST/요일/자정/검토기한 계산. 방향별 하나의 표시 객체로 중복 생성 방지 |
| src/components/LivingCity.tsx, Scene3D.tsx, src/StationExperience.tsx, src/style.css | 기존 임시 열차 제거, 실제 모델/자동 운행 연결, 진단/에러/모바일 배치 |
| public/decoders/draco | 로컬 WASM 디코더와 설명. 사용자 모델과 업로드 원본은 보존 |
| data/raw/rail, data/processed/jinbu-train-timetable.json | 공식 워크북/게시판/해시·출처·시행/확인일과 32개 진부 정차 운행 항목. 미정차 34개는 통과 시각 추정 없이 제외 |
| scripts/fetch-rail-timetable.py, process-rail-timetable.py, fetch-scene-connections.py | 수집·변환 재현 명령. 해시/시트/열/요일/방향 검증. 원본 양식 변화 시 오류 |
| TRAINS_AND_PORTALS.md, README.md, MAPS.md, AGENTS.md, BRAIN.md, docs | 사용·출처·한계·갱신과 전체 협업/회고 문서 체계 |

## 검증

실행 위치 C:/dev/@Travel. Node 24.14.1, Python 3.14, Edge headless software WebGL. 원격 게시·배포는 하지 않았다.

| 명령/확인 | 결과 |
| --- | --- |
| npm run build | 통과. Three.js 공유 청크 크기 경고는 남아 있음 |
| python scripts/fetch-rail-timetable.py | 통과. 코레일 최신 KTX 시간표·출처 메타데이터 확보 |
| python scripts/process-rail-timetable.py | 통과. 해시/시트/열 검증, 32개 진부 정차 항목과 미정차 34개 제외 |
| npm run test:rail | 7개 통과: KST/요일/양방향/자정/검토기한/미정차 제외 |
| npm run test:portals-trains | 19개 통과: 실제 압축 GLB와 로컬 Draco, 크기/최적화, 양방향 실제 이동, 수동/정지, 포털 왕복/취소/Canvas 보존, 모바일 배치/클릭, 에셋 오류 없음 |
| npm test | 기존 29개 통과. 도로 OSM 방향/우측 차선, 사람/차량/열차, 카메라/장소/모바일, 콘솔 오류 없음 |
| 스크린샷 육안 확인 | ktx-gangneung.png, station-city-portal.png, city-station-portal.png, portal-train-mobile.png를 확인 |
| 문서 링크/상태 검사 | 통과. scripts/check-doc-links.mjs에서 상대 링크와 #1~#6 고유 번호를 확인 |

브라우저 시간표 검사는 시계를 고정/변경해 실제 일정 분기와 이동을 검증했다. 실제 현장의 열차 도착·지연이나 모든 모바일 GPU 성능을 측정한 것은 아니다. 보고서는 ../../artifacts/portals-trains-report.json과 ../../artifacts/test-report.json.

## 검증 중 발견한 문제와 해결

초기 GLB 분석은 Draco 디코더가 없는 로더로 실패했다. 로컬 WASM 디코더를 연결하고 브라우저에서 실제 압축 파일의 크기/메시/동작을 확인했다. 브라우저 시계를 고정한 포털 검사에서는 performance 리소스 목록으로 모듈 URL을 찾지 못해 검사 도우미가 실패했다. 실제 관측한 요청 URL을 사용하도록 바꾼 뒤 왕복/모바일까지 19개 검사를 통과했다. 실패를 정상 결과로 취급하거나 UI 동작을 생략하지 않았다.

## 남은 한계와 재개 지점

- 계획 시각에 맞춘 통과 애니메이션이며 실제 위치·지연·정차 재현이 아니다. 현재 공개 시간표의 KTX-이음도 사용자가 제공한 산천 모델로 대표 표시한다.
- 승강장/착발선 배정, 공휴일 특별 운행, 미정차 편의 통과 시각은 확인되지 않았다.
- 확인 후 30일 검토 정책(2026-12-12 이후 자동 표시 중지)은 앱 기준이며 공식 만료일이 아니다. 수집/변환 명령으로 최신 자료를 확인해 갱신한다. 자동 갱신 스케줄러는 만들지 않았다.
- trainAlignment에서 폭 2.91m·레일 상단 0.48m·축을 보정한다. 모델의 작은 고밀도 부품 124개를 제외하고 121개 그룹, 약 59만 삼각형을 표시한다. 원본 미니어처 표현이며 저사양 기기 추가 LOD는 후속 과제다.
- 시내·리조트 상세 건축/DEM, 버스 확정 시간표 등 기존 미완료 범위는 이번 작업에 포함하지 않았다.

## 문서 반영

- 작업 인덱스: #6 연결
- 관련 계획: 완료로 갱신
- BRAIN: 기능·검증 완료 및 로컬 열차/일정 TAGO 데이터 경계와 미확보 사항 반영
