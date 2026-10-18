package com.unfreeze.checklist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CheckRequest(@NotBlank @Size(max = 200) String key, @NotNull Boolean checked) {
}
