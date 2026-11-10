import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  UserX,
  Shield,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import VaultLayout from "../../layouts/VaultLayout";
import ConfirmModal from "../../components/ConfirmModal";
import { useAuth } from "../../context/useAuth";
import {
  getAdminUsers,
  updateUserStatus,
  updateUserRole,
} from "../../services/adminService";

const ROLES = ["ADMIN", "ACCOUNT_HOLDER", "AUDITOR"];
const STATUSES = ["ACTIVE", "SUSPENDED"];

function AdminUsers() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalUsers: 0,
    totalPages: 1,
  });

  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: null,
    confirmText: "",
    confirmVariant: "danger",
    onConfirm: null,
  });

  // Role Change Modal State
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState("");

  const fetchUsersData = async (targetPage = page) => {
    return await getAdminUsers({
      page: targetPage,
      limit: 10,
      role: roleFilter,
      status: statusFilter,
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await getAdminUsers({
          page,
          limit: 10,
          role: roleFilter,
          status: statusFilter,
        });

        if (isMounted) {
          setUsers(data.users || []);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err.response?.data?.message || "Failed to load user directory."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [page, roleFilter, statusFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setErrorMessage("");
    try {
      const data = await fetchUsersData(page);
      setUsers(data.users || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to load user directory."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setLoading(true);
    setPage(newPage);
  };

  // Open confirmation for status change (Suspend / Reactivate)
  const promptStatusChange = (targetUser, newStatus) => {
    const isSuspending = newStatus === "SUSPENDED";
    setConfirmModal({
      isOpen: true,
      title: isSuspending ? "Suspend User Access" : "Reactivate User Access",
      message: isSuspending ? (
        <span>
          Are you sure you want to suspend <strong>{targetUser.name}</strong> (
          <code>{targetUser.email}</code>)? Suspended users cannot sign in or
          perform financial actions.
        </span>
      ) : (
        <span>
          Are you sure you want to reactivate access for{" "}
          <strong>{targetUser.name}</strong> (<code>{targetUser.email}</code>)?
        </span>
      ),
      confirmText: isSuspending ? "Suspend User" : "Reactivate User",
      confirmVariant: isSuspending ? "danger" : "primary",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          setErrorMessage("");
          setSuccessMessage("");

          const result = await updateUserStatus(targetUser._id, newStatus);
          setSuccessMessage(
            result.message ||
              `User successfully ${
                isSuspending ? "suspended" : "reactivated"
              }.`
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          const data = await fetchUsersData(page);
          setUsers(data.users || []);
          if (data.pagination) setPagination(data.pagination);
        } catch (err) {
          setErrorMessage(
            err.response?.data?.message || "Failed to update user status."
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Open role modal
  const openRoleModal = (targetUser) => {
    setRoleModalUser(targetUser);
    setSelectedNewRole(targetUser.role);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleRoleChangeSubmit = (e) => {
    e.preventDefault();
    if (!roleModalUser || selectedNewRole === roleModalUser.role) {
      setRoleModalUser(null);
      return;
    }

    const targetUser = roleModalUser;
    const newRole = selectedNewRole;
    setRoleModalUser(null);

    setConfirmModal({
      isOpen: true,
      title: "Confirm Role Modification",
      message: (
        <span>
          Change role of <strong>{targetUser.name}</strong> from{" "}
          <span className="pill-tag neutral">{targetUser.role}</span> to{" "}
          <span className="pill-tag success">{newRole}</span>? This will modify
          their system permissions immediately.
        </span>
      ),
      confirmText: "Update Role",
      confirmVariant: "primary",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          setErrorMessage("");
          setSuccessMessage("");

          const result = await updateUserRole(targetUser._id, newRole);
          setSuccessMessage(
            result.message || "User role updated successfully."
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          const data = await fetchUsersData(page);
          setUsers(data.users || []);
          if (data.pagination) setPagination(data.pagination);
        } catch (err) {
          setErrorMessage(
            err.response?.data?.message || "Failed to modify user role."
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Client-side search filtering
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
    );
  });

  return (
    <VaultLayout breadcrumb={[{ label: "Administration", href: "/admin" }, { label: "User Directory" }]}>
      <div className="admin-container">
          {/* Header */}
          <div className="admin-page-header">
            <div>
              <span className="eyebrow">USER ACCESS & ROLES</span>
              <h1>User Management</h1>
              <p>
                Browse platform identities, adjust permissions, and enforce
                account access states.
              </p>
            </div>

            <div className="admin-header-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRefresh}
                disabled={loading || refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "spin-icon" : ""}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="admin-alert error" role="alert">
              <AlertCircle size={20} />
              <div className="alert-content">
                <strong>Operation Failed</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="admin-alert success" role="status">
              <CheckCircle2 size={20} />
              <div className="alert-content">
                <strong>Success</strong>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="admin-filter-bar">
            <div className="filter-input-wrap">
              <Search size={18} className="filter-icon" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-search-input"
              />
            </div>

            <div className="filter-select-group">
              <div className="filter-item">
                <Filter size={16} />
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setLoading(true);
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by role"
                >
                  <option value="">All Roles</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <Filter size={16} />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setLoading(true);
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by status"
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* User Table */}
          <div className="admin-card-section">
            {loading ? (
              <div className="admin-loading-state">
                <RefreshCw size={36} className="spin-icon" />
                <p>Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="admin-empty-state">
                <Users size={36} />
                <h3>No users found</h3>
                <p>Try adjusting your search criteria or role/status filters.</p>
              </div>
            ) : (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email Address</th>
                        <th>Assigned Role</th>
                        <th>Account Status</th>
                        <th>Registered Date</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isSelf = currentAdmin?.id === u._id;
                        const isSuspended = u.status === "SUSPENDED";

                        return (
                          <tr key={u._id} className={isSelf ? "row-self" : ""}>
                            <td>
                              <div className="user-name-cell">
                                <strong>{u.name}</strong>
                                {isSelf && (
                                  <span className="self-badge">
                                    <Lock size={11} /> You (Admin)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="text-muted">{u.email}</span>
                            </td>
                            <td>
                              <span
                                className={`pill-tag role-${u.role.toLowerCase()}`}
                              >
                                {u.role === "ADMIN" && <Shield size={12} />}
                                {u.role.replaceAll("_", " ")}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`pill-tag ${
                                  isSuspended ? "warning" : "success"
                                }`}
                              >
                                {isSuspended ? (
                                  <UserX size={12} />
                                ) : (
                                  <UserCheck size={12} />
                                )}
                                {u.status}
                              </span>
                            </td>
                            <td className="text-nowrap text-muted text-xs">
                              {new Date(u.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="text-right">
                              <div className="table-actions">
                                {/* Role Change Button */}
                                <button
                                  type="button"
                                  className="btn btn-xs btn-secondary"
                                  onClick={() => openRoleModal(u)}
                                  disabled={isSelf || actionLoading}
                                  title={
                                    isSelf
                                      ? "You cannot modify your own role"
                                      : "Change user role"
                                  }
                                >
                                  Change Role
                                </button>

                                {/* Suspend / Reactivate Button */}
                                {isSuspended ? (
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-primary"
                                    onClick={() =>
                                      promptStatusChange(u, "ACTIVE")
                                    }
                                    disabled={isSelf || actionLoading}
                                    title={
                                      isSelf
                                        ? "You cannot modify your own status"
                                        : "Reactivate user account"
                                    }
                                  >
                                    Reactivate
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-danger"
                                    onClick={() =>
                                      promptStatusChange(u, "SUSPENDED")
                                    }
                                    disabled={isSelf || actionLoading}
                                    title={
                                      isSelf
                                        ? "You cannot suspend your own account"
                                        : "Suspend user account"
                                    }
                                  >
                                    Suspend
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="admin-pagination">
                  <div className="pagination-info">
                    Showing {filteredUsers.length} of {pagination.totalUsers} registered users
                  </div>

                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                    >
                      Previous
                    </button>
                    <span className="pagination-page-indicator">
                      Page {pagination.page} of {pagination.totalPages || 1}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={
                        pagination.page >= pagination.totalPages || loading
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      {/* Reusable Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        loading={actionLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() =>
          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {/* Role Selection Modal */}
      {roleModalUser && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
        >
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <ShieldAlert size={20} className="text-primary" />
                <h3 id="role-modal-title">Modify User Role</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setRoleModalUser(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRoleChangeSubmit}>
              <div className="modal-body">
                <p>
                  Update permission role for{" "}
                  <strong>{roleModalUser.name}</strong> (
                  <code>{roleModalUser.email}</code>).
                </p>

                <div className="form-group" style={{ marginTop: "16px" }}>
                  <label htmlFor="newRoleSelect">Assign New Role:</label>
                  <select
                    id="newRoleSelect"
                    value={selectedNewRole}
                    onChange={(e) => setSelectedNewRole(e.target.value)}
                    className="modal-select-input"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedNewRole === "ADMIN" && (
                  <div
                    className="admin-alert warning"
                    style={{ marginTop: "14px", padding: "10px" }}
                  >
                    <AlertCircle size={18} />
                    <p style={{ margin: 0, fontSize: "12px" }}>
                      Granting <strong>ADMIN</strong> role gives full administrative
                      rights over all users and accounts.
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRoleModalUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={selectedNewRole === roleModalUser.role}
                >
                  Proceed to Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </VaultLayout>
  );
}

export default AdminUsers;
