# 원형 마커와 장소 클릭으로 3D 맵 직접 입장

- 작업 번호: #9
- 날짜: 2026-11-12
- 상태: 완료
- 관련 계획: [직접 입장](../plans/2026-11-12-direct-scene-entry.md)

## 요청과 완료 조건

YOUR NEXT LITTLE WORLD 이동 안내/확인창을 표시하지 않고 바로 3D 맵을 연다. 구역 지도 위 원형 장소 마커를 눌러도 같은 동작을 한다. 실제 에셋 로딩과 취소/실패 처리는 유지한다.

## 변경 배경과 내용

기존 마커는 장소 선택만 했고, 입장/도로 표지는 preview→확인→loading 단계를 요구했다. 직접 로딩으로 단일 경로를 사용하도록 바꿨다.

| 파일 | 변경 내용 |
| --- | --- |
| src/App.tsx | preview/확인 단계를 제거. 준비된 목적지 클릭 즉시 활성 맵/토큰/로딩 상태 설정. 취소/늦은 응답 무효화와 1개 Canvas 유지 |
| src/world/WorldOverview.tsx | 원형 마커·키보드 Enter/Space·장소 목록 직접 입장. 입장 버튼도 같은 경로. 미제작 장소는 정보 선택만 유지 |
| src/world/MapLoading.tsx | 기존 실제 에셋 로딩·취소·실패 화면만 분리 유지 |
| src/world/TravelGate.tsx, world.css | 확인창 컴포넌트 및 전용 스타일 제거. 입장 때 안내용 경로/운임 API 요청도 제거 |
| tests/world-browser.mjs | 마커 클릭·Enter/Space·모바일 탭·세 실제 맵·취소 후 늦은 응답·단일 Canvas·준비 중·불필요 API 미요청·일정 연결 검사 |
| tests/portals-trains-browser.mjs | 도로 포털의 직접 왕복과 모바일 직접 입장 검사로 갱신. 열차 검사 유지 |
| tests/browser.mjs, jitter-browser.mjs, traffic-handedness.mjs, train-journey-browser.mjs | 기존 입장 도우미에서 제거된 확인 버튼 단계를 삭제 |
| MAPS.md, TRAINS_AND_PORTALS.md, README.md, BRAIN.md, docs/plans | 현재 직접 입장 동작과 이전 결정의 대체 관계 반영 |

## 검증

| 명령/환경 | 결과 |
| --- | --- |
| npm run build | 통과. 기존 큰 공유 청크 경고 유지 |
| npm run test:world / Edge headless software WebGL | 19개 통과. 데스크톱 클릭/키보드, 실제 모바일 터치, 로딩 취소/지연 응답, 세 맵, 1개 Canvas, 미제작 지역, 경로 API 미요청 및 콘솔 오류 없음 |
| npm run test:portals-trains | 17개 통과: 기존 열차 동작과 직접 포털 왕복·모바일·에셋 오류 없음 |
| 전체 tests/*.mjs의 node --check | 구문 검사 통과. 변경되지 않은 모든 동작 검사를 재실행했다는 뜻은 아님 |
| npm run test:docs | 상대 링크 및 #1~#9 고유 작업 번호 검사 통과 |

포털 회귀의 최초 실행은 모바일에서 CSS로 숨긴 .basic-data의 표시를 기다려 검사 도우미가 실패했다. 실제 맵 준비 완료를 검증하도록 DOM 연결 상태와 로딩 종료를 기다리는 방식으로 수정했다. 데이터 패널을 억지로 노출하거나 임의 시간을 기다리게 하지 않았다.

## 남은 한계와 문서 반영

로딩은 실제 데이터/모델이 필요하므로 유지한다. 미제작 리조트는 여전히 입장할 수 없다. 일정 만들기는 별도 메뉴에 유지되고 맵 전환으로 일정 시각을 변경하지 않는다. 이 변경에서 전체 일정 계산/DB/열차 시간 계산을 다시 수정하지 않았다. 마지막으로 둘러본 장소는 참고 표시로만 유지한다.

- 작업 인덱스: #9 연결
- 관련 계획/BRAIN: 직접 입장과 검증 완료 상태 반영
- 이전 계획: 중간 이동 안내는 직접 입장 계획으로 대체했음을 명시
