# 모바일 진부역 GLB 검은색 표시 수정

- 날짜: 2026-11-12
- 요청 목적: 공개 모바일 화면에서 진부역 모델이 검은색으로 렌더링되는 현상 수정.
- 원인: 모델의 단일 glTF PBR 재질은 metallic-roughness 텍스처를 사용한다. 장면에 환경 반사 맵이 없어 높은 금속 반응이 있는 표면에서 충분한 반사광을 얻지 못하고 검게 렌더링됐다. GLB 로드는 성공했고 메시와 텍스처 자체는 존재했다.
- 계획: [진부역 GLB 모바일 재질 표시 수정](../plans/2026-11-12-station-mobile-material.md)

## 변경

- `src/components/StationModel.tsx`: 모델의 MeshStandardMaterial에서 기존 base-color, normal, metallic-roughness 텍스처는 그대로 두고, 화면 재질의 금속도를 최대 `0.08`, 거칠기를 최소 `0.72`로 제한했다. 금속 표면을 반사 환경 없이 렌더링할 때 어두워지는 원인을 화면용 재질 설정에서 해결했다.
- 원본 `public/models/jinbu-station.glb`, 텍스처 및 정렬/스케일 데이터는 수정하지 않았다.

## 검증 및 한계

- `npm run build`: 성공.
- `npm run test`: 중간 브라우저 단계에서 기존 `Traveler and cars animate` 검사 실패로 종료했다. GLB 로드와 렌더링은 진행됐으며 해당 검사 단계 이전에 브라우저 예외/리소스 오류가 보고되지 않았다. 전체 브라우저 회귀는 통과하지 않았다.
- 같은 테스트가 생성한 브라우저 캡처를 확인했다. 역 지붕/외벽이 검정 실루엣 대신 회색으로 렌더링되는 것을 확인했다.
- 모바일 실기기에서 재검증하지는 않았다. Edge 소프트웨어 WebGL 브라우저 검증만 수행했다.
