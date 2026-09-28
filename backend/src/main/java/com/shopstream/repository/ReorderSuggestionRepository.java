package com.shopstream.repository;

import com.shopstream.domain.ReorderSuggestion;
import com.shopstream.domain.SuggestionStatus;
import com.shopstream.domain.TriggerReason;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReorderSuggestionRepository extends JpaRepository<ReorderSuggestion, Long> {
    List<ReorderSuggestion> findByStatus(SuggestionStatus status);
    Optional<ReorderSuggestion> findFirstByProductIdAndStatusAndTriggerReason(Long productId, SuggestionStatus status, TriggerReason triggerReason);
}
