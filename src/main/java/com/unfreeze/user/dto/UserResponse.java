package com.unfreeze.user.dto;

import com.unfreeze.user.Role;
import com.unfreeze.user.User;

public record UserResponse(Long id, String email, String name, Role role) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
    }
}
