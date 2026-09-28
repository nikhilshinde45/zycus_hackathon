package com.shopstream.service;

import com.shopstream.domain.Product;
import com.shopstream.domain.TriggerReason;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class InventorySignalEvent {
    private final Product product;
    private final TriggerReason triggerReason;
}
