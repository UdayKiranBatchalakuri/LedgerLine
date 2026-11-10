import api from "./api";

// Get users with pagination and filters
export const getAdminUsers = async ({
  page = 1,
  limit = 10,
  role = "",
  status = "",
} = {}) => {
  const params = { page, limit };

  if (role) params.role = role;
  if (status) params.status = status;

  const response = await api.get("/admin/users", { params });
  return response.data;
};

// Suspend or reactivate a user
export const updateUserStatus = async (userId, status) => {
  const response = await api.patch(
    `/admin/users/${userId}/status`,
    { status }
  );

  return response.data;
};

// Change a user's role
export const updateUserRole = async (userId, role) => {
  const response = await api.patch(
    `/admin/users/${userId}/role`,
    { role }
  );

  return response.data;
};

// Freeze, activate, or close an account
export const updateAccountStatus = async (accountId, status) => {
  const response = await api.patch(
    `/admin/accounts/${accountId}/status`,
    { status }
  );

  return response.data;
};

// Get all accounts for admin/auditor
export const getAdminAccounts = async () => {
  const response = await api.get("/accounts");
  return response.data;
};

// Get audit logs with pagination and filters
export const getAuditLogs = async ({
  page = 1,
  limit = 10,
  action = "",
  targetType = "",
  actor = "",
  targetId = "",
} = {}) => {
  const params = { page, limit };

  if (action) params.action = action;
  if (targetType) params.targetType = targetType;
  if (actor) params.actor = actor;
  if (targetId) params.targetId = targetId;

  const response = await api.get("/audit-logs", { params });
  return response.data;
};

// Get audit log details by ID
export const getAuditLogById = async (auditLogId) => {
  const response = await api.get(`/audit-logs/${auditLogId}`);
  return response.data;
};
