package com.shopstream.config;

import com.shopstream.domain.Product;
import com.shopstream.domain.ProductCategory;
import com.shopstream.domain.ProductStatus;
import com.shopstream.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class SeedDataConfig {

    private static final Logger log = LoggerFactory.getLogger(SeedDataConfig.class);

    @Bean
    public CommandLineRunner seedData(ProductRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                // 1. ELEC-001: Near threshold for live demo (stock: 16, threshold: 15)
                Product p1 = createProduct("ELEC-001", "Aura Pro Wireless Headphones",
                        ProductCategory.ELECTRONICS, new BigDecimal("199.99"), 16, 15, 28,
                        new BigDecimal("85.00"), 101L);

                // 2. ELEC-002: High demand smart watch
                Product p2 = createProduct("ELEC-002", "PulseTrack Fitness Smartwatch",
                        ProductCategory.ELECTRONICS, new BigDecimal("149.50"), 42, 12, 65,
                        new BigDecimal("60.00"), 101L);

                // 3. ELEC-003: 4K Action Camera
                Product p3 = createProduct("ELEC-003", "Apex 4K Rugged Action Camera",
                        ProductCategory.ELECTRONICS, new BigDecimal("279.00"), 25, 8, 14,
                        new BigDecimal("120.00"), 102L);

                // 4. APP-001: Viral item experiencing severe demand spike (>3x avg)
                Product p4 = createProduct("APP-001", "Vintage Washed Oversized Hoodie",
                        ProductCategory.APPAREL, new BigDecimal("68.00"), 85, 20, 185,
                        new BigDecimal("22.50"), 201L);

                // 5. APP-002: Everyday Chinos
                Product p5 = createProduct("APP-002", "Tailored Stretch Chino Trousers",
                        ProductCategory.APPAREL, new BigDecimal("54.00"), 60, 15, 25,
                        new BigDecimal("18.00"), 201L);

                // 6. APP-003: Performance Merino Wool Socks
                Product p6 = createProduct("APP-003", "Merino Performance Crew Socks",
                        ProductCategory.APPAREL, new BigDecimal("18.50"), 140, 30, 42,
                        new BigDecimal("5.50"), 202L);

                // 7. HOME-001: Artisan Mug
                Product p7 = createProduct("HOME-001", "Artisan Matte Ceramic Coffee Mug",
                        ProductCategory.HOME, new BigDecimal("24.00"), 48, 10, 19,
                        new BigDecimal("7.20"), 301L);

                // 8. HOME-002: Seeded already below reorder threshold (stock: 6, threshold: 10)
                Product p8 = createProduct("HOME-002", "Nordic Minimalist LED Desk Lamp",
                        ProductCategory.HOME, new BigDecimal("89.00"), 6, 10, 22,
                        new BigDecimal("34.00"), 302L);

                repository.saveAll(List.of(p1, p2, p3, p4, p5, p6, p7, p8));
                log.info("Initialized ShopStream database with 8 curated catalog SKUs across Electronics, Apparel, and Home.");
            }
        };
    }

    private Product createProduct(String sku, String name, ProductCategory category,
                                  BigDecimal price, int stock, int threshold, int velocity,
                                  BigDecimal costPrice, Long supplierId) {
        Product p = new Product();
        p.setSku(sku);
        p.setName(name);
        p.setCategory(category);
        p.setCurrentPrice(price);
        p.setStockLevel(stock);
        p.setReorderThreshold(threshold);
        p.setDemandVelocity(velocity);
        p.setStatus(stock == 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.ACTIVE);
        p.setCostPrice(costPrice);     // Sprint 2 extension field
        p.setSupplierId(supplierId);   // Sprint 2 extension field
        return p;
    }
}
