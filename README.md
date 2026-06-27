# MU · SOXL · KOSPI 전략 대시보드

MU, SOXL, KOSPI, MSCI World ETF(URTH), Philadelphia Semiconductor Index, Roundhill Memory ETF(DRAM)를 한 화면에서 보는 GitHub Pages용 정적 대시보드입니다.

## 포함 기능

- KOSPI 50일 이동평균 이격도
- MU, SOXL, MSCI World ETF, Philadelphia Semiconductor Index, DRAM ETF 현황
- 최근 6개월 상대 흐름 차트
- 전략 추가, 수정, 삭제
- GitHub Actions 자동 데이터 갱신

## GitHub 업로드

이 폴더 안의 파일과 폴더 전체를 GitHub 저장소 맨 위에 올립니다.

```text
.github
public
scripts
.gitignore
package.json
README.md
server.js
start.ps1
```

GitHub 저장소 `Settings > Pages`에서 Source를 `GitHub Actions`로 선택하면 됩니다.

## 로컬 실행

```powershell
.\start.ps1
```

브라우저에서 아래 주소를 엽니다.

```text
http://localhost:4174
```

## 데이터

데이터는 Yahoo Finance 공개 차트 API를 사용합니다. MSCI 지수는 Yahoo에서 안정적으로 조회되는 `URTH`를 MSCI World ETF 대용 지표로 표시합니다.
