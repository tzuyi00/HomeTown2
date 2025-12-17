<template>
  <div>
    <loading :active.sync="isLoading"></loading>
    <div class="banner" :style="{backgroundImage: `url(${img.banner})` }">
      <div class="bannerTitle">
        <h1>Product Detail</h1>
      </div>
    </div>
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb mt-3 pl-sm-5">
        <li class="breadcrumb-item">
          <router-link to="/">Home</router-link>
        </li>
        <li class="breadcrumb-item">
          <router-link to="/products">Product List</router-link>
        </li>
        <li class="breadcrumb-item active" aria-current="page">{{ product.title }}</li>
      </ol>
    </nav>
    <div class="container">
      <div class="row mt-5">
        <div class="col-md-7 mb-5">
          <div class="pdImg mb-4">
            <img :src="product.imageUrl[0]" class="shadow" alt />
          </div>
        </div>
        <div class="col-md-5">
          <div class="productInfo">
            <div class="cateTag mb-3">{{ product.category }}</div>
            <h3 class="">{{ product.title }}</h3>
            <div class="line"></div>
            <div class="descript mt-4">
              <h6 class="disTitle">【Product Description】</h6>
              <p class="">{{ product.description }}</p>
            </div>
            <hr>
            <div class="mb-3">
              <del class="h6 text-secondary mb-0">NT{{ product.origin_price | currency }}</del>
              <div class="h4 text-info">NT{{ product.price | currency}}</div>
            </div>
            <div class="countNumber d-flex align-items-center">
              <button class="btn minus" @click="changeQty(-1)">
                <i class="fas fa-minus"></i>
              </button>
              <input
                type="number"
                max="10" min="1"
                class="productNumber"
                v-model="productNum"
                @change="changeNumber(productNum)"
              />
              <button class="btn add" @click="changeQty(1)">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <button class="addCart btn btn-info mt-4 px-3" @click="updateCart(product,productNum)">
              <i class="fa fa-shopping-cart"></i> Add to Cart
            </button>
          </div>
        </div>
      </div>
      <div class="referPro mt-5">
        <h4 class="text-center">Related Products</h4>
        <div class="line mx-auto"></div>
        <div class="row mt-5">
          <div v-for="item in selectedProducts" :key="item.id" class="col-xl-3 col-lg-4 col-sm-6" @click="getProduct(), getRelatedProducts()">
            <div class="productBox">
              <router-link :to="`/product/${item.id}`">
                <div class="top">
                  <div class="detailBg">
                    <div class="detailBtn">
                      Veiw Detail
                    </div>
                  </div>
                  <img :src="item.imageUrl[0]" alt />
                </div>
              </router-link>
              <div class="bottom">
                <router-link :to="`/product/${item.id}`">
                  <h4>{{ item.title }}</h4>
                </router-link>
                <div class="h5 text-info">NT{{ item.price | currency }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'Product',
  data () {
    return {
      isLoading: false,
      products: [],
      product: { imageUrl: [] },
      productNum: 1,
      relatedProducts: [],
      selectedProducts: [],
      img: {
        banner:
          'https://hexschool-api.s3.us-west-2.amazonaws.com/custom/HYMjBNd1w2pIbmbPkhzBETIPArFvCdK1hbyk8ug7kQOcTNQQ6Htwffj3G7alDUPIW7ZnJloorvHNYWIBrv1y27DwbZtUCbaQ7ozv3QeG8TEU2HRpbbxx6ZS68xNiU5VO.jpg'
      }
    }
  },
  created () {
    this.isLoading = true
    this.getAllProducts()
    this.getProduct()
    this.getRelatedProducts()
  },
  methods: {
    async getAllProducts () {
      try {
        const { data, error } = await this.$supabase
          .from('products')
          .select('*')
          .eq('enabled', true)

        if (error) throw error

        this.products = data.map(item => ({
          ...item,
          imageUrl: item.imageUrl || item.image_urls || []
        }))
      } catch (error) {
        console.error('Error fetching all products:', error)
      }
    },
    async getProduct () {
      try {
        const id = this.$route.params.id
        const { data, error } = await this.$supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        this.product = {
          ...data,
          imageUrl: data.imageUrl || data.image_urls || []
        }
        this.isLoading = false
      } catch (error) {
        console.error('Error fetching product:', error)
        this.isLoading = false
      }
    },
    async getRelatedProducts () {
      try {
        this.relatedProducts = []
        this.selectedProducts = []
        const id = this.$route.params.id
        this.isLoading = true

        // 先獲取當前產品資訊
        const { data: currentProduct, error: productError } = await this.$supabase
          .from('products')
          .select('category')
          .eq('id', id)
          .single()

        if (productError) throw productError

        // 篩選相同分類的產品（排除當前產品）
        this.products.forEach(product => {
          if (product.category === currentProduct.category && product.id !== id) {
            this.relatedProducts.push(product)
          }
        })

        // 隨機選取最多 4 個相關產品
        if (this.relatedProducts.length > 4) {
          for (let i = 0; i < 4; i++) {
            let num = Math.random() * this.relatedProducts.length
            num = Math.floor(num)
            this.selectedProducts.push(this.relatedProducts[num])
            this.relatedProducts.splice(num, 1)
          }
        } else {
          this.selectedProducts = this.relatedProducts
        }
        this.isLoading = false
      } catch (error) {
        console.error('Error fetching related products:', error)
        this.isLoading = false
      }
    },
    // 點擊 + - 按鈕做數量判斷
    changeQty (num) {
      const qty = this.productNum + num
      this.changeNumber(qty)
    },
    // 商品數量欄位變動時判斷
    changeNumber (num) {
      if (num >= 10) {
        this.productNum = 10
        this.$bus.$emit('message:push', 'Maximum quantity is 10!', 'info')
      } else if (num < 1) {
        this.productNum = 1
        this.$bus.$emit('message:push', 'Minimum quantity is 1!', 'info')
      } else {
        this.productNum = num
      }
    },
    updateCart (item, quantity) {
      this.$bus.$emit('add-cart', item, quantity)
    }
  }
}
</script>
