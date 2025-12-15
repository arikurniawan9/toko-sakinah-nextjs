// utils/debug-attendant-data.js
// Script untuk debug data pelayan di database

import prisma from '../lib/prisma';

async function debugAttendantData() {
  console.log('Memulai debug data pelayan...');

  try {
    // Ambil semua user yang role-nya ATTENDANT di StoreUser
    const attendantUsers = await prisma.storeUser.findMany({
      where: {
        role: 'ATTENDANT'
      },
      include: {
        user: true,
        store: true
      }
    });

    console.log(`\nDitemukan ${attendantUsers.length} user dengan role ATTENDANT di StoreUser:`);

    for (const attendant of attendantUsers) {
      console.log(`\nID User: ${attendant.userId}`);
      console.log(`  Username: ${attendant.user.username}`);
      console.log(`  Name: ${attendant.user.name}`);
      console.log(`  Role di User: ${attendant.user.role}`);
      console.log(`  Role di StoreUser: ${attendant.role}`);
      console.log(`  Store ID: ${attendant.storeId}`);
      console.log(`  Store Name: ${attendant.store?.name || 'N/A'}`);
      console.log(`  StoreUser Status: ${attendant.status}`);
      console.log(`  User Status: ${attendant.user.status}`);
    }

    // Cari user yang role-nya bukan ATTENDANT di StoreUser tapi mungkin seharusnya
    console.log('\nMencari user dengan role lama...');

    const usersWithOldRole = await prisma.user.findMany({
      where: {
        role: {
          in: ['pelayan', 'PELAYAN', 'Pelayan', 'pegawai', 'waiter', 'Waiter', 'WAITER']
        }
      }
    });

    if (usersWithOldRole.length > 0) {
      console.log(`\nDitemukan ${usersWithOldRole.length} user dengan role lama (mungkin belum diperbaiki):`);
      for (const user of usersWithOldRole) {
        console.log(`  - ${user.username} (${user.name}): ${user.role}`);
      }
    }

    // Cek apakah ada StoreUser dengan role ATTENDANT tapi status bukan AKTIF
    const inactiveAttendants = await prisma.storeUser.findMany({
      where: {
        role: 'ATTENDANT',
        status: {
          not: { in: ['AKTIF', 'ACTIVE'] }
        }
      },
      include: {
        user: true
      }
    });

    if (inactiveAttendants.length > 0) {
      console.log(`\nDitemukan ${inactiveAttendants.length} pelayan dengan status tidak aktif:`);
      for (const attendant of inactiveAttendants) {
        console.log(`  - ${attendant.user.username} (${attendant.user.name}): ${attendant.status}`);
      }
    }

  } catch (error) {
    console.error('Error saat debug data pelayan:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Jika file dijalankan langsung
if (require.main === module) {
  debugAttendantData()
    .then(() => {
      console.log('\nDebug selesai.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Debug gagal:', error);
      process.exit(1);
    });
}

export default debugAttendantData;