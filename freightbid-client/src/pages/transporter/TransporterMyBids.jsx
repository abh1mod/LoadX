import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, RefreshCw, Eye, ArrowRight, Gavel, Package } from 'lucide-react';
import api from '../../api/axios';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatINR, formatDateTime } from '../../utils/formatters';

export const TransporterMyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBids = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/shipments/my-bids');
      if (res.data?.success) {
        setBids(res.data.bids);
      }
    } catch (err) {
      console.error('Failed to load my bids:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyBids();
  }, [fetchMyBids]);

  const columns = [
    {
      header: 'Consignment Title / Route',
      key: 'shipment',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.shipment?.title || 'Shipment'}</span>
          <span className="text-xs text-slate-500">
            {row.shipment?.pickupLocation?.city} &rarr; {row.dropLocation?.city || row.shipment?.dropLocation?.city} • {row.shipment?.cargoType}
          </span>
        </div>
      )
    },
    {
      header: 'Auction Status',
      key: 'shipmentStatus',
      render: (row) => <Badge status={row.shipment?.status} size="sm" />
    },
    {
      header: 'Your Rate (INR)',
      key: 'amount',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-sm">
          {formatINR(row.amount)}
        </span>
      )
    },
    {
      header: 'Bid Outcome',
      key: 'status',
      render: (row) => {
        const outcomeColors = {
          ACTIVE: 'bg-blue-50 text-blue-700 border-blue-200',
          WON: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
          LOST: 'bg-slate-100 text-slate-500 border-slate-200'
        };
        return (
          <span className={`text-xs px-2.5 py-0.5 rounded-full border ${outcomeColors[row.status] || ''}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Last Modified',
      key: 'lastAmountChangedAt',
      render: (row) => (
        <span className="text-xs text-slate-400">
          {formatDateTime(row.lastAmountChangedAt || row.updatedAt)}
        </span>
      )
    },
    {
      header: 'Auction Room',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <Link to={`/transporter/shipments/${row.shipment?._id}`}>
          <Button variant="secondary" size="sm" className="text-xs">
            <Eye className="w-3.5 h-3.5 mr-1" />
            Enter Room
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bids & Auction History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your reverse bids, auction outcomes, and contract status across all consignments.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchMyBids} icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      <Table
        columns={columns}
        data={bids}
        loading={loading}
        emptyMessage="You haven't placed any bids yet. Browse freight loads to enter reverse auctions."
      />
    </div>
  );
};

export default TransporterMyBids;
