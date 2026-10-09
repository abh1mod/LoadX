import React, { useState, useEffect, useCallback } from 'react';
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
import { usePolling } from '../../hooks/usePolling';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Countdown from '../../components/common/Countdown';
import Stepper from '../../components/common/Stepper';
import toast from 'react-hot-toast';
import { formatINR, formatDateTime } from '../../utils/formatters';

export const TransporterShipmentDetail = () => {
  const { id } = useParams();

  const [shipment, setShipment] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Bid form state
  const [bidAmountInput, setBidAmountInput] = useState('');
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

  // Determine if auction polling should run (active while OPEN or CLOSED)
  const isAuctionLive = shipment && ['OPEN', 'CLOSED'].includes(shipment.status);

  // 1-second short polling query for leaderboard & my rank
  const pollLeaderboard = useCallback(async () => {
    const res = await api.get(`/shipments/${id}/leaderboard`);
    if (res.data?.success) {
      if (res.data.data.serverComputedStatus && shipment?.status !== res.data.data.serverComputedStatus) {
        setShipment((prev) => prev ? { ...prev, status: res.data.data.serverComputedStatus } : null);
      }
      return res.data.data;
    }
    return null;
  }, [id, shipment?.status]);

  const { data: liveData, refreshNow } = usePolling(pollLeaderboard, 1000, Boolean(isAuctionLive));

  const leaderboard = liveData?.leaderboard || [];
  const myRank = liveData?.myRank;
  const myBid = liveData?.myBid;
  const lowestBid = liveData?.lowestBid;
  const totalBidders = liveData?.totalBidders || 0;
  const currentStatus = liveData?.serverComputedStatus || shipment?.status;
  const secondsRemaining = liveData?.secondsRemaining ?? (
    shipment?.biddingEnd ? Math.max(0, Math.floor((new Date(shipment.biddingEnd).getTime() - Date.now()) / 1000)) : 0
  );

  // Auto-populate input with current bid amount if user has bid and hasn't typed
  useEffect(() => {
    if (myBid && !bidAmountInput) {
      setBidAmountInput(String(myBid.amount));
    }
  }, [myBid, bidAmountInput]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setBidError('');

    const numericAmount = Number(bidAmountInput);
    if (!numericAmount || numericAmount <= 0) {
      setBidError('Please enter a valid positive bid amount.');
      return;
    }

    if (shipment.basePrice && numericAmount > shipment.basePrice) {
      setBidError(`Bid cannot exceed the shipper's budget cap of ${formatINR(shipment.basePrice)}.`);
      return;
    }

    setBiddingSubmitting(true);
    try {
      if (myBid) {
        // Update existing bid
        const res = await api.put(`/shipments/${id}/bids/me`, { amount: numericAmount });
        if (res.data?.success) {
          toast.success(`Bid updated to ${formatINR(numericAmount)}!`);
          refreshNow();
        }
      } else {
        // Place initial bid
        const res = await api.post(`/shipments/${id}/bids`, { amount: numericAmount });
        if (res.data?.success) {
          toast.success(`Bid placed at ${formatINR(numericAmount)}!`);
          refreshNow();
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
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <Link
              to="/transporter"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Freight Loads
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{shipment.title}</h1>
              <Badge status={currentStatus} size="md" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Shipper: <strong className="text-slate-800">{shipment.supplier?.companyName || shipment.supplier?.name}</strong> • Posted {formatDateTime(shipment.createdAt)}
            </p>
          </div>

          {/* Right Live Controls */}
          <div className="flex items-center gap-2">
            {isOpen && (
              <>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live 1s Polling
                </span>
                <Countdown secondsRemaining={secondsRemaining} isLive />
              </>
            )}
            {!isOpen && (
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                Auction Ended
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards: Your Rank, Lowest Bid, Budget Cap */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Prominent "Your Rank" Card */}
        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between transition-all ${
          myRank === 1
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 ring-2 ring-emerald-500/10'
            : myRank
            ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Your Position</p>
            <h3 className="text-2xl font-extrabold mt-1">
              {myRank ? (
                <span>
                  Rank #{myRank} <span className="text-sm font-normal text-slate-500">of {totalBidders}</span>
                </span>
              ) : (
                <span className="text-slate-400 text-lg font-normal">Not Bid Yet</span>
              )}
            </h3>
            {myBid && (
              <p className="text-xs font-mono font-bold mt-1 text-indigo-700">
                Your Rate: {formatINR(myBid.amount)}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
            myRank === 1 ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
          }`}>
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Current Lowest Bid */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Lowest Reverse Bid</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
              {lowestBid ? formatINR(lowestBid) : 'None'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {totalBidders} {totalBidders === 1 ? 'carrier' : 'carriers'} competing
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Shipper Base Budget */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Shipper Budget Cap</p>
            <h3 className="text-2xl font-extrabold text-slate-800 font-mono mt-1">
              {shipment.basePrice ? formatINR(shipment.basePrice) : 'Open Bid'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Maximum allowed rate</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center">
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
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {bidError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Your Freight Rate (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="1"
                      required
                      value={bidAmountInput}
                      onChange={(e) => setBidAmountInput(e.target.value)}
                      placeholder="e.g. 74000"
                      className="w-full pl-9 pr-3 py-2 text-base font-bold font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 text-slate-900"
                    />
                  </div>
                  {shipment.basePrice && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Must be &le; {formatINR(shipment.basePrice)}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={biddingSubmitting}
                  className="w-full font-semibold shadow-md shadow-indigo-200"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  {myBid ? 'Update Active Bid Rate' : 'Submit Reverse Bid'}
                </Button>

                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  Tie-breaking rule: Earlier timestamp wins if amounts match. Changing your amount resets your tie-break timer.
                </p>
              </form>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Reverse Auction Closed</p>
                <p className="text-[11px] text-slate-400 mt-1">The bidding window has reached its hard close. The shipper is reviewing bids.</p>
              </div>
            )}
          </Card>

          {/* Consignment Details */}
          <Card title="Consignment Details">
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Origin / Pickup</span>
                  <strong className="text-slate-900">{shipment.pickupLocation?.city}, {shipment.pickupLocation?.state}</strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">{shipment.pickupLocation?.address}</p>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Destination / Delivery</span>
                  <strong className="text-slate-900">{shipment.dropLocation?.city}, {shipment.dropLocation?.state}</strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">{shipment.dropLocation?.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-400 text-[11px] block">Cargo:</span>
                  <strong className="text-slate-900">{shipment.cargoType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Weight:</span>
                  <strong className="text-slate-900">{shipment.weight?.toLocaleString()} kg</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Vehicle:</span>
                  <strong className="text-slate-900">{shipment.vehicleTypeRequired}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Pickup Date:</span>
                  <strong className="text-slate-900">{formatDateTime(shipment.pickupDate)}</strong>
                </div>
              </div>

              {shipment.specialInstructions && (
                <div className="p-2 rounded bg-amber-50 border border-amber-100 text-amber-900 text-[11px]">
                  <strong>Terms:</strong> {shipment.specialInstructions}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Live Leaderboard Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Live Reverse Auction Leaderboard"
            subtitle="Updates live every second via server polling"
            action={
              isOpen && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              )
            }
          >
            {leaderboard.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No bids have been submitted yet. Be the first transporter to bid!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 border-collapse">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Transporter</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Bid Amount (INR)</th>
                      <th className="py-3 px-4">Time Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((b) => {
                      const isRank1 = b.rank === 1;
                      const isMe = b.isMe;

                      return (
                        <tr
                          key={b.bidId}
                          className={`transition-all duration-300 ${
                            isMe
                              ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600 font-medium'
                              : isRank1
                              ? 'bg-emerald-50/40 font-medium'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              isRank1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              #{b.rank}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{b.companyName}</span>
                              {isMe && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-600 text-white shadow-xs">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 block font-normal">{b.transporterName}</span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {b.city || 'India'}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-base">
                            {formatINR(b.amount)}
                            {isRank1 && (
                              <span className="ml-2 text-[10px] text-emerald-700 font-sans font-semibold bg-emerald-100 px-1.5 py-0.2 rounded">
                                Lowest
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-400">
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
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Congratulations! This consignment was awarded to you.</h4>
                  <p className="text-xs text-emerald-700">Track and update the transit milestones from your Awarded Shipments tab.</p>
                </div>
              </div>
              <Link to="/transporter/awarded">
                <Button variant="primary" size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                  Go to Milestone Updater &rarr;
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
