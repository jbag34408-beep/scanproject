package com.unfreeze.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank @Email @Size(max = 255) String email,
        // BCrypt는 72바이트 이후를 무시한다
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank @Size(max = 50) String name,
        @Pattern(regexp = "01[0-9]-?\\d{3,4}-?\\d{4}", message = "휴대폰 번호 형식이 올바르지 않습니다.") String phone
) {

    @Override
    public String toString() {
        return "SignupRequest[email=" + email + ", name=" + name + "]";
    }
}
