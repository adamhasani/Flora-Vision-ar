// --- BAGIAN 1: PERSIAPAN ---
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const loadingScreen = document.getElementById('loading');
let isLoaded = false;

// --- BAGIAN 2: FUNGSI UTAMA (Dijalankan terus-menerus setiap frame video) ---
function onResults(results) {
    // Hapus layar loading jika ini frame pertama yang berhasil
    if (!isLoaded) {
        document.body.classList.add('loaded');
        isLoaded = true;
    }

    // Siapkan canvas untuk digambar
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // 2.1. Gambar Video Kamera sebagai background
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    // 2.2. Cek apakah ada tangan terdeteksi?
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Loop untuk setiap tangan yang terdeteksi (maksimal 2)
        for (const landmarks of results.multiHandLandmarks) {
            
            // --- INI DIA: Menggambar Tulang Tangan (Opsional, buat debug) ---
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                         {color: '#00FF00', lineWidth: 2}); // Garis hijau
            drawLandmarks(canvasCtx, landmarks, 
                         {color: '#FF0000', lineWidth: 1, radius: 3}); // Titik merah sendi


            // --- INI DIA: LOGIKA JURUS ---
            // Kita ambil titik ujung telunjuk. Dalam MediaPipe, itu index ke-8.
            const ujungTelunjuk = landmarks[8];

            // Konversi koordinat (yang aslinya skala 0.0 - 1.0) ke ukuran piksel canvas
            const x = ujungTelunjuk.x * canvasElement.width;
            const y = ujungTelunjuk.y * canvasElement.height;

            // --- MENGGAMBAR EFEK JURUS (Sementara Bola Merah Dulu) ---
            canvasCtx.beginPath();
            // Gambar lingkaran di posisi x, y dengan radius 30
            canvasCtx.arc(x, y, 30, 0, 2 * Math.PI);
            // Warna isian merah menyala
            canvasCtx.fillStyle = 'rgba(255, 50, 0, 0.8)'; 
            canvasCtx.fill();
            // Garis pinggir kuning
            canvasCtx.lineWidth = 3;
            canvasCtx.strokeStyle = 'yellow';
            canvasCtx.stroke();
            // --- SELESAI GAMBAR JURUS ---

        }
    }
    canvasCtx.restore();
}

// --- BAGIAN 3: KONFIGURASI OTAK AI (MediaPipe) ---
const hands = new Hands({locateFile: (file) => {
    // Mengambil file model AI dari server Google (CDN)
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

// Settingan agar seimbang antara cepat dan akurat di HP
hands.setOptions({
    maxNumHands: 2,         // Bisa 2 tangan
    modelComplexity: 1,     // 0 (cepat) atau 1 (akurat). 1 Masih oke di HP modern.
    minDetectionConfidence: 0.5, // Tingkat keyakinan minimal 50%
    minTrackingConfidence: 0.5
});

// Kalau AI selesai mikir, jalankan fungsi 'onResults' di atas
hands.onResults(onResults);


// --- BAGIAN 4: NYALAKAN KAMERA ---
// Menggunakan library CameraUtils dari MediaPipe biar gampang
const camera = new Camera(videoElement, {
    onFrame: async () => {
        // Kirim gambar video ke AI untuk dianalisis
        await hands.send({image: videoElement});
    },
    // Kita minta resolusi HD, tapi nanti browser akan menyesuaikan kemampuan HP
    width: 1280,
    height: 720,
    facingMode: 'user' // Pakai kamera depan (selfie)
});

// Mulai Kamera! (Akan memunculkan popup izin di browser)
camera.start();
