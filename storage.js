// Storage Manager untuk Aplikasi Hafalan Qur'an
class HafalanStorage {
    constructor() {
        this.storageKey = 'ngapalin_data';
        this.initializeStorage();
    }

    // Inisialisasi storage dengan struktur data default
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const defaultData = {
                memorizedAyahs: [], // Array ayat yang sudah dihafal
                currentProgress: null, // Progress hafalan saat ini
                dailyStreak: 0, // Streak harian
                totalTikrar: 0, // Total tikrar yang sudah dilakukan
                lastStudyDate: null, // Tanggal terakhir belajar
                weeklyProgress: [], // Progress mingguan
                settings: {
                    showTranslation: true,
                    autoNext: false
                }
            };
            localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
        }
    }

    // Mendapatkan semua data
    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error parsing storage data:', error);
            this.initializeStorage();
            return this.getData();
        }
    }

    // Menyimpan data
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Menambah ayat yang sudah dihafal
    addMemorizedAyah(surahNumber, ayahNumber, date = new Date()) {
        const data = this.getData();
        const memorizedAyah = {
            surahNumber: parseInt(surahNumber),
            ayahNumber: parseInt(ayahNumber),
            dateMemorized: date.toISOString(),
            tikrarCount: 30, // 20 melihat + 10 tanpa melihat
            lastReviewed: date.toISOString()
        };

        // Cek apakah ayat sudah ada
        const existingIndex = data.memorizedAyahs.findIndex(
            ayah => ayah.surahNumber === memorizedAyah.surahNumber && 
                   ayah.ayahNumber === memorizedAyah.ayahNumber
        );

        if (existingIndex >= 0) {
            // Update ayat yang sudah ada
            data.memorizedAyahs[existingIndex] = memorizedAyah;
        } else {
            // Tambah ayat baru
            data.memorizedAyahs.push(memorizedAyah);
        }

        // Update total tikrar
        data.totalTikrar += 30;

        // Update streak harian
        this.updateDailyStreak(data, date);

        return this.saveData(data);
    }

    // Update streak harian
    updateDailyStreak(data, currentDate = new Date()) {
        const today = currentDate.toDateString();
        const lastStudyDate = data.lastStudyDate ? new Date(data.lastStudyDate).toDateString() : null;
        
        if (lastStudyDate === today) {
            // Sudah belajar hari ini, tidak perlu update streak
            return;
        }
        
        if (lastStudyDate) {
            const yesterday = new Date(currentDate);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastStudyDate === yesterday.toDateString()) {
                // Belajar kemarin, lanjutkan streak
                data.dailyStreak += 1;
            } else {
                // Tidak belajar kemarin, reset streak
                data.dailyStreak = 1;
            }
        } else {
            // Pertama kali belajar
            data.dailyStreak = 1;
        }
        
        data.lastStudyDate = currentDate.toISOString();
    }

    // Mendapatkan ayat yang sudah dihafal
    getMemorizedAyahs() {
        const data = this.getData();
        return data.memorizedAyahs || [];
    }

    // Mendapatkan ayat untuk murajaah harian (ayat yang dihafal kemarin)
    getDailyReviewAyahs() {
        const data = this.getData();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        return data.memorizedAyahs.filter(ayah => {
            const memorizedDate = new Date(ayah.dateMemorized).toDateString();
            return memorizedDate === yesterdayStr;
        });
    }

    // Mendapatkan ayat untuk murajaah mingguan
    getWeeklyReviewAyahs() {
        const data = this.getData();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const today = new Date();

        return data.memorizedAyahs.filter(ayah => {
            const memorizedDate = new Date(ayah.dateMemorized);
            return memorizedDate >= oneWeekAgo && memorizedDate <= today;
        });
    }

    // Update progress hafalan saat ini
    setCurrentProgress(surahNumber, ayahNumber, tikrarCount, mode) {
        const data = this.getData();
        data.currentProgress = {
            surahNumber: parseInt(surahNumber),
            ayahNumber: parseInt(ayahNumber),
            tikrarCount: parseInt(tikrarCount),
            mode: mode, // 'melihat' atau 'tanpa_melihat'
            timestamp: new Date().toISOString()
        };
        console.log('Storage: Saving currentProgress:', data.currentProgress);
        const result = this.saveData(data);
        console.log('Storage: Save result:', result);
        return result;
    }

    // Mendapatkan progress hafalan saat ini
    getCurrentProgress() {
        const data = this.getData();
        console.log('Storage: Getting currentProgress:', data.currentProgress);
        return data.currentProgress;
    }

    // Menghapus progress hafalan saat ini
    clearCurrentProgress() {
        const data = this.getData();
        data.currentProgress = null;
        return this.saveData(data);
    }

    // Mendapatkan statistik
    getStatistics() {
        const data = this.getData();
        return {
            totalMemorized: data.memorizedAyahs.length,
            dailyStreak: data.dailyStreak,
            totalTikrar: data.totalTikrar,
            lastStudyDate: data.lastStudyDate
        };
    }

    // Update tikrar untuk murajaah
    updateMurajaahTikrar(ayahList, tikrarCount) {
        const data = this.getData();
        data.totalTikrar += tikrarCount * ayahList.length;
        
        // Update last reviewed untuk setiap ayat
        ayahList.forEach(ayah => {
            const memorizedAyah = data.memorizedAyahs.find(
                m => m.surahNumber === ayah.surahNumber && m.ayahNumber === ayah.ayahNumber
            );
            if (memorizedAyah) {
                memorizedAyah.lastReviewed = new Date().toISOString();
                memorizedAyah.tikrarCount += tikrarCount;
            }
        });

        // Update streak harian
        this.updateDailyStreak(data);

        return this.saveData(data);
    }

    // Mendapatkan ayat berdasarkan surat
    getMemorizedAyahsBySurah(surahNumber) {
        const memorizedAyahs = this.getMemorizedAyahs();
        return memorizedAyahs.filter(ayah => ayah.surahNumber === parseInt(surahNumber));
    }

    // Cek apakah ayat sudah dihafal
    isAyahMemorized(surahNumber, ayahNumber) {
        const memorizedAyahs = this.getMemorizedAyahs();
        return memorizedAyahs.some(
            ayah => ayah.surahNumber === parseInt(surahNumber) && 
                   ayah.ayahNumber === parseInt(ayahNumber)
        );
    }

    // Reset semua data (untuk testing atau reset aplikasi)
    resetAllData() {
        localStorage.removeItem(this.storageKey);
        this.initializeStorage();
        return true;
    }

    // Export data untuk backup
    exportData() {
        const data = this.getData();
        return JSON.stringify(data, null, 2);
    }

    // Import data dari backup
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            return this.saveData(data);
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Instance global storage
const hafalanStorage = new HafalanStorage();

// Export untuk penggunaan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HafalanStorage, hafalanStorage };
}