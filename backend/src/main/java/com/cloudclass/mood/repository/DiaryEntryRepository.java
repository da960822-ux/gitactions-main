package com.cloudclass.mood.repository;

import com.cloudclass.mood.domain.DiaryEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiaryEntryRepository extends JpaRepository<DiaryEntry, Long> {
    List<DiaryEntry> findAllByOrderByCreatedAtDesc();
}
