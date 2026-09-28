package com.shopstream.controller;

import com.shopstream.service.DynamicCommerceAdvisorRouter;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/engine")
@CrossOrigin(origins = "*")
public class EngineConfigController {

    private final DynamicCommerceAdvisorRouter router;

    public EngineConfigController(DynamicCommerceAdvisorRouter router) {
        this.router = router;
    }

    @GetMapping("/strategy")
    public Map<String, String> getStrategy() {
        return Map.of("activeStrategy", router.getActiveStrategyName());
    }

    @PostMapping("/strategy")
    public Map<String, String> setStrategy(@RequestParam String strategy) {
        router.setActiveStrategy(strategy);
        return Map.of(
            "activeStrategy", router.getActiveStrategyName(),
            "status", "Strategy switched successfully at runtime without restart"
        );
    }
}
