# 캐치마인드 2인용 규칙 (2026-10-24)

## 공개 게임에서 확인한 요소

- [skribbl.io](https://skribbl.io/)는 단어 선택, 그림, 채팅 추측, 라운드별 제한 시간·힌트 설정, 총점 승리를 제공한다. 공개 설명은 정확한 점수식과 힌트 공개 시각을 규정하지 않는다.
- [Classic Gartic 규칙](https://gartic.com.br/regras/)에는 글자 수·첫 글자·추가 글자 힌트와 힌트 사용에 따른 점수 감점이 있다. [Gartic.io](https://play.google.com/store/apps/details?id=io.gartic.Gartic)는 목표 점수 선착순 게임이므로 여기의 라운드제 공식 출처로 취급하지 않는다.
- [Drawasaurus](https://www.drawasaurus.org/)의 공개 규칙은 공정한 플레이를 설명하지만 이 게임에 그대로 적용할 숫자 규칙을 공개하지 않는다. Gartic Phone은 다른 방식의 게임이므로 참고하지 않았다.

## 이 사이트의 2인용 설계

- 기본은 **80초 × 개별 6턴**으로, 출제자가 번갈아 각 3번 그린다. 시작 전에 30~180초, 2~12개의 짝수 턴, 힌트 사용 여부를 설정할 수 있다.
- 출제자는 세 후보 중 하나를 고른다. 15초 안에 고르지 않으면 서버가 고른다. 힌트를 켜면 추측자의 매치 시작 언어로 글자 수가 보이고 그림 시간의 50%, 75%에 각각 한 글자가 더 보인다. 공백은 위치를 유지한다. 한 글자 답이나 숫자·이모지 답도 힌트가 정답 전체를 드러내지 않는다. 매치 중 표시 언어를 바꿔도 힌트·감점 언어는 바뀌지 않는다.
- 정답자 점수는 `max(50, 100 + floor(100 × 남은 초 / 설정 초) − 20 × 실제 공개된 글자 수)`다. 한 글자 정답처럼 힌트 단계가 와도 글자가 공개되지 않으면 감점하지 않는다. 정답이 나면 출제자는 100점, 시간초과나 패스는 둘 다 0점이다. 정답과 점수를 5초 표시한 뒤 자동으로 교대한다. 이는 이 사이트의 설계 수치이며 위 게임의 공식 점수식을 복제한 것이 아니다.
- 서버 시각으로 힌트·마감·턴을 판정한다. 다음 참가자 요청이나 활성 탭의 주기적 확인에서 시간이 지난 전이를 처리한다. 양쪽이 모두 접속을 끊으면 cron 없이 그 순간에 갱신하지 못하며, 재접속 시 자동으로 처리된다. 접속 해제만으로 즉시 패배시키지 않는다.
- 서버는 이전 턴의 채팅·그리기·패스·다음 요청을 거부하며 동일 답의 중복 득점을 막는다. 기존 진행 중인 매치는 기존 규칙과 상태를 유지한다.

## 도미니카 스페인어 제시어

기본 제시어를 **motor**, **parada de guagua**, **cocalecas**, **bizcocho**, **bizcocho de cumpleaños**, **audífonos**, **destacamento policial**로 조정했다. 기존 표준어는 정답 별칭으로 남겼다. 한국어가 일반 배낭인 **mochila**는 유지하고 학교 가방을 뜻할 수 있는 **bulto**를 별칭으로 둔다. `coco rallado`의 한국어는 의미에 맞게 **갈은 코코넛**으로 바로잡았다.

근거: [ASALE motor](https://www.asale.org/damer/motor), [ASALE guagua](https://www.asale.org/damer/guagua), [ASALE cocaleca](https://www.asale.org/damer/cocaleca), [ASALE bulto](https://www.asale.org/damer/bulto), [도미니카 경찰 destacamento 사용](https://www.policianacional.gob.do/raquel-pena-entrega-dos-destacamentos-policiales-y-asegura-que-la-seguridad-ciudadana-es-prioridad-del-gobierno/), [도미니카 audífonos 사용](https://www.steren.com.do/computacion/audifonos), [ICDA bizcocho 사용](https://icda.edu.do/category/espacio-culinario/page/4/), [도미니카 제과점 bizcocho 사용](https://xocolat.com.do/collections/bizcochos).
