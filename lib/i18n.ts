export type Language = "English" | "Indonesia";

// Keys are the English source strings shown in the UI.
// A missing key falls back to the English text, so partial coverage is safe.
const indonesian: Record<string, string> = {
  // Welcome & auth
  "small routines,\nsofter days": "rutinitas kecil,\nhari yang tenang",
  "Get started": "Mulai",
  "Log in": "Masuk",
  "Create an account": "Buat akun",
  "Create account": "Buat akun",
  Or: "Atau",
  "Continue with Google": "Lanjutkan dengan Google",
  "Local preview · no account is created":
    "Pratinjau lokal · tidak ada akun yang dibuat",
  "Back to welcome": "Kembali ke halaman awal",
  "Already have an account?": "Sudah punya akun?",
  "First name": "Nama depan",
  "Last name": "Nama belakang",
  Email: "Email",
  Password: "Kata sandi",

  // Onboarding
  "Step {n} of 3": "Langkah {n} dari 3",
  "What do you want to\nbe called?": "Kamu ingin dipanggil\nsiapa?",
  "What would you like\nto focus on?": "Apa yang ingin kamu\nfokuskan?",
  "Let’s build your first\nroutine!": "Ayo susun rutinitas\npertamamu!",
  "choose as many as you like": "pilih sebanyak yang kamu mau",
  "here are some general daily\nactivities for you to accomplish":
    "berikut beberapa aktivitas\nharian untuk kamu lakukan",
  Continue: "Lanjut",
  "Nick name": "Nama panggilan",
  "Your nickname": "Nama panggilanmu",
  "Choose profile emoji": "Pilih emoji profil",
  "Profile emoji": "Emoji profil",
  "Choose {emoji}": "Pilih {emoji}",
  "You’re all set!": "Semua siap!",
  "small steps, big changes\nwe’re excited to have you here":
    "langkah kecil, perubahan besar\nsenang kamu ada di sini",
  "Go to my day": "Mulai hari saya",
  "Choose at least one ritual to begin.":
    "Pilih minimal satu ritual untuk mulai.",

  // Focus & starter activities
  "Mental Wellness": "Kesehatan Mental",
  "Physical Health": "Kesehatan Fisik",
  "Self Care": "Perawatan Diri",
  Productivity: "Produktivitas",
  "Better Sleep": "Tidur Lebih Baik",
  Joy: "Kebahagiaan",
  "Drink Water": "Minum Air",
  Skincare: "Perawatan Kulit",
  Exercise: "Olahraga",
  Journal: "Menulis Jurnal",
  Journaling: "Menulis Jurnal",
  Read: "Membaca",
  "Pray/Meditate": "Berdoa/Meditasi",
  "Sleep before 11 PM": "Tidur sebelum 23.00",

  // Today
  "Good morning,": "Selamat pagi,",
  "Today’s progress": "Progres hari ini",
  "Current Streak": "Rentetan Saat Ini",
  "See detail": "Lihat detail",
  "Rituals for today": "Ritual hari ini",
  "{count} ritual planned": "{count} ritual direncanakan",
  "{count} rituals planned": "{count} ritual direncanakan",
  "No rituals are scheduled for today. Tap to create one.":
    "Belum ada ritual untuk hari ini. Ketuk untuk membuatnya.",
  "+{count} more": "+{count} lagi",
  "Add activity": "Tambah aktivitas",
  "{done}/{total} Completed": "{done}/{total} Selesai",

  // Daily
  "Daily overview": "Ringkasan harian",
  "No rituals are scheduled for this date.":
    "Tidak ada ritual yang dijadwalkan pada tanggal ini.",
  "No activity recorded for this date.":
    "Belum ada aktivitas yang tercatat pada tanggal ini.",
  "Log your activity": "Catat aktivitasmu",
  Completed: "Selesai",
  Missed: "Terlewat",
  Save: "Simpan",
  "Your first small step is waiting.": "Langkah kecil pertamamu menanti.",
  "Nothing missed. Lovely work!": "Tidak ada yang terlewat. Kerja bagus!",
  "Beautifully done!": "Luar biasa!",
  "Good day!": "Hari yang baik!",
  days: "hari",
  Completion: "Penyelesaian",
  "Daily completion": "Penyelesaian harian",
  "Today’s progress has been saved.": "Progres hari ini telah disimpan.",

  // Progress
  Progress: "Progres",
  Calendar: "Kalender",
  Habits: "Kebiasaan",
  Rituals: "Ritual",
  Weekly: "Mingguan",
  Monthly: "Bulanan",
  "View by": "Lihat menurut",
  "Progress type": "Jenis progres",
  "Progress period": "Periode progres",
  "View progress by period": "Lihat progres per periode",
  "Overall completion": "Penyelesaian keseluruhan",
  "Longest Streak": "Rentetan Terpanjang",
  "You’re most consistent with\nyour {category} habits.":
    "Kamu paling konsisten dengan\nkebiasaan {category}mu.",
  "Create a ritual to see how its rhythm settles over time.":
    "Buat ritual untuk melihat bagaimana ritmenya terbentuk seiring waktu.",
  "Rituals consistency": "Konsistensi ritual",
  "You’re sticking to your rituals more often over time. Keep the rhythm going.":
    "Kamu makin sering menjalani ritualmu dari waktu ke waktu. Jaga terus ritmenya.",
  Trend: "Tren",
  "Average completion": "Rata-rata penyelesaian",
  Week: "Minggu",
  "This Week": "Minggu Ini",
  "This Month": "Bulan Ini",
  "Best day": "Hari terbaik",
  "Best week": "Minggu terbaik",
  "Most consistent": "Paling konsisten",
  "Least consistent": "Paling jarang",
  "{month} progress": "Progres {month}",
  SUN: "MIN",
  MON: "SEN",
  TUE: "SEL",
  WED: "RAB",
  THU: "KAM",
  FRI: "JUM",
  SAT: "SAB",
  "Previous month": "Bulan sebelumnya",
  "Next month": "Bulan berikutnya",
  "Back to Progress calendar": "Kembali ke kalender progres",
  "Back to Today": "Kembali ke Hari Ini",
  "{done} / {total} days": "{done} / {total} hari",

  // Rituals
  "Create your first ritual": "Buat ritual pertamamu",
  "Add ritual": "Tambah ritual",
  "Edit {name} ritual": "Ubah ritual {name}",

  // Profile
  Change: "Ubah",
  "Personal Information": "Informasi Pribadi",
  Username: "Nama pengguna",
  Subscription: "Langganan",
  Plan: "Paket",
  "Renews on": "Diperpanjang pada",
  "Sign Out": "Keluar",
  "No subscription": "Tidak ada langganan",
  Active: "Aktif",
  "You’re on Odette Free": "Kamu memakai Odette Free",
  "Choose a plan below to open everything Odette can hold for you.":
    "Pilih paket di bawah untuk membuka semua yang bisa Odette simpan untukmu.",
  "{price} · renews on {date}": "{price} · diperpanjang pada {date}",
  "Profile photo of {name}": "Foto profil {name}",

  // Subscription
  "Room to grow, gently": "Ruang untuk tumbuh, perlahan",
  "Keep every ritual, every memory, and every quiet win with a plan that fits your pace.":
    "Simpan setiap ritual, setiap kenangan, dan setiap kemenangan kecil dengan paket yang sesuai ritmemu.",
  "Choose your plan": "Pilih paketmu",
  "What’s included": "Yang termasuk",
  "Cancel subscription": "Batalkan langganan",
  "Subscription plans": "Paket langganan",
  "Preview pricing in IDR. No payment is taken in this prototype. Plans renew automatically and you can stop anytime.":
    "Harga pratinjau dalam IDR. Tidak ada pembayaran di prototipe ini. Paket diperpanjang otomatis dan bisa dihentikan kapan saja.",
  "6 Months": "6 Bulan",
  "1 Year": "1 Tahun",
  "Try it gently, stop whenever.": "Coba perlahan, berhenti kapan saja.",
  "A calm half-year of rituals.": "Setengah tahun ritual yang tenang.",
  "Best value for a full year.": "Paling hemat untuk setahun penuh.",
  "Most loved": "Paling disukai",
  "Best value": "Paling hemat",
  "Current plan": "Paket saat ini",
  "Your current plan": "Paket kamu saat ini",
  "Switch to {name}": "Ganti ke {name}",
  "Subscribe · {price}": "Berlangganan · {price}",
  "{price} / mo": "{price} / bln",
  "Save {percent}%": "Hemat {percent}%",
  "Unlimited rituals": "Ritual tanpa batas",
  "Build as many rituals as your days need.":
    "Buat sebanyak apa pun ritual yang harimu butuhkan.",
  "Full progress history": "Riwayat progres lengkap",
  "Weekly and monthly reports, kept forever.":
    "Laporan mingguan dan bulanan, tersimpan selamanya.",
  "Every mood & photo memory": "Semua suasana hati & kenangan foto",
  "Look back on how each day actually felt.":
    "Lihat kembali bagaimana rasanya tiap hari.",
  "Gentle reminders": "Pengingat lembut",
  "Soft nudges for every ritual you keep.":
    "Dorongan lembut untuk setiap ritual yang kamu jaga.",
  "Billed every month": "Ditagih tiap bulan",
  "per month": "per bulan",
  "Billed once every {months} months · {price} / mo":
    "Ditagih sekali tiap {months} bulan · {price} / bln",
  "Cancel Odette Plus? You’ll keep access until {date}.":
    "Batalkan Odette Plus? Aksesmu tetap aktif sampai {date}.",
  "the end of this period": "akhir periode ini",
  "Your {name} plan will be replaced and the new period starts today.":
    "Paket {name} kamu akan diganti dan periode baru dimulai hari ini.",
  "Your plan starts today and renews automatically. No real payment is taken in this preview.":
    "Paketmu dimulai hari ini dan diperpanjang otomatis. Tidak ada pembayaran nyata di pratinjau ini.",
  "Switch plan": "Ganti paket",
  "Activate plan": "Aktifkan paket",
  "Odette Plus {name} is active. Enjoy your softer days.":
    "Odette Plus {name} aktif. Nikmati hari-hari yang lebih tenang.",
  "Subscription cancelled. You’re on Odette Free.":
    "Langganan dibatalkan. Kamu kembali ke Odette Free.",

  // Navigation & menu
  Today: "Hari Ini",
  Profile: "Profil",
  "Help & Settings": "Bantuan & Pengaturan",
  "Page navigation": "Navigasi halaman",
  "Open menu": "Buka menu",
  "Close menu": "Tutup menu",
  "Close navigation": "Tutup navigasi",
  "Close dialog": "Tutup dialog",

  // Help & settings
  "Shape a calmer space for your everyday rituals.":
    "Bentuk ruang yang lebih tenang untuk ritual harianmu.",
  Preferences: "Preferensi",
  Language: "Bahasa",
  "Set your preferred app language.": "Atur bahasa aplikasi pilihanmu.",
  "Account & profile": "Akun & profil",
  "Update your name, email, and photo.": "Perbarui nama, email, dan fotomu.",
  "Quick actions": "Aksi cepat",
  "Manage rituals": "Kelola ritual",
  "Create, rename, or remove a ritual.": "Buat, ganti nama, atau hapus ritual.",
  "Review progress": "Tinjau progres",
  "See your calendar and completion trends.":
    "Lihat kalender dan tren penyelesaianmu.",
  Help: "Bantuan",
  "What are today’s rituals?": "Apa saja ritual hari ini?",
  "See what is planned for the current day.":
    "Lihat apa yang direncanakan untuk hari ini.",
  "Today shows rituals that match the date and their frequency. Morning and Night are time ranges, not required ritual names.":
    "Hari Ini menampilkan ritual yang cocok dengan tanggal dan frekuensinya. Pagi dan Malam adalah rentang waktu, bukan nama ritual yang wajib.",
  "How do I change a ritual?": "Bagaimana cara mengubah ritual?",
  "Edit its name, activities, or schedule.":
    "Ubah nama, aktivitas, atau jadwalnya.",
  "Open Rituals, choose any ritual card, then save your changes or use Delete Ritual at the bottom of the sheet.":
    "Buka Ritual, pilih salah satu kartu ritual, lalu simpan perubahanmu atau gunakan Hapus Ritual di bagian bawah panel.",
  "Where is my data saved?": "Di mana data saya disimpan?",
  "Your preview stays on this device.":
    "Pratinjaumu tersimpan di perangkat ini.",
  "This preview uses local browser storage. Cloud sync and account recovery are not connected yet.":
    "Pratinjau ini memakai penyimpanan lokal browser. Sinkronisasi cloud dan pemulihan akun belum terhubung.",
  "Language changed to {language}.": "Bahasa diubah ke {language}.",
  English: "Inggris",
  Indonesia: "Indonesia",

  // Activity & ritual sheets
  "Add activity to your day": "Tambah aktivitas ke harimu",
  "Add Ritual": "Tambah Ritual",
  "Edit Ritual": "Ubah Ritual",
  "Profile Photo": "Foto Profil",
  "Edit Personal Information": "Ubah Informasi Pribadi",
  "Switch Plan": "Ganti Paket",
  "Start Odette Plus": "Mulai Odette Plus",
  "Cancel Subscription": "Batalkan Langganan",
  "Activity Name": "Nama Aktivitas",
  Category: "Kategori",
  "Add to your rituals": "Tambahkan ke ritualmu",
  "Add to your rituals (optional)": "Tambahkan ke ritualmu (opsional)",
  "Delete Activity": "Hapus Aktivitas",
  Frequency: "Frekuensi",
  "Time Range": "Rentang Waktu",
  Activity: "Aktivitas",
  Add: "Tambah",
  "Add an activity": "Tambah sebuah aktivitas",
  "add activities to your ritual": "tambahkan aktivitas ke ritualmu",
  "Ritual Name": "Nama Ritual",
  Activities: "Aktivitas",
  "Save Changes": "Simpan Perubahan",
  "Delete Ritual": "Hapus Ritual",
  "Remove photo": "Hapus foto",
  "Upload from device": "Unggah dari perangkat",
  "Take photo": "Ambil foto",
  "Close completion message": "Tutup pesan penyelesaian",

  // Categories, frequencies, time ranges
  Mind: "Pikiran",
  Body: "Tubuh",
  Wellness: "Kesejahteraan",
  Rest: "Istirahat",
  "Every day": "Setiap hari",
  Weekdays: "Hari kerja",
  Weekends: "Akhir pekan",
  Morning: "Pagi",
  Afternoon: "Siang",
  Evening: "Sore",
  Night: "Malam",
  "Today only": "Hanya hari ini",
  "Any time": "Kapan saja",

  // Modals & confirmations
  "Not now": "Nanti saja",
  "Keep plan": "Pertahankan paket",
  "Yes, cancel": "Ya, batalkan",
  "Are you sure you want to sign out?": "Yakin ingin keluar?",
  No: "Tidak",
  "Yes, sign out": "Ya, keluar",
  "Google sign-in isn’t connected in this preview yet.":
    "Masuk dengan Google belum terhubung di pratinjau ini.",
  "You can still explore Odette and keep your rituals on this device.":
    "Kamu tetap bisa menjelajahi Odette dan menyimpan ritualmu di perangkat ini.",
  "Continue to preview": "Lanjut ke pratinjau",
  "You’re all done": "Semuanya selesai",
  "Today looked good on you": "Hari ini terlihat indah untukmu",
  "See Summary": "Lihat Ringkasan",
  DONE: "SELESAI",

  // Toasts
  "This browser could not save changes. Keep this tab open.":
    "Browser ini tidak bisa menyimpan perubahan. Biarkan tab ini terbuka.",
  "Please choose an image file.": "Silakan pilih berkas gambar.",
  "Please choose a photo smaller than 3 MB.":
    "Silakan pilih foto berukuran di bawah 3 MB.",
  "Profile photo updated.": "Foto profil diperbarui.",
  "That photo could not be opened.": "Foto itu tidak bisa dibuka.",
  "Profile photo removed.": "Foto profil dihapus.",
  "Add a name and a category first.": "Isi nama dan kategori terlebih dulu.",
  "Activity updated.": "Aktivitas diperbarui.",
  "Activity added to today.": "Aktivitas ditambahkan ke hari ini.",
  "Activity deleted.": "Aktivitas dihapus.",
  "Please choose a unique ritual name.":
    "Pilih nama ritual yang belum dipakai.",
  "Add at least one activity to this ritual.":
    "Tambahkan minimal satu aktivitas ke ritual ini.",
  "Your new ritual has been added.": "Ritual barumu telah ditambahkan.",
  "Your ritual has been updated.": "Ritualmu telah diperbarui.",
  "{name} ritual deleted.": "Ritual {name} dihapus.",
  "Personal information saved.": "Informasi pribadi disimpan.",
};

export type Translate = (
  text: string,
  vars?: Record<string, string | number>,
) => string;

function fill(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match,
  );
}

export function makeTranslator(language: Language): Translate {
  return (text, vars) =>
    fill(language === "Indonesia" ? (indonesian[text] ?? text) : text, vars);
}

export function localeOf(language: Language) {
  return language === "Indonesia" ? "id-ID" : "en-US";
}
