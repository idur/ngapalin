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
        this.murajaahAyahToggleVisible = false;
        this.murajaahTranslationVisible = false;
        
        this.init();
    }

    removeEventListeners() {
        // Clone and replace elements to remove all event listeners
        const elementsToClean = [
            'prevAyahBtn',
            'nextAyahBtn', 
            'tikrarBtn',
            'murajaah-tikrar-btn',
            'toggleAyahBtn',
            'toggleMurajaahAyahBtn',
            'toggleMurajaahTranslationBtn',
            'confirm-hafal',
            'restart-beginning',
            'restart-second-phase',
            'next-murajaah',
            'finish-murajaah'
        ];
        
        elementsToClean.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element && element.parentNode) {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
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
        const surahSelect = document.getElementById('surah-select');
        if (surahSelect) {
            surahSelect.addEventListener('change', (e) => {
                this.onSurahSelect(e.target.value);
            });
        }

        // Ayah selection
        const ayahSelect = document.getElementById('ayah-select');
        if (ayahSelect) {
            ayahSelect.addEventListener('change', (e) => {
                this.onAyahSelect(e.target.value);
            });
        }

        // Setup event listeners
        const tikrarBtn = document.getElementById('tikrarBtn');
        if (tikrarBtn) {
            tikrarBtn.addEventListener('click', () => this.nextTikrar());
        }

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
        
        // Toggle ayah visibility
        const toggleAyahBtn = document.getElementById('toggleAyahBtn');
        if (toggleAyahBtn) {
            toggleAyahBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleAyahVisibility();
            });
        }
        
        // Restart options
        const restartFromBeginningBtn = document.getElementById('restartFromBeginning');
        if (restartFromBeginningBtn) {
            restartFromBeginningBtn.addEventListener('click', () => this.restartFromBeginning());
        }
        
        const restartFromSecondPhaseBtn = document.getElementById('restartFromSecondPhase');
        if (restartFromSecondPhaseBtn) {
            restartFromSecondPhaseBtn.addEventListener('click', () => this.restartFromSecondPhase());
        }
        
        const confirmHafalBtn = document.getElementById('confirmHafalBtn');
        if (confirmHafalBtn) {
            confirmHafalBtn.addEventListener('click', () => this.confirmHafal());
        }
        
        // Murajaah restart options
        const murajaahRestartFromBeginningBtn = document.getElementById('murajaahRestartFromBeginning');
        if (murajaahRestartFromBeginningBtn) {
            murajaahRestartFromBeginningBtn.addEventListener('click', () => this.murajaahRestartFromBeginning());
        }
        
        const murajaahRestartFromSecondPhaseBtn = document.getElementById('murajaahRestartFromSecondPhase');
        if (murajaahRestartFromSecondPhaseBtn) {
            murajaahRestartFromSecondPhaseBtn.addEventListener('click', () => this.murajaahRestartFromSecondPhase());
        }
        
        const confirmMurajaahBtn = document.getElementById('confirmMurajaahBtn');
        if (confirmMurajaahBtn) {
            confirmMurajaahBtn.addEventListener('click', () => this.confirmMurajaah());
        }

        // Murajaah controls
        const dailyMurajaahBtn = document.getElementById('daily-murajaah');
        if (dailyMurajaahBtn) {
            dailyMurajaahBtn.addEventListener('click', () => {
                this.startDailyMurajaah();
            });
        }

        const weeklyMurajaahBtn = document.getElementById('weekly-murajaah');
        if (weeklyMurajaahBtn) {
            weeklyMurajaahBtn.addEventListener('click', () => {
                this.startWeeklyMurajaah();
            });
        }

        const prevMurajaahBtn = document.getElementById('prev-murajaah');
        if (prevMurajaahBtn) {
            prevMurajaahBtn.addEventListener('click', () => {
                this.prevMurajaah();
            });
        }

        const nextMurajaahBtn = document.getElementById('next-murajaah');
        if (nextMurajaahBtn) {
            nextMurajaahBtn.addEventListener('click', () => {
                this.nextMurajaah();
            });
        }

        const finishMurajaahBtn = document.getElementById('finish-murajaah');
        if (finishMurajaahBtn) {
            finishMurajaahBtn.addEventListener('click', () => {
                this.finishMurajaah();
            });
        }

        // Murajaah tikrar button
        const murajaahTikrarBtn = document.getElementById('murajaah-tikrar-btn');
        if (murajaahTikrarBtn) {
            murajaahTikrarBtn.addEventListener('click', () => {
                this.nextMurajaah();
            });
        }

        // Murajaah toggle buttons
        const toggleMurajaahAyahBtn = document.getElementById('toggleMurajaahAyahBtn');
        if (toggleMurajaahAyahBtn) {
            toggleMurajaahAyahBtn.addEventListener('click', () => {
                this.toggleMurajaahAyah();
            });
        }

        const toggleMurajaahTranslationBtn = document.getElementById('toggleMurajaahTranslationBtn');
        if (toggleMurajaahTranslationBtn) {
            toggleMurajaahTranslationBtn.addEventListener('click', () => {
                this.toggleMurajaahTranslation();
            });
        }
    }

    showTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const tabContent = document.getElementById(`${tabName}-tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }

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
        if (!surahSelect) return;
        
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
            if (ayahSelector) {
                ayahSelector.style.display = 'none';
            }
            this.hideHafalanContainer();
            return;
        }

        // Load ayah options
        if (ayahSelect) {
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
        }

        if (ayahSelector) {
            ayahSelector.style.display = 'block';
        }
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
        const container = document.querySelector('.hafalan-container');
        if (container) {
            container.style.display = 'block';
        }
    }

    hideHafalanContainer() {
        const container = document.querySelector('.hafalan-container');
        if (container) {
            container.style.display = 'none';
        }
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
        
        // Add verse number marker at the end of Arabic text
        const verseMarker = this.getVerseNumberMarker(ayahNumber);
        arabicElement.innerHTML = ayahData.arabic + ' <span class="verse-marker">' + verseMarker + '</span>';
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
            
            if (surahSelect) {
                surahSelect.value = surahNumber;
                this.onSurahSelect(surahNumber);
            }
            
            // Wait for ayah options to load, then set ayah value
            setTimeout(() => {
                if (ayahSelect) {
                    ayahSelect.value = ayahNumber;
                }
                
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
        let dailyAyahs = hafalanStorage.getDailyReviewAyahs();
        
        // Add test data if no ayahs available
        if (dailyAyahs.length === 0) {
            console.log('No daily ayahs found, adding test data');
            // Add some test ayahs for testing
            const testAyahs = [
                { surahNumber: 114, ayahNumber: 1, dateMemorized: new Date(Date.now() - 24*60*60*1000).toISOString(), tikrarCount: 0 },
                { surahNumber: 114, ayahNumber: 2, dateMemorized: new Date(Date.now() - 24*60*60*1000).toISOString(), tikrarCount: 0 }
            ];
            
            testAyahs.forEach(ayah => {
                hafalanStorage.addMemorizedAyah(ayah.surahNumber, ayah.ayahNumber);
            });
            
            dailyAyahs = hafalanStorage.getDailyReviewAyahs();
        }
        
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
        
        // Reset tikrar state untuk murajaah - semua ayat sekaligus
        this.tikrarState = {
            current: 1,
            total: 20,
            mode: 'melihat',
            phase: 1 // Phase 1: 20x melihat, Phase 2: 10x tanpa melihat
        };
        
        // Reset toggle states
        this.murajaahAyahToggleVisible = false;
        this.murajaahTranslationVisible = false;
        
        // Hide restart options and show navigation buttons
        this.hideMurajaahRestartOptions();
        
        document.querySelector('.murajaah-container').style.display = 'block';
        document.querySelector('.murajaah-options').style.display = 'none';
        
        this.updateMurajaahDisplay();
    }

    updateMurajaahDisplay() {
        if (!this.currentMurajaah) return;
        
        // Update period and ayah count info
        const periodText = this.currentMurajaah.type === 'daily' ? 
            'Ayat yang dihafal kemarin' : 'Ayat yang dihafal minggu ini (Ahad-Sabtu)';
        document.getElementById('murajaah-period').textContent = periodText;
        document.getElementById('murajaah-ayah-count').textContent = 
            `Total: ${this.currentMurajaah.ayahs.length} ayat untuk dimurajaah`;
        
        // Update tikrar counter
        const modeText = this.tikrarState.mode === 'melihat' ? 'Membaca dengan melihat' : 'Membaca tanpa melihat';
        document.getElementById('murajaah-mode').textContent = modeText;
        document.getElementById('murajaah-count').textContent = this.tikrarState.current;
        document.getElementById('murajaah-target').textContent = this.tikrarState.total;
        
        // Update ayah display - tampilkan semua ayat
        const arabicElement = document.getElementById('murajaah-arabic');
        const translationElement = document.getElementById('murajaah-translation');
        
        let arabicText = '';
        let translationText = '';
        
        this.currentMurajaah.ayahs.forEach((ayah, index) => {
            const surahData = getSurahData(ayah.surahNumber);
            const ayahData = getAyahData(ayah.surahNumber, ayah.ayahNumber);
            
            // Add verse number marker at the end of Arabic text
            const verseMarker = this.getVerseNumberMarker(ayah.ayahNumber);
            arabicText += `${ayahData.arabic} <span class="verse-marker">${verseMarker}</span>\n\n`;
            
            // Add verse number to translation (Latin format at the beginning)
            translationText += `(${ayah.ayahNumber}) ${ayahData.translation}\n\n`;
        });
        
        arabicElement.innerHTML = arabicText;
        translationElement.innerHTML = translationText;
        
        // Update surah info box
        this.updateSurahInfoBox();
        
        // Show/hide toggle buttons based on mode
        const toggleContainer = document.getElementById('murajaah-toggle-container');
        const toggleAyahBtn = document.getElementById('toggleMurajaahAyahBtn');
        const toggleTranslationBtn = document.getElementById('toggleMurajaahTranslationBtn');
        
        // Handle ayah visibility based on mode (similar to hafalan)
        if (this.tikrarState.mode === 'tanpa_melihat') {
            if (!this.murajaahAyahToggleVisible) {
                arabicElement.classList.add('ayah-hidden');
            } else {
                arabicElement.classList.remove('ayah-hidden');
            }
            toggleAyahBtn.style.display = 'inline-block';
            this.updateMurajaahToggleButton();
        } else {
            arabicElement.classList.remove('ayah-hidden');
            toggleAyahBtn.style.display = 'none';
        }
        
        // Always show translation (no toggle functionality)
        translationElement.style.display = 'block';
        translationElement.classList.remove('ayah-hidden');
        
        // Make sure toggle container is visible
        toggleContainer.style.display = 'block';
        
        // Hide translation toggle button since translation is always visible
        toggleTranslationBtn.style.display = 'none';
        
        // Update button states
        const isFirstTikrar = this.tikrarState.current === 1 && this.tikrarState.phase === 1;
        document.getElementById('prev-murajaah').disabled = isFirstTikrar;
        
        const isLastTikrar = this.tikrarState.current === this.tikrarState.total && this.tikrarState.phase === 2;
        
        document.getElementById('next-murajaah').style.display = isLastTikrar ? 'none' : 'inline-block';
        document.getElementById('finish-murajaah').style.display = isLastTikrar ? 'inline-block' : 'none';
    }
    


    prevMurajaah() {
        if (this.tikrarState.phase === 2 && this.tikrarState.current === 1) {
            // Kembali ke phase 1 (melihat), tikrar terakhir
            this.tikrarState.phase = 1;
            this.tikrarState.mode = 'melihat';
            this.tikrarState.current = 20;
            this.tikrarState.total = 20;
        } else if (this.tikrarState.current > 1) {
            this.tikrarState.current--;
        }
        
        this.updateMurajaahDisplay();
    }

    nextMurajaah() {
        if (this.tikrarState.phase === 1 && this.tikrarState.current === 20) {
            // Pindah ke phase 2 (tanpa melihat)
            this.tikrarState.phase = 2;
            this.tikrarState.mode = 'tanpa_melihat';
            this.tikrarState.current = 1;
            this.tikrarState.total = 10;
        } else if (this.tikrarState.current < this.tikrarState.total) {
            this.tikrarState.current++;
        } else if (this.tikrarState.phase === 2 && this.tikrarState.current === 10) {
            // Selesai fase kedua, tampilkan opsi restart
            this.showMurajaahRestartOptions();
            return;
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
        const murajaahContainer = document.querySelector('.murajaah-container');
        if (murajaahContainer) {
            murajaahContainer.style.display = 'none';
        }
        
        const murajaahOptions = document.querySelector('.murajaah-options');
        if (murajaahOptions) {
            murajaahOptions.style.display = 'flex';
        }
        
        this.currentMurajaah = null;
    }

    updateProgressDisplay() {
        const stats = hafalanStorage.getStatistics();
        const memorizedAyahs = hafalanStorage.getMemorizedAyahs();
        
        // Update statistics
        const totalMemorized = document.getElementById('total-memorized');
        if (totalMemorized) {
            totalMemorized.textContent = stats.totalMemorized;
        }
        
        const currentStreak = document.getElementById('current-streak');
        if (currentStreak) {
            currentStreak.textContent = stats.dailyStreak;
        }
        
        const totalTikrar = document.getElementById('total-tikrar');
        if (totalTikrar) {
            totalTikrar.textContent = stats.totalTikrar;
        }
        
        // Update memorized list
        const memorizedList = document.getElementById('memorized-list');
        if (memorizedList) {
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

    getVerseNumberMarker(ayahNumber) {
        // Convert ayah number to Arabic-Indic digits with decorative circle
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        const ayahStr = ayahNumber.toString();
        let arabicAyahNumber = '';
        
        for (let digit of ayahStr) {
            arabicAyahNumber += arabicNumbers[parseInt(digit)];
        }
        
        // Return the ayah number with decorative markers
        return `﴿${arabicAyahNumber}﴾`;
    }

    updateSurahInfoBox() {
        if (!this.currentMurajaah || !this.currentMurajaah.ayahs.length) return;
        
        const surahInfoBox = document.getElementById('surah-info-box');
        const surahInfoContent = document.getElementById('surah-info-content');
        
        // Group ayahs by surah
        const surahGroups = {};
        this.currentMurajaah.ayahs.forEach(ayah => {
            if (!surahGroups[ayah.surahNumber]) {
                surahGroups[ayah.surahNumber] = [];
            }
            surahGroups[ayah.surahNumber].push(ayah.ayahNumber);
        });
        
        // Create surah info text
        let surahInfoText = '';
        Object.keys(surahGroups).forEach((surahNumber, index) => {
            const surahData = getSurahData(parseInt(surahNumber));
            const ayahNumbers = surahGroups[surahNumber].sort((a, b) => a - b);
            
            if (index > 0) surahInfoText += ', ';
            
            if (ayahNumbers.length === 1) {
                surahInfoText += `${surahData.name} ayat ${ayahNumbers[0]}`;
            } else {
                // Check if ayahs are consecutive for range display
                const isConsecutive = ayahNumbers.every((num, i) => 
                    i === 0 || num === ayahNumbers[i - 1] + 1
                );
                
                if (isConsecutive && ayahNumbers.length > 2) {
                    surahInfoText += `${surahData.name} ayat ${ayahNumbers[0]}-${ayahNumbers[ayahNumbers.length - 1]}`;
                } else {
                    surahInfoText += `${surahData.name} ayat ${ayahNumbers.join(', ')}`;
                }
            }
        });
        
        surahInfoContent.textContent = surahInfoText;
        surahInfoBox.style.display = 'block';
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

    toggleMurajaahAyah() {
        // Prevent multiple rapid calls
        if (this.isToggling) {
            return;
        }
        
        this.isToggling = true;
        this.murajaahAyahToggleVisible = !this.murajaahAyahToggleVisible;
        this.updateMurajaahDisplay();
        
        // Reset flag after a short delay
        setTimeout(() => {
            this.isToggling = false;
        }, 100);
    }

    toggleMurajaahTranslation() {
        this.murajaahTranslationVisible = !this.murajaahTranslationVisible;
        this.updateMurajaahDisplay();
    }

    updateMurajaahToggleButton() {
        const toggleBtn = document.getElementById('toggleMurajaahAyahBtn');
        if (this.murajaahAyahToggleVisible) {
            toggleBtn.textContent = '🙈 Sembunyikan Ayat';
            toggleBtn.classList.remove('btn-outline');
            toggleBtn.classList.add('btn-secondary');
        } else {
            toggleBtn.textContent = '👁️ Lihat Ayat';
            toggleBtn.classList.remove('btn-secondary');
            toggleBtn.classList.add('btn-outline');
        }
    }
    
    showMurajaahRestartOptions() {
        // Hide navigation buttons and show restart options
        const navButtons = document.querySelector('.navigation-buttons');
        if (navButtons) {
            navButtons.style.display = 'none';
        }
        
        const restartOptions = document.getElementById('murajaah-restart-options');
        if (restartOptions) {
            restartOptions.style.display = 'block';
        }
    }
    
    hideMurajaahRestartOptions() {
        // Show navigation buttons and hide restart options
        const navButtons = document.querySelector('.navigation-buttons');
        if (navButtons) {
            navButtons.style.display = 'flex';
        }
        
        const restartOptions = document.getElementById('murajaah-restart-options');
        if (restartOptions) {
            restartOptions.style.display = 'none';
        }
    }
    
    murajaahRestartFromBeginning() {
        // Reset tikrar ke awal (fase 1)
        this.tikrarState = {
            current: 1,
            total: 20,
            mode: 'melihat',
            phase: 1
        };
        
        this.hideMurajaahRestartOptions();
        this.updateMurajaahDisplay();
    }
    
    murajaahRestartFromSecondPhase() {
        // Reset tikrar ke fase 2
        this.tikrarState = {
            current: 1,
            total: 10,
            mode: 'tanpa_melihat',
            phase: 2
        };
        
        this.hideMurajaahRestartOptions();
        this.updateMurajaahDisplay();
    }
    
    confirmMurajaah() {
        if (!this.currentMurajaah) return;
        
        // Update tikrar count untuk semua ayat yang dimurajaah
        hafalanStorage.updateMurajaahTikrar(this.currentMurajaah.ayahs, 30);
        
        const typeText = this.currentMurajaah.type === 'daily' ? 'harian' : 'mingguan';
        alert(`Alhamdulillah! Murajaah ${typeText} telah selesai. Total ${this.currentMurajaah.ayahs.length} ayat telah dimurajaah dengan sempurna.`);
        
        // Reset murajaah
        this.resetMurajaah();
        
        // Update progress display
        this.updateProgressDisplay();
    }
    
    updateUI() {
        // Update surah and ayah selectors
        const surahSelect = document.getElementById('surah-select');
        if (surahSelect) {
            surahSelect.value = this.currentSurah;
        }
        
        const ayahSelect = document.getElementById('ayah-select');
        if (ayahSelect) {
            ayahSelect.value = this.currentAyah;
        }
        
        // Update ayah display
        const ayahData = this.getAyahData(this.currentSurah, this.currentAyah);
        if (ayahData) {
            const ayahText = document.getElementById('ayah-text');
            if (ayahText) {
                ayahText.textContent = ayahData.arabic;
            }
            
            const ayahTranslation = document.getElementById('ayah-translation');
            if (ayahTranslation) {
                ayahTranslation.textContent = ayahData.translation;
            }
        }
        
        // Update tikrar info
        const tikrarCount = document.getElementById('tikrar-count');
        if (tikrarCount) {
            tikrarCount.textContent = this.tikrarCount;
        }
        
        const tikrarMode = document.getElementById('tikrar-mode');
        if (tikrarMode) {
            tikrarMode.textContent = this.mode === 'melihat' ? 'Melihat' : 'Tanpa Melihat';
        }
        
        // Update button states
        this.updateButtonStates();
    }

    updateButtonStates() {
        const prevBtn = document.getElementById('prev-tikrar');
        if (prevBtn) {
            prevBtn.disabled = this.tikrarCount <= 1;
        }
        
        const nextBtn = document.getElementById('next-tikrar');
        if (nextBtn) {
            nextBtn.disabled = false;
        }
        
        const prevAyahBtn = document.getElementById('prev-ayah');
        const nextAyahBtn = document.getElementById('next-ayah');
        const confirmBtn = document.getElementById('confirm-hafal');
        
        // Show/hide confirm button based on completion
        if (confirmBtn) {
            if (this.mode === 'tanpa_melihat' && this.tikrarCount >= 10) {
                confirmBtn.style.display = 'inline-block';
            } else {
                confirmBtn.style.display = 'none';
            }
        }
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