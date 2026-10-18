package com.unfreeze.cases;

import com.unfreeze.bank.Bank;
import com.unfreeze.bank.BankRepository;
import com.unfreeze.cases.dto.CaseCreateRequest;
import com.unfreeze.cases.dto.CaseResponse;
import com.unfreeze.cases.dto.CaseUpdateRequest;
import com.unfreeze.global.error.BusinessException;
import com.unfreeze.global.error.ErrorCode;
import com.unfreeze.user.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CaseService {

    private final CaseRepository caseRepository;
    private final BankRepository bankRepository;
    private final UserRepository userRepository;

    @Transactional
    public CaseResponse create(Long userId, CaseCreateRequest req) {
        Case c = new Case(userRepository.getReferenceById(userId), req.caseType());
        c.update(null, null, findBank(req.bankCode()), req.depositAmount(), req.frozenAmount(),
                req.depositAt(), req.frozenAt(), req.threatReceived());
        applyAccountNo(c, req.accountNo());
        return CaseResponse.from(caseRepository.save(c));
    }

    public List<CaseResponse> list(Long userId) {
        return caseRepository.findAllByUserIdOrderByIdDesc(userId).stream().map(CaseResponse::from).toList();
    }

    public CaseResponse get(Long userId, Long caseId) {
        return CaseResponse.from(getOwned(userId, caseId));
    }

    @Transactional
    public CaseResponse update(Long userId, Long caseId, CaseUpdateRequest req) {
        Case c = getOwned(userId, caseId);
        c.update(req.caseType(), req.status(), findBank(req.bankCode()), req.depositAmount(), req.frozenAmount(),
                req.depositAt(), req.frozenAt(), req.threatReceived());
        applyAccountNo(c, req.accountNo());
        caseRepository.flush(); // updatedAt을 응답에 반영
        return CaseResponse.from(c);
    }

    // 남의 사건이면 존재 여부도 숨기기 위해 없는 것과 똑같이 404
    private Case getOwned(Long userId, Long caseId) {
        return caseRepository.findByIdAndUserId(caseId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CASE_NOT_FOUND));
    }

    private Bank findBank(String code) {
        if (code == null) {
            return null;
        }
        return bankRepository.findById(code).orElseThrow(() -> new BusinessException(ErrorCode.BANK_NOT_FOUND));
    }

    private static void applyAccountNo(Case c, String accountNo) {
        if (accountNo != null) {
            c.changeAccount(accountNo, accountNo.substring(accountNo.length() - 4));
        }
    }
}
