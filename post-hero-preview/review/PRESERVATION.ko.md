# 후반부 프로젝트 보존

기존 대표 브랜치 `feature/post-hero-preview`에 이 세션의 독립 후반부 작업을 보존한다. 기준 커밋은 `b37c10b5a93d44236a7d5ed5834b817531e8ea39`이며 기능/설계/검수의 기존 커밋 `fcf726a`, `a1c122b`, `b086882`, `40697fe`, `7349a3f`를 유지한다. Hero와 게임 수정 브랜치는 통합하거나 변경하지 않는다.

## 포함

- `post-hero-preview/`: 독립 React/Three.js 구현, 원문 직접 import, 실제 편지 개봉·닫기·DOM 투영 연결, 로컬 상호작용과 양언어 처리, package/lock 및 빌드 설정.
- `src/*.test.ts`, `scripts/`, `review/*.json`: 상태/투영 단위테스트와 실제 브라우저 검수 스크립트·결과.
- `design-sessions/post-hero-2026-10-18/`: 장면·자산 조사·원문 대조·파일 소유·인수 계약을 담은 사용자용 설계 문서.
- `review/screenshots/current/`: 현재 장면1600×1000 여섯 장과 모바일 소개/엔딩 네 장.
- `review/screenshots/handoff/`: 편지 투영→읽기면 연결의 네 정지 pose.
- `review/screenshots/baseline-fcf726a/`: 이전 검증 상태의 열두 캡처. 현재 시안이나 승인 이미지로 간주하지 않는다.

캡처 26개, 합계13,393,466bytes, 가장 큰 파일1,105,554bytes. GitHub 일반 파일의50MiB 경고·100MiB 차단 한도에 도달하는 신규 파일은 없다. 참고: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github

## 제외와 별도 보존

자격 증명/.env/token, node_modules/cache/dist, 임시 Library 전송 헬퍼와 내부 실행 기록은 추가하지 않는다. `.env.example`과 기존 프로젝트 소스는 원래 저장소 상태를 유지한다. 새 소스·문서의 자격 증명/서명URL 패턴 검사에서는 탐지 항목이 없었다.

`output/`는 저장소 ignore 정책을 유지하고 사용자용으로 검증된 캡처만 review로 복사했다. 초기 실패 진단 캡처2개는 임시 기록으로 로컬에 남겼다. 파일을 삭제하지 않았다. `/workspace/scratch/post-hero-delivery/`의 과거ZIP4개와 중복 추출 이미지/patch는 소스·캡처·Git 커밋과 중복되는 포장 산출물이라 Git에 중복 적재하지 않는다. 로컬 원본은 그대로 보존하며 최신 묶음은 `Yeonseok-Lisbeth-Post-Hero-Direction-Pending-v4.zip`이다.

이 환경에는 메인 세션의 최신 승인7종 말·커플 사진 조커·의사/한복 귀족과 기존7개 영상/제작 소스가 없다. 이 세션의 기존 승인 커플 컷아웃과 봉투 참고 자산은 원래public 경로를 사용한다. 없는 최신 자산을 옛 로컬 자산으로 대체하지 않는다.

## 상태

검수는 기능·원문·화면 상태의 증거이며 디자인 합격이 아니다. 부모의 세 아트 디렉션 비교 결과를 기다리므로 추가 조형·재질 작업을 보류했다. 보존 push는 main 병합, 배포, 공개 사이트 게시, Library 전송 우회가 아니다.
