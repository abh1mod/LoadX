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
  Send
} from 'lucide-react';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Stepper from '../../components/common/Stepper';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatINR, formatDateTime, MILESTONES } from '../../utils/formatters';

export const TransporterAwarded = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Milestone advance modal state
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [nextMilestoneName, setNextMilestoneName] = useState('');
  const [advanceNote, setAdvanceNote] = useState('');
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

  const handleOpenAdvance = (shipment) => {
    const currentIdx = MILESTONES.indexOf(shipment.currentMilestone || MILESTONES[0]);
    if (currentIdx >= MILESTONES.length - 1) return;

    const nextStep = MILESTONES[currentIdx + 1];
    setSelectedShipment(shipment);
    setNextMilestoneName(nextStep);
    setAdvanceNote('');
    setAdvanceModalOpen(true);
  };

  const handleConfirmAdvance = async () => {
    if (!selectedShipment || !nextMilestoneName) return;
    setAdvanceLoading(true);
    try {
      const res = await api.patch(`/shipments/${selectedShipment._id}/milestone`, {
        milestone: nextMilestoneName,
        note: advanceNote
      });
      if (res.data?.success) {
        toast.success(`Milestone updated to '${nextMilestoneName}'!`);
        setAdvanceModalOpen(false);
        setSelectedShipment(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Awarded Freight Contracts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Execute active contracts, advance sequential transit milestones, and complete consignments.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchAwardedShipments} icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          Loading awarded contracts...
        </div>
      ) : shipments.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <Truck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No awarded contracts yet</h3>
          <p className="text-xs text-slate-500 mt-1">Place competitive bids in open reverse auctions to win freight contracts.</p>
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                        <Badge status={s.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Shipper: <strong className="text-slate-800">{s.supplier?.companyName || s.supplier?.name}</strong> • Phone: {s.supplier?.phone || 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Awarded Amount</span>
                        <span className="text-lg font-extrabold text-emerald-600 font-mono">
                          {formatINR(s.awardedAmount)}
                        </span>
                      </div>

                      {!isDelivered && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenAdvance(s)}
                          className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
                        >
                          Mark as: {nextMilestone}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}

                      {isDelivered && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4" />
                          Delivery Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Route & Vehicle Specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-semibold mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Origin (Pickup)
                      </div>
                      <p className="font-semibold text-slate-900">{s.pickupLocation?.city}, {s.pickupLocation?.state}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{s.pickupLocation?.address}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-semibold mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Destination (Delivery)
                      </div>
                      <p className="font-semibold text-slate-900">{s.dropLocation?.city}, {s.dropLocation?.state}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{s.dropLocation?.address}</p>
                    </div>
                  </div>

                  {/* Milestone Progression Stepper */}
                  <div className="pt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
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
          <p className="text-xs text-slate-600">
            You are advancing this shipment to <strong className="text-indigo-600">{nextMilestoneName}</strong>. Milestones are permanent and visible to the shipper in real time.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Transit Update Note (Optional)
            </label>
            <textarea
              rows={3}
              value={advanceNote}
              onChange={(e) => setAdvanceNote(e.target.value)}
              placeholder="e.g. Vehicle gate-in completed at factory, driver verified paperwork..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TransporterAwarded;
