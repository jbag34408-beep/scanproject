package com.unfreeze.global.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.unfreeze.global.error.ErrorCode;
import java.util.Map;

public record ApiResponse<T>(T data, ErrorBody error) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, null);
    }

    public static ApiResponse<Void> fail(ErrorCode code) {
        return fail(code, null);
    }

    public static ApiResponse<Void> fail(ErrorCode code, Map<String, String> fields) {
        return new ApiResponse<>(null, new ErrorBody(code.name(), code.getMessage(), fields));
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErrorBody(String code, String message, Map<String, String> fields) {
    }
}
