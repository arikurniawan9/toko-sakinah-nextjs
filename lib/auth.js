import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";

// Function to get the current session
export async function getSession() {
  return await getServerSession(authOptions);
}

// Function to check if user has a specific role
export async function requireAuth(requiredRole) {
  const session = await getSession();
  
  if (!session || !session.user) {
    return { authorized: false, role: null };
  }
  
  const userRole = session.user.role;
  
  if (requiredRole && userRole !== requiredRole) {
    return { authorized: false, role: userRole };
  }
  
  return { authorized: true, role: userRole };
}

// Role-based access control
export async function requireAdmin() {
  return await requireAuth('ADMIN');
}

export async function requireCashier() {
  return await requireAuth('CASHIER');
}

export async function requireAttendant() {
  return await requireAuth('ATTENDANT');
}