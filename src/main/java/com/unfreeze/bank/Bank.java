package com.unfreeze.bank;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "banks")
@Getter
@ToString
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Bank {

    @Id
    private String code;

    @Column(nullable = false)
    private String name;

    private String objectionChannel;

    private String phone;

    private String guideUrl;

    @Column(nullable = false)
    private Instant updatedAt;
}
