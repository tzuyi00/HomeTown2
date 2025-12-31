<template>
  <div
    id="couponModal"
    class="modal fade"
    tabindex="-1"
    role="dialog"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
  >
  <loading :active.sync="isLoading"></loading>
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header bg-dark text-white">
          <h5 id="exampleModalLabel" class="modal-title">建立優惠券</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <span class="text-danger float-right" v-if="isNew">*必填</span>
          <div class="form-group mt-2">
            <label for="title">標題</label>
            <span class="text-danger ml-1"
            v-if="isNew">*</span>
            <input
              id="title"
              v-model="localCoupon.title"
              type="text"
              class="form-control"
              placeholder="請輸入標題"
            />
          </div>
          <div class="form-group">
            <label for="coupon_code">優惠碼</label>
            <span class="text-danger ml-1"
            v-if="isNew">*</span>
            <input
              id="coupon_code"
              v-model="localCoupon.code"
              type="text"
              class="form-control"
              placeholder="請輸入優惠碼"
            />
          </div>
          <div class="form-group">
            <label for="due_date">到期日</label>
            <span class="text-danger ml-1"
            v-if="isNew">*</span>
            <input id="due_date" v-model="localCoupon.due_date" type="date" class="form-control" />
          </div>
          <div class="form-group">
            <label for="due_time">到期時間</label>
            <span class="text-danger ml-1"
            v-if="isNew">*</span>
            <input id="due_time" v-model="localCoupon.due_time" type="time" step="1" class="form-control" />
          </div>
          <div class="form-group">
            <label for="price">折扣百分比</label>
            <span class="text-danger ml-1"
            v-if="isNew">*</span>
            <input
              id="price"
              v-model="localCoupon.percent"
              type="number"
              class="form-control"
              placeholder="請輸入折扣數量"
            />
          </div>
          <div class="form-group">
            <div class="form-check">
              <input
                id="enabled"
                v-model="localCoupon.enabled"
                class="form-check-input"
                type="checkbox"
              />
              <label class="form-check-label" for="enabled">是否啟用</label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">關閉</button>
          <button
            type="button"
            class="btn btn-primary"
            @click="updateCoupon"
          >確定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* global $ */

export default {
  name: 'CouponModal',
  props: {
    tempCoupon: {
      deadline_at: 0
    },
    isNew: Boolean
  },
  data () {
    return {
      isLoading: false,
      localCoupon: { ...this.tempCoupon } // 深拷貝，避免直接修改父層的資料
    }
  },
  methods: {
    async updateCoupon () {
      try {
        this.isLoading = true

        // 驗證必填欄位
        if (!this.localCoupon.title || !this.localCoupon.code || !this.localCoupon.percent) {
          this.$bus.$emit('message:push', '必填項目沒填唷！', 'info')
          this.isLoading = false
          return
        }

        // 組合日期時間
        if (this.localCoupon.due_date && this.localCoupon.due_time) {
          this.localCoupon.deadline_at = `${this.localCoupon.due_date} ${this.localCoupon.due_time}`
        }

        let error
        let status = ''

        if (this.isNew) {
          // 新增優惠券
          const { error: insertError } = await this.$supabase
            .from('coupons')
            .insert({
              title: this.localCoupon.title,
              code: this.localCoupon.code,
              percent: this.localCoupon.percent,
              deadline_at: this.localCoupon.deadline_at,
              enabled: this.localCoupon.enabled || false
            })

          error = insertError
          status = '新增成功囉，好棒ヽ(＾Д＾)ﾉ '
        } else {
          // 更新優惠券
          const { error: updateError } = await this.$supabase
            .from('coupons')
            .update({
              title: this.localCoupon.title,
              code: this.localCoupon.code,
              percent: this.localCoupon.percent,
              deadline_at: this.localCoupon.deadline_at,
              enabled: this.localCoupon.enabled
            })
            .eq('id', this.localCoupon.id)

          error = updateError
          status = '更新成功囉，好棒ヽ(＾Д＾)ﾉ '
        }

        if (error) throw error

        this.isLoading = false
        $('#couponModal').modal('hide')
        this.$bus.$emit('message:push', status, 'success')
        this.$emit('update') // 更新畫面
      } catch (error) {
        console.error('Error updating coupon:', error)
        this.isLoading = false
        this.$bus.$emit('message:push',
          `出現錯誤惹，好糗Σ( ° △ °|||)︴ ${error.message}`,
          'danger')
      }
    }
  }
}
</script>
