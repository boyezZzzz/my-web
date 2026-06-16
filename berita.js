/* =========================================
   BERITA TERKINI — berita.js
   API: https://api-nanzz.my.id/docs/api/informasi/berita.php?source=kompas
   Auto-execute saat halaman dibuka, muncul sebagai notif pojok kanan bawah
   ========================================= */

const Berita = {
  notif:    document.getElementById('news-notif'),
  body:     document.getElementById('news-notif-body'),
  closeBtn: document.getElementById('news-notif-close'),

  /** Tampilkan notif dengan animasi masuk */
  show() {
    this.notif.classList.remove('hide');
    // requestAnimationFrame agar transisi CSS terpicu dengan benar
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.notif.classList.add('show');
      });
    });
  },

  /** Sembunyikan notif dengan animasi keluar */
  hide() {
    this.notif.classList.remove('show');
    this.notif.classList.add('hide');
  },

  /** Render daftar berita ke dalam body notif */
  renderBerita(items) {
    if (!items || items.length === 0) {
      this.body.innerHTML = '<p class="news-error">Tidak ada berita tersedia saat ini.</p>';
      return;
    }

    // Tampilkan maks 8 berita teratas
    const list = items.slice(0, 8);

    this.body.innerHTML = list.map(item => `
      <a class="news-item" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
        <img
          class="news-item-img"
          src="${escapeHtml(item.image || '')}"
          alt=""
          loading="lazy"
          onerror="this.style.display='none'"
        />
        <div class="news-item-text">
          <div class="news-item-title">${escapeHtml(item.title)}</div>
          <div class="news-item-meta">
            <span class="news-item-cat">${escapeHtml(item.category || 'Berita')}</span>
            <span class="news-item-date">${escapeHtml(item.date || '')}</span>
          </div>
        </div>
      </a>
    `).join('');
  },

  /** Ambil berita dari API */
  async fetchBerita() {
    const url = 'https://api-nanzz.my.id/docs/api/informasi/berita.php?source=kompas';

    let res;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    } catch {
      // Fallback proxy jika CORS block
      try {
        res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(10000) });
      } catch (err) {
        throw new Error('network_fail');
      }
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json;
  },

  /** Inisialisasi: fetch & tampilkan setelah delay singkat */
  async init() {
    // Tombol tutup
    this.closeBtn.addEventListener('click', () => this.hide());

    // Tutup juga dengan klik di luar (khusus mobile, notif tidak punya overlay)
    // Tidak perlu overlay karena notif kecil

    // Delay sedikit agar halaman selesai render dulu
    await delay(800);

    // Tampilkan notif dengan loading state
    this.show();

    try {
      const json = await this.fetchBerita();

      if (!json.status || !json.result?.data) {
        this.body.innerHTML = '<p class="news-error">⚠️ Gagal memuat berita. Coba refresh halaman.</p>';
        return;
      }

      this.renderBerita(json.result.data);
    } catch (err) {
      console.error('[Berita]', err);
      this.body.innerHTML = '<p class="news-error">⚠️ Tidak dapat memuat berita saat ini.</p>';
    }
  }
};

/** Escape HTML untuk mencegah XSS */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Helper: promise delay */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener('DOMContentLoaded', () => Berita.init());
