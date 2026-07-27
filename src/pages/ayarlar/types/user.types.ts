export interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = "active" | "deactive";
