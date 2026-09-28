package com.shopstream.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sku;
    private String name;

    @Enumerated(EnumType.STRING)
    private ProductCategory category;

    private BigDecimal currentPrice;
    private Integer stockLevel;
    private Integer reorderThreshold;
    
    // orders in last 24h
    private Integer demandVelocity = 0;

    @Enumerated(EnumType.STRING)
    private ProductStatus status = ProductStatus.ACTIVE;

    // Sprint 2 placeholder:
    private BigDecimal costPrice; 
    private Long supplierId;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (stockLevel == 0) {
            status = ProductStatus.OUT_OF_STOCK;
        }
    }
}
