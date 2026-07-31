package com.cloudclass.mood.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "diary_entry")
@Getter
@Setter
@NoArgsConstructor
public class DiaryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = false, length = 20)
    private String mood;      // positive / negative / neutral

    @Column(nullable = false, length = 10)
    private String emoji;

    @Column(nullable = false)
    private Double score;

    @Column(nullable = false, length = 200)
    private String comment;   // 모델 서비스가 생성한 코멘트

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public DiaryEntry(String content) {
        this.content = content;
    }
}
