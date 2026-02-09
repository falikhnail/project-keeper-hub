# 📁 Project Management

Aplikasi manajemen proyek berbasis web untuk melacak proyek, deadline, subtasks, dan kolaborasi tim dalam satu platform.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-blue?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)

---

## ✨ Fitur Utama

### 📋 Manajemen Proyek
- **CRUD Proyek** — Buat, edit, dan hapus proyek dengan informasi lengkap (nama, deskripsi, link, tags, deadline)
- **Status Tracking** — 4 status proyek: `Active`, `Completed`, `On Hold`, `Archived`
- **Due Date & Reminder** — Atur deadline dengan pengingat otomatis (1, 3, 7, atau 14 hari sebelumnya)
- **Tags** — Kategorisasi proyek dengan tag custom

### 👁️ Multiple Views
- **Grid View** — Tampilan kartu responsif dengan animasi
- **Kanban Board** — Drag-and-drop antar kolom status
- **Calendar View** — Visualisasi proyek berdasarkan deadline di kalender bulanan

### ✅ Subtasks
- **Checklist Subtasks** — Tambah dan kelola subtask per proyek
- **Drag-and-Drop Reorder** — Ubah urutan subtask dengan drag-and-drop
- **Progress Tracking** — Lihat progress penyelesaian subtask

### 📝 Project Templates
- **Simpan Template** — Buat template dari proyek yang sudah ada
- **Terapkan Template** — Gunakan template saat membuat proyek baru (otomatis isi tags, reminder, subtasks)
- **Kelola Template** — Edit dan hapus template

### 💬 Kolaborasi
- **Komentar & Thread** — Diskusi dengan reply bersarang (nested comments)
- **Mentions** — Tag anggota tim di komentar
- **Handler Assignment** — Tetapkan handler/PIC ke proyek
- **Activity Timeline** — Riwayat lengkap perubahan proyek

### 📎 File Attachments
- **Upload File** — Lampirkan file ke proyek
- **Preview & Download** — Lihat dan unduh lampiran

### 📊 Analytics Dashboard
- **Statistik Proyek** — Distribusi proyek per status (pie chart)
- **Trend Bulanan** — Grafik proyek dibuat per bulan
- **Deadline Overview** — Distribusi deadline (overdue, today, this week, dll.)
- **Upcoming Deadlines** — Daftar 5 proyek dengan deadline terdekat

### 🔧 Fitur Tambahan
- **Bulk Actions** — Pilih beberapa proyek sekaligus untuk update status atau hapus massal
- **Select All** — Pilih semua proyek di grid view
- **Konfirmasi Delete** — Dialog konfirmasi sebelum penghapusan
- **Search & Filter** — Cari proyek dan filter berdasarkan status
- **Dark/Light Mode** — Toggle tema gelap dan terang
- **Responsive Design** — Tampilan optimal di desktop dan mobile
- **Authentication** — Login dan registrasi dengan email

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **State** | TanStack React Query |
| **Routing** | React Router DOM v6 |
| **Animation** | Framer Motion |
| **Drag & Drop** | @hello-pangea/dnd |
| **Charts** | Recharts |
| **Backend** | Lovable Cloud |
| **Auth** | Email-based authentication |
| **Storage** | Cloud file storage |
| **Build** | Vite |

---

## 📂 Struktur Proyek

```
src/
├── components/              # Komponen UI
│   ├── ui/                  # shadcn/ui components
│   ├── ProjectCard.tsx      # Kartu proyek
│   ├── KanbanBoard.tsx      # Tampilan Kanban
│   ├── CalendarView.tsx     # Tampilan Kalender
│   ├── BulkActionsBar.tsx   # Aksi massal
│   ├── SearchFilter.tsx     # Pencarian & filter
│   ├── DraggableSubtasksList.tsx # Drag-drop subtasks
│   ├── CommentsSection.tsx  # Komentar proyek
│   ├── FileAttachments.tsx  # Lampiran file
│   ├── TemplateSelector.tsx # Pemilih template
│   └── ...
├── hooks/                   # Custom hooks
│   ├── useAuth.tsx          # Autentikasi
│   ├── useProjects.tsx      # CRUD proyek
│   ├── useProjectTemplates.tsx # Template proyek
│   └── useTheme.tsx         # Tema dark/light
├── pages/                   # Halaman
│   ├── Index.tsx            # Dashboard utama
│   ├── ProjectDetail.tsx    # Detail proyek
│   ├── Analytics.tsx        # Dashboard analitik
│   └── Auth.tsx             # Login/Register
└── types/                   # TypeScript types
```

---

## 🚀 Cara Menjalankan

```bash
# Clone repository
git clone <YOUR_GIT_URL>

# Masuk ke direktori proyek
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk production
npm run build
```

---

## 📄 Lisensi

MIT License
