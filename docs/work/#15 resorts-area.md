# 리조트권 기본 3D 맵과 바랑재

현재 경계는 아래의 **전체 외곽 과대 적용 수정**을 반영한 상태다. 최초 export bbox 직접 대응 방식과 당시 개수는 이력으로만 남긴다.

- 날짜: 2026-11-12
- 요청: 사용자 OSM 내보내기 범위와 빨간 표시선으로 리조트권을 만들고 올림픽로 1169 바랑재 추가.
- 계획: [리조트권](../plans/2026-11-12-resorts-area.md)

## 구현과 근거

- `data/raw/regions/resorts-user-export-boundary.json`: 전체 이미지 765×685px, bbox [128.55686,37.58458,128.82637,37.70094], 추적 픽셀 64점을 보존한다. 지도 전체가 내보내기 범위에 해당한다는 사용자 설명을 따르며 수작업 픽셀 오차가 있다.
- `scripts/fetch-resorts-outline.mjs`: OSM 단일 bbox 요청이 50,000 node 제한으로 실패해 9개 타일 순차 수집 후 node/way/relation ID로 병합했다. 타일별 원본·URL·취득 시각은 `data/raw/regions/resorts-tiles/`에 보존한다. 이전 원본은 `resorts-before-user-outline*`로 보존했다. 기존 fetch 스크립트의 리조트 갱신도 이 경로를 사용한다.
- `scripts/process-regions.py`, `public/maps/resorts-area.json`: Web Mercator 역변환 후 기존 로컬 미터 좌표로 3D 맵 생성. 건물 453개·도로 segment 741개·하천 33개·녹지 122개. 약 862KB 정적 파일이며 정상 앱 실행에는 외부 지리 API를 요청하지 않는다.
- `data/raw/regions/barangjae-official-location.html`, `barangjae-official-map.jsonp`: [바랑재 공식 오시는 길](https://barangjae.com/page/location)의 주소와 지도 마커를 보존했다. 공개 임베드 JSON의 WCONGNAMUL (863654.0000000562,1147390)을 /2.5 → EPSG:5181 → WGS84로 변환했다. 결과 37.61870697522239,128.6475731226246. [좌표계 근거](https://devtalk.kakao.com/t/topic/38086).
- `data/processed/barangjae-place.json`, `scripts/process-barangjae.mjs`: 주소·좌표·출처·취득 시각과 변환 방법을 보존한다. proj4는 `artifacts/geo-tools`에만 설치한 오프라인 가공 도구이며 앱 런타임 및 루트 의존성은 추가하지 않았다. Nominatim의 동명 타지역 결과는 원본만 남기고 미사용.
- `src/world/registry.ts`: 세 장소가 공유 기본 맵으로 직접 진입한다. 리조트권 overview bbox도 수집 범위와 일치한다.
- `src/world/BasicScene.tsx`: 공유 맵의 세 라벨을 각각 실제 좌표에 표시하고 클릭한 장소의 정보를 연다. 기존 진부·횡계 동작은 유지한다.
- `src/world/WorldOverview.tsx`: 맵 개수 안내를 실제 등록된 고유 3D 맵 수로 계산한다.

## 검증과 한계

- `python scripts/process-regions.py`: 정상 생성. 세 장소가 외곽 안에 포함되는지 좌표 검사 통과.
- `npm run build`: 성공. 기존 500KB 초과 청크 경고는 유지된다.
- 기존 world 검사에서 미제작 리조트 전제를 새 기본 맵 직접 진입으로 갱신한다. 사용자 선호에 따라 브라우저 캡처 및 긴 world 검사는 생략한다.
- 평탄 지면이며 DEM, 상세 스키 슬로프·스키하우스 모델, 시내형 사람/차량 애니메이션은 미적용. OSM 누락 설비를 임의 생성하지 않았다. 바랑재는 공식 주소 지도 마커이고 측량한 출입구 좌표는 아니다.

- 최종 검증: 세 장소 경계 내 포함, OSM bbox 내 전체 경계 포함, 새 경계 자기교차 없음 확인. npm run test:docs 문서 32개·링크 80개 누락 없음. node --check로 수정한 world 검사 및 지도 수집 스크립트 구문 검사 통과. 브라우저 검사는 미실행.

## 전체 외곽 과대 적용 수정 (2026-11-12)

- 사용자 피드백: 도암호는 예시이며 전체 경계가 표시선보다 넓었다.
- 원인: export bbox를 잘린 첨부 이미지 전체에 직접 대응해 동서/남북 축척과 위치를 잘못 설정했다. 수집 범위 안에 있다는 검사는 이미지 정합의 검증이 아니었다.
- 수정: raw 경계의 빨간 픽셀 64점과 원본 OSM bbox는 보존한다. 정상 기호 4점(투구봉359,133; 용산237,370; 발왕산382,632; 1220m 삼각점51,534)을 해당 OSM node의 실제 경도/Mercator 위도와 맞춰 회전 없는 동일 축척+평행이동을 최소제곱으로 구한다. north-up 이미지이므로 임의 회전/비등방 축척은 사용하지 않는다. 텍스트 라벨 대신 정상 기호를 기준으로 했다.
- `data/raw/regions/resorts-user-export-boundary.json`: node ID/픽셀 기준점을 추가. `scripts/process-regions.py`: 4점 정합과 RMS 4px 초과 시 오류 처리, calibratedImageBbox/기준점별 오차/실제 원본 좌표 메타데이터를 추가. `public/maps/resorts-area.json`: 결과를 재생성했다.
- RMS 약 1.45px (최대 약 2.25px). 유효 이미지 bbox는 약 [128.605924,37.600122,128.736386,37.692619]다. 최초 export bbox는 더 넓은 데이터 취득 범위로 보존한다.
- 결과: 건물 151개·도로 segment 369개·하천 22개·녹지 81개. 전체 외곽을 수정했으며 특정 호수만 제거한 것이 아니다. 도암호 way/37220223는 제외되었고 세 장소가 경계 안인지 확인했다.
- 한계: 정상 기호의 픽셀 위치는 수작업 추적이므로 작은 위치 오차는 남는다. 캡처 검토는 기존 요청에 따라 생략한다.
- 후속 검증 결과: 정상 4점 RMS 1.4483px, 세 장소 포함, 도암호의 원본 외곽 정점 모두 새 경계 밖, 빨간 선 64점 유지 확인. npm run build 성공(기존 청크 경고), npm run test:docs 문서 32개·링크 80개 누락 없음. 브라우저 캡처/화면 검사는 미실행.
