package com.cloudclass.mood.dto;

// FastAPI(mood-model) 응답 매핑용 DTO
public record ModelAnalyzeResponse(
        String mood,
        String emoji,
        double score,
        String comment
) {}
