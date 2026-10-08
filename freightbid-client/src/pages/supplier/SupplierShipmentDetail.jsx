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
  Award
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
import { formatINR, formatDateTime } from '../../utils/formatters';

export const SupplierShipmentDetail = () => {
  const { id } = useParams();

  const [shipment, setShipment] = useState(null);
  const [review, setReview] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Award modal state
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [bidToAward, setBidToAward] = useState(null);
  const [awardLoading, setAwardLoading] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

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

  const { data: liveData } = usePolling(pollBids, 1000, Boolean(isAuctionActive));

  const leaderboard = liveData?.leaderboard || [];
  const lowestBid = liveData?.lowestBid;
  const secondsRemaining = liveData?.secondsRemaining ?? (
    shipment?.biddingEnd ? Math.max(0, Math.floor((new Date(shipment.biddingEnd).getTime() - Date.now()) / 1000)) : 0
  );
  const currentStatus = liveData?.serverComputedStatus || shipment?.status;

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
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <Link
              to="/supplier/shipments"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to My Shipments
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{shipment.title}</h1>
              <Badge status={currentStatus} size="md" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ID: <span className="font-mono text-slate-700">{shipment._id}</span> • Posted {formatDateTime(shipment.createdAt)}
            </p>
          </div>

          {/* Right Auction Controls */}
          <div className="flex flex-col sm:items-end gap-2">
            {currentStatus === 'OPEN' && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live 1s Polling
                </span>
                <Countdown secondsRemaining={secondsRemaining} isLive />
              </div>
            )}

            {isClosed && (
              <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                Auction Ended • Award winning carrier below
              </div>
            )}

            {currentStatus === 'DELIVERED' && !review && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setReviewModalOpen(true)}
                icon={Star}
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
        <Card title="Consignment Route & Cargo" className="md:col-span-2">
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-medium block">Pickup Point (Origin)</span>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">{shipment.pickupLocation?.city}, {shipment.pickupLocation?.state}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{shipment.pickupLocation?.address} - {shipment.pickupLocation?.pincode}</p>
                <p className="text-slate-500 text-[11px] mt-1">Pickup Date: <strong>{formatDateTime(shipment.pickupDate)}</strong></p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Delivery Point (Destination)</span>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">{shipment.dropLocation?.city}, {shipment.dropLocation?.state}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{shipment.dropLocation?.address} - {shipment.dropLocation?.pincode}</p>
                <p className="text-slate-500 text-[11px] mt-1">Deadline: <strong>{formatDateTime(shipment.deliveryDeadline)}</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <span className="text-slate-400 font-medium block">Cargo Type</span>
                <span className="font-semibold text-slate-800">{shipment.cargoType}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Weight</span>
                <span className="font-semibold text-slate-800">{shipment.weight?.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Vehicle Required</span>
                <span className="font-semibold text-slate-800">{shipment.vehicleTypeRequired}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Budget Cap</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {shipment.basePrice ? formatINR(shipment.basePrice) : 'Open'}
                </span>
              </div>
            </div>

            {shipment.specialInstructions && (
              <div className="p-2.5 rounded bg-amber-50/60 border border-amber-100 text-amber-900 text-[11px]">
                <strong>Instructions:</strong> {shipment.specialInstructions}
              </div>
            )}
          </div>
        </Card>

        {/* Current Best Bid Card */}
        <Card title="Current Lowest Bid" className="flex flex-col justify-between">
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <Trophy className="w-6 h-6" />
            </div>
            <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Lowest Reverse Bid</p>
            <p className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">
              {lowestBid ? formatINR(lowestBid) : shipment.awardedAmount ? formatINR(shipment.awardedAmount) : 'No Bids Yet'}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Total Bidders: <strong>{leaderboard.length || (shipment.awardedBid ? 1 : 0)}</strong>
            </p>
          </div>

          <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-3">
            {isClosed
              ? 'Window has closed. You can award to any carrier below.'
              : isAwardedOrBeyond
              ? 'Consignment awarded. Carrier is executing milestones.'
              : 'Updates live every second as carriers bid.'}
          </div>
        </Card>
      </div>

      {/* MILESTONE TIMELINE (If Awarded) */}
      {isAwardedOrBeyond && (
        <Card
          title="Consignment Transit Milestones"
          subtitle={`Contract awarded to ${shipment.awardedTo?.companyName || shipment.awardedTo?.name}`}
        >
          <div className="py-2">
            <Stepper
              milestones={shipment.milestones || []}
              currentMilestone={shipment.currentMilestone || 'Awarded'}
            />
          </div>

          {/* Review if already submitted */}
          {review && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Your Transporter Review</span>
                <RatingStars rating={review.rating} size="sm" showValue />
              </div>
              <p className="text-xs text-slate-600 italic">"{review.comment}"</p>
            </div>
          )}
        </Card>
      )}

      {/* LIVE BIDS LEADERBOARD TABLE */}
      {(!isAwardedOrBeyond || leaderboard.length > 0) && (
        <Card
          title="Live Bidders & Reverse Auction Ranking"
          subtitle="Rank 1 is lowest amount. Ties resolved by earliest bid time."
          action={
            currentStatus === 'OPEN' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live 1s Polling Active
              </span>
            )
          }
        >
          {leaderboard.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No bids have been submitted yet for this consignment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Transporter / Company</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Bid Amount (INR)</th>
                    <th className="py-3 px-4">Last Modified</th>
                    {isClosed && <th className="py-3 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((b) => {
                    const isRank1 = b.rank === 1;
                    return (
                      <tr
                        key={b.bidId}
                        className={`transition-colors ${isRank1 ? 'bg-emerald-50/40 font-medium' : 'hover:bg-slate-50'}`}
                      >
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            isRank1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            #{b.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {b.companyName}
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
                        {isClosed && (
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenAward(b)}
                              className="text-xs bg-indigo-600 hover:bg-indigo-700"
                            >
                              <Award className="w-3.5 h-3.5 mr-1" />
                              Award Contract
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
            <Button variant="primary" loading={awardLoading} onClick={handleConfirmAward}>
              Confirm & Award Contract
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            You are selecting <strong className="text-slate-900">{bidToAward?.companyName}</strong> at a final contract price of <strong className="text-emerald-700 text-sm font-mono">{bidToAward ? formatINR(bidToAward.amount) : ''}</strong>.
          </p>
          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800">
            <strong>Business Rule:</strong> You are free to award to any bidder regardless of rank. This selection is final and initiates sequential transit milestones.
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
            <Button variant="primary" loading={reviewLoading} onClick={handleSubmitReview}>
              Submit Public Review
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Feedback / Delivery Comments
            </label>
            <textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="e.g. Excellent cold chain maintenance, driver arrived punctually, and cargo was unloaded without damage..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupplierShipmentDetail;
