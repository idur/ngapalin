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
        this.isFinishing = false; // Flag to prevent multiple execution
        this.ayahToggleVisible = false;
        this.isToggling = false;
        
        this.init();
    }

    removeEventListeners() {
        // Clone and replace elements to remove all event listeners
        const prevBtn = document.getElementById('prevAyahBtn');
        const nextBtn = document.getElementById('nextAyahBtn');
        
        if (prevBtn) {
            const newPrevBtn = prevBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        }
        
        if (nextBtn) {
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        }
    }

    init() {
        console.log('App: Initializing application...');
        this.setupEventListeners();
        this.loadSurahOptions();
        this.updateProgressDisplay();
        console.log('App: About to restore state...');
        this.restoreState(); // Restore state sebelum menampilkan tab
        this.showTab('hafalan');
        console.log('App: Initialization complete');
    }

    setupEventListeners() {
        // Remove existing event listeners first to prevent duplicates
        this.removeEventListeners();
        
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

        // Navigation buttons with event prevention
        const prevBtn = document.getElementById('prevAyahBtn');
        const nextBtn = document.getElementById('nextAyahBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.previousAyah();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.nextAyah();
            });
        }
        // hafalBtn removed - direct to restart options after tikrar completion
        document.getElementById('toggleAyahBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleAyahVisibility();
        });
        
        // Restart options
        document.getElementById('restartFromBeginning')?.addEventListener('click', () => this.restartFromBeginning());
        document.getElementById('restartFromSecondPhase')?.addEventListener('click', () => this.restartFromSecondPhase());
        document.getElementById('confirmHafalBtn')?.addEventListener('click', () => this.confirmHafal());

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

        // Check if this is the same ayah as current hafalan
        const isSameAyah = this.currentHafalan && 
            this.currentHafalan.surahNumber === surahNumber && 
            this.currentHafalan.ayahNumber === ayahNumber;

        this.currentHafalan = {
            surahNumber,
            ayahNumber,
            surahData,
            ayahData
        };

        // Only reset tikrar state if it's a different ayah
        if (!isSameAyah) {
            this.tikrarState = {
                current: 1, // Mulai dari 1, bukan 0
                total: 20,
                mode: 'melihat'
            };
            this.ayahToggleVisible = false;
            
            // Hide restart options
            document.getElementById('restart-options').style.display = 'none';
        }

        this.showHafalanContainer();
        this.updateHafalanDisplay();
        this.saveCurrentState(); // Simpan state setelah memulai hafalan
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
        const toggleContainer = document.getElementById('ayah-toggle-container');
        if (this.tikrarState.mode === 'tanpa_melihat') {
            if (!this.ayahToggleVisible) {
                arabicElement.classList.add('ayah-hidden');
                translationElement.classList.add('ayah-hidden');
            } else {
                arabicElement.classList.remove('ayah-hidden');
                translationElement.classList.remove('ayah-hidden');
            }
            toggleContainer.style.display = 'block';
            this.updateToggleButton();
        } else {
            arabicElement.classList.remove('ayah-hidden');
            translationElement.classList.remove('ayah-hidden');
            toggleContainer.style.display = 'none';
        }
        

        
        const isLastTikrar = this.tikrarState.current === this.tikrarState.total && this.tikrarState.mode === 'tanpa_melihat';
        
        // Show restart options when tikrar is completed
        const restartOptions = document.getElementById('restart-options');
        
        if (isLastTikrar) {
            restartOptions.style.display = 'block';
        } else {
            restartOptions.style.display = 'none';
        }

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
        this.saveCurrentState(); // Simpan state setelah update tikrar
    }

    nextTikrar() {
        if (this.tikrarState.current < this.tikrarState.total) {
            this.tikrarState.current++;
        } else if (this.tikrarState.mode === 'melihat') {
            // Pindah ke mode tanpa melihat setelah 20x
            this.tikrarState.mode = 'tanpa_melihat';
            this.tikrarState.current = 1;
            this.tikrarState.total = 10;
        }
        // Tidak perlu increment lagi setelah 10x tanpa melihat
        // isLastTikrar akan mendeteksi kondisi current === total && mode === 'tanpa_melihat'
        
        this.updateHafalanDisplay();
        this.saveCurrentState(); // Simpan state setelah update tikrar
    }

    previousAyah() {
        if (!this.currentHafalan) return;
        
        // Cek apakah tikrar belum selesai sepenuhnya
        // Tikrar dianggap selesai jika: current === total DAN mode === 'tanpa_melihat'
        const isCompleted = this.tikrarState && 
            (this.tikrarState.current === this.tikrarState.total && this.tikrarState.mode === 'tanpa_melihat');
        const isInProgress = this.tikrarState && !isCompleted;
        
        if (isInProgress) {
            const confirmed = confirm(
                `Anda sedang dalam proses tikrar (${this.tikrarState.current}/${this.tikrarState.total} - ${this.tikrarState.mode === 'melihat' ? 'Membaca dengan melihat' : 'Tanpa melihat'}).\n\nJika pindah ayat, progress tikrar akan hilang. Yakin ingin melanjutkan?`
            );
            if (!confirmed) return;
        }
        
        const { surahNumber, ayahNumber } = this.currentHafalan;
        if (ayahNumber > 1) {
            this.startHafalan(surahNumber, ayahNumber - 1);
        }
    }

    nextAyah() {
        if (!this.currentHafalan) return;
        
        // Cek apakah tikrar belum selesai sepenuhnya
        // Tikrar dianggap selesai jika: current === total DAN mode === 'tanpa_melihat'
        const isCompleted = this.tikrarState && 
            (this.tikrarState.current === this.tikrarState.total && this.tikrarState.mode === 'tanpa_melihat');
        const isInProgress = this.tikrarState && !isCompleted;
        
        if (isInProgress) {
            const confirmed = confirm(
                `Anda sedang dalam proses tikrar (${this.tikrarState.current}/${this.tikrarState.total} - ${this.tikrarState.mode === 'melihat' ? 'Membaca dengan melihat' : 'Tanpa melihat'}).\n\nJika pindah ayat, progress tikrar akan hilang. Yakin ingin melanjutkan?`
            );
            if (!confirmed) return;
        }
        
        const { surahNumber, ayahNumber, surahData } = this.currentHafalan;
        const ayahList = getAyahList(surahNumber);
        if (ayahNumber < ayahList.length) {
            this.startHafalan(surahNumber, ayahNumber + 1);
        }
    }

    // finishAyah method removed - restart options now show directly after tikrar completion
    
    confirmHafal() {
        // Prevent multiple execution
        if (this.isFinishing) {
            return;
        }
        this.isFinishing = true;
        
        if (!this.currentHafalan) {
            this.isFinishing = false;
            return;
        }
        
        const { surahNumber, ayahNumber } = this.currentHafalan;
        
        // Hapus state tersimpan karena ayat sudah selesai
        hafalanStorage.clearCurrentProgress();
        
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
        
        // Reset flag after a short delay
        setTimeout(() => {
            this.isFinishing = false;
        }, 1000);
    }

    resetHafalanForm() {
        document.getElementById('surah-select').value = '';
        document.getElementById('ayah-select').value = '';
        document.querySelector('.ayah-selector').style.display = 'none';
        this.hideHafalanContainer();
        this.currentHafalan = null;
        hafalanStorage.clearCurrentProgress(); // Hapus state tersimpan
    }

    // Simpan state hafalan saat ini ke localStorage
    saveCurrentState() {
        if (this.currentHafalan && this.tikrarState) {
            console.log('Saving state:', {
                surah: this.currentHafalan.surahNumber,
                ayah: this.currentHafalan.ayahNumber,
                tikrar: this.tikrarState.current,
                mode: this.tikrarState.mode
            });
            hafalanStorage.setCurrentProgress(
                this.currentHafalan.surahNumber,
                this.currentHafalan.ayahNumber,
                this.tikrarState.current,
                this.tikrarState.mode
            );
        }
    }

    // Restore state hafalan dari localStorage
    restoreState() {
        const savedProgress = hafalanStorage.getCurrentProgress();
        console.log('Restoring state:', savedProgress);
        
        if (savedProgress) {
            const { surahNumber, ayahNumber, tikrarCount, mode } = savedProgress;
            
            // Set dropdown values
            const surahSelect = document.getElementById('surah-select');
            const ayahSelect = document.getElementById('ayah-select');
            
            surahSelect.value = surahNumber;
            this.onSurahSelect(surahNumber);
            
            // Wait for ayah options to load, then set ayah value
            setTimeout(() => {
                ayahSelect.value = ayahNumber;
                
                // Start hafalan with saved state
                const surahData = getSurahData(surahNumber);
                const ayahData = getAyahData(surahNumber, ayahNumber);
                
                if (surahData && ayahData) {
                    this.currentHafalan = {
                        surahNumber: parseInt(surahNumber),
                        ayahNumber: parseInt(ayahNumber),
                        surahData,
                        ayahData
                    };
                    
                    // Restore tikrar state
                    if (mode === 'tanpa_melihat') {
                        this.tikrarState = {
                            current: parseInt(tikrarCount),
                            total: 10,
                            mode: 'tanpa_melihat'
                        };
                    } else {
                        this.tikrarState = {
                            current: parseInt(tikrarCount),
                            total: 20,
                            mode: 'melihat'
                        };
                    }
                    
                    // Show hafalan container and update display
                    this.showHafalanContainer();
                    this.updateHafalanDisplay();
                    
                    // Show restart options if completed
                    if (mode === 'tanpa_melihat' && tikrarCount >= 10) {
                        document.getElementById('restart-options').style.display = 'block';
                    }
                    
                    console.log('State restored successfully');
                } else {
                    console.error('Failed to get surah/ayah data for restoration');
                }
            }, 200); // Increase timeout to 200ms
        } else {
            console.log('No saved progress found');
        }
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

    toggleAyahVisibility() {
        // Prevent multiple rapid calls
        if (this.isToggling) {
            return;
        }
        
        this.isToggling = true;
        this.ayahToggleVisible = !this.ayahToggleVisible;
        this.updateHafalanDisplay();
        
        // Reset flag after a short delay
        setTimeout(() => {
            this.isToggling = false;
        }, 100);
    }

    updateToggleButton() {
        const toggleBtn = document.getElementById('toggleAyahBtn');
        if (this.ayahToggleVisible) {
            toggleBtn.textContent = '🙈 Sembunyikan Ayat';
            toggleBtn.classList.remove('btn-outline');
            toggleBtn.classList.add('btn-secondary');
        } else {
            toggleBtn.textContent = '👁️ Lihat Ayat';
            toggleBtn.classList.remove('btn-secondary');
            toggleBtn.classList.add('btn-outline');
        }
    }

    restartFromBeginning() {
        // Reset tikrar state to beginning (20x dengan melihat)
        this.tikrarState = {
            current: 1,
            total: 20,
            mode: 'melihat'
        };
        this.ayahToggleVisible = false;
        
        // Update display
        this.updateHafalanDisplay();
        
        // Save current state
        this.saveCurrentState();
    }

    restartFromSecondPhase() {
        // Reset tikrar state to second phase (10x tanpa melihat)
        this.tikrarState = {
            current: 1,
            total: 10,
            mode: 'tanpa_melihat'
        };
        this.ayahToggleVisible = false;
        
        // Update display
        this.updateHafalanDisplay();
        
        // Save current state
        this.saveCurrentState();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new NgapalinApp();
    app.init(); // PENTING: Panggil init() untuk menjalankan restoreState
    window.ngapalinApp = app;
    
    // Debug helper - tambahkan ke window untuk testing manual
    window.debugStorage = {
        checkLocalStorage: () => {
            console.log('=== DEBUG LOCALSTORAGE ===');
            const data = localStorage.getItem('ngapalin-hafalan');
            console.log('Raw localStorage data:', data);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    console.log('Parsed data:', parsed);
                    console.log('Current progress:', parsed.currentProgress);
                } catch (e) {
                    console.error('Error parsing localStorage:', e);
                }
            } else {
                console.log('No data found in localStorage');
            }
            console.log('========================');
        },
        clearStorage: () => {
            localStorage.removeItem('ngapalin-hafalan');
            console.log('Storage cleared');
        }
    };
    
    console.log('Debug helper available: window.debugStorage.checkLocalStorage() and window.debugStorage.clearStorage()');
});