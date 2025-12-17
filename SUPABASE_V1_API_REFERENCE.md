# Supabase v1 API 參考文件

此專案使用 **Supabase JS Client v1.35.4**，以下是 v1 和 v2 API 的主要差異。

---

## 🔑 Authentication API

### 登入 (Sign In)

**❌ v2 語法 (不支援):**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

**✅ v1 語法 (使用此語法):**
```javascript
const { user, session, error } = await supabase.auth.signIn({
  email: 'user@example.com',
  password: 'password123'
})
```

### 登出 (Sign Out)

**✅ v1 和 v2 相同:**
```javascript
const { error } = await supabase.auth.signOut()
```

### 取得當前用戶

**❌ v2 語法 (不支援):**
```javascript
const { data: { user }, error } = await supabase.auth.getUser()
```

**✅ v1 語法 (使用此語法):**
```javascript
const user = supabase.auth.user()  // 同步方法，不需要 await
```

### 取得 Session

**❌ v2 語法 (不支援):**
```javascript
const { data: { session }, error } = await supabase.auth.getSession()
```

**✅ v1 語法 (使用此語法):**
```javascript
const session = supabase.auth.session()  // 同步方法，不需要 await
```

### 監聽認證狀態變化

**✅ v1 語法:**
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session)
  // event 可能是: 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED', 'PASSWORD_RECOVERY'
})
```

---

## 📊 Database API

### 查詢資料 (Select)

**✅ v1 和 v2 相同:**
```javascript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('enabled', true)
```

### 關聯查詢 (JOIN)

**✅ v1 和 v2 相同:**
```javascript
const { data, error } = await supabase
  .from('cart_items')
  .select(`
    id,
    quantity,
    products:product_id (id, title, price, imageUrl)
  `)
```

### 插入資料 (Insert)

**✅ v1 和 v2 相同:**
```javascript
const { data, error } = await supabase
  .from('products')
  .insert({
    title: 'New Product',
    price: 100
  })
```

### 更新資料 (Update)

**✅ v1 和 v2 相同:**
```javascript
const { data, error } = await supabase
  .from('products')
  .update({ price: 150 })
  .eq('id', 1)
```

### 刪除資料 (Delete)

**✅ v1 和 v2 相同:**
```javascript
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', 1)
```

### 單筆查詢 (.single())

**✅ v1 和 v2 相同:**
```javascript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('id', 1)
  .single()
```

---

## 📁 Storage API

### 上傳檔案

**✅ v1 語法:**
```javascript
const { data, error } = await supabase.storage
  .from('product-images')
  .upload('path/to/file.jpg', file, {
    cacheControl: '3600',
    upsert: false
  })
```

### 取得公開 URL

**✅ v1 語法:**
```javascript
const { publicURL, error } = supabase.storage
  .from('product-images')
  .getPublicUrl('path/to/file.jpg')
```

**⚠️ v2 差異:**
```javascript
// v2 使用 data 而不是 publicURL
const { data } = supabase.storage
  .from('product-images')
  .getPublicUrl('path/to/file.jpg')
// 使用 data.publicUrl
```

### 刪除檔案

**✅ v1 和 v2 相同:**
```javascript
const { data, error } = await supabase.storage
  .from('product-images')
  .remove(['path/to/file.jpg'])
```

---

## 🔄 錯誤處理差異

### v1 錯誤代碼

當查詢不到資料時 (.single() 沒有結果):
```javascript
if (error && error.code === 'PGRST116') {
  // PGRST116 = No rows found (資料不存在)
  console.log('No data found')
}
```

---

## 📝 專案中已修改的檔案

### 1. **src/views/backend/Login.vue**
```javascript
// ✅ 已修改為 v1 語法
async signin () {
  const { user, error } = await this.$supabase.auth.signIn({
    email: this.user.email,
    password: this.user.password
  })
}
```

### 2. **src/views/backend/Dashboard.vue**
```javascript
// ✅ 已修改為 v1 語法
async checkLogin () {
  const user = this.$supabase.auth.user()  // 同步方法
  if (!user) {
    this.$router.push('/login')
  }
}
```

### 3. **src/components/Nav.vue**
```javascript
// ✅ 已修改為 v1 語法
async getCart () {
  const user = this.$supabase.auth.user()  // 同步方法
  // ...
}
```

### 4. **src/views/frontend/Cart.vue**
```javascript
// ✅ 已修改為 v1 語法
async getCart () {
  const user = this.$supabase.auth.user()  // 同步方法
  // ...
}
```

### 5. **src/components/backend/Navpanel.vue**
```javascript
// ✅ 已修改為 v1 語法
async signout () {
  await this.$supabase.auth.signOut()
  this.$router.push('/login')
}
```

---

## ⚠️ 常見錯誤

### 錯誤 1: `signInWithPassword is not a function`
```javascript
// ❌ 錯誤寫法 (v2)
await supabase.auth.signInWithPassword({ email, password })

// ✅ 正確寫法 (v1)
await supabase.auth.signIn({ email, password })
```

### 錯誤 2: `getUser is not a function`
```javascript
// ❌ 錯誤寫法 (v2)
const { data: { user } } = await supabase.auth.getUser()

// ✅ 正確寫法 (v1)
const user = supabase.auth.user()  // 不需要 await
```

### 錯誤 3: `getSession is not a function`
```javascript
// ❌ 錯誤寫法 (v2)
const { data: { session } } = await supabase.auth.getSession()

// ✅ 正確寫法 (v1)
const session = supabase.auth.session()  // 不需要 await
```

---

## 🔗 官方文件

- **v1 文件**: https://supabase.com/docs/reference/javascript/v1
- **v2 文件**: https://supabase.com/docs/reference/javascript/v2
- **遷移指南**: https://supabase.com/docs/reference/javascript/upgrade-guide

---

## 📊 版本資訊

- **專案使用版本**: `@supabase/supabase-js@1.35.4`
- **安裝指令**: `npm install @supabase/supabase-js@1.35.4`
- **原因**: Vue 2 + webpack 與 Supabase v2 的 ESM 模組不相容

---

## ✅ 檢查清單

使用此清單確認所有 Supabase API 都已正確使用 v1 語法：

- [x] ✅ Login.vue - 使用 `signIn()` 而非 `signInWithPassword()`
- [x] ✅ Dashboard.vue - 使用 `user()` 而非 `getUser()`
- [x] ✅ Navpanel.vue - 使用 `signOut()` (v1/v2 相同)
- [x] ✅ Nav.vue - 使用 `user()` 而非 `getUser()`
- [x] ✅ Cart.vue - 使用 `user()` 而非 `getUser()`
- [x] ✅ Products.vue (backend) - 資料庫查詢 (v1/v2 相同)
- [x] ✅ Products.vue (frontend) - 資料庫查詢 (v1/v2 相同)
- [x] ✅ Product.vue - 資料庫查詢 (v1/v2 相同)

---

## 🎯 快速參考

| 功能 | v1 語法 | v2 語法 |
|------|---------|---------|
| 登入 | `signIn({ email, password })` | `signInWithPassword({ email, password })` |
| 登出 | `signOut()` ✅ | `signOut()` ✅ |
| 取得用戶 | `user()` (同步) | `getUser()` (異步) |
| 取得 Session | `session()` (同步) | `getSession()` (異步) |
| 資料查詢 | `from().select()` ✅ | `from().select()` ✅ |
| 資料插入 | `from().insert()` ✅ | `from().insert()` ✅ |
| 資料更新 | `from().update()` ✅ | `from().update()` ✅ |
| 資料刪除 | `from().delete()` ✅ | `from().delete()` ✅ |

✅ = v1 和 v2 語法相同
