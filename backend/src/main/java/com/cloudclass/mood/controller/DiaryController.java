package com.cloudclass.mood.controller;

import com.cloudclass.mood.domain.DiaryEntry;
import com.cloudclass.mood.dto.DiaryRequest;
import com.cloudclass.mood.dto.ModelAnalyzeRequest;
import com.cloudclass.mood.dto.ModelAnalyzeResponse;
import com.cloudclass.mood.repository.DiaryEntryRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.List;

@RestController
@RequestMapping("/api/diary")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryEntryRepository diaryEntryRepository;
    private final RestClient modelRestClient;

    @GetMapping
    public List<DiaryEntry> list() {
        return diaryEntryRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public DiaryEntry create(@Valid @RequestBody DiaryRequest request) {
        // 1) FastAPI 모델 서비스에 기분 분석 요청
        ModelAnalyzeResponse analyzed = modelRestClient.post()
                .uri("/analyze")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ModelAnalyzeRequest(request.content()))
                .retrieve()
                .body(ModelAnalyzeResponse.class);

        // 2) 결과를 합쳐서 DB에 저장
        DiaryEntry entry = new DiaryEntry(request.content());
        entry.setMood(analyzed.mood());
        entry.setEmoji(analyzed.emoji());
        entry.setScore(analyzed.score());
        entry.setComment(analyzed.comment());

        return diaryEntryRepository.save(entry);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        diaryEntryRepository.deleteById(id);
    }
}
