# Architectural Decision Records (ADR)
## Project: ShopStream — Reactive Commerce Advisor

---

### ADR-01: Commerce Engine Contract Architecture — Unified Advisor with Pluggable Strategies

- **Status:** Accepted
- **Context:**
  The merchandising decision loop involves two closely related actions: pricing optimization (maximizing margin or accelerating turnover) and replenishment planning (ordering stock to avoid stockouts). We needed to decide whether to maintain two disjoint contracts (`PricingStrategy` and `ReorderStrategy`) or unify them under a single `CommerceAdvisor` contract.
- **Options Considered:**
  1. *Split Contracts (`PricingStrategy` + `ReorderStrategy`):* Independent classes and separate LLM calls.
  2. *Unified `CommerceAdvisor` Contract:* A single domain facade coordinating both pricing and replenishment recommendations.
- **Decision:**
  We implemented a unified `CommerceAdvisor` contract implemented by `RuleBasedStrategy` and `AiStrategy`, managed via a `DynamicCommerceAdvisorRouter`. This allows the agentic loop and HTTP endpoints to invoke recommendations through a single cohesive abstraction, while maintaining distinct trigger-specific prompts for the AI implementation.
- **Tradeoffs:**
  - *Pros:* High cohesion; eliminates disjoint strategy lookups; enables future joint-optimization models where reorder volume directly factors into dynamic pricing elasticities.
  - *Cons:* Both strategies need to be implemented whenever a new provider is added.

---

### ADR-02: Runtime Strategy Switchability without Downtime

- **Status:** Accepted
- **Context:**
  Merchandising teams must be able to switch between deterministic Rule-Based algorithms and LLM-powered dynamic advisors in real time (e.g. during an AI provider outage, high latency spikes, or testing) without restarting the application or rebuilding containers.
- **Options Considered:**
  1. *Spring Profile / Properties restart:* Requires pod restarts and downtime.
  2. *Dynamic Router Pattern with Atomic Reference:* Thread-safe runtime routing controlled via REST endpoint (`POST /engine/strategy?strategy=AI|RULE_BASED`).
- **Decision:**
  Adopted the **Dynamic Router Pattern** (`DynamicCommerceAdvisorRouter`). It wraps both strategy beans, initializes from `application.yml`, and allows atomic switching via `/engine/strategy` at runtime with instant propagation to both async agentic listeners and synchronous REST endpoints.
- **Tradeoffs:**
  - *Pros:* Zero downtime, instant operational rollback, simplifies live hackathon demos.
  - *Cons:* Slightly more routing indirection.

---

### ADR-03: Resilient LLM Gateway with Deterministic Fallback

- **Status:** Accepted
- **Context:**
  External LLMs are prone to network timeouts, rate limits, schema hallucinations, or temporary service disruptions. A mission-critical commerce loop must never fail silently or drop recommendations.
- **Options Considered:**
  1. *Fail-Fast / Retry Loop:* Can block queues or cause cascading timeouts.
  2. *Graceful Degradation to Rule-Based Baseline:* Try LLM with sane-bounds validation; on any network, timeout, or JSON parse anomaly, automatically fallback to deterministic rule-based algorithms.
- **Decision:**
  Adopted **Graceful Degradation with Sane Bounds Validation**. `AiStrategy` catches all HTTP, timeout, and schema anomalies, validates price bounds (e.g., must be > 0 and <= 5x current price), and immediately delegates to `RuleBasedStrategy` if validation fails.
- **Tradeoffs:**
  - *Pros:* 100% recommendation uptime guarantee; protects against pricing catastrophes.
  - *Cons:* Requires maintaining the deterministic rule-based algorithm alongside the AI model.

---

### ADR-04: Asynchronous Agentic Loop Decoupling via Spring Application Events

- **Status:** Accepted
- **Context:**
  When a sale is recorded (`POST /products/{id}/orders`) or stock is adjusted (`PATCH /products/{id}/stock`), the critical path must respond with sub-50ms latency. The AI analysis and recommendation creation must run asynchronously without delaying order intake.
- **Options Considered:**
  1. *Synchronous Execution:* High latency on order endpoints; LLM latency blocks checkout.
  2. *Scheduled Cron Poller:* Inefficient; pollers lag and waste resources when stock is idle.
  3. *Event-Driven Observer Pattern (`ApplicationEventPublisher` + `@Async`):* Reactive event dispatch triggered by inventory threshold crossings.
- **Decision:**
  Adopted the **Event-Driven Observer Pattern**. `ProductService` publishes `InventorySignalEvent` on low stock or velocity spikes. `AgenticLoopService` handles the event asynchronously with `@Async`, prevents duplicate pending suggestions, updates product lifecycle to `PRICE_REVIEW_PENDING`, and writes suggestions for merchandiser approval.
- **Tradeoffs:**
  - *Pros:* Zero latency impact on inventory updates; instant reaction when thresholds are breached.
  - *Cons:* In-memory events in standard setup (can be upgraded to Kafka/RabbitMQ in multi-node clusters).

---

### ADR-05: Domain Model Extensibility & Sprint 2/3 Roadmap

- **Status:** Accepted
- **Context:**
  Future sprints require supplier integration, competitor price crawling, and margin safety floors. Adding these schema fields later without forward planning leads to schema migrations and refactoring.
- **Decision:**
  We introduced nullable placeholder extension fields on `Product`:
  - `costPrice: BigDecimal` — allows margin floor checks (`currentPrice >= costPrice * 1.15`).
  - `supplierId: Long` — links to future supplier catalog APIs for automated Purchase Orders.
  The architecture allows adding `CompetitorAwareStrategy` simply by implementing `CommerceAdvisor` without touching existing models.
- **Deliberate Exclusions:**
  - Full storefront shopping cart & payment processing: Excluded to focus evaluation signal on the reactive signal -> recommendation -> approval loop.
  - Automated autonomous price execution without human checkpoint: Excluded because commerce policy requires merchandiser sign-off before altering consumer-facing prices.
