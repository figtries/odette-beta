<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Token discipline (baca seperlunya, kerja seperlunya, berhenti)

Tiap giliran memuat ulang instruksi + daftar tools + file ini, jadi biaya terbesar adalah "biaya nyala", bukan cara ngetik. Turunkan dengan disiplin:

- Investigate dulu, terarah: cari dengan Grep/Glob pola spesifik; baca hanya range baris yang perlu (offset/limit), bukan file utuh — apalagi file besar.
- Jangan baca ulang file yang barusan diedit hanya untuk "memastikan"; tool edit sudah error kalau gagal.
- Batch tool call yang tidak saling bergantung dalam satu langkah, bukan satu-satu.
- Patch yang ditargetkan, bukan menulis ulang seluruh file. Edit hanya yang berubah.
- Jangan dump isi file panjang ke balasan; rujuk path + nomor baris. Output ringkas, tanpa preamble/rekap.
- Verifikasi murah (satu perintah yang membuktikan), lalu STOP. Jangan menambah polish/refactor yang tidak diminta.
- Percakapan panjang: /compact. Ganti tugas: /clear. Batasi MCP server yang aktif — tiap server menambah daftar tools yang dibaca tiap giliran.
