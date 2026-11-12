# 진부역 교체 GLB 적용

- 날짜: 2026-11-12
- 요청: 같은 파일 이름으로 교체된 진부역 에셋을 실제 화면에 반영.
- 계획: [진부역 에셋 갱신](../plans/2026-11-12-station-asset-refresh.md)

## 변경

- `public/models/jinbu-station.glb`가 앱에서 직접 로드되는 경로임을 확인했다. GLB는 glTF 2.0, 약 4.95MB, 364,011개 정점, PBR base-color/metallic-roughness/normal 텍스처를 포함한다.
- 사용자가 네모 대체 모델만 보인다고 알려 추가 확인했다. GLB는 `EXT_meshopt_compression`으로 메시 데이터를 압축했지만 `StationModel`의 `GLTFLoader`에 Meshopt 디코더가 등록되지 않아 로드가 실패하고, 로딩 실패 시 임시 박스가 표시되는 것이 원인이었다.
- `src/components/StationModel.tsx`: GLTFLoader가 가져온 원본 재질과 텍스처를 그대로 사용하도록 기존 단색 MeshStandardMaterial 덮어쓰기를 제거했다. 파일 내 모델이 이미 가진 전면 유리와 분할 표현 위에 다시 그리던 큰 유리판/멀리언 보강 메시도 제거했다. 모델 중심·바닥 정렬, OSM 외곽 기준 길이/폭 스케일, 회전 설정은 유지했다. 컴포넌트 정리 시 복수 재질도 각각 해제한다.
- 같은 파일에서 `MeshoptDecoder`를 GLTFLoader에 연결해 압축 메시를 읽도록 수정했다. 실패 상태 문구도 임시 모델이라고 오인시키지 않고 에셋 압축 형식 로드 실패를 알리도록 바꿨다.
- GLB 원본과 기존 OSM 정렬 설정은 덮어쓰거나 바꾸지 않았다.

## 검증 및 한계

- `scripts/inspect-glb.mjs`로 교체 파일의 메시/텍스처 및 accessor 정보를 확인했다.
- `npm run build` 성공 (Meshopt 디코더 연결 포함).
- 요청대로 브라우저 캡처/화면 검토는 생략했다. 런타임 시각 결과는 사용자가 화면에서 확인한다.
