package com.cloudclass.mood.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;

@Configuration
public class ModelServiceConfig {

    // docker-compose 상의 서비스 이름(mood-model)을 그대로 호스트로 사용합니다.
    @Value("${mood.model.base-url:http://mood-model:8000}")
    private String modelBaseUrl;

    @Bean
    public RestClient modelRestClient() {
        // HTTP/2 업그레이드 시도 시 uvicorn(FastAPI)이 body를 못 받는 문제가 있어
        // HTTP/1.1로 고정합니다.
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();

        return RestClient.builder()
                .baseUrl(modelBaseUrl)
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .build();
    }
}
