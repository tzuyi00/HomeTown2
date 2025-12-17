# 登入需求說明文件

## 📋 功能登入需求總覽

此文件說明哪些功能需要登入，哪些功能不需要登入。

---

## ✅ **不需要登入的功能**（訪客可用）

### 1. 前台瀏覽功能
- ✅ **瀏覽商品列表** (`/products`)
  - 檔案：`src/views/frontend/Products.vue`
  - 可查看所有已啟用的商品
  
- ✅ **查看商品詳情** (`/product/:id`)
  - 檔案：`src/views/frontend/Product.vue`
  - 可查看單一商品的詳細資訊和相關商品

- ✅ **查看優惠券頁面** (`/coupon`)
  - 檔案：`src/views/frontend/Coupon.vue`
  - 可瀏覽所有可用的優惠券

### 2. 購物車功能（使用 localStorage）
- ✅ **加入購物車**
  - 檔案：`src/components/Nav.vue` - `addToCart()`
  - 未登入時資料存在 `localStorage`
  - 登入後存到 Supabase 資料庫

- ✅ **查看購物車** (`/cart`)
  - 檔案：`src/views/frontend/Cart.vue` - `getCart()`
  - 未登入時從 `localStorage` 讀取
  - 登入後從 Supabase 讀取

- ✅ **修改購物車數量**
  - 檔案：`src/views/frontend/Cart.vue` - `quantityUpdata()`
  - 未登入時更新 `localStorage`
  - 登入後更新 Supabase

- ✅ **刪除購物車項目**
  - 檔案：`src/components/Nav.vue` - `removeCartItem()`
  - 檔案：`src/views/frontend/Cart.vue` - `removeCartItem()`
  - 未登入時刪除 `localStorage` 中的項目
  - 登入後刪除 Supabase 中的項目

- ✅ **查詢優惠券**
  - 檔案：`src/views/frontend/Cart.vue` - `addCoupon()`
  - 不需登入即可輸入優惠券代碼查詢

---

## 🔐 **需要登入的功能**

### 1. 前台結帳功能
- 🔐 **建立訂單/結帳**
  - 檔案：`src/views/frontend/Cart.vue` - `createOrder()`
  - 原因：需要記錄訂單歸屬的用戶
  - 行為：未登入時會導向登入頁面並顯示提示訊息
  
- 🔐 **查看訂單詳情** (`/payment/:orderId`)
  - 檔案：`src/views/frontend/Payment.vue`
  - 原因：需要驗證訂單是否屬於該用戶

### 2. 後台管理功能（全部需要登入）
- 🔐 **後台儀表板** (`/admin`)
  - 檔案：`src/views/backend/Dashboard.vue`
  - 檔案：`src/router/index.js` - 路由守衛
  - 驗證方法：`checkLogin()` - 檢查 `this.$supabase.auth.user()`

- 🔐 **商品管理** (`/admin/products`)
  - 檔案：`src/views/backend/Products.vue`
  - 功能：查看、新增、編輯、刪除商品

- 🔐 **訂單管理** (`/admin/orders`)
  - 檔案：`src/views/backend/Orders.vue`
  - 功能：查看所有訂單、更新訂單狀態

- 🔐 **優惠券管理** (`/admin/coupons`)
  - 檔案：`src/views/backend/Coupons.vue`
  - 功能：查看、新增、編輯、刪除優惠券

- 🔐 **庫存管理** (`/admin/storages`)
  - 檔案：`src/views/backend/Storages.vue`
  - 功能：管理商品庫存

---

## 🔄 登入後的購物車同步機制

### 建議實作（可選）：
當用戶登入時，可以將 localStorage 中的購物車資料同步到 Supabase：

```javascript
// 在 Login.vue 登入成功後執行
async syncCartToSupabase() {
  const localCart = localStorage.getItem('cart')
  if (!localCart) return
  
  const cart = JSON.parse(localCart)
  const user = this.$supabase.auth.user()
  
  for (const item of cart) {
    // 檢查是否已存在
    const { data: existing } = await this.$supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', item.product.id)
      .single()
    
    if (existing) {
      // 更新數量
      await this.$supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + item.quantity })
        .eq('id', existing.id)
    } else {
      // 新增項目
      await this.$supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: item.product.id,
          quantity: item.quantity
        })
    }
  }
  
  // 同步完成後清空 localStorage
  localStorage.removeItem('cart')
  this.$bus.$emit('nav-getCart') // 重新載入購物車
}
```

---

## 📝 測試帳號

- **Email**: `test@example.com`
- **Password**: `Test@12345`

---

## 🎯 使用者體驗流程

### 訪客流程：
1. 瀏覽商品 ✅
2. 加入購物車 ✅ (存在 localStorage)
3. 查看購物車 ✅
4. 修改購物車 ✅
5. 點擊「結帳」→ 導向登入頁面 🔐

### 登入用戶流程：
1. 登入帳號 🔐
2. 瀏覽商品 ✅
3. 加入購物車 ✅ (存到 Supabase)
4. 查看購物車 ✅
5. 修改購物車 ✅
6. 結帳 🔐 (建立訂單)
7. 查看訂單詳情 🔐

### 管理員流程：
1. 登入後台 🔐
2. 管理商品/訂單/優惠券 🔐

---

## 🛡️ 安全性考量

1. **Row Level Security (RLS)**
   - `cart_items`: 用戶只能存取自己的購物車
   - `orders`: 用戶只能查看自己的訂單
   - `order_items`: 透過 orders 關聯限制存取

2. **後台路由守衛**
   - 檔案：`src/router/index.js`
   - 檢查 `this.$supabase.auth.user()` 是否存在
   - 未登入自動導向 `/login`

3. **API 權限控制**
   - Products: 公開讀取，管理員可寫入
   - Coupons: 公開讀取，管理員可寫入
   - Orders: 僅擁有者可讀寫
   - Cart_items: 僅擁有者可讀寫

---

## ✅ 修改完成的檔案

1. **src/components/Nav.vue**
   - `getCart()` - 支援 localStorage
   - `addToCart()` - 支援 localStorage
   - `removeCartItem()` - 支援 localStorage

2. **src/views/frontend/Cart.vue**
   - `getCart()` - 支援 localStorage
   - `quantityUpdata()` - 支援 localStorage
   - `removeCartItem()` - 支援 localStorage
   - `createOrder()` - 未登入時導向登入頁面

---

## 🎉 功能測試步驟

### 測試未登入購物車：
1. 清除瀏覽器 localStorage: `localStorage.clear()`
2. 登出（如果已登入）
3. 瀏覽商品列表
4. 點擊「加入購物車」→ 應該成功
5. 查看導航欄購物車數量 → 應該顯示
6. 進入購物車頁面 → 應該看到商品
7. 修改數量 → 應該成功
8. 刪除項目 → 應該成功
9. 點擊「結帳」→ 應該導向登入頁面

### 測試登入購物車：
1. 登入帳號 (test@example.com / Test@12345)
2. 加入商品到購物車 → 應該存到 Supabase
3. 刷新頁面 → 購物車資料應該保留
4. 修改數量 → 應該更新 Supabase
5. 結帳 → 應該成功建立訂單

### 測試後台：
1. 前往 `/admin` → 應該導向登入頁面（未登入）
2. 登入後 → 應該進入後台儀表板
3. 測試商品管理 → 應該可以 CRUD
4. 登出後前往 `/admin` → 應該再次導向登入頁面
