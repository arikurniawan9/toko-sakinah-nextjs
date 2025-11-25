-- Backup data untuk toko: Toko Pusat (TK001)
-- Dibuat pada: 2025-11-24T07:34:58.733Z
-- Store ID: cmiakex3500022a0hugif8ul0

-- Tabel users (via storeUser)
INSERT INTO users (id, name, username, employeeNumber, code, gender, address, phone, status, password, role, createdAt, updatedAt) VALUES ('cmiakex6400052a0hwlfoqq1p', 'Admin Toko', 'admintoko', 'ADM001', '', 'Perempuan', '', '081234567892', 'AKTIF', '$2b$10$h.XT2ITVd75lVGN4V8IJ7.zlPgHyJvWCitFqeS55so5a8JTcR9Kxe', 'ADMIN', '2025-11-22 17:30:42.412', '2025-11-22 17:30:42.412');

-- Tabel categories
INSERT INTO categories (id, storeId, name, description, createdAt, updatedAt) VALUES ('cmicidaef0001ka1y17m87st4', 'cmiakex3500022a0hugif8ul0', 'Pakaian Wanita', 'Koleksi pakaian untuk wanita dewasa', '2025-11-24 02:08:59.261', '2025-11-24 02:08:59.261');
INSERT INTO categories (id, storeId, name, description, createdAt, updatedAt) VALUES ('cmicidaf40003ka1yym3ldwyv', 'cmiakex3500022a0hugif8ul0', 'Pakaian Pria', 'Koleksi pakaian untuk pria dewasa', '2025-11-24 02:08:59.393', '2025-11-24 02:08:59.393');
INSERT INTO categories (id, storeId, name, description, createdAt, updatedAt) VALUES ('cmicidafg0005ka1yovyyj0hq', 'cmiakex3500022a0hugif8ul0', 'Aksesoris', 'Aneka aksesori pelengkap', '2025-11-24 02:08:59.404', '2025-11-24 02:08:59.404');
INSERT INTO categories (id, storeId, name, description, createdAt, updatedAt) VALUES ('cmicidafo0007ka1y99m8f9jt', 'cmiakex3500022a0hugif8ul0', 'pakaian muslim', 'kumpulan pakaian muslim', '2025-11-24 02:08:59.413', '2025-11-24 02:08:59.413');

-- Tabel suppliers

-- Tabel products

-- Tabel priceTiers

-- Tabel members

-- Tabel sales

-- Tabel saleDetails

-- Tabel purchases

-- Tabel purchaseItems

-- Tabel expenseCategories

-- Tabel expenses

-- Tabel tempCarts

-- Tabel auditLogs

-- Tabel settings
INSERT INTO settings (id, storeId, shopName, address, phone, themeColor, createdAt, updatedAt) VALUES ('cmiakfvpq0001m7i2v60lwasc', 'cmiakex3500022a0hugif8ul0', 'Toko Baru', 'NULL', 'NULL', '#3c8dbc', '2025-11-22 17:31:27.182', '2025-11-22 17:31:27.182');

-- End of backup
