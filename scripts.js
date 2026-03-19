        // ==================== 풍력 발전량 예측 시스템 v1.3.4 ====================
        // 기상 기준 상수
        const WEATHER_THRESHOLDS = {
            windSpeed: { 
                danger: 15,    // >= 15m/s
                warning: 13    // >= 13m/s
            },
            temperature: { 
                dangerMin: 5,      // <= 5°C
                dangerMax: 30,     // >= 30°C
                warningMin: 8,     // <= 8°C
                warningMax: 28,    // >= 28°C
                dailyMin: 10       // <= 10°C (90일 예측용)
            },
            precipitation: { 
                danger: 10,    // >= 10mm
                warning: 7     // >= 7mm
            },
            waveHeight: { 
                danger: 2,     // >= 2m
                warning: 1.5,  // >= 1.5m
                daily: 2       // >= 2m (90일 예측용)
            }
        };

        const STATUS_COLORS = {
            good: 'bg-green-500',
            warning: 'bg-yellow-500',
            danger: 'bg-red-500'
        };

        // ==================== 유틸리티 함수 ====================
        const generateRandomData = (count, min, max, decimals = 0) => {
            const data = [];
            for (let i = 0; i < count; i++) {
                let value = Math.random() * (max - min) + min;
                data.push(parseFloat(value.toFixed(decimals)));
            }
            return data;
        };

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
            document.getElementById('todayWaveRange').textContent = `${Math.min(...waves).toFixed(1)} ~ ${Math.max(...waves).toFixed(1)} m`;
            
            // 24시간 타임라인 생성
            const timeline = document.getElementById('todayWeatherTimeline');
            if (timeline) {
                timeline.innerHTML = '';
                windSpeeds.forEach(speed => {
                    const segment = document.createElement('div');
                    segment.style.flex = '1';
                    segment.style.height = '100%';
                    if (speed < 10) {
                        segment.style.backgroundColor = '#86efac'; // 녹색
                    } else if (speed < 13) {
                        segment.style.backgroundColor = '#fcd34d'; // 주황
                    } else {
                        segment.style.backgroundColor = '#fca5a5'; // 빨강
                    }
                    timeline.appendChild(segment);
                });
            }
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

            // Overview Charts - Turbine Map
            if (document.getElementById('turbineMap') && !document.getElementById('turbineMap')._leaflet_id) {
                const map = L.map('turbineMap').setView([35.485, 126.317], 10);
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri', maxZoom: 18 }).addTo(map);
                const turbines = [[35.489977,126.340817],[35.484832,126.334644],[35.479686,126.328472],[35.474539,126.322300],[35.469392,126.316130],[35.493631,126.333218],[35.488485,126.327045],[35.483338,126.320874],[35.478191,126.314702],[35.473044,126.308532],[35.497284,126.325619],[35.492137,126.319446],[35.486990,126.313275],[35.481844,126.307104],[35.476696,126.300934],[35.500937,126.318019],[35.495768,126.311821],[35.490642,126.305675],[35.485495,126.299504],[35.480348,126.293335]];
                turbines.forEach((c,i) => L.marker(c).addTo(map).bindPopup(`<b>WTG #${i+1}</b>`));
            }

            // Overview Charts
            if (document.getElementById('overview-content')?.offsetParent !== null) {
                // 오늘 시간별 풍속 (중기예측 스타일)
                const ovLabels = Array.from({length:24},(_,h)=>`${h}시`);
                const ovWind = Array.from({length:24},()=>+(3+Math.random()*12).toFixed(1));
                const ovWindColors = ovWind.map(s => s<3?'rgba(135,206,235,0.8)':s<6?'rgba(59,130,246,0.8)':s<10?'rgba(16,185,129,0.8)':s<15?'rgba(245,158,11,0.8)':'rgba(239,68,68,0.8)');
                charts.overviewWindChart = new Chart(document.getElementById('overviewWindChart').getContext('2d'), {
                    type:'line', data:{labels:ovLabels,datasets:[{label:'풍속 (m/s)',data:ovWind,borderColor:'rgb(59,130,246)',backgroundColor:'rgba(59,130,246,0.1)',tension:0.3,fill:true,borderWidth:2,pointBackgroundColor:ovWindColors,pointBorderColor:ovWindColors,pointRadius:4}]},
                    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true}},scales:{y:{beginAtZero:true,max:20,title:{display:true,text:'풍속 (m/s)'},grid:{color:function(ctx){const v=ctx.tick.value;if(v===3)return'rgba(135,206,235,0.5)';if(v===6)return'rgba(59,130,246,0.5)';if(v===10)return'rgba(16,185,129,0.5)';if(v===15)return'rgba(239,68,68,0.5)';return'rgba(0,0,0,0.1)'}}}}}
                });
                // 오늘 시간별 발전량
                charts.hourlyPatternChart = createChart(document.getElementById('hourlyPatternChart')?.getContext('2d'), 'bar',
                    ovLabels,
                    [{ label: '시간별 예상 발전량 (MW)', data: generateRandomData(24, 2, 19.2), backgroundColor: 'rgba(99, 102, 241, 0.6)'}]
                );
            }

            // Short-term Forecast Charts (3 days)
            if (document.getElementById('shortterm-content')?.offsetParent !== null) {
                // Total Plant - Daily & Hourly (통합 페이지)
                if (document.getElementById('shortterm-total-content')?.offsetParent !== null) {
                    // 24시간 풍속 라인 차트 (중기예측 스타일)
                    const windLabels = [];
                    const windData = [];
                    for (let h = 0; h < 24; h++) {
                        windLabels.push(`${h}시`);
                        windData.push(+(3 + Math.random() * 12).toFixed(1));
                    }
                    const windColors = windData.map(s => s < 3 ? 'rgba(135,206,235,0.8)' : s < 6 ? 'rgba(59,130,246,0.8)' : s < 10 ? 'rgba(16,185,129,0.8)' : s < 15 ? 'rgba(245,158,11,0.8)' : 'rgba(239,68,68,0.8)');
                    charts.shorttermWindChart = new Chart(document.getElementById('shorttermWindChart').getContext('2d'), {
                        type: 'line',
                        data: { labels: windLabels, datasets: [{ label: '풍속 (m/s)', data: windData, borderColor: 'rgb(59,130,246)', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.3, fill: true, borderWidth: 2, pointBackgroundColor: windColors, pointBorderColor: windColors, pointRadius: 4 }] },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true }, tooltip: { callbacks: { afterLabel: function(ctx) { const s = ctx.parsed.y; return s < 3 ? '발전 불가' : s < 6 ? '저풍속' : s < 10 ? '최적 발전' : s < 15 ? '정격 출력' : '고출력/위험'; } } } }, scales: { y: { beginAtZero: true, max: 20, title: { display: true, text: '풍속 (m/s)' }, grid: { color: function(ctx) { const v = ctx.tick.value; if (v === 3) return 'rgba(135,206,235,0.5)'; if (v === 6) return 'rgba(59,130,246,0.5)'; if (v === 10) return 'rgba(16,185,129,0.5)'; if (v === 15) return 'rgba(239,68,68,0.5)'; return 'rgba(0,0,0,0.1)'; } } } } }
                    });

                    // 24시간 발전량 차트
                    const hourlyLabels = [];
                    for (let h = 0; h < 24; h++) { hourlyLabels.push(`${h}시`); }
                    charts.shorttermHourlyTotalChart = createChart(document.getElementById('shorttermHourlyTotalChart')?.getContext('2d'), 'line',
                        hourlyLabels,
                        [{ label: '시간별 발전량 (MW)', data: generateRandomData(24, 80, 180), borderColor: 'rgb(16, 185, 129)', tension: 0.1, fill: false}]
                    );
                }
                // Per Turbine - 24시간 발전량+풍속 듀얼 차트 (20호기)
                if (document.getElementById('shortterm-turbine-content')?.offsetParent !== null) {
                    const hLabels = Array.from({length:24},(_,h)=>`${h}시`);
                    const TC = 20;
                    const turbineColors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#e879f9','#14b8a6','#6366f1','#ec4899','#22c55e','#a855f7','#0ea5e9','#eab308','#d946ef','#64748b','#f43f5e','#2dd4bf'];

                    const grid = document.getElementById('shorttermTurbineDetailGrid');
                    if (grid) {
                        let html = '';
                        for (let i = 1; i <= TC; i++) {
                            html += `<div class="card"><h5 class="text-md font-semibold mb-3">WTG #${i} 상세 예측</h5><div class="chart-container h-[250px]"><canvas id="shorttermWtgDetail${i}"></canvas></div></div>`;
                        }
                        grid.innerHTML = html;
                        for (let i = 1; i <= TC; i++) {
                            const pwrD = generateRandomData(24, 15, 35);
                            const windD = generateRandomData(24, 3, 15);
                            const c = turbineColors[i-1];
                            charts[`shorttermWtgDetail${i}`] = new Chart(document.getElementById(`shorttermWtgDetail${i}`).getContext('2d'), {
                                type: 'line',
                                data: { labels: hLabels, datasets: [
                                    { label: '발전량 (MW)', data: pwrD, borderColor: c, backgroundColor: c+'1a', tension: 0.3, fill: true, borderWidth: 2, yAxisID: 'y' },
                                    { label: '풍속 (m/s)', data: windD, borderColor: 'rgba(100,100,100,0.6)', borderDash: [5,3], tension: 0.3, fill: false, borderWidth: 1.5, pointRadius: 2, yAxisID: 'y1' }
                                ] },
                                options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: true, labels: { font: { size: 11 } } } }, scales: { y: { type: 'linear', position: 'left', title: { display: true, text: 'MW' }, beginAtZero: true }, y1: { type: 'linear', position: 'right', title: { display: true, text: 'm/s' }, beginAtZero: true, max: 20, grid: { drawOnChartArea: false } } } }
                            });
                        }
                    }
                }
            }

            // 2 Week Forecast Charts
            if (document.getElementById('s_2week-content')?.offsetParent !== null) { 
                // Total Plant - Weekly & Daily (통합 페이지)
                if (document.getElementById('2week-total-content')?.offsetParent !== null) {
                    // 일평균 차트
                    charts.twoWeekDailyTotalChart = createChart(document.getElementById('twoWeekDailyTotalChart')?.getContext('2d'), 'line',
                        Array.from({length: 14}, (_, i) => `D+${i+1}`), 
                        [{ label: '일일 총 발전량 (MWh)', data: generateRandomData(14, 720, 1440), borderColor: 'rgb(245, 158, 11)', tension: 0.1, fill: false }]
                    );

                    // 중기예측 14일 기상 박스플롯
                    const midDayLabels = Array.from({length: 14}, (_, i) => `D+${i+1}`);
                    const midWindPattern = [
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[3,6],color:'rgba(59,130,246,0.6)',border:'rgb(59,130,246)'},
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[10,15],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'},
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[0,3],color:'rgba(135,206,235,0.6)',border:'rgb(135,206,235)'},
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[15,22],color:'rgba(239,68,68,0.6)',border:'rgb(239,68,68)'},
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[3,6],color:'rgba(59,130,246,0.6)',border:'rgb(59,130,246)'},
                        {range:[10,15],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'},
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[3,6],color:'rgba(59,130,246,0.6)',border:'rgb(59,130,246)'}
                    ];
                    const midBoxplotOpts = (ylabel) => ({
                        responsive:true, maintainAspectRatio:false,
                        onClick:(e,el,chart)=>{
                            const xScale = chart.scales.x;
                            const idx = xScale.getValueForPixel(e.x);
                            if(idx >= 0 && idx < chart.data.labels.length) showMidtermWeatherDetail(idx);
                        },
                        scales:{y:{title:{display:true,text:ylabel},beginAtZero:true}},
                        plugins:{legend:{display:false}}
                    });
                    charts.midtermWindBoxplot = new Chart(document.getElementById('midtermWindBoxplot')?.getContext('2d'),{
                        type:'boxplot',
                        data:{labels:midDayLabels,datasets:[{label:'풍속',data:midWindPattern.map(p=>generateBoxplotData(p.range[0],p.range[1])),backgroundColor:midWindPattern.map(p=>p.color),borderColor:midWindPattern.map(p=>p.border),borderWidth:2}]},
                        options:midBoxplotOpts('풍속 (m/s)')
                    });
                    charts.midtermTempBoxplot = new Chart(document.getElementById('midtermTempBoxplot')?.getContext('2d'),{
                        type:'boxplot',
                        data:{labels:midDayLabels,datasets:[{label:'기온',data:midDayLabels.map(()=>generateBoxplotData(5,25)),backgroundColor:'rgba(16,185,129,0.6)',borderColor:'rgb(16,185,129)',borderWidth:2}]},
                        options:midBoxplotOpts('기온 (℃)')
                    });
                    const midWavePattern = [
                        {range:[0.8,1.5],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'},
                        {range:[0.3,0.7],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[0.8,1.5],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'},
                        {range:[1.4,2.2],color:'rgba(239,68,68,0.6)',border:'rgb(239,68,68)'},
                        {range:[0.8,1.5],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'},
                        {range:[0.3,0.7],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[0.8,1.5],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'},
                        {range:[2.0,3.2],color:'rgba(220,38,127,0.6)',border:'rgb(220,38,127)'},
                        {range:[0.8,1.5],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'},
                        {range:[1.4,2.2],color:'rgba(239,68,68,0.6)',border:'rgb(239,68,68)'},
                        {range:[0.1,0.4],color:'rgba(34,197,94,0.6)',border:'rgb(34,197,94)'},
                        {range:[0.8,1.5],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'},
                        {range:[0.3,0.7],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[0.8,1.5],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'}
                    ];
                    charts.midtermWaveBoxplot = new Chart(document.getElementById('midtermWaveBoxplot')?.getContext('2d'),{
                        type:'boxplot',
                        data:{labels:midDayLabels,datasets:[{label:'파고',data:midWavePattern.map(p=>generateBoxplotData(p.range[0],p.range[1])),backgroundColor:midWavePattern.map(p=>p.color),borderColor:midWavePattern.map(p=>p.border),borderWidth:2}]},
                        options:midBoxplotOpts('파고 (m)')
                    });
                }
                // Per Turbine (WTG #1 to #20) — Overview 3안 + 상세
                if (document.getElementById('s_2week-content')?.offsetParent !== null) {
                    const TC = 20;
                    const dLabels = Array.from({length: 14}, (_, i) => `D+${i+1}`);
                    // 날짜별 공통 풍황 팩터 (같은 날은 모든 터빈이 비슷한 경향)
                    const dayFactor = Array.from({length: 14}, (_, d) => {
                        const weekBase = d < 7 ? 1.0 : 0.95 + Math.random() * 0.1;
                        return weekBase * (0.7 + Math.random() * 0.6);
                    });
                    // 터빈별 성능 계수 (일부 터빈이 지속적으로 높거나 낮음)
                    const turbinePerf = Array.from({length: TC}, () => 0.85 + Math.random() * 0.3);
                    const tData = {};
                    for (let t = 1; t <= TC; t++) {
                        const perf = turbinePerf[t - 1];
                        const daily = [], wind = [];
                        for (let d = 0; d < 14; d++) {
                            const baseWind = 4 + dayFactor[d] * 6;
                            const tWind = parseFloat(Math.max(1, baseWind + (Math.random() - 0.5) * 2).toFixed(1));
                            wind.push(tWind);
                            const power = Math.round(Math.max(10, tWind * 8 * perf * (1 + (Math.random() - 0.5) * 0.1)));
                            daily.push(power);
                        }
                        const w1 = daily.slice(0, 7).reduce((a, b) => a + b, 0);
                        const w2 = daily.slice(7).reduce((a, b) => a + b, 0);
                        tData[t] = { weekly: [w1, w2], daily, wind, total: daily.reduce((a, b) => a + b, 0) };
                    }
                    const allVals = Object.values(tData).flatMap(d => d.daily);
                    const gMin = Math.min(...allVals), gMax = Math.max(...allVals);
                    const heatColor = (v, dayIdx) => {
                        const dayVals = Object.values(tData).map(d => d.daily[dayIdx]);
                        const dMin = Math.min(...dayVals), dMax = Math.max(...dayVals);
                        const r = (v - dMin) / (dMax - dMin || 1);
                        const palette = [[255,249,196],[200,230,201],[179,229,252],[129,212,250],[79,195,247]];
                        const idx = Math.min(4, Math.floor(r * 5));
                        const c = palette[idx];
                        return `rgb(${c[0]},${c[1]},${c[2]})`;
                    };
                    const windColor = (v) => v<3?'rgb(135,206,235)':v<6?'rgb(59,130,246)':v<10?'rgb(16,185,129)':v<15?'rgb(245,158,11)':'rgb(239,68,68)';

                    window.showTurbineDetail = (t) => {
                        document.getElementById('turbineOverviewArea').classList.add('hidden');
                        const det = document.getElementById('turbineDetailArea');
                        det.classList.remove('hidden');
                        const d = tData[t];
                        document.getElementById('turbineDetailTitle').textContent = `WTG #${t} 상세`;
                        document.getElementById('detailWeek1').textContent = `${d.weekly[0]} MWh`;
                        document.getElementById('detailWeek2').textContent = `${d.weekly[1]} MWh`;
                        if (charts.tDetailDaily) charts.tDetailDaily.destroy();
                        if (charts.tDetailWind) charts.tDetailWind.destroy();
                        charts.tDetailDaily = new Chart(document.getElementById('turbineDetailDailyChart').getContext('2d'), {
                            type:'line', data:{labels:dLabels, datasets:[{label:'일간 총 발전량 (MWh)',data:d.daily,borderColor:'rgb(59,130,246)',tension:0.2,fill:false,borderWidth:2}]},
                            options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true}},scales:{y:{beginAtZero:true}}}
                        });
                        charts.tDetailWind = new Chart(document.getElementById('turbineDetailWindChart').getContext('2d'), {
                            type:'line', data:{labels:dLabels, datasets:[{label:'일 평균 풍속 (m/s)',data:d.wind,borderColor:'rgb(107,114,128)',tension:0.2,fill:false,borderWidth:2,pointBackgroundColor:d.wind.map(windColor),pointRadius:5}]},
                            options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true}},scales:{y:{beginAtZero:true,grid:{color:(ctx)=>{const v=ctx.tick?.value;return(v===3||v===6||v===10||v===15)?'rgba(0,0,0,0.15)':'rgba(0,0,0,0.05)';}}},x:{}}}
                        });
                    };
                    window.backToOverview = () => {
                        document.getElementById('turbineDetailArea').classList.add('hidden');
                        document.getElementById('turbineOverviewArea').classList.remove('hidden');
                    };

                    // A안: 히트맵
                    const renderHeatmap = (cid) => {
                        const c = document.getElementById(cid); if(!c) return;
                        let h = '<div class="overflow-x-auto"><table class="w-full text-xs border-collapse"><thead><tr><th class="p-1 text-left sticky left-0 bg-white z-10">터빈</th>';
                        dLabels.forEach(l => { h += `<th class="p-1 text-center min-w-[44px]">${l}</th>`; });
                        h += '<th class="p-1 text-center min-w-[60px]">합계</th></tr></thead><tbody>';
                        for (let t = 1; t <= TC; t++) {
                            const d = tData[t];
                            h += `<tr><td class="p-1 font-semibold sticky left-0 bg-white z-10 whitespace-nowrap cursor-pointer text-blue-600 hover:text-blue-800 hover:underline" onclick="showTurbineDetail(${t})">WTG #${t} <i class="fas fa-chevron-right text-[10px] ml-1"></i></td>`;
                            d.daily.forEach((v,i) => { h += `<td class="p-1 text-center" title="발전량: ${v} MWh / 풍속: ${d.wind[i]} m/s"><div class="w-full h-6 rounded" style="background:${heatColor(v,i)}"></div></td>`; });
                            h += `<td class="p-1 text-center font-semibold">${d.total}</td></tr>`;
                        }
                        h += '</tbody></table></div>'; c.innerHTML = h;
                    };

                    // 스파크라인 그리기 헬퍼
                    const drawSpark = (canvasId, vals, color) => {
                        const cv = document.getElementById(canvasId); if(!cv) return;
                        const ctx = cv.getContext('2d'), mn = Math.min(...vals), mx = Math.max(...vals), rng = mx-mn||1;
                        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath();
                        vals.forEach((v,i) => { const x=(i/(vals.length-1))*80, y=22-((v-mn)/rng)*20; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
                        ctx.stroke();
                    };

                    // B안: 랭킹
                    const renderRanking = (cid) => {
                        const c = document.getElementById(cid); if(!c) return;
                        const sorted = Object.entries(tData).map(([t,d])=>({t:parseInt(t),...d})).sort((a,b)=>b.total-a.total);
                        const threshold = sorted.reduce((s,d)=>s+d.total,0)/TC*0.9;
                        let h = '';
                        sorted.forEach((d,idx) => {
                            const warn = d.total < threshold;
                            h += `<div class="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer border-b" onclick="showTurbineDetail(${d.t})">`;
                            h += `<span class="w-8 text-center font-bold text-sm ${idx<3?'text-blue-600':warn?'text-red-500':'text-gray-500'}">${idx+1}</span>`;
                            h += `<span class="w-20 font-semibold text-sm">WTG #${d.t}</span>`;
                            h += `<div class="flex-1 h-5 bg-gray-100 rounded overflow-hidden"><div class="h-full rounded ${warn?'bg-red-400':'bg-blue-400'}" style="width:${(d.total/sorted[0].total*100).toFixed(1)}%"></div></div>`;
                            h += `<span class="w-24 text-right text-sm font-semibold">${d.total} MWh</span>`;
                            h += warn?'<span class="text-red-500">⚠️</span>':'<span class="w-5"></span>';
                            h += `<canvas id="spark-${cid}-${d.t}" width="80" height="24" class="flex-shrink-0"></canvas></div>`;
                        });
                        c.innerHTML = h;
                        sorted.forEach(d => drawSpark(`spark-${cid}-${d.t}`, d.daily, d.total<threshold?'#f87171':'#60a5fa'));
                    };

                    renderHeatmap('heatmapA');
                    renderRanking('rankingA');
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
                    
                    // 풍속 박스플롯 (다양한 케이스)
                    const windspeedPattern = [
                        { type: 'optimal', range: [6, 10], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 중간풍 Green
                        { type: 'weak', range: [3, 6], color: 'rgba(59, 130, 246, 0.6)', borderColor: 'rgb(59, 130, 246)' }, // 약풍 Blue
                        { type: 'optimal', range: [6, 10], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 중간풍 Green
                        { type: 'strong', range: [10, 15], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 강풍 Orange
                        { type: 'optimal', range: [6, 10], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 중간풍 Green
                        { type: 'weak', range: [3, 6], color: 'rgba(59, 130, 246, 0.6)', borderColor: 'rgb(59, 130, 246)' }, // 약풍 Blue
                        { type: 'optimal', range: [6, 10], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 중간풍 Green
                        { type: 'very_strong', range: [15, 22], color: 'rgba(239, 68, 68, 0.6)', borderColor: 'rgb(239, 68, 68)' }, // 매우 강풍 Red
                        { type: 'optimal', range: [6, 10], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 중간풍 Green
                        { type: 'strong', range: [10, 15], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 강풍 Orange
                        { type: 'calm', range: [0, 3], color: 'rgba(135, 206, 235, 0.6)', borderColor: 'rgb(135, 206, 235)' }, // 매우 약풍 Sky Blue
                        { type: 'optimal', range: [6, 10], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' } // 중간풍 Green
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
                            onClick: (event, elements, chart) => {
                                const xScale = chart.scales.x;
                                const idx = xScale.getValueForPixel(event.x);
                                if (idx >= 0 && idx < chart.data.labels.length) showWeatherDetail(idx + 1);
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
                            onClick: (event, elements, chart) => {
                                const xScale = chart.scales.x;
                                const idx = xScale.getValueForPixel(event.x);
                                if (idx >= 0 && idx < chart.data.labels.length) showWeatherDetail(idx + 1);
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
                        { type: 'normal', range: [0.8, 1.5], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 보통
                        { type: 'low', range: [0.3, 0.7], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 낮음
                        { type: 'normal', range: [0.8, 1.5], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 보통
                        { type: 'high', range: [1.4, 2.2], color: 'rgba(239, 68, 68, 0.6)', borderColor: 'rgb(239, 68, 68)' }, // 높음
                        { type: 'normal', range: [0.8, 1.5], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 보통
                        { type: 'low', range: [0.3, 0.7], color: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgb(16, 185, 129)' }, // 낮음
                        { type: 'normal', range: [0.8, 1.5], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 보통
                        { type: 'very_high', range: [2.0, 3.2], color: 'rgba(220, 38, 127, 0.6)', borderColor: 'rgb(220, 38, 127)' }, // 매우 높음
                        { type: 'normal', range: [0.8, 1.5], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' }, // 보통
                        { type: 'high', range: [1.4, 2.2], color: 'rgba(239, 68, 68, 0.6)', borderColor: 'rgb(239, 68, 68)' }, // 높음
                        { type: 'calm', range: [0.1, 0.4], color: 'rgba(34, 197, 94, 0.6)', borderColor: 'rgb(34, 197, 94)' }, // 매우 낮음
                        { type: 'normal', range: [0.8, 1.5], color: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgb(245, 158, 11)' } // 보통
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
                            onClick: (event, elements, chart) => {
                                const xScale = chart.scales.x;
                                const idx = xScale.getValueForPixel(event.x);
                                if (idx >= 0 && idx < chart.data.labels.length) showWeatherDetail(idx + 1);
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
                        const targetPanel = document.getElementById(targetPanelId.replace('#',''));
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
            // 박스플롯 체크박스 토글
            window.toggleBoxplot = function(type) {
                const map = { wind: 'boxplotWind', temp: 'boxplotTemp', wave: 'boxplotWave' };
                const chkMap = { wind: 'chkWind', temp: 'chkTemp', wave: 'chkWave' };
                const el = document.getElementById(map[type]);
                const checked = document.getElementById(chkMap[type]).checked;
                el.classList.toggle('hidden', !checked);
            };

            // 중기 박스플롯 체크박스 토글
            window.toggleMidtermBoxplot = function(type) {
                const map = { wind: 'midBoxplotWind', temp: 'midBoxplotTemp', wave: 'midBoxplotWave' };
                const chkMap = { wind: 'chkMidWind', temp: 'chkMidTemp', wave: 'chkMidWave' };
                document.getElementById(map[type]).classList.toggle('hidden', !document.getElementById(chkMap[type]).checked);
            };

            // 기상 상세 모달 기능
            window.showWeatherDetail = function(weekNumber) {
                const panel = document.getElementById('weatherDetailInline');
                const title = document.getElementById('modalTitle');
                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const fmt = d => d.toLocaleDateString('ko-KR', {month:'short', day:'numeric'});
                title.textContent = `${weekNumber}주차 상세 기상 정보 (${fmt(weekStart)} ~ ${fmt(weekEnd)})`;
                
                // 기존 차트 제거 후 재생성
                ['modalWindspeedChart', 'modalTemperatureChart', 'modalWaveChart'].forEach(chartId => {
                    if (charts[chartId]) { charts[chartId].destroy(); delete charts[chartId]; }
                });
                panel.classList.remove('hidden');
                setTimeout(() => {
                    createModalCharts(weekNumber);
                    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
            };
            
            window.closeWeatherModal = function() {
                document.getElementById('weatherDetailInline').classList.add('hidden');
                
                ['modalWindspeedChart', 'modalTemperatureChart', 'modalWaveChart'].forEach(chartId => {
                    if (charts[chartId]) {
                        charts[chartId].destroy();
                        delete charts[chartId];
                    }
                });
            };

            // 중기예측 24시간 O&M 모달
            window.showMidtermWeatherDetail = function(dayIndex) {
                const panel = document.getElementById('midtermWeatherInline');
                const title = document.getElementById('midtermModalTitle');
                const today = new Date();
                const targetDate = new Date(today);
                targetDate.setDate(targetDate.getDate() + dayIndex);
                title.textContent = `D+${dayIndex+1} 상세 기상 정보 (${targetDate.toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})})`;

                const hours = Array.from({length:24},(_,h)=>{
                    const data = generateHourlyWeatherData(h);
                    const wind = parseFloat(data.windSpeed);
                    const wave = parseFloat(data.waveHeight);
                    const temp = parseFloat(data.temp);
                    const windOk = wind <= 10;
                    const waveOk = wave <= 1.5;
                    const tempOk = temp >= 5 && temp <= 30;
                    const omStatus = (windOk && waveOk && tempOk) ? 'good' : (windOk && waveOk) ? 'warning' : 'danger';
                    return {...data, omStatus};
                });

                const hourHeaders = hours.map(h=>`<th class="text-center text-xs px-2 py-3 min-w-[44px]">${h.hour}시</th>`).join('');
                const statusRow = hours.map(h=>`<td class="text-center p-2"><div class="w-full h-5 rounded ${STATUS_COLORS[h.omStatus]}"></div></td>`).join('');

                const vars = [
                    {key:'windSpeed',label:'풍속',icon:'fa-wind',criteria:'≤ 10m/s',good:v=>v<=10},
                    {key:'temp',label:'기온',icon:'fa-temperature-high',criteria:'≤ 30°C',good:v=>v<=30},
                    {key:'temp',label:'기온(저)',icon:'fa-temperature-low',criteria:'≥ 5°C',good:v=>v>=5},
                    {key:'waveHeight',label:'파고',icon:'fa-water',criteria:'≤ 1.5m',good:v=>v<=1.5}
                ];
                const varRows = vars.map(v=>{
                    const cells = hours.map(h=>{
                        const val = parseFloat(h[v.key]);
                        return `<td class="text-center p-2"><span class="text-lg font-bold ${v.good(val)?'text-blue-600':'text-gray-400'}" title="${val.toFixed(1)}">${v.good(val)?'✓':'✗'}</span></td>`;
                    }).join('');
                    return `<tr><td class="sticky-col font-semibold text-gray-700 text-sm whitespace-nowrap px-3 py-3"><i class="fas ${v.icon} mr-1"></i>${v.label} <span class="text-xs text-gray-400">(${v.criteria})</span></td>${cells}</tr>`;
                }).join('');

                const windData = hours.map(h=>parseFloat(h.windSpeed));

                if (charts.midtermHourlyWindChart) { charts.midtermHourlyWindChart.destroy(); delete charts.midtermHourlyWindChart; }

                document.getElementById('midtermModalDetail').innerHTML = `
                    <h4 class="text-lg font-semibold mb-3"><i class="fas fa-wind mr-2 text-blue-600"></i>시간별 풍속 예측</h4>
                    <div class="chart-container h-[200px] mb-6"><canvas id="midtermHourlyWindChart"></canvas></div>
                    <h4 class="text-lg font-semibold mb-3"><i class="fas fa-clock mr-2 text-blue-600"></i>24시간 O&M 가능 여부 판단</h4>
                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse text-sm">
                            <thead><tr class="bg-gray-50"><th class="sticky-col text-left px-3 py-2 text-xs text-gray-500">항목</th>${hourHeaders}</tr></thead>
                            <tbody>
                                <tr class="bg-purple-50"><td class="sticky-col font-semibold text-purple-700 text-xs px-3 py-2"><i class="fas fa-check-circle mr-1"></i>종합</td>${statusRow}</tr>
                                ${varRows}
                            </tbody>
                        </table>
                    </div>`;

                panel.classList.remove('hidden');
                panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                const windspeedColors2 = windData.map(speed => {
                    if (speed < 3) return 'rgba(239, 68, 68, 0.8)';
                    else if (speed < 6) return 'rgba(245, 158, 11, 0.8)';
                    else if (speed <= 12) return 'rgba(16, 185, 129, 0.8)';
                    else return 'rgba(59, 130, 246, 0.8)';
                });

                setTimeout(() => {
                    charts.midtermHourlyWindChart = new Chart(document.getElementById('midtermHourlyWindChart').getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: hours.map(h=>`${h.hour}시`),
                        datasets: [{
                            label: '풍속 (m/s)',
                            data: windData,
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.3,
                            fill: true,
                            borderWidth: 2,
                            pointBackgroundColor: windspeedColors2,
                            pointBorderColor: windspeedColors2,
                            pointRadius: 4
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true },
                            tooltip: {
                                callbacks: {
                                    afterLabel: function(context) {
                                        const speed = context.parsed.y;
                                        if (speed < 3) return '발전 불가 (컷인 미달)';
                                        else if (speed < 6) return '저풍속 구간';
                                        else if (speed <= 12) return '최적 발전 구간';
                                        else return '정격 출력 구간';
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 20,
                                title: { display: true, text: '풍속 (m/s)' },
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
                });
                }, 50);
            };

            window.closeMidtermWeatherInline = function() {
                if (charts.midtermHourlyWindChart) { charts.midtermHourlyWindChart.destroy(); delete charts.midtermHourlyWindChart; }
                document.getElementById('midtermWeatherInline').classList.add('hidden');
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
                
                const doughnutOpts = { scales: {}, plugins: { legend: { display: false } } };

                const windLabels = ['매우 약풍 (0~3 m/s)', '약풍 (3~6 m/s)', '중간풍 (6~10 m/s)', '강풍 (10~15 m/s)', '매우 강풍 (≥15 m/s)'];
                const windColors = ['rgba(135, 206, 235, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'];
                charts.modalWindspeedChart = createChart(document.getElementById('modalWindspeedChart')?.getContext('2d'), 'doughnut',
                    windLabels,
                    [{ data: [data.windLow, 15, data.windOptimal, 20, 5], backgroundColor: windColors }],
                    doughnutOpts
                );
                
                const tempLabels = ['저온 (≤5℃)', '적정 (5~30℃)', '고온 (≥30℃)'];
                const tempColors = ['rgba(135, 206, 235, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'];
                charts.modalTemperatureChart = createChart(document.getElementById('modalTemperatureChart')?.getContext('2d'), 'doughnut',
                    tempLabels,
                    [{ data: [15, data.tempOptimal, data.tempHigh], backgroundColor: tempColors }],
                    doughnutOpts
                );
                
                const waveLabels = ['낮음 (< 0.8m)', '보통 (0.8~1.5m)', '높음 (> 1.5m)'];
                const waveColors = ['rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'];
                charts.modalWaveChart = createChart(document.getElementById('modalWaveChart')?.getContext('2d'), 'doughnut',
                    waveLabels,
                    [{ data: [data.waveSafe, 45, data.waveHigh], backgroundColor: waveColors }],
                    doughnutOpts
                );

                const renderLegend = (id, labels, colors) => {
                    document.getElementById(id).innerHTML = labels.map((l, i) =>
                        `<span class="inline-flex items-center mr-2 mb-1"><span class="inline-block w-3 h-3 rounded-sm mr-1" style="background:${colors[i]}"></span>${l}</span>`
                    ).join('');
                };
                renderLegend('windspeedLegend', windLabels, windColors);
                renderLegend('temperatureLegend', tempLabels, tempColors);
                renderLegend('waveLegend', waveLabels, waveColors);
                
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

                // 주간 일별 상세 기상 테이블 렌더링
                const detailContainer = document.getElementById('modalWeeklyDetail');
                if (!detailContainer) return;

                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

                const days = Array.from({length: 7}, (_, i) => {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() + i);
                    const weatherData = generateDailyWeatherData();
                    const wind = parseFloat(weatherData.windSpeed);
                    const wave = parseFloat(weatherData.waveHeight);
                    const maxT = parseFloat(weatherData.maxTemp);
                    const minT = parseFloat(weatherData.minTemp);
                    const windOk = wind <= 10;
                    const waveOk = wave <= 1.5;
                    const tempOk = maxT <= 30 && minT >= 5;
                    const omStatus = (windOk && waveOk && tempOk) ? 'good' : (windOk && waveOk) ? 'warning' : 'danger';
                    return { date: d, ...weatherData, omStatus };
                });

                const dayHeaders = days.map(d =>
                    `<th class="text-center text-xs px-2 py-2 whitespace-nowrap">${d.date.toLocaleDateString('ko-KR', {month:'short', day:'numeric', weekday:'short'})}</th>`
                ).join('');

                const statusRow = days.map(d =>
                    `<td class="text-center p-2"><div class="w-full h-4 rounded ${STATUS_COLORS[d.omStatus]}"></div></td>`
                ).join('');

                const variables = [
                    { key: 'windSpeed', label: '풍속', icon: 'fa-wind', criteria: '≤ 10m/s', good: v => v <= 10 },
                    { key: 'maxTemp', label: '최고기온', icon: 'fa-temperature-high', criteria: '≤ 30°C', good: v => v <= 30 },
                    { key: 'minTemp', label: '최저기온', icon: 'fa-temperature-low', criteria: '≥ 5°C', good: v => v >= 5 },
                    { key: 'waveHeight', label: '파고', icon: 'fa-water', criteria: '≤ 1.5m', good: v => v <= 1.5 }
                ];

                const varRows = variables.map(v => {
                    const cells = days.map(d => {
                        const val = parseFloat(d[v.key]);
                        const isGood = v.good(val);
                        return `<td class="text-center p-2">
                            <span class="text-lg font-bold ${isGood ? 'text-blue-600' : 'text-gray-400'} cursor-default" title="${val.toFixed(1)}">${isGood ? '✓' : '✗'}</span>
                        </td>`;
                    }).join('');
                    return `<tr><td class="sticky-col font-semibold text-gray-700 text-xs whitespace-nowrap px-3 py-2"><i class="fas ${v.icon} mr-1"></i>${v.label} <span class="text-xs text-gray-400">(${v.criteria})</span></td>${cells}</tr>`;
                }).join('');

                const confidenceRow = days.map(d =>
                    `<td class="text-center text-xs font-semibold py-2">${Math.floor(parseFloat(d.confidence) / 10) * 10}%</td>`
                ).join('');

                detailContainer.innerHTML = `
                    <h4 class="text-lg font-semibold mb-3"><i class="fas fa-calendar-week mr-2 text-blue-600"></i>주간 일별 상세 기상 : O&M 가능 여부 판단</h4>
                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse text-sm">
                            <thead><tr class="bg-gray-50"><th class="sticky-col text-left px-3 py-2 text-xs text-gray-500">항목</th>${dayHeaders}</tr></thead>
                            <tbody>
                                <tr class="bg-purple-50"><td class="sticky-col font-semibold text-purple-700 text-xs px-3 py-2"><i class="fas fa-check-circle mr-1"></i>종합</td>${statusRow}</tr>
                                <tr><td class="sticky-col font-semibold text-gray-700 text-xs px-3 py-2"><i class="fas fa-chart-line mr-1"></i>신뢰도</td>${confidenceRow}</tr>
                                ${varRows}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        });


        function initMaintenanceScheduler() {
            // TBD - 정비 스케줄 기능 비활성화
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
        
        // ==================== 날씨 데이터 생성 함수 ====================
        
        // 현실적인 강수량 생성 (확률 기반)
        const generateRealisticPrecipitation = () => {
            const rand = Math.random();
            if (rand < 0.8) return (Math.random() * 2).toFixed(1);      // 80%: 0-2mm
            if (rand < 0.95) return (2 + Math.random() * 6).toFixed(1); // 15%: 2-8mm
            return (8 + Math.random() * 7).toFixed(1);                  // 5%: 8-15mm
        };
        
        // 시간별 날씨 데이터 생성
        const generateHourlyWeatherData = (hour) => {
            return {
                hour: hour,
                windSpeed: (3 + Math.random() * 8).toFixed(1),
                temp: (10 + Math.random() * 15).toFixed(1),
                precip: generateRealisticPrecipitation(),
                humidity: (60 + Math.random() * 30).toFixed(0),
                waveHeight: (0.3 + Math.random() * 1.4).toFixed(1),
                lightning: (Math.random() * 20).toFixed(0),
                confidence: (70 + Math.random() * 25).toFixed(0)
            };
        };
        
        // 일별 날씨 데이터 생성
        const generateDailyWeatherData = () => {
            return {
                windSpeed: (3 + Math.random() * 9).toFixed(1),
                maxTemp: (15 + Math.random() * 15).toFixed(1),
                minTemp: (5 + Math.random() * 10).toFixed(1),
                precip: (Math.random() * 15).toFixed(1),
                waveHeight: (0.3 + Math.random() * 1.4).toFixed(1),
                confidence: (60 + Math.random() * 30).toFixed(0)
            };
        };
        
        // ==================== 상태 평가 함수 ====================
        
        // 10일 List 모드 렌더링 (개선된 UI)
        // 시간별 종합 상태 평가 함수
        function getHourlyOverallStatus(hourData) {
            const windSpeed = parseFloat(hourData.windSpeed);
            const temp = parseFloat(hourData.temp);
            const precip = parseFloat(hourData.precip);
            const waveHeight = parseFloat(hourData.waveHeight);

            // 위험 기준
            if (windSpeed >= WEATHER_THRESHOLDS.windSpeed.danger || 
                temp <= WEATHER_THRESHOLDS.temperature.dangerMin || 
                temp >= WEATHER_THRESHOLDS.temperature.dangerMax || 
                precip >= WEATHER_THRESHOLDS.precipitation.danger || 
                waveHeight >= WEATHER_THRESHOLDS.waveHeight.danger) {
                return 'danger';
            }
            
            // 주의 기준
            if (windSpeed >= WEATHER_THRESHOLDS.windSpeed.warning || 
                temp <= WEATHER_THRESHOLDS.temperature.warningMin || 
                temp >= WEATHER_THRESHOLDS.temperature.warningMax || 
                precip >= WEATHER_THRESHOLDS.precipitation.warning || 
                waveHeight >= WEATHER_THRESHOLDS.waveHeight.warning) {
                return 'warning';
            }
            
            return 'good';
        }

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
                    hourlyData.push(generateHourlyWeatherData(hour));
                }
                
                // 각 시간별 종합 상태 계산
                const hourlyStatuses = hourlyData.map(data => getHourlyOverallStatus(data));
                
                // 24시간 타임라인 생성 (종합 상태 기반)
                let timelineHtml = '<div class="weather-timeline-bar shadow-sm">';
                hourlyStatuses.forEach((status, idx) => {
                    timelineHtml += `<div class="weather-timeline-segment weather-status-${status}" title="${hourlyData[idx].hour}시: ${status === 'good' ? '양호' : status === 'warning' ? '주의' : '위험'}"></div>`;
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
                
                // 종합 상태 행 추가
                tableHtml += '<tr><td class="sticky-col font-semibold text-purple-700"><i class="fas fa-check-circle mr-2"></i>종합</td>';
                hourlyStatuses.forEach(status => {
                    tableHtml += `<td class="text-center p-2"><div class="w-full h-4 rounded ${STATUS_COLORS[status]}"></div></td>`;
                });
                tableHtml += '</tr>';
                
                // 각 변수별 행
                const variables = [
                    { key: 'windSpeed', label: '풍속 (m/s)', icon: 'fa-wind', color: 'blue', dangerThreshold: WEATHER_THRESHOLDS.windSpeed.danger },
                    { key: 'temp', label: '기온 (°C)', icon: 'fa-temperature-high', color: 'orange', dangerMin: WEATHER_THRESHOLDS.temperature.dangerMin, dangerMax: WEATHER_THRESHOLDS.temperature.dangerMax },
                    { key: 'precip', label: '강수량 (mm)', icon: 'fa-cloud-rain', color: 'cyan', dangerThreshold: WEATHER_THRESHOLDS.precipitation.danger },
                    { key: 'humidity', label: '상대습도 (%)', icon: 'fa-droplet', color: 'teal' },
                    { key: 'waveHeight', label: '파고 (m)', icon: 'fa-water', color: 'indigo', dangerThreshold: WEATHER_THRESHOLDS.waveHeight.danger },
                    { key: 'lightning', label: '낙뢰확률 (%)', icon: 'fa-bolt', color: 'yellow' },
                ];
                
                variables.forEach(variable => {
                    tableHtml += `<tr><td class="sticky-col font-semibold text-${variable.color}-700"><i class="fas ${variable.icon} mr-2"></i>${variable.label}</td>`;
                    hourlyData.forEach(data => {
                        let cellClass = 'text-center';
                        let value = data[variable.key];
                        const numValue = parseFloat(value);
                        
                        // 위험 기준에 따른 빨간 배경 표시
                        let isDanger = false;
                        if (variable.key === 'windSpeed' && numValue >= variable.dangerThreshold) {
                            isDanger = true;
                        } else if (variable.key === 'temp' && (numValue <= variable.dangerMin || numValue >= variable.dangerMax)) {
                            isDanger = true;
                        } else if (variable.key === 'precip' && numValue >= variable.dangerThreshold) {
                            isDanger = true;
                        } else if (variable.key === 'waveHeight' && numValue >= variable.dangerThreshold) {
                            isDanger = true;
                        }
                        
                        if (isDanger) {
                            cellClass += ' bg-red-500 text-white font-bold';
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

            // Wind Speed
            if (windSpeed >= WEATHER_THRESHOLDS.windSpeed.danger) {
                dangerCount++;
            }

            // Max Temperature
            if (maxTemp >= WEATHER_THRESHOLDS.temperature.dangerMax) {
                warningCount++;
            }

            // Min Temperature
            if (minTemp <= WEATHER_THRESHOLDS.temperature.dailyMin) {
                warningCount++;
            }

            // Precipitation
            if (precip >= WEATHER_THRESHOLDS.precipitation.danger) {
                warningCount++;
            }

            // Wave Height
            if (waveHeight >= WEATHER_THRESHOLDS.waveHeight.daily) {
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
                        ...generateDailyWeatherData()
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
                                    tableHtml += `<td class="text-center p-2"><div class="w-full h-4 rounded ${STATUS_COLORS[data.status]}"></div></td>`;
                                });
                                tableHtml += '</tr>';
                
                                // 각 변수별 행
                const variables = [
                    { key: 'windSpeed', label: '평균풍속', criteria: `< ${WEATHER_THRESHOLDS.windSpeed.danger}m/s`, icon: 'fa-wind', color: 'blue', goodRange: [0, WEATHER_THRESHOLDS.windSpeed.danger - 0.1] },
                    { key: 'maxTemp', label: '최고기온', criteria: `< ${WEATHER_THRESHOLDS.temperature.dangerMax}°C`, icon: 'fa-temperature-high', color: 'red', goodRange: [-Infinity, WEATHER_THRESHOLDS.temperature.dangerMax - 0.1] },
                    { key: 'minTemp', label: '최저기온', criteria: `> ${WEATHER_THRESHOLDS.temperature.dailyMin}°C`, icon: 'fa-temperature-low', color: 'blue', goodRange: [WEATHER_THRESHOLDS.temperature.dailyMin + 0.1, Infinity] },
                    { key: 'precip', label: '강수량', criteria: `< ${WEATHER_THRESHOLDS.precipitation.danger}mm`, icon: 'fa-cloud-rain', color: 'cyan', goodRange: [0, WEATHER_THRESHOLDS.precipitation.danger - 0.1] },
                    { key: 'waveHeight', label: '평균파고', criteria: `< ${WEATHER_THRESHOLDS.waveHeight.daily}m`, icon: 'fa-water', color: 'indigo', goodRange: [0, WEATHER_THRESHOLDS.waveHeight.daily - 0.1] },
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
                    ...generateDailyWeatherData()
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
                detailedHtml += `<td class="text-center p-2"><div class="w-full h-4 rounded ${STATUS_COLORS[data.status]}"></div></td>`;
            });
            detailedHtml += '</tr>';


            const variables = [
                { key: 'windSpeed', label: '평균풍속', criteria: `< ${WEATHER_THRESHOLDS.windSpeed.danger}m/s`, goodRange: [0, WEATHER_THRESHOLDS.windSpeed.danger - 0.1] },
                { key: 'maxTemp', label: '최고기온', criteria: `< ${WEATHER_THRESHOLDS.temperature.dangerMax}°C`, goodRange: [-Infinity, WEATHER_THRESHOLDS.temperature.dangerMax - 0.1] },
                { key: 'minTemp', label: '최저기온', criteria: `> ${WEATHER_THRESHOLDS.temperature.dailyMin}°C`, goodRange: [WEATHER_THRESHOLDS.temperature.dailyMin + 0.1, Infinity] },
                { key: 'precip', label: '강수량', criteria: `< ${WEATHER_THRESHOLDS.precipitation.danger}mm`, goodRange: [0, WEATHER_THRESHOLDS.precipitation.danger - 0.1] },
                { key: 'waveHeight', label: '평균파고', criteria: `< ${WEATHER_THRESHOLDS.waveHeight.daily}m`, goodRange: [0, WEATHER_THRESHOLDS.waveHeight.daily - 0.1] },
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
                    ...generateDailyWeatherData()
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
                detailedHtml += `<td class="text-center p-2"><div class="w-full h-4 rounded ${STATUS_COLORS[data.status]}"></div></td>`;
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
                { key: 'windSpeed', label: '평균풍속', criteria: `< ${WEATHER_THRESHOLDS.windSpeed.danger}m/s`, icon: 'fa-wind', goodRange: [0, WEATHER_THRESHOLDS.windSpeed.danger - 0.1] },
                { key: 'maxTemp', label: '최고기온', criteria: `< ${WEATHER_THRESHOLDS.temperature.dangerMax}°C`, icon: 'fa-temperature-high', goodRange: [-Infinity, WEATHER_THRESHOLDS.temperature.dangerMax - 0.1] },
                { key: 'minTemp', label: '최저기온', criteria: `> ${WEATHER_THRESHOLDS.temperature.dailyMin}°C`, icon: 'fa-temperature-low', goodRange: [WEATHER_THRESHOLDS.temperature.dailyMin + 0.1, Infinity] },
                { key: 'precip', label: '강수량', criteria: `< ${WEATHER_THRESHOLDS.precipitation.danger}mm`, icon: 'fa-cloud-rain', goodRange: [0, WEATHER_THRESHOLDS.precipitation.danger - 0.1] },
                { key: 'waveHeight', label: '평균파고', criteria: `< ${WEATHER_THRESHOLDS.waveHeight.daily}m`, icon: 'fa-water', goodRange: [0, WEATHER_THRESHOLDS.waveHeight.daily - 0.1] },
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

        let currentLang = 'en';

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
