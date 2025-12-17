# HomeTown2 外部API遷移規劃書

**狀態**: 規劃階段 (未執行)  
**建立日期**: 2025-12-16  
**目標**: 從 hexschool EC API 遷移至自建後端 + 資料庫

---

## 📋 核心現況分析

### 當前 API 資訊
- **API Base URL**: `https://course-ec-api.hexschool.io/api/`
- **專案 UUID**: `19ab659b-8d43-427e-8552-6517262b063b`
- **認證方式**: Bearer Token (存於 cookie: `lizToken`)
- **Token 有效期**: 來自 API response 中的 `expired` (unix timestamp)
- **HTTP Client**: Vue.js 中的 `this.$http` (via vue-axios)

### 前端檔案架構概覽
```
src/
├── main.js                  (Vue.use(VueAxios, axios) 全域註冊)
├── views/
│   ├── backend/
│   │   ├── Login.vue       (POST /auth/login)
│   │   ├── Dashboard.vue   (POST /auth/check, 設定 Authorization header)
│   │   ├── Products.vue    (GET/POST/PATCH /admin/ec/product*)
│   │   ├── Orders.vue      (GET/PATCH /admin/ec/orders*)
│   │   ├── Coupons.vue     (GET/POST /admin/ec/coupon*)
│   │   └── Storages.vue    (GET/POST /admin/storage*)
│   └── frontend/
│       ├── Products.vue    (GET /ec/products?)
│       ├── Product.vue     (GET /ec/product/:id)
│       ├── Cart.vue        (GET/POST/PATCH/DELETE /ec/shopping*, POST /ec/coupon/search)
│       └── Payment.vue     (GET/POST /ec/orders*)
├── components/
│   ├── Nav.vue             (GET/POST/DELETE /ec/shopping*)
│   └── backend/
│       ├── ProductModal.vue    (POST/PATCH /admin/ec/product*, POST /admin/storage)
│       ├── StorageModal.vue    (POST /admin/storage)
│       ├── CouponModal.vue     (POST/PATCH /admin/ec/coupon*)
│       └── DeleteModal.vue     (DELETE /admin/ec/product*, /admin/ec/coupon*, /admin/storage*)
└── filters/
    └── currency.js         (千分位格式化)
```

---

## 🔍 完整 API 端點清單

### 1️⃣ 認證相關
| 方法 | 端點 | 用途 | 請求體 | 回應 |
|------|------|------|--------|------|
| POST | `/auth/login` | 後台登入 | `{ email, password }` | `{ token, expired }` |
| POST | `/auth/check` | 驗證 token 有效性 | `{ api_token }` | `{ message }` 或錯誤 |

**Token 流程**:
- 登入成功 → token + expired 時間戳
- 存入 cookie: `lizToken=${token}; expires=${new Date(expired * 1000)}`
- Dashboard.vue 在 created 時取出 token，設定 `Authorization: Bearer ${token}` 到 axios defaults
- 後續所有請求均自動帶入此 header

---

### 2️⃣ 前台產品相關
| 方法 | 端點 | 用途 | 分頁 | 參數 |
|------|------|------|------|------|
| GET | `/ec/products` | 列出所有產品 | 是 (`page`, `paged=20`) | - |
| GET | `/ec/product/:id` | 取得單一產品細節 | 否 | `id` 為產品 ID |

**Response 結構** (推測):
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "產品名稱",
      "category": "椅子|桌子|沙發|燈飾",
      "price": 999,
      "origin_price": 1299,
      "imageUrl": ["url1", "url2"],
      "enabled": true,
      "description": "...",
      "...": "其他欄位"
    }
  ],
  "meta": {
    "pagination": {
      "total": 100,
      "current_page": 1,
      "per_page": 20,
      "last_page": 5
    }
  }
}
```

---

### 3️⃣ 前台購物車相關
| 方法 | 端點 | 用途 | 請求體 |
|------|------|------|--------|
| GET | `/ec/shopping` | 取得購物車列表 | - |
| POST | `/ec/shopping` | 加入購物車 | `{ product (id), quantity }` |
| PATCH | `/ec/shopping` | 更新購物車商品數量 | `{ product (id), quantity }` |
| DELETE | `/ec/shopping/:id` | 刪除購物車商品 | - |

**Response 結構** (推測):
```json
{
  "data": [
    {
      "id": "uuid",
      "product": {
        "id": "product_id",
        "title": "...",
        "price": 999,
        "imageUrl": ["..."]
      },
      "quantity": 2
    }
  ]
}
```

---

### 4️⃣ 前台優惠券相關
| 方法 | 端點 | 用途 | 請求體 |
|------|------|------|--------|
| POST | `/ec/coupon/search` | 查詢優惠券是否存在 | `{ code }` |

**Response 結構** (推測):
```json
{
  "data": {
    "code": "SAVE10",
    "percent": 90,           // 折扣後百分比 (e.g., 90 = 9折)
    "enabled": true
  }
}
```

---

### 5️⃣ 前台訂單相關
| 方法 | 端點 | 用途 | 請求體 |
|------|------|------|--------|
| POST | `/ec/orders` | 建立訂單 | `{ name, email, tel, address, payment, message, coupon(optional) }` |
| GET | `/ec/orders/:id` | 取得訂單細節 | - |
| POST | `/ec/orders/:id/paying` | 確認支付 (?)  | - |

**Response 結構** (推測):
```json
{
  "data": {
    "id": "order_uuid",
    "user": { "name": "...", "email": "...", "tel": "...", "address": "..." },
    "items": [
      { "product_id": "...", "quantity": 2, "price": 999 }
    ],
    "total": 2000,
    "coupon": "SAVE10",
    "status": "pending|paid|shipped|completed",
    "payment_method": "WebATM|ATM|CVS|Credit|ApplePay|GooglePay",
    "created_at": "2025-12-16T10:00:00Z"
  }
}
```

---

### 6️⃣ 後台產品管理
| 方法 | 端點 | 用途 | 請求體 |
|------|------|------|--------|
| GET | `/admin/ec/products` | 列出產品 (分頁) | `page`, `paged=20` |
| GET | `/admin/ec/product/:id` | 取得單一產品 | - |
| POST | `/admin/ec/product` | 建立產品 | `{ title, category, price, origin_price, description, imageUrl[], enabled }` |
| PATCH | `/admin/ec/product/:id` | 更新產品 | 同上 |
| DELETE | `/admin/ec/product/:id` | 刪除產品 | - |

---

### 7️⃣ 後台優惠券管理
| 方法 | 端點 | 用途 | 請求體 |
|------|------|------|--------|
| GET | `/admin/ec/coupons` | 列出優惠券 (分頁) | `page`, `paged=10` |
| POST | `/admin/ec/coupon` | 建立優惠券 | `{ code, percent, enabled, ... }` |
| PATCH | `/admin/ec/coupon/:id` | 更新優惠券 | 同上 |
| DELETE | `/admin/ec/coupon/:id` | 刪除優惠券 | - |

---

### 8️⃣ 後台庫存/物料管理
| 方法 | 端點 | 用途 | 請求體 |
|------|------|------|--------|
| GET | `/admin/storage` | 列出庫存 (分頁) | `page`, `paged=20` |
| POST | `/admin/storage` | 新增庫存 | FormData with file |
| DELETE | `/admin/storage/:id` | 刪除庫存 | - |

---

### 9️⃣ 後台訂單管理
| 方法 | 端點 | 用途 | 請求體 |
|------|------|------|--------|
| GET | `/admin/ec/orders` | 列出訂單 (分頁) | `page`, `paged=10` |
| PATCH | `/admin/ec/orders/:id/paid` | 標記訂單為已支付 | - |
| PATCH | `/admin/ec/orders/:id/unpaid` | 標記訂單為未支付 | - |

---

## 🛠️ 技術決策樹

### ✅ 已確定方案: Supabase + Vercel (最快速)

**為什麼這個組合最優?**

| 比較項 | Supabase | 傳統 Node.js + Express |
|--------|----------|----------------------|
| **資料庫設定** | 5 分鐘完成 (託管 PostgreSQL) | 需自己部署 PostgreSQL + 維護 |
| **認證系統** | 內建 Auth (JWT + session) | 手寫 Passport.js 或 NextAuth |
| **檔案存儲** | 內建 Storage (S3-like) | 需另購 S3 或整合 Cloudinary |
| **實時功能** | 內建 Realtime (WebSocket) | 需自己實作 |
| **API 生成** | 自動生成 REST API (無需寫程式碼!) | 手寫每個 endpoint |
| **部署成本** | 免費方案可用 | Vercel 免費 (後端費用另計) |
| **開發時間** | ⚡ 2-3 天 | 🐢 5-7 天 |

---

### 技術棧詳解

#### 🔵 Supabase (後端 + 資料庫)
**是什麼?**
- Firebase 的開源替代品
- 託管 PostgreSQL + 自動生成 REST/GraphQL API
- 內建認證、檔案存儲、實時同步

**包含功能**:
- ✅ PostgreSQL 資料庫 (已預置)
- ✅ 自動生成 REST API (不用寫任何後端程式碼!)
- ✅ JWT 認證系統 (相容前端現有 token 流程)
- ✅ 檔案存儲 (替代庫存上傳)
- ✅ 即時資料庫監聽 (WebSocket)
- ✅ Row Level Security (RLS) 權限控制

**免費方案**:
- 1 個專案 ✅
- 500 MB 資料庫 ✅
- 1 GB 檔案儲存 ✅
- 無限 API 呼叫 ✅
- 足夠中小型應用

**成本** (超過免費額度):
- $25/月 Pro 方案 (起)

---

#### 🟢 Vercel (前端部署 + Edge Functions)
**是什麼?**
- Next.js 官方部署平台
- 免費提供 Serverless Functions (相當於簡單後端)
- 部署速度秒級、自動 SSL

**與前端的關係**:
- Vue.js 前端可直接部署到 Vercel
- 需要 API 時用 Vercel Serverless Functions (可選，通常不需要，Supabase 已提供)

**免費方案**:
- 無限部署 ✅
- 自動 SSL ✅
- 全球 CDN ✅
- 免費 Serverless Functions (100GB/月) ✅

**成本**: 完全免費！

---

### 為什麼選 Supabase 而不是手寫後端?

對比表:

| 功能 | Supabase | 自己寫 Express |
|------|----------|---|
| 建立資料庫 | SQL 貼一貼，自動 ✅ | 下載 PostgreSQL、設定連接 |
| REST API 生成 | 自動產生 ✅ | 手寫 20+ 個 endpoint |
| 認證 (登入/token) | 內建 ✅ | 手寫 JWT + refresh token |
| 檔案上傳 | 內建 Storage ✅ | 整合 S3 或 Cloudinary |
| 資料驗證 | 用 PostgreSQL constraints ✅ | 手寫 Joi 驗證 |
| 部署維護 | Supabase 全包 ✅ | 自己管理伺服器、監控 |
| **開發時間** | **2-3 天** ⚡ | **5-7 天** 🐢 |

---

### 原理: Supabase 如何替代後端

**傳統方式** (Express):
```
前端 → HTTP 請求 → Express Server → 寫 SQL → PostgreSQL
```

**Supabase 方式** (直接):
```
前端 → HTTP 請求 → Supabase REST API → PostgreSQL (自動生成!)
```

Supabase 的神奇之處: **你只定義 PostgreSQL 表結構，REST API 自動生成！**

例如你建立一個表:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title TEXT,
  price DECIMAL
);
```

Supabase 立刻提供這些 API:
```
GET    /rest/v1/products               (列表)
GET    /rest/v1/products?id=eq.xxx    (查詢)
POST   /rest/v1/products              (新增)
PATCH  /rest/v1/products?id=eq.xxx    (更新)
DELETE /rest/v1/products?id=eq.xxx    (刪除)
```

**無需寫一行後端程式碼!**

---

### 實作流程 (新的快速版本)

```
1️⃣ 建立 Supabase 專案 (5 分鐘)
   ↓
2️⃣ 定義 PostgreSQL 表結構 (15 分鐘)
   ↓
3️⃣ 修改前端 .env (5 分鐘) 指向 Supabase API
   ↓
4️⃣ 建立 Supabase Client (JS SDK) 並更新前端呼叫 (30 分鐘)
   ↓
5️⃣ 測試完整流程 (1 小時)
   ↓
6️⃣ 部署前端到 Vercel (5 分鐘)
```

**總時間: 1-2 天!** (vs. 5-7 天手寫後端)

---

### Step 2: 選擇資料庫

#### ✅ Supabase PostgreSQL (已選)
**為什麼選 Supabase 而不是自建 PostgreSQL?**

| 項目 | Supabase | 自建 PostgreSQL |
|------|----------|-----------------|
| 安裝 | 點擊創建✅ | 下載、安裝、配置 |
| 備份 | 自動每日備份✅ | 手動設定 |
| SSL 加密 | 內建✅ | 手動設定 |
| 監控 | Web Dashboard✅ | 需另購監控工具 |
| 擴展 | 自動✅ | 手動調整 |
| 成本 | 免費 + $25/月 Pro | VPS $5-10/月 + 時間成本 |

**Supabase 包含的額外功能**:
- 自動生成 REST API
- JWT 認證
- 檔案存儲
- 即時同步 (Realtime)
- Row Level Security (RLS)

---

#### PostgreSQL 表設計 (針對 Supabase)

```sql
-- 用戶表 (由 Supabase Auth 管理，但可補充額外欄位)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255),
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 產品表
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  origin_price DECIMAL(10, 2),
  image_urls TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 購物車表
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 優惠券表
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  percent INT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  expiry_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 訂單表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  tel VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  message TEXT,
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, shipped, completed, cancelled
  coupon_id UUID REFERENCES coupons(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 訂單明細表
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 庫存/物料表
CREATE TABLE storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 啟用 Row Level Security (RLS) - 確保用戶只能看到自己的購物車/訂單
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: 用戶只能存取自己的購物車
CREATE POLICY "Users can only see their own cart" 
ON cart_items FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own cart items" 
ON cart_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own cart items" 
ON cart_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own cart items" 
ON cart_items FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policy: 用戶只能看到自己的訂單
CREATE POLICY "Users can only see their own orders" 
ON orders FOR SELECT 
USING (auth.uid() = user_id);

-- 公開表 (無 RLS)
-- products - 所有人可讀
-- coupons - 所有人可讀
-- storage - 所有人可讀
```

---

### Step 3: 選擇部署方案

#### ✅ Vercel (已選) - 前端 + 可選後端函數

**Vercel 與 Supabase 的配合**:

| 角色 | 負責內容 |
|------|---------|
| **Supabase** | 資料庫 + 認證 + REST API |
| **Vercel** | 部署 Vue.js 前端 + 可選的邊界函數 |

**部署流程**:
1. 前端代碼推到 GitHub
2. Vercel 自動偵測，構建並部署到全球 CDN
3. 前端 API 呼叫 → Supabase REST API endpoint

**Vercel 優勢**:
- ✅ 完全免費 (Vue.js 靜態網站)
- ✅ 自動 SSL/HTTPS
- ✅ 全球 CDN (速度快)
- ✅ 自動部署 (git push 即更新)
- ✅ 環境變數管理
- ✅ 無冷啟動 (相比傳統伺服器)

**成本**: **$0/月** (永久免費)

---

#### 部署對比表

| 方案 | 前端部署 | 後端 | 資料庫 | 月成本 | 複雜度 |
|------|---------|------|--------|--------|--------|
| **Vercel + Supabase** ✅ | Vercel | Supabase API | Supabase | $0-25 | ⭐ |
| Render + Railway | Railway | Railway | Railway | $7+ | ⭐⭐ |
| Docker + VPS | VPS | VPS | VPS | $5+ | ⭐⭐⭐⭐ |

---

#### 為什麼 Vercel 部署速度最快?

```
傳統方式 (Node.js 伺服器):
git push → SSH 連接 → 重啟伺服器 → 冷啟動 → 可用 (3-10 分鐘)

Vercel 方式:
git push → 自動檢測 → 構建 → 部署全球 CDN → 完成 (30 秒!)
```

---

## � Supabase + Vercel 快速開始指南 (1-2 天完成)

### Phase 1️⃣: 設定 Supabase (20 分鐘)

#### Step 1: 建立 Supabase 帳戶與專案
1. 前往 [supabase.com](https://supabase.com)
2. 用 GitHub/Google 登入
3. 點擊「New Project」
4. 設定專案名稱、密碼 (記住!)、地區選「Asia Pacific (Singapore)」
5. 等待 2-3 分鐘初始化

#### Step 2: 建立資料庫表結構
1. 進入 Supabase Dashboard → SQL Editor
2. 貼上上面「PostgreSQL 表設計」的完整 SQL
3. 點擊「Run」執行
4. 驗證所有表已建立（左側 Tables 看到 products, orders, cart_items 等)

#### Step 3: 獲取 API 密鑰
1. Dashboard → Settings → API
2. 複製以下兩個值:
   - **SUPABASE_URL**: `https://xxx.supabase.co`
   - **SUPABASE_ANON_KEY**: `eyJ...` (長 token)

---

### Phase 2️⃣: 修改前端適配 Supabase (30 分鐘)

#### Step 1: 安裝 Supabase JS Client
```bash
cd /Users/tzuyi/Desktop/CPA/Hometown2
npm install @supabase/supabase-js
```

#### Step 2: 更新 `.env` 檔案
```properties
# 舊的
VUE_APP_APIPATH=https://course-ec-api.hexschool.io/api/
VUE_APP_UUID=19ab659b-8d43-427e-8552-6517262b063b

# 新的
VUE_APP_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VUE_APP_SUPABASE_KEY=eyJ...COPY_FROM_STEP_3...
```

#### Step 3: 建立 Supabase Client 檔案
新建 `src/utils/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseAnonKey = process.env.VUE_APP_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Step 4: 更新 `src/main.js`
```javascript
// 移除舊的 axios 相關程式碼
// import VueAxios from 'vue-axios'
// Vue.use(VueAxios, axios)

// 新增 Supabase client 到全域
import { supabase } from './utils/supabase'
Vue.prototype.$supabase = supabase
```

#### Step 5: 遷移各個頁面的 API 呼叫

**範例 1: 登入 (src/views/backend/Login.vue)**

原本:
```javascript
this.$http.post(api, this.user).then((response) => {
  const { token } = response.data
  const { expired } = response.data
  document.cookie = `lizToken=${token}; expires=${new Date(expired * 1000)};`
})
```

改成:
```javascript
const { data, error } = await this.$supabase.auth.signInWithPassword({
  email: this.user.email,
  password: this.user.password
})

if (error) {
  this.$bus.$emit('message:push', 'Login failed: ' + error.message, 'info')
} else {
  // token 已自動存儲，無需手動設定 cookie
  this.$bus.$emit('message:push', 'Login successful!', 'success')
  this.$router.push('admin/products')
}
```

**範例 2: 取得產品列表 (src/views/frontend/Products.vue)**

原本:
```javascript
const api = `${process.env.VUE_APP_APIPATH}${process.env.VUE_APP_UUID}/ec/products?page=${page}`
this.$http.get(api).then((response) => {
  this.products = response.data.data
  this.pagination = response.data.meta.pagination
})
```

改成:
```javascript
const pageSize = 20
const from = (page - 1) * pageSize
const to = from + pageSize - 1

const { data, error, count } = await this.$supabase
  .from('products')
  .select('*', { count: 'exact' })
  .eq('enabled', true)
  .range(from, to)

if (error) {
  console.error(error)
} else {
  this.products = data
  this.pagination = {
    total: count,
    current_page: page,
    per_page: pageSize,
    last_page: Math.ceil(count / pageSize)
  }
}
```

**範例 3: 新增購物車項目 (src/components/Nav.vue)**

原本:
```javascript
this.$http.post(url, cart).then((response) => {
  this.getCart()
})
```

改成:
```javascript
const user = this.$supabase.auth.user()
const { data, error } = await this.$supabase
  .from('cart_items')
  .insert({
    user_id: user.id,
    product_id: item.id,
    quantity: quantity
  })

if (error) {
  console.error(error)
} else {
  this.getCart()
}
```

---

### Phase 3️⃣: 測試前後端連線 (1 小時)

#### Checklist:
- [ ] 登入功能正常
- [ ] 可取得產品列表
- [ ] 可新增/修改/刪除購物車
- [ ] 可建立訂單
- [ ] 優惠券查詢正常
- [ ] 後台管理頁面可增刪改查產品

#### 測試方法:
```bash
npm run serve
# 在瀏覽器打開 localhost:8080
# 測試完整流程: 登入 → 瀏覽產品 → 加購物車 → 結帳
```

---

### Phase 4️⃣: 部署到 Vercel (5 分鐘)

#### Step 1: 推送到 GitHub
```bash
cd /Users/tzuyi/Desktop/CPA/Hometown2
git add .
git commit -m "Migrate to Supabase + Vercel"
git push origin main
```

#### Step 2: 連接 Vercel
1. 前往 [vercel.com](https://vercel.com)
2. 用 GitHub 帳戶登入
3. 點擊「Import Project」
4. 選擇 `Hometown2` 倉庫
5. 設定環境變數:
   - `VUE_APP_SUPABASE_URL`: 從 Supabase 複製
   - `VUE_APP_SUPABASE_KEY`: 從 Supabase 複製
6. 點擊「Deploy」
7. 等待 1-2 分鐘，網站上線！

#### Step 3: 驗證部署
- Vercel 提供的 URL: `https://hometown2-xxx.vercel.app`
- 測試登入、購物、訂單功能

---

### ⚠️ 常見問題與解決

| 問題 | 解決方案 |
|------|---------|
| `Cannot find module '@supabase/supabase-js'` | 執行 `npm install @supabase/supabase-js` |
| CORS 錯誤 | Supabase 預設允許所有 origin，檢查 .env 變數是否正確 |
| 登入後 token 過期 | Supabase JWT 預設有效期 1 小時，使用 `refreshSession()` 自動刷新 |
| 文件上傳失敗 | 確保 Supabase Storage bucket 名稱正確、RLS 規則允許 |
| 部署後前端無法連接後端 | 檢查 Vercel 環境變數是否設定，確保 SUPABASE_URL 正確 |

---

## 資料遷移步驟 (如果有現有資料)

---

## 資料遷移步驟 (如果有現有資料)

如果你在 hexschool 已有線上產品、訂單、使用者資料，可以按以下步驟遷移:

### 情況 1: 有線上現有資料

**步驟**:
1. 使用 hexschool API 匯出現有資料 (GET 所有端點)
2. 轉換為 SQL INSERT 語句
3. 在 Supabase SQL Editor 中執行
4. 驗證資料一致性

**Python 遷移腳本範例** (新建 `migrate.py`):

```python
import requests
import json
from datetime import datetime

# hexschool API 配置
OLD_API_BASE = "https://course-ec-api.hexschool.io/api/"
UUID = "19ab659b-8d43-427e-8552-6517262b063b"

# 匯出所有產品
response = requests.get(f"{OLD_API_BASE}{UUID}/ec/products?page=1")
products = response.json()['data']

# 轉換為 SQL INSERT
insert_statements = []
for product in products:
    sql = f"""
    INSERT INTO products (id, title, category, price, origin_price, description, image_urls, enabled)
    VALUES (
        '{product['id']}',
        '{product['title'].replace("'", "''")}',
        '{product['category']}',
        {product['price']},
        {product['origin_price']},
        '{product.get('description', '').replace("'", "''")}',
        ARRAY{product['imageUrl']},
        {str(product['enabled']).lower()}
    );
    """
    insert_statements.append(sql)

# 輸出為 SQL 檔案
with open('migrate_products.sql', 'w') as f:
    f.write('\n'.join(insert_statements))

print("遷移 SQL 已生成: migrate_products.sql")
```

**執行遷移**:
1. 執行 Python 腳本：`python migrate.py`
2. 生成 `migrate_products.sql`
3. 進入 Supabase Dashboard → SQL Editor
4. 貼上 SQL 內容並執行
5. 驗證: 檢查 Tables → products，確認資料已匯入

---

### 情況 2: 無現有資料
直接使用後台管理介面手動新增測試資料 (5-10 分鐘完成)

---

## ✅ 執行檢查清單 (Supabase + Vercel 版本)

### 📝 第 1 階段: Supabase 設定 (20 分鐘)

- [ ] 在 supabase.com 建立專案
- [ ] 執行 PostgreSQL schema SQL (複製貼上)
- [ ] 驗證所有表已建立
- [ ] 獲取 SUPABASE_URL 和 SUPABASE_ANON_KEY
- [ ] 在 Supabase 建立管理員帳戶用於測試

---

### 🔗 第 2 階段: 前端適配 (45 分鐘)

- [ ] `npm install @supabase/supabase-js`
- [ ] 建立 `src/utils/supabase.js`
- [ ] 更新 `.env` (新增 SUPABASE 變數)
- [ ] 修改 `src/main.js` (移除 axios, 加入 Supabase)
- [ ] 遷移 Login.vue (登入邏輯改為 supabase.auth)
- [ ] 遷移 Dashboard.vue (Dashboard 改為檢查 auth.user)
- [ ] 遷移 Products.vue (GET 產品列表)
- [ ] 遷移 Cart.vue (購物車 CRUD)
- [ ] 遷移 Payment.vue (訂單 CRUD)
- [ ] 遷移 後台 CRUD 模組 (ProductModal, CouponModal 等)

---

### 🧪 第 3 階段: 本地測試 (1 小時)

- [ ] `npm run serve` 啟動前端
- [ ] 測試登入功能
- [ ] 測試產品列表載入
- [ ] 測試購物車新增/修改/刪除
- [ ] 測試訂單建立
- [ ] 測試優惠券查詢
- [ ] 測試後台產品管理 (CRUD)
- [ ] 測試後台訂單管理

---

### 📤 第 4 階段: 資料遷移 (如有現有資料) (30 分鐘)

- [ ] 編寫遷移 Python 腳本
- [ ] 執行腳本生成 SQL
- [ ] 在 Supabase SQL Editor 執行 SQL
- [ ] 驗證資料完整性

---

### 🚀 第 5 階段: 部署到 Vercel (5 分鐘)

- [ ] 推送所有代碼到 GitHub (`git push`)
- [ ] 在 vercel.com 連接 GitHub 倉庫
- [ ] 設定環境變數 (SUPABASE_URL, SUPABASE_KEY)
- [ ] 點擊 Deploy
- [ ] 驗證部署成功 (測試線上版本)

---

### ✨ 第 6 階段: 上線後監控 (持續)

- [ ] 監控 Supabase 資料庫效能
- [ ] 監控 Vercel 部署狀態
- [ ] 蒐集使用者反饋
- [ ] 定期備份資料 (Supabase 自動每日)

---

## 📚 Supabase + Vercel 官方資源

### Supabase 文檔
- **Supabase 官網**: https://supabase.com/
- **Supabase JS Client 文檔**: https://supabase.com/docs/reference/javascript
- **Supabase Auth 指南**: https://supabase.com/docs/guides/auth
- **Supabase Database**: https://supabase.com/docs/guides/database
- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **Supabase RLS (Row Level Security)**: https://supabase.com/docs/guides/auth/row-level-security

### Vercel 文檔
- **Vercel 官網**: https://vercel.com/
- **Vercel 部署指南**: https://vercel.com/docs
- **Next.js 框架** (可選，用於更複雜的功能): https://nextjs.org/

### Vue.js 相關
- **Vue.js 官方文檔**: https://vuejs.org/
- **Axios**: https://axios-http.com/ (如果仍需要用 HTTP 客戶端)

### PostgreSQL
- **PostgreSQL 官方**: https://www.postgresql.org/
- **SQL 基礎教學**: https://www.w3schools.com/sql/

---

## ⚠️ 常見陷阱與解決

### Supabase 特定陷阱

| 陷阱 | 避免方法 |
|------|---------|
| 免費方案資料庫自動暫停 (7 天無活動) | 升級至 Pro ($25/月) 或定期訪問以保持活躍 |
| RLS 規則設定錯誤導致無法存取資料 | 確保 RLS policy 正確，測試前先關閉 RLS 驗證邏輯 |
| CORS 錯誤 | Supabase 預設允許所有 CORS，檢查 Content-Type header |
| Auth token 過期 | 實作自動 refresh: `supabase.auth.refreshSession()` |
| 上傳大檔案超時 | Supabase 限制單檔 50 MB，分片上傳或壓縮 |

### Vercel 特定陷阱

| 陷阱 | 避免方法 |
|------|---------|
| 環境變數未設定導致前端無法連接 Supabase | 在 Vercel Dashboard 設定環境變數後重新部署 |
| 部署時 npm install 失敗 | 檢查 package-lock.json 完整性，或刪除後重新提交 |
| 前端構建時間過長 | 最佳化 webpack 配置，移除未用的依賴 |
| 生產環境與本地開發不同步 | 確保 .env 和 .env.production 配置一致 |

### 通用陷阱

| 陷阱 | 避免方法 |
|------|---------|
| 新舊 API 格式不一致導致前端顯示錯誤 | 在前端建立 adapter layer 轉換資料格式 |
| 優惠券計算邏輯錯誤 | Supabase 中用 PostgreSQL computed columns 或觸發器 |
| 購物車重複項目 | 查詢時用 `upsert` 或在插入前檢查 unique constraint |
| 訂單狀態不同步 | 使用 Supabase Realtime 監聽表變更 |
| 安全性: 前端直接存取 Supabase API | 設置 RLS policy，確保用戶只能存取自己的資料 |

---

## � 優化建議 (Optional, 進階)

### 1. 使用 Supabase Realtime 進行即時更新
```javascript
// 監聽產品表變更
const subscription = supabase
  .from('products')
  .on('*', payload => {
    console.log('Change received!', payload)
    // 刷新產品列表
    this.getProducts()
  })
  .subscribe()
```

### 2. 檔案上傳至 Supabase Storage
```javascript
// 上傳圖片
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(`products/${filename}`, file)

if (data) {
  const imageUrl = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path).data.publicUrl
}
```

### 3. 使用 PostgreSQL 觸發器計算訂單合計
```sql
CREATE TRIGGER calculate_order_total
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

CREATE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET total = (SELECT SUM(price * quantity) FROM order_items WHERE order_id = NEW.order_id)
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📞 後續步驟

### 現在你可以選擇:

#### 選項 A: 立即開始 (推薦!)
1. 我幫你建立完整的前端遷移程式碼 (所有 Vue 元件改為用 Supabase)
2. 生成 Supabase SQL 初始化腳本
3. 提供 Vercel 部署檢查清單
4. 預估時間: **2-3 天完成遷移**

#### 選項 B: 逐步進行
1. 先建立 Supabase 專案和資料庫
2. 我提供詳細的代碼遷移指南
3. 你自己改前端，我在旁協助
4. 預估時間: **3-5 天完成**

#### 選項 C: 深入了解 (學習模式)
1. 我分別教你 Supabase、PostgreSQL、Vue.js + Supabase 整合
2. 你邊學邊做，我隨時答疑
3. 預估時間: **5-7 天完成**

---

## 🎯 總結

| 指標 | 值 |
|------|-----|
| **開發時間** | 1-3 天 ⚡ |
| **每月成本** | $0-25 💰 |
| **部署難度** | ⭐ (超簡單) |
| **維護成本** | 最低 ✅ |
| **擴展性** | 優秀 📈 |

---

**Supabase + Vercel = 最快、最便宜、最方便的全棧解決方案！**

**你準備好開始了嗎？告訴我你想選哪個選項！** 🚀
