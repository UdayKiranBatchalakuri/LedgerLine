import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Shield,
  UserCheck,
  UserX,
  Lock,
} from "lucide-react";
import AuditorNavbar from "../../components/AuditorNavbar";
import { getAdminUsers } from "../../services/adminService";

const ROLES = ["ADMIN", "ACCOUNT_HOLDER", "AUDITOR"];
const STATUSES = ["ACTIVE", "SUSPENDED"];

function AuditorUsers() {
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
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to load users."
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

  // Client search filter
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
    <div className="auditor-page-wrapper">
      <AuditorNavbar />

      <main className="auditor-main">
        <div className="auditor-container">
          {/* Header */}
          <div className="auditor-page-header">
            <div>
              <span className="eyebrow amber">IDENTITY REPOSITORY</span>
              <h1>User Directory Oversight</h1>
              <p>
                Read-only inspection of platform identities, role authorizations,
                and user access statuses.
              </p>
            </div>

            <div className="auditor-header-actions">
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
                <span>Refresh Directory</span>
              </button>
            </div>
          </div>

          {/* Feedback Banner */}
          {errorMessage && (
            <div className="admin-alert error" role="alert">
              <AlertCircle size={20} />
              <div className="alert-content">
                <strong>User Directory Error</strong>
                <p>{errorMessage}</p>
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
                <p>Retrieving user profiles from database...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="admin-empty-state">
                <Users size={36} />
                <h3>No user records found</h3>
                <p>Try clearing filters or search criteria.</p>
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
                        <th className="text-right">Permissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isSuspended = u.status === "SUSPENDED";

                        return (
                          <tr key={u._id}>
                            <td>
                              <strong>{u.name}</strong>
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
                              <span className="pill-tag neutral text-xs" title="Auditors cannot modify user records">
                                <Lock size={11} /> Read-Only
                              </span>
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
      </main>
    </div>
  );
}

export default AuditorUsers;
