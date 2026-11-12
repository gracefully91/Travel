# 진부역 GLB 모바일 재질 표시 수정

- 날짜: 2026-11-12
- 상태: 완료
- 작업 기록: [#18](../work/%2318%20station-mobile-material.md)

## 목표

GitHub Pages의 모바일 화면에서 검게 보이는 진부역 GLB를 기존 텍스처를 보존하면서 밝게 표시한다.

## 원인과 결정

GLB의 POSITION/NORMAL 데이터는 정상인데 로더에서 `computeVertexNormals()`를 호출해 제작자가 저장한 노멀을 덮어쓰고 있었다. 이로 인해 표면 방향별 조명 계산이 깨져 검게 보였다. 노멀을 다시 계산하지 않고 원본 PBR 재질을 사용한다. GLB와 압축 데이터는 변경하지 않는다.

## 완료 조건

- GLB의 base-color/normal/metallic-roughness 텍스처를 유지한다.
- GLB 제작 노멀과 원본 PBR 재질을 유지한다.
- 프로덕션 빌드와 모바일/데스크톱 브라우저 렌더에서 역사 표면이 정상 표시되는지 확인한다.
