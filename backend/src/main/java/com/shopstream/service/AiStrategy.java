package com.shopstream.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.shopstream.domain.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service("aiStrategy")
public class AiStrategy implements CommerceAdvisor {

    private static final Logger log = LoggerFactory.getLogger(AiStrategy.class);

    @Value("${shopstream.ai.endpoint-url:https://my_replacable_link}")
    private String endpointUrl;

    @Value("${shopstream.ai.api-key:sk-SfyNGxhcv7RnQKbZFWX2LQ}")
    private String apiKey;

    @Value("${shopstream.ai.model:qwen-cursor}")
    private String modelName;

    @Value("${shopstream.ai.product-header:PC1}")
    private String productHeader;

    @Value("${shopstream.ai.cookie-header:6bf6da0e46dc446bd58693d49c303e18=f3f865650f0f8f3b30731936b2eb5857}")
    private String cookieHeader;

    @Value("${shopstream.ai.timeout-seconds:15}")
    private int timeoutSeconds;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RuleBasedStrategy fallbackStrategy;

    public AiStrategy(RuleBasedStrategy fallbackStrategy) {
        this.fallbackStrategy = fallbackStrategy;
    }

    @Override
    public PricingSuggestion suggestPricing(Product product, TriggerReason triggerReason) {
        try {
            String prompt = buildPricingPrompt(product, triggerReason);
            String rawResponse = callLLM(prompt);
            String jsonContent = extractJsonFromResponse(rawResponse);
            
            JsonNode root = objectMapper.readTree(jsonContent);
            
            BigDecimal recommendedPrice = BigDecimal.valueOf(root.path("recommendedPrice").asDouble())
                    .setScale(2, RoundingMode.HALF_UP);
            String directionStr = root.path("direction").asText("HOLD").toUpperCase();
            ChangeDirection direction;
            try {
                direction = ChangeDirection.valueOf(directionStr);
            } catch (Exception ex) {
                direction = ChangeDirection.HOLD;
            }
            double confidence = root.has("confidence") ? root.path("confidence").asDouble() : 0.85;
            String reasoning = root.path("reasoning").asText("AI pricing analysis based on velocity and stock levels.");

            // Sanity bound validations
            BigDecimal currentPrice = product.getCurrentPrice() != null ? product.getCurrentPrice() : BigDecimal.ONE;
            if (recommendedPrice.compareTo(BigDecimal.ZERO) <= 0 || 
                recommendedPrice.compareTo(currentPrice.multiply(BigDecimal.valueOf(5))) > 0 ||
                recommendedPrice.compareTo(currentPrice.multiply(BigDecimal.valueOf(0.1))) < 0) {
                log.warn("AI recommended price {} outside sanity bounds for product {}. Falling back to Rule-Based.", recommendedPrice, product.getSku());
                return fallbackStrategy.suggestPricing(product, triggerReason);
            }

            PricingSuggestion suggestion = new PricingSuggestion();
            suggestion.setProduct(product);
            suggestion.setCurrentPrice(product.getCurrentPrice());
            suggestion.setRecommendedPrice(recommendedPrice);
            suggestion.setChangeDirection(direction);
            suggestion.setConfidence(Math.min(1.0, Math.max(0.0, confidence)));
            suggestion.setReasoning("[AI: " + modelName + "] " + reasoning);
            suggestion.setTriggerReason(triggerReason);
            suggestion.setStatus(SuggestionStatus.PENDING);

            return suggestion;
        } catch (Exception e) {
            log.error("AI Pricing suggestion failed: {}. Falling back to Rule-Based strategy.", e.getMessage());
            return fallbackStrategy.suggestPricing(product, triggerReason);
        }
    }

    @Override
    public ReorderSuggestion suggestReorder(Product product, TriggerReason triggerReason) {
        try {
            String prompt = buildReorderPrompt(product, triggerReason);
            String rawResponse = callLLM(prompt);
            String jsonContent = extractJsonFromResponse(rawResponse);

            JsonNode root = objectMapper.readTree(jsonContent);

            int recommendedQuantity = root.path("recommendedQuantity").asInt(
                    Math.max(1, (product.getReorderThreshold() * 3) - product.getStockLevel())
            );
            double confidence = root.has("confidence") ? root.path("confidence").asDouble() : 0.82;
            String reasoning = root.path("reasoning").asText("AI replenishment analysis based on supplier lead times and sales velocity.");
            int leadTimeDays = root.has("suggestedLeadTimeDays") ? root.path("suggestedLeadTimeDays").asInt() : 7;

            // Validation: positive integer
            if (recommendedQuantity <= 0) {
                log.warn("AI recommended quantity {} <= 0. Falling back to Rule-Based.", recommendedQuantity);
                return fallbackStrategy.suggestReorder(product, triggerReason);
            }

            ReorderSuggestion suggestion = new ReorderSuggestion();
            suggestion.setProduct(product);
            suggestion.setCurrentStock(product.getStockLevel());
            suggestion.setRecommendedQuantity(recommendedQuantity);
            suggestion.setSuggestedLeadTimeDays(leadTimeDays);
            suggestion.setConfidence(Math.min(1.0, Math.max(0.0, confidence)));
            suggestion.setReasoning("[AI: " + modelName + "] " + reasoning);
            suggestion.setTriggerReason(triggerReason);
            suggestion.setStatus(SuggestionStatus.PENDING);

            return suggestion;
        } catch (Exception e) {
            log.error("AI Reorder suggestion failed: {}. Falling back to Rule-Based strategy.", e.getMessage());
            return fallbackStrategy.suggestReorder(product, triggerReason);
        }
    }

    private String buildPricingPrompt(Product product, TriggerReason triggerReason) {
        int categoryAvgVelocity = 45;
        if (triggerReason == TriggerReason.INVENTORY_LOW) {
            return String.format(
                "You are an expert commerce pricing advisor for an online store.\n" +
                "TRIGGER SITUATION: CRITICAL LOW INVENTORY ALERT\n" +
                "Context: Stock has dropped dangerously below the reorder safety threshold.\n" +
                "Goal: Evaluate whether to increase price to dampen demand and protect remaining margin, or clear remaining units.\n" +
                "- Product Name: %s\n" +
                "- Category: %s (Category Avg 24h Velocity: %d orders)\n" +
                "- Current Price: $%.2f\n" +
                "- Current Stock Level: %d units\n" +
                "- Reorder Threshold: %d units\n" +
                "- Demand Velocity (Last 24h): %d orders\n\n" +
                "Output STRICT JSON ONLY without markdown fences:\n" +
                "{\"recommendedPrice\": 0.00, \"direction\": \"INCREASE\"|\"DECREASE\"|\"HOLD\", \"confidence\": 0.85, \"reasoning\": \"Detailed rationale for merchandising team\"}",
                product.getName(), product.getCategory(), categoryAvgVelocity,
                product.getCurrentPrice(), product.getStockLevel(), product.getReorderThreshold(), product.getDemandVelocity()
            );
        } else if (triggerReason == TriggerReason.DEMAND_SPIKE) {
            return String.format(
                "You are an expert commerce pricing advisor for an online store.\n" +
                "TRIGGER SITUATION: DEMAND SPIKE DETECTED\n" +
                "Context: Demand velocity has surged significantly above peers.\n" +
                "Goal: Optimize revenue capture through dynamic pricing elasticity while preventing premature stockout.\n" +
                "- Product Name: %s\n" +
                "- Category: %s (Category Avg 24h Velocity: %d orders)\n" +
                "- Current Price: $%.2f\n" +
                "- Current Stock Level: %d units\n" +
                "- Reorder Threshold: %d units\n" +
                "- Demand Velocity (Last 24h): %d orders\n\n" +
                "Output STRICT JSON ONLY without markdown fences:\n" +
                "{\"recommendedPrice\": 0.00, \"direction\": \"INCREASE\"|\"DECREASE\"|\"HOLD\", \"confidence\": 0.90, \"reasoning\": \"Detailed rationale for merchandising team\"}",
                product.getName(), product.getCategory(), categoryAvgVelocity,
                product.getCurrentPrice(), product.getStockLevel(), product.getReorderThreshold(), product.getDemandVelocity()
            );
        } else {
            return String.format(
                "You are an expert commerce pricing advisor for an online store.\n" +
                "TRIGGER SITUATION: ON-DEMAND MERCHANDISER REVIEW\n" +
                "- Product Name: %s\n" +
                "- Category: %s (Category Avg 24h Velocity: %d orders)\n" +
                "- Current Price: $%.2f\n" +
                "- Current Stock Level: %d units\n" +
                "- Reorder Threshold: %d units\n" +
                "- Demand Velocity (Last 24h): %d orders\n\n" +
                "Output STRICT JSON ONLY without markdown fences:\n" +
                "{\"recommendedPrice\": 0.00, \"direction\": \"INCREASE\"|\"DECREASE\"|\"HOLD\", \"confidence\": 0.80, \"reasoning\": \"Detailed rationale for merchandising team\"}",
                product.getName(), product.getCategory(), categoryAvgVelocity,
                product.getCurrentPrice(), product.getStockLevel(), product.getReorderThreshold(), product.getDemandVelocity()
            );
        }
    }

    private String buildReorderPrompt(Product product, TriggerReason triggerReason) {
        return String.format(
            "You are an expert supply chain and inventory advisor for an online retailer.\n" +
            "TRIGGER: %s\n" +
            "Evaluate replenishment needs considering inventory run-rate, lead times, and safety buffer.\n" +
            "- Product Name: %s (Category: %s)\n" +
            "- Current Price: $%.2f\n" +
            "- Current Stock: %d units\n" +
            "- Reorder Safety Threshold: %d units\n" +
            "- Demand Velocity (Last 24h): %d orders\n\n" +
            "Output STRICT JSON ONLY without markdown fences:\n" +
            "{\"recommendedQuantity\": 150, \"suggestedLeadTimeDays\": 7, \"confidence\": 0.88, \"reasoning\": \"Replenishment analysis explaining recommended units and buffer\"}",
            triggerReason, product.getName(), product.getCategory(),
            product.getCurrentPrice(), product.getStockLevel(), product.getReorderThreshold(), product.getDemandVelocity()
        );
    }

    /**
     * Executes the exact curl specification provided:
     * curl --location '[endpointUrl]' \
     *  --header 'Authorization: Bearer [apiKey]' \
     *  --header 'Content-Type: application/json' \
     *  --header 'product: [productHeader]' \
     *  --header 'Cookie: [cookieHeader]' \
     *  --data '{ "model": "[modelName]", "messages": [{"role": "user", "content": "..."}] }'
     */
    public String callLLM(String prompt) throws Exception {
        if (endpointUrl == null || endpointUrl.contains("my_replacable_link")) {
            throw new IllegalStateException("LLM endpointUrl contains placeholder [my_replacable_link]. Please configure shopstream.ai.endpoint-url in application.yml or AI_ENDPOINT_URL environment variable.");
        }

        ObjectNode rootPayload = objectMapper.createObjectNode();
        rootPayload.put("model", modelName);

        ArrayNode messagesArray = rootPayload.putArray("messages");
        ObjectNode userMessage = messagesArray.addObject();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);

        String jsonPayload = objectMapper.writeValueAsString(rootPayload);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(timeoutSeconds))
                .build();

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(endpointUrl.trim()))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload));

        if (productHeader != null && !productHeader.isBlank()) {
            requestBuilder.header("product", productHeader);
        }
        if (cookieHeader != null && !cookieHeader.isBlank()) {
            requestBuilder.header("Cookie", cookieHeader);
        }

        HttpResponse<String> response = client.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 400) {
            throw new RuntimeException("LLM Gateway HTTP Error " + response.statusCode() + ": " + response.body());
        }

        return response.body();
    }

    private String extractJsonFromResponse(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            throw new IllegalArgumentException("Empty response received from LLM");
        }
        try {
            // First check if rawResponse itself is a standard chat completion response:
            JsonNode rootNode = objectMapper.readTree(rawResponse);
            
            // Check OpenAI / Qwen cursor format: choices[0].message.content
            if (rootNode.has("choices") && rootNode.path("choices").size() > 0) {
                JsonNode choice = rootNode.path("choices").get(0);
                if (choice.has("message") && choice.path("message").has("content")) {
                    String content = choice.path("message").path("content").asText();
                    return cleanMarkdown(content);
                }
            }

            // Check Gemini format: candidates[0].content.parts[0].text
            if (rootNode.has("candidates") && rootNode.path("candidates").size() > 0) {
                JsonNode candidate = rootNode.path("candidates").get(0);
                String text = candidate.path("content").path("parts").get(0).path("text").asText();
                return cleanMarkdown(text);
            }

            // If the response is already the direct JSON object we want
            if (rootNode.has("recommendedPrice") || rootNode.has("recommendedQuantity")) {
                return rawResponse.trim();
            }

            return cleanMarkdown(rawResponse);
        } catch (Exception ex) {
            return cleanMarkdown(rawResponse);
        }
    }

    private String cleanMarkdown(String text) {
        if (text == null) return "{}";
        String cleaned = text.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    @Override
    public String getStrategyName() {
        return "AI";
    }
}
