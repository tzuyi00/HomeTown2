# Supabase + Vercel 快速遷移實作指南

本檔案包含所有需要修改的代碼和逐步說明。

---

## 第 1 步: 安裝 Supabase Client

```bash
cd /Users/tzuyi/Desktop/CPA/Hometown2
npm install @supabase/supabase-js
```

---

## 第 2 步: 建立 Supabase 配置檔案

建立 `src/utils/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseAnonKey = process.env.VUE_APP_SUPABASE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 環境變數未設定！')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 第 3 步: 更新 `.env` 檔案

```properties
# 保留原本的 VUE_APP_APIPATH 和 VUE_APP_UUID (用於遷移備用)
VUE_APP_APIPATH=https://course-ec-api.hexschool.io/api/
VUE_APP_UUID=19ab659b-8d43-427e-8552-6517262b063b

# 新增 Supabase 配置 (從 Supabase Dashboard 複製)
VUE_APP_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VUE_APP_SUPABASE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc... (複製整個 anon key)
```

---

## 第 4 步: 修改 `src/main.js`

**舊版本:**
```javascript
import axios from 'axios'
import VueAxios from 'vue-axios'
// ...
Vue.use(VueAxios, axios)
```

**新版本:**
```javascript
import { supabase } from './utils/supabase'
// ...
// 移除 VueAxios 相關程式碼
// import axios from 'axios'
// import VueAxios from 'vue-axios'
// Vue.use(VueAxios, axios)

// 加入 Supabase
Vue.prototype.$supabase = supabase

// 監聽認證狀態變更
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // 用戶登出，清空本地資料
    localStorage.removeItem('user')
  } else if (session) {
    // 用戶已登入
    localStorage.setItem('user', JSON.stringify(session.user))
  }
})
```

---

## 第 5 步: 遷移各個元件

### 5.1 後台登入 (src/views/backend/Login.vue)

**原本 (使用 axios):**
```vue
<script>
export default {
  methods: {
    signin () {
      const api = `${process.env.VUE_APP_APIPATH}auth/login`
      this.$http.post(api, this.user).then((response) => {
        const { token } = response.data
        const { expired } = response.data
        document.cookie = `lizToken=${token}; expires=${new Date(expired * 1000)};`
        this.$bus.$emit('message:push', 'Login successful ヾ(●゜▽゜●)♡', 'success')
        this.$router.push('admin/products')
      }).catch(() => {
        this.$bus.$emit('message:push', 'Login failed, please try again Σ( ° △ °|||)︴ ', 'info')
      })
    }
  }
}
</script>
```

**新版 (使用 Supabase):**
```vue
<script>
export default {
  methods: {
    async signin () {
      try {
        this.isLoading = true
        const { data, error } = await this.$supabase.auth.signInWithPassword({
          email: this.user.email,
          password: this.user.password
        })

        if (error) throw error

        // 登入成功，token 已自動由 Supabase 管理
        this.$bus.$emit('message:push', 'Login successful ヾ(●゜▽゜●)♡', 'success')
        this.$router.push('admin/products')
      } catch (error) {
        this.$bus.$emit('message:push', `Login failed: ${error.message}`, 'info')
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>
```

### 5.2 Dashboard 驗證 (src/views/backend/Dashboard.vue)

**原本:**
```vue
<script>
export default {
  methods: {
    checkLogin () {
      this.token = document.cookie.replace(
        /(?:(?:^|.*;\s*)lizToken\s*=\s*([^;]*).*$)|^.*$/,
        '$1'
      )
      this.$http.defaults.headers.common.Authorization = `Bearer ${this.token}`
      
      const api = `${process.env.VUE_APP_APIPATH}auth/check`
      this.$http.post(api, { api_token: this.token })
        .then((res) => {
          this.isLoading = false
          this.checkSuccess = true
        })
        .catch(() => {
          this.isLoading = false
          this.$router.push('/login')
        })
    }
  }
}
</script>
```

**新版:**
```vue
<script>
export default {
  methods: {
    async checkLogin () {
      try {
        const { data: { user }, error } = await this.$supabase.auth.getUser()

        if (error || !user) {
          throw new Error('Not authenticated')
        }

        this.token = user.id
        this.isLoading = false
        this.checkSuccess = true
      } catch (error) {
        this.isLoading = false
        this.$router.push('/login')
      }
    }
  }
}
</script>
```

### 5.3 前台產品列表 (src/views/frontend/Products.vue)

**原本:**
```vue
<script>
export default {
  methods: {
    getProducts (page = 1) {
      const api = `${process.env.VUE_APP_APIPATH}${process.env.VUE_APP_UUID}/ec/products?page=${page}`
      this.$http.get(api).then((response) => {
        this.isLoading = false
        this.products = response.data.data
        this.newProducts = this.products
        this.pagination = response.data.meta.pagination
      })
    }
  }
}
</script>
```

**新版:**
```vue
<script>
export default {
  methods: {
    async getProducts (page = 1) {
      try {
        this.isLoading = true
        const pageSize = 20
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, error, count } = await this.$supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('enabled', true)
          .range(from, to)

        if (error) throw error

        this.products = data
        this.newProducts = this.products
        this.pagination = {
          total: count,
          current_page: page,
          per_page: pageSize,
          last_page: Math.ceil(count / pageSize)
        }
        this.isLoading = false
      } catch (error) {
        console.error('Error fetching products:', error)
        this.isLoading = false
      }
    }
  }
}
</script>
```

### 5.4 購物車 (src/components/Nav.vue)

**原本 - 取得購物車:**
```javascript
getCart () {
  this.isLoading = true
  const url = `${process.env.VUE_APP_APIPATH}${process.env.VUE_APP_UUID}/ec/shopping`
  this.$http.get(url).then((response) => {
    this.cart = response.data.data
    this.updateTotal()
    this.isLoading = false
  })
}
```

**新版:**
```javascript
async getCart () {
  try {
    this.isLoading = true
    const { data: { user } } = await this.$supabase.auth.getUser()

    if (!user) return

    const { data, error } = await this.$supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        products:product_id (id, title, price, image_urls)
      `)
      .eq('user_id', user.id)

    if (error) throw error

    // 轉換格式以相容原本的前端代碼
    this.cart = data.map(item => ({
      id: item.id,
      product: {
        id: item.products.id,
        title: item.products.title,
        price: item.products.price,
        imageUrl: item.products.image_urls
      },
      quantity: item.quantity
    }))

    this.updateTotal()
    this.isLoading = false
  } catch (error) {
    console.error('Error fetching cart:', error)
    this.isLoading = false
  }
}
```

**原本 - 新增購物車:**
```javascript
addToCart (item, quantity = 1) {
  const url = `${process.env.VUE_APP_APIPATH}${process.env.VUE_APP_UUID}/ec/shopping`
  const cart = { product: item.id, quantity }
  this.$http.post(url, cart).then((response) => {
    this.getCart()
    this.$bus.$emit('message:push', `"${response.data.data.product.title}" has been added...`, 'success')
  }).catch((error) => {
    this.$bus.$emit('message:push', `${error.response.data.errors[0]}...`, 'info')
  })
}
```

**新版:**
```javascript
async addToCart (item, quantity = 1) {
  try {
    const { data: { user } } = await this.$supabase.auth.getUser()

    if (!user) {
      this.$bus.$emit('message:push', 'Please login first', 'info')
      return
    }

    // 檢查是否已在購物車中
    const { data: existing } = await this.$supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', item.id)
      .single()

    if (existing) {
      // 更新數量
      await this.$supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
    } else {
      // 新增項目
      await this.$supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: item.id,
          quantity
        })
    }

    this.getCart()
    this.$bus.$emit('message:push', `"${item.title}" has been added to the cart successfully!`, 'success')
  } catch (error) {
    console.error('Error adding to cart:', error)
    this.$bus.$emit('message:push', 'Failed to add item to cart', 'info')
  }
}
```

### 5.5 訂單建立 (src/views/frontend/Cart.vue)

**原本:**
```javascript
async createOrder () {
  this.isLoading = true
  const url = `${process.env.VUE_APP_APIPATH}${process.env.VUE_APP_UUID}/ec/orders`
  const order = { ...this.form }
  
  if (this.coupon.enabled) {
    order.coupon = this.coupon.code
  }

  this.$http.post(url, order).then((response) => {
    if (response.data.data.id) {
      this.$router.push(`/payment/${response.data.data.id}`)
    }
    this.$bus.$emit('nav-getCart')
    this.isLoading = false
  }).catch((error) => {
    // 錯誤處理
    this.isLoading = false
  })
}
```

**新版:**
```javascript
async createOrder () {
  try {
    this.isLoading = true
    const { data: { user } } = await this.$supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    // 計算訂單總額
    let total = this.cartTotal
    let coupon_id = null

    if (this.coupon.enabled) {
      coupon_id = this.coupon.id
      total = this.cartTotal * (this.coupon.percent / 100)
    }

    // 建立訂單
    const { data: order, error: orderError } = await this.$supabase
      .from('orders')
      .insert({
        user_id: user.id,
        name: this.form.name,
        email: this.form.email,
        tel: this.form.tel,
        address: this.form.address,
        message: this.form.message,
        total,
        payment_method: this.form.payment,
        coupon_id,
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // 新增訂單明細
    const orderItems = this.cart.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price
    }))

    const { error: itemsError } = await this.$supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // 清空購物車
    await this.$supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    this.$router.push(`/payment/${order.id}`)
    this.$bus.$emit('nav-getCart')
    this.isLoading = false
  } catch (error) {
    console.error('Error creating order:', error)
    this.$bus.$emit('message:push', `Failed to create order: ${error.message}`, 'info')
    this.isLoading = false
  }
}
```

---

## 第 6 步: 建立 Supabase 資料庫表

進入 Supabase Dashboard → SQL Editor，執行以下 SQL:

```sql
-- 1. 用戶資料表 (補充 Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. 產品表
CREATE TABLE IF NOT EXISTS products (
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

-- 3. 購物車項目表
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 4. 優惠券表
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  percent INT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  expiry_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. 訂單表
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  tel VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  message TEXT,
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  coupon_id UUID REFERENCES coupons(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. 訂單明細表
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. 庫存/物料表
CREATE TABLE IF NOT EXISTS storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. 啟用行級別安全 (RLS)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 9. 購物車 RLS 策略
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- 10. 訂單 RLS 策略
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 11. 訂單明細 RLS 策略 (透過訂單 user_id)
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- 12. 公開表 (無 RLS)
-- products: 所有人可讀
-- coupons: 所有人可讀
-- storage: 所有人可讀
```

---

## 第 7 步: 在 Supabase 建立測試帳戶

1. 進入 Supabase Dashboard → Authentication → Users
2. 點擊「Invite」
3. 輸入測試 email: `test@example.com`
4. 輸入密碼
5. 點擊「Send invite」

---

## 第 8 步: 在 Supabase 建立測試資料

進入 SQL Editor，插入範例資料:

```sql
INSERT INTO products (title, category, price, origin_price, description, image_urls, enabled)
VALUES 
  ('現代辦公椅', '椅子', 2999, 3999, '舒適耐用的辦公椅', ARRAY['https://via.placeholder.com/300'], true),
  ('實木餐桌', '桌子', 5999, 7999, '高質量實木製造', ARRAY['https://via.placeholder.com/300'], true),
  ('北歐沙發', '沙發', 12999, 16999, '現代設計沙發', ARRAY['https://via.placeholder.com/300'], true),
  ('護眼檯燈', '燈飾', 899, 1299, 'LED 護眼設計', ARRAY['https://via.placeholder.com/300'], true);

INSERT INTO coupons (code, percent, enabled)
VALUES 
  ('SAVE10', 90, true),
  ('SAVE20', 80, true),
  ('WELCOME', 95, true);
```

---

## 第 9 步: 本地測試

```bash
npm run serve
```

進入瀏覽器測試:
1. 登入: test@example.com / (設定的密碼)
2. 瀏覽產品
3. 新增購物車
4. 建立訂單
5. 查詢優惠券

---

## 第 10 步: 部署到 Vercel

### 10.1 推送到 GitHub

```bash
git add .
git commit -m "Migrate to Supabase + Vercel"
git push origin main
```

### 10.2 在 Vercel 部署

1. 前往 https://vercel.com
2. 用 GitHub 登入
3. 點擊「Add New」→「Project」
4. 選擇 `Hometown2` 倉庫
5. 點擊「Import」
6. 設定環境變數 (點擊「Environment Variables」):
   - `VUE_APP_SUPABASE_URL`: `https://YOUR_PROJECT.supabase.co`
   - `VUE_APP_SUPABASE_KEY`: `eyJ0...` (複製 anon key)
7. 點擊「Deploy」
8. 等待 1-2 分鐘

### 10.3 驗證部署

Vercel 提供 URL: `https://hometown2-xxx.vercel.app`

測試線上版本的所有功能。

---

## 🔧 除錯技巧

### 查看 Supabase 請求日誌
在 Supabase Dashboard → Logs 查看所有 API 呼叫

### 在瀏覽器 Console 查看錯誤
```javascript
// 在瀏覽器 console 執行，查看 Supabase 狀態
console.log(window.__SUPABASE_CLIENT__)
```

### 測試認證狀態
```javascript
// 在 console 執行
this.$supabase.auth.getUser().then(user => console.log(user))
```

---

## ✅ 遷移檢查清單

- [ ] 安裝 `@supabase/supabase-js`
- [ ] 建立 `src/utils/supabase.js`
- [ ] 更新 `.env` (新增 SUPABASE 變數)
- [ ] 修改 `src/main.js`
- [ ] 遷移登入元件
- [ ] 遷移 Dashboard
- [ ] 遷移產品列表
- [ ] 遷移購物車
- [ ] 遷移訂單相關
- [ ] 遷移後台 CRUD
- [ ] 在 Supabase 建立所有表
- [ ] 在 Supabase 建立測試帳戶
- [ ] 插入測試資料
- [ ] 本地 `npm run serve` 測試
- [ ] 完整功能測試 (登入、瀏覽、購物、訂單)
- [ ] 推送到 GitHub
- [ ] Vercel 部署
- [ ] 線上功能驗證

---

**需要幫助？隨時提問！** 🚀
