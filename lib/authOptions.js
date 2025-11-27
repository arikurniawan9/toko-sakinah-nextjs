
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma"; // Use the singleton prisma instance
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        selectedStoreId: { label: "Selected Store ID", type: "text", optional: true }, // Optional credential for manager to switch store context
        selectedStoreRole: { label: "Selected Store Role", type: "text", optional: true }, // Optional credential for manager to switch store context
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Masukkan username dan password");
        }

        // Import all login security functions at once
        const { getLockoutTimeRemaining, recordFailedLoginAttempt, resetLoginAttempts } = await import('./loginSecurity');

        // Check if IP is locked before proceeding
        const lockoutTime = getLockoutTimeRemaining(credentials.username);
        if (lockoutTime > 0) {
          throw new Error(`Terlalu banyak percobaan login gagal. Akun Anda diblokir selama 15 menit.`);
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          // Record failed attempt for non-existent user
          recordFailedLoginAttempt(credentials.username);

          throw new Error("Username tidak ditemukan");
        }

        // Check if this is a store context switch (only check password if not a context switch)
        const isContextSwitch = credentials.password === 'STORE_CONTEXT_SWITCH';

        if (!isContextSwitch) {
          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            // Record failed attempt for wrong password
            recordFailedLoginAttempt(credentials.username);

            // Check if user is now locked
            const updatedLockoutTime = getLockoutTimeRemaining(credentials.username);
            if (updatedLockoutTime > 0) {
              throw new Error(`Terlalu banyak percobaan login gagal. Akun Anda diblokir selama 15 menit.`);
            }

            throw new Error("Password salah");
          }

          // Reset login attempts on successful login
          resetLoginAttempts(credentials.username);
        } else {
          // For context switching, verify user exists but doesn't need password validation
          // Additional checks are done below for store access
        }

        // Cek apakah user memiliki role global (MANAGER atau WAREHOUSE)
        const isGlobalRole = user.role === 'MANAGER' || user.role === 'WAREHOUSE';

        // Jika bukan role global, cek apakah user memiliki akses ke toko
        let storeAccess = null;
        if (!isGlobalRole) {
          const storeUsers = await prisma.storeUser.findMany({
            where: {
              userId: user.id,
              status: 'AKTIF', // Changed from 'ACTIVE' to 'AKTIF' to match the database value
            },
            include: {
              store: true,
            },
          });

          // Default ke toko pertama jika tersedia
          if (storeUsers.length > 0) {
            storeAccess = {
              id: storeUsers[0].store.id,
              name: storeUsers[0].store.name,
              role: storeUsers[0].role,
            };
          }
        }

        // If user is trying to switch store context (for any role)
        if (isContextSwitch && credentials.selectedStoreId && credentials.selectedStoreRole) {
          const userStoreAccess = await prisma.storeUser.findFirst({
            where: {
              userId: user.id,
              storeId: credentials.selectedStoreId,
              status: 'AKTIF',
              role: credentials.selectedStoreRole,
            },
            include: {
              store: true,
            },
          });

          // Ensure the user actually has the requested role in that store
          if (userStoreAccess) {
            storeAccess = {
              id: userStoreAccess.store.id,
              name: userStoreAccess.store.name,
              role: userStoreAccess.role,
            };
          } else {
            // User doesn't have the requested role in that store, or store not found
            throw new Error(`Anda tidak memiliki akses ${credentials.selectedStoreRole} untuk toko ini.`);
          }
        }

        // For non-global roles, use the role from store context instead of user.role
        const userRole = isGlobalRole ? user.role : (storeAccess?.role || user.role);

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: userRole,
          employeeNumber: user.employeeNumber,
          isGlobalRole,
          storeAccess,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Use the role from store context if it exists, otherwise use user's global role
        token.role = user.role; // Keep the role assigned during authorization
        token.username = user.username;
        token.employeeNumber = user.employeeNumber;
        token.isGlobalRole = user.isGlobalRole;
        token.storeAccess = user.storeAccess; // Informasi akses toko
        token.storeId = user.storeAccess?.id; // Untuk akses cepat
        token.storeRole = user.storeAccess?.role; // Role di toko ini
        // Set the effective role to be used in the application - this is what matters for permissions
        token.effectiveRole = user.isGlobalRole ? user.role : (user.storeAccess?.role || user.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        // Use effective role which represents the actual role in the current context
        session.user.role = token.effectiveRole;
        session.user.username = token.username;
        session.user.employeeNumber = token.employeeNumber;
        session.user.isGlobalRole = token.isGlobalRole;
        session.user.storeAccess = token.storeAccess;
        session.user.storeId = token.storeId;
        session.user.storeRole = token.storeRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
