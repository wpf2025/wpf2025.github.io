# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2] - 2025-10-23

### Added
- **개요 페이지 오늘 기상예보**: 10일 기상예측 데이터를 활용한 24시간 상세 예보
  - 날짜 및 평균 풍속 표시
  - 24시간 타임라인 색상 바 (풍속 기반: 녹색/주황/빨강)
  - 풍속, 기온, 강수량, 파고, 낙뢰 범위 정보
  - `initTodayWeather()` 함수로 자동 초기화

### Fixed
- **알림 배지 위치 수정**: 종 아이콘 우측 상단에 정확히 배치
  - 버튼 구조 수정 (배지를 버튼 내부로 이동)
  - 언어 전환 버튼 분리
- **기상예측 테이블 가독성 개선**: sticky-col 열 너비 증가 (150px → 180px)
  - "평균풍속 (<15m/s)" 텍스트 줄바꿈 방지
- **타임라인 바 렌더링 개선**: GitHub Pages 배포 환경에서 정상 표시
  - 타임라인 요소 존재 확인 추가
  - 세그먼트에 명시적 높이(100%) 설정
  - 타임라인 컨테이너에 배경색 추가

### Changed
- **데이터 범위 최적화**:
  - 기온 범위: 10-25°C → 15-22°C (더 현실적인 범위)
  - 강수량 범위: 0-5mm → 0-2mm (총 강수량 감소)

### Technical Details
- `index.html`: 개요 페이지 기상 카드 구조 변경, 알림 버튼 HTML 수정, 타임라인 배경색 추가
- `scripts.js`: `initTodayWeather()` 함수 추가, 데이터 생성 범위 조정, 타임라인 렌더링 개선
- `styles.css`: `.weather-table-modern .sticky-col` 너비 조정 (2곳)

---

## [1.3.1] - 2025-10-23

### Changed
- **탭 스타일 일관성 통일**: 메인 탭과 서브 탭의 시각적 패턴 통일
  - 활성 탭: 파란색 하단 보더(3px) + 연한 파란색 배경
  - 호버 효과: 회색 배경 + 파란색 텍스트
  - 보더 두께 2px → 3px로 증가하여 가시성 향상
  - 부드러운 전환 애니메이션 추가

### Technical Details
- `styles.css`: 탭 버튼 스타일 통합 및 호버 효과 추가
- 모든 탭(단기예측, 중기예측의 메인/서브 탭)에 일관된 스타일 적용

---

## [1.3.0] - 2025-10-23

### Added
- **다국어 지원**: 한국어/영어 전환 기능
  - 헤더에 언어 전환 버튼 추가
  - localStorage 기반 언어 설정 저장
  - 사이드바 및 기상예측 페이지 번역
  - 동적 콘텐츠 번역 지원

### Changed
- **코드 구조 개선**: CSS/JS 파일 분리
  - `index.html` 크기 66% 감소 (214K → 73K)
  - `styles.css` (13K) 분리
  - `scripts.js` (128K) 분리
  - 브라우저 캐싱 효율 증가
  
- **90일 Charts 모드 구현**:
  - 4열 월별 캘린더 그리드
  - 90일 상세 테이블 뷰
  - 월별 날짜 정렬 및 빈 칸 처리

- **UI/UX 개선**:
  - 10일 기상 개요 텍스트 중앙 정렬
  - 타임라인 높이 축소 (40px → 20px)
  - 파스텔톤 색상 적용 (눈의 피로도 감소)
  - 진한 텍스트로 가독성 개선
  - 그라데이션 및 그림자 효과 추가

### Technical Details
- 외부 CSS/JS 파일 로딩 구조 변경
- 번역 시스템 구현 (`translations` 객체)
- `switchLanguage()` 함수로 동적 언어 전환
- 기상예측 렌더링 함수에 다국어 지원 추가

---

## [1.2.0] - 2025-10-23

### Added
- **기상예측 페이지**: SGRE MyWeather&Energy 스타일 기반
  - 10일 예측 (1시간 단위): 240시간 상세 예보
  - 90일 예측 (1일 단위): 10일 간격 9개 기간
  - List/Charts 모드 전환
  - 아코디언 타임라인 + 상세 테이블
  - 종합 상태 평가 시스템

- **시각적 인디케이터**:
  - 타임라인 색상 바 (녹색/주황/빨강)
  - 원형 인디케이터 (기준 충족/미충족)
  - 기상 변수별 색상 코딩

### Changed
- **기상 변수 확장**:
  - 풍속, 기온(최고/최저), 강수량, 상대습도, 파고, 낙뢰확률, 신뢰도
  
- **평가 기준 정의**:
  - 풍속: < 15m/s (양호), < 20m/s (주의), ≥ 20m/s (위험)
  - 최고기온: < 30°C (양호), < 35°C (주의), ≥ 35°C (위험)
  - 최저기온: > 10°C (양호), > 5°C (주의), ≤ 5°C (위험)
  - 강수량: < 10mm (양호), < 20mm (주의), ≥ 20mm (위험)
  - 파고: < 1m (양호), < 1.5m (주의), ≥ 1.5m (위험)

### Technical Details
- `render10DaysList()`, `render90DaysList()` 함수 구현
- `render10DaysCharts()`, `render90DaysCharts()` 함수 구현
- `getOverallDailyStatus()` 종합 평가 함수
- `toggleWeatherAccordion()` 아코디언 토글 함수
- 최신형 UI 스타일 (그라데이션, 그림자, 호버 애니메이션)

---

## [1.1.0] - 2025-07-25

### Added
- **Box-and-whisker Plot**: 기상 데이터 통계적 분포 시각화
  - 풍속, 기온, 파고의 5분위수 표시
  - 주차별 클릭 시 상세 분포 정보 모달
  
### Changed
- **장기예측 개선**: 3개월 예측으로 집중
  - 1개월/6개월 예측 제거
  - 다양한 기상 시나리오 표현
  - 색상 코딩 시스템 (도넛 차트 최고 확률 구간과 박스플롯 색상 연동)

### Technical Details
- Chart.js `@sgratzl/chartjs-chart-boxplot` 플러그인 추가
- `generateBoxplotData()` 함수 구현
- 기상 변수별 케이스 정의 (약풍~강풍, 저파고~고파고)

---

## [1.0.0] - 2025

### Added
- **초기 버전 릴리스**
  - 단기(~3일) 예측: 72시간 시간별 상세 예측
  - 중기(2주) 예측: 주간/일간 발전량 예측
  - 장기(3개월) 예측: 월간/주간 발전량 및 기상 예측
  
- **발전소 전체 예측**: 통합 발전량 분석
- **터빈별 예측**: 개별 터빈(WTG #1~#5) 성능 분석
- **정비 스케줄 최적화**: 예측 기반 정비 계획 수립

- **반응형 대시보드**:
  - Chart.js 기반 인터랙티브 차트
  - Tailwind CSS 프레임워크
  - 모바일/태블릿/데스크톱 지원

### Technical Details
- HTML5 시맨틱 마크업
- Vanilla JavaScript (ES6+)
- Chart.js 데이터 시각화
- Font Awesome 아이콘
- GitHub Pages 호스팅

---

## Legend

- `Added`: 새로운 기능
- `Changed`: 기존 기능 변경
- `Deprecated`: 곧 제거될 기능
- `Removed`: 제거된 기능
- `Fixed`: 버그 수정
- `Security`: 보안 관련 수정
