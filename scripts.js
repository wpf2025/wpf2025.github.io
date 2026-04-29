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

        // 하루전 예측 날짜 선택
        const shorttermDate = { current: new Date() };

        // 2주 예측 날짜 선택
        const twoWeekDate = { current: new Date() };
        const updateTwoWeekDateLabel = () => {
            const label = document.getElementById('twoWeekDateLabel');
            if (label) {
                const d = twoWeekDate.current;
                const today = new Date(); today.setHours(0,0,0,0);
                const sel = new Date(d); sel.setHours(0,0,0,0);
                const diff = Math.round((today - sel) / 86400000);
                const tag = diff === 0 ? ' (오늘)' : diff === 1 ? ' (어제)' : diff > 1 ? ` (${diff}일 전)` : '';
                label.textContent = formatDate(d) + tag;
            }
        };
        const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const updateShorttermDateLabel = () => {
            const label = document.getElementById('shorttermDateLabel');
            if (label) label.textContent = formatDate(shorttermDate.current);
        };
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#shorttermDatePrev, #shorttermDateNext, #shorttermDateToday');
            if (!btn) return;
            if (btn.id === 'shorttermDateToday') {
                shorttermDate.current = new Date();
            } else {
                const d = new Date(shorttermDate.current);
                d.setDate(d.getDate() + (btn.id === 'shorttermDateNext' ? 1 : -1));
                shorttermDate.current = d;
            }
            updateShorttermDateLabel();
            if (typeof initChartsForCurrentView === 'function') initChartsForCurrentView();
        });
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#twoWeekDatePrev, #twoWeekDateNext, #twoWeekDateToday');
            if (!btn) return;
            if (btn.id === 'twoWeekDateToday') {
                twoWeekDate.current = new Date();
            } else {
                const d = new Date(twoWeekDate.current);
                d.setDate(d.getDate() + (btn.id === 'twoWeekDateNext' ? 1 : -1));
                twoWeekDate.current = d;
            }
            updateTwoWeekDateLabel();
            if (typeof initChartsForCurrentView === 'function') initChartsForCurrentView();
        });

        const destroyAllCharts = () => {
            Object.values(charts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            charts = {};
        };

        const initChartsForCurrentView = () => {
            updateShorttermDateLabel();
            updateTwoWeekDateLabel();
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
                    const windBase = [7.5,7.8,8.2,8.0,7.6,7.2,6.8,7.0,7.5,8.0,8.5,9.0,9.5,9.8,10.0,9.5,9.0,8.5,8.8,9.2,8.5,8.0,7.8,7.5];
                    const genWind = () => windBase.map(w=>+Math.max(0.5,w+Math.random()*4-2).toFixed(1));
                    const genPower = (wind) => wind.map(w=>{const p=w<3?0.2:w<6?w*0.8:w<10?w*1.3:w*1.4;return +Math.max(0,p+Math.random()*0.5).toFixed(1);});
                    const sumGWh = arr => (arr.reduce((a,b)=>a+b,0)/1000).toFixed(1);
                    const today = new Date(); today.setHours(0,0,0,0);
                    const sel = new Date(shorttermDate.current); sel.setHours(0,0,0,0);
                    const isToday = sel.getTime() === today.getTime();
                    const isPast = sel < today;
                    const kpiArea = document.getElementById('shorttermKpiArea');

                    const dayBoundaryPlugin = {
                        id:'dayBoundary',
                        beforeDraw(chart){
                            const ctx=chart.ctx, xScale=chart.scales.x, total=chart.data.labels.length;
                            for(let i=24;i<total;i+=24){
                                const x=xScale.getPixelForValue(i);
                                ctx.save();ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
                                ctx.beginPath();ctx.moveTo(x,chart.chartArea.top);ctx.lineTo(x,chart.chartArea.bottom);ctx.stroke();ctx.restore();
                            }
                        }
                    };

                    if (isPast) {
                        // === 과거 날짜: 예측 vs 실측 비교 (72시간 = D+1,D+2,D+3) ===
                        const fmtD = d => `${d.getMonth()+1}/${d.getDate()}`;
                        const labels = [];
                        for(let d=0;d<3;d++){const dt=new Date(sel);dt.setDate(dt.getDate()+d+1);for(let h=0;h<24;h++)labels.push(`${fmtD(dt)} ${h}시`);}

                        // 예측 기간 중 오늘 자정까지만 실측 존재
                        const fcstStart = new Date(sel); fcstStart.setDate(fcstStart.getDate()+1); fcstStart.setHours(0,0,0,0);
                        const nowTs = Date.now();
                        // 실측 가능 시간 수 (예측 시작 ~ 현재)
                        const actualHours = Math.min(72, Math.max(0, Math.floor((today.getTime() - fcstStart.getTime())/(3600000))));

                        const wFcst=[genWind(),genWind(),genWind()].flat();
                        const wActualFull=wFcst.map(v=>+Math.max(0,v+(Math.random()*3-1.5)).toFixed(1));
                        const pFcst=[genPower(wFcst.slice(0,24)),genPower(wFcst.slice(24,48)),genPower(wFcst.slice(48))].flat();
                        const pActualFull=pFcst.map(v=>+Math.max(0,v+(Math.random()*2-1)).toFixed(1));

                        // 실측: actualHours까지만, 나머지 null
                        const wActual = wActualFull.map((v,i)=>i<actualHours?v:null);
                        const pActual = pActualFull.map((v,i)=>i<actualHours?v:null);

                        const cap = 384; // 정격용량 MWh (19.2MW * 20기)

                        // 오차: 실측 있는 구간만 계산
                        let windMAE = '—', powerNMAE = '—', actualPowerSum = '—';
                        if (actualHours > 0) {
                            windMAE = (wFcst.slice(0,actualHours).reduce((s,v,i)=>s+Math.abs(v-wActualFull[i]),0)/actualHours).toFixed(2);
                            powerNMAE = ((pFcst.slice(0,actualHours).reduce((s,v,i)=>s+Math.abs(v-pActualFull[i]),0)/actualHours)/cap*100).toFixed(2);
                            actualPowerSum = sumGWh(pActualFull.slice(0,actualHours));
                        }
                        const hasAllActual = actualHours >= 72;
                        const actualNote = hasAllActual ? '' : ` (${actualHours}h/${72}h)`;

                        document.getElementById('shorttermTotalTitle').textContent = `발전소 전체 — 예측 vs 실측 비교 (${formatDate(sel)} 기준)`;
                        document.getElementById('shorttermWindTitle').textContent = `시간별 풍속 — 예측 vs 실측 (72시간)`;
                        document.getElementById('shorttermPowerTitle').textContent = `시간별 발전량 — 예측 vs 실측 (72시간)`;

                        kpiArea.innerHTML = `
                            <div class="p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
                                <p class="text-xs text-gray-500">예측 발전량 합계</p>
                                <p class="text-xl font-bold text-blue-700">${sumGWh(pFcst)} <span class="text-sm font-normal">GWh</span></p>
                            </div>
                            <div class="p-3 bg-green-50 rounded-lg text-center border border-green-200">
                                <p class="text-xs text-gray-500">실측 발전량 합계${actualNote}</p>
                                <p class="text-xl font-bold text-green-700">${actualHours>0?actualPowerSum:'—'} <span class="text-sm font-normal">GWh</span></p>
                            </div>
                            <div class="p-3 bg-white rounded-lg text-center border">
                                <p class="text-xs text-gray-500">예측 오차${actualNote}</p>
                                <div class="flex justify-around mt-1">
                                    <div><p class="text-xs text-gray-400">풍속 MAE</p><p class="text-lg font-bold text-amber-600">${windMAE} <span class="text-xs font-normal">${windMAE!=='—'?'m/s':''}</span></p></div>
                                    <div><p class="text-xs text-gray-400">발전량 nMAE</p><p class="text-lg font-bold text-red-600">${powerNMAE} <span class="text-xs font-normal">${powerNMAE!=='—'?'%':''}</span></p></div>
                                </div>
                            </div>`;

                        const cOpts = {responsive:true,maintainAspectRatio:false,
                            plugins:{legend:{display:true,position:'bottom',labels:{usePointStyle:true,pointStyle:'line'}}},
                            scales:{x:{ticks:{maxTicksLimit:18,maxRotation:0,callback:function(v,i){return i%6===0?this.getLabelForValue(i):''}}}}};

                        charts.shorttermWindChart = new Chart(document.getElementById('shorttermWindChart').getContext('2d'),{
                            type:'line',plugins:[dayBoundaryPlugin],
                            data:{labels,datasets:[
                                {label:'실측 풍속',data:wActual,borderColor:'rgb(59,130,246)',backgroundColor:'rgba(59,130,246,0.08)',borderWidth:2,tension:0.3,fill:true,pointRadius:0,spanGaps:false},
                                {label:'예측 풍속',data:wFcst,borderColor:'rgb(245,158,11)',borderDash:[5,3],borderWidth:2,tension:0.3,fill:false,pointRadius:0}
                            ]},options:{...cOpts,scales:{...cOpts.scales,y:{beginAtZero:true,title:{display:true,text:'m/s'}}}}
                        });
                        charts.shorttermPowerChart = new Chart(document.getElementById('shorttermPowerChart').getContext('2d'),{
                            type:'line',plugins:[dayBoundaryPlugin],
                            data:{labels,datasets:[
                                {label:'실측 발전량',data:pActual,borderColor:'rgb(16,185,129)',backgroundColor:'rgba(16,185,129,0.08)',borderWidth:2,tension:0.3,fill:true,pointRadius:0,spanGaps:false},
                                {label:'예측 발전량',data:pFcst,borderColor:'rgb(239,68,68)',borderDash:[5,3],borderWidth:2,tension:0.3,fill:false,pointRadius:0}
                            ]},options:{...cOpts,scales:{...cOpts.scales,y:{beginAtZero:true,title:{display:true,text:'MWh'}}}}
                        });

                    } else {
                        // === 오늘 또는 미래: 72시간 예측 (내일 0시 ~ D+3 23시) ===
                        const fmtD = d => `${d.getMonth()+1}/${d.getDate()}`;
                        const labels = [];
                        for(let d=0;d<3;d++){const dt=new Date(sel);dt.setDate(dt.getDate()+d+1);for(let h=0;h<24;h++)labels.push(`${fmtD(dt)} ${h}시`);}

                        const wFcst = [genWind(),genWind(),genWind()].flat();
                        const pFcst = [genPower(wFcst.slice(0,24)),genPower(wFcst.slice(24,48)),genPower(wFcst.slice(48))].flat();

                        document.getElementById('shorttermTotalTitle').textContent = `발전소 전체 예측 (72시간)`;
                        document.getElementById('shorttermWindTitle').textContent = `시간별 풍속 예측 (72시간)`;
                        document.getElementById('shorttermPowerTitle').textContent = `시간별 발전량 예측 (72시간)`;

                        const d1=pFcst.slice(0,24),d2=pFcst.slice(24,48),d3=pFcst.slice(48);
                        const dt1=new Date(sel);dt1.setDate(dt1.getDate()+1);
                        const dt2=new Date(sel);dt2.setDate(dt2.getDate()+2);
                        const dt3=new Date(sel);dt3.setDate(dt3.getDate()+3);
                        kpiArea.innerHTML = `
                            <div class="p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
                                <p class="text-xs text-gray-500">${fmtD(dt1)} 예상 발전량</p>
                                <p class="text-xl font-bold text-blue-700">${sumGWh(d1)} <span class="text-sm font-normal">GWh</span></p>
                            </div>
                            <div class="p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
                                <p class="text-xs text-gray-500">${fmtD(dt2)} 예상 발전량</p>
                                <p class="text-xl font-bold text-blue-700">${sumGWh(d2)} <span class="text-sm font-normal">GWh</span></p>
                            </div>
                            <div class="p-3 bg-amber-50 rounded-lg text-center border border-amber-200">
                                <p class="text-xs text-gray-500">${fmtD(dt3)} 예상 발전량</p>
                                <p class="text-xl font-bold text-amber-700">${sumGWh(d3)} <span class="text-sm font-normal">GWh</span></p>
                            </div>`;

                        const cOpts = {responsive:true,maintainAspectRatio:false,
                            plugins:{legend:{display:true,position:'bottom',labels:{usePointStyle:true,pointStyle:'line'}}},
                            scales:{x:{ticks:{maxTicksLimit:18,maxRotation:0,callback:function(v,i){return i%6===0?this.getLabelForValue(i):''}}}}};

                        charts.shorttermWindChart = new Chart(document.getElementById('shorttermWindChart').getContext('2d'),{
                            type:'line',plugins:[dayBoundaryPlugin],
                            data:{labels,datasets:[
                                {label:'예측 풍속',data:wFcst,borderColor:'rgb(245,158,11)',borderWidth:2,tension:0.3,fill:false,pointRadius:0}
                            ]},options:{...cOpts,scales:{...cOpts.scales,y:{beginAtZero:true,title:{display:true,text:'m/s'}}}}
                        });
                        charts.shorttermPowerChart = new Chart(document.getElementById('shorttermPowerChart').getContext('2d'),{
                            type:'line',plugins:[dayBoundaryPlugin],
                            data:{labels,datasets:[
                                {label:'예측 발전량',data:pFcst,borderColor:'rgb(239,68,68)',borderWidth:2,tension:0.3,fill:false,pointRadius:0}
                            ]},options:{...cOpts,scales:{...cOpts.scales,y:{beginAtZero:true,title:{display:true,text:'MWh'}}}}
                        });
                    }
                }
                // Per Turbine - 72시간 발전량 차트 (20호기)
                if (document.getElementById('shortterm-turbine-content')?.offsetParent !== null) {
                    const TC = 20;
                    const turbineColors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#e879f9','#14b8a6','#6366f1','#ec4899','#22c55e','#a855f7','#0ea5e9','#eab308','#d946ef','#64748b','#f43f5e','#2dd4bf'];
                    const today2 = new Date(); today2.setHours(0,0,0,0);
                    const sel2 = new Date(shorttermDate.current); sel2.setHours(0,0,0,0);
                    const isPast2 = sel2 < today2;
                    const fmtD2 = d => `${d.getMonth()+1}/${d.getDate()}`;

                    // 72시간 라벨
                    const tLabels = [];
                    for(let d=0;d<3;d++){const dt=new Date(sel2);dt.setDate(dt.getDate()+d+1);for(let h=0;h<24;h++)tLabels.push(`${fmtD2(dt)} ${h}시`);}

                    // 실측 가능 시간 (과거 모드)
                    const tFcstStart = new Date(sel2); tFcstStart.setDate(tFcstStart.getDate()+1); tFcstStart.setHours(0,0,0,0);
                    const tActualHours = isPast2 ? Math.min(72, Math.max(0, Math.floor((today2.getTime()-tFcstStart.getTime())/3600000))) : 0;

                    const tDayBoundary = {
                        id:'tDayBound',
                        beforeDraw(chart){
                            const ctx=chart.ctx,xS=chart.scales.x;
                            [24,48].forEach(idx=>{const x=xS.getPixelForValue(idx);ctx.save();ctx.strokeStyle='rgba(0,0,0,0.12)';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x,chart.chartArea.top);ctx.lineTo(x,chart.chartArea.bottom);ctx.stroke();ctx.restore();});
                        }
                    };

                    document.getElementById('shorttermTurbineTitle').textContent = isPast2
                        ? `개별 터빈 — 예측 vs 실측 (${formatDate(sel2)} 기준, 72시간)`
                        : `개별 터빈 발전량 예측 (72시간)`;

                    const grid = document.getElementById('shorttermTurbineDetailGrid');
                    if (grid) {
                        let html = '';
                        for (let i = 1; i <= TC; i++) html += `<div class="card"><h5 class="text-md font-semibold mb-3">WTG #${i}</h5><div class="chart-container h-[180px]"><canvas id="shorttermWtgDetail${i}"></canvas></div><div id="shorttermWtgWind${i}" class="mt-2"></div></div>`;
                        grid.innerHTML = html;

                        const windBase2 = [7.5,7.8,8.2,8.0,7.6,7.2,6.8,7.0,7.5,8.0,8.5,9.0,9.5,9.8,10.0,9.5,9.0,8.5,8.8,9.2,8.5,8.0,7.8,7.5];
                        const gW2 = () => windBase2.map(w=>+Math.max(0.5,w+Math.random()*4-2).toFixed(1));
                        const gP2 = (wind) => wind.map(w=>{const p=w<3?0.1:w<6?w*0.2:w<10?w*0.2:w*0.22;return +Math.max(0,p+Math.random()*0.3).toFixed(1);});
                        const wColor = s => s<3?'#87ceeb':s<6?'#3b82f6':s<10?'#10b981':s<15?'#f59e0b':'#ef4444';

                        for (let i = 1; i <= TC; i++) {
                            const c = turbineColors[i-1];
                            const wF = [gW2(),gW2(),gW2()].flat();
                            const pF = [gP2(wF.slice(0,24)),gP2(wF.slice(24,48)),gP2(wF.slice(48))].flat();
                            const datasets = [];
                            let wA = null;

                            if (isPast2 && tActualHours > 0) {
                                wA = wF.map((v,j)=>j<tActualHours?+Math.max(0.5,v+(Math.random()*3-1.5)).toFixed(1):null);
                                const pA = pF.map((v,j)=>j<tActualHours?+Math.max(0,v+(Math.random()*0.6-0.3)).toFixed(1):null);
                                datasets.push({label:'실측',data:pA,borderColor:c,backgroundColor:c+'15',borderWidth:2,tension:0.3,fill:true,pointRadius:0,spanGaps:false});
                                datasets.push({label:'예측',data:pF,borderColor:c,borderDash:[5,3],borderWidth:1.5,tension:0.3,fill:false,pointRadius:0});
                            } else {
                                datasets.push({label:'예측',data:pF,borderColor:c,borderWidth:2,tension:0.3,fill:false,pointRadius:0});
                            }

                            charts[`shorttermWtgDetail${i}`] = new Chart(document.getElementById(`shorttermWtgDetail${i}`).getContext('2d'),{
                                type:'line',plugins:[tDayBoundary],
                                data:{labels:tLabels,datasets},
                                options:{responsive:true,maintainAspectRatio:false,
                                    interaction:{mode:'index',intersect:false},
                                    plugins:{legend:{display:isPast2&&tActualHours>0,labels:{font:{size:10}}}},
                                    scales:{x:{ticks:{maxTicksLimit:9,maxRotation:0,callback:function(v,j){return j%12===0?this.getLabelForValue(j):'';}}},y:{beginAtZero:true,title:{display:true,text:'MWh'}}}}
                            });

                            // 풍속 컬러 바
                            const windEl = document.getElementById(`shorttermWtgWind${i}`);
                            if (windEl) {
                                const renderBar = (label, data) => {
                                    const segs = data.map((v,j) => v!==null ? `<div class="flex-1 h-full" style="background:${wColor(v)}" title="${tLabels[j]}: ${v} m/s"></div>` : `<div class="flex-1 h-full bg-gray-200"></div>`).join('');
                                    return `<div class="flex items-center gap-1 mb-0.5"><span class="text-[9px] text-gray-500 w-8 shrink-0">${label}</span><div class="flex-1 flex h-3 rounded overflow-hidden">${segs}</div></div>`;
                                };
                                let barHtml = '<div class="text-[9px] text-gray-400 mb-1">풍속 (m/s)</div>';
                                if (isPast2 && tActualHours > 0 && wA) {
                                    barHtml += renderBar('실측', wA);
                                }
                                barHtml += renderBar('예측', wF);
                                barHtml += `<div class="flex items-center gap-1 mt-1 text-[8px] text-gray-400"><span class="w-3 h-2 rounded" style="background:#87ceeb"></span>~3<span class="w-3 h-2 rounded" style="background:#3b82f6"></span>~6<span class="w-3 h-2 rounded" style="background:#10b981"></span>~10<span class="w-3 h-2 rounded" style="background:#f59e0b"></span>~15<span class="w-3 h-2 rounded" style="background:#ef4444"></span>15+</div>`;
                                windEl.innerHTML = barHtml;
                            }
                        }
                    }
                }
            }

            // 2 Week Forecast Charts
            if (document.getElementById('s_2week-content')?.offsetParent !== null) { 
                // Total Plant - Weekly & Daily (통합 페이지)
                if (document.getElementById('2week-total-content')?.offsetParent !== null) {
                    // 선택 날짜 기반 14일 라벨
                    const twSel = new Date(twoWeekDate.current);
                    const twFmtD = d => `${d.getMonth()+1}/${d.getDate()}`;
                    const twDayLabels = Array.from({length:14},(_,i)=>{const dt=new Date(twSel);dt.setDate(dt.getDate()+i+1);return twFmtD(dt);});

                    // 일평균 차트
                    const dailyPowerData = generateRandomData(14, 720, 1440);
                    window._midDailyPower = dailyPowerData;
                    charts.twoWeekDailyTotalChart = new Chart(document.getElementById('twoWeekDailyTotalChart')?.getContext('2d'), {
                        type:'line',
                        data:{labels:twDayLabels, datasets:[
                            {label:'일일 총 발전량 (MWh)',data:dailyPowerData,borderColor:'rgb(245,158,11)',tension:0.1,fill:false},
                            {label:'정비 반영 발전량 (MWh)',data:[...dailyPowerData],borderColor:'rgb(239,68,68)',borderDash:[5,3],tension:0.1,fill:false,borderWidth:2,pointRadius:0,hidden:true}
                        ]},
                        options:{...defaultChartOptions,plugins:{legend:{display:true}}}
                    });

                    // 중기예측 14일 기상 박스플롯 — 통합 (3개월 예측과 동일 방식)
                    const midDayLabels = twDayLabels;
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
                    window._midWindData = midWindPattern.map(p=>generateBoxplotData(p.range[0],p.range[1]));
                    window._midWindColors = midWindPattern.map(p=>p.color);
                    window._midWindBorders = midWindPattern.map(p=>p.border);
                    window._midTempData = midDayLabels.map(()=>generateBoxplotData(5,25));
                    window._midWaveData = midWavePattern.map(p=>generateBoxplotData(p.range[0],p.range[1]));
                    window._midWaveColors = midWavePattern.map(p=>p.color);
                    window._midWaveBorders = midWavePattern.map(p=>p.border);
                    window._midDayLabels = midDayLabels;
                    window.updateMidBoxplot = function() {
                        if(charts.midCombinedBoxplot){charts.midCombinedBoxplot.destroy();delete charts.midCombinedBoxplot;}
                        const showTemp = document.getElementById('chkMidTemp2')?.checked;
                        const showWave = document.getElementById('chkMidWave2')?.checked;
                        const datasets = [{label:'풍속 (m/s)',data:window._midWindData,backgroundColor:window._midWindColors,borderColor:window._midWindBorders,borderWidth:2,yAxisID:'y'}];
                        const scales = {y:{position:'left',title:{display:true,text:'풍속 (m/s)'},min:0,max:30}};
                        if(showTemp && showWave){
                            datasets.push({label:'기온 (℃)',data:window._midTempData,backgroundColor:'rgba(239,68,68,0.3)',borderColor:'rgb(239,68,68)',borderWidth:2,yAxisID:'y1'});
                            datasets.push({label:'파고 (m)',data:window._midWaveData,backgroundColor:window._midWaveColors.map(c=>c.replace('0.6','0.3')),borderColor:window._midWaveBorders,borderWidth:2,yAxisID:'y2'});
                            scales.y1={position:'right',title:{display:true,text:'기온 (℃)'},min:-10,max:40,grid:{drawOnChartArea:false}};
                            scales.y2={position:'right',title:{display:true,text:'파고 (m)'},min:0,max:3.5,grid:{drawOnChartArea:false}};
                        } else if(showTemp){
                            datasets.push({label:'기온 (℃)',data:window._midTempData,backgroundColor:'rgba(239,68,68,0.3)',borderColor:'rgb(239,68,68)',borderWidth:2,yAxisID:'y1'});
                            scales.y1={position:'right',title:{display:true,text:'기온 (℃)'},min:-10,max:40,grid:{drawOnChartArea:false}};
                        } else if(showWave){
                            datasets.push({label:'파고 (m)',data:window._midWaveData,backgroundColor:window._midWaveColors.map(c=>c.replace('0.6','0.3')),borderColor:window._midWaveBorders,borderWidth:2,yAxisID:'y1'});
                            scales.y1={position:'right',title:{display:true,text:'파고 (m)'},min:0,max:3.5,grid:{drawOnChartArea:false}};
                        }
                        charts.midCombinedBoxplot = new Chart(document.getElementById('midCombinedBoxplot').getContext('2d'),{
                            type:'boxplot',
                            data:{labels:window._midDayLabels,datasets},
                            options:{responsive:true,maintainAspectRatio:false,
                                onClick:(event,el,chart)=>{const idx=chart.scales.x.getValueForPixel(event.x);if(idx>=0&&idx<chart.data.labels.length)showMidtermWeatherDetail(idx);},
                                scales,plugins:{legend:{display:datasets.length>1}}}
                        });
                    };
                    updateMidBoxplot();

                    // 14일 O&M 가능 여부 요약 테이블
                    const omEl = document.getElementById('midtermOmSummary');
                    if (omEl) {
                        const days = Array.from({length:14}, (_,i) => {
                            const d = new Date(twoWeekDate.current); d.setDate(d.getDate()+i+1);
                            const w = window._midWindData[i], t = window._midTempData[i], wv = window._midWaveData[i];
                            const windOk = w.median <= 10, waveOk = wv.median <= 1.5;
                            const tempOk = t.median >= 5 && t.median <= 30;
                            const status = (windOk && waveOk && tempOk) ? 'good' : (windOk && waveOk) ? 'warning' : 'danger';
                            return {label:`D+${i+1}`, date:d, status, wind:w.median, temp:t.median, wave:wv.median};
                        });
                        const statusBg = {good:'bg-green-100 text-green-800',warning:'bg-yellow-100 text-yellow-800',danger:'bg-red-100 text-red-800'};
                        const statusIcon = {good:'🟢',warning:'🟡',danger:'🔴'};
                        const statusLabel = {good:'가능',warning:'조건부',danger:'불가'};
                        const fmt = d => `${d.getMonth()+1}/${d.getDate()}`;
                        omEl.innerHTML = `
                            <h5 class="text-md font-semibold mb-3"><i class="fas fa-check-circle mr-2 text-blue-600"></i>14일 O&M 가능 여부 요약</h5>
                            <div class="overflow-x-auto">
                                <table class="w-full text-xs border-collapse">
                                    <thead><tr class="bg-gray-50">
                                        <th class="px-2 py-2 text-left text-gray-500 min-w-[50px]">일자</th>
                                        ${days.map(d=>`<th class="px-1 py-2 text-center min-w-[52px]">${d.label}<br><span class="text-gray-400 font-normal">${fmt(d.date)}</span></th>`).join('')}
                                    </tr></thead>
                                    <tbody>
                                        <tr><td class="px-2 py-2 font-semibold text-gray-600">종합</td>${days.map(d=>`<td class="px-1 py-2 text-center"><span class="inline-block px-2 py-1 rounded-full text-xs font-bold ${statusBg[d.status]}">${statusIcon[d.status]}</span></td>`).join('')}</tr>
                                        <tr><td class="px-2 py-1 text-gray-500"><i class="fas fa-wind mr-1"></i>풍속</td>${days.map(d=>`<td class="px-1 py-1 text-center font-semibold ${d.wind<=10?'text-blue-600':'text-red-500'}">${d.wind<=10?'✓':'✗'}</td>`).join('')}</tr>
                                        <tr><td class="px-2 py-1 text-gray-500"><i class="fas fa-thermometer-half mr-1"></i>기온</td>${days.map(d=>`<td class="px-1 py-1 text-center font-semibold ${(d.temp>=5&&d.temp<=30)?'text-blue-600':'text-red-500'}">${(d.temp>=5&&d.temp<=30)?'✓':'✗'}</td>`).join('')}</tr>
                                        <tr><td class="px-2 py-1 text-gray-500"><i class="fas fa-water mr-1"></i>파고</td>${days.map(d=>`<td class="px-1 py-1 text-center font-semibold ${d.wave<=1.5?'text-blue-600':'text-red-500'}">${d.wave<=1.5?'✓':'✗'}</td>`).join('')}</tr>
                                    </tbody>
                                </table>
                            </div>`;
                    }
                }
                // Per Turbine (WTG #1 to #20) — Overview 3안 + 상세
                if (document.getElementById('s_2week-content')?.offsetParent !== null) {
                    const TC = 20;
                    const twSel2 = new Date(twoWeekDate.current);
                    const twFmtD2 = d => `${d.getMonth()+1}/${d.getDate()}`;
                    const dLabels = Array.from({length:14},(_,i)=>{const dt=new Date(twSel2);dt.setDate(dt.getDate()+i+1);return twFmtD2(dt);});
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
                        const daily = [], wind = [], dailyDay = [], windDay = [];
                        for (let d = 0; d < 14; d++) {
                            const baseWind = 4 + dayFactor[d] * 6;
                            const tWind = parseFloat(Math.max(1, baseWind + (Math.random() - 0.5) * 2).toFixed(1));
                            wind.push(tWind);
                            // 3MW 터빈, 일간 최대 72MWh. 풍속 기반 이용률 계산
                            const cf = tWind<3?0.02:tWind<6?0.1+tWind*0.03:tWind<10?0.25+tWind*0.04:tWind<15?0.6+tWind*0.015:0.85;
                            const power = parseFloat(Math.min(72, Math.max(0, 72 * cf * perf * (0.95+Math.random()*0.1))).toFixed(1));
                            daily.push(power);
                            // 08~18시 (10시간, 최대 30MWh)
                            const dayWind = parseFloat(Math.max(1, tWind * (0.95 + Math.random()*0.1)).toFixed(1));
                            windDay.push(dayWind);
                            const dayPower = parseFloat(Math.min(30, power * (10/24) * (0.9 + Math.random()*0.2)).toFixed(1));
                            dailyDay.push(dayPower);
                        }
                        const w1 = parseFloat(daily.slice(0, 7).reduce((a, b) => a + b, 0).toFixed(1));
                        const w2 = parseFloat(daily.slice(7).reduce((a, b) => a + b, 0).toFixed(1));
                        tData[t] = { weekly: [w1, w2], daily, wind, dailyDay, windDay, total: parseFloat(daily.reduce((a, b) => a + b, 0).toFixed(1)), totalDay: parseFloat(dailyDay.reduce((a,b)=>a+b,0).toFixed(1)) };
                    }
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
                    const renderHeatmap = (cid, dailyKey='daily', windKey='wind', totalKey='total', maxMWh=72) => {
                        const c = document.getElementById(cid); if(!c) return;
                        const step = maxMWh / 5;
                        const palette = [[255,249,196],[200,230,201],[179,229,252],[129,212,250],[79,195,247]];
                        const heatColorFn = (v) => {
                            const idx = Math.min(4, Math.floor(v / step));
                            const cl = palette[idx];
                            return `rgb(${cl[0]},${cl[1]},${cl[2]})`;
                        };
                        let h = '<div class="overflow-x-auto"><table class="w-full text-xs border-collapse"><thead><tr><th class="p-1 text-left sticky left-0 bg-white z-10">터빈</th>';
                        dLabels.forEach(l => { h += `<th class="p-1 text-center min-w-[44px]">${l}</th>`; });
                        h += '<th class="p-1 text-center min-w-[60px]">합계</th><th class="p-1 text-center min-w-[60px] text-red-500">손실</th></tr></thead><tbody>';
                        const plans = window._maintenancePlans || {};
                        for (let t = 1; t <= TC; t++) {
                            const d = tData[t];
                            h += `<tr><td class="p-1 font-semibold sticky left-0 bg-white z-10 whitespace-nowrap cursor-pointer text-blue-600 hover:text-blue-800 hover:underline" onclick="showTurbineDetail(${t})">WTG #${t} <i class="fas fa-chevron-right text-[10px] ml-1"></i></td>`;
                            d[dailyKey].forEach((v,i) => { h += `<td class="p-1 text-center cursor-pointer hover:ring-2 hover:ring-blue-400 hover:rounded" data-mt-key="${t}_${i}" title="발전량: ${v} MWh / 풍속: ${d[windKey][i]} m/s" onclick="openMaintenanceModal(${t},${i},${v},${d[windKey][i]})"><div class="w-full rounded px-0.5 py-0.5 leading-tight" style="background:${heatColorFn(v)}"><div class="text-[10px] font-semibold text-gray-800">${v}</div><div class="text-[9px] text-gray-600">${d[windKey][i]}</div></div></td>`; });
                            let loss = 0;
                            for (let i = 0; i < 14; i++) { const p = plans[`${t}_${i}`]; if(p){ const [sh,sm]=p.start.split(':').map(Number),[eh,em]=p.end.split(':').map(Number); loss+=Math.max(0,(eh+em/60)-(sh+sm/60))*5; } }
                            h += `<td class="p-1 text-center font-semibold">${d[totalKey]}</td>`;
                            h += `<td class="p-1 text-center font-semibold text-red-500">${loss>0?`-${Math.round(loss)}`:''}</td></tr>`;
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
                    renderHeatmap('heatmapDaytime','dailyDay','windDay','totalDay',30);
                    renderRanking('rankingA');
                    updateHeatmapMarkers();
                    updateMaintenanceLoss();
                    window._reRenderHeatmap = () => { renderHeatmap('heatmapA'); renderHeatmap('heatmapDaytime','dailyDay','windDay','totalDay',30); updateHeatmapMarkers(); };
                }
            }
            
            // Long-term Forecast Charts (3month only)
            if (document.getElementById('longterm-content')?.offsetParent !== null) {
                // 3 Month Forecast Charts
                if (document.getElementById('longterm-3month-content')?.offsetParent !== null) {
                    // 발전량 예측 차트들
                    // 월간 총 발전량 텍스트 KPI
                    const monthlyData = [{label:'1개월차',value:30},{label:'2개월차',value:32},{label:'3개월차',value:28}];
                    const mtEl = document.getElementById('monthlyTotalText');
                    if(mtEl) mtEl.innerHTML = monthlyData.map(m=>`<div class="bg-purple-50 rounded-lg p-4 text-center"><p class="text-sm text-gray-500 mb-1">${m.label}</p><p class="text-2xl font-bold text-purple-700">${m.value} <span class="text-sm font-normal">GWh</span></p></div>`).join('');
                    
                    charts.threeMonthWeeklyChart = createChart(document.getElementById('threeMonthWeeklyChart')?.getContext('2d'), 'line',
                        Array.from({length: 12}, (_, i) => `${i+1}주차`),
                        [{ label: '주간 예상 발전량 (GWh)', data: generateRandomData(12, 6, 9, 1), borderColor: 'rgb(14, 116, 144)', tension: 0.1, fill: false }]
                    );
                    
                    // 기상 예측 통합 박스플롯
                    const weekLabels = Array.from({length: 12}, (_, i) => `${i+1}주차`);
                    const windspeedPattern = [
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[3,6],color:'rgba(59,130,246,0.6)',border:'rgb(59,130,246)'},
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[10,15],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'},
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[3,6],color:'rgba(59,130,246,0.6)',border:'rgb(59,130,246)'},
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[15,22],color:'rgba(239,68,68,0.6)',border:'rgb(239,68,68)'},
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'},
                        {range:[10,15],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'},
                        {range:[0,3],color:'rgba(135,206,235,0.6)',border:'rgb(135,206,235)'},
                        {range:[6,10],color:'rgba(16,185,129,0.6)',border:'rgb(16,185,129)'}
                    ];
                    const wavePattern = [
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
                        {range:[0.8,1.5],color:'rgba(245,158,11,0.6)',border:'rgb(245,158,11)'}
                    ];
                    window._longWindData = windspeedPattern.map(p=>generateBoxplotData(p.range[0],p.range[1]));
                    window._longWindColors = windspeedPattern.map(p=>p.color);
                    window._longWindBorders = windspeedPattern.map(p=>p.border);
                    window._longTempData = weekLabels.map(()=>generateBoxplotData(-5,30));
                    window._longWaveData = wavePattern.map(p=>generateBoxplotData(p.range[0],p.range[1]));
                    window._longWaveColors = wavePattern.map(p=>p.color);
                    window._longWaveBorders = wavePattern.map(p=>p.border);
                    window._longWeekLabels = weekLabels;
                    window.updateLongBoxplot = function() {
                        if(charts.longCombinedBoxplot){charts.longCombinedBoxplot.destroy();delete charts.longCombinedBoxplot;}
                        const showTemp = document.getElementById('chkLongTemp')?.checked;
                        const showWave = document.getElementById('chkLongWave')?.checked;
                        const datasets = [{label:'풍속 (m/s)',data:window._longWindData,backgroundColor:window._longWindColors,borderColor:window._longWindBorders,borderWidth:2,yAxisID:'y'}];
                        const scales = {y:{position:'left',title:{display:true,text:'풍속 (m/s)'},min:0,max:30}};
                        if(showTemp && showWave){
                            datasets.push({label:'기온 (℃)',data:window._longTempData,backgroundColor:'rgba(239,68,68,0.3)',borderColor:'rgb(239,68,68)',borderWidth:2,yAxisID:'y1'});
                            datasets.push({label:'파고 (m)',data:window._longWaveData,backgroundColor:window._longWaveColors.map(c=>c.replace('0.6','0.3')),borderColor:window._longWaveBorders,borderWidth:2,yAxisID:'y2'});
                            scales.y1={position:'right',title:{display:true,text:'기온 (℃)'},min:-10,max:40,grid:{drawOnChartArea:false}};
                            scales.y2={position:'right',title:{display:true,text:'파고 (m)'},min:0,max:3.5,grid:{drawOnChartArea:false}};
                        } else if(showTemp){
                            datasets.push({label:'기온 (℃)',data:window._longTempData,backgroundColor:'rgba(239,68,68,0.3)',borderColor:'rgb(239,68,68)',borderWidth:2,yAxisID:'y1'});
                            scales.y1={position:'right',title:{display:true,text:'기온 (℃)'},min:-10,max:40,grid:{drawOnChartArea:false}};
                        } else if(showWave){
                            datasets.push({label:'파고 (m)',data:window._longWaveData,backgroundColor:window._longWaveColors.map(c=>c.replace('0.6','0.3')),borderColor:window._longWaveBorders,borderWidth:2,yAxisID:'y1'});
                            scales.y1={position:'right',title:{display:true,text:'파고 (m)'},min:0,max:3.5,grid:{drawOnChartArea:false}};
                        }
                        charts.longCombinedBoxplot = new Chart(document.getElementById('longCombinedBoxplot').getContext('2d'),{
                            type:'boxplot',
                            data:{labels:window._longWeekLabels,datasets},
                            options:{responsive:true,maintainAspectRatio:false,
                                onClick:(event,el,chart)=>{const idx=chart.scales.x.getValueForPixel(event.x);if(idx>=0&&idx<chart.data.labels.length)showWeatherDetail(idx+1);},
                                scales,plugins:{legend:{display:datasets.length>1}}}
                        });
                    };
                    updateLongBoxplot();

                }
            }

            // Details Chart
            // details 섹션 제거됨
        };
        
        document.addEventListener('DOMContentLoaded', () => {
            const sidebarItems = document.querySelectorAll('.sidebar-item');
            const mainTitle = document.getElementById('main-title');

            // ===== 페이지 전환: 홈 vs O&M 상세 =====
            const showHome = () => {
                document.getElementById('home-content').classList.remove('hidden');
                document.getElementById('om-detail-content').classList.add('hidden');
                mainTitle.textContent = 'Home';
                sidebarItems.forEach(i => i.classList.remove('active'));
                document.querySelector('.sidebar-item[data-target="home"]')?.classList.add('active');
                initChartsForCurrentView();
            };

            const showOmDetail = (tab = 'overview') => {
                document.getElementById('home-content').classList.add('hidden');
                document.getElementById('om-detail-content').classList.remove('hidden');
                mainTitle.textContent = 'O&M 발전소 현황';
                sidebarItems.forEach(i => i.classList.remove('active'));
                document.querySelector('.sidebar-item[data-target="om-detail"]')?.classList.add('active');
                switchOmTab(tab);
            };

            // ===== O&M 탭 전환 =====
            const switchOmTab = (tab) => {
                // 탭 버튼 활성화
                document.querySelectorAll('.om-tab-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.omTab === tab);
                });
                // 패널 전환
                document.querySelectorAll('.om-tab-panel').forEach(p => p.classList.add('hidden'));
                const panel = document.getElementById(`om-${tab}`);
                if (panel) panel.classList.remove('hidden');

                // 하루전/2주 기본 탭 초기화
                if (tab === 'shortterm') {
                    document.querySelectorAll('#shorttermMainTabs .tab-button').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
                    document.getElementById('shortterm-total-tab')?.classList.add('active');
                    document.getElementById('shortterm-total-tab')?.setAttribute('aria-selected','true');
                    document.querySelectorAll('#shortterm-content .main-tab-panel').forEach(p => p.classList.add('hidden'));
                    document.getElementById('shortterm-total-content')?.classList.remove('hidden');
                }
                if (tab === '2week') {
                    document.querySelectorAll('#twoWeekMainTabs .tab-button').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
                    document.getElementById('2week-total-tab')?.classList.add('active');
                    document.getElementById('2week-total-tab')?.setAttribute('aria-selected','true');
                    document.querySelectorAll('#s_2week-content .main-tab-panel').forEach(p => p.classList.add('hidden'));
                    document.getElementById('2week-total-content')?.classList.remove('hidden');
                }

                initChartsForCurrentView();
            };

            // O&M 탭 버튼 클릭
            document.querySelectorAll('.om-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => switchOmTab(btn.dataset.omTab));
            });

            // ← 전체 버튼
            document.getElementById('omBackBtn')?.addEventListener('click', showHome);

            // 메인 홈에서 O&M 상세로 이동
            window.navigateToOmDetail = (plant) => {
                const sel = document.getElementById('omPlantSelect');
                if (sel) sel.value = plant;
                showOmDetail('overview');
            };

            // 사이드바 클릭
            sidebarItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    sidebarItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    const target = item.dataset.target;
                    if (target === 'home') { showHome(); return; }
                    if (target === 'om-detail') { showOmDetail('overview'); return; }
                    // 다른 메뉴는 placeholder (향후 구현)
                    mainTitle.textContent = item.textContent.trim();
                });
            });

            // 로고 클릭 → 홈
            document.getElementById('logo-link')?.addEventListener('click', (e) => { e.preventDefault(); showHome(); });

            // 초기 화면: 홈
            showHome();

            // 오늘 기상예보 초기화
            initTodayWeather();

            const setupTabs = (tabContainerSelector, parentOfPanelsSelector, panelChildClassName, defaultActiveIndex = 0) => {
                const tabs = document.querySelectorAll(`${tabContainerSelector} [role="tab"]`);
                const panelParentElement = document.querySelector(parentOfPanelsSelector);
                if (!panelParentElement) return;
                const panels = Array.from(panelParentElement.children).filter(child => child.classList.contains(panelChildClassName));
                if (tabs.length === 0) return;
                tabs.forEach((tab) => {
                    tab.addEventListener('click', (e) => {
                        e.preventDefault();
                        tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
                        tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
                        panels.forEach(panel => panel.classList.add('hidden'));
                        const targetPanel = document.getElementById(tab.getAttribute('data-tabs-target').replace('#',''));
                        if (targetPanel) targetPanel.classList.remove('hidden');
                        initChartsForCurrentView();
                    });
                });
                if (tabs.length > defaultActiveIndex) {
                    tabs.forEach((tab, index) => {
                        tab.classList.toggle('active', index === defaultActiveIndex);
                        tab.setAttribute('aria-selected', (index === defaultActiveIndex).toString());
                    });
                    panels.forEach((p, index) => p.classList.toggle('hidden', index !== defaultActiveIndex));
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

            // (로고 클릭 + 초기화는 위 showHome/navigateToOmDetail에서 처리)

            // 중기 박스플롯은 updateMidBoxplot()으로 통합 (initChartsForCurrentView 내에서 정의)

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

            // 정비 계획 모달
            window._maintenancePlans = JSON.parse(localStorage.getItem('maintenancePlans') || '{}');

            window.switchHeatmap = function() {
                const mode = document.querySelector('input[name="heatmapMode"]:checked')?.value || 'all';
                document.getElementById('heatmapA').classList.toggle('hidden', mode !== 'all');
                document.getElementById('heatmapDaytime').classList.toggle('hidden', mode !== 'daytime');
                document.getElementById('heatmapLegendMax').textContent = mode === 'all' ? '72 MWh' : '30 MWh';
            };

            window.openMaintenanceModal = function(turbine, dayIdx, power, wind) {
                const d = new Date(); d.setDate(d.getDate() + dayIdx + 1);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                document.getElementById('mtModalTurbine').textContent = `WTG #${turbine}`;
                document.getElementById('mtModalDate').textContent = dateStr;
                document.getElementById('mtModalPower').textContent = `${power} MWh`;
                document.getElementById('mtModalWind').textContent = `${wind} m/s`;
                const key = `${turbine}_${dayIdx}`;
                const existing = window._maintenancePlans[key];
                document.getElementById('mtModalType').value = existing?.type || '정기 점검';
                document.getElementById('mtModalStart').value = existing?.start || '09:00';
                document.getElementById('mtModalEnd').value = existing?.end || '17:00';
                document.getElementById('mtModalMemo').value = existing?.memo || '';
                document.getElementById('maintenanceModal').dataset.key = key;
                document.getElementById('mtDeleteBtn').classList.toggle('hidden', !existing);
                document.getElementById('maintenanceModal').classList.remove('hidden');
            };

            window.closeMaintenanceModal = function() {
                document.getElementById('maintenanceModal').classList.add('hidden');
            };

            window.deleteMaintenancePlan = function() {
                const key = document.getElementById('maintenanceModal').dataset.key;
                delete window._maintenancePlans[key];
                localStorage.setItem('maintenancePlans', JSON.stringify(window._maintenancePlans));
                closeMaintenanceModal();
                updateMaintenanceLoss();
                if (typeof window._reRenderHeatmap === 'function') window._reRenderHeatmap();
                else updateHeatmapMarkers();
            };

            window.saveMaintenancePlan = function() {
                const key = document.getElementById('maintenanceModal').dataset.key;
                window._maintenancePlans[key] = {
                    type: document.getElementById('mtModalType').value,
                    start: document.getElementById('mtModalStart').value,
                    end: document.getElementById('mtModalEnd').value,
                    memo: document.getElementById('mtModalMemo').value
                };
                localStorage.setItem('maintenancePlans', JSON.stringify(window._maintenancePlans));
                closeMaintenanceModal();
                updateMaintenanceLoss();
                if (typeof window._reRenderHeatmap === 'function') window._reRenderHeatmap();
                else updateHeatmapMarkers();
            };

            window.updateMaintenanceLoss = function() {
                const plans = window._maintenancePlans;
                const keys = Object.keys(plans);
                const lossEl = document.getElementById('maintenanceLossKpi');
                const adjEl = document.getElementById('maintenanceAdjustedKpi');
                const sumEl = document.getElementById('maintenancePlanSummary');
                if (!keys.length) {
                    lossEl?.classList.add('hidden'); adjEl?.classList.add('hidden'); sumEl?.classList.add('hidden');
                    // 차트 정비 라인 숨기기
                    const chart = charts.twoWeekDailyTotalChart;
                    if (chart && chart.data.datasets[1]) { chart.data.datasets[1].hidden = true; chart.update(); }
                    return;
                }
                // 일별 손실 계산
                const dailyLoss = Array(14).fill(0);
                let totalLoss = 0;
                const planList = [];
                keys.forEach(k => {
                    const p = plans[k];
                    const [t, d] = k.split('_').map(Number);
                    const [sh,sm] = p.start.split(':').map(Number), [eh,em] = p.end.split(':').map(Number);
                    const hours = Math.max(0, (eh+em/60)-(sh+sm/60));
                    const loss = hours * 5;
                    if (d >= 0 && d < 14) dailyLoss[d] += loss;
                    totalLoss += loss;
                    planList.push({t,d,type:p.type,start:p.start,end:p.end,loss:Math.round(loss)});
                });
                // 손실 KPI
                document.getElementById('maintenanceLossValue').textContent = `${Math.round(totalLoss)} MWh`;
                lossEl?.classList.remove('hidden');
                // 정비 반영 예상 KPI
                const basePower = window._midDailyPower;
                if (basePower && adjEl) {
                    const totalBase = basePower.reduce((a,b)=>a+b,0);
                    const adjusted = totalBase - totalLoss;
                    document.getElementById('maintenanceAdjustedValue').textContent = `${(adjusted/1000).toFixed(1)} GWh`;
                    adjEl.classList.remove('hidden');
                }
                // 정비 내역 요약
                if (sumEl) {
                    planList.sort((a,b)=>a.d-b.d||a.t-b.t);
                    sumEl.innerHTML = `<div class="mt-3 p-3 bg-gray-50 rounded-lg border text-xs">
                        <p class="font-semibold text-gray-600 mb-2"><i class="fas fa-list mr-1"></i>정비 계획 (${planList.length}건)</p>
                        ${planList.map(p=>`<div class="flex justify-between py-1 border-b border-gray-100">
                            <span class="text-gray-700">D+${p.d+1} WTG#${p.t}</span>
                            <span class="text-gray-500">${p.type} ${p.start}~${p.end}</span>
                            <span class="text-red-500 font-semibold">-${p.loss} MWh</span>
                        </div>`).join('')}
                    </div>`;
                    sumEl.classList.remove('hidden');
                }
                // 차트 정비 반영 라인 업데이트
                const chart = charts.twoWeekDailyTotalChart;
                if (chart && basePower) {
                    const adjData = basePower.map((v,i) => Math.max(0, v - dailyLoss[i]));
                    chart.data.datasets[1].data = adjData;
                    chart.data.datasets[1].hidden = false;
                    chart.update();
                }
            };

            window.updateHeatmapMarkers = function() {
                const plans = window._maintenancePlans;
                document.querySelectorAll('[data-mt-key]').forEach(cell => {
                    const key = cell.dataset.mtKey;
                    if (plans[key]) {
                        cell.classList.add('ring-2','ring-red-400','rounded');
                        let badge = cell.querySelector('.mt-badge');
                        if (!badge) {
                            badge = document.createElement('div');
                            badge.className = 'mt-badge absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center';
                            badge.innerHTML = '<i class="fas fa-wrench text-white" style="font-size:8px"></i>';
                            cell.style.position = 'relative';
                            cell.appendChild(badge);
                        }
                    } else {
                        cell.classList.remove('ring-2','ring-red-400','rounded');
                        cell.querySelector('.mt-badge')?.remove();
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
