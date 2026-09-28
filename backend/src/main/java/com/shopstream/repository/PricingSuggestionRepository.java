package com.shopstream.repository;

import com.shopstream.domain.PricingSuggestion;
import com.shopstream.domain.SuggestionStatus;
import com.shopstream.domain.TriggerReason;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PricingSuggestionRepository extends JpaRepository<PricingSuggestion, Long> {
    List<PricingSuggestion> findByStatus(SuggestionStatus status);
    Optional<PricingSuggestion> findFirstByProductIdAndStatusAndTriggerReason(Long productId, SuggestionStatus status, TriggerReason triggerReason);
}
