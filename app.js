// Aplikasi Hafalan Qur'an - Main JavaScript
class NgapalinApp {
    constructor() {
        this.currentTab = 'hafalan';
        this.currentHafalan = null;
        this.currentMurajaah = null;
        this.tikrarState = {
            current: 1,
            total: 20,
            mode: 'melihat' // 'melihat' atau 'tanpa_melihat'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSurahOptions();
        this.updateProgressDisplay();
        this.showTab('hafalan');
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.showTab(tabName);
            });
        });

        // Surah selection
        document.getElementById('surah-select').addEventListener('change', (e) => {
            this.onSurahSelect(e.target.value);
        });

        // Ayah selection
        document.getElementById('ayah-select').addEventListener('change', (e) => {
            this.onAyahSelect(e.target.value);
        });

        // Setup event listeners
        document.getElementById('tikrarBtn')?.addEventListener('click', () => this.nextTikrar());
        document.getElementById('prevAyahBtn')?.addEventListener('click', () => this.previousAyah());
        document.getElementById('nextAyahBtn')?.addEventListener('click', () => this.nextAyah());
        document.getElementById('hafalBtn')?.addEventListener('click', () => this.finishCurrentAyah());

        // Murajaah controls
        document.getElementById('daily-murajaah').addEventListener('click', () => {
            this.startDailyMurajaah();
        });

        document.getElementById('weekly-murajaah').addEventListener('click', () => {
            this.startWeeklyMurajaah();
        });

        document.getElementById('prev-murajaah').addEventListener('click', () => {
            this.prevMurajaah();
        });

        document.getElementById('next-murajaah').addEventListener('click', () => {
            this.nextMurajaah();
        });

        document.getElementById('finish-murajaah').addEventListener('click', () => {
            this.finishMurajaah();
        });
    }

    showTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific data
        if (tabName === 'progress') {
            this.updateProgressDisplay();
        } else if (tabName === 'panduan') {
            // Panduan tab doesn't need special initialization
            // Content is static and already loaded
        }
    }

    loadSurahOptions() {
        const surahSelect = document.getElementById('surah-select');
        const surahList = getSurahList();
        
        surahSelect.innerHTML = '<option value="">-- Pilih Surat --</option>';
        
        surahList.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.number}. ${surah.name} (${surah.nameArabic})`;
            surahSelect.appendChild(option);
        });
    }

    onSurahSelect(surahNumber) {
        const ayahSelector = document.querySelector('.ayah-selector');
        const ayahSelect = document.getElementById('ayah-select');
        
        if (!surahNumber) {
            ayahSelector.style.display = 'none';
            this.hideHafalanContainer();
            return;
        }

        // Load ayah options
        const ayahList = getAyahList(parseInt(surahNumber));
        ayahSelect.innerHTML = '<option value="">-- Pilih Ayat --</option>';
        
        ayahList.forEach(ayah => {
            const option = document.createElement('option');
            option.value = ayah.number;
            const isMemorized = hafalanStorage.isAyahMemorized(surahNumber, ayah.number);
            option.textContent = `Ayat ${ayah.number}${isMemorized ? ' ✓' : ''}`;
            if (isMemorized) {
                option.style.color = '#28a745';
                option.style.fontWeight = 'bold';
            }
            ayahSelect.appendChild(option);
        });

        ayahSelector.style.display = 'block';
        this.hideHafalanContainer();
    }

    onAyahSelect(ayahNumber) {
        const surahNumber = document.getElementById('surah-select').value;
        
        if (!surahNumber || !ayahNumber) {
            this.hideHafalanContainer();
            return;
        }

        this.startHafalan(parseInt(surahNumber), parseInt(ayahNumber));
    }

    startHafalan(surahNumber, ayahNumber) {
        const surahData = getSurahData(surahNumber);
        const ayahData = getAyahData(surahNumber, ayahNumber);
        
        if (!surahData || !ayahData) {
            alert('Data ayat tidak ditemukan!');
            return;
        }

        this.currentHafalan = {
            surahNumber,
            ayahNumber,
            surahData,
            ayahData
        };

        // Reset tikrar state
        this.tikrarState = {
            current: 0,
            total: 20,
            mode: 'melihat'
        };
        
        // Hide hafal button
        document.getElementById('hafalBtn').style.display = 'none';

        this.showHafalanContainer();
        this.updateHafalanDisplay();
    }

    showHafalanContainer() {
        document.querySelector('.hafalan-container').style.display = 'block';
    }

    hideHafalanContainer() {
        document.querySelector('.hafalan-container').style.display = 'none';
    }

    updateHafalanDisplay() {
        if (!this.currentHafalan) return;

        const { surahData, ayahData, surahNumber, ayahNumber } = this.currentHafalan;
        
        // Update header
        document.getElementById('current-surah-ayah').textContent = 
            `${surahData.name} (${surahData.nameArabic}) - Ayat ${ayahNumber}`;
        
        // Update tikrar counter display
        const tikrarCountEl = document.getElementById('tikrarCount');
        const tikrarTargetEl = document.getElementById('tikrarTarget');
        const counterTypeEl = document.getElementById('counterType');
        
        if (tikrarCountEl && tikrarTargetEl && counterTypeEl) {
            tikrarCountEl.textContent = this.tikrarState.current;
            tikrarTargetEl.textContent = this.tikrarState.total;
            counterTypeEl.textContent = this.tikrarState.mode === 'melihat' ? 'Membaca dengan melihat' : 'Membaca tanpa melihat';
        }
        
        // Update ayah display
        const arabicElement = document.getElementById('ayah-arabic');
        const translationElement = document.getElementById('ayah-translation');
        
        arabicElement.textContent = ayahData.arabic;
        translationElement.textContent = ayahData.translation;
        
        // Hide/show ayah based on mode
        if (this.tikrarState.mode === 'tanpa_melihat') {
            arabicElement.classList.add('ayah-hidden');
            translationElement.classList.add('ayah-hidden');
        } else {
            arabicElement.classList.remove('ayah-hidden');
            translationElement.classList.remove('ayah-hidden');
        }
        
        // Update button states
        document.getElementById('prev-tikrar').disabled = this.tikrarState.current === 1 && this.tikrarState.mode === 'melihat';
        
        const isLastTikrar = this.tikrarState.current === this.tikrarState.total && this.tikrarState.mode === 'tanpa_melihat';
        document.getElementById('next-tikrar').style.display = isLastTikrar ? 'none' : 'inline-block';
        document.getElementById('finish-ayah').style.display = isLastTikrar ? 'inline-block' : 'none';
    }

    prevTikrar() {
        if (this.tikrarState.mode === 'tanpa_melihat' && this.tikrarState.current === 1) {
            // Kembali ke mode melihat, tikrar terakhir
            this.tikrarState.mode = 'melihat';
            this.tikrarState.current = 20;
            this.tikrarState.total = 20;
        } else if (this.tikrarState.current > 1) {
            this.tikrarState.current--;
        }
        
        this.updateHafalanDisplay();
    }

    nextTikrar() {
        if (this.tikrarState.current < this.tikrarState.total) {
            this.tikrarState.current++;
        } else if (this.tikrarState.mode === 'melihat') {
            // Pindah ke mode tanpa melihat setelah 20x
            this.tikrarState.mode = 'tanpa_melihat';
            this.tikrarState.current = 1;
            this.tikrarState.total = 10;
        } else {
            // Selesai 10x tanpa melihat - tampilkan tombol hafal
            document.getElementById('hafalBtn').style.display = 'block';
            return;
        }
        
        this.updateHafalanDisplay();
    }

    previousAyah() {
        if (!this.currentHafalan) return;
        
        const { surahNumber, ayahNumber } = this.currentHafalan;
        if (ayahNumber > 1) {
            this.startHafalan(surahNumber, ayahNumber - 1);
        }
    }

    nextAyah() {
        if (!this.currentHafalan) return;
        
        const { surahNumber, ayahNumber, surahData } = this.currentHafalan;
        const ayahList = getAyahList(surahNumber);
        if (ayahNumber < ayahList.length) {
            this.startHafalan(surahNumber, ayahNumber + 1);
        }
    }

    finishCurrentAyah() {
        this.finishAyah();
    }

    finishAyah() {
        if (!this.currentHafalan) return;
        
        const { surahNumber, ayahNumber } = this.currentHafalan;
        
        // Simpan ayat yang sudah dihafal
        hafalanStorage.addMemorizedAyah(surahNumber, ayahNumber);
        
        // Show success message
        alert(`Alhamdulillah! Ayat ${ayahNumber} dari surat ${this.currentHafalan.surahData.name} telah selesai dihafal dengan metode At-Tikrar.`);
        
        // Pindah ke ayat berikutnya atau reset hanya container hafalan
        const surahData = getSurahData(surahNumber);
        if (ayahNumber < surahData.totalAyahs) {
            // Pindah ke ayat berikutnya dalam surat yang sama
            this.startHafalan(surahNumber, ayahNumber + 1);
        } else {
            // Jika sudah ayat terakhir, sembunyikan container tapi tetap pilihan surat
            this.hideHafalanContainer();
            this.currentHafalan = null;
        }
        
        // Update progress display
        this.updateProgressDisplay();
    }

    resetHafalanForm() {
        document.getElementById('surah-select').value = '';
        document.getElementById('ayah-select').value = '';
        document.querySelector('.ayah-selector').style.display = 'none';
        this.hideHafalanContainer();
        this.currentHafalan = null;
    }

    startDailyMurajaah() {
        const dailyAyahs = hafalanStorage.getDailyReviewAyahs();
        
        if (dailyAyahs.length === 0) {
            alert('Tidak ada ayat untuk murajaah harian. Silakan hafal ayat baru terlebih dahulu.');
            return;
        }
        
        this.currentMurajaah = {
            type: 'daily',
            ayahs: dailyAyahs,
            currentIndex: 0
        };
        
        this.startMurajaahSession();
    }

    startWeeklyMurajaah() {
        const weeklyAyahs = hafalanStorage.getWeeklyReviewAyahs();
        
        if (weeklyAyahs.length === 0) {
            alert('Tidak ada ayat untuk murajaah mingguan.');
            return;
        }
        
        this.currentMurajaah = {
            type: 'weekly',
            ayahs: weeklyAyahs,
            currentIndex: 0
        };
        
        this.startMurajaahSession();
    }

    startMurajaahSession() {
        if (!this.currentMurajaah) return;
        
        // Reset tikrar state untuk murajaah
        this.tikrarState = {
            current: 1,
            total: 20,
            mode: 'melihat'
        };
        
        document.querySelector('.murajaah-container').style.display = 'block';
        document.querySelector('.murajaah-options').style.display = 'none';
        
        this.updateMurajaahDisplay();
    }

    updateMurajaahDisplay() {
        if (!this.currentMurajaah) return;
        
        const currentAyah = this.currentMurajaah.ayahs[this.currentMurajaah.currentIndex];
        const surahData = getSurahData(currentAyah.surahNumber);
        const ayahData = getAyahData(currentAyah.surahNumber, currentAyah.ayahNumber);
        
        // Update header
        const typeText = this.currentMurajaah.type === 'daily' ? 'Murajaah Harian' : 'Murajaah Mingguan';
        document.getElementById('murajaah-title').textContent = 
            `${typeText} - ${surahData.name} Ayat ${currentAyah.ayahNumber} (${this.currentMurajaah.currentIndex + 1}/${this.currentMurajaah.ayahs.length})`;
        
        // Update tikrar counter
        const modeText = this.tikrarState.mode === 'melihat' ? 'Membaca dengan Melihat' : 'Membaca Tanpa Melihat';
        document.getElementById('murajaah-mode').textContent = modeText;
        document.getElementById('murajaah-count').textContent = `${this.tikrarState.current}/${this.tikrarState.total}`;
        
        // Update ayah display
        const arabicElement = document.getElementById('murajaah-arabic');
        const translationElement = document.getElementById('murajaah-translation');
        
        arabicElement.textContent = ayahData.arabic;
        translationElement.textContent = ayahData.translation;
        
        // Hide/show ayah based on mode
        if (this.tikrarState.mode === 'tanpa_melihat') {
            arabicElement.classList.add('ayah-hidden');
            translationElement.classList.add('ayah-hidden');
        } else {
            arabicElement.classList.remove('ayah-hidden');
            translationElement.classList.remove('ayah-hidden');
        }
        
        // Update button states
        const isFirstTikrar = this.tikrarState.current === 1 && this.tikrarState.mode === 'melihat' && this.currentMurajaah.currentIndex === 0;
        document.getElementById('prev-murajaah').disabled = isFirstTikrar;
        
        const isLastTikrar = this.tikrarState.current === this.tikrarState.total && 
                            this.tikrarState.mode === 'tanpa_melihat' && 
                            this.currentMurajaah.currentIndex === this.currentMurajaah.ayahs.length - 1;
        
        document.getElementById('next-murajaah').style.display = isLastTikrar ? 'none' : 'inline-block';
        document.getElementById('finish-murajaah').style.display = isLastTikrar ? 'inline-block' : 'none';
    }

    prevMurajaah() {
        if (this.tikrarState.mode === 'tanpa_melihat' && this.tikrarState.current === 1) {
            // Kembali ke mode melihat, tikrar terakhir
            this.tikrarState.mode = 'melihat';
            this.tikrarState.current = 20;
            this.tikrarState.total = 20;
        } else if (this.tikrarState.current > 1) {
            this.tikrarState.current--;
        } else if (this.currentMurajaah.currentIndex > 0) {
            // Pindah ke ayat sebelumnya
            this.currentMurajaah.currentIndex--;
            this.tikrarState = {
                current: 10,
                total: 10,
                mode: 'tanpa_melihat'
            };
        }
        
        this.updateMurajaahDisplay();
    }

    nextMurajaah() {
        if (this.tikrarState.mode === 'melihat' && this.tikrarState.current === 20) {
            // Pindah ke mode tanpa melihat
            this.tikrarState.mode = 'tanpa_melihat';
            this.tikrarState.current = 1;
            this.tikrarState.total = 10;
        } else if (this.tikrarState.current < this.tikrarState.total) {
            this.tikrarState.current++;
        } else if (this.currentMurajaah.currentIndex < this.currentMurajaah.ayahs.length - 1) {
            // Pindah ke ayat berikutnya
            this.currentMurajaah.currentIndex++;
            this.tikrarState = {
                current: 1,
                total: 20,
                mode: 'melihat'
            };
        }
        
        this.updateMurajaahDisplay();
    }

    finishMurajaah() {
        if (!this.currentMurajaah) return;
        
        // Update tikrar count untuk semua ayat yang dimurajaah
        hafalanStorage.updateMurajaahTikrar(this.currentMurajaah.ayahs, 30);
        
        const typeText = this.currentMurajaah.type === 'daily' ? 'harian' : 'mingguan';
        alert(`Alhamdulillah! Murajaah ${typeText} telah selesai. Total ${this.currentMurajaah.ayahs.length} ayat telah dimurajaah.`);
        
        // Reset murajaah
        this.resetMurajaah();
        
        // Update progress display
        this.updateProgressDisplay();
    }

    resetMurajaah() {
        document.querySelector('.murajaah-container').style.display = 'none';
        document.querySelector('.murajaah-options').style.display = 'flex';
        this.currentMurajaah = null;
    }

    updateProgressDisplay() {
        const stats = hafalanStorage.getStatistics();
        const memorizedAyahs = hafalanStorage.getMemorizedAyahs();
        
        // Update statistics
        document.getElementById('total-memorized').textContent = stats.totalMemorized;
        document.getElementById('current-streak').textContent = stats.dailyStreak;
        document.getElementById('total-tikrar').textContent = stats.totalTikrar;
        
        // Update memorized list
        const memorizedList = document.getElementById('memorized-list');
        
        if (memorizedAyahs.length === 0) {
            memorizedList.innerHTML = '<div class="empty-state"><h4>Belum ada ayat yang dihafal</h4><p>Mulai hafalan pertama Anda di tab Hafalan</p></div>';
        } else {
            memorizedList.innerHTML = '';
            
            memorizedAyahs.forEach(ayah => {
                const surahData = getSurahData(ayah.surahNumber);
                const memorizedDate = new Date(ayah.dateMemorized).toLocaleDateString('id-ID');
                
                const item = document.createElement('div');
                item.className = 'memorized-item';
                item.innerHTML = `
                    <div>
                        <strong>${surahData.name} - Ayat ${ayah.ayahNumber}</strong>
                        <div class="memorized-date">Dihafal: ${memorizedDate}</div>
                    </div>
                    <div class="memorized-date">${ayah.tikrarCount} tikrar</div>
                `;
                
                memorizedList.appendChild(item);
            });
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ngapalinApp = new NgapalinApp();
});