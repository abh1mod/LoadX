import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  Truck,
  RefreshCw,
  MapPin,
  Clock,
  ArrowRight,
  FileCheck2,
  ChevronRight,
  Send,
  KeyRound
} from 'lucide-react';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Stepper from '../../components/common/Stepper';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { getSocket } from '../../socket';
import { formatINR, formatDateTime, MILESTONES } from '../../utils/formatters';

export const TransporterAwarded = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Milestone advance modal state
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [nextMilestoneName, setNextMilestoneName] = useState('');
  const [advanceNote, setAdvanceNote] = useState('');
  const [deliveryPin, setDeliveryPin] = useState('');
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);

  const fetchAwardedShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/shipments/awarded/mine');
      if (res.data?.success) {
        setShipments(res.data.shipments);
      }
    } catch (err) {
      console.error('Failed to load awarded shipments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAwardedShipments();
  }, [fetchAwardedShipments]);

  // Real-time WebSocket connection to receive live milestone updates across awarded shipments
  useEffect(() => {
    if (!shipments || shipments.length === 0) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    shipments.forEach((s) => {
      socket.emit('join_shipment', s._id);
    });

    const handleMilestoneUpdate = (data) => {
      if (!data) return;
      setShipments((prevList) =>
        prevList.map((s) => {
          if (data.shipmentId && s._id.toString() === data.shipmentId.toString()) {
            return {
              ...s,
              status: data.status || s.status,
              currentMilestone: data.currentMilestone || s.currentMilestone,
              milestones: data.milestones || s.milestones
            };
          }
          return s;
        })
      );
    };

    socket.on('milestone_updated', handleMilestoneUpdate);

    return () => {
      shipments.forEach((s) => {
        socket.emit('leave_shipment', s._id);
      });
      socket.off('milestone_updated', handleMilestoneUpdate);
    };
  }, [shipments.map((s) => s._id).join(',')]);

  const handleOpenAdvance = (shipment) => {
    const currentIdx = MILESTONES.indexOf(shipment.currentMilestone || MILESTONES[0]);
    if (currentIdx >= MILESTONES.length - 1) return;

    const nextStep = MILESTONES[currentIdx + 1];
    setSelectedShipment(shipment);
    setNextMilestoneName(nextStep);
    setAdvanceNote('');
    setDeliveryPin('');
    setAdvanceModalOpen(true);
  };

  const handleConfirmAdvance = async () => {
    if (!selectedShipment || !nextMilestoneName) return;

    if (nextMilestoneName === 'Delivered') {
      if (!deliveryPin || deliveryPin.trim().length !== 6) {
        toast.error('Please enter the 6-digit Delivery PIN provided by the shipper.');
        return;
      }
    }

    setAdvanceLoading(true);
    try {
      const payload = {
        milestone: nextMilestoneName,
        note: advanceNote
      };
      if (nextMilestoneName === 'Delivered') {
        payload.deliveryPin = deliveryPin.trim();
      }

      const res = await api.patch(`/shipments/${selectedShipment._id}/milestone`, payload);
      if (res.data?.success) {
        toast.success(`Milestone updated to '${nextMilestoneName}'!`);
        setAdvanceModalOpen(false);
        setSelectedShipment(null);
        setDeliveryPin('');
        fetchAwardedShipments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update milestone');
    } finally {
      setAdvanceLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-card p-6 rounded-2xl border border-brand-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wider border border-[var(--color-primary-border)]">
              Operational Fleet Deliveries
            </span>
          </div>
          <h1 className="text-2xl font-bold text-brand-text-primary tracking-tight">Awarded Freight Contracts</h1>
          <p className="text-xs text-brand-text-secondary mt-1">
            Execute active contracts, advance sequential transit milestones, and complete consignments.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchAwardedShipments} icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-brand-text-muted">
          Loading awarded contracts...
        </div>
      ) : shipments.length === 0 ? (
        <div className="py-16 text-center bg-brand-card rounded-2xl border border-dashed border-brand-border p-8">
          <Truck className="w-10 h-10 text-brand-text-muted mx-auto mb-3" />
          <h3 className="text-base font-bold text-brand-text-primary">No awarded contracts yet</h3>
          <p className="text-xs text-brand-text-secondary mt-1">Place competitive bids in open reverse auctions to win freight contracts.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {shipments.map((s) => {
            const currentIdx = MILESTONES.indexOf(s.currentMilestone || MILESTONES[0]);
            const isDelivered = s.status === 'DELIVERED' || currentIdx === MILESTONES.length - 1;
            const nextMilestone = !isDelivered ? MILESTONES[currentIdx + 1] : null;

            return (
              <Card key={s._id} className="overflow-hidden">
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-brand-border">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg font-bold text-brand-text-primary">{s.title}</h3>
                        <Badge status={s.status} size="sm" />
                      </div>
                      <p className="text-xs text-brand-text-secondary mt-1 flex flex-wrap items-center gap-2">
                        <span>Shipper: <strong className="text-brand-text-primary">{s.supplier?.companyName || s.supplier?.name}</strong></span>
                        <span className="text-brand-border">•</span>
                        <span>Phone: <strong className="text-brand-text-primary">{s.supplier?.phone || 'N/A'}</strong></span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <div className="text-right">
                        <span className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider block">Awarded Amount</span>
                        <span className="text-lg font-extrabold text-emerald-700 font-mono block">
                          {formatINR(s.awardedAmount)}
                        </span>
                        {(s.awardedExpectedDeliveryHours || s.awardedBid?.expectedDeliveryHours) && (
                          <span className="text-[11px] text-brand-text-secondary font-mono">
                            Est. Transit: <strong>{s.awardedExpectedDeliveryHours || s.awardedBid?.expectedDeliveryHours} hrs</strong>
                          </span>
                        )}
                      </div>

                      {!isDelivered && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenAdvance(s)}
                          className="font-semibold shadow-xs"
                        >
                          Mark as: {nextMilestone}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}

                      {isDelivered && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Delivery Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Route & Vehicle Specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-brand-border text-xs">
                    <div className="p-3.5 rounded-xl bg-brand-bg-secondary border border-brand-border">
                      <div className="flex items-center gap-1.5 text-[var(--color-primary)] font-semibold mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Origin (Pickup)
                      </div>
                      <p className="font-semibold text-brand-text-primary text-sm">{s.pickupLocation?.city}, {s.pickupLocation?.state}</p>
                      <p className="text-brand-text-secondary text-[11px] mt-0.5">{s.pickupLocation?.address}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-brand-bg-secondary border border-brand-border">
                      <div className="flex items-center gap-1.5 text-[var(--color-primary)] font-semibold mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Destination (Delivery)
                      </div>
                      <p className="font-semibold text-brand-text-primary text-sm">{s.dropLocation?.city}, {s.dropLocation?.state}</p>
                      <p className="text-brand-text-secondary text-[11px] mt-0.5">{s.dropLocation?.address}</p>
                    </div>
                  </div>

                  {/* Milestone Progression Stepper */}
                  <div className="pt-6">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-text-muted mb-4">
                      Sequential Transit Milestones
                    </h4>
                    <Stepper
                      milestones={s.milestones || []}
                      currentMilestone={s.currentMilestone || 'Awarded'}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Advance Milestone Modal */}
      <Modal
        isOpen={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        title={`Advance to Milestone: "${nextMilestoneName}"`}
        subtitle={`Consignment: ${selectedShipment?.title}`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAdvanceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={advanceLoading} onClick={handleConfirmAdvance}>
              Confirm & Update Milestone
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-brand-text-secondary leading-relaxed">
            You are advancing this shipment to <strong className="text-[var(--color-primary)] font-semibold">{nextMilestoneName}</strong>. Milestones are permanent and visible to the shipper in real time.
          </p>

          {nextMilestoneName === 'Delivered' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                <span>6-Digit Delivery Verification PIN Required</span>
              </div>
              <p className="text-xs text-amber-800 leading-normal">
                Please collect the 6-digit verification PIN from the shipper or receiver upon handover at destination to mark this consignment as Delivered.
              </p>
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={deliveryPin}
                  onChange={(e) => setDeliveryPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit PIN"
                  className="w-full text-center font-mono text-2xl tracking-[0.3em] font-extrabold py-2 px-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-brand-text-primary uppercase tracking-wider mb-1.5">
              Transit Update Note (Optional)
            </label>
            <textarea
              rows={3}
              value={advanceNote}
              onChange={(e) => setAdvanceNote(e.target.value)}
              placeholder="e.g. Vehicle gate-in completed at factory, driver verified paperwork..."
              className="w-full p-3 text-xs border border-brand-border rounded-xl focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-border)] text-brand-text-primary bg-white shadow-xs transition-all"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TransporterAwarded;
