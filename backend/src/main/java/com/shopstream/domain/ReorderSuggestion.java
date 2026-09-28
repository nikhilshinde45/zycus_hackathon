package com.shopstream.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class ReorderSuggestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Product product;

    private Integer currentStock;
    private Integer recommendedQuantity;
    private Integer suggestedLeadTimeDays;

    private Double confidence;

    @Column(columnDefinition = "TEXT")
    private String reasoning;

    @Enumerated(EnumType.STRING)
    private SuggestionStatus status = SuggestionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private TriggerReason triggerReason;

    private LocalDateTime createdAt = LocalDateTime.now();
}
