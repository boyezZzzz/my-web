/* =========================================
   CHATGPT — chatgpt.js
   API: https://api-nanzz.my.id/docs/api/ai/chat-gpt.php?text=TEXT&model=chatgpt
   Riwayat chat disimpan selama session (sampai refresh / tutup modal)
   ========================================= */

const GPT = {
  card:       document.getElementById('btn-gpt'),
  modal:      document.getElementById('modal-gpt'),
  closeBtn:   document.getElementById('modal-gpt-close'),
  clearBtn:   document.getElementById('gpt-clear-btn'),
  chatWrap:   document.getElementById('gpt-chat-wrap'),
  inputEl:    document.getElementById('gpt-input'),
  sendBtn:    document.getElementById('gpt-send-btn'),
  modelLabel: document.getElementById('gpt-model-label'),
  isLoading:  false,

  /* ---- Modal ---- */
  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.inputEl.focus();
    this.scrollBottom();
  },

  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  /* ---- Escape HTML ---- */
  esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  /* ---- Scroll ke bawah ---- */
  scrollBottom() {
    requestAnimationFrame(() => {
      this.chatWrap.scrollTop = this.chatWrap.scrollHeight;
    });
  },

  /* ---- Tambah pesan user ---- */
  addUserMsg(text) {
    const div = document.createElement('div');
    div.className = 'gpt-msg gpt-msg-user';
    div.innerHTML = `
      <div class="gpt-msg-bubble gpt-bubble-user">${this.esc(text).replace(/\n/g,'<br>')}</div>
      <div class="gpt-msg-avatar gpt-user-avatar">👤</div>
    `;
    this.chatWrap.appendChild(div);
    this.scrollBottom();
  },

  /* ---- Tambah bubble loading (titik bergerak) ---- */
  addTyping() {
    const div = document.createElement('div');
    div.className = 'gpt-msg gpt-msg-ai';
    div.id = 'gpt-typing';
    div.innerHTML = `
      <div class="gpt-msg-avatar">🤖</div>
      <div class="gpt-msg-bubble gpt-typing-bubble">
        <span class="gpt-dot"></span><span class="gpt-dot"></span><span class="gpt-dot"></span>
      </div>
    `;
    this.chatWrap.appendChild(div);
    this.scrollBottom();
  },

  /* ---- Hapus bubble loading ---- */
  removeTyping() {
    document.getElementById('gpt-typing')?.remove();
  },

  /* ---- Tambah pesan AI ---- */
  addAiMsg(text, model) {
    if (model) this.modelLabel.textContent = model;
    const div = document.createElement('div');
    div.className = 'gpt-msg gpt-msg-ai gpt-msg-in';
    div.innerHTML = `
      <div class="gpt-msg-avatar">🤖</div>
      <div class="gpt-msg-bubble">${this.esc(text).replace(/\n/g,'<br>')}</div>
    `;
    this.chatWrap.appendChild(div);
    this.scrollBottom();
  },

  /* ---- Tambah pesan error ---- */
  addErrorMsg(text) {
    const div = document.createElement('div');
    div.className = 'gpt-msg gpt-msg-ai';
    div.innerHTML = `
      <div class="gpt-msg-avatar">⚠️</div>
      <div class="gpt-msg-bubble gpt-bubble-error">${this.esc(text)}</div>
    `;
    this.chatWrap.appendChild(div);
    this.scrollBottom();
  },

  /* ---- Reset ke kondisi awal ---- */
  clearChat() {
    this.chatWrap.innerHTML = `
      <div class="gpt-msg gpt-msg-ai">
        <div class="gpt-msg-avatar">🤖</div>
        <div class="gpt-msg-bubble">Halo! Saya ChatGPT. Ada yang bisa saya bantu? 😊</div>
      </div>
    `;
  },

  /* ---- System prompt — identitas Boysz ---- */
  SYSTEM: `Kamu adalah asisten AI bernama Boysz. Website ini dirancang oleh Boysz untuk open member guild Sapurata dan menghibur para member. Jika ada yang bertanya siapa kamu, perkenalkan diri sebagai Boysz dan jelaskan tujuan website ini.

Detail Guild Sapurata:
- Nama Guild: Sapurata
- Kapten: Nara
- Officer: Boysz, Bibil, Viren
- Member: Ham, San, Keken, Luli, Kori, Alni, Freezo, Xeo, Syafa, Alicya, Ijaa, Fann, Qirana, Luthfie, Sahrull, Pann (dan masih banyak lagi)

Jika ditanya tentang detail guild, kapten, officer, atau member — jawab sesuai data di atas. Jawab selalu dalam bahasa yang sama dengan pertanyaan pengguna (Indonesia atau Inggris).`,

  /* ---- Fetch API dengan fallback proxy ---- */
  async fetchGPT(text) {
    // Gabungkan system prompt + pesan user
    const fullText = `${this.SYSTEM}\n\nUser: ${text}`;
    const base = `https://api-nanzz.my.id/docs/api/ai/chat-gpt.php?text=${encodeURIComponent(fullText)}&model=chatgpt`;
    const proxies = [
      base,
      `https://corsproxy.io/?url=${encodeURIComponent(base)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(base)}`,
    ];

    for (const url of proxies) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 20000);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let json = await res.json();
        if (url.includes('allorigins') && json.contents) json = JSON.parse(json.contents);
        if (json.status && json.result?.text) return json.result;
      } catch(e) {
        console.warn('[GPT]', e.message);
      }
    }
    throw new Error('Semua jalur gagal');
  },

  /* ---- Kirim pesan ---- */
  async send() {
    if (this.isLoading) return;
    const text = this.inputEl.value.trim();
    if (!text) return;

    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';
    this.isLoading = true;
    this.sendBtn.disabled = true;

    this.addUserMsg(text);
    this.addTyping();

    try {
      const result = await this.fetchGPT(text);
      this.removeTyping();
      this.addAiMsg(result.text, result.model);
    } catch(e) {
      this.removeTyping();
      this.addErrorMsg('Gagal mendapatkan respons. Periksa koneksi dan coba lagi.');
      console.error('[GPT]', e);
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.inputEl.focus();
    }
  },

  /* ---- Init ---- */
  init() {
    // Buka modal
    this.card.addEventListener('click', () => this.openModal());
    this.card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.openModal(); }
    });

    // Tutup modal
    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', e => { if (e.target === this.modal) this.closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) this.closeModal();
    });

    // Hapus chat
    this.clearBtn.addEventListener('click', () => this.clearChat());

    // Kirim dengan tombol
    this.sendBtn.addEventListener('click', () => this.send());

    // Kirim dengan Enter (Shift+Enter = newline)
    this.inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    });

    // Auto-resize textarea
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 140) + 'px';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => GPT.init());
