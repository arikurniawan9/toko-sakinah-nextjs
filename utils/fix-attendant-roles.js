// utils/fix-attendant-roles.js
// Script untuk memperbaiki role pelayan lama yang disimpan sebagai 'pelayan', 'PELAYAN', dll
// menjadi 'ATTENDANT' di tabel StoreUser
// Juga memperbaiki status lama menjadi format yang konsisten

import prisma from '../lib/prisma';

async function fixAttendantRoles() {
  console.log('Memulai perbaikan role dan status pelayan lama...');

  try {
    // Cari semua record StoreUser dengan role yang mungkin merupakan pelayan tapi bukan 'ATTENDANT'
    const oldRoles = ['pelayan', 'PELAYAN', 'Pelayan', 'ATTENDANT_LAMA', 'STAFF', 'pegawai', 'waiter', 'Waiter', 'WAITER'];

    for (const oldRole of oldRoles) {
      const records = await prisma.storeUser.findMany({
        where: {
          role: {
            in: [oldRole]
          }
        }
      });

      if (records.length > 0) {
        console.log(`\nMenemukan ${records.length} record dengan role '${oldRole}':`);

        for (const record of records) {
          // Ambil informasi user untuk logging
          const user = await prisma.user.findUnique({
            where: { id: record.userId }
          });

          console.log(`  - User: ${user?.name} (${user?.username}), Store: ${record.storeId}`);
        }

        // Update semua role tersebut menjadi 'ATTENDANT'
        const updated = await prisma.storeUser.updateMany({
          where: {
            role: { in: oldRoles }
          },
          data: {
            role: 'ATTENDANT'
          }
        });

        console.log(`  => ${updated.count} record berhasil diperbaiki menjadi 'ATTENDANT'`);
      }
    }

    // Juga cari user dengan role 'PELAYAN' di tabel User dan ubah menjadi 'ADMIN' (konsisten dengan logika baru)
    const oldUserRoles = ['pelayan', 'PELAYAN', 'Pelayan', 'pegawai', 'waiter', 'Waiter', 'WAITER'];
    for (const oldRole of oldUserRoles) {
      const users = await prisma.user.findMany({
        where: {
          role: oldRole
        },
        include: {
          storeUsers: true
        }
      });

      if (users.length > 0) {
        console.log(`\nMenemukan ${users.length} user dengan role User '${oldRole}' yang berelasi dengan StoreUser ATTENDANT:`);

        for (const user of users) {
          // Cek apakah user ini punya relasi ke store sebagai ATTENDANT
          const hasAttendantRole = user.storeUsers.some(storeUser => storeUser.role === 'ATTENDANT');

          if (hasAttendantRole) {
            console.log(`  - User: ${user.name} (${user.username}), role User lama: ${user.role}`);

            // Update role user menjadi 'ADMIN' sesuai dengan logika baru
            await prisma.user.update({
              where: { id: user.id },
              data: {
                role: 'ADMIN'
              }
            });

            console.log(`    => Role User berhasil diperbaiki menjadi 'ADMIN'`);
          }
        }
      }
    }

    // Perbaiki status lama di tabel StoreUser
    const oldStatuses = ['ACTIVE', 'INACTIVE', 'NonAktif'];
    for (const oldStatus of oldStatuses) {
      const records = await prisma.storeUser.findMany({
        where: {
          status: oldStatus
        }
      });

      if (records.length > 0) {
        console.log(`\nMenemukan ${records.length} record StoreUser dengan status '${oldStatus}':`);

        // Ubah ACTIVE menjadi AKTIF, dan INACTIVE/TIDAK AKTIF menjadi TIDAK AKTIF
        const newStatus = oldStatus === 'ACTIVE' ? 'AKTIF' : 'TIDAK AKTIF';

        const updated = await prisma.storeUser.updateMany({
          where: {
            status: oldStatus
          },
          data: {
            status: newStatus
          }
        });

        console.log(`  => ${updated.count} record berhasil diperbaiki menjadi status '${newStatus}'`);
      }
    }

    // Perbaiki status lama di tabel User
    const oldUserStatuses = ['ACTIVE', 'INACTIVE', 'NonAktif'];
    for (const oldStatus of oldUserStatuses) {
      const users = await prisma.user.findMany({
        where: {
          status: oldStatus
        }
      });

      if (users.length > 0) {
        console.log(`\nMenemukan ${users.length} user dengan status '${oldStatus}':`);

        // Ubah ACTIVE menjadi AKTIF, dan INACTIVE/TIDAK AKTIF menjadi TIDAK_AKTIF
        const newUserStatus = oldStatus === 'ACTIVE' ? 'AKTIF' : 'TIDAK_AKTIF';

        const updated = await prisma.user.updateMany({
          where: {
            status: oldStatus
          },
          data: {
            status: newUserStatus
          }
        });

        console.log(`  => ${updated.count} user berhasil diperbaiki menjadi status '${newUserStatus}'`);
      }
    }

    console.log('\nPerbaikan role dan status pelayan selesai!');

  } catch (error) {
    console.error('Error saat memperbaiki role dan status pelayan:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Jika file dijalankan langsung
if (require.main === module) {
  fixAttendantRoles()
    .then(() => {
      console.log('Script selesai dijalankan.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script gagal:', error);
      process.exit(1);
    });
}

export default fixAttendantRoles;