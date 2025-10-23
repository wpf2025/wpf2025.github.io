        const generateRandomData = (count, min, max, decimals = 0) => {
            const data = [];
            for (let i = 0; i < count; i++) {
                let value = Math.random() * (max - min) + min;
                data.push(parseFloat(value.toFixed(decimals)));
            }
            return data;
        };

        // 오늘 기상예보 데이터 생성 및 표시
        const initTodayWeather = () => {
            const today = new Date();
            const dateNum = today.getDate();
            const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
            const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
            
            // 24시간 기상 데이터 생성
            const windSpeeds = generateRandomData(24, 5, 15, 1);
            const temps = generateRandomData(24, 15, 22, 1);
            const rainfalls = generateRandomData(24, 0, 2, 1);
            const waves = generateRandomData(24, 0.6, 2.5, 1);
            const lightnings = generateRandomData(24, 0, 20, 0);
            
            // 평균 풍속
            const avgWindSpeed = (windSpeeds.reduce((a, b) => a + b, 0) / 24).toFixed(1);
            
            // 날짜 정보 업데이트
            document.getElementById('todayWeatherDate').textContent = dateNum;
            document.getElementById('todayWeatherDay').textContent = `${monthNames[today.getMonth()]} ${dateNum}일 ${dayNames[today.getDay()]}`;
            document.getElementById('todayAvgWindSpeed').textContent = `${avgWindSpeed} m/s`;
            
            // 범위 정보 업데이트
            document.getElementById('todayWindRange').textContent = `${Math.min(...windSpeeds).toFixed(1)} ~ ${Math.max(...windSpeeds).toFixed(1)} m/s`;
            document.getElementById('todayTempRange').textContent = `${Math.min(...temps).toFixed(1)} ~ ${Math.max(...temps).toFixed(1)}°C`;
            document.getElementById('todayRainfall').textContent = `${rainfalls.reduce((a, b) => a + b, 0).toFixed(1)} mm`;
            document.getElementById('todayWaveRange').textContent = `${Math.min(...waves).toFixed(1)} ~ ${Math.max(...waves).toFixed(1)} m`;
            document.getElementById('todayLightning').textContent = `${Math.max(...lightnings)}%`;
            
            // 24시간 타임라인 생성
            const timeline = document.getElementById('todayWeatherTimeline');
            timeline.innerHTML = '';
            windSpeeds.forEach(speed => {
                const segment = document.createElement('div');
                segment.style.flex = '1';
                if (speed < 10) {
                    segment.style.backgroundColor = '#86efac'; // 녹색
                } else if (speed < 13) {
                    segment.style.backgroundColor = '#fcd34d'; // 주황
                } else {
                    segment.style.backgroundColor = '#fca5a5'; // 빨강
                }
                timeline.appendChild(segment);
            });
        };

        const defaultChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: true } }
        };
        
        const defaultLineChartOptions = { // For thinner lines and smaller points in daily turbine charts
            ...defaultChartOptions,
            elements: {
                line: { borderWidth: 2 },
                point: { radius: 2 }
            },
            plugins: { legend: { display: false } } // No legend for individual daily turbine charts
        };


        const createChart = (ctx, type, labels, datasets, options = {}) => {
            if (!ctx) return null;
            return new Chart(ctx, {
                type: type,
                data: { labels: labels, datasets: datasets },
                options: {...defaultChartOptions, ...options}
            });
        };
        
        let charts = {}; 

        const destroyAllCharts = () => {
            Object.values(charts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            charts = {};
        };

        const initChartsForCurrentView = () => {
            destroyAllCharts(); 

            // Overview Charts
            if (document.getElementById('overview-content')?.offsetParent !== null) {
                charts.recentTrendChart = createChart(document.getElementById('recentTrendChart')?.getContext('2d'), 'line',
                    ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', '오늘'], 
                    [{ label: '일일 발전량 (MWh)', data: generateRandomData(7, 200, 461), borderColor: 'rgb(16, 185, 129)', tension: 0.1, fill: false}]
                );
                charts.hourlyPatternChart = createChart(document.getElementById('hourlyPatternChart')?.getContext('2d'), 'bar',
                    Array.from({length: 24}, (_, i) => `${i}시`),
                    [{ label: '시간대별 예상 발전량 (MW)', data: generateRandomData(24, 2, 19.2), backgroundColor: 'rgba(99, 102, 241, 0.6)'}]
                );
            }

            // Short-term Forecast Charts (3 days)
            if (document.getElementById('shortterm-content')?.offsetParent !== null) {
                // Total Plant - Daily & Hourly (통합 페이지)
                if (document.getElementById('shortterm-total-content')?.offsetParent !== null) {
                    // 일평균 차트
                    charts.shorttermDailyTotalChart = createChart(document.getElementById('shorttermDailyTotalChart')?.getContext('2d'), 'bar',
                        ['오늘', '내일', '모레'], 
                        [{ label: '일평균 발전량 (GWh)', data: [5.2, 4.8, 5.5], backgroundColor: 'rgba(59, 130, 246, 0.8)'}]
                    );
                    
                    // 시간별 차트
                    const hourlyLabels = [];
                    for (let day = 0; day < 3; day++) {
                        for (let hour = 0; hour < 24; hour++) {
                            hourlyLabels.push(`D+${day} ${hour}시`);
                        }
                    }
                    charts.shorttermHourlyTotalChart = createChart(document.getElementById('shorttermHourlyTotalChart')?.getContext('2d'), 'line',
                        hourlyLabels,
                        [{ label: '시간별 발전량 (MW)', data: generateRandomData(72, 80, 180), borderColor: 'rgb(16, 185, 129)', tension: 0.1, fill: false}]
                    );
                }
                // Per Turbine - Daily
                if (document.getElementById('shortterm-turbine-content')?.offsetParent !== null) {
                    // 터빈별 고정 데이터 (HTML의 KPI 값과 정확히 일치)
                    const turbineData = {
                        1: [1.1, 0.9, 1.2], // WTG #1: 오늘, 내일, 모레
                        2: [1.0, 1.1, 1.0], // WTG #2
                        3: [1.2, 0.8, 1.3], // WTG #3
                        4: [0.9, 1.0, 1.0], // WTG #4
                        5: [1.0, 1.0, 1.0]  // WTG #5
                    };
                    
                    // 일평균 차트들
                    for (let i = 1; i <= 5; i++) {
                        const chartElement = document.getElementById(`shorttermWtg${i}DailyChart`);
                        if (chartElement) {
                            charts[`shorttermWtg${i}DailyChart`] = createChart(chartElement.getContext('2d'), 'bar',
                                ['오늘', '내일', '모레'],
                                [{ 
                                    label: `WTG #${i} 일평균 (GWh)`, 
                                    data: turbineData[i], 
                                    backgroundColor: `rgba(${59 + i * 20}, ${130 + i * 10}, 246, 0.8)`
                                }],
                                {
                                    plugins: {
                                        legend: { display: false }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: 1.5,
                                            ticks: {
                                                font: { size: 10 }
                                            }
                                        }
                                    }
                                }
                            );
                        }
                    }
                }
                // Per Turbine - Hourly
                if (document.getElementById('shortterm-turbine-content')?.offsetParent !== null) {
                    const hourlyLabels72 = [];
                    for (let day = 0; day < 3; day++) {
                        for (let hour = 0; hour < 24; hour++) {
                            const dayName = day === 0 ? '오늘' : day === 1 ? '내일' : '모레';
                            hourlyLabels72.push(`${dayName} ${hour}시`);
                        }
                    }
                    
                    // 각 터빈별 72시간 데이터 생성
                    const wtg1Data = generateRandomData(72, 15, 35);
                    const wtg2Data = generateRandomData(72, 15, 35);
                    const wtg3Data = generateRandomData(72, 15, 35);
                    const wtg4Data = generateRandomData(72, 15, 35);
                    const wtg5Data = generateRandomData(72, 15, 35);
                    
                    // 전체 합계 데이터 계산
                    const totalData = wtg1Data.map((val, idx) => 
                        val + wtg2Data[idx] + wtg3Data[idx] + wtg4Data[idx] + wtg5Data[idx]
                    );
                    
                    // 전체 통합 차트 (모든 발전기 + 합계)
                    const allTurbinesChartElement = document.getElementById('shorttermAllTurbinesHourlyChart');
                    if (allTurbinesChartElement) {
                        charts.shorttermAllTurbinesHourlyChart = createChart(allTurbinesChartElement.getContext('2d'), 'line',
                            hourlyLabels72,
                            [
                                { label: 'WTG #1', data: wtg1Data, borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.1, fill: false, borderWidth: 2},
                                { label: 'WTG #2', data: wtg2Data, borderColor: 'rgb(16, 185, 129)', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.1, fill: false, borderWidth: 2},
                                { label: 'WTG #3', data: wtg3Data, borderColor: 'rgb(245, 158, 11)', backgroundColor: 'rgba(245, 158, 11, 0.1)', tension: 0.1, fill: false, borderWidth: 2},
                                { label: 'WTG #4', data: wtg4Data, borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.1, fill: false, borderWidth: 2},
                                { label: 'WTG #5', data: wtg5Data, borderColor: 'rgb(139, 92, 246)', backgroundColor: 'rgba(139, 92, 246, 0.1)', tension: 0.1, fill: false, borderWidth: 2},
                                { label: '전체 합계', data: totalData, borderColor: 'rgb(0, 0, 0)', backgroundColor: 'rgba(0, 0, 0, 0.1)', tension: 0.1, fill: false, borderWidth: 3}
                            ]
                        );
                    }
                    
                    // 개별 발전기 차트들
                    for (let i = 1; i <= 5; i++) {
                        const chartElement = document.getElementById(`shorttermWtg${i}HourlyChart`);
                        if (chartElement) {
                            const data = [wtg1Data, wtg2Data, wtg3Data, wtg4Data, wtg5Data][i-1];
                            const colors = [
                                'rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(245, 158, 11)', 
                                'rgb(239, 68, 68)', 'rgb(139, 92, 246)'
                            ];
                            charts[`shorttermWtg${i}HourlyChart`] = createChart(chartElement.getContext('2d'), 'line',
                                hourlyLabels72,
                                [{ label: `WTG #${i} (MW)`, data: data, borderColor: colors[i-1], backgroundColor: colors[i-1].replace('rgb', 'rgba').replace(')', ', 0.2)'), tension: 0.1, fill: true, borderWidth: 2}]
                            );
                        }
                    }
                }
            }

            // Windspeed Forecast (48 hours)
            if (document.getElementById('shortterm-content')?.offsetParent !== null) {
                const windspeedChartElement = document.getElementById('shorttermWindspeedChart');
                const distributionChartElement = document.getElementById('windspeedDistributionChart');
                
                if (windspeedChartElement) {
                    const windspeedLabels = [];
                    for (let day = 0; day < 2; day++) {
                        for (let hour = 0; hour < 24; hour++) {
                            const dayName = day === 0 ? '오늘' : '내일';
                            windspeedLabels.push(`${dayName} ${hour}시`);
                        }
                    }
                    
                    // 풍속 데이터 생성 (3-15 m/s 범위)
                    const windspeedData = generateRandomData(48, 3, 15);
                    
                    // 풍속 구간별 색상 설정
                    const windspeedColors = windspeedData.map(speed => {
                        if (speed < 3) return 'rgba(239, 68, 68, 0.8)';      // 빨간색 (컷인 미달)
                        else if (speed >= 3 && speed < 6) return 'rgba(245, 158, 11, 0.8)'; // 주황색 (저풍속)
                        else if (speed >= 6 && speed <= 12) return 'rgba(16, 185, 129, 0.8)'; // 녹색 (최적)
                        else return 'rgba(59, 130, 246, 0.8)';               // 파란색 (정격)
                    });
                    
                    // 시간별 풍속 예측 차트
                    charts.shorttermWindspeedChart = createChart(windspeedChartElement.getContext('2d'), 'line',
                        windspeedLabels,
                        [{ 
                            label: '풍속 (m/s)', 
                            data: windspeedData, 
                            borderColor: 'rgb(59, 130, 246)', 
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.3, 
                            fill: true,
                            borderWidth: 2,
                            pointBackgroundColor: windspeedColors,
                            pointBorderColor: windspeedColors,
                            pointRadius: 4
                        }],
                        {
                            plugins: {
                                legend: { display: true },
                                tooltip: {
                                    callbacks: {
                                        afterLabel: function(context) {
                                            const speed = context.parsed.y;
                                            if (speed < 3) return '발전 불가 (컷인 미달)';
                                            else if (speed >= 3 && speed < 6) return '저풍속 구간';
                                            else if (speed >= 6 && speed <= 12) return '최적 발전 구간';
                                            else return '정격 출력 구간';
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 16,
                                    title: {
                                        display: true,
                                        text: '풍속 (m/s)'
                                    },
                                    grid: {
                                        color: function(context) {
                                            if (context.tick.value === 3) return 'rgba(239, 68, 68, 0.5)';
                                            if (context.tick.value === 6) return 'rgba(245, 158, 11, 0.5)';
                                            if (context.tick.value === 12) return 'rgba(16, 185, 129, 0.5)';
                                            return 'rgba(0, 0, 0, 0.1)';
                                        }
                                    }
                                }
                            }
                        }
                    );
                }
                
                if (distributionChartElement) {
                    // 풍속 데이터가 이미 생성되었다고 가정하고 분포 계산
                    const sampleWindspeedData = generateRandomData(48, 3, 15);
                    const cutInBelow = sampleWindspeedData.filter(speed => speed < 3).length;
                    const lowWind = sampleWindspeedData.filter(speed => speed >= 3 && speed < 6).length;
                    const optimal = sampleWindspeedData.filter(speed => speed >= 6 && speed <= 12).length;
                    const rated = sampleWindspeedData.filter(speed => speed > 12).length;
                    
                    charts.windspeedDistributionChart = createChart(distributionChartElement.getContext('2d'), 'doughnut',
                        ['컷인 미달 (< 3m/s)', '저풍속 (3-6m/s)', '최적 풍속 (6-12m/s)', '정격 풍속 (> 12m/s)'],
                        [{
                            data: [cutInBelow, lowWind, optimal, rated],
                            backgroundColor: [
                                'rgba(239, 68, 68, 0.8)',   // 빨간색
                                'rgba(245, 158, 11, 0.8)',  // 주황색
                                'rgba(16, 185, 129, 0.8)',  // 녹색
                                'rgba(59, 130, 246, 0.8)'   // 파란색
                            ],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }],
                        {
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        padding: 20,
                                        usePointStyle: true
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                                            return `${context.label}: ${context.parsed}시간 (${percentage}%)`;
                                        }
                                    }
                                }
                            }
                        }
                    );
                }
            }

            // Maintenance Schedule Optimization (48 hours)
            if (document.getElementById('shortterm-content')?.offsetParent !== null) {
                const maintenanceOptChart = document.getElementById('maintenanceOptimizationChart');
                const turbineOpChart = document.getElementById('turbineOperationChart');
                const craneOpChart = document.getElementById('craneOperationChart');
                
                if (maintenanceOptChart) {
                    const labels48h = [];
                    for (let day = 0; day < 2; day++) {
                        for (let hour = 0; hour < 24; hour++) {
                            const dayName = day === 0 ? '오늘' : '내일';
                            labels48h.push(`${dayName} ${hour}시`);
                        }
                    }
                    
                    // 발전량과 풍속 데이터 생성
                    const powerData = generateRandomData(48, 50, 200);
                    const windData = generateRandomData(48, 3, 15);
                    
                    // 정비 최적 구간 계산 (저발전량 + 저풍속)
                    const maintenanceScore = powerData.map((power, i) => {
                        const wind = windData[i];
                        // 낮은 발전량과 낮은 풍속일수록 높은 점수
                        return ((200 - power) / 200 * 50) + ((15 - wind) / 15 * 50);
                    });
                    
                    charts.maintenanceOptimizationChart = createChart(maintenanceOptChart.getContext('2d'), 'line',
                        labels48h,
                        [
                            { 
                                label: '발전량 (MW)', 
                                data: powerData, 
                                borderColor: 'rgb(59, 130, 246)', 
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                yAxisID: 'y',
                                tension: 0.3,
                                fill: false
                            },
                            { 
                                label: '풍속 (m/s)', 
                                data: windData, 
                                borderColor: 'rgb(245, 158, 11)', 
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                yAxisID: 'y1',
                                tension: 0.3,
                                fill: false
                            },
                            { 
                                label: '정비 적합도', 
                                data: maintenanceScore, 
                                borderColor: 'rgb(16, 185, 129)', 
                                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                yAxisID: 'y2',
                                tension: 0.3,
                                fill: true,
                                borderWidth: 3
                            }
                        ],
                        {
                            plugins: {
                                legend: { display: true }
                            },
                            scales: {
                                y: {
                                    type: 'linear',
                                    display: true,
                                    position: 'left',
                                    title: { display: true, text: '발전량 (MW)' }
                                },
                                y1: {
                                    type: 'linear',
                                    display: true,
                                    position: 'right',
                                    title: { display: true, text: '풍속 (m/s)' },
                                    grid: { drawOnChartArea: false }
                                },
                                y2: {
                                    type: 'linear',
                                    display: false,
                                    min: 0,
                                    max: 100
                                }
                            }
                        }
                    );
                }
                
                if (turbineOpChart) {
                    // 터빈 가동률 차트
                    const operationData = [
                        { label: 'WTG #1', normal: 20, maintenance: 4, high_risk: 0 },
                        { label: 'WTG #2', normal: 22, maintenance: 2, high_risk: 0 },
                        { label: 'WTG #3', normal: 16, maintenance: 8, high_risk: 0 },
                        { label: 'WTG #4', normal: 21, maintenance: 3, high_risk: 0 },
                        { label: 'WTG #5', normal: 23, maintenance: 1, high_risk: 0 }
                    ];
                    
                    charts.turbineOperationChart = createChart(turbineOpChart.getContext('2d'), 'bar',
                        operationData.map(d => d.label),
                        [
                            {
                                label: '정상 운전 (시간)',
                                data: operationData.map(d => d.normal),
                                backgroundColor: 'rgba(16, 185, 129, 0.8)'
                            },
                            {
                                label: '정비 모드 (시간)',
                                data: operationData.map(d => d.maintenance),
                                backgroundColor: 'rgba(245, 158, 11, 0.8)'
                            },
                            {
                                label: '고위험 중단 (시간)',
                                data: operationData.map(d => d.high_risk),
                                backgroundColor: 'rgba(239, 68, 68, 0.8)'
                            }
                        ],
                        {
                            plugins: {
                                legend: { display: true }
                            },
                            scales: {
                                x: { stacked: true },
                                y: { 
                                    stacked: true,
                                    title: { display: true, text: '시간 (h)' },
                                    max: 24
                                }
                            }
                        }
                    );
                }
                
                if (craneOpChart) {
                    // 크레인 운영 차트 (풍속 기준, 일출/일몰 시간 고려)
                    const craneWindData = generateRandomData(24, 2, 12);
                    const craneLabels = Array.from({length: 24}, (_, i) => `${i}시`);
                    
                    // 일출/일몰 시간 설정 (12월 기준)
                    const sunrise = 7; // 06:42 -> 7시로 반올림
                    const sunset = 17; // 17:28 -> 17시로 반올림
                    
                    charts.craneOperationChart = createChart(craneOpChart.getContext('2d'), 'bar',
                        craneLabels,
                        [{
                            label: '풍속 (m/s)',
                            data: craneWindData,
                            backgroundColor: craneWindData.map((wind, hour) => {
                                // 일출 전/일몰 후는 작업 불가 (회색)
                                if (hour < sunrise || hour >= sunset) {
                                    return 'rgba(156, 163, 175, 0.8)'; // 회색 (야간)
                                }
                                // 일광 시간대는 풍속에 따라 색상 결정
                                if (wind <= 5) return 'rgba(16, 185, 129, 0.8)';  // 안전 (녹색)
                                else if (wind <= 8) return 'rgba(245, 158, 11, 0.8)'; // 주의 (주황)
                                else return 'rgba(239, 68, 68, 0.8)';  // 위험 (빨강)
                            }),
                            borderColor: craneWindData.map((wind, hour) => {
                                if (hour < sunrise || hour >= sunset) {
                                    return 'rgb(156, 163, 175)';
                                }
                                if (wind <= 5) return 'rgb(16, 185, 129)';
                                else if (wind <= 8) return 'rgb(245, 158, 11)';
                                else return 'rgb(239, 68, 68)';
                            }),
                            borderWidth: 1
                        }],
                        {
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        afterLabel: function(context) {
                                            const hour = context.dataIndex;
                                            const wind = context.parsed.y;
                                            
                                            if (hour < sunrise || hour >= sunset) {
                                                return '야간 - 작업 불가';
                                            }
                                            
                                            if (wind <= 5) return '크레인 작업 안전';
                                            else if (wind <= 8) return '크레인 작업 주의';
                                            else return '크레인 작업 금지';
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    title: { display: true, text: '풍속 (m/s)' },
                                    max: 15
                                },
                                x: {
                                    title: { display: true, text: '시간 (일출: 07시, 일몰: 17시)' }
                                }
                            }
                        }
                    );
                }
                
                // 최적화 버튼 이벤트 리스너
                const optimizeBtn = document.getElementById('optimizeSchedule');
                if (optimizeBtn) {
                    optimizeBtn.addEventListener('click', function() {
                        // 최적화 실행 시뮬레이션
                        const maintenanceType = document.getElementById('maintenanceType').value;
                        const targetTurbine = document.getElementById('targetTurbine').value;
                        const priority = document.getElementById('priority').value;
                        
                        // 버튼 상태 변경 (로딩)
                        const optimizeIcon = document.getElementById('optimizeIcon');
                        const optimizeText = document.getElementById('optimizeText');
                        const resultsDiv = document.getElementById('optimizationResults');
                        
                        optimizeBtn.disabled = true;
                        optimizeIcon.className = 'fas fa-spinner fa-spin mr-2';
                        optimizeText.textContent = '최적화 중...';
                        
                        // 일출/일몰 시간을 고려한 최적 시간 계산
                        const sunrise = 7;
                        const sunset = 17;
                        
                        // 작업 유형별 소요 시간
                        const workDuration = {
                            'routine': 2,
                            'blade': 4,
                            'gearbox': 8,
                            'generator': 6,
                            'crane': 12
                        };
                        
                        const duration = workDuration[maintenanceType] || 4;
                        const optimalStartTime = Math.floor(Math.random() * (sunset - sunrise - duration)) + sunrise;
                        
                        // 시뮬레이션 지연
                        setTimeout(() => {
                            // 결과 계산
                            const avgWind = (Math.random() * 3 + 3).toFixed(1); // 3-6 m/s
                            const loss = (Math.random() * 2 + 1).toFixed(1); // 1-3M
                            const safety = Math.floor(Math.random() * 5 + 95); // 95-99%
                            
                            // 결과 업데이트
                            document.getElementById('recommendedTime').textContent = `내일 ${optimalStartTime.toString().padStart(2, '0')}:00`;
                            document.getElementById('expectedLoss').textContent = `₩${loss}M`;
                            document.getElementById('avgWindSpeed').textContent = `${avgWind} m/s`;
                            document.getElementById('safetyScore').textContent = `${safety}%`;
                            
                            // 결과 표시
                            resultsDiv.classList.remove('hidden');
                            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            
                            // 버튼 상태 복원
                            optimizeBtn.disabled = false;
                            optimizeIcon.className = 'fas fa-check mr-2';
                            optimizeText.textContent = '최적화 완료';
                            
                            // 3초 후 버튼 텍스트 원래대로
                            setTimeout(() => {
                                optimizeIcon.className = 'fas fa-cogs mr-2';
                                optimizeText.textContent = '최적 스케줄 생성';
                            }, 3000);
                            
                        }, 2000); // 2초 로딩 시뮬레이션
                    });
                }
            }

            // 2 Week Forecast Charts
            if (document.getElementById('s_2week-content')?.offsetParent !== null) { 
                // Total Plant - Weekly & Daily (통합 페이지)
                if (document.getElementById('2week-total-content')?.offsetParent !== null) {
                    // 주평균 차트
                    charts.twoWeekWeeklyTotalChart = createChart(document.getElementById('twoWeekWeeklyTotalChart')?.getContext('2d'), 'bar',
                        ['1주차', '2주차'], 
                        [{ label: '주간 총 발전량 (GWh)', data: [7.0, 7.5], backgroundColor: 'rgba(59, 130, 246, 0.6)'}]
                    );
                    
                    // 일평균 차트
                    charts.twoWeekDailyTotalChart = createChart(document.getElementById('twoWeekDailyTotalChart')?.getContext('2d'), 'line',
                        Array.from({length: 14}, (_, i) => `D+${i+1}`), 
                        [{ label: '일일 예상 발전량 (MWh)', data: generateRandomData(14, 720, 1440), borderColor: 'rgb(245, 158, 11)', tension: 0.1, fill: false }]
                    );
                }
                // Per Turbine (WTG #1 to #5)
                if (document.getElementById('s_2week-content')?.offsetParent !== null) {
                    // 터빈별 고정 데이터 (HTML KPI 값과 정확히 일치)
                    const turbineWeeklyData = {
                        1: [350, 375], // WTG #1: 1주차, 2주차 (MWh)
                        2: [355, 380], // WTG #2
                        3: [345, 370], // WTG #3
                        4: [360, 385], // WTG #4
                        5: [340, 365]  // WTG #5
                    };
                    
                    // 주간 데이터를 기반으로 일간 데이터 생성 (주평균을 7로 나누고 약간의 변동 추가)
                    const turbineDailyData = {};
                    for (let i = 1; i <= 5; i++) {
                        const week1Avg = turbineWeeklyData[i][0] / 7; // MWh를 일평균으로 변환
                        const week2Avg = turbineWeeklyData[i][1] / 7;
                        
                        // 14일간 데이터 생성 (주평균 기준으로 ±20% 변동)
                        const dailyData = [];
                        for (let day = 0; day < 14; day++) {
                            const baseValue = day < 7 ? week1Avg : week2Avg;
                            const variation = (Math.random() - 0.5) * 0.4; // ±20% 변동
                            const dailyValue = Math.max(20, baseValue * (1 + variation)); // 최소값 보장 (20MWh)
                            dailyData.push(Math.round(dailyValue)); // MWh 단위 유지
                        }
                        turbineDailyData[i] = dailyData;
                    }
                    
                    const dailyLabels = Array.from({length: 14}, (_, i) => `D+${i+1}`);
                    for (let i = 1; i <= 5; i++) {
                        const weeklyChartElement = document.getElementById(`wtg${i}WeeklyChart`);
                        const dailyChartElement = document.getElementById(`wtg${i}DailyChart`);
                        
                        if (weeklyChartElement) {
                            // Weekly Bar Chart for Turbine
                            charts[`wtg${i}WeeklyChart`] = createChart(weeklyChartElement.getContext('2d'), 'bar',
                                ['1주차', '2주차'],
                                [{ 
                                    label: `WTG #${i} 주간 (MWh)`, 
                                    data: turbineWeeklyData[i], 
                                    backgroundColor: `rgba(${50 + i*30}, ${100 + i*15}, ${150 - i*20}, 0.6)` 
                                }],
                                { 
                                    plugins: { legend: { display: false } }, 
                                    scales: { 
                                        y: { 
                                            beginAtZero: true,
                                            max: 400,
                                            ticks: { font: { size: 10 }}
                                        }
                                    }
                                }
                            );
                        }
                        
                        if (dailyChartElement) {
                            // Daily Line Chart for Turbine
                            charts[`wtg${i}DailyChart`] = createChart(dailyChartElement.getContext('2d'), 'line',
                                dailyLabels,
                                [{ 
                                    label: `WTG #${i} 일간 (MWh)`, 
                                    data: turbineDailyData[i],
                                    borderColor: `rgb(${50 + i*30}, ${100 + i*15}, ${150 - i*20})`,
                                    tension: 0.2,
                                    fill: false,
                                    borderWidth: 2
                                }],
                                {
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: { font: { size: 10 }}
                                        },
                                        x: {
                                            ticks: { font: { size: 9 }}
                                        }
                                    }
                                }
                            );
                        }
                    }
                }
                // Maintenance Schedule (within 2week section)
                if (document.getElementById('s_2week-content')?.offsetParent !== null) {
                    // 정비 스케줄 차트는 사용자가 최적화를 실행할 때 생성됨
                }
            }
            
            // Long-term Forecast Charts (3month only)
            if (document.getElementById('longterm-content')?.offsetParent !== null) {
                // 3 Month Forecast Charts
                if (document.getElementById('longterm-3month-content')?.offsetParent !== null) {
                    // 발전량 예측 차트들
                    charts.threeMonthMonthlyChart = createChart(document.getElementById('threeMonthMonthlyChart')?.getContext('2d'), 'bar',
                        ['1개월차', '2개월차', '3개월차'],
                        [{ label: '월간 총 발전량 (GWh)', data: [30, 32, 28], backgroundColor: 'rgba(134, 25, 143, 0.6)'}]
                    );
                    
                    charts.threeMonthWeeklyChart = createChart(document.getElementById('threeMonthWeeklyChart')?.getContext('2d'), 'line',
                        Array.from({length: 12}, (_, i) => `${i+1}주차`),
                        [{ label: '주간 예상 발전량 (GWh)', data: generateRandomData(12, 6, 9, 1), borderColor: 'rgb(14, 116, 144)', tension: 0.1, fill: false }]
                    );
                    
                    // 기상 예측 박스플롯 차트들
                    const weekLabels = Array.from({length: 12}, (_, i) => `${i+1}주차`);
                    
                    // Box plot 데이터 생성 함수
                    const generateBoxplotData = (min, max) => {
                        const range = max - min;
                        const q1 = min + range * 0.25;
                        const median = min + range * 0.5;
                        const q3 = min + range * 0.75;
                        return {
                            min: min + Math.random() * range * 0.1,
                            q1: q1 + (Math.random() - 0.5) * range * 0.1,
                            median: median + (Math.random() - 0.5) * range * 0.1,
                            q3: q3 + (Math.random() - 0.5) * range * 0.1,
                            max: max - Math.random() * range * 0.1
                        };
                    };
                    
                    // 풍속 박스플롯 (다양한 케이스)
                    const windspeedPattern = [
                        { type: 'optimal', range: [6, 12], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 중간풍
                        { type: 'weak', range: [3, 6], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 약풍
                        { type: 'optimal', range: [6, 12], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 중간풍
                        { type: 'strong', range: [12, 18], color: 'rgba(59, 130, 246, 0.6)', borderColor: 'rgb(59, 130, 246)' }, // 강풍
                        { type: 'optimal', range: [6, 12], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 중간풍
                        { type: 'weak', range: [3, 6], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 약풍
                        { type: 'optimal', range: [6, 12], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 중간풍
                        { type: 'very_strong', range: [15, 22], color: 'rgba(139, 92, 246, 0.6)', borderColor: 'rgb(139, 92, 246)' }, // 매우 강풍
                        { type: 'optimal', range: [6, 12], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 중간풍
                        { type: 'strong', range: [12, 18], color: 'rgba(59, 130, 246, 0.6)', borderColor: 'rgb(59, 130, 246)' }, // 강풍
                        { type: 'calm', range: [0, 3], color: 'rgba(239, 68, 68, 0.6)', borderColor: 'rgb(239, 68, 68)' }, // 매우 약풍
                        { type: 'optimal', range: [6, 12], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' } // 중간풍
                    ];
                    
                    const windspeedBoxData = windspeedPattern.map(caseType => {
                        return generateBoxplotData(caseType.range[0], caseType.range[1]);
                    });
                    
                    const windspeedColors = windspeedPattern.map(caseType => caseType.color);
                    const windspeedBorderColors = windspeedPattern.map(caseType => caseType.borderColor);
                    
                    charts.windspeedBoxplotChart = new Chart(document.getElementById('windspeedBoxplotChart')?.getContext('2d'), {
                        type: 'boxplot',
                        data: {
                            labels: weekLabels,
                            datasets: [{
                                label: '풍속 분포',
                                data: windspeedBoxData,
                                backgroundColor: windspeedColors,
                                borderColor: windspeedBorderColors,
                                borderWidth: 2,
                                outlierColor: windspeedBorderColors,
                                outlierRadius: 3
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            onClick: (event, elements) => {
                                if (elements.length > 0) {
                                    const weekIndex = elements[0].index;
                                    showWeatherDetail(weekIndex + 1);
                                }
                            },
                            scales: {
                                y: {
                                    title: { display: true, text: '풍속 (m/s)' },
                                    beginAtZero: true
                                }
                            },
                            plugins: {
                                legend: { display: false }
                            }
                        }
                    });
                    
                    // 기온 박스플롯 (적정 기온이 70%로 최고 확률 → 녹색)
                    const temperatureBoxData = weekLabels.map(() => generateBoxplotData(-5, 30));
                    charts.temperatureBoxplotChart = new Chart(document.getElementById('temperatureBoxplotChart')?.getContext('2d'), {
                        type: 'boxplot',
                        data: {
                            labels: weekLabels,
                            datasets: [{
                                label: '기온 분포',
                                data: temperatureBoxData,
                                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                                borderColor: 'rgb(16, 185, 129)',
                                borderWidth: 2,
                                outlierColor: 'rgb(16, 185, 129)',
                                outlierRadius: 3
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            onClick: (event, elements) => {
                                if (elements.length > 0) {
                                    const weekIndex = elements[0].index;
                                    showWeatherDetail(weekIndex + 1);
                                }
                            },
                            scales: {
                                y: {
                                    title: { display: true, text: '기온 (℃)' }
                                }
                            },
                            plugins: {
                                legend: { display: false }
                            }
                        }
                    });
                    
                    // 파고 박스플롯 (다양한 케이스)
                    const wavePattern = [
                        { type: 'normal', range: [0.8, 1.3], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 보통
                        { type: 'low', range: [0.3, 0.7], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 낮음
                        { type: 'normal', range: [0.8, 1.3], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 보통
                        { type: 'high', range: [1.4, 2.2], color: 'rgba(239, 68, 68, 0.6)', borderColor: 'rgb(239, 68, 68)' }, // 높음
                        { type: 'normal', range: [0.8, 1.3], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 보통
                        { type: 'low', range: [0.3, 0.7], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 낮음
                        { type: 'normal', range: [0.8, 1.3], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 보통
                        { type: 'very_high', range: [2.0, 3.2], color: 'rgba(220, 38, 127, 0.6)', borderColor: 'rgb(220, 38, 127)' }, // 매우 높음
                        { type: 'normal', range: [0.8, 1.3], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 보통
                        { type: 'high', range: [1.4, 2.2], color: 'rgba(239, 68, 68, 0.6)', borderColor: 'rgb(239, 68, 68)' }, // 높음
                        { type: 'calm', range: [0.1, 0.4], color: 'rgba(34, 197, 94, 0.6)', borderColor: 'rgb(34, 197, 94)' }, // 매우 낮음
                        { type: 'normal', range: [0.8, 1.3], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' } // 보통
                    ];
                    
                    const waveBoxData = wavePattern.map(caseType => {
                        return generateBoxplotData(caseType.range[0], caseType.range[1]);
                    });
                    
                    const waveColors = wavePattern.map(caseType => caseType.color);
                    const waveBorderColors = wavePattern.map(caseType => caseType.borderColor);
                    
                    charts.waveBoxplotChart = new Chart(document.getElementById('waveBoxplotChart')?.getContext('2d'), {
                        type: 'boxplot',
                        data: {
                            labels: weekLabels,
                            datasets: [{
                                label: '파고 분포',
                                data: waveBoxData,
                                backgroundColor: waveColors,
                                borderColor: waveBorderColors,
                                borderWidth: 2,
                                outlierColor: waveBorderColors,
                                outlierRadius: 3
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            onClick: (event, elements) => {
                                if (elements.length > 0) {
                                    const weekIndex = elements[0].index;
                                    showWeatherDetail(weekIndex + 1);
                                }
                            },
                            scales: {
                                y: {
                                    title: { display: true, text: '파고 (m)' },
                                    beginAtZero: true
                                }
                            },
                            plugins: {
                                legend: { display: false }
                            }
                        }
                    });



                }
            }

            // Details Chart
            if (document.getElementById('details-content')?.offsetParent !== null) {
                charts.probabilityDistributionChart = createChart(document.getElementById('probabilityDistributionChart')?.getContext('2d'), 'bar',
                    ['낮음', '보통', '높음', '매우 높음'],
                    [{ label: '발전량 확률 (%)', data: [15, 45, 30, 10], backgroundColor: 'rgba(234, 179, 8, 0.6)'}]
                );
            }
        };
        
        document.addEventListener('DOMContentLoaded', () => {
            const sidebarItems = document.querySelectorAll('.sidebar-item');
            const contentSections = document.querySelectorAll('.content-section');
            const mainTitle = document.getElementById('main-title');
            // setActiveSection 함수 내에서 '2week' 클릭시 터빈별 예측(div id="2week-turbine-content")이 기본 노출되도록 수정
            const setActiveSection = (targetId) => {
                const activeSidebarItem = document.querySelector(`.sidebar-item[data-target="${targetId}"]`);
                if (activeSidebarItem) {
                    mainTitle.textContent = activeSidebarItem.textContent.trim();
                }
        
                contentSections.forEach(section => {
                    const isTargetSection = section.id === `${targetId}-content` || section.id === `s_${targetId}-content`;
                    section.classList.toggle('hidden', !isTargetSection);
                });
        
                // 단기예측이면 발전소 전체 예측 탭 활성화
                if (targetId === 'shortterm') {
                    // 메인탭: 발전소 전체 예측 탭(id="shortterm-total-tab") 클릭 효과
                    const mainTabs = document.querySelectorAll('#shorttermMainTabs .tab-button');
                    mainTabs.forEach(tab => {
                        tab.classList.remove('active');
                        tab.setAttribute('aria-selected', 'false');
                    });
                    const totalTab = document.getElementById('shortterm-total-tab');
                    if (totalTab) {
                        totalTab.classList.add('active');
                        totalTab.setAttribute('aria-selected', 'true');
                    }
        
                    // 모든 main-tab-panel 숨김, 발전소 전체 예측만 노출
                    const mainTabPanels = document.querySelectorAll('#shortterm-content .main-tab-panel');
                    mainTabPanels.forEach(panel => {
                        panel.classList.add('hidden');
                    });
                    const totalPanel = document.getElementById('shortterm-total-content');
                    if (totalPanel) {
                        totalPanel.classList.remove('hidden');
                    }
                }
        
                // 2주 예측이면 발전소 전체 예측 탭 활성화
                if (targetId === '2week') {
                    // 메인탭: 발전소 전체 예측 탭(id="2week-total-tab") 클릭 효과
                    const mainTabs = document.querySelectorAll('#twoWeekMainTabs .tab-button');
                    mainTabs.forEach(tab => {
                        tab.classList.remove('active');
                        tab.setAttribute('aria-selected', 'false');
                    });
                    const totalTab = document.getElementById('2week-total-tab');
                    if (totalTab) {
                        totalTab.classList.add('active');
                        totalTab.setAttribute('aria-selected', 'true');
                    }
        
                    // 모든 main-tab-panel 숨김, 발전소 전체 예측만 노출
                    const mainTabPanels = document.querySelectorAll('#s_2week-content .main-tab-panel');
                    mainTabPanels.forEach(panel => {
                        panel.classList.add('hidden');
                    });
                    const totalPanel = document.getElementById('2week-total-content');
                    if (totalPanel) {
                        totalPanel.classList.remove('hidden');
                    }
                }
                
                // 장기예측은 3개월 예측만 있으므로 별도 처리 불필요
        
                initChartsForCurrentView();
            };

            sidebarItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    sidebarItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    const targetId = item.getAttribute('data-target');
                    setActiveSection(targetId);
                });
            });

            const setupTabs = (tabContainerSelector, parentOfPanelsSelector, panelChildClassName, defaultActiveIndex = 0) => {
                console.log('setupTabs called:', tabContainerSelector, parentOfPanelsSelector, panelChildClassName);
                const tabs = document.querySelectorAll(`${tabContainerSelector} [role="tab"]`);
                const panelParentElement = document.querySelector(parentOfPanelsSelector);
                
                console.log('Found tabs:', tabs.length, 'Panel parent:', panelParentElement);
                
                if (!panelParentElement) {
                    console.warn(`Tab panel parent container not found: ${parentOfPanelsSelector}`);
                    return;
                }
                const panels = Array.from(panelParentElement.children).filter(child => child.classList.contains(panelChildClassName));
                console.log('Found panels:', panels.length);

                if (tabs.length === 0) {
                    // console.warn(`No tabs found for container: ${tabContainerSelector}`);
                    return;
                }
                // It's okay if panels are not found for sub-tabs if the main tab is not active yet.
                // Only warn if panels are missing for the main tab container itself.
                if (panels.length === 0 && parentOfPanelsSelector === '#s_2week-content') { 
                    // console.warn(`No panels found with class '${panelChildClassName}' in parent '${parentOfPanelsSelector}' for main tabs.`);
                }

                tabs.forEach((tab, index) => {
                    tab.addEventListener('click', (e) => {
                        e.preventDefault(); 
                        console.log('Tab clicked:', tab.id, 'Target:', tab.getAttribute('data-tabs-target'));
                        
                        tabs.forEach(t => {
                            t.classList.remove('active');
                            t.setAttribute('aria-selected', 'false');
                        });
                        tab.classList.add('active');
                        tab.setAttribute('aria-selected', 'true');

                        panels.forEach(panel => {
                            panel.classList.add('hidden');
                        });
                        const targetPanelId = tab.getAttribute('data-tabs-target');
                        const targetPanel = document.querySelector(targetPanelId);
                        if (targetPanel) {
                            targetPanel.classList.remove('hidden');
                            console.log('Panel shown:', targetPanelId);
                        } else {
                            console.log('Panel not found:', targetPanelId);
                        }

                        // 단기예측 터빈별 예측 탭 클릭 시 일평균 예측 서브탭 활성화
                        if (tab.id === 'shortterm-turbine-tab') {
                            // 서브탭 초기화
                            const subTabs = document.querySelectorAll('#shorttermSubTabsTurbine .sub-tab-button');
                            subTabs.forEach(subTab => {
                                subTab.classList.remove('active');
                                subTab.setAttribute('aria-selected', 'false');
                            });
                            
                            // 일평균 예측 서브탭 활성화
                            const dailyTab = document.getElementById('shortterm-daily-turbine-tab');
                            if (dailyTab) {
                                dailyTab.classList.add('active');
                                dailyTab.setAttribute('aria-selected', 'true');
                            }
                            
                            // 서브탭 패널 초기화
                            const subPanels = document.querySelectorAll('#shorttermSubTabsTurbineContent .sub-tab-panel-item');
                            subPanels.forEach(panel => {
                                panel.classList.add('hidden');
                            });
                            
                            // 일평균 예측 패널 활성화
                            const dailyPanel = document.getElementById('shortterm-daily-turbine');
                            if (dailyPanel) {
                                dailyPanel.classList.remove('hidden');
                            }
                        }

                        // 중기예측 터빈별 예측 탭 클릭 시 기본 설정
                        if (tab.id === '2week-turbine-tab') {
                            // 터빈별 예측 탭이 활성화될 때 차트 초기화를 위해 약간의 지연 후 차트 생성
                            setTimeout(() => {
                                initChartsForCurrentView();
                            }, 100);
                        }

                        // 중기예측 정비 스케줄 최적화 탭 클릭 시 기본 설정
                        if (tab.id === '2week-maintenance-tab') {
                            // 정비 스케줄 탭이 활성화될 때 차트 초기화를 위해 약간의 지연 후 차트 생성
                            setTimeout(() => {
                                initChartsForCurrentView();
                            }, 100);
                        }

                        initChartsForCurrentView();
                    });
                });
                
                if (tabs.length > defaultActiveIndex) {
                    tabs.forEach((tab, index) => {
                        const isActive = (index === defaultActiveIndex);
                        tab.classList.toggle('active', isActive);
                        tab.setAttribute('aria-selected', isActive.toString());
                        
                        const targetPanelId = tab.getAttribute('data-tabs-target');
                        const panelToShow = panels.find(p => p.id === targetPanelId.substring(1));
                        panels.forEach(p => { // Make sure all panels are handled
                            if (p === panelToShow) {
                                p.classList.remove('hidden');
                            } else {
                                p.classList.add('hidden');
                            }
                        });
                    });
                }
            };
            
            console.log('Setting up tabs...');
            setupTabs('#twoWeekMainTabs', '#s_2week-content', 'main-tab-panel', 0); 
            setupTabs('#shorttermMainTabs', '#shortterm-content', 'main-tab-panel', 0);
            setupTabs('#shorttermSubTabsTurbine', '#shorttermSubTabsTurbineContent', 'sub-tab-panel-item', 0);
            // 장기예측은 탭이 없으므로 setupTabs 불필요
            console.log('Tabs setup completed.');

            // 중기예측 탭 수동 이벤트 추가 (백업)
            const twoWeekTotalTab = document.getElementById('2week-total-tab');
            const twoWeekTurbineTab = document.getElementById('2week-turbine-tab');
            const twoWeekMaintenanceTab = document.getElementById('2week-maintenance-tab');

            if (twoWeekTotalTab) {
                twoWeekTotalTab.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Manual: Total tab clicked');
                    document.querySelectorAll('#s_2week-content .main-tab-panel').forEach(panel => panel.classList.add('hidden'));
                    document.getElementById('2week-total-content')?.classList.remove('hidden');
                    document.querySelectorAll('#twoWeekMainTabs .tab-button').forEach(tab => {
                        tab.classList.remove('active');
                        tab.setAttribute('aria-selected', 'false');
                    });
                    twoWeekTotalTab.classList.add('active');
                    twoWeekTotalTab.setAttribute('aria-selected', 'true');
                    initChartsForCurrentView();
                });
            }

            if (twoWeekTurbineTab) {
                twoWeekTurbineTab.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Manual: Turbine tab clicked');
                    document.querySelectorAll('#s_2week-content .main-tab-panel').forEach(panel => panel.classList.add('hidden'));
                    document.getElementById('2week-turbine-content')?.classList.remove('hidden');
                    document.querySelectorAll('#twoWeekMainTabs .tab-button').forEach(tab => {
                        tab.classList.remove('active');
                        tab.setAttribute('aria-selected', 'false');
                    });
                    twoWeekTurbineTab.classList.add('active');
                    twoWeekTurbineTab.setAttribute('aria-selected', 'true');
                    initChartsForCurrentView();
                });
            }

            if (twoWeekMaintenanceTab) {
                twoWeekMaintenanceTab.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Manual: Maintenance tab clicked');
                    document.querySelectorAll('#s_2week-content .main-tab-panel').forEach(panel => panel.classList.add('hidden'));
                    document.getElementById('2week-maintenance-content')?.classList.remove('hidden');
                    document.querySelectorAll('#twoWeekMainTabs .tab-button').forEach(tab => {
                        tab.classList.remove('active');
                        tab.setAttribute('aria-selected', 'false');
                    });
                    twoWeekMaintenanceTab.classList.add('active');
                    twoWeekMaintenanceTab.setAttribute('aria-selected', 'true');
                    initChartsForCurrentView();
                });
            }

            // 로고 클릭 시 메인화면(개요)으로 이동
            const logoLink = document.getElementById('logo-link');
            logoLink.addEventListener('click', (e) => {
                e.preventDefault();
                setActiveSection('overview');
            });

            const initialTarget = 'overview';
            document.querySelector(`.sidebar-item[data-target="${initialTarget}"]`).classList.add('active');
            setActiveSection(initialTarget);
            
            // 오늘 기상예보 초기화
            initTodayWeather();
            
            // 기상예측 초기화
            initWeatherForecast();

            // 풍속 구간별 분포 토글 함수
            window.toggleWindspeedDistribution = function() {
                const content = document.getElementById('windspeedDistributionContent');
                const icon = document.getElementById('windspeedDistributionIcon');
                
                if (content.classList.contains('hidden')) {
                    content.classList.remove('hidden');
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    content.classList.add('hidden');
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                    icon.style.transform = 'rotate(0deg)';
                }
            };

            // 터빈 가동률 조정 계획 토글 함수
            window.toggleTurbineOperation = function() {
                const content = document.getElementById('turbineOperationContent');
                const icon = document.getElementById('turbineOperationIcon');
                
                if (content.classList.contains('hidden')) {
                    content.classList.remove('hidden');
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    content.classList.add('hidden');
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                    icon.style.transform = 'rotate(0deg)';
                }
            };

            // 정비 스케줄 최적화 기능
            initMaintenanceScheduler();
            
            // 기상 상세 모달 기능
            window.showWeatherDetail = function(weekNumber) {
                const modal = document.getElementById('weatherDetailModal');
                const title = document.getElementById('modalTitle');
                title.textContent = `${weekNumber}주차 상세 기상 정보`;
                
                createModalCharts(weekNumber);
                modal.classList.remove('hidden');
            };
            
            window.closeWeatherModal = function() {
                const modal = document.getElementById('weatherDetailModal');
                modal.classList.add('hidden');
                
                ['modalWindspeedChart', 'modalTemperatureChart', 'modalWaveChart'].forEach(chartId => {
                    if (charts[chartId]) {
                        charts[chartId].destroy();
                        delete charts[chartId];
                    }
                });
            };
            
            function createModalCharts(weekNumber) {
                // 주차별 데이터 매핑 (박스플롯과 일치)
                const weekData = {
                    1: { windAvg: 9.2, windOptimal: 65, windLow: 5, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 1.0, waveSafe: 45, waveHigh: 15 },
                    2: { windAvg: 4.5, windOptimal: 25, windLow: 60, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 0.5, waveSafe: 70, waveHigh: 5 },
                    3: { windAvg: 8.8, windOptimal: 60, windLow: 10, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 1.1, waveSafe: 40, waveHigh: 20 },
                    4: { windAvg: 15.2, windOptimal: 30, windLow: 5, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 1.8, waveSafe: 20, waveHigh: 60 },
                    5: { windAvg: 9.0, windOptimal: 55, windLow: 15, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 1.0, waveSafe: 45, waveHigh: 15 },
                    6: { windAvg: 4.8, windOptimal: 30, windLow: 55, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 0.5, waveSafe: 65, waveHigh: 10 },
                    7: { windAvg: 8.5, windOptimal: 50, windLow: 20, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 1.0, waveSafe: 45, waveHigh: 15 },
                    8: { windAvg: 18.5, windOptimal: 20, windLow: 2, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 2.6, waveSafe: 10, waveHigh: 80 },
                    9: { windAvg: 9.1, windOptimal: 60, windLow: 10, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 1.0, waveSafe: 45, waveHigh: 15 },
                    10: { windAvg: 14.8, windOptimal: 35, windLow: 5, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 1.7, waveSafe: 25, waveHigh: 55 },
                    11: { windAvg: 1.8, windOptimal: 5, windLow: 85, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 0.25, waveSafe: 90, waveHigh: 2 },
                    12: { windAvg: 8.7, windOptimal: 55, windLow: 15, tempAvg: 18.5, tempOptimal: 70, tempHigh: 15, waveAvg: 1.0, waveSafe: 45, waveHigh: 15 }
                };
                
                const data = weekData[weekNumber] || weekData[1];
                
                charts.modalWindspeedChart = createChart(document.getElementById('modalWindspeedChart')?.getContext('2d'), 'doughnut',
                    ['매우 약풍 (0~3 m/s)', '약풍 (3~6 m/s)', '중간풍 (6~12 m/s)', '강풍 (12~18 m/s)', '매우 강풍 (>18 m/s)'],
                    [{
                        data: [data.windLow, 25, data.windOptimal, 15, 5],
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(139, 92, 246, 0.8)'
                        ]
                    }],
                    { plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }
                );
                
                charts.modalTemperatureChart = createChart(document.getElementById('modalTemperatureChart')?.getContext('2d'), 'doughnut',
                    ['저온 (< 5℃)', '적정 (5~25℃)', '고온 (> 30℃)'],
                    [{
                        data: [15, data.tempOptimal, data.tempHigh],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(239, 68, 68, 0.8)'
                        ]
                    }],
                    { plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }
                );
                
                charts.modalWaveChart = createChart(document.getElementById('modalWaveChart')?.getContext('2d'), 'doughnut',
                    ['낮음 (< 0.8m)', '보통 (0.8~1.3m)', '높음 (> 1.3m)'],
                    [{
                        data: [data.waveSafe, 45, data.waveHigh],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(239, 68, 68, 0.8)'
                        ]
                    }],
                    { plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }
                );
                
                document.getElementById('windspeedStats').innerHTML = `
                    <div class="text-blue-600"><strong>평균:</strong> ${data.windAvg} m/s</div>
                    <div class="text-green-600"><strong>최적 발전:</strong> ${data.windOptimal}%</div>
                    <div class="text-red-600"><strong>발전 불가:</strong> ${data.windLow}%</div>
                `;
                
                document.getElementById('temperatureStats').innerHTML = `
                    <div class="text-blue-600"><strong>평균:</strong> ${data.tempAvg}℃</div>
                    <div class="text-green-600"><strong>최적 조건:</strong> ${data.tempOptimal}%</div>
                    <div class="text-red-600"><strong>고온 주의:</strong> ${data.tempHigh}%</div>
                `;
                
                document.getElementById('waveStats').innerHTML = `
                    <div class="text-blue-600"><strong>평균:</strong> ${data.waveAvg}m</div>
                    <div class="text-green-600"><strong>작업 안전:</strong> ${data.waveSafe}%</div>
                    <div class="text-red-600"><strong>작업 제한:</strong> ${data.waveHigh}%</div>
                `;
            }
        });


        function initMaintenanceScheduler() {
            let maintenancePlans = [];
            
            // 터빈별 2주 예측 데이터 (실제로는 2주 예측 페이지에서 가져와야 함)
            const turbineData = {
                wtg1: [52, 48, 55, 51, 49, 53, 50, 54, 47, 52, 51, 48, 53, 50],
                wtg2: [51, 49, 54, 50, 52, 51, 48, 53, 50, 51, 49, 52, 50, 51],
                wtg3: [53, 50, 52, 54, 48, 51, 52, 50, 53, 49, 51, 50, 52, 53],
                wtg4: [50, 52, 51, 49, 53, 50, 51, 52, 48, 54, 50, 51, 49, 52],
                wtg5: [52, 51, 50, 53, 50, 52, 54, 48, 51, 50, 52, 53, 51, 50]
            };

            // 정비 계획 추가
            document.getElementById('addMaintenanceBtn').addEventListener('click', () => {
                const turbine = document.getElementById('maintenanceTurbine').value;
                const duration = parseInt(document.getElementById('maintenanceDuration').value);
                const priority = document.getElementById('maintenancePriority').value;

                if (!turbine) {
                    alert('터빈을 선택해주세요.');
                    return;
                }

                const plan = {
                    id: Date.now(),
                    turbine: turbine,
                    turbineName: document.getElementById('maintenanceTurbine').selectedOptions[0].text,
                    duration: duration,
                    durationText: document.getElementById('maintenanceDuration').selectedOptions[0].text,
                    priority: priority,
                    priorityText: document.getElementById('maintenancePriority').selectedOptions[0].text,
                    optimizedDay: null
                };

                maintenancePlans.push(plan);
                updateMaintenanceList();
                
                // 폼 초기화
                document.getElementById('maintenanceTurbine').value = '';
                document.getElementById('maintenanceDuration').value = '4';
                document.getElementById('maintenancePriority').value = 'low';
            });

            // 최적 스케줄 생성
            document.getElementById('optimizeScheduleBtn').addEventListener('click', () => {
                if (maintenancePlans.length === 0) {
                    alert('정비 계획을 먼저 추가해주세요.');
                    return;
                }

                optimizeMaintenanceSchedule();
                updateLossAnalysis();
                updateOptimizedSchedule();
                updateMaintenanceChart();
            });

            // 초기화
            document.getElementById('clearScheduleBtn').addEventListener('click', () => {
                if (confirm('모든 정비 계획을 삭제하시겠습니까?')) {
                    maintenancePlans = [];
                    updateMaintenanceList();
                    clearResults();
                }
            });

            function updateMaintenanceList() {
                const listContainer = document.getElementById('maintenanceList');
                
                if (maintenancePlans.length === 0) {
                    listContainer.innerHTML = `
                        <div class="text-gray-500 text-center py-4">
                            <i class="fas fa-clipboard-list text-3xl mb-2"></i>
                            <p>등록된 정비 계획이 없습니다.</p>
                        </div>
                    `;
                    return;
                }

                listContainer.innerHTML = maintenancePlans.map(plan => `
                    <div class="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                        <div class="flex items-center space-x-4">
                            <div class="flex-shrink-0">
                                <i class="fas fa-wrench text-blue-500 text-xl"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-900">${plan.turbineName}</h4>
                                <p class="text-sm text-gray-600">${plan.durationText} | ${plan.priorityText}</p>
                                ${plan.optimizedDay ? `<p class="text-sm text-green-600"><i class="fas fa-calendar-check mr-1"></i>최적 일정: ${plan.optimizedDay}일차</p>` : ''}
                            </div>
                        </div>
                        <button onclick="removePlan(${plan.id})" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }

            function optimizeMaintenanceSchedule() {
                // 간단한 최적화 알고리즘: 각 터빈의 발전량이 가장 낮은 날을 선택
                maintenancePlans.forEach(plan => {
                    const turbineKey = plan.turbine;
                    const data = turbineData[turbineKey];
                    const durationDays = Math.ceil(plan.duration / 24);
                    
                    let bestStartDay = 0;
                    let minLoss = Infinity;
                    
                    // 가능한 모든 시작일에 대해 손실 계산
                    for (let startDay = 0; startDay <= 14 - durationDays; startDay++) {
                        let loss = 0;
                        for (let i = 0; i < durationDays; i++) {
                            loss += data[startDay + i];
                        }
                        
                        if (loss < minLoss) {
                            minLoss = loss;
                            bestStartDay = startDay + 1; // 1부터 시작하는 일차
                        }
                    }
                    
                    plan.optimizedDay = bestStartDay;
                    plan.estimatedLoss = minLoss;
                });

                // 우선순위에 따라 정렬
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                maintenancePlans.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            }

            function updateLossAnalysis() {
                const totalLoss = maintenancePlans.reduce((sum, plan) => sum + (plan.estimatedLoss || 0), 0);
                const avgDailyGeneration = Object.values(turbineData).flat().reduce((a, b) => a + b, 0) / (5 * 14);
                const lossPercentage = ((totalLoss / (avgDailyGeneration * 14)) * 100).toFixed(1);

                document.getElementById('lossAnalysis').innerHTML = `
                    <div class="space-y-4">
                        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h4 class="font-semibold text-red-800 mb-2">
                                <i class="fas fa-exclamation-triangle mr-2"></i>예상 발전량 손실
                            </h4>
                            <p class="text-2xl font-bold text-red-600">${totalLoss.toFixed(0)} MWh</p>
                            <p class="text-sm text-red-600">전체 발전량의 ${lossPercentage}%</p>
                        </div>
                        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 class="font-semibold text-blue-800 mb-2">
                                <i class="fas fa-info-circle mr-2"></i>최적화 효과
                            </h4>
                            <p class="text-sm text-blue-700">• 발전량 손실 최소화 달성</p>
                            <p class="text-sm text-blue-700">• 우선순위 기반 스케줄링</p>
                            <p class="text-sm text-blue-700">• 터빈별 최적 정비 시점 선정</p>
                        </div>
                    </div>
                `;
            }

            function updateOptimizedSchedule() {
                const scheduleHtml = maintenancePlans.map(plan => {
                    const priorityColors = {
                        critical: 'bg-red-100 border-red-300 text-red-800',
                        high: 'bg-orange-100 border-orange-300 text-orange-800',
                        medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
                        low: 'bg-green-100 border-green-300 text-green-800'
                    };

                    return `
                        <div class="p-4 border rounded-lg ${priorityColors[plan.priority]}">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-semibold">${plan.turbineName}</h4>
                                <span class="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                                    ${plan.priorityText}
                                </span>
                            </div>
                            <p class="text-sm mb-1">
                                <i class="fas fa-calendar mr-2"></i>권장 시작일: ${plan.optimizedDay}일차
                            </p>
                            <p class="text-sm mb-1">
                                <i class="fas fa-clock mr-2"></i>소요 시간: ${plan.durationText}
                            </p>
                            <p class="text-sm">
                                <i class="fas fa-chart-line mr-2"></i>예상 손실: ${(plan.estimatedLoss || 0).toFixed(0)} MWh
                            </p>
                        </div>
                    `;
                }).join('');

                document.getElementById('optimizedSchedule').innerHTML = scheduleHtml;
            }

            function updateMaintenanceChart() {
                const ctx = document.getElementById('maintenanceScheduleChart').getContext('2d');
                
                if (charts.maintenanceScheduleChart) {
                    charts.maintenanceScheduleChart.destroy();
                }

                const days = Array.from({length: 14}, (_, i) => `${i+1}일`);
                
                // 전체 발전소 일별 총 발전량 계산 (정비 전)
                const totalDailyGeneration = days.map((_, dayIndex) => {
                    return Object.values(turbineData).reduce((sum, turbineDaily) => sum + turbineDaily[dayIndex], 0);
                });

                // 정비 후 발전량 계산 (정비로 인한 손실 반영)
                const totalDailyGenerationAfterMaintenance = [...totalDailyGeneration];
                const maintenanceImpact = new Array(14).fill(0);
                
                maintenancePlans.forEach(plan => {
                    if (plan.optimizedDay) {
                        const startDay = plan.optimizedDay - 1;
                        const durationDays = Math.ceil(plan.duration / 24);
                        
                        for (let i = 0; i < durationDays && startDay + i < 14; i++) {
                            const dayIndex = startDay + i;
                            const lossAmount = turbineData[plan.turbine][dayIndex];
                            totalDailyGenerationAfterMaintenance[dayIndex] -= lossAmount;
                            maintenanceImpact[dayIndex] += lossAmount;
                        }
                    }
                });

                const datasets = [
                    {
                        label: '정비 전 총 발전량',
                        data: totalDailyGeneration,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 2,
                        type: 'bar',
                        order: 2
                    },
                    {
                        label: '정비 후 총 발전량',
                        data: totalDailyGenerationAfterMaintenance,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 2,
                        type: 'bar',
                        order: 3
                    },
                    {
                        label: '정비로 인한 발전량 손실',
                        data: maintenanceImpact,
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        borderColor: 'rgb(239, 68, 68)',
                        borderWidth: 2,
                        type: 'bar',
                        order: 1
                    }
                ];

                // 정비 일정 표시를 위한 배경 영역
                const maintenanceAnnotations = {};
                maintenancePlans.forEach((plan, index) => {
                    if (plan.optimizedDay) {
                        const startDay = plan.optimizedDay - 1;
                        const durationDays = Math.ceil(plan.duration / 24);
                        const colors = ['#FEE2E2', '#FEF3C7', '#DBEAFE', '#F3E8FF', '#ECFDF5'];
                        
                        maintenanceAnnotations[`maintenance${index}`] = {
                            type: 'box',
                            xMin: startDay - 0.4,
                            xMax: startDay + durationDays - 0.6,
                            yMin: 0,
                            yMax: Math.max(...totalDailyGeneration) * 1.1,
                            backgroundColor: colors[index % colors.length],
                            borderColor: 'rgba(239, 68, 68, 0.5)',
                            borderWidth: 1,
                            label: {
                                content: `${plan.turbineName} 정비`,
                                enabled: true,
                                position: 'top'
                            }
                        };
                    }
                });

                charts.maintenanceScheduleChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: days,
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            title: {
                                display: true,
                                text: '정비 스케줄에 따른 발전량 영향 분석',
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            },
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    usePointStyle: true,
                                    padding: 20
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    afterBody: function(context) {
                                        const dayIndex = context[0].dataIndex;
                                        const loss = maintenanceImpact[dayIndex];
                                        if (loss > 0) {
                                            const lossPercentage = ((loss / totalDailyGeneration[dayIndex]) * 100).toFixed(1);
                                            return [`발전량 손실: ${loss.toFixed(0)} MWh (${lossPercentage}%)`];
                                        }
                                        return [];
                                    }
                                }
                            },
                            annotation: {
                                annotations: maintenanceAnnotations
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: '일차',
                                    font: {
                                        size: 14,
                                        weight: 'bold'
                                    }
                                },
                                grid: {
                                    display: true,
                                    color: 'rgba(0, 0, 0, 0.1)'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: '발전량 (MWh)',
                                    font: {
                                        size: 14,
                                        weight: 'bold'
                                    }
                                },
                                beginAtZero: true,
                                grid: {
                                    display: true,
                                    color: 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return value.toFixed(0) + ' MWh';
                                    }
                                }
                            }
                        }
                    }
                });

                // 차트 하단에 상세 분석 정보 업데이트
                updateChartAnalysis(totalDailyGeneration, totalDailyGenerationAfterMaintenance, maintenanceImpact);
            }

            function updateChartAnalysis(beforeMaintenance, afterMaintenance, impact) {
                const totalLossBefore = beforeMaintenance.reduce((a, b) => a + b, 0);
                const totalLossAfter = afterMaintenance.reduce((a, b) => a + b, 0);
                const totalImpact = impact.reduce((a, b) => a + b, 0);
                const impactPercentage = ((totalImpact / totalLossBefore) * 100).toFixed(1);
                
                const maxDailyLoss = Math.max(...impact);
                const maxLossDay = impact.indexOf(maxDailyLoss) + 1;
                const maxLossPercentage = ((maxDailyLoss / beforeMaintenance[maxLossDay - 1]) * 100).toFixed(1);

                const analysisHtml = `
                    <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 class="font-semibold text-blue-800 mb-2">
                                <i class="fas fa-chart-bar mr-2"></i>총 발전량 영향
                            </h4>
                            <p class="text-lg font-bold text-blue-600">${totalImpact.toFixed(0)} MWh 손실</p>
                            <p class="text-sm text-blue-600">전체 발전량의 ${impactPercentage}% 감소</p>
                        </div>
                        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h4 class="font-semibold text-red-800 mb-2">
                                <i class="fas fa-exclamation-triangle mr-2"></i>최대 일일 영향
                            </h4>
                            <p class="text-lg font-bold text-red-600">${maxLossDay}일차</p>
                            <p class="text-sm text-red-600">${maxDailyLoss.toFixed(0)} MWh 손실 (${maxLossPercentage}%)</p>
                        </div>
                        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 class="font-semibold text-green-800 mb-2">
                                <i class="fas fa-check-circle mr-2"></i>최적화 효과
                            </h4>
                            <p class="text-lg font-bold text-green-600">손실 최소화</p>
                            <p class="text-sm text-green-600">발전량 낮은 시점 선택</p>
                        </div>
                    </div>
                `;

                // 기존 차트 설명 부분을 업데이트
                const chartContainer = document.querySelector('#2week-maintenance-content .card:last-child');
                const existingAnalysis = chartContainer.querySelector('.chart-analysis');
                if (existingAnalysis) {
                    existingAnalysis.remove();
                }
                
                const analysisDiv = document.createElement('div');
                analysisDiv.className = 'chart-analysis';
                analysisDiv.innerHTML = analysisHtml;
                chartContainer.appendChild(analysisDiv);
            }

            function clearResults() {
                document.getElementById('lossAnalysis').innerHTML = `
                    <div class="p-4 bg-gray-50 rounded-lg text-center">
                        <i class="fas fa-chart-line text-3xl text-gray-400 mb-2"></i>
                        <p class="text-gray-500">최적 스케줄을 생성하면<br>발전량 손실 분석이 표시됩니다.</p>
                    </div>
                `;
                
                document.getElementById('optimizedSchedule').innerHTML = `
                    <div class="p-4 bg-gray-50 rounded-lg text-center">
                        <i class="fas fa-calendar-check text-3xl text-gray-400 mb-2"></i>
                        <p class="text-gray-500">최적 스케줄을 생성하면<br>권장 정비 일정이 표시됩니다.</p>
                    </div>
                `;

                if (charts.maintenanceScheduleChart) {
                    charts.maintenanceScheduleChart.destroy();
                    delete charts.maintenanceScheduleChart;
                }
            }

            // 전역 함수로 정의 (HTML에서 호출하기 위해)
            window.removePlan = function(planId) {
                maintenancePlans = maintenancePlans.filter(plan => plan.id !== planId);
                updateMaintenanceList();
                clearResults();
            };
        }

        // ==================== 기상예측 기능 ====================
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
        
        function switchWeatherMode(mode) {
            const listBtn = document.getElementById('weatherListBtn');
            const chartsBtn = document.getElementById('weatherChartsBtn');
            const listMode = document.getElementById('weatherListMode');
            const chartsMode = document.getElementById('weatherChartsMode');
            
            if (mode === 'list') {
                listBtn.classList.add('bg-blue-600', 'text-white');
                listBtn.classList.remove('bg-gray-200', 'text-gray-700');
                chartsBtn.classList.add('bg-gray-200', 'text-gray-700');
                chartsBtn.classList.remove('bg-blue-600', 'text-white');
                listMode.classList.remove('hidden');
                chartsMode.classList.add('hidden');
            } else {
                chartsBtn.classList.add('bg-blue-600', 'text-white');
                chartsBtn.classList.remove('bg-gray-200', 'text-gray-700');
                listBtn.classList.add('bg-gray-200', 'text-gray-700');
                listBtn.classList.remove('bg-blue-600', 'text-white');
                chartsMode.classList.remove('hidden');
                listMode.classList.add('hidden');
            }
            
            updateWeatherView();
        }
        
        function updateWeatherView() {
            const period = document.querySelector('input[name="weatherPeriod"]:checked').value;
            const mode = document.getElementById('weatherListBtn').classList.contains('bg-blue-600') ? 'list' : 'charts';
            
            if (mode === 'list') {
                if (period === '10days') {
                    document.getElementById('weather10daysList').classList.remove('hidden');
                    document.getElementById('weather90daysList').classList.add('hidden');
                    render10DaysList();
                } else {
                    document.getElementById('weather10daysList').classList.add('hidden');
                    document.getElementById('weather90daysList').classList.remove('hidden');
                    render90DaysList();
                }
            } else {
                if (period === '10days') {
                    document.getElementById('weather10daysCharts').classList.remove('hidden');
                    document.getElementById('weather90daysCharts').classList.add('hidden');
                    render10DaysCharts();
                } else {
                    document.getElementById('weather10daysCharts').classList.add('hidden');
                    document.getElementById('weather90daysCharts').classList.remove('hidden');
                    render90DaysCharts();
                }
            }
        }
        
        // 기상 상태 결정 함수
        function getWeatherStatus(windSpeed) {
            if (windSpeed < 3 || windSpeed > 20) return 'danger';
            if (windSpeed < 6 || windSpeed > 15) return 'warning';
            return 'good';
        }
        
        // 10일 List 모드 렌더링 (개선된 UI)
        function render10DaysList() {
            const container = document.getElementById('weather10daysList');
            const today = new Date();
            let html = '';
            
            for (let day = 0; day < 10; day++) {
                const date = new Date(today);
                date.setDate(date.getDate() + day);
                const dateStr = date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
                
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
                
                // 24시간 타임라인 생성
                let timelineHtml = '<div class="weather-timeline-bar shadow-sm">';
                hourlyData.forEach(data => {
                    const status = getWeatherStatus(parseFloat(data.windSpeed));
                    timelineHtml += `<div class="weather-timeline-segment weather-status-${status}" title="${data.hour}시: ${data.windSpeed} m/s"></div>`;
                });
                timelineHtml += '</div>';
                
                // 시간을 가로로, 변수를 세로로 배치한 테이블 생성
                let tableHtml = '<div class="weather-accordion-content"><div class="p-6 bg-gradient-to-br from-gray-50 to-white">';
                tableHtml += '<div class="overflow-x-auto"><table class="weather-table-modern">';
                
                // 헤더: 시간 (가로)
                tableHtml += '<thead><tr><th class="sticky-col">시간</th>';
                hourlyData.forEach(data => {
                    tableHtml += `<th class="text-center">${data.hour}:00</th>`;
                });
                tableHtml += '</tr></thead><tbody>';
                
                // 각 변수별 행
                const variables = [
                    { key: 'windSpeed', label: '풍속 (m/s)', icon: 'fa-wind', color: 'blue' },
                    { key: 'temp', label: '기온 (°C)', icon: 'fa-temperature-high', color: 'orange' },
                    { key: 'precip', label: '강수량 (mm)', icon: 'fa-cloud-rain', color: 'cyan' },
                    { key: 'humidity', label: '상대습도 (%)', icon: 'fa-droplet', color: 'teal' },
                    { key: 'waveHeight', label: '파고 (m)', icon: 'fa-water', color: 'indigo' },
                    { key: 'lightning', label: '낙뢰확률 (%)', icon: 'fa-bolt', color: 'yellow' },
                ];
                
                variables.forEach(variable => {
                    tableHtml += `<tr><td class="sticky-col font-semibold text-${variable.color}-700"><i class="fas ${variable.icon} mr-2"></i>${variable.label}</td>`;
                    hourlyData.forEach(data => {
                        let cellClass = 'text-center';
                        let value = data[variable.key];
                        
                        // 값에 따른 색상 코딩
                        if (variable.key === 'windSpeed') {
                            const ws = parseFloat(value);
                            if (ws >= 6 && ws <= 12) cellClass += ' bg-green-50 text-green-700 font-semibold';
                            else if (ws < 3 || ws > 18) cellClass += ' bg-red-50 text-red-700';
                            else cellClass += ' bg-yellow-50 text-yellow-700';
                        } else if (variable.key === 'confidence') {
                            const conf = parseFloat(value);
                            if (conf >= 80) cellClass += ' bg-green-50 text-green-700 font-semibold';
                            else if (conf < 60) cellClass += ' bg-red-50 text-red-700';
                        }
                        
                        tableHtml += `<td class="${cellClass}">${value}</td>`;
                    });
                    tableHtml += '</tr>';
                });
                
                tableHtml += '</tbody></table></div></div></div>';
                
                html += `
                    <div class="weather-accordion-item-modern mb-4">
                        <div class="weather-accordion-header-modern" onclick="toggleWeatherAccordion(this)">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                                        ${date.getDate()}
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-gray-800 text-lg">${dateStr}</h4>
                                        <p class="text-sm text-gray-500">24시간 예보</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <div class="text-right mr-4">
                                        <p class="text-xs text-gray-500">평균 풍속</p>
                                        <p class="text-lg font-bold text-blue-600">${(hourlyData.reduce((sum, d) => sum + parseFloat(d.windSpeed), 0) / 24).toFixed(1)} m/s</p>
                                    </div>
                                    <i class="fas fa-chevron-down transition-transform duration-300 text-gray-400 text-xl"></i>
                                </div>
                            </div>
                            <div class="mt-4">
                                ${timelineHtml}
                            </div>
                        </div>
                        ${tableHtml}
                    </div>
                `;
            }
            
            container.innerHTML = html;
        }
        
        function getOverallDailyStatus(dailyData) {
            const windSpeed = parseFloat(dailyData.windSpeed);
            const maxTemp = parseFloat(dailyData.maxTemp);
            const minTemp = parseFloat(dailyData.minTemp);
            const precip = parseFloat(dailyData.precip);
            const waveHeight = parseFloat(dailyData.waveHeight);

            let dangerCount = 0;
            let warningCount = 0;

            // Wind Speed: < 15m/s
            if (windSpeed >= 15) {
                dangerCount++;
            }

            // Max Temperature: < 30'c
            if (maxTemp >= 30) {
                warningCount++;
            }

            // Min Temperature: > 10'c
            if (minTemp <= 10) {
                warningCount++;
            }

            // Precipitation: < 10 mm
            if (precip >= 10) {
                warningCount++;
            }

            // Wave Height: < 1 m
            if (waveHeight >= 1) {
                dangerCount++;
            }

            if (dangerCount > 0) return 'danger';
            if (warningCount > 1) return 'warning';
            return 'good';
        }

        // 90일 List 모드 렌더링 (개선된 UI)
        function render90DaysList() {
            const container = document.getElementById('weather90daysList');
            const today = new Date();
            let html = '';
            
            for (let period = 0; period < 9; period++) {
                const startDay = period * 10;
                const endDay = startDay + 9;
                const startDate = new Date(today);
                startDate.setDate(startDate.getDate() + startDay);
                const endDate = new Date(today);
                endDate.setDate(endDate.getDate() + endDay);
                
                const periodStr = `${startDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`;
                
                // 10일 데이터 생성
                const dailyData = [];
                for (let day = 0; day < 10; day++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() + startDay + day);
                    const dataPoint = {
                        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
                        windSpeed: (5 + Math.random() * 15).toFixed(1),
                        maxTemp: (15 + Math.random() * 20).toFixed(1),
                        minTemp: (5 + Math.random() * 10).toFixed(1),
                        precip: (Math.random() * 15).toFixed(1),
                        waveHeight: (0.5 + Math.random() * 1).toFixed(1),
                        confidence: (60 + Math.random() * 30).toFixed(0)
                    };
                    dataPoint.status = getOverallDailyStatus(dataPoint);
                    dailyData.push(dataPoint);
                }
                
                // 10일 타임라인 생성
                let timelineHtml = '<div class="weather-timeline-bar shadow-sm">';
                dailyData.forEach((data, idx) => {
                    timelineHtml += `<div class="weather-timeline-segment weather-status-${data.status}" title="Day ${startDay + idx + 1}: ${data.windSpeed} m/s"></div>`;
                });
                timelineHtml += '</div>';
                
                // 날짜를 가로로, 변수를 세로로 배치한 테이블 생성
                                let tableHtml = '<div class="weather-accordion-content"><div class="p-6 bg-gradient-to-br from-gray-50 to-white">';
                                tableHtml += '<div class="overflow-x-auto"><table class="weather-table-modern">';
                                
                                tableHtml += '<tbody>';
                
                                // Date row
                                tableHtml += '<tr><td class="sticky-col font-semibold text-gray-700">날짜</td>';
                                dailyData.forEach(data => {
                                    const statusColors = {
                                        good: 'bg-green-100',
                                        warning: 'bg-yellow-100',
                                        danger: 'bg-red-100'
                                    };
                                    tableHtml += `<td class="text-center font-semibold ${statusColors[data.status]}">${data.date}</td>`;
                                });
                                tableHtml += '</tr>';
                
                                // Add "Comprehensive" (종합) row
                                tableHtml += '<tr><td class="sticky-col font-semibold text-purple-700"><i class="fas fa-check-circle mr-2"></i>종합</td>';
                                dailyData.forEach(data => {
                                    const statusColors = {
                                        good: 'bg-green-500',
                                        warning: 'bg-yellow-500',
                                        danger: 'bg-red-500'
                                    };
                                    tableHtml += `<td class="text-center p-2"><div class="w-full h-4 rounded ${statusColors[data.status]}"></div></td>`;
                                });
                                tableHtml += '</tr>';
                
                                // 각 변수별 행
                const variables = [
                    { key: 'windSpeed', label: '평균풍속', criteria: '< 15m/s', icon: 'fa-wind', color: 'blue', goodRange: [0, 14.9] },
                    { key: 'maxTemp', label: '최고기온', criteria: '< 30°C', icon: 'fa-temperature-high', color: 'red', goodRange: [-Infinity, 29.9] },
                    { key: 'minTemp', label: '최저기온', criteria: '> 10°C', icon: 'fa-temperature-low', color: 'blue', goodRange: [10.1, Infinity] },
                    { key: 'precip', label: '강수량', criteria: '< 10mm', icon: 'fa-cloud-rain', color: 'cyan', goodRange: [0, 9.9] },
                    { key: 'waveHeight', label: '평균파고', criteria: '< 1m', icon: 'fa-water', color: 'indigo', goodRange: [0, 0.9] },
                    { key: 'confidence', label: '신뢰도', criteria: '10% 단위', icon: 'fa-chart-line', color: 'green' }
                ];
                
                variables.forEach(variable => {
                    let labelHtml = `<td class="sticky-col font-semibold text-${variable.color}-700"><i class="fas ${variable.icon} mr-2"></i>${variable.label}`;
                    if (variable.criteria) {
                        labelHtml += `<span class="text-xs text-gray-500 ml-1">(${variable.criteria})</span>`;
                    }
                    labelHtml += `</td>`;
                    tableHtml += `<tr>${labelHtml}`;

                    dailyData.forEach(data => {
                        const value = parseFloat(data[variable.key]);
                        if (variable.key === 'confidence') {
                            const confidenceValue = Math.floor(value / 10) * 10;
                            tableHtml += `<td class="text-center font-semibold">${confidenceValue}%</td>`;
                        } else {
                            const isGood = value >= variable.goodRange[0] && value <= variable.goodRange[1];
                            const color = isGood ? 'bg-green-500' : 'bg-red-500';
                            
                            tableHtml += `<td class="text-center"><div class="w-4 h-4 mx-auto rounded-full ${color}" title="${value.toFixed(1)}"></div></td>`;
                        }
                    });
                    tableHtml += '</tr>';
                });
                
                tableHtml += '</tbody></table></div></div></div>';
                
                // 평균 풍속 계산
                const avgWindSpeed = (dailyData.reduce((sum, d) => sum + parseFloat(d.windSpeed), 0) / 10).toFixed(1);
                
                html += `
                    <div class="weather-accordion-item-modern mb-4">
                        <div class="weather-accordion-header-modern" onclick="toggleWeatherAccordion(this)">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                                        ${period + 1}
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-gray-800 text-lg">Day ${startDay + 1}-${endDay + 1}</h4>
                                        <p class="text-sm text-gray-500">${periodStr}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <div class="text-right mr-4">
                                        <p class="text-xs text-gray-500">평균 풍속</p>
                                        <p class="text-lg font-bold text-purple-600">${avgWindSpeed} m/s</p>
                                    </div>
                                    <i class="fas fa-chevron-down transition-transform duration-300 text-gray-400 text-xl"></i>
                                </div>
                            </div>
                            <div class="mt-4 mx-4">
                                ${timelineHtml}
                            </div>
                        </div>
                        ${tableHtml}
                    </div>
                `;
            }
            
            container.innerHTML = html;
        }
        
        window.toggleWeatherAccordion = function(header) {
            const content = header.nextElementSibling;
            const icon = header.querySelector('i.fa-chevron-down, i.fa-chevron-up');
            
            if (!content || !icon) {
                console.error('Accordion elements not found', { content, icon });
                return;
            }
            
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
        
        // 10일 Charts 모드 렌더링
        function render10DaysCharts() {
            const today = new Date();
            const calendarContainer = document.getElementById('weather10daysCalendarGrid');
            const detailedContainer = document.getElementById('weather10daysDetailedView');
            let calendarHtml = '';

            const dailyData = [];
            for (let day = 0; day < 10; day++) {
                const date = new Date(today);
                date.setDate(date.getDate() + day);
                
                const dataPoint = {
                    date: date,
                    windSpeed: (5 + Math.random() * 15).toFixed(1),
                    maxTemp: (15 + Math.random() * 20).toFixed(1),
                    minTemp: (5 + Math.random() * 10).toFixed(1),
                    precip: (Math.random() * 15).toFixed(1),
                    waveHeight: (0.5 + Math.random() * 1).toFixed(1),
                    confidence: (60 + Math.random() * 30).toFixed(0)
                };
                dataPoint.status = getOverallDailyStatus(dataPoint);
                dailyData.push(dataPoint);

                calendarHtml += `
                    <div class="weather-calendar-day flex flex-col items-center justify-center weather-status-${dataPoint.status}">
                        <div class="text-white">${date.getDate()}</div>
                        <div class="text-xs text-white mt-1">${dataPoint.windSpeed} m/s</div>
                    </div>
                `;
            }
            calendarContainer.innerHTML = calendarHtml;

            // Detailed Calendar View
            let detailedHtml = '<table class="w-full text-sm">';
            // Header
            detailedHtml += '<thead><tr><th class="sticky-col bg-white w-1/4"></th>';
            dailyData.forEach(data => {
                detailedHtml += `<th class="text-center font-medium text-gray-600 p-2">${data.date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</th>`;
            });
            detailedHtml += '</tr></thead>';

            // Body
            detailedHtml += '<tbody>';

            // Comprehensive Row
            detailedHtml += '<tr class="bg-gray-50"><td class="sticky-col bg-gray-50 font-semibold text-purple-700 p-2"><i class="fas fa-check-circle mr-2"></i>종합</td>';
            dailyData.forEach(data => {
                const statusColors = { good: 'bg-green-500', warning: 'bg-yellow-500', danger: 'bg-red-500' };
                detailedHtml += `<td class="text-center p-2"><div class="w-full h-4 rounded ${statusColors[data.status]}"></div></td>`;
            });
            detailedHtml += '</tr>';


            const variables = [
                { key: 'windSpeed', label: '평균풍속', criteria: '< 15m/s', goodRange: [0, 14.9] },
                { key: 'maxTemp', label: '최고기온', criteria: '< 30°C', goodRange: [-Infinity, 29.9] },
                { key: 'minTemp', label: '최저기온', criteria: '> 10°C', goodRange: [10.1, Infinity] },
                { key: 'precip', label: '강수량', criteria: '< 10mm', goodRange: [0, 9.9] },
                { key: 'waveHeight', label: '평균파고', criteria: '< 1m', goodRange: [0, 0.9] },
            ];

            variables.forEach(variable => {
                detailedHtml += `<tr><td class="sticky-col bg-white font-semibold text-gray-700 p-2">${variable.label} <span class="text-xs text-gray-500">(${variable.criteria})</span></td>`;
                dailyData.forEach(data => {
                    const value = parseFloat(data[variable.key]);
                    const isGood = value >= variable.goodRange[0] && value <= variable.goodRange[1];
                    const color = isGood ? 'bg-green-500' : 'bg-red-500';
                    detailedHtml += `<td class="text-center p-2"><div class="w-4 h-4 mx-auto rounded-full ${color}" title="${value.toFixed(1)}"></div></td>`;
                });
                detailedHtml += '</tr>';
            });

            detailedHtml += '</tbody></table>';
            detailedContainer.innerHTML = detailedHtml;
        }
        
        // 90일 Charts 모드 렌더링
        function render90DaysCharts() {
            const calendarContainer = document.getElementById('weather90daysCalendarGrid');
            const detailedContainer = document.getElementById('weather90daysDetailedView');
            const today = new Date();

            const months = {};
            const dailyData = [];

            // 90일 데이터 생성
            for (let day = 0; day < 90; day++) {
                const date = new Date(today);
                date.setDate(date.getDate() + day);
                const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                
                if (!months[monthKey]) {
                    months[monthKey] = {
                        name: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
                        year: date.getFullYear(),
                        month: date.getMonth(),
                        days: []
                    };
                }
                
                const dataPoint = {
                    date: new Date(date),
                    windSpeed: (5 + Math.random() * 15).toFixed(1),
                    maxTemp: (15 + Math.random() * 20).toFixed(1),
                    minTemp: (5 + Math.random() * 10).toFixed(1),
                    precip: (Math.random() * 15).toFixed(1),
                    waveHeight: (0.5 + Math.random() * 1).toFixed(1),
                    confidence: (60 + Math.random() * 30).toFixed(0)
                };
                dataPoint.status = getOverallDailyStatus(dataPoint);
                dailyData.push(dataPoint);

                months[monthKey].days.push({
                    date: date.getDate(),
                    status: dataPoint.status,
                });
            }
            
            // 상단: 월별 캘린더 그리드 (4열)
            let calendarHtml = '<div class="grid grid-cols-4 gap-6">';

            Object.values(months).forEach(month => {
                calendarHtml += '<div class="bg-white rounded-lg p-4 shadow-sm">';
                calendarHtml += `<h4 class="font-semibold text-lg mb-3 text-gray-800">${month.name}</h4>`;
                calendarHtml += '<div class="grid grid-cols-7 gap-1 text-center">';
                
                const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                weekdays.forEach(weekday => {
                    calendarHtml += `<div class="font-semibold text-xs text-gray-500 py-1">${weekday}</div>`;
                });

                // 해당 월의 첫 번째 날짜의 요일 계산
                const firstDateInMonth = month.days[0].date;
                const firstDayOfWeek = new Date(month.year, month.month, firstDateInMonth).getDay();
                
                // 빈 칸 추가
                for (let i = 0; i < firstDayOfWeek; i++) {
                    calendarHtml += `<div class="aspect-square"></div>`;
                }

                month.days.forEach(day => {
                    calendarHtml += `<div class="weather-calendar-day flex flex-col items-center justify-center weather-status-${day.status} aspect-square flex items-center justify-center"><div class="text-white text-sm font-semibold">${day.date}</div></div>`;
                });

                calendarHtml += '</div></div>';
            });
            
            calendarHtml += '</div>';
            calendarContainer.innerHTML = calendarHtml;

            // 하단: 상세 캘린더 뷰
            let detailedHtml = '<div class="overflow-x-auto"><table class="weather-table-modern">';
            
            // Header: 날짜
            detailedHtml += '<thead><tr><th class="sticky-col">날짜</th>';
            dailyData.forEach(data => {
                detailedHtml += `<th class="text-center">${data.date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</th>`;
            });
            detailedHtml += '</tr></thead>';

            // Body
            detailedHtml += '<tbody>';

            // 종합 행
            detailedHtml += '<tr><td class="sticky-col font-semibold text-purple-700"><i class="fas fa-check-circle mr-2"></i>종합</td>';
            dailyData.forEach(data => {
                const statusColors = { good: 'bg-green-500', warning: 'bg-yellow-500', danger: 'bg-red-500' };
                detailedHtml += `<td class="text-center p-2"><div class="w-full h-4 rounded ${statusColors[data.status]}"></div></td>`;
            });
            detailedHtml += '</tr>';

            // 신뢰도 행
            detailedHtml += '<tr><td class="sticky-col font-semibold text-gray-700"><i class="fas fa-chart-line mr-2"></i>신뢰도 (%)</td>';
            dailyData.forEach(data => {
                const confidence = Math.floor(parseFloat(data.confidence) / 10) * 10;
                detailedHtml += `<td class="text-center font-semibold">${confidence}%</td>`;
            });
            detailedHtml += '</tr>';

            // 기상 변수 행
            const variables = [
                { key: 'windSpeed', label: '평균풍속', criteria: '< 15m/s', icon: 'fa-wind', goodRange: [0, 14.9] },
                { key: 'maxTemp', label: '최고기온', criteria: '< 30°C', icon: 'fa-temperature-high', goodRange: [-Infinity, 29.9] },
                { key: 'minTemp', label: '최저기온', criteria: '> 10°C', icon: 'fa-temperature-low', goodRange: [10.1, Infinity] },
                { key: 'precip', label: '강수량', criteria: '< 10mm', icon: 'fa-cloud-rain', goodRange: [0, 9.9] },
                { key: 'waveHeight', label: '평균파고', criteria: '< 1m', icon: 'fa-water', goodRange: [0, 0.9] },
            ];

            variables.forEach(variable => {
                detailedHtml += `<tr><td class="sticky-col font-semibold text-gray-700"><i class="fas ${variable.icon} mr-2"></i>${variable.label} <span class="text-xs text-gray-500">(${variable.criteria})</span></td>`;
                dailyData.forEach(data => {
                    const value = parseFloat(data[variable.key]);
                    const isGood = value >= variable.goodRange[0] && value <= variable.goodRange[1];
                    const color = isGood ? 'bg-green-500' : 'bg-red-500';
                    detailedHtml += `<td class="text-center p-2"><div class="w-4 h-4 mx-auto rounded-full ${color}" title="${value.toFixed(1)}"></div></td>`;
                });
                detailedHtml += '</tr>';
            });

            detailedHtml += '</tbody></table></div>';
            detailedContainer.innerHTML = detailedHtml;
        }

        // ==================== 다국어 지원 시스템 ====================
        const translations = {
            ko: {
                'sidebar.overview': '개요',
                'sidebar.shortterm': '단기예측',
                'sidebar.midterm': '중기예측',
                'sidebar.longterm': '장기예측',
                'sidebar.weather': '기상예측',
                'sidebar.details': '상세 정보',
                'weather.title': '기상예측',
                'weather.period': '예측 기간',
                'weather.10days': '10일 (1시간)',
                'weather.90days': '90일 (1일)',
                'weather.mode': '표시 모드',
                'weather.list': 'List',
                'weather.charts': 'Charts',
                'weather.overview': 'Weather Overview',
                'weather.detailed': 'Detailed Calendar View',
                'weather.comprehensive': 'Overall',
                'weather.confidence': 'Confidence',
                'weather.windspeed': 'Avg Wind Speed',
                'weather.maxtemp': 'Max Temp',
                'weather.mintemp': 'Min Temp',
                'weather.precip': 'Precipitation',
                'weather.humidity': 'Humidity',
                'weather.waveheight': 'Wave Height',
                'weather.lightning': 'Lightning',
                'weather.temp': 'Temperature',
                'weather.avgwindspeed': 'Avg Wind Speed',
                'weather.date': 'Date',
                'weather.time': 'Time',
                'weather.hour': 'Hour',
                'weather.day': 'Day',
                'common.sample': 'SAMPLE',
                'common.update': 'Last Update',
            },
            en: {
                'sidebar.overview': 'Overview',
                'sidebar.shortterm': 'Short-term',
                'sidebar.midterm': 'Mid-term',
                'sidebar.longterm': 'Long-term',
                'sidebar.weather': 'Weather',
                'sidebar.details': 'Details',
                'weather.title': 'Weather Forecast',
                'weather.period': 'Forecast Period',
                'weather.10days': '10 Days (Hourly)',
                'weather.90days': '90 Days (Daily)',
                'weather.mode': 'Display Mode',
                'weather.list': 'List',
                'weather.charts': 'Charts',
                'weather.overview': 'Weather Overview',
                'weather.detailed': 'Detailed Calendar View',
                'weather.comprehensive': 'Overall',
                'weather.confidence': 'Confidence',
                'weather.windspeed': 'Avg Wind Speed',
                'weather.maxtemp': 'Max Temp',
                'weather.mintemp': 'Min Temp',
                'weather.precip': 'Precipitation',
                'weather.humidity': 'Humidity',
                'weather.waveheight': 'Wave Height',
                'weather.lightning': 'Lightning',
                'weather.temp': 'Temperature',
                'weather.avgwindspeed': 'Avg Wind Speed',
                'weather.date': 'Date',
                'weather.time': 'Time',
                'weather.hour': 'Hour',
                'weather.day': 'Day',
                'common.sample': 'SAMPLE',
                'common.update': 'Last Update',
            }
        };

        let currentLang = 'ko';

        function switchLanguage() {
            currentLang = currentLang === 'ko' ? 'en' : 'ko';
            localStorage.setItem('language', currentLang);
            
            document.getElementById('langText').textContent = currentLang === 'ko' ? 'EN' : 'KO';
            
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (translations[currentLang][key]) {
                    element.textContent = translations[currentLang][key];
                }
            });
            
            const mainTitle = document.getElementById('main-title');
            if (mainTitle) {
                const activeSection = document.querySelector('.sidebar-item.active');
                if (activeSection) {
                    const target = activeSection.getAttribute('data-target');
                    const key = 'sidebar.' + target;
                    if (translations[currentLang][key]) {
                        mainTitle.textContent = translations[currentLang][key];
                    }
                }
            }
        }

        function initLanguage() {
            const savedLang = localStorage.getItem('language');
            if (savedLang && savedLang !== 'ko') {
                currentLang = savedLang;
                switchLanguage();
            }
            
            const langToggle = document.getElementById('langToggle');
            if (langToggle) {
                langToggle.addEventListener('click', switchLanguage);
            }
        }

        // DOMContentLoaded에 initLanguage 추가
        document.addEventListener('DOMContentLoaded', function() {
            initLanguage();
        });
