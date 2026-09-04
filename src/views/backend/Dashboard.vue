<template>
  <div id="rebody" class="bg-main-bg has-navpanel-left has-navpanel-fixed navbar-is-top">
    <loading :active.sync="isLoading"></loading>
    <!--navbar -->
    <nav class="navbar navbar-expand-lg fixed-top navbar-light pt-4">
      <div class="d-flex justify-content-between w-100">
        <a href="#" class="hide-navpanel-btn my-auto" @click.prevent="hidenavpanel">
          <i class="fa fa-bars fa-lg"></i>
        </a>
        <div class="back-brand d-flex align-items-center">
          <img class="logoImg" src="@/assets/img/logoTop.png" alt="logoTop" />
          <span class="logoTxt">HomeTown</span>
        </div>
        <div class="my-auto mr-3">
          <i class="fas fa-user"></i> 管理員你好
        </div>
      </div>
    </nav>
    <Navpanel />
    <div class="has-navpanel-left border-top pt-3 mb-4">

      <router-view :token-receive="token" v-if="checkSuccess" />
    </div>
  </div>
</template>

<script>
import Navpanel from '@/components/backend/Navpanel.vue'

/* global $ */

export default {
  name: 'Dashboard',
  components: {
    Navpanel
  },
  data () {
    return {
      isLoading: false,
      token: '',
      checkSuccess: false
    }
  },
  created () {
    this.isLoading = true
    this.checkLogin()
  },
  methods: {
    hidenavpanel () {
      $('#rebody').toggleClass('hide-navpanel')
    },
    // 確認 Supabase Auth 狀態
    async checkLogin () {
      try {
        const user = this.$supabase.auth.user()

        if (!user) {
          throw new Error('Not authenticated')
        }

        this.token = user.id
        this.isLoading = false
        this.checkSuccess = true
      } catch (error) {
        console.error('Auth check error:', error)
        this.isLoading = false
        // 驗證失敗，返回登入頁
        this.$router.push('/login')
      }
    },
    async signout () {
      try {
        await this.$supabase.auth.signOut()
        this.$router.push('/login')
      } catch (error) {
        console.error('Sign out error:', error)
      }
    }
  }
}
</script>
