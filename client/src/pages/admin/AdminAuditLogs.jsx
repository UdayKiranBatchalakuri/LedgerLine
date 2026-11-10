import { useEffect, useState } from "react";
import {
  FileText,
  Filter,
  RefreshCw,
  Search,
  AlertCircle,
  Eye,
  Shield,
  User,
  CreditCard,
  Clock,
  X,
} from "lucide-react";
import AdminNavbar from "../../components/AdminNavbar";
import {
  getAuditLogs,
  getAuditLogById,
} from "../../services/adminService";

const AUDIT_ACTIONS = [
  "USER_SUSPENDED",
  "USER_REACTIVATED",
  "USER_ROLE_CHANGED",
  "ACCOUNT_FROZEN",
  "ACCOUNT_ACTIVATED",
  "ACCOUNT_CLOSED",
];

const TARGET_TYPES = ["USER", "ACCOUNT"];

function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalLogs: 0,
    totalPages: 1,
  });

  const [actionFilter, setActionFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchLogsData = async (targetPage = page) => {
    return await getAuditLogs({
      page: targetPage,
      limit: 10,
      action: actionFilter,
      targetType: targetTypeFilter,
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await getAuditLogs({
          page,
          limit: 10,
          action: actionFilter,
          targetType: targetTypeFilter,
        });

        if (isMounted) {
          setLogs(data.auditLogs || []);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err.response?.data?.message ||
              "Failed to load administrative audit logs."
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
  }, [page, actionFilter, targetTypeFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setErrorMessage("");
    try {
      const data = await fetchLogsData(page);
      setLogs(data.auditLogs || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to load administrative audit logs."
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

  const openLogDetail = async (logId) => {
    try {
      setModalLoading(true);
      const data = await getAuditLogById(logId);
      setSelectedLog(data.auditLog);
    } catch {
      const fallback = logs.find((l) => l._id === logId);
      setSelectedLog(fallback || null);
    } finally {
      setModalLoading(false);
    }
  };

  // Client search filter
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const actorName = log.actor?.name?.toLowerCase() || "";
    const actorEmail = log.actor?.email?.toLowerCase() || "";
    const action = log.action.toLowerCase();
    const targetId = log.targetId?.toLowerCase() || "";
    return (
      actorName.includes(q) ||
      actorEmail.includes(q) ||
      action.includes(q) ||
      targetId.includes(q)
    );
  });

  return (
    <div className="admin-page-wrapper">
      <AdminNavbar />

      <main className="admin-main">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-page-header">
            <div>
              <span className="eyebrow">IMMUTABLE COMPLIANCE RECORDS</span>
              <h1>Administrative Audit Trail</h1>
              <p>
                Complete forensic record of user state alterations, role assignments,
                and account lifecycle operations.
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

          {/* Feedback Banner */}
          {errorMessage && (
            <div className="admin-alert error" role="alert">
              <AlertCircle size={20} />
              <div className="alert-content">
                <strong>Audit Retrieval Error</strong>
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
                placeholder="Search by administrator, action, or target ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-search-input"
              />
            </div>

            <div className="filter-select-group">
              <div className="filter-item">
                <Filter size={16} />
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setLoading(true);
                    setActionFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by audit action"
                >
                  <option value="">All Actions</option>
                  {AUDIT_ACTIONS.map((action) => (
                    <option key={action} value={action}>
                      {action.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <Filter size={16} />
                <select
                  value={targetTypeFilter}
                  onChange={(e) => {
                    setLoading(true);
                    setTargetTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by target type"
                >
                  <option value="">All Target Types</option>
                  {TARGET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="admin-card-section">
            {loading ? (
              <div className="admin-loading-state">
                <RefreshCw size={36} className="spin-icon" />
                <p>Retrieving cryptographic audit logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="admin-empty-state">
                <FileText size={36} />
                <h3>No audit records match your query</h3>
                <p>Try clearing filters or search terms.</p>
              </div>
            ) : (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>Administrator</th>
                        <th>Target Entity</th>
                        <th>Recorded Modification</th>
                        <th className="text-right">Inspection</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => {
                        const isSevere =
                          log.action.includes("SUSPEND") ||
                          log.action.includes("FROZEN") ||
                          log.action.includes("CLOSED");

                        return (
                          <tr key={log._id}>
                            <td className="text-nowrap text-xs">
                              <div className="timestamp-cell">
                                <Clock size={13} className="text-muted" />
                                {new Date(log.createdAt).toLocaleString("en-IN")}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`pill-tag ${
                                  isSevere ? "warning" : "success"
                                }`}
                              >
                                {log.action.replaceAll("_", " ")}
                              </span>
                            </td>
                            <td>
                              <div className="actor-cell">
                                <strong>{log.actor?.name || "System"}</strong>
                                <span className="text-muted text-xs">
                                  {log.actor?.email}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="target-cell">
                                <span className="pill-tag neutral">
                                  {log.targetType === "USER" ? (
                                    <User size={11} />
                                  ) : (
                                    <CreditCard size={11} />
                                  )}
                                  {log.targetType}
                                </span>
                                <code className="target-id" title={log.targetId}>
                                  {log.targetId?.slice(0, 8)}...
                                </code>
                              </div>
                            </td>
                            <td>
                              <div className="change-preview">
                                <strong>{log.changes?.field}:</strong>{" "}
                                <span className="pill-tag text-xs neutral">
                                  {log.changes?.previousValue}
                                </span>
                                <span className="arrow-sep">→</span>
                                <span className="pill-tag text-xs success">
                                  {log.changes?.newValue}
                                </span>
                              </div>
                            </td>
                            <td className="text-right">
                              <button
                                type="button"
                                className="btn btn-xs btn-secondary"
                                onClick={() => openLogDetail(log._id)}
                                title="Inspect audit entry details"
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="admin-pagination">
                  <div className="pagination-info">
                    Showing {filteredLogs.length} of {pagination.totalLogs} recorded events
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

      {/* Audit Log Detail Modal */}
      {(selectedLog || modalLoading) && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-modal-title"
        >
          <div className="modal-container audit-detail-modal">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Shield size={20} className="text-primary" />
                <h3 id="audit-modal-title">Audit Record Details</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedLog(null)}
              >
                <X size={18} />
              </button>
            </div>

            {modalLoading ? (
              <div className="admin-loading-state" style={{ padding: "30px" }}>
                <RefreshCw size={24} className="spin-icon" />
                <p>Retrieving record...</p>
              </div>
            ) : selectedLog ? (
              <div className="modal-body">
                <div className="audit-detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Log Identifier</span>
                    <code>{selectedLog._id}</code>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Event Timestamp</span>
                    <span>
                      {new Date(selectedLog.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Action Performed</span>
                    <span className="pill-tag success">
                      {selectedLog.action}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Target Entity</span>
                    <span>
                      <strong className="pill-tag neutral" style={{ marginRight: "6px" }}>
                        {selectedLog.targetType}
                      </strong>
                      <code>{selectedLog.targetId}</code>
                    </span>
                  </div>

                  <div className="detail-item full-width">
                    <span className="detail-label">Acting Administrator</span>
                    <div className="actor-detail-box">
                      <strong>{selectedLog.actor?.name || "N/A"}</strong>
                      <span className="text-muted">{selectedLog.actor?.email}</span>
                      <span className="pill-tag neutral text-xs">
                        Role: {selectedLog.actor?.role}
                      </span>
                    </div>
                  </div>

                  <div className="detail-item full-width">
                    <span className="detail-label">Applied Modifications</span>
                    <div className="diff-box">
                      <div className="diff-row">
                        <span className="diff-field">Modified Field:</span>
                        <strong>{selectedLog.changes?.field}</strong>
                      </div>
                      <div className="diff-row">
                        <span className="diff-field">Previous State:</span>
                        <code className="diff-prev">
                          {selectedLog.changes?.previousValue}
                        </code>
                      </div>
                      <div className="diff-row">
                        <span className="diff-field">New State:</span>
                        <code className="diff-new">
                          {selectedLog.changes?.newValue}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAuditLogs;
