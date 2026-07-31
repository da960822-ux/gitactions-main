package com.cloudclass.mood.dto;

import jakarta.validation.constraints.NotBlank;

public record DiaryRequest(
        @NotBlank(message = "오늘의 한 줄을 입력해주세요.")
        String content
) {}
