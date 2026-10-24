package com.zomatwo.runner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.zomatwo")
@EntityScan(basePackages = "com.zomatwo")
@EnableJpaRepositories(basePackages = "com.zomatwo")
@EnableFeignClients(basePackages = "com.zomatwo")
@EnableScheduling
@EnableCaching
public class UnifiedRunnerApplication {

    public static void main(String[] args) {
        SpringApplication.run(UnifiedRunnerApplication.class, args);
    }
}
