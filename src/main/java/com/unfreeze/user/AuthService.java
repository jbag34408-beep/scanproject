package com.unfreeze.user;

import com.unfreeze.global.error.BusinessException;
import com.unfreeze.global.error.ErrorCode;
import com.unfreeze.user.dto.LoginRequest;
import com.unfreeze.user.dto.SignupRequest;
import com.unfreeze.user.dto.UserResponse;
import java.util.List;
import java.util.Locale;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginAttemptTracker attemptTracker;
    // 없는 이메일도 같은 시간만큼 해시 비교를 해서 가입 여부를 응답 시간으로 알 수 없게 한다
    private final String dummyHash;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       LoginAttemptTracker attemptTracker) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.attemptTracker = attemptTracker;
        this.dummyHash = passwordEncoder.encode("dummy-password");
    }

    @Transactional
    public UserResponse signup(SignupRequest req) {
        String email = normalize(req.email());
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_DUPLICATED);
        }
        User user = new User(email, passwordEncoder.encode(req.password()), req.name(), req.phone());
        return UserResponse.from(userRepository.save(user));
    }

    /**
     * 성공 시 principal 이름이 사용자 id(문자열)인 Authentication을 돌려준다.
     */
    public Authentication login(LoginRequest req) {
        String email = normalize(req.email());
        if (attemptTracker.isLocked(email)) {
            throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
        }
        User user = userRepository.findByEmailAndDeletedAtIsNull(email).orElse(null);
        boolean matches = passwordEncoder.matches(req.password(), user != null ? user.getPasswordHash() : dummyHash);
        if (user == null || !matches) {
            attemptTracker.recordFailure(email);
            throw new BusinessException(ErrorCode.LOGIN_FAILED);
        }
        attemptTracker.reset(email);
        return UsernamePasswordAuthenticationToken.authenticated(
                user.getId().toString(), null, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole())));
    }

    public UserResponse me(Long userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
