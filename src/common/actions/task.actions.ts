import axios from "axios";
import { buildApiUrl } from "../../common/utils/fetch.utils";

function getAuthToken() {
  return localStorage.getItem("token") || "";
}

function getHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type TaskExecutor = { id: number; name: string };

export type TaskChecklistItem = {
  id?: string;
  text: string;
  done?: boolean;
};

export type TaskFileInfo = {
  name: string;
  url: string;
  size?: number;
};

export type TaskDto = {
  id: number;
  title: string;
  description: string;
  status: string;
  recurring: boolean;
  executors: TaskExecutor[];
  counterparty: string;
  deadlineDate: string | null;
  deadlineTime: string | null;
  deadlineUntil: string | null;
  remindEnabled: boolean;
  remindWhen: string;
  remindTime: string;
  checklist: TaskChecklistItem[];
  files: TaskFileInfo[];
  author: { id: number; name: string; email: string } | null;
  authorId: number | null;
  orderId: number | null;
  queryId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskFilters = {
  status?: string;
  author?: string;
  executor?: string;
  counterparty?: string;
  deadlineDate?: string;
  taskName?: string;
  orderId?: number | string;
  queryId?: number | string;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  status?: string;
  recurring?: boolean;
  executors?: TaskExecutor[];
  counterparty?: string;
  deadlineDate?: string | null;
  deadlineTime?: string | null;
  deadlineUntil?: string | null;
  remindEnabled?: boolean;
  remindWhen?: string;
  remindTime?: string;
  checklist?: TaskChecklistItem[];
  files?: TaskFileInfo[];
  orderId?: number | null;
  queryId?: number | null;
};

export async function fetchTasksAction(filters: TaskFilters = {}): Promise<TaskDto[]> {
  try {
    const res = await axios.get(buildApiUrl("/api/task"), {
      headers: getHeaders(),
      params: filters,
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Error fetching tasks", err);
    return [];
  }
}

export async function fetchTaskByIdAction(id: number): Promise<TaskDto | null> {
  try {
    const res = await axios.get(buildApiUrl(`/api/task/${id}`), {
      headers: getHeaders(),
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching task", err);
    return null;
  }
}

export async function createTaskAction(payload: CreateTaskPayload): Promise<TaskDto> {
  const res = await axios.post(buildApiUrl("/api/task"), payload, {
    headers: getHeaders(),
  });
  return res.data;
}

export async function updateTaskAction(
  id: number,
  payload: Partial<CreateTaskPayload>,
): Promise<TaskDto> {
  const res = await axios.put(buildApiUrl(`/api/task/${id}`), payload, {
    headers: getHeaders(),
  });
  return res.data;
}

export async function deleteTaskAction(id: number): Promise<void> {
  await axios.delete(buildApiUrl(`/api/task/${id}`), {
    headers: getHeaders(),
  });
}

export async function uploadTaskFileAction(file: File): Promise<TaskFileInfo> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(buildApiUrl("/api/task/upload"), formData, {
    headers: {
      ...getHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}
