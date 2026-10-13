import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Clock,
  TrendingDown,
  CheckCircle,
  Truck,
  ArrowRight,
  Gavel,
  RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Countdown from '../../components/common/Countdown';
import Table from '../../components/common/Table';
import { formatINR, formatDateTime, parseISTDate } from '../../utils/formatters';

export const SupplierDashboard = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyShipments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shipments/mine?limit=5');
      if (res.data?.success) {
        setShipments(res.data.data.shipments);
      }
    } catch (err) {
      console.error('Failed to load supplier shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyShipments();
  }, []);

  const counts = {
    total: shipments.length,
    open: shipments.filter((s) => s.status === 'OPEN').length,
    closed: shipments.filter((s) => s.status === 'CLOSED').length,
    inProgress: shipments.filter((s) => ['AWARDED', 'IN_PROGRESS'].includes(s.status)).length,
    delivered: shipments.filter((s) => s.status === 'DELIVERED').length
  };

  const columns = [
    {
      header: 'Title / Route',
      key: 'title',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.title}</span>
          <span className="text-xs text-slate-500">
            {row.pickupLocation?.city} &rarr; {row.dropLocation?.city} • {row.cargoType}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <Badge status={row.status} size="sm" />
    },
    {
      header: 'Bids Received',
      key: 'bidsCount',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.bidsCount ?? 0} {row.bidsCount === 1 ? 'bid' : 'bids'}
        </span>
      )
    },
    {
      header: 'Lowest Bid',
      key: 'lowestBid',
      render: (row) => (
        <span className="text-xs font-bold text-emerald-600 font-mono">
          {row.lowestBid ? formatINR(row.lowestBid) : '—'}
        </span>
      )
    },
    {
      header: 'Auction Window',
      key: 'biddingEnd',
      render: (row) => {
        if (row.status === 'OPEN') {
          const secs = Math.max(0, Math.floor(((parseISTDate(row.biddingEnd)?.getTime() || 0) - Date.now()) / 1000));
          return <Countdown secondsRemaining={secs} compact />;
        }
        return <span className="text-xs text-slate-400">{formatDateTime(row.biddingEnd)}</span>;
      }
    },
    {
      header: '',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <Link to={`/supplier/shipments/${row._id}`}>
          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800">
            View Live Room &rarr;
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shipper Control Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Post freight loads, monitor real-time reverse bidding, and award freight contracts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/supplier/shipments/new">
            <Button variant="primary" icon={PlusCircle}>
              Post New Shipment
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Auctions"
          value={counts.open}
          subtitle="Carriers currently bidding"
          color="indigo"
          icon={Gavel}
        />
        <StatCard
          title="Awaiting Award"
          value={counts.closed}
          subtitle="Window closed, select winner"
          color="amber"
          icon={Clock}
        />
        <StatCard
          title="In Transit"
          value={counts.inProgress}
          subtitle="Carriers executing routes"
          color="blue"
          icon={Truck}
        />
        <StatCard
          title="Delivered"
          value={counts.delivered}
          subtitle="Completed consignments"
          color="emerald"
          icon={CheckCircle}
        />
      </div>

      {/* Active Consignments Table */}
      <Card
        title="Recent Freight Consignments"
        subtitle="Live status of your posted loads"
        action={
          <Link to="/supplier/shipments">
            <Button variant="ghost" size="sm" className="text-xs text-indigo-600">
              View All My Shipments &rarr;
            </Button>
          </Link>
        }
      >
        <Table
          columns={columns}
          data={shipments}
          loading={loading}
          emptyMessage="You haven't posted any freight consignments yet."
        />
      </Card>
    </div>
  );
};

export default SupplierDashboard;
