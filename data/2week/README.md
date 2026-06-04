# 2주 예측 데이터 형식

## 디렉토리 구조

```
data/2week/
├── {발전소명}/
│   ├── _template_plant.json      ← 발전소 전체 데이터 템플릿
│   ├── _template_turbines.json   ← 터빈별 데이터 템플릿
│   ├── YYYY-MM-DD_plant.json     ← 예측 수행일 기준 발전소 데이터
│   └── YYYY-MM-DD_turbines.json  ← 예측 수행일 기준 터빈별 데이터
```

- 파일명의 날짜는 **예측 수행일** 기준 (예: 2026-05-14에 수행한 예측)
- 예측 대상 기간은 파일 내부 `period` 필드에 명시 (D+1 ~ D+14)

## 발전소 전체 데이터 (`{날짜}_plant.json`)

| 필드 | 타입 | 설명 |
|------|------|------|
| `forecast_date` | string | 예측 수행일 (YYYY-MM-DD) |
| `plant` | string | 발전소명 |
| `period.start` | string | 예측 시작일 (D+1) |
| `period.end` | string | 예측 종료일 (D+14) |
| `weather.hourly.wind_speed` | float[14][24] | 시간별 풍속 (m/s) |
| `weather.hourly.temperature` | float[14][24] | 시간별 기온 (°C) |
| `weather.hourly.wave_height` | float[14][24] | 시간별 파고 (m) |
| `weather.daily_stats.wind_speed` | object[14] | 일별 풍속 통계 {min, q1, median, q3, max} |
| `weather.daily_stats.temperature` | object[14] | 일별 기온 통계 |
| `weather.daily_stats.wave_height` | object[14] | 일별 파고 통계 |
| `power.daily_total` | int[14] | 일별 총 발전량 (MWh, 발전소 전체) |
| `power.weekly_total` | int[2] | 주간 총 발전량 [1주차, 2주차] (MWh) |

## 터빈별 데이터 (`{날짜}_turbines.json`)

| 필드 | 타입 | 설명 |
|------|------|------|
| `forecast_date` | string | 예측 수행일 |
| `plant` | string | 발전소명 |
| `period.start` | string | 예측 시작일 |
| `period.end` | string | 예측 종료일 |
| `turbines.WTGxx.hourly.power` | float[14][24] | 터빈별 시간별 발전량 (MWh) |
| `turbines.WTGxx.hourly.wind_speed` | float[14][24] | 터빈별 시간별 풍속 (m/s) |

- 터빈 키: `WTG01` ~ `WTG20` (2자리 zero-padding)
- 발전량 단위: MWh (호기당, 정격 3MW 기준 시간당 최대 3MWh)

## 데이터 로드 규칙

1. 페이지에서 선택한 날짜로 `{날짜}_plant.json` fetch 시도
2. 파일 존재 → 실데이터 표시 ("예측 데이터" 배지)
3. 파일 미존재 (404) → 랜덤 데이터 fallback ("SAMPLE" 배지)
