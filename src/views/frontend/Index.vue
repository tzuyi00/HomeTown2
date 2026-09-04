<template>
  <div class="container-fluid px-0">
    <header :style="{backgroundImage: `url(${img.header})` }">
      <div class="bannerTxt text-center">
        <div class="txts wow animate__animated animate__fadeInUp">An Afternoon Escape, Free Yourself</div>
        <div class="txts wow animate__animated animate__fadeInUp" data-wow-delay="1s">No need to travel far, enjoy a vacation at home</div>
        <router-link to="/products">
          <div class="bannerBtn btn btn-info mt-3 shadow-sm wow animate__animated animate__jello" data-wow-delay="1.8s">
            Shop Now
            <i class="fas fa-hand-point-up"></i>
          </div>
        </router-link>
      </div>
      <div @click="arrowDown()" class="arrow text-center">
        <i class="fas fa-angle-double-down"></i>
      </div>
    </header>
    <div id="arrowDown" class="container text-center">
      <div class="aboutUs row mt-5" :style="{backgroundImage: `url(${img.flower})` }">
        <div class="order-md-2 aboutUsTxt col-12 col-md-6 align-self-center">
          <div class="wow animate__animated animate__fadeInUp" data-wow-delay="0.5s">
            <h2 class="title">About Us</h2>
            <div class="line mx-auto"></div>
          </div>
          <div class="h4 mt-4 wow animate__animated animate__fadeInUp" data-wow-delay="0.8s">Creating a Home with Heart</div>
          <div class="h5 mt-3 wow animate__animated animate__fadeInUp" data-wow-delay="1s">
            Our original intention
            <br />is to create a stylish home for you.
            <br />Simple yet not Simplistic designs
            <br />Bringing back the true beauty of home living.
            <br />
          </div>
          <div class="h5 mt-3 wow animate__animated animate__fadeInUp" data-wow-delay="1s">
            Wide Variety, Transparent Pricing
            <br />Professional on-site measurement and planning
            <br />Helping you build a cozy countryside home
            <br />with a minimal budget.
          </div>
        </div>
        <div class="order-md-1 col-12 col-md-6 wow animate__animated animate__fadeInLeft">
          <img class="aboutUsImg" :src="img.aboutUs" alt />
        </div>
      </div>
      <div class="arrival">
        <div class="wow animate__animated animate__fadeInUp">
          <h2 class="title text-center">New Arrival</h2>
          <div class="line mx-auto"></div>
        </div>
        <div class="row mt-4">
          <div class="col-12 col-md-4 mt-4 px-sm-0 wow animate__animated animate__fadeInUp">
            <div class="arrWrap">
              <router-link to="/product/YQf9MNfIPFcjKNXdaKYZWSigm5ioJvsOXxuTpYm7rB4vFIr9a6zNvPrXi9mwHBJq">
                <div class="arrImg" :style="{backgroundImage: `url(${img.arr1})` }"></div>
              </router-link>
            </div>
            <div class="arrTxt">
              <div class="arrInner">
                <h4>Table</h4>
                <p class="text-left mt-3">Choose desks or work tables with adjustable heights and movable panels to enhance your study and work efficiency.</p>
                <router-link to="/products">
                  <div class="btn btn-info">View Details</div>
                </router-link>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4 mt-4 px-sm-0 d-flex flex-column wow animate__animated animate__fadeInUp" data-wow-delay="0.5s">
            <div class="arrWrap order-md-2">
              <router-link to="/product/bmbWYKRkF9YeGFDPVQqBo1HEv6pX0vCoUpkNuLn08VP3btszYfAoymUNxEMF2cbj">
                <div class="arrImg" :style="{backgroundImage: `url(${img.arr2})` }"></div>
              </router-link>
            </div>
            <div class="arrTxt order-md-1">
              <div class="arrInner">
                <h4>Lighting</h4>
                <p class="text-left mt-3">Whether you're cozying up on the sofa or preparing dinner, the right lighting creates a warm, inviting atmosphere!</p>
                <router-link to="/products">
                  <div class="btn btn-info">View Details</div>
                </router-link>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4 mt-4 px-sm-0 wow animate__animated animate__fadeInUp" data-wow-delay="1s">
            <div class="arrWrap">
              <router-link to="/product/35Fp3amsAeRN7IupNYykoHYbr8dl8fDoQfXVZfvgqi9tgCxBmfKd05RBnWL81D9U">
                <div class="arrImg" :style="{backgroundImage: `url(${img.arr3})` }"></div>
              </router-link>
            </div>
            <div class="arrTxt">
              <div class="arrInner">
                <h4>Chair</h4>
                <p class="text-left mt-3">We understand you sometimes just want to enjoy a moment alone — our chairs are designed for long-lasting comfort.</p>
                <router-link to="/products">
                  <div class="btn btn-info">View Details</div>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="middleBg" :style="{backgroundImage: `url(${img.middleBg})` }">
      <div class="middleTxt text-center text-sm-left">
        <div class="txts wow animate__animated animate__bounceInLeft">Haven't Won the Anniversary Grand Prize Yet?</div>
        <div class="text-center d-sm-flex align-items-center justify-content-center">
          <div class="txts d-block d-sm-inline wow animate__animated animate__bounceInRight" data-wow-delay="1s">Scratch and reveal your <br> exclusive coupon!</div>
          <router-link to="/coupon">
            <div class="middleBtn btn btn-info ml-sm-3 mt-3 mt-sm-0 shadow-sm wow animate__animated animate__backInUp" data-wow-delay="2s">
              Claim Prize
              <i class="fas fa-hand-point-up"></i>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <div class="container hotSale">
      <div class="wow animate__animated animate__fadeInUp">
        <h2 class="title text-center">Hot Sale</h2>
        <div class="line mx-auto"></div>
      </div>

      <div class="row mt-4">
        <div class="col-12 col-md-6 mt-4 wow animate__animated animate__fadeInUp">
          <router-link to="/product/C0ctzEP4vsNjXCjPxVeE8Mw61nGu1kBJBSju4Qxa7kCxY1tG2NwcVB20JAEKMkXJ">
            <div class="goodWrap" :style="{backgroundImage: `url(${img.good1})` }">
              <div class="goodTitle">Cherished Double Sofa</div>
              <div class="goodDetail">
                <h4>Cherished Double Sofa</h4>
                <p>
                  Warm, cozy, clean, and stylish
                  <br />Soft, quality cushion covers
                  <br />Contours perfectly to sofa lines
                  <br />Achieving a balance between functionality and aesthetics
                </p>
              </div>
            </div>
          </router-link>
        </div>
        <div class="col-12 col-md-6 mt-4 wow animate__animated animate__fadeInUp" data-wow-delay="1s">
          <router-link to="/product/EUySZ1dDkRzOn7EKKUK1YWGQIHD7nvFfcWvHsYGkmY9mo6MU2Eo3V00Wp7swZWiG">
            <div class="goodWrap" :style="{backgroundImage: `url(${img.good2})` }">
              <div class="goodTitle">Elegant Table Lamp</div>
              <div class="goodDetail">
                <h4>Elegant Table Lamp</h4>
                <p>
                  Inspired by traditional oil lamps
                  <br />Soft, warm ambient lighting
                  <br />Adjust brightness by turning the knob
                  <br />Adds a cozy and gentle glow
                </p>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
    <div class="goShopBtn">
      <hr />
      <router-link to="/products">
        <button class="btn btn-info wow animate__animated animate__jello" data-wow-delay="1s">Go Shopping</button>
      </router-link>
    </div>
  </div>
</template>

<script>
/* global $ */
export default {
  name: 'Index',
  components: {},
  data () {
    return {
      img: {
        header:
          'https://kslpccltrlcujjongied.supabase.co/storage/v1/object/public/site-assets/1767018324497.jpg',
        aboutUs:
          'https://kslpccltrlcujjongied.supabase.co/storage/v1/object/public/site-assets/1767018316741.jpg',
        arr1:
          'https://kslpccltrlcujjongied.supabase.co/storage/v1/object/public/site-assets/1767019323643.jpg',
        arr2:
          'https://kslpccltrlcujjongied.supabase.co/storage/v1/object/public/site-assets/1767018289972.jpg',
        arr3:
          'https://kslpccltrlcujjongied.supabase.co/storage/v1/object/public/site-assets/1767018273823.jpg',
        middleBg:
          'https://kslpccltrlcujjongied.supabase.co/storage/v1/object/public/site-assets/1767018265250.jpg',
        good1:
          'https://kslpccltrlcujjongied.supabase.co/storage/v1/object/public/site-assets/1767018236271.jpg',
        good2:
          'https://kslpccltrlcujjongied.supabase.co/storage/v1/object/public/site-assets/1767018225693.jpg',
        flower:
          'https://kslpccltrlcujjongied.supabase.co/storage/v1/object/public/site-assets/1767018217644.png'
      }
    }
  },
  methods: {
    arrowDown () {
      $('body,html').animate(
        {
          scrollTop: $('#arrowDown').offset().top - 80
        },
        800
      )
    }
  }
}
</script>
