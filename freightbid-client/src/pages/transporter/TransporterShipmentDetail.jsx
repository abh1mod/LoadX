import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Clock,
  IndianRupee,
  Trophy,
  ArrowLeft,
  Truck,
  MapPin,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Gavel,
  ShieldCheck,
  Send
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useShipmentSocket } from '../../hooks/useShipmentSocket';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Countdown from '../../components/common/Countdown';
import Stepper from '../../components/common/Stepper';
import toast from 'react-hot-toast';
import { formatINR, formatDateTime, parseISTDate } from '../../utils/formatters';

export const TransporterShipmentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [shipment, setShipment] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Bid form state
  const [bidAmountInput, setBidAmountInput] = useState('');
  const [expectedDeliveryHoursInput, setExpectedDeliveryHoursInput] = useState('');
  const [biddingSubmitting, setBiddingSubmitting] = useState(false);
  const [bidError, setBidError] = useState('');

  // Fetch static shipment record
  const fetchShipmentDetail = useCallback(async () => {
    try {
      const res = await api.get(`/shipments/${id}`);
      if (res.data?.success) {
        setShipment(res.data.shipment);
      }
    } catch (err) {
      toast.error('Failed to load consignment details');
    } finally {
      setLoadingInitial(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShipmentDetail();
  }, [fetchShipmentDetail]);

  // Initial & manual fetch for leaderboard & my rank
  const [liveData, setLiveData] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await api.get(`/shipments/${id}/leaderboard`);
      if (res.data?.success) {
        setLiveData(res.data.data);
        if (res.data.data.serverComputedStatus && shipment?.status !== res.data.data.serverComputedStatus) {
          setShipment((prev) => (prev ? { ...prev, status: res.data.data.serverComputedStatus } : null));
        }
        return res.data.data;
      }
    } catch {
      // silently handle
    }
    return null;
  }, [id, shipment?.status]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Real-time WebSocket connection for live reverse auction & milestone tracking
  useShipmentSocket(id, {
    onBidsUpdate: (data) => {
      setLiveData(data);
      if (data?.serverComputedStatus) {
        setShipment((prev) => (prev ? { ...prev, status: data.serverComputedStatus } : prev));
      }
    },
    onMilestoneUpdate: (data) => {
      setShipment((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: data.status || prev.status,
          currentMilestone: data.currentMilestone || prev.currentMilestone,
          milestones: data.milestones || prev.milestones
        };
      });
    },
    onShipmentUpdate: (data) => {
      setShipment((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...data
        };
      });
    }
  });

  const leaderboard = liveData?.leaderboard || [];
  const myUserId = user?._id?.toString();
  const myBidInLb = leaderboard.find((b) => b.transporterId?.toString() === myUserId);
  const myRank = liveData?.myRank ?? (myBidInLb ? myBidInLb.rank : null);
  const myBid = liveData?.myBid ?? (myBidInLb ? {
    _id: myBidInLb.bidId,
    amount: myBidInLb.amount,
    expectedDeliveryHours: myBidInLb.expectedDeliveryHours,
    lastAmountChangedAt: myBidInLb.lastAmountChangedAt,
    placedAt: myBidInLb.placedAt
  } : null);
  const lowestBid = liveData?.lowestBid;
  const totalBidders = liveData?.totalBidders || (leaderboard.length || 0);
  const currentStatus = liveData?.serverComputedStatus || shipment?.status;
  const secondsRemaining = liveData?.secondsRemaining ?? (
    shipment?.biddingEnd ? Math.max(0, Math.floor(((parseISTDate(shipment.biddingEnd)?.getTime() || 0) - Date.now()) / 1000)) : 0
  );

  // Refs to ensure initial form field values are only populated once from server data
  // and are not constantly reset when the user clears or edits the input fields
  const initializedBidIdRef = useRef(null);
  const initializedDefaultHoursRef = useRef(false);

  // Auto-populate input with current bid amount and expected delivery hours ONCE when myBid loads
  useEffect(() => {
    if (myBid && myBid._id && initializedBidIdRef.current !== myBid._id) {
      initializedBidIdRef.current = myBid._id;
      setBidAmountInput(String(myBid.amount));
      if (myBid.expectedDeliveryHours) {
        setExpectedDeliveryHoursInput(String(myBid.expectedDeliveryHours));
      }
    }
  }, [myBid]);

  // Set default value of expected delivery hours ONCE equal to difference between pickup and delivery dates if no bid
  useEffect(() => {
    if (initializedDefaultHoursRef.current || myBid) return;
    if (shipment?.pickupDate && shipment?.deliveryDeadline) {
      const p = parseISTDate(shipment.pickupDate);
      const d = parseISTDate(shipment.deliveryDeadline);
      if (p && d && d.getTime() > p.getTime()) {
        const diffHours = Math.round((d.getTime() - p.getTime()) / (1000 * 60 * 60));
        if (diffHours > 0) {
          initializedDefaultHoursRef.current = true;
          setExpectedDeliveryHoursInput(String(diffHours));
        }
      }
    }
  }, [shipment?.pickupDate, shipment?.deliveryDeadline, myBid]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setBidError('');

    const numericAmount = Number(bidAmountInput);
    if (!numericAmount || numericAmount <= 0) {
      setBidError('Please enter a valid positive bid amount.');
      return;
    }

    const numericHours = expectedDeliveryHoursInput ? Number(expectedDeliveryHoursInput) : null;
    if (numericHours !== null && (isNaN(numericHours) || numericHours <= 0)) {
      setBidError('Please enter valid expected delivery hours (positive number).');
      return;
    }

    if (shipment.basePrice && numericAmount > shipment.basePrice) {
      setBidError(`Bid cannot exceed the shipper's budget cap of ${formatINR(shipment.basePrice)}.`);
      return;
    }

    setBiddingSubmitting(true);
    try {
      const payload = {
        amount: numericAmount,
        expectedDeliveryHours: numericHours || undefined
      };
      if (myBid) {
        // Update existing bid
        const res = await api.put(`/shipments/${id}/bids/me`, payload);
        if (res.data?.success) {
          toast.success(`Bid updated to ${formatINR(numericAmount)}!`);
          fetchLeaderboard();
        }
      } else {
        // Place initial bid
        const res = await api.post(`/shipments/${id}/bids`, payload);
        if (res.data?.success) {
          toast.success(`Bid placed at ${formatINR(numericAmount)}!`);
          fetchLeaderboard();
        }
      }
    } catch (err) {
      setBidError(err.response?.data?.message || 'Bid submission failed');
    } finally {
      setBiddingSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Entering live reverse auction room...
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Shipment consignment not found.
      </div>
    );
  }

  const isOpen = currentStatus === 'OPEN';
  const isAwardedOrDelivered = ['AWARDED', 'IN_PROGRESS', 'DELIVERED'].includes(currentStatus);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <Link
              to="/transporter"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-primary)] font-semibold hover:underline mb-2.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Available Freight Loads
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-text-primary tracking-tight">{shipment.title}</h1>
              <Badge status={currentStatus} size="md" />
            </div>
            <p className="text-xs text-brand-text-secondary mt-1.5 flex flex-wrap items-center gap-2">
              <span>Shipper: <strong className="text-brand-text-primary">{shipment.supplier?.companyName || shipment.supplier?.name}</strong></span>
              <span className="text-brand-border">•</span>
              <span>Posted {formatDateTime(shipment.createdAt)}</span>
            </p>
          </div>

          {/* Right Live Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isOpen && (
              <Countdown secondsRemaining={secondsRemaining} isLive />
            )}
            {!isOpen && (
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                Auction Ended
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards: Your Rank, Lowest Bid, Budget Cap */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Prominent "Your Rank" Card */}
        <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all ${
          myRank === 1
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 ring-1 ring-emerald-500/20'
            : myRank
            ? 'bg-[var(--color-primary-light)] border-[var(--color-primary-border)] text-brand-text-primary'
            : 'bg-brand-card border-brand-border text-brand-text-primary'
        }`}>
          <div>
            <p className="text-[11px] uppercase font-bold tracking-wider text-brand-text-muted">Your Position</p>
            <h3 className="text-2xl font-extrabold mt-1 tracking-tight">
              {myRank ? (
                <span>
                  Rank #{myRank} <span className="text-xs font-semibold text-brand-text-secondary">of {totalBidders}</span>
                </span>
              ) : (
                <span className="text-brand-text-muted text-lg font-medium">Not Bid Yet</span>
              )}
            </h3>
            {myBid && (
              <div className="mt-1 space-y-0.5">
                <p className="text-xs font-mono font-bold text-[var(--color-primary)]">
                  Your Rate: {formatINR(myBid.amount)}
                </p>
                {myBid.expectedDeliveryHours && (
                  <p className="text-[11px] text-brand-text-secondary font-medium">
                    Est. Transit: <strong className="text-brand-text-primary font-mono">{myBid.expectedDeliveryHours} hrs</strong>
                  </p>
                )}
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-xs ${
            myRank === 1 ? 'bg-emerald-600 text-white' : 'bg-[var(--color-primary)] text-white'
          }`}>
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Current Lowest Bid */}
        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase font-bold tracking-wider text-brand-text-muted">Lowest Reverse Bid</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 font-mono mt-1 tracking-tight">
              {lowestBid ? formatINR(lowestBid) : 'None'}
            </h3>
            <p className="text-xs text-brand-text-secondary mt-1">
              {totalBidders} {totalBidders === 1 ? 'carrier' : 'carriers'} competing
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Shipper Base Budget */}
        <div className="bg-brand-card p-5 rounded-2xl border border-brand-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase font-bold tracking-wider text-brand-text-muted">Shipper Budget Cap</p>
            <h3 className="text-2xl font-extrabold text-brand-text-primary font-mono mt-1 tracking-tight">
              {shipment.basePrice ? formatINR(shipment.basePrice) : 'Open Bid'}
            </h3>
            <p className="text-xs text-brand-text-secondary mt-1">Maximum allowed rate</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-bg-secondary border border-brand-border text-brand-text-secondary flex items-center justify-center shadow-xs">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shipment Specs + Bid Input Box */}
        <div className="lg:col-span-1 space-y-6">
          {/* Reverse Bidding Action Card */}
          <Card
            title={myBid ? 'Revise Your Bid Rate' : 'Place Reverse Bid'}
            subtitle={isOpen ? 'Revise up or down any time while open' : 'Auction is closed for new bids'}
          >
            {isOpen ? (
              <form onSubmit={handleBidSubmit} className="space-y-4">
                {bidError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                    {bidError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
                    Your Freight Rate (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-brand-text-muted absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="1"
                      required
                      value={bidAmountInput}
                      onChange={(e) => setBidAmountInput(e.target.value)}
                      placeholder="e.g. 74000"
                      className="w-full pl-9 pr-3 py-2 text-base font-bold font-mono border border-brand-border rounded-xl focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-border)] text-brand-text-primary bg-white shadow-xs transition-all"
                    />
                  </div>
                  {shipment.basePrice && (
                    <p className="text-[11px] text-brand-text-muted mt-1.5">
                      Must be &le; {formatINR(shipment.basePrice)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
                    Expected Delivery Time (Hours) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-brand-text-muted absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="1"
                      required
                      value={expectedDeliveryHoursInput}
                      onChange={(e) => setExpectedDeliveryHoursInput(e.target.value)}
                      placeholder="e.g. 48"
                      className="w-full pl-9 pr-3 py-2 text-base font-bold font-mono border border-brand-border rounded-xl focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-border)] text-brand-text-primary bg-white shadow-xs transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-brand-text-muted mt-1.5">
                    Transit hours required for delivery (default is calculated from pickup & delivery schedule).
                  </p>
                </div>

                {/* Fast Bid Decrement Chips */}
                {lowestBid && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-brand-text-muted tracking-wider block">
                      Quick Rate Presets
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {lowestBid - 500 > 0 && (
                        <button
                          type="button"
                          onClick={() => setBidAmountInput(String(lowestBid - 500))}
                          className="py-1.5 px-1 text-center rounded-lg border border-brand-border bg-brand-bg-secondary hover:bg-[var(--color-primary-light)] hover:border-[var(--color-primary-border)] text-brand-text-primary font-mono text-[11px] transition-colors"
                        >
                          -₹500
                        </button>
                      )}
                      {lowestBid - 1000 > 0 && (
                        <button
                          type="button"
                          onClick={() => setBidAmountInput(String(lowestBid - 1000))}
                          className="py-1.5 px-1 text-center rounded-lg border border-brand-border bg-brand-bg-secondary hover:bg-[var(--color-primary-light)] hover:border-[var(--color-primary-border)] text-brand-text-primary font-mono text-[11px] transition-colors"
                        >
                          -₹1,000
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setBidAmountInput(String(lowestBid))}
                        className="py-1.5 px-1 text-center rounded-lg border border-brand-border bg-brand-bg-secondary hover:bg-[var(--color-primary-light)] hover:border-[var(--color-primary-border)] text-brand-text-primary font-mono text-[11px] transition-colors"
                      >
                        Match Lowest
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  loading={biddingSubmitting}
                  className="w-full font-semibold shadow-sm"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  {myBid ? 'Update Active Bid Rate' : 'Submit Reverse Bid'}
                </Button>

                <p className="text-[11px] text-brand-text-secondary text-center leading-relaxed">
                  Tie-breaking rule: Earlier timestamp wins if amounts match. Changing your amount resets your tie-break timer.
                </p>
              </form>
            ) : (
              <div className="py-6 text-center text-xs text-brand-text-secondary">
                <Clock className="w-8 h-8 text-brand-text-muted mx-auto mb-2" />
                <p className="font-semibold text-brand-text-primary">Reverse Auction Closed</p>
                <p className="text-[11px] text-brand-text-muted mt-1">The bidding window has reached its hard close. The shipper is reviewing bids.</p>
              </div>
            )}
          </Card>

          {/* Consignment Details */}
          <Card title="Consignment Details">
            <div className="space-y-3.5 text-xs text-brand-text-primary">
              <div className="p-3.5 rounded-xl bg-brand-bg-secondary border border-brand-border space-y-2.5">
                <div>
                  <span className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider block">Origin / Pickup</span>
                  <strong className="text-brand-text-primary text-sm">{shipment.pickupLocation?.city}, {shipment.pickupLocation?.state}</strong>
                  <p className="text-brand-text-secondary text-[11px] mt-0.5">{shipment.pickupLocation?.address}</p>
                </div>
                <div className="pt-2.5 border-t border-brand-border">
                  <span className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider block">Destination / Delivery</span>
                  <strong className="text-brand-text-primary text-sm">{shipment.dropLocation?.city}, {shipment.dropLocation?.state}</strong>
                  <p className="text-brand-text-secondary text-[11px] mt-0.5">{shipment.dropLocation?.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg bg-brand-bg-secondary border border-brand-border">
                  <span className="text-brand-text-muted text-[11px] block">Cargo</span>
                  <strong className="text-brand-text-primary">{shipment.cargoType}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-brand-bg-secondary border border-brand-border">
                  <span className="text-brand-text-muted text-[11px] block">Weight</span>
                  <strong className="text-brand-text-primary">{shipment.weight?.toLocaleString()} kg</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-brand-bg-secondary border border-brand-border">
                  <span className="text-brand-text-muted text-[11px] block">Vehicle</span>
                  <strong className="text-brand-text-primary">{shipment.vehicleTypeRequired}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-brand-bg-secondary border border-brand-border">
                  <span className="text-brand-text-muted text-[11px] block">Pickup Date</span>
                  <strong className="text-brand-text-primary">{formatDateTime(shipment.pickupDate)}</strong>
                </div>
              </div>

              {shipment.specialInstructions && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Special Instructions:</strong> {shipment.specialInstructions}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Live Leaderboard Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Live Reverse Auction Leaderboard"
            subtitle="Compare submitted rates, rankings, and competitor bids"
          >
            {leaderboard.length === 0 ? (
              <div className="py-16 text-center text-brand-text-muted text-xs">
                No bids have been submitted yet. Be the first transporter to bid!
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-xs">
                <table className="w-full text-left text-sm text-brand-text-secondary border-collapse">
                  <thead className="bg-brand-bg-secondary text-[11px] font-bold text-brand-text-muted uppercase tracking-wider border-b border-brand-border">
                    <tr>
                      <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Rank</th>
                      <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Transporter</th>
                      <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Location</th>
                      <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Bid Amount (INR)</th>
                      <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Expected Delivery</th>
                      <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Time Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {leaderboard.map((b) => {
                      const isRank1 = b.rank === 1;
                      const isMe = b.isMe;

                      return (
                        <tr
                          key={b.bidId}
                          className={`transition-colors ${
                            isMe
                              ? 'bg-[var(--color-primary-light)]/80 border-l-4 border-l-[var(--color-primary)] font-medium'
                              : isRank1
                              ? 'bg-emerald-50/60 font-medium'
                              : 'hover:bg-brand-bg-secondary/60'
                          }`}
                        >
                          <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              isRank1 ? 'bg-emerald-600 text-white' : 'bg-brand-bg-secondary text-brand-text-primary border border-brand-border'
                            }`}>
                              #{b.rank}
                            </span>
                          </td>
                          <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap font-semibold text-brand-text-primary">
                            <div className="flex items-center gap-2">
                              <span>{b.companyName}</span>
                              {isMe && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--color-primary)] text-white shadow-xs">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-brand-text-muted block font-normal">{b.transporterName}</span>
                          </td>
                          <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap text-xs text-brand-text-secondary">
                            {b.city || 'India'}
                          </td>
                          <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap font-mono font-bold text-brand-text-primary text-base">
                            {formatINR(b.amount)}
                            {isRank1 && (
                              <span className="ml-2 text-[10px] text-emerald-800 font-sans font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                                Lowest
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap text-xs font-semibold text-brand-text-primary">
                            {b.expectedDeliveryHours ? (
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Clock className="w-3.5 h-3.5 text-brand-text-muted" />
                                {b.expectedDeliveryHours} hrs
                              </span>
                            ) : (
                              <span className="text-brand-text-muted font-normal">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap text-xs text-brand-text-muted font-mono">
                            {formatDateTime(b.lastAmountChangedAt || b.placedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* If Awarded to Current Transporter */}
          {isAwardedOrDelivered && shipment.awardedTo?._id === liveData?.myBid?.transporterId && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">
                    {currentStatus === 'DELIVERED'
                      ? 'Consignment Delivery Completed & Verified!'
                      : 'Congratulations! This consignment was awarded to you.'}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {currentStatus === 'DELIVERED'
                      ? 'Delivery has been completed successfully and verified with shipper PIN.'
                      : 'Track and update the transit milestones from your Awarded Shipments tab.'}
                  </p>
                </div>
              </div>
              <Link to="/transporter/awarded">
                <Button variant="primary" size="sm" className="whitespace-nowrap shadow-sm">
                  {currentStatus === 'DELIVERED' ? 'View Milestone History \u2192' : 'Go to Milestone Updater \u2192'}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransporterShipmentDetail;
