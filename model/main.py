"""
mood-model (FastAPI)
아주 단순한 규칙 기반 '기분 분석 모델' 서비스입니다.
실습용 데모이므로 실제 ML 모델 대신 키워드 기반 감정 분석 + 재미있는 코멘트를 생성합니다.
나중에 진짜 학습된 모델(sklearn, transformers 등)로 손쉽게 교체할 수 있도록
predict() 함수만 분리해두었습니다.
"""
import random
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Mood Model Service", version="1.0.0")

POSITIVE_WORDS = ["좋", "행복", "최고", "신남", "즐거", "감사", "성공", "웃", "설레"]
NEGATIVE_WORDS = ["힘들", "슬프", "짜증", "피곤", "화나", "불안", "우울", "지침", "속상"]

POSITIVE_COMMENTS = [
    "오늘 하루 완전 반짝반짝 빛났네요! ✨",
    "그 에너지 그대로 내일도 가봅시다 🚀",
    "행복 바이러스 전파 중... 😄",
]
NEGATIVE_COMMENTS = [
    "오늘 하루 정말 고생 많았어요 🫂",
    "잠깐 쉬어가도 괜찮아요, 커피 한 잔 어때요? ☕",
    "내일은 오늘보다 조금 더 가벼울 거예요 🌤️",
]
NEUTRAL_COMMENTS = [
    "평온한 하루였군요, 잔잔한 것도 나쁘지 않죠 🌊",
    "특별한 건 없지만 그게 또 하루죠 🙂",
    "오늘의 컨디션: 무난 그 자체 📎",
]

class AnalyzeRequest(BaseModel):
    text: str

class AnalyzeResponse(BaseModel):
    mood: str
    emoji: str
    score: float
    comment: str

def predict(text: str) -> AnalyzeResponse:
    pos = sum(text.count(w) for w in POSITIVE_WORDS)
    neg = sum(text.count(w) for w in NEGATIVE_WORDS)

    if pos > neg:
        mood, emoji, comment = "positive", "😄", random.choice(POSITIVE_COMMENTS)
        score = min(0.5 + 0.15 * pos, 1.0)
    elif neg > pos:
        mood, emoji, comment = "negative", "😔", random.choice(NEGATIVE_COMMENTS)
        score = max(0.5 - 0.15 * neg, 0.0)
    else:
        mood, emoji, comment = "neutral", "😐", random.choice(NEUTRAL_COMMENTS)
        score = 0.5

    return AnalyzeResponse(mood=mood, emoji=emoji, score=round(score, 2), comment=comment)

@app.get("/health")
def health():
    return {"status": "ok", "service": "mood-model"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    return predict(req.text)
