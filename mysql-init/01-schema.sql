-- Spring Boot의 ddl-auto: update가 테이블을 자동 생성하지만,
-- 실습에서 DB가 살아있는지 눈으로 바로 확인할 수 있도록 스키마만 미리 만들어둡니다.
CREATE TABLE IF NOT EXISTS diary_entry (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(1000) NOT NULL,
    mood VARCHAR(20) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    score DOUBLE NOT NULL,
    comment VARCHAR(200) NOT NULL,
    created_at DATETIME NOT NULL
);
