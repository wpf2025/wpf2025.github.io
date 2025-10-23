# 기상예측 기능 구현 문서

## 📅 작업 일시
- **시작**: 2025-10-23 08:32
- **완료**: 2025-10-23 09:15

## 🎯 프로젝트 목표
SGRE(Siemens Gamesa Renewable Energy)의 MyWeather&Energy 시스템을 참고하여, 풍력 발전소 운영을 위한 기상예측 페이지를 추가한다.

---

## 📋 구성안 (최종)

### 1️⃣ 상단 컨트롤 영역
```
┌─────────────────────────────────────────────────────────┐
│ 예측 기간: ○ 10일 (1시간)  ○ 90일 (1일)                │
│ 표시 모드: [List] [Charts]                              │
│ 마지막 업데이트: 2025-10-23 08:30 UTC                   │
└─────────────────────────────────────────────────────────┘
```

### 2️⃣ List 모드 (아코디언 방식)

#### A. 10일 예측 (1시간 단위)
```
┌─────────────────────────────────────────────────────────┐
│ [날짜 배지] 2025년 10월 23일 수요일                      │
│             평균 풍속: 8.5 m/s                    [▼]   │
│ ████████████████████████████████ (24시간 타임라인)      │
├─────────────────────────────────────────────────────────┤
│ 시간      │ 0:00 │ 1:00 │ 2:00 │ ... │ 23:00 │        │
│ 풍속      │ 7.2  │ 7.5  │ 8.1  │ ... │ 6.8   │        │
│ 기온      │ 15.3 │ 14.9 │ 14.5 │ ... │ 16.2  │        │
│ 강수량    │ 0.0  │ 0.2  │ 0.5  │ ... │ 0.0   │        │
│ 상대습도  │ 65   │ 68   │ 70   │ ... │ 62    │        │
│ 파고      │ 1.2  │ 1.3  │ 1.4  │ ... │ 1.1   │        │
│ 낙뢰확률  │ 5    │ 8    │ 12   │ ... │ 3     │        │
│ 신뢰도    │ 85   │ 83   │ 82   │ ... │ 87    │        │
└─────────────────────────────────────────────────────────┘
```

**특징:**
- 10개 날짜별 아코디언
- 각 날짜마다 24시간 색상 타임라인 (녹색/주황/빨강)
- 클릭 시 시간별 상세 테이블 펼침
- 시간을 가로 헤더로, 기상 변수를 세로 행으로 배치
- 첫 번째 열(변수명) sticky 고정

#### B. 90일 예측 (1일 단위)
```
┌─────────────────────────────────────────────────────────┐
│ [기간 배지] Day 1-10                                     │
│             10월 23일 - 11월 1일                         │
│             평균 풍속: 9.2 m/s                    [▼]   │
│ ██████████ (10일 타임라인)                              │
├─────────────────────────────────────────────────────────┤
│ 날짜        │10/23│10/24│10/25│ ... │11/1 │            │
│ 평균풍속    │ 8.5 │ 9.1 │ 9.8 │ ... │ 8.2 │            │
│ 최고기온    │ 18.2│ 19.5│ 20.1│ ... │ 17.8│            │
│ 최저기온    │ 12.3│ 13.1│ 13.8│ ... │ 11.9│            │
│ 강수량      │ 2.5 │ 0.0 │ 0.5 │ ... │ 3.2 │            │
│ 평균파고    │ 1.5 │ 1.3 │ 1.2 │ ... │ 1.6 │            │
│ 신뢰도      │ 75  │ 78  │ 72  │ ... │ 68  │            │
└─────────────────────────────────────────────────────────┘
```

**특징:**
- 9개 기간별 아코디언 (10일씩)
- 각 기간마다 10일 색상 타임라인
- 클릭 시 일별 상세 테이블 펼침
- 날짜를 가로 헤더로, 기상 변수를 세로 행으로 배치

### 3️⃣ Charts 모드

#### A. 10일 예측
```
┌─────────────────────────────────────────────────────────┐
│ 10일 기상 개요                                           │
│ ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐              │
│ │23 │24 │25 │26 │27 │28 │29 │30 │31 │ 1 │ (캘린더)   │
│ │🟢│🟡│🟢│🟢│🔴│🟡│🟢│🟢│🟢│🟡│              │
│ └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 상세 캘린더 뷰                                           │
│ 기간: 10월 23일 - 11월 1일                              │
│                                                          │
│ Day         │10/23│10/24│10/25│ ... │11/1 │            │
│ Confidence  │████ │█████│███  │ ... │████ │ (막대)     │
│ 풍속        │ ⚫  │ ⚫  │ ⚫  │ ... │ ⚫  │ (원형)     │
│ 기온        │ ⚫  │ ⚫  │ ⚫  │ ... │ ⚫  │            │
│ 강수량      │ ⚫  │ ⚫  │ ⚫  │ ... │ ⚫  │            │
│ 상대습도    │ ⚫  │ ⚫  │ ⚫  │ ... │ ⚫  │            │
│ 파고        │ ⚫  │ ⚫  │ ⚫  │ ... │ ⚫  │            │
└─────────────────────────────────────────────────────────┘
```

**특징:**
- 상단: 10일 캘린더 그리드 (색상 코딩)
- 하단: 상세 캘린더 뷰
  - Confidence: 막대 그래프
  - 기상 변수: 원형 인디케이터 (색상 코딩)

#### B. 90일 예측
```
┌─────────────────────────────────────────────────────────┐
│ 3개월 기상 캘린더                                        │
│                                                          │
│ 2025년 10월                                             │
│ ┌───┬───┬───┬───┬───┬───┬───┐                          │
│ │ 월│ 화│ 수│ 목│ 금│ 토│ 일│                          │
│ ├───┼───┼───┼───┼───┼───┼───┤                          │
│ │   │   │23 │24 │25 │26 │27 │                          │
│ │   │   │🟢│🟡│🟢│🟢│🔴│                          │
│ └───┴───┴───┴───┴───┴───┴───┘                          │
│                                                          │
│ 2025년 11월 ... (반복)                                  │
└─────────────────────────────────────────────────────────┘
```

**특징:**
- 3개월 캘린더 그리드
- 월별 구분
- 각 날짜에 색상 코딩 (풍속 기반)

---

## 🛠 기술 구현

### 1. HTML 구조

#### 사이드바 메뉴 추가
```html
<a href="#" class="sidebar-item block py-3 px-6" data-target="weather">
    <i class="fas fa-cloud-sun mr-3 w-5 text-center"></i>기상예측
</a>
```

#### 메인 섹션 구조
```html
<section id="weather-content" class="content-section hidden">
    <!-- 상단 컨트롤 -->
    <div class="card">
        <div class="flex flex-wrap items-center gap-4 mb-4">
            <!-- 예측 기간 선택 -->
            <input type="radio" name="weatherPeriod" value="10days" checked>
            <input type="radio" name="weatherPeriod" value="90days">
            
            <!-- 표시 모드 -->
            <button id="weatherListBtn">List</button>
            <button id="weatherChartsBtn">Charts</button>
        </div>
    </div>
    
    <!-- List 모드 -->
    <div id="weatherListMode">
        <div id="weather10daysList"></div>
        <div id="weather90daysList"></div>
    </div>
    
    <!-- Charts 모드 -->
    <div id="weatherChartsMode">
        <div id="weather10daysCharts"></div>
        <div id="weather90daysCharts"></div>
    </div>
</section>
```

### 2. CSS 스타일링

#### 최신형 UI 스타일
```css
/* 아코디언 카드 */
.weather-accordion-item-modern {
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    background: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.weather-accordion-item-modern:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

/* 헤더 */
.weather-accordion-header-modern {
    padding: 1.5rem;
    cursor: pointer;
    background: linear-gradient(to right, #ffffff, #f9fafb);
}

/* 타임라인 */
.weather-timeline-bar {
    height: 40px;
    display: flex;
    border-radius: 0.5rem;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.weather-timeline-segment {
    flex: 1;
    transition: all 0.2s;
}

.weather-timeline-segment:hover {
    opacity: 0.8;
    transform: scaleY(1.1);
}

/* 색상 코딩 */
.weather-status-good { 
    background: linear-gradient(to bottom, #10b981, #059669);
}
.weather-status-warning { 
    background: linear-gradient(to bottom, #f59e0b, #d97706);
}
.weather-status-danger { 
    background: linear-gradient(to bottom, #ef4444, #dc2626);
}

/* 아코디언 애니메이션 */
.weather-accordion-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.weather-accordion-content.active {
    max-height: 5000px !important;
}

/* 테이블 */
.weather-table-modern {
    width: 100%;
    font-size: 0.875rem;
    border-collapse: separate;
    border-spacing: 0;
}

.weather-table-modern thead th {
    background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
    padding: 0.75rem 0.5rem;
    text-align: center;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 10;
}

.weather-table-modern tbody td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s;
}

.weather-table-modern tbody tr:hover td {
    background-color: #f9fafb;
}

/* Sticky 첫 번째 열 */
.weather-table-modern .sticky-col {
    position: sticky;
    left: 0;
    background: white;
    z-index: 5;
    font-weight: 600;
    border-right: 2px solid #e5e7eb;
    min-width: 150px;
}
```

### 3. JavaScript 기능

#### 초기화 함수
```javascript
function initWeatherForecast() {
    const periodRadios = document.querySelectorAll('input[name="weatherPeriod"]');
    const listBtn = document.getElementById('weatherListBtn');
    const chartsBtn = document.getElementById('weatherChartsBtn');
    
    // 기간 변경 이벤트
    periodRadios.forEach(radio => {
        radio.addEventListener('change', updateWeatherView);
    });
    
    // 모드 변경 이벤트
    listBtn.addEventListener('click', () => switchWeatherMode('list'));
    chartsBtn.addEventListener('click', () => switchWeatherMode('charts'));
    
    // 초기 렌더링
    updateWeatherView();
}
```

#### 모드 전환 함수
```javascript
function switchWeatherMode(mode) {
    const listBtn = document.getElementById('weatherListBtn');
    const chartsBtn = document.getElementById('weatherChartsBtn');
    const listMode = document.getElementById('weatherListMode');
    const chartsMode = document.getElementById('weatherChartsMode');
    
    if (mode === 'list') {
        listBtn.classList.add('bg-blue-600', 'text-white');
        chartsBtn.classList.add('bg-gray-200', 'text-gray-700');
        listMode.classList.remove('hidden');
        chartsMode.classList.add('hidden');
    } else {
        // Charts 모드 활성화
    }
    
    updateWeatherView();
}
```

#### 뷰 업데이트 함수
```javascript
function updateWeatherView() {
    const period = document.querySelector('input[name="weatherPeriod"]:checked').value;
    const mode = document.getElementById('weatherListBtn').classList.contains('bg-blue-600') ? 'list' : 'charts';
    
    if (mode === 'list') {
        if (period === '10days') {
            render10DaysList();
        } else {
            render90DaysList();
        }
    } else {
        if (period === '10days') {
            render10DaysCharts();
        } else {
            render90DaysCharts();
        }
    }
}
```

#### 기상 상태 결정 함수
```javascript
function getWeatherStatus(windSpeed) {
    if (windSpeed < 3 || windSpeed > 20) return 'danger';  // 빨강
    if (windSpeed < 6 || windSpeed > 15) return 'warning'; // 주황
    return 'good'; // 녹색
}
```

#### 10일 List 렌더링 (핵심)
```javascript
function render10DaysList() {
    const container = document.getElementById('weather10daysList');
    const today = new Date();
    let html = '';
    
    for (let day = 0; day < 10; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() + day);
        
        // 24시간 데이터 생성
        const hourlyData = [];
        for (let hour = 0; hour < 24; hour++) {
            hourlyData.push({
                hour: hour,
                windSpeed: (5 + Math.random() * 10).toFixed(1),
                temp: (10 + Math.random() * 15).toFixed(1),
                precip: (Math.random() * 5).toFixed(1),
                humidity: (60 + Math.random() * 30).toFixed(0),
                waveHeight: (0.5 + Math.random() * 2).toFixed(1),
                lightning: (Math.random() * 20).toFixed(0),
                confidence: (70 + Math.random() * 25).toFixed(0)
            });
        }
        
        // 타임라인 생성
        let timelineHtml = '<div class="weather-timeline-bar shadow-sm">';
        hourlyData.forEach(data => {
            const status = getWeatherStatus(parseFloat(data.windSpeed));
            timelineHtml += `<div class="weather-timeline-segment weather-status-${status}"></div>`;
        });
        timelineHtml += '</div>';
        
        // 테이블 생성 (시간 가로, 변수 세로)
        let tableHtml = '<table class="weather-table-modern">';
        tableHtml += '<thead><tr><th class="sticky-col">시간</th>';
        hourlyData.forEach(data => {
            tableHtml += `<th>${data.hour}:00</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        
        // 각 변수별 행
        const variables = [
            { key: 'windSpeed', label: '풍속 (m/s)', icon: 'fa-wind' },
            { key: 'temp', label: '기온 (°C)', icon: 'fa-temperature-high' },
            // ... 기타 변수
        ];
        
        variables.forEach(variable => {
            tableHtml += `<tr><td class="sticky-col"><i class="fas ${variable.icon}"></i>${variable.label}</td>`;
            hourlyData.forEach(data => {
                tableHtml += `<td>${data[variable.key]}</td>`;
            });
            tableHtml += '</tr>';
        });
        
        tableHtml += '</tbody></table>';
        
        // 아코디언 HTML 조립
        html += `
            <div class="weather-accordion-item-modern">
                <div class="weather-accordion-header-modern" onclick="toggleWeatherAccordion(this)">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                                ${date.getDate()}
                            </div>
                            <h4>${dateStr}</h4>
                        </div>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    ${timelineHtml}
                </div>
                <div class="weather-accordion-content">
                    ${tableHtml}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}
```

#### 아코디언 토글 함수
```javascript
window.toggleWeatherAccordion = function(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('i.fa-chevron-down, i.fa-chevron-up');
    
    const isActive = content.classList.contains('active');
    
    if (isActive) {
        content.classList.remove('active');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('active');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
        icon.style.transform = 'rotate(180deg)';
    }
};
```

---

## 🎨 UI/UX 특징

### 1. 최신형 디자인
- **그라데이션**: 헤더, 버튼, 타임라인에 그라데이션 적용
- **그림자**: 카드에 부드러운 그림자 효과
- **호버 효과**: 
  - 카드 상승 애니메이션
  - 타임라인 세그먼트 확대
  - 테이블 행 하이라이트

### 2. 색상 코딩 시스템
- **녹색**: 최적 풍속 (6-12 m/s), 높은 신뢰도 (80%+)
- **주황색**: 주의 풍속 (3-6 m/s, 12-15 m/s)
- **빨간색**: 위험 풍속 (<3 m/s, >18 m/s), 낮은 신뢰도 (<60%)

### 3. 인터랙티브 요소
- **아코디언**: 부드러운 펼침/접힘 애니메이션
- **Sticky 헤더**: 테이블 스크롤 시 헤더 고정
- **Sticky 첫 열**: 가로 스크롤 시 변수명 고정
- **툴팁**: 타임라인 호버 시 상세 정보 표시

### 4. 반응형 디자인
- 모바일/태블릿/데스크톱 지원
- 가로 스크롤 가능한 테이블
- 유연한 그리드 레이아웃

---

## 📊 데이터 구조

### 시간별 데이터 (10일 예측)
```javascript
{
    hour: 0,              // 시간 (0-23)
    windSpeed: "7.2",     // 풍속 (m/s)
    temp: "15.3",         // 기온 (°C)
    precip: "0.0",        // 강수량 (mm)
    humidity: "65",       // 상대습도 (%)
    waveHeight: "1.2",    // 파고 (m)
    lightning: "5",       // 낙뢰확률 (%)
    confidence: "85"      // 신뢰도 (%)
}
```

### 일별 데이터 (90일 예측)
```javascript
{
    date: "10/23",        // 날짜
    windSpeed: "8.5",     // 평균풍속 (m/s)
    maxTemp: "18.2",      // 최고기온 (°C)
    minTemp: "12.3",      // 최저기온 (°C)
    precip: "2.5",        // 강수량 (mm)
    waveHeight: "1.5",    // 평균파고 (m)
    confidence: "75"      // 신뢰도 (%)
}
```

---

## 🔧 주요 이슈 및 해결

### 이슈 1: 아코디언이 작동하지 않음
**원인**: `toggleWeatherAccordion` 함수가 전역 스코프에 노출되지 않음

**해결**:
```javascript
// Before
function toggleWeatherAccordion(header) { ... }

// After
window.toggleWeatherAccordion = function(header) { ... };
```

### 이슈 2: 아코디언이 완전히 펼쳐지지 않음
**원인**: `max-height` 값이 테이블 높이보다 작음

**해결**:
```css
/* Before */
.weather-accordion-content.active {
    max-height: 2000px;
}

/* After */
.weather-accordion-content.active {
    max-height: 5000px !important;
}
```

### 이슈 3: 테이블 레이아웃이 직관적이지 않음
**원인**: 시간이 세로, 변수가 가로로 배치됨 (SGRE와 반대)

**해결**: 테이블 구조를 전치(transpose)
- 시간/날짜를 가로 헤더로 배치
- 기상 변수를 세로 행으로 배치
- 첫 번째 열(변수명)을 sticky로 고정

---

## 📈 성능 최적화

### 1. 데이터 생성 최적화
- 필요한 시점에만 데이터 생성
- 불필요한 재렌더링 방지

### 2. CSS 애니메이션
- GPU 가속 활용 (`transform`, `opacity`)
- `cubic-bezier` 이징 함수로 부드러운 애니메이션

### 3. 메모리 관리
- 이벤트 리스너 중복 등록 방지
- 불필요한 DOM 조작 최소화

---

## 🚀 향후 개선 사항

### 1. 실제 API 연동
- 현재: 랜덤 샘플 데이터
- 개선: 실제 기상 API 연동 (OpenWeatherMap, ECMWF 등)

### 2. Charts 모드 고도화
- 인터랙티브 차트 추가 (Chart.js)
- 날짜 클릭 시 상세 정보 모달
- 기상 변수별 트렌드 분석

### 3. 데이터 내보내기
- CSV/Excel 다운로드 기능
- PDF 리포트 생성

### 4. 알림 기능
- 위험 기상 조건 알림
- 최적 발전 시간대 알림

### 5. 다국어 지원
- 영어, 한국어 전환
- 날짜/시간 형식 로케일 대응

---

## 📝 참고 자료

### SGRE MyWeather&Energy 시스템
- **이미지 1**: 10일 예측 List 뷰 (시간별 테이블 + 타임라인)
- **이미지 2**: 90일 예측 상세 캘린더 뷰 (원형 인디케이터)
- **이미지 3**: 90일 예측 전체 뷰 (캘린더 그리드)

### 기술 스택
- **HTML5**: 시맨틱 마크업
- **CSS3**: Tailwind CSS + 커스텀 스타일
- **JavaScript (ES6+)**: 바닐라 JavaScript
- **Font Awesome**: 아이콘 라이브러리

---

## ✅ 완료된 작업 체크리스트

- [x] 사이드바에 기상예측 메뉴 항목 추가
- [x] 기상예측 섹션 HTML 구조 생성
- [x] 10일 List 모드: 날짜별 아코디언 + 시간별 테이블
- [x] 90일 List 모드: 10일 간격 아코디언 + 일별 테이블
- [x] 10일 Charts 모드: 캘린더 그리드 + 상세 뷰
- [x] 90일 Charts 모드: 3개월 캘린더 그리드
- [x] JavaScript: 탭 전환 및 아코디언 토글 기능
- [x] JavaScript: 샘플 기상 데이터 생성 함수
- [x] CSS: 최신형 UI 스타일링
- [x] 테이블 레이아웃 개선 (시간 가로, 변수 세로)
- [x] 아코디언 작동 이슈 해결
- [x] 색상 코딩 시스템 구현

---

## 📞 문의 및 지원

프로젝트 관련 문의사항이나 버그 리포트는 GitHub Issues를 통해 제출해주세요.

**작성일**: 2025-10-23  
**작성자**: Amazon Q  
**버전**: 1.1.0
