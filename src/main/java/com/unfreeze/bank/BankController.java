package com.unfreeze.bank;

import com.unfreeze.global.response.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/banks")
@RequiredArgsConstructor
public class BankController {

    private final BankRepository bankRepository;

    @GetMapping
    public ApiResponse<List<BankResponse>> list() {
        return ApiResponse.ok(bankRepository.findAll(Sort.by("code")).stream().map(BankResponse::from).toList());
    }

    public record BankResponse(String code, String name, String objectionChannel, String phone, String guideUrl) {

        static BankResponse from(Bank b) {
            return new BankResponse(b.getCode(), b.getName(), b.getObjectionChannel(), b.getPhone(), b.getGuideUrl());
        }
    }
}
