
export default class NotFoundPage {
  async render() {
    return `
      <section class="container error-container">
        <div class="error-content">
          <h1 class="error-title">404</h1>
          <h2 class="error-subtitle">Halaman Tidak Ditemukan</h2>
          <p class="error-description">
            Maaf, halaman yang Anda cari tidak dapat ditemukan. 
            Mungkin halaman telah dipindahkan atau URL yang Anda masukkan salah.
          </p>
          <div class="error-actions">
            <a href="#/" class="btn btn-primary">Kembali ke Beranda</a>
            <button onclick="history.back()" class="btn btn-secondary">Kembali</button>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    console.log('Page not Found');

  }
}