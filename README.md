# 풍력 발전량 예측 시스템 (Wind Power Forecasting System)

## 📋 프로젝트 개요

풍력 발전소의 발전량을 다양한 시간 범위(단기~장기)에 걸쳐 예측하고 분석할 수 있는 웹 기반 대시보드 시스템입니다. 실시간 데이터 시각화와 예측 분석을 통해 풍력 발전소 운영 최적화를 지원합니다.

## 🚀 주요 기능

### 📊 다중 시간대 예측
- **단기(~3일) 예측**: 72시간 시간별 상세 예측
- **중기(2주) 예측**: 주간/일간 발전량 예측
- **장기(3개월) 예측**: 월간/주간 발전량 및 기상 예측

### 🎯 예측 범위
- **발전소 전체 예측**: 통합 발전량 분석
- **터빈별 예측**: 개별 터빈(WTG #1~#5) 성능 분석
- **정비 스케줄 최적화**: 예측 기반 정비 계획 수립
- **기상 예측 분석**: Box-and-whisker plot 기반 기상 변수 분포 분석

### 📈 시각화 기능
- **실시간 대시보드**: Chart.js 기반 인터랙티브 차트
- **Box-and-whisker Plot**: 기상 데이터의 통계적 분포 시각화
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **다양한 차트 타입**: 선형, 막대, 영역, 박스플롯 차트 등

## 🛠 기술 스택

### Frontend
- **HTML5**: 시맨틱 마크업
- **CSS3**: Tailwind CSS 프레임워크
- **JavaScript (ES6+)**: 바닐라 JavaScript
- **Chart.js**: 데이터 시각화 라이브러리
- **@sgratzl/chartjs-chart-boxplot**: Box-and-whisker plot 플러그인
- **Font Awesome**: 아이콘 라이브러리

### 호스팅
- **GitHub Pages**: 정적 웹사이트 호스팅

## 📁 프로젝트 구조

```
wpf2025.github.io/
├── index.html              # 메인 애플리케이션 파일
├── README.md               # 프로젝트 문서
└── assets/                 # 정적 자원 (이미지, 아이콘 등)
```

## 🎨 UI/UX 특징

### 레이아웃
- **사이드바 네비게이션**: 직관적인 메뉴 구조
- **탭 기반 인터페이스**: 효율적인 정보 구성
- **카드 기반 디자인**: 모듈화된 정보 표시

### 색상 테마
- **주색상**: 파란색 계열 (신뢰성, 전문성)
- **보조색상**: 녹색, 주황색 (상태 표시)
- **경고색상**: 노란색, 빨간색 (주의사항)

## 📱 반응형 디자인

### 브레이크포인트
- **모바일**: < 768px
- **태블릿**: 768px ~ 1024px
- **데스크톱**: > 1024px

### 적응형 기능
- 그리드 레이아웃 자동 조정
- 차트 크기 반응형 조정
- 터치 친화적 인터페이스

## 🔧 설치 및 실행

### 로컬 개발 환경

1. **저장소 클론**
```bash
git clone https://github.com/username/wpf2025.github.io.git
cd wpf2025.github.io
```

2. **로컬 서버 실행**
```bash
# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000

# Node.js (http-server 패키지 필요)
npx http-server

# Live Server (VS Code 확장)
# Live Server 확장 설치 후 index.html 우클릭 → "Open with Live Server"
```

3. **브라우저에서 접속**
```
http://localhost:8000
```

### GitHub Pages 배포

1. **GitHub 저장소 설정**
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)

2. **자동 배포**
   - main 브랜치에 푸시 시 자동 배포
   - 배포 URL: `https://username.github.io/wpf2025.github.io`

## 📊 데이터 구조

### 예측 데이터 형식
```javascript
// 단기 예측 데이터 예시
{
  "shortterm": {
    "total": {
      "daily": [5.2, 4.8, 5.5],  // GWh
      "hourly": [132, 145, ...]   // MW
    },
    "turbines": {
      "wtg1": {
        "daily": [1.1, 0.9, 1.2],
        "hourly": [25, 28, ...]
      }
    }
  }
}
```

### Box Plot 데이터 형식
```javascript
// 기상 예측 Box Plot 데이터 예시
{
  "min": 3.2,     // 최솟값
  "q1": 6.8,      // 1사분위수
  "median": 9.1,  // 중앙값
  "q3": 12.4,     // 3사분위수
  "max": 15.7     // 최댓값
}
```

## 🎯 주요 페이지 구성

### 1. 개요 (Overview)
- 실시간 발전 현황
- 최근 7일 발전량 트렌드
- 시간대별 발전 패턴

### 2. 단기(~3일) 예측
- **발전소 전체**: 일평균 + 시간별 통합 페이지
- **터빈별 예측**: 일평균/시간별 서브탭

### 3. 중기(2주) 예측
- **발전소 전체**: 주평균 + 일평균 통합 페이지
- **터빈별 예측**: 개별 터빈 성능 분석
- **정비 스케줄 최적화**: AI 기반 정비 계획

### 4. 장기(3개월) 예측
- **발전량 예측**: 월간/주간 발전량 트렌드 분석
- **기상 예측**: Box-and-whisker plot 기반 풍속, 기온, 파고 분포
- **상세 기상 정보**: 주차별 클릭 시 상세 기상 분포 모달
- **다양한 기상 시나리오**: 약풍~강풍, 저파고~고파고 등 다양한 케이스

### 5. 상세 정보
- 시스템 정보
- 데이터 소스
- 예측 모델 설명

## 🔍 기능 상세

### 차트 기능
- **확대/축소**: 마우스 휠 또는 터치 제스처
- **데이터 포인트 호버**: 상세 정보 툴팁
- **범례 토글**: 데이터 시리즈 표시/숨김
- **Box-and-whisker Plot**: 통계적 분포 시각화 (min, Q1, median, Q3, max)
- **인터랙티브 모달**: 기상 차트 클릭 시 상세 정보 표시
- **반응형 크기 조정**: 화면 크기에 따른 자동 조정

### 탭 네비게이션
- **키보드 접근성**: Tab, Enter, Arrow 키 지원
- **ARIA 라벨**: 스크린 리더 지원
- **상태 관리**: 활성 탭 상태 유지

### 데이터 업데이트
- **실시간 시뮬레이션**: 랜덤 데이터 생성
- **차트 애니메이션**: 부드러운 데이터 전환
- **성능 최적화**: 차트 재사용 및 메모리 관리

## 🎨 커스터마이징

### 색상 테마 변경
```css
/* CSS 변수 수정 */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
}
```

### 차트 설정 수정
```javascript
// 차트 옵션 커스터마이징
const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: true },
    tooltip: { enabled: true }
  },
  scales: {
    y: { beginAtZero: true }
  }
};
```

## 🌦️ 기상 예측 시스템

### Box-and-whisker Plot 특징
- **통계적 분포 표현**: 각 주차별 기상 변수의 5분위수 표시
- **다양한 시나리오**: 약풍~강풍, 저파고~고파고 등 현실적인 기상 조건
- **색상 코딩**: 도넛 차트의 최고 확률 구간과 연동된 직관적 색상
- **인터랙티브**: 주차별 클릭 시 상세 기상 분포 정보 모달 표시

### 기상 변수별 케이스
**풍속:**
- 매우 약풍 (0-3 m/s) - 빨간색: 발전 불가
- 약풍 (3-6 m/s) - 주황색: 저발전
- 중간풍 (6-12 m/s) - 녹색: 최적 발전
- 강풍 (12-18 m/s) - 파란색: 정격 출력
- 매우 강풍 (15-22 m/s) - 보라색: 고출력/위험

**파고:**
- 매우 낮음 (0.1-0.4m) - 연한 녹색: 매우 안전
- 낮음 (0.3-0.7m) - 녹색: 안전
- 보통 (0.8-1.3m) - 주황색: 일반적
- 높음 (1.4-2.2m) - 빨간색: 작업 제한
- 매우 높음 (2.0-3.2m) - 진한 빨간색: 작업 금지

## 🔧 개발 가이드

### 새로운 예측 모듈 추가

1. **HTML 구조 추가**
```html
<section id="new-forecast-content" class="content-section hidden">
  <h2 class="section-title">새로운 예측</h2>
  <!-- 내용 추가 -->
</section>
```

2. **JavaScript 차트 초기화**
```javascript
if (document.getElementById('new-forecast-content')?.offsetParent !== null) {
  charts.newForecastChart = createChart(/* 차트 설정 */);
}
```

3. **사이드바 메뉴 추가**
```html
<a href="#" class="sidebar-item" data-target="new-forecast">
  <i class="fas fa-chart-line mr-3"></i>새로운 예측
</a>
```

### Box Plot 차트 추가
```javascript
// Box Plot 데이터 생성
const generateBoxplotData = (min, max) => {
  const range = max - min;
  return {
    min: min + Math.random() * range * 0.1,
    q1: min + range * 0.25,
    median: min + range * 0.5,
    q3: min + range * 0.75,
    max: max - Math.random() * range * 0.1
  };
};

// Box Plot 차트 생성
const chart = new Chart(ctx, {
  type: 'boxplot',
  data: {
    labels: weekLabels,
    datasets: [{
      data: boxplotData,
      backgroundColor: 'rgba(16, 185, 129, 0.6)',
      borderColor: 'rgb(16, 185, 129)'
    }]
  }
});
```

### 차트 타입 추가
```javascript
// 새로운 차트 타입 함수
const createNewChartType = (ctx, data, options) => {
  return new Chart(ctx, {
    type: 'newType',
    data: data,
    options: options
  });
};
```

## 🐛 문제 해결

### 일반적인 문제

1. **차트가 표시되지 않음**
   - 브라우저 콘솔에서 JavaScript 오류 확인
   - Chart.js 라이브러리 로딩 상태 확인
   - Canvas 요소 존재 여부 확인

2. **탭 전환이 작동하지 않음**
   - setupTabs 함수 호출 확인
   - 이벤트 리스너 등록 상태 확인
   - HTML 구조와 JavaScript 선택자 일치 확인

3. **반응형 레이아웃 문제**
   - Tailwind CSS 클래스 적용 확인
   - 브레이크포인트 설정 검토
   - 차트 반응형 옵션 활성화 확인

### 디버깅 도구
```javascript
// 디버깅 모드 활성화
const DEBUG_MODE = true;

if (DEBUG_MODE) {
  console.log('Chart initialization:', charts);
  console.log('Active section:', activeSection);
}
```

## 📈 성능 최적화

### 차트 성능
- **차트 재사용**: 기존 차트 인스턴스 업데이트
- **데이터 캐싱**: 불필요한 데이터 재생성 방지
- **애니메이션 최적화**: 부드러운 전환 효과

### 메모리 관리
```javascript
// 차트 정리 함수
const destroyAllCharts = () => {
  Object.values(charts).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  });
  charts = {};
};
```

## 🤝 기여 가이드

### 개발 워크플로우

1. **이슈 생성**: 버그 리포트 또는 기능 요청
2. **브랜치 생성**: `feature/기능명` 또는 `bugfix/버그명`
3. **개발 및 테스트**: 로컬 환경에서 개발
4. **Pull Request**: 코드 리뷰 요청
5. **병합**: 승인 후 main 브랜치 병합

### 코딩 컨벤션

- **HTML**: 시맨틱 태그 사용, 들여쓰기 2칸
- **CSS**: Tailwind CSS 클래스 우선 사용
- **JavaScript**: ES6+ 문법, camelCase 네이밍
- **주석**: 복잡한 로직에 대한 설명 추가

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 연락처

- **프로젝트 관리자**: [이름]
- **이메일**: [이메일 주소]
- **GitHub**: [GitHub 프로필]

## 🙏 감사의 말

- **Chart.js**: 훌륭한 차트 라이브러리 제공
- **Tailwind CSS**: 효율적인 CSS 프레임워크
- **Font Awesome**: 아이콘 라이브러리
- **GitHub Pages**: 무료 호스팅 서비스

---

## 📝 업데이트 로그

### v1.1.0 (2024-12-XX)
- **장기예측 개선**: 3개월 예측으로 집중, 1개월/6개월 제거
- **Box-and-whisker Plot 추가**: 기상 데이터 통계적 분포 시각화
- **기상 예측 고도화**: 풍속, 기온, 파고의 다양한 시나리오 표현
- **상세 기상 정보 모달**: 주차별 클릭 시 상세 분포 정보 제공
- **색상 코딩 시스템**: 도넛 차트 최고 확률 구간과 박스플롯 색상 연동

### v1.0.0 (2024-12-XX)
- 초기 버전 릴리스
- 단기/중기/장기 예측 기능 구현
- 반응형 대시보드 완성
- 터빈별 예측 분석 기능 추가

---

**🌟 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!**
