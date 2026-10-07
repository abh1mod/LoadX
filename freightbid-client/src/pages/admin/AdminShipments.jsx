import React, { useEffect, useState, useCallback } from 'react';
import { Package, Search, Filter, RefreshCw, MapPin, Truck, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { formatINR, formatDateTime, formatDateOnly } from '../../utils/formatters';

export const AdminShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/shipments', { params });
      if (res.data?.success) {
        setShipments(res.data.data.shipments);
      }
    } catch (err) {
      console.error('Failed to load shipments:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const columns = [
    {
      header: 'Consignment Title / Route',
      key: 'title',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.title}</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <span className="font-medium text-slate-700">{row.pickupLocation?.city}</span>
            <span>&rarr;</span>
            <span className="font-medium text-slate-700">{row.dropLocation?.city}</span>
            <span>•</span>
            <span>{row.cargoType}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Supplier / Shipper',
      key: 'supplier',
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{row.supplier?.companyName || row.supplier?.name}</p>
          <p className="text-slate-400">{row.supplier?.email}</p>
        </div>
      )
    },
    {
      header: 'Vehicle & Weight',
      key: 'vehicleTypeRequired',
      render: (row) => (
        <div className="text-xs text-slate-600">
          <p className="font-medium">{row.vehicleTypeRequired}</p>
          <p className="text-slate-400">{row.weight?.toLocaleString()} kg</p>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <Badge status={row.status} size="sm" />
    },
    {
      header: 'Max / Awarded Price',
      key: 'basePrice',
      render: (row) => (
        <div className="text-xs">
          {row.awardedAmount ? (
            <p className="font-bold text-emerald-600 font-mono">{formatINR(row.awardedAmount)}</p>
          ) : row.basePrice ? (
            <p className="font-semibold text-slate-800 font-mono">Max: {formatINR(row.basePrice)}</p>
          ) : (
            <span className="text-slate-400">Open Bid</span>
          )}
        </div>
      )
    },
    {
      header: 'Bidding Window',
      key: 'biddingEnd',
      render: (row) => (
        <div className="text-xs text-slate-500">
          <p>End: {formatDateTime(row.biddingEnd)}</p>
        </div>
      )
    },
    {
      header: 'Awarded Carrier',
      key: 'awardedTo',
      render: (row) => (
        <div className="text-xs">
          {row.awardedTo ? (
            <div>
              <p className="font-semibold text-indigo-700">{row.awardedTo?.companyName || row.awardedTo?.name}</p>
              <p className="text-[10px] text-slate-400">{row.currentMilestone || 'Awarded'}</p>
            </div>
          ) : (
            <span className="text-slate-400 italic">Not Awarded</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Shipments Registry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Read-only registry of all active, awarded, delivered, and expired freight consignments.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchShipments}
          icon={RefreshCw}
        >
          Refresh
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search consignment title, cargo type, or cities..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
          />
        </div>
        <div className="sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN (Reverse Auction)</option>
            <option value="UPCOMING">UPCOMING</option>
            <option value="CLOSED">CLOSED (Pending Award)</option>
            <option value="AWARDED">AWARDED</option>
            <option value="IN_PROGRESS">IN_PROGRESS (Transit)</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="EXPIRED">EXPIRED (No Bids)</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={shipments}
        loading={loading}
        emptyMessage="No shipments found in platform registry."
      />
    </div>
  );
};

export default AdminShipments;
