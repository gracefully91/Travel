# 진부 시내 맵 Z-fighting 수정

- 날짜: 2026-11-12
- 요청 목적: 진부 터미널 거리 3D 맵의 도로 줄무늬와 화면 떨림 수정.
- 원인/결정 배경: 데이터의 지리적 Z 반전보다 km급 맵에서 겹치는 도로 띠와 도로 교차점이 동일 평면을 공유하고, 넓은 저해상도 directional shadow map을 받는 렌더링 구성이 원인으로 판단됐다. 정지 상태 카메라를 두 번 캡처한 픽셀은 동일했으며, 사용자가 수정 후 화면이 안정됐다고 확인했다.
- 변경 파일:
  - `src/components/Geometry.tsx`: Strip/Polygon에 `depthWrite`, `receiveShadow`, `renderOrder` 선택값을 추가하고 기존 기본값은 유지.
  - `src/world/BasicScene.tsx`: 시내 맵 평면 오버레이에서 shadow receive/depth write를 끄고, 도로 어깨·노면·중앙선의 높이와 그리기 순서를 분리. km급 맵 카메라 near 평면도 맵 크기에 맞게 조정.
  - `tests/world-browser.mjs`: 시내 캔버스 정지 프레임 픽셀 동일성, 오버레이 깊이·그림자 정책 검사 추가.
  - 관련 계획·BRAIN·작업 인덱스 갱신.
- 검증:
  - `npm run build`: 성공. 번들 500kB 초과 경고는 기존과 동일하며 빌드는 완료.
  - `npm run test:world`: 27개 검사 통과. 정지 프레임 픽셀 동일성, 오버레이 설정, 모바일 레이아웃, 브라우저 오류 없음 포함.
  - 사용자 화면 확인: 사용자가 “고쳐졌다”고 확인.
- 남은 한계: 지형/OSM 좌표는 그대로이며 정지 프레임 테스트는 실제 기기 GPU 전체의 성능·시각 품질을 대체하지 않는다.
- 인접 기능 상태: 진부역 GLB 씬에만 사람·차량 애니메이션이 연결되어 있다. 진부 시내·횡계 기본 씬은 현재 정적 OSM 맵이다.
- 관련 계획: [진부 시내 맵 Z-fighting 수정](../plans/2026-11-12-town-map-z-fighting.md)
