<template>
  <div>
    <loading :active.sync="isLoading"></loading>
    <div class="d-flex mb-2">
      <h1 class="h5 mr-auto font-weight-bold">優惠券列表</h1>
      <div class>
        <button @click="openModal('new')" class="btn btn-sm btn-outline-dark px-5 font-weight-bold">
          <i class="fas fa-plus mr-1"></i>新增優惠券
        </button>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <table class="table table-hover">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">名稱</th>
              <th scope="col">優惠碼</th>
              <th scope="col">折扣百分比</th>
              <th scope="col">到期日</th>
              <th scope="col">是否啟用</th>
              <th scope="col" class="text-center">編輯</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in coupons" :key="item.id">
              <th scope="row">{{index + 1}}</th>
              <td>{{ item.title }}</td>
              <td>{{ item.code }}</td>
              <td>{{ item.percent }}%</td>
              <td>{{ item.deadline_at || '無期限' }}</td>
              <td>
                <span v-if="item.enabled" class="text-success">啟用</span>
                <span v-else class="text-danger">未啟用</span>
              </td>
              <td class="text-center">
                <div class="btn-group">
                  <button
                    class="btn btn-outline-primary btn-sm"
                    @click="openModal('edit', item)"
                    :disabled="loadingBtn === item.id"
                  >
                    <span
                      class="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                      v-if="loadingBtn === item.id"
                    ></span>
                    編輯
                  </button>
                  <button
                    class="btn btn-outline-danger btn-sm"
                    @click="openModal('delete', item)"
                  >刪除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- 元件中 emitPages() 透過 emit 向外傳遞我們點的分頁並觸發外層的 getProducts -->
        <Pagination :pages="pagination" @emit-pages="getCoupons"></Pagination>

        <CouponModal
          :temp-coupon="tempCoupon"
          :is-new="isNew"
          @update="getCoupons"
        />

        <DeleteModal :temp-product="tempCoupon" :del-name="delName" @update="getCoupons" />
      </div>
    </div>
  </div>
</template>

<script>
/* global $ */
import Pagination from '@/components/Pagination.vue'
import CouponModal from '@/components/backend/CouponModal.vue'
import DeleteModal from '@/components/backend/DeleteModal.vue'

export default {
  name: 'Coupons',
  components: {
    Pagination,
    CouponModal,
    DeleteModal
  },
  data () {
    return {
      isLoading: false,
      coupons: [],
      tempCoupon: {
        due_date: '',
        due_time: ''
      },
      pagination: {},
      isNew: false, // 判斷是新增(true)或編輯(false)。
      loadingBtn: '',
      delName: '優惠券'
    }
  },
  created () {
    this.isLoading = true
    this.getCoupons()
  },
  methods: {
    async getCoupons (page = 1) {
      try {
        this.isLoading = true

        // 從 Supabase 讀取優惠券資料
        const { data, error, count } = await this.$supabase
          .from('coupons')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range((page - 1) * 10, page * 10 - 1)

        if (error) throw error

        this.coupons = data

        // 計算分頁資訊
        const totalPages = Math.ceil(count / 10)
        this.pagination = {
          current_page: page,
          total_pages: totalPages,
          has_pre: page > 1,
          has_next: page < totalPages
        }

        this.isLoading = false
      } catch (error) {
        console.error('Error fetching coupons:', error)
        this.$bus.$emit('message:push', '讀取優惠券失敗', 'danger')
        this.isLoading = false
      }
    },
    async openModal (modalStatus, item) {
      switch (modalStatus) {
        case 'new': {
          this.tempCoupon = {}
          this.isNew = true
          $('#couponModal').modal('show')
          break
        }
        case 'edit': {
          try {
            this.loadingBtn = item.id

            // 從 Supabase 讀取單一優惠券資料
            const { data, error } = await this.$supabase
              .from('coupons')
              .select('*')
              .eq('id', item.id)
              .single()

            if (error) throw error

            this.tempCoupon = data

            // 如果有 deadline_at，分割為日期和時間
            if (this.tempCoupon.deadline_at) {
              const dedlineAt = this.tempCoupon.deadline_at.split(' ')
              this.tempCoupon.due_date = dedlineAt[0]
              this.tempCoupon.due_time = dedlineAt[1]
            }

            $('#couponModal').modal('show')
            this.loadingBtn = ''
            this.isNew = false
          } catch (error) {
            console.error('Error fetching coupon:', error)
            this.$bus.$emit('message:push', '讀取優惠券失敗', 'danger')
            this.loadingBtn = ''
          }
          break
        }
        case 'delete': {
          this.tempCoupon = Object.assign({ ...item }) // 由於目前範本僅有一層物件，因此使用淺拷貝
          $('#delModal').modal('show')
          break
        }
        default: {
          break
        }
      }
    }
  }
}
</script>
