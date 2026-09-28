package com.shopstream.repository;

import com.shopstream.domain.Product;
import com.shopstream.domain.ProductCategory;
import com.shopstream.domain.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByStatusAndCategory(ProductStatus status, ProductCategory category);
    List<Product> findByStatus(ProductStatus status);
    List<Product> findByCategory(ProductCategory category);
}
