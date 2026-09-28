# ShopStream — Reactive Commerce Advisor

> Autonomous Inventory Signals &bull; AI Dynamic Pricing &bull; Supply Chain Replenishment &bull; Merchandising Approval Console

---

## 🚀 Quick Start (Under 5 Minutes)

### 1. Prerequisites
- **Java 17+**
- **Maven 3.8+**
- Optional: **Node.js 18+** (Only needed if running the standalone Vite frontend)

---

### 2. Run the Application

```bash
cd backend
mvn clean spring-boot:run
```

Once started:
- **Interactive Merchandising Console:** [http://localhost:8080](http://localhost:8080)
- **H2 Database Console:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:mem:shopstream`, User: `sa`, Password: `password`)
- **API Base:** [http://localhost:8080/products](http://localhost:8080/products)

*(Recommended)* Run the standalone production-grade **React 18 + Tailwind + TanStack Query** frontend:
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 🖥️ Modern Merchandising Operations Frontend (React 18 + Vite + Tailwind)

Built specifically for commerce operations managers and merchandising teams:
- **Routes:**
  - `/dashboard` — KPI cards, "Needs your attention" critical alerts, Recharts inventory & demand velocity charts, recent suggestions table.
  - `/suggestions` — Complete approval queue with filter pills, confidence meters, AI reasoning cards, detail modal, and confirmation dialogs.
  - `/products` — Real-time catalog table with instant simulated sale (`⚡ Sale`), stock adjustment (`-5`), and on-demand AI review triggers.
  - `/products/:id` — Deep-dive product analytics, inventory depletion history, demand velocity charts, and active recommendations.
  - `/inventory` — Visual stock runway fill-bars (Red: Critical, Amber: Low, Green: Healthy) and inbound delivery simulation.
  - `/analytics` — Operational decision funnel, incremental revenue gain chart, and trigger distribution donut.
  - `/activity` — Real-time audit timeline of stock changes, AI evaluations, and merchandiser checkpoints.
  - `/settings` — Runtime engine strategy toggles, safety price guardrails, and notification preferences.
- **Architecture Record:** See [docs/ADR-001-frontend-stack.md](file:///c:/Users/poweroot/Desktop/zycus_hackathon/docs/ADR-001-frontend-stack.md).

---

## 🗄️ How to Connect with the Database

The application is pre-configured with **H2 In-Memory Database** by default for zero-setup execution, and supports **PostgreSQL** for production.

### A. Using Default H2 Database (Ready out-of-the-box)
In `backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:shopstream;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driverClassName: org.h2.Driver
    username: sa
    password: password
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: update
```
- Access web console at `http://localhost:8080/h2-console`
- Schema and 8 seed products are automatically generated upon startup.

---

### B. Connecting with PostgreSQL
1. Create your database in PostgreSQL:
   ```sql
   CREATE DATABASE shopstream;
   ```
2. Open `backend/src/main/resources/application.yml` and switch the datasource config:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/shopstream
       driverClassName: org.postgresql.Driver
       username: postgres
       password: your_postgres_password
     jpa:
       database-platform: org.hibernate.dialect.PostgreSQLDialect
       hibernate:
         ddl-auto: update
   ```
3. Restart the application. Hibernate will automatically create the tables:
   - `product`
   - `pricing_suggestion`
   - `reorder_suggestion`

---

## 🤖 How to Configure the AI LLM Gateway

The backend connects to your LLM using the provided curl specification:
```bash
curl --location '[my_replacable_link]' \
  --header 'Authorization: Bearer sk-SfyNGxhcv7RnQKbZFWX2LQ' \
  --header 'Content-Type: application/json' \
  --header 'product: PC1' \
  --header 'Cookie: 6bf6da0e46dc446bd58693d49c303e18=f3f865650f0f8f3b30731936b2eb5857' \
  --data '{ "model": "qwen-cursor", "messages": [{"role": "user", "content": "..."}] }'
```

### Where to Replace Your LLM Link and Keys:
Open `backend/src/main/resources/application.yml` and update the `shopstream.ai` block:

```yaml
shopstream:
  engine:
    active-strategy: AI # Choose "AI" or "RULE_BASED"
  ai:
    # 1. Replace with your actual LLM endpoint URL:
    endpoint-url: https://your-actual-llm-endpoint.com/v1/chat/completions

    # 2. Replace with your API key / Bearer token:
    api-key: sk-SfyNGxhcv7RnQKbZFWX2LQ

    # 3. Model name:
    model: qwen-cursor

    # 4. Custom headers:
    product-header: PC1
    cookie-header: 6bf6da0e46dc446bd58693d49c303e18=f3f865650f0f8f3b30731936b2eb5857
    timeout-seconds: 15
```

> **Resilient Fallback:** If the endpoint is unreachable or times out, the engine will **automatically fall back to deterministic Rule-Based strategies**, ensuring 100% uptime for suggestions without crashing or dropping signals!

---

## 🔄 Live 5-Minute Demo Walkthrough

### Trace: Order Reducing Stock &rarr; Low Inventory Signal &rarr; AI Recommendation &rarr; Merchandiser Approval

1. **Open Dashboard:** Navigate to [http://localhost:8080](http://localhost:8080).
2. **Observe Seed SKU:** Locate `ELEC-001` (*Aura Pro Wireless Headphones*).
   - Current Stock: `16`
   - Reorder Safety Threshold: `15`
3. **Simulate a Sale:** Click the **`⚡ Sell 1`** button on `ELEC-001` twice:
   - Order 1: Stock drops to `15` (Equal to threshold).
   - Order 2: Stock drops to `14` (Below threshold &rarr; **CRITICAL INVENTORY LOW ALERT**).
4. **Autonomous Agentic Loop Fires:**
   - Spring Boot fires an asynchronous `InventorySignalEvent`.
   - The Commerce Engine inspects product context and generates:
     - `PricingSuggestion` (e.g. increase price by 10% to protect inventory run-rate).
     - `ReorderSuggestion` (reorder batch quantity to restore 3x buffer).
   - Product lifecycle transitions to `PRICE_REVIEW_PENDING`.
5. **Review in Merchandising Queue:**
   - The pending suggestions appear immediately on the dashboard with **`⚠️ INVENTORY LOW`** badges, confidence meter, and detailed reasoning.
6. **Accept & Apply:**
   - Click **`✓ Accept & Apply`** on the Pricing suggestion &rarr; Price automatically updates from `$199.99` to `$219.99`.
   - Click **`✓ Approve PO`** on the Reorder suggestion &rarr; Simulates inbound replenishment delivery and increments stock level.
   - Lifecycle resets back to `ACTIVE`.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/products` | Create new catalog product |
| `GET` | `/products?status=&category=` | Filterable catalog list |
| `PATCH` | `/products/{id}/stock?quantityChange=-5` | Update stock; fires agentic loop if threshold breached |
| `POST` | `/products/{id}/orders` | Simulate sale (decrements stock, bumps 24h velocity); fires loop |
| `POST` | `/products/{id}/suggest-pricing` | On-demand pricing suggestion |
| `POST` | `/products/{id}/suggest-reorder` | On-demand replenishment suggestion |
| `POST` | `/products/{id}/suggest-pricing/stream` | **Bonus:** SSE token stream of AI reasoning |
| `GET` | `/pricing-suggestions?status=PENDING` | View pending pricing recommendations |
| `GET` | `/reorder-suggestions?status=PENDING` | View pending replenishment recommendations |
| `PATCH`| `/pricing-suggestions/{id}` | Accept (`ACCEPTED`) or Reject (`REJECTED`) pricing |
| `PATCH`| `/reorder-suggestions/{id}` | Accept (`ACCEPTED`) or Reject (`REJECTED`) replenishment |
| `GET`  | `/engine/strategy` | Get active commerce strategy (`AI` or `RULE_BASED`) |
| `POST` | `/engine/strategy?strategy=AI` | Switch strategy at runtime without restarting |
