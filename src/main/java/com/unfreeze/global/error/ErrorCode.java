package com.unfreeze.global.error;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "요청이 거부되었습니다."),
    ACCOUNT_LOCKED(HttpStatus.LOCKED, "로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요."),
    EMAIL_DUPLICATED(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."),
    CASE_NOT_FOUND(HttpStatus.NOT_FOUND, "사건을 찾을 수 없습니다."),
    BANK_NOT_FOUND(HttpStatus.BAD_REQUEST, "존재하지 않는 은행입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String message;
}
