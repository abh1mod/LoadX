import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Check,
  X,
  Ban,
  Unlock,
  Trash2,
  FileText,
  Eye,
  Building2,
  ShieldCheck,
  Clock,
  AlertTriangle
} from 'lucide-react';
import api from '../../api/axios';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/formatters';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('ALL'); // ALL, PENDING, VERIFIED, REJECTED, BLOCKED
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals & Drawers
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [userToReject, setUserToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusTab !== 'ALL') params.status = statusTab;
      if (roleFilter) params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/users', { params });
      if (res.data?.success) {
        setUsers(res.data.data.users);
      }
    } catch (err) {
      toast.error('Failed to load users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [statusTab, roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleVerify = async (user) => {
    try {
      const res = await api.patch(`/admin/users/${user._id}/verify`);
      if (res.data?.success) {
        toast.success(`User ${user.name} verified successfully!`);
        fetchUsers();
        if (selectedUser?._id === user._id) setSelectedUser(null);
      }
    } catch (err) {
      toast.error('Verification failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenReject = (user) => {
    setUserToReject(user);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!userToReject) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/users/${userToReject._id}/reject`, {
        reason: rejectionReason || 'Documentation failed verification checks.'
      });
      if (res.data?.success) {
        toast.success(`User ${userToReject.name} registration rejected.`);
        setRejectModalOpen(false);
        setUserToReject(null);
        fetchUsers();
        if (selectedUser?._id === userToReject._id) setSelectedUser(null);
      }
    } catch (err) {
      toast.error('Rejection failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async (user) => {
    if (!window.confirm(`Are you sure you want to block ${user.name}? They will be immediately locked out.`)) return;
    try {
      const res = await api.patch(`/admin/users/${user._id}/block`);
      if (res.data?.success) {
        toast.success(`User ${user.name} has been blocked.`);
        fetchUsers();
        if (selectedUser?._id === user._id) setSelectedUser(null);
      }
    } catch (err) {
      toast.error('Block failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUnblock = async (user) => {
    try {
      const res = await api.patch(`/admin/users/${user._id}/unblock`);
      if (res.data?.success) {
        toast.success(`User ${user.name} has been unblocked.`);
        fetchUsers();
        if (selectedUser?._id === user._id) setSelectedUser(null);
      }
    } catch (err) {
      toast.error('Unblock failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently remove ${user.name}? This soft-deletes the user record.`)) return;
    try {
      const res = await api.delete(`/admin/users/${user._id}`);
      if (res.data?.success) {
        toast.success(`User ${user.name} removed.`);
        fetchUsers();
        if (selectedUser?._id === user._id) setSelectedUser(null);
      }
    } catch (err) {
      toast.error('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const columns = [
    {
      header: 'Company / Name',
      key: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.companyName || row.name}</span>
          <span className="text-xs text-slate-500">{row.name} • {row.city || 'India'}</span>
        </div>
      )
    },
    {
      header: 'Role',
      key: 'role',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
          row.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
          row.role === 'SUPPLIER' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
        }`}>
          {row.role}
        </span>
      )
    },
    {
      header: 'Contact',
      key: 'email',
      className: 'whitespace-nowrap',
      render: (row) => (
        <div className="text-xs">
          <p className="text-slate-800 font-mono">{row.email}</p>
          <p className="text-slate-400">{row.phone || 'No phone'}</p>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      className: 'whitespace-nowrap',
      render: (row) => <Badge status={row.status} size="sm" />
    },
    {
      header: 'Docs',
      key: 'documents',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {row.documents?.length || 0} files
        </span>
      )
    },
    {
      header: 'Joined',
      key: 'createdAt',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(row.createdAt)}</span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      className: 'whitespace-nowrap',
      render: (row) => {
        if (row.role === 'ADMIN') return null;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedUser(row)}
              className="px-2"
              title="View Profile Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>

            {row.status === 'PENDING' && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleVerify(row)}
                  className="px-2 text-xs"
                  title="Verify User"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Verify
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleOpenReject(row)}
                  className="px-2 text-xs"
                  title="Reject User"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
              </>
            )}

            {row.status === 'VERIFIED' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBlock(row)}
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 text-xs"
                title="Block User"
              >
                <Ban className="w-3.5 h-3.5" />
              </Button>
            )}

            {row.status === 'BLOCKED' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnblock(row)}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 text-xs"
                title="Unblock User"
              >
                <Unlock className="w-3.5 h-3.5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row)}
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2"
              title="Soft Delete User"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brand-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary tracking-tight">User Approvals & Verification</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-primary-light text-brand-primary border border-brand-primary-border">
              Enterprise Base
            </span>
          </div>
          <p className="text-xs text-brand-text-secondary mt-1">
            Review submitted company documents, verify pending carriers, and enforce platform security.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border overflow-x-auto pb-2">
        {['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'BLOCKED'].map((tab) => {
          const isActive = statusTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'text-white shadow-xs'
                  : 'bg-white text-brand-text-secondary border border-brand-border hover:bg-brand-bg-secondary'
              }`}
              style={isActive ? { backgroundColor: 'var(--color-primary)' } : {}}
            >
              {tab === 'ALL' ? 'All Accounts' : tab}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-brand-text-muted absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, contact person, email or city..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)] focus:border-[var(--color-primary)] placeholder:text-brand-text-muted"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)] focus:border-[var(--color-primary)] bg-white text-brand-text-primary"
          >
            <option value="">All Roles</option>
            <option value="SUPPLIER">Shippers / Suppliers</option>
            <option value="TRANSPORTER">Carriers / Transporters</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users found matching current filters."
        onRowClick={(user) => setSelectedUser(user)}
      />

      {/* User Detail Modal / Drawer */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.companyName || selectedUser?.name || 'User Profile'}
        subtitle={`Role: ${selectedUser?.role} • Status: ${selectedUser?.status}`}
        size="lg"
        footer={
          selectedUser && selectedUser.role !== 'ADMIN' && (
            <div className="flex gap-2">
              {selectedUser.status === 'PENDING' && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleVerify(selectedUser)}
                  >
                    Approve Verification
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleOpenReject(selectedUser)}
                  >
                    Reject Application
                  </Button>
                </>
              )}
              {selectedUser.status === 'VERIFIED' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleBlock(selectedUser)}
                >
                  Block Account
                </Button>
              )}
              {selectedUser.status === 'BLOCKED' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleUnblock(selectedUser)}
                >
                  Unblock Account
                </Button>
              )}
            </div>
          )
        }
      >
        {selectedUser && (
          <div className="space-y-5 text-xs text-brand-text-secondary">
            {/* Status Alert if not verified */}
            {selectedUser.status === 'REJECTED' && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                <strong>Rejection Reason:</strong> {selectedUser.rejectionReason}
              </div>
            )}

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-4 bg-brand-bg-secondary p-4 rounded-xl border border-brand-border">
              <div>
                <span className="text-brand-text-muted font-medium block">Contact Person</span>
                <span className="font-semibold text-brand-text-primary text-sm">{selectedUser.name}</span>
              </div>
              <div>
                <span className="text-brand-text-muted font-medium block">Email Address</span>
                <span className="font-semibold text-brand-text-primary text-sm font-mono">{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-brand-text-muted font-medium block">Phone</span>
                <span className="font-semibold text-brand-text-primary text-sm">{selectedUser.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-brand-text-muted font-medium block">Location</span>
                <span className="font-semibold text-brand-text-primary text-sm">{selectedUser.city}, {selectedUser.state}</span>
              </div>
              <div>
                <span className="text-brand-text-muted font-medium block">GST Number</span>
                <span className="font-semibold text-brand-text-primary text-sm font-mono">{selectedUser.gstNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-brand-text-muted font-medium block">PAN Number</span>
                <span className="font-semibold text-brand-text-primary text-sm font-mono">{selectedUser.panNumber || 'N/A'}</span>
              </div>
            </div>

            {/* Transporter specific details */}
            {selectedUser.role === 'TRANSPORTER' && (
              <div className="p-4 rounded-xl border border-brand-primary-border bg-brand-primary-light/40">
                <h4 className="font-bold text-brand-primary mb-2">Fleet Specifications</h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <p>License: <strong className="font-mono text-brand-text-primary">{selectedUser.transporterFields?.licenseNumber || 'N/A'}</strong></p>
                  <p>Fleet Size: <strong className="text-brand-text-primary">{selectedUser.transporterFields?.fleetSize || 0} Vehicles</strong></p>
                </div>
                <div>
                  <span className="text-brand-text-muted block mb-1">Registered Vehicle Classes:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedUser.transporterFields?.vehicleTypes?.map((vt) => (
                      <span key={vt} className="px-2 py-0.5 rounded bg-white border border-brand-primary-border text-brand-primary text-[11px] font-medium">
                        {vt}
                      </span>
                    )) || <span className="text-brand-text-muted">None specified</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Documents Viewer Section */}
            <div>
              <h4 className="font-bold text-brand-text-primary mb-2.5">Uploaded Verification Documents</h4>
              {selectedUser.documents?.length === 0 ? (
                <p className="text-brand-text-muted italic">No documents attached.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedUser.documents?.map((doc, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-brand-border bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-5 h-5 text-brand-primary shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-brand-text-primary truncate">{doc.type}</p>
                          <p className="text-[10px] text-brand-text-muted truncate">{doc.originalName || 'document'}</p>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 px-2.5 py-1 rounded bg-brand-primary-light hover:brightness-95 text-brand-primary text-xs font-semibold shrink-0"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject User Application"
        subtitle={`Specify the reason for rejecting ${userToReject?.name}`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleConfirmReject}>
              Confirm Rejection
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-brand-text-secondary">
            This reason will be displayed to the user when they attempt to log in.
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            placeholder="e.g. GST certificate mismatch or invalid transporter license permit copy..."
            className="w-full p-2.5 text-xs border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500 placeholder:text-brand-text-muted"
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;
