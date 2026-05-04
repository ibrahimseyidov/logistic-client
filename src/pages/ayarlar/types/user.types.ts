export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "manager" | "operator";
export type UserStatus = "active" | "deactive";
