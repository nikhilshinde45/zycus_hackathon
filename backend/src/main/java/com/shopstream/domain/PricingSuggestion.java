package com.shopstream.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
public class PricingSuggestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Product product;

    private BigDecimal currentPrice;
    private BigDecimal recommendedPrice;

    @Enumerated(EnumType.STRING)
    private ChangeDirection changeDirection;

    private Double confidence;

    @Column(columnDefinition = "TEXT")
    private String reasoning;

    @Enumerated(EnumType.STRING)
    private SuggestionStatus status = SuggestionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private TriggerReason triggerReason;

    private LocalDateTime createdAt = LocalDateTime.now();
}
