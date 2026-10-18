# 리디자인 인수·문서 정리

현재 전체계획·요구대조·게임방설계는 [대표인수문서](../../preserved-work/2026-10-18/README.ko.md)에서 찾는다. 이전중복문서의파일명/삭제이유/대표대체문서/기존SHA-256/복구커밋은 [doc-cleanup.json](doc-cleanup.json)에기록했다. Git이력은변경하지않았다.

현재 요구사항 문서는 남아 있다. 최종 계획·추적표에는 최신 157개와 이전에만 있던 29개, 총 186개 요구사항이 보존되어 있다. 미발견인 것은 과거 사용자 대화 0–13절의 별도 원문 파일이며, 요구사항 목록이 없다는 뜻이 아니다.

이전only29요구는최신요구대조표부록에그대로통합했다. 고유실패·금지·렌더계약·성능측정정정은 [검수제한](../../preserved-work/2026-10-18/REVIEW-LIMITATIONS.ko.md)에남겼다. 과거완료/승인대기표현은현재사용자전체구현지시보다우선하지않는다.

## 승인자산·소스·검수

- 승인게임방원본1672×941, 캐릭터/토끼와해시: [source-sha256.json](../../public/images/approved-couple-room/source-sha256.json). 같은폴더의source·파생provenance와README를유지한다.
- 새구현은src/landing의실제활성배선을따른다. 소스비활성버전정리는같은폴더의inactive-source-cleanup.json과구분한다. 문서삭제를런타임성능개선으로주장하지않는다.
- QA증거는새브라우저검수산출물을기준으로갱신한다. preserved-work의과거PNG/영상/JSON은현재통합합격증거가아니다. 이문서정리에서는브라우저/게임/실제GPU를검수하지않았다.
- main병합·배포는별도승인전금지. 원래사용자0–13절독립원문전체는미발견이며계획/추적표를원문으로간주하지않는다.

복구는manifest의restoreCommit과file을이용해git show로원래내용을읽을수있다. 제품source/모델/텍스처/PNG/영상/원시JSON/승인원본/license/skill/game계약은이정리에서삭제하지않았다.
