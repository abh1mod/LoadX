import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Truck,
  MapPin,
  IndianRupee,
  CheckCircle,
  ArrowRight,
  Gavel
} from 'lucide-react';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Countdown from '../../components/common/Countdown';
import { formatINR, formatDateTime, parseISTDate, VEHICLE_TYPES } from '../../utils/formatters';

export const TransporterBrowse = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [search, setSearch] = useState('');

  const navigate = useNavigate();

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (vehicleFilter) params.vehicleType = vehicleFilter;
      if (cityFilter) params.city = cityFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/shipments', { params });
      if (res.data?.success) {
        setShipments(res.data.data.shipments);
      }
    } catch (err) {
      console.error('Failed to load freight shipments:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, vehicleFilter, cityFilter, search]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browse Freight Loads</h1>
          <p className="text-xs text-slate-500 mt-1">
            Discover verified industrial consignments, enter live reverse auctions, and secure return trips.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchShipments} icon={RefreshCw}>
          Refresh Auctions
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, cargo, or route..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open Auctions Only</option>
            <option value="UPCOMING">Upcoming Auctions</option>
            <option value="CLOSED">Closed (Awaiting Award)</option>
            <option value="AWARDED">Awarded</option>
          </select>
        </div>

        <div>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-white"
          >
            <option value="">All Vehicle Types</option>
            {VEHICLE_TYPES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="text"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            placeholder="Filter by city (e.g. Mumbai)..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Shipments Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          Loading freight consignment auctions...
        </div>
      ) : shipments.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <Truck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No consignments match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your filters or check back shortly for new loads.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shipments.map((s) => {
            const isOpen = s.status === 'OPEN';
            const secs = s.biddingEnd
              ? Math.max(0, Math.floor(((parseISTDate(s.biddingEnd)?.getTime() || 0) - Date.now()) / 1000))
              : 0;

            return (
              <div
                key={s._id}
                onClick={() => navigate(`/transporter/shipments/${s._id}`)}
                className="bg-white rounded-xl border border-slate-200 hover:border-indigo-400 transition-all duration-200 p-5 shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Status & Countdown Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge status={s.status} size="sm" />
                    {isOpen ? (
                      <Countdown secondsRemaining={secs} compact />
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(s.biddingEnd)}
                      </span>
                    )}
                  </div>

                  {/* Consignment Title */}
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {s.title}
                  </h3>

                  {/* Route Indicator */}
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="truncate">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Origin</span>
                      <strong className="text-slate-900 truncate">{s.pickupLocation?.city}</strong>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0 mx-2" />
                    <div className="truncate text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Destination</span>
                      <strong className="text-slate-900 truncate">{s.dropLocation?.city}</strong>
                    </div>
                  </div>

                  {/* Consignment Specs */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Vehicle Required:</span>
                      <strong className="text-slate-800">{s.vehicleTypeRequired}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Cargo Weight:</span>
                      <strong className="text-slate-800">{s.weight?.toLocaleString()} kg</strong>
                    </div>
                  </div>

                  {s.basePrice && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Max Budget Cap:</span>
                      <strong className="text-slate-900 font-mono text-sm">{formatINR(s.basePrice)}</strong>
                    </div>
                  )}

                  {/* If user has already bid */}
                  {s.hasBid && (
                    <div className="mt-3 p-2 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                      <span>Your Active Bid:</span>
                      <strong className="font-mono text-indigo-700">{formatINR(s.myBidAmount)}</strong>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Shipper: {s.supplier?.companyName || s.supplier?.name}
                  </span>
                  <Button variant="primary" size="sm" className="text-xs">
                    {isOpen ? 'Enter Auction' : 'View Details'} &rarr;
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransporterBrowse;
