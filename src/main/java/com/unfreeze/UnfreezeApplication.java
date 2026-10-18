package com.unfreeze;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// 로그인은 AuthService가 직접 처리하므로 기본 인메모리 사용자(생성 비밀번호 로그 출력)를 끈다
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class UnfreezeApplication {

    public static void main(String[] args) {
        SpringApplication.run(UnfreezeApplication.class, args);
    }
}
