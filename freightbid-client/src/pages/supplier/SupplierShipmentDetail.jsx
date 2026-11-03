import React, { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Clock,
  IndianRupee,
  MapPin,
  Truck,
  ArrowLeft,
  Trophy,
  CheckCircle2,
  Star,
  AlertCircle,
  FileCheck2,
  Calendar,
  Award,
  StopCircle,
  RefreshCw,
  Phone,
  KeyRound,
  Check,
  Sparkles
} from 'lucide-react';
import api from '../../api/axios';
import { usePolling } from '../../hooks/usePolling';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Countdown from '../../components/common/Countdown';
import Stepper from '../../components/common/Stepper';
import Modal from '../../components/common/Modal';
import RatingStars from '../../components/common/RatingStars';
import toast from 'react-hot-toast';
import { formatINR, formatDateTime, parseISTDate } from '../../utils/formatters';

export const SupplierShipmentDetail = () => {
  const { id } = useParams();

  const [shipment, setShipment] = useState(null);
  const [review, setReview] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // End bidding modal state
  const [endBiddingModalOpen, setEndBiddingModalOpen] = useState(false);
  const [endBiddingLoading, setEndBiddingLoading] = useState(false);

  // Award modal state
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [bidToAward, setBidToAward] = useState(null);
  const [awardLoading, setAwardLoading] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationSecondsLeft, setSimulationSecondsLeft] = useState(0);

  // Simulation countdown effect
  useEffect(() => {
    if (simulationSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSimulationSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [simulationSecondsLeft]);

  // Fetch initial static shipment details
  const fetchShipmentDetail = useCallback(async () => {
    try {
      const res = await api.get(`/shipments/${id}`);
      if (res.data?.success) {
        setShipment(res.data.shipment);
        if (res.data.review) setReview(res.data.review);
      }
    } catch (err) {
      toast.error('Failed to load shipment details');
    } finally {
      setLoadingInitial(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShipmentDetail();
  }, [fetchShipmentDetail]);

  // Live polling for bids (active when shipment is OPEN or CLOSED awaiting award)
  const isAuctionActive = shipment && ['OPEN', 'CLOSED'].includes(shipment.status);

  const pollBids = useCallback(async () => {
    const res = await api.get(`/shipments/${id}/bids`);
    if (res.data?.success) {
      // If status changed on server, sync it
      if (res.data.data.serverComputedStatus && shipment?.status !== res.data.data.serverComputedStatus) {
        setShipment((prev) => prev ? { ...prev, status: res.data.data.serverComputedStatus } : null);
      }
      return res.data.data;
    }
    return null;
  }, [id, shipment?.status]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchShipmentDetail(), pollBids()]);
      toast.success('Bidding dashboard refreshed');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRunSimulation = async () => {
    if (simulationLoading || simulationSecondsLeft > 0) return;
    setSimulationLoading(true);
    try {
      const res = await api.post(`/shipments/${id}/simulate-bids`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Simulation started! 10 dummy bids will be placed over 1 minute.');
        setSimulationSecondsLeft(60);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start bidding simulation');
    } finally {
      setSimulationLoading(false);
    }
  };

  const { data: liveData } = usePolling(pollBids, 1000, Boolean(isAuctionActive));

  const leaderboard = liveData?.leaderboard || [];
  const lowestBid = liveData?.lowestBid;
  const secondsRemaining = liveData?.secondsRemaining ?? (
    shipment?.biddingEnd ? Math.max(0, Math.floor(((parseISTDate(shipment.biddingEnd)?.getTime() || 0) - Date.now()) / 1000)) : 0
  );
  const currentStatus = liveData?.serverComputedStatus || shipment?.status;

  const handleEndBidding = async () => {
    setEndBiddingLoading(true);
    try {
      const res = await api.post(`/shipments/${id}/end-bidding`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Bidding ended successfully!');
        setEndBiddingModalOpen(false);
        fetchShipmentDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end bidding');
    } finally {
      setEndBiddingLoading(false);
    }
  };

  const handleOpenAward = (bid) => {
    setBidToAward(bid);
    setAwardModalOpen(true);
  };

  const handleConfirmAward = async () => {
    if (!bidToAward) return;
    setAwardLoading(true);
    try {
      const res = await api.post(`/shipments/${id}/award`, { bidId: bidToAward.bidId });
      if (res.data?.success) {
        toast.success(`Shipment awarded to ${bidToAward.companyName}!`);
        setAwardModalOpen(false);
        setBidToAward(null);
        fetchShipmentDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Award failed');
    } finally {
      setAwardLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      toast.error('Please write a brief comment.');
      return;
    }
    setReviewLoading(true);
    try {
      const res = await api.post(`/shipments/${id}/review`, {
        rating: reviewRating,
        comment: reviewComment
      });
      if (res.data?.success) {
        toast.success('Carrier review submitted successfully!');
        setReview(res.data.review);
        setReviewModalOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">
        Loading consignment auction room...
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs">
        Shipment not found.
      </div>
    );
  }

  const isClosed = currentStatus === 'CLOSED';
  const isAwardedOrBeyond = ['AWARDED', 'IN_PROGRESS', 'DELIVERED'].includes(currentStatus);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <Link
              to="/supplier/shipments"
              className="inline-flex items-center gap-1.5 text-xs text-brand-primary font-medium hover:underline mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to My Shipments
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary tracking-tight">{shipment.title}</h1>
              <Badge status={currentStatus} size="md" />
            </div>
            <p className="text-xs text-brand-text-secondary mt-1">
              Consignment ID: <span className="font-mono text-brand-text-primary">{shipment._id}</span> • Posted {formatDateTime(shipment.createdAt)}
            </p>
          </div>

          {/* Right Auction Controls */}
          <div className="flex flex-wrap sm:items-center sm:justify-end gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={handleManualRefresh}
              loading={refreshing}
              className="cursor-pointer"
            >
              Refresh
            </Button>

            {currentStatus === 'OPEN' && (
              <div className="flex flex-wrap items-center gap-2">
                <Countdown secondsRemaining={secondsRemaining} isLive />

                <Button
                  variant="outline"
                  size="sm"
                  icon={Sparkles}
                  onClick={handleRunSimulation}
                  loading={simulationLoading}
                  disabled={simulationSecondsLeft > 0}
                  className="border-indigo-300 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 hover:border-indigo-400 font-semibold cursor-pointer shadow-xs transition-colors text-xs"
                  title="Simulate 10 dynamic transporter bids across 1 minute"
                >
                  {simulationSecondsLeft > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                      Simulating Bids ({simulationSecondsLeft}s)
                    </span>
                  ) : (
                    'Insert Dummy Bids / Run Simulation'
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEndBiddingModalOpen(true)}
                  className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  <StopCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  End Bidding Now
                </Button>
              </div>
            )}

            {isClosed && (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {shipment.biddingEndedEarly ? 'Auction Closed Early by Shipper' : 'Auction Window Closed'} • Compare Bids and Award Contract Below
                </span>
              </div>
            )}

            {currentStatus === 'DELIVERED' && !review && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setReviewModalOpen(true)}
                icon={Star}
                className="cursor-pointer"
              >
                Rate Transporter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Route Specs + Lowest Bid Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Route Card */}
        <Card title="Consignment Route & Cargo Specifications" className="md:col-span-2">
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-brand-bg-secondary rounded-xl border border-brand-border">
              <div>
                <span className="text-brand-text-muted font-medium block">Pickup Point (Origin)</span>
                <p className="font-semibold text-brand-text-primary text-sm mt-0.5">{shipment.pickupLocation?.city}, {shipment.pickupLocation?.state}</p>
                <p className="text-brand-text-secondary text-[11px] mt-0.5">{shipment.pickupLocation?.address} - {shipment.pickupLocation?.pincode}</p>
                <p className="text-brand-text-secondary text-[11px] mt-1">Pickup Date: <strong>{formatDateTime(shipment.pickupDate)}</strong></p>
              </div>
              <div>
                <span className="text-brand-text-muted font-medium block">Delivery Point (Destination)</span>
                <p className="font-semibold text-brand-text-primary text-sm mt-0.5">{shipment.dropLocation?.city}, {shipment.dropLocation?.state}</p>
                <p className="text-brand-text-secondary text-[11px] mt-0.5">{shipment.dropLocation?.address} - {shipment.dropLocation?.pincode}</p>
                <p className="text-brand-text-secondary text-[11px] mt-1">Deadline: <strong>{formatDateTime(shipment.deliveryDeadline)}</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <span className="text-brand-text-muted font-medium block">Cargo Type</span>
                <span className="font-semibold text-brand-text-primary">{shipment.cargoType}</span>
              </div>
              <div>
                <span className="text-brand-text-muted font-medium block">Weight</span>
                <span className="font-semibold text-brand-text-primary">{shipment.weight?.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-brand-text-muted font-medium block">Vehicle Required</span>
                <span className="font-semibold text-brand-text-primary">{shipment.vehicleTypeRequired}</span>
              </div>
              <div>
                <span className="text-brand-text-muted font-medium block">Budget Ceiling</span>
                <span className="font-semibold text-brand-text-primary font-mono">
                  {shipment.basePrice ? formatINR(shipment.basePrice) : 'Open'}
                </span>
              </div>
            </div>

            {shipment.specialInstructions && (
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px]">
                <strong className="font-semibold">Special Instructions:</strong> {shipment.specialInstructions}
              </div>
            )}
          </div>
        </Card>

        {/* Current Best Bid Card */}
        <Card title="Current Lowest Bid" className="flex flex-col justify-between">
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
              <Trophy className="w-6 h-6" />
            </div>
            <p className="text-[11px] uppercase font-bold text-brand-text-muted tracking-wider">Lowest Reverse Bid</p>
            <p className="text-3xl font-extrabold text-emerald-600 font-mono mt-1 tracking-tight">
              {lowestBid ? formatINR(lowestBid) : shipment.awardedAmount ? formatINR(shipment.awardedAmount) : 'No Bids Yet'}
            </p>
            <p className="text-xs text-brand-text-secondary mt-2">
              Participating Bidders: <strong className="text-brand-text-primary">{leaderboard.length || (shipment.awardedBid ? 1 : 0)}</strong>
            </p>
          </div>

          <div className="text-[11px] text-brand-text-muted text-center border-t border-brand-border pt-3">
            {isClosed
              ? 'Window has closed. You can compare transporter ratings and award below.'
              : isAwardedOrBeyond
              ? 'Consignment awarded. Carrier is executing milestones.'
              : 'Updates live every second as carriers place competitive bids.'}
          </div>
        </Card>
      </div>

      {/* MILESTONE TIMELINE (If Awarded) */}
      {isAwardedOrBeyond && (
        <Card
          title="Consignment Transit Milestones"
          subtitle={`Contract awarded to ${shipment.awardedTo?.companyName || shipment.awardedTo?.name}${
            shipment.awardedTo?.phone ? ` • Mobile: ${shipment.awardedTo.phone}` : ''
          }${
            shipment.awardedExpectedDeliveryHours || shipment.awardedBid?.expectedDeliveryHours
              ? ` • Target Transit: ${shipment.awardedExpectedDeliveryHours || shipment.awardedBid?.expectedDeliveryHours} hrs`
              : ''
          }`}
          action={
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleManualRefresh}
              loading={refreshing}
              className="text-xs cursor-pointer shadow-xs"
            >
              Refresh Milestones
            </Button>
          }
        >
          <div className="py-2">
            <Stepper
              milestones={shipment.milestones || []}
              currentMilestone={shipment.currentMilestone || 'Awarded'}
            />
          </div>

          {/* Delivery Verification PIN Box (Only visible while transit is active; hidden after delivery) */}
          {shipment.deliveryPin && shipment.status !== 'DELIVERED' && shipment.currentMilestone !== 'Delivered' && (
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                      Delivery Verification PIN
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Shipper Confidential
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Provide this 6-digit PIN to the transporter driver only after the cargo is safely delivered and inspected.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto bg-white px-4 py-2.5 rounded-xl border border-emerald-300 shadow-2xs">
                <span className="font-mono text-2xl font-black tracking-widest text-emerald-700 select-all">
                  {shipment.deliveryPin}
                </span>
              </div>
            </div>
          )}

          {/* Delivery Completed & Verified Confirmation Box */}
          {(shipment.status === 'DELIVERED' || shipment.currentMilestone === 'Delivered') && (
            <div className="mt-5 p-4 rounded-xl bg-emerald-50/90 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                      Consignment Delivered & Verified
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Check className="w-3 h-3 stroke-[3]" />
                      PIN Verified
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Delivery handover has been completed and verified with the secure PIN.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs self-start sm:self-auto">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Delivery Complete
              </span>
            </div>
          )}

          {/* Review if already submitted */}
          {review && (
            <div className="mt-6 p-4 rounded-xl bg-brand-bg-secondary border border-brand-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-brand-text-primary">Your Verified Carrier Review</span>
                <RatingStars rating={review.rating} size="sm" showValue />
              </div>
              <p className="text-xs text-brand-text-secondary italic">"{review.comment}"</p>
            </div>
          )}
        </Card>
      )}

      {/* LIVE BIDS LEADERBOARD / COMPARISON TABLE */}
      {(!isAwardedOrBeyond || leaderboard.length > 0) && (
        <Card
          title="Bid Comparison & Reverse Auction Leaderboard"
          subtitle="Rank 1 is the lowest proposed rate. Compare rates, verification, ratings, and delivery estimates."
        >
          {leaderboard.length === 0 ? (
            <div className="py-12 text-center text-brand-text-muted text-xs space-y-3">
              <p>No bids have been submitted yet for this consignment.</p>
              {currentStatus === 'OPEN' && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Sparkles}
                    onClick={handleRunSimulation}
                    loading={simulationLoading}
                    disabled={simulationSecondsLeft > 0}
                    className="border-indigo-300 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 font-semibold cursor-pointer shadow-xs inline-flex text-xs"
                    title="Simulate 10 dynamic transporter bids across 1 minute"
                  >
                    {simulationSecondsLeft > 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                        Simulating Bids ({simulationSecondsLeft}s)
                      </span>
                    ) : (
                      'Insert Dummy Bids / Run Simulation'
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {currentStatus === 'OPEN' && (
                <div className="mb-4 p-3.5 rounded-xl bg-brand-primary-light/70 border border-brand-primary-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-brand-text-primary">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                    <span>
                      Current best offer is <strong>{formatINR(lowestBid)}</strong>. Satisfied with submitted rates? You can close bidding early and award the contract right away.
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Sparkles}
                      onClick={handleRunSimulation}
                      loading={simulationLoading}
                      disabled={simulationSecondsLeft > 0}
                      className="border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 font-semibold cursor-pointer shadow-xs whitespace-nowrap text-xs"
                      title="Simulate 10 dynamic transporter bids across 1 minute"
                    >
                      {simulationSecondsLeft > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                          Simulating ({simulationSecondsLeft}s)
                        </span>
                      ) : (
                        'Insert Dummy Bids / Run Simulation'
                      )}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setEndBiddingModalOpen(true)}
                      className="whitespace-nowrap cursor-pointer shadow-xs shrink-0 text-xs"
                    >
                      <StopCircle className="w-3.5 h-3.5 mr-1" />
                      End Bidding & Award
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-xs">
              <table className="w-full text-left text-sm text-brand-text-secondary border-collapse">
                <thead className="bg-brand-bg-secondary text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider border-b border-brand-border">
                  <tr>
                    <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Rank</th>
                    <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Transporter / Fleet</th>
                    <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Mobile / Contact</th>
                    <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Rating & Verification</th>
                    <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Proposed Price (INR)</th>
                    <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Expected Delivery</th>
                    <th className="py-3.5 px-6 first:pl-7 last:pr-7 whitespace-nowrap">Bid Modified</th>
                    {isClosed && <th className="py-3.5 px-6 first:pl-7 last:pr-7 text-right whitespace-nowrap">Award Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border font-normal">
                  {leaderboard.map((b) => {
                    const isRank1 = b.rank === 1;
                    return (
                      <tr
                        key={b.bidId}
                        className={`transition-colors duration-150 ${
                          isRank1 ? 'bg-emerald-50/40 font-medium' : 'hover:bg-brand-bg-secondary/60'
                        }`}
                      >
                        <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            isRank1 ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
                          }`}>
                            #{b.rank}
                          </span>
                        </td>
                        <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap">
                          <span className="font-semibold text-brand-text-primary block">{b.companyName}</span>
                          <span className="text-xs text-brand-text-muted block font-normal">{b.transporterName} • {b.city || 'India'}</span>
                        </td>
                        <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap">
                          {b.phone ? (
                            <a
                              href={`tel:${b.phone.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-mono text-xs font-semibold transition-colors"
                              title={`Call ${b.transporterName || b.companyName}`}
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{b.phone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-brand-text-muted italic">Not available</span>
                          )}
                        </td>
                        <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1.5">
                            <RatingStars rating={b.rating || b.avgRating || 5} size="sm" showValue />
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Verified
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap font-mono font-bold text-brand-text-primary text-base">
                          {formatINR(b.amount)}
                          {isRank1 && (
                            <span className="ml-2 text-[10px] text-emerald-800 font-sans font-bold bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">
                              Best Rate
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap text-xs text-brand-text-primary font-semibold">
                          {b.expectedDeliveryHours ? (
                            <span className="inline-flex items-center gap-1 font-mono text-brand-text-primary">
                              <Clock className="w-3.5 h-3.5 text-brand-text-muted" />
                              {b.expectedDeliveryHours} hrs
                            </span>
                          ) : (
                            <span className="text-brand-text-muted font-normal">Standard schedule</span>
                          )}
                        </td>
                        <td className="py-4 px-6 first:pl-7 last:pr-7 whitespace-nowrap text-xs text-brand-text-muted">
                          {formatDateTime(b.lastAmountChangedAt || b.placedAt)}
                        </td>
                        {isClosed && (
                          <td className="py-4 px-6 first:pl-7 last:pr-7 text-right whitespace-nowrap">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenAward(b)}
                              className="text-xs cursor-pointer shadow-xs whitespace-nowrap"
                            >
                              <Award className="w-3.5 h-3.5 mr-1" />
                              Award Consignment
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </Card>
      )}

      {/* Award Confirm Modal */}
      <Modal
        isOpen={awardModalOpen}
        onClose={() => setAwardModalOpen(false)}
        title="Confirm Freight Contract Award"
        subtitle={`Award consignment to ${bidToAward?.companyName}?`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAwardModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={awardLoading} onClick={handleConfirmAward} className="cursor-pointer">
              Confirm & Award Contract
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-brand-text-secondary">
          <p>
            You are selecting <strong className="text-brand-text-primary">{bidToAward?.companyName}</strong> ({bidToAward?.transporterName}{bidToAward?.phone ? ` • Mobile: ${bidToAward.phone}` : ''}) at a final agreed contract price of <strong className="text-emerald-700 text-sm font-mono">{bidToAward ? formatINR(bidToAward.amount) : ''}</strong>
            {bidToAward?.expectedDeliveryHours ? (
              <span> with expected delivery in <strong className="text-brand-text-primary font-mono">{bidToAward.expectedDeliveryHours} hours</strong></span>
            ) : ''}.
          </p>
          <div className="p-3.5 rounded-xl bg-brand-primary-light border border-brand-primary-border text-brand-primary">
            <strong className="font-semibold">Business Rule:</strong> You are free to award to any participating carrier regardless of rank based on your preferred combination of rate, delivery timeline, and transporter reputation. This action is final and unlocks sequential transit tracking milestones.
          </div>
        </div>
      </Modal>

      {/* Rate Transporter Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Rate Carrier Delivery Performance"
        subtitle="Submit your verified review for this completed route"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={reviewLoading} onClick={handleSubmitReview} className="cursor-pointer">
              Submit Public Review
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">
              Star Rating (1 - 5)
            </label>
            <RatingStars
              rating={reviewRating}
              size="lg"
              onChange={(newVal) => setReviewRating(newVal)}
              showValue
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-1.5">
              Feedback / Delivery Comments
            </label>
            <textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="e.g. Excellent cold chain maintenance, driver arrived punctually, and cargo was unloaded without damage..."
              className="w-full p-2.5 text-xs border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)] focus:border-[var(--color-primary)] placeholder:text-brand-text-muted"
            />
          </div>
        </div>
      </Modal>

      {/* End Bidding Confirmation Modal */}
      <Modal
        isOpen={endBiddingModalOpen}
        onClose={() => setEndBiddingModalOpen(false)}
        title="End Reverse Bidding Early?"
        subtitle={`Consignment: ${shipment.title}`}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setEndBiddingModalOpen(false)}
              disabled={endBiddingLoading}
            >
              Keep Bidding Open
            </Button>
            <Button
              variant="danger"
              loading={endBiddingLoading}
              onClick={handleEndBidding}
              className="cursor-pointer"
            >
              <StopCircle className="w-4 h-4 mr-1.5" />
              Yes, End Bidding Now
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs text-brand-text-secondary leading-relaxed">
          <p>
            Ending bidding early will immediately stop the reverse auction without waiting for the countdown timer to reach zero.
          </p>

          <div className="p-3.5 rounded-xl bg-brand-bg-secondary border border-brand-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-brand-text-muted">Active Bids Received:</span>
              <strong className="text-brand-text-primary font-mono text-sm">{leaderboard.length}</strong>
            </div>
            {lowestBid && (
              <div className="flex items-center justify-between">
                <span className="text-brand-text-muted">Current Best Offer:</span>
                <strong className="text-emerald-700 font-mono text-sm">{formatINR(lowestBid)}</strong>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <p className="font-semibold">What happens next:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
              <li>The countdown timer stops immediately.</li>
              <li>Transporters will no longer be able to place or revise their bids.</li>
              <li>
                {leaderboard.length > 0
                  ? 'Consignment status transitions to CLOSED and you can award the contract to any bidder immediately.'
                  : 'Since no bids have been submitted yet, the consignment will transition to EXPIRED.'}
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupplierShipmentDetail;
