import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Truck,
  IndianRupee,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import toast from 'react-hot-toast';
import {
  CARGO_TYPES,
  VEHICLE_TYPES,
  toISTDateTimeLocal,
  toISTDateOnly,
  parseISTDate
} from '../../utils/formatters';

export const ShipmentFormPage = ({ mode = 'create' }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(mode !== 'create');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Default bidding start: 5 mins from now, end: 24h from now in IST
  const now = Date.now();
  const defaultStart = toISTDateTimeLocal(new Date(now + 5 * 60 * 1000));
  const defaultEnd = toISTDateTimeLocal(new Date(now + 24 * 3600 * 1000));
  const defaultPickup = toISTDateOnly(new Date(now + 48 * 3600 * 1000));
  const defaultDelivery = toISTDateOnly(new Date(now + 96 * 3600 * 1000));

  const [formData, setFormData] = useState({
    title: '',
    cargoType: CARGO_TYPES[0],
    weight: '',
    volume: '',
    vehicleTypeRequired: VEHICLE_TYPES[0],
    basePrice: '',
    specialInstructions: '',
    pickupDate: defaultPickup,
    deliveryDeadline: defaultDelivery,
    biddingStart: defaultStart,
    biddingEnd: defaultEnd,
    pickupLocation: {
      address: '',
      city: '',
      state: '',
      pincode: ''
    },
    dropLocation: {
      address: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  useEffect(() => {
    if (id && (mode === 'edit' || mode === 'repost')) {
      const fetchOriginal = async () => {
        try {
          const res = await api.get(`/shipments/${id}`);
          if (res.data?.success) {
            const s = res.data.shipment;
            setFormData({
              title: mode === 'repost' ? `${s.title} (Reposted)` : s.title,
              cargoType: s.cargoType || CARGO_TYPES[0],
              weight: s.weight || '',
              volume: s.volume || '',
              vehicleTypeRequired: s.vehicleTypeRequired || VEHICLE_TYPES[0],
              basePrice: s.basePrice || '',
              specialInstructions: s.specialInstructions || '',
              pickupDate: s.pickupDate ? toISTDateOnly(s.pickupDate) : defaultPickup,
              deliveryDeadline: s.deliveryDeadline ? toISTDateOnly(s.deliveryDeadline) : defaultDelivery,
              biddingStart: mode === 'edit' && s.biddingStart ? toISTDateTimeLocal(s.biddingStart) : defaultStart,
              biddingEnd: mode === 'edit' && s.biddingEnd ? toISTDateTimeLocal(s.biddingEnd) : defaultEnd,
              pickupLocation: s.pickupLocation || { address: '', city: '', state: '', pincode: '' },
              dropLocation: s.dropLocation || { address: '', city: '', state: '', pincode: '' }
            });
          }
        } catch (err) {
          toast.error('Failed to load shipment details');
          navigate('/supplier/shipments');
        } finally {
          setLoading(false);
        }
      };
      fetchOriginal();
    }
  }, [id, mode, navigate]);

  const handleFieldChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleLocationChange = (type, field, val) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: val
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Date validations
    const start = parseISTDate(formData.biddingStart);
    const end = parseISTDate(formData.biddingEnd);

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Please provide valid bidding start and end times.');
      return;
    }

    if (end <= start) {
      setError('Bidding end time must be after the bidding start time.');
      return;
    }

    if (!formData.title || !formData.weight || !formData.pickupLocation.city || !formData.dropLocation.city) {
      setError('Please provide all mandatory consignment details.');
      return;
    }

    const payload = {
      ...formData,
      biddingStart: start.toISOString(),
      biddingEnd: end.toISOString(),
      pickupDate: parseISTDate(formData.pickupDate)?.toISOString() || formData.pickupDate,
      deliveryDeadline: parseISTDate(formData.deliveryDeadline)?.toISOString() || formData.deliveryDeadline
    };

    setSubmitting(true);
    try {
      if (mode === 'repost') {
        const res = await api.post(`/shipments/${id}/repost`, payload);
        if (res.data?.success) {
          toast.success('Shipment reposted with new reverse auction window!');
          navigate(`/supplier/shipments/${res.data.shipment._id}`);
        }
      } else if (mode === 'edit') {
        const res = await api.put(`/shipments/${id}`, payload);
        if (res.data?.success) {
          toast.success('Shipment updated successfully!');
          navigate(`/supplier/shipments/${id}`);
        }
      } else {
        const res = await api.post('/shipments', payload);
        if (res.data?.success) {
          toast.success('New shipment created and scheduled for reverse bidding!');
          navigate(`/supplier/shipments/${res.data.shipment._id}`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 text-xs">
        Loading shipment form data...
      </div>
    );
  }

  const pageTitle =
    mode === 'repost'
      ? 'Repost Expired Consignment'
      : mode === 'edit'
      ? 'Edit Consignment Details'
      : 'Create New Freight Consignment';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/supplier/shipments"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Shipments
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set route, cargo parameters, and the hard-close reverse bidding window
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Consignment Overview */}
        <Card title="1. Consignment Overview" subtitle="General specifications and cargo details">
          <div className="space-y-4">
            <Input
              label="Consignment Title / Route Name"
              required
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="e.g. Industrial Automation Equipment - Mumbai to Bengaluru"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Cargo Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.cargoType}
                  onChange={(e) => handleFieldChange('cargoType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-white"
                >
                  {CARGO_TYPES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Total Weight (in KG)"
                type="number"
                min="1"
                required
                value={formData.weight}
                onChange={(e) => handleFieldChange('weight', e.target.value)}
                placeholder="e.g. 8500"
              />

              <Input
                label="Approx Volume (m³, optional)"
                type="number"
                value={formData.volume}
                onChange={(e) => handleFieldChange('volume', e.target.value)}
                placeholder="e.g. 35"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Required Vehicle Class <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.vehicleTypeRequired}
                  onChange={(e) => handleFieldChange('vehicleTypeRequired', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-white"
                >
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Base Price / Max Budget Cap (₹ INR, optional)"
                type="number"
                min="0"
                value={formData.basePrice}
                onChange={(e) => handleFieldChange('basePrice', e.target.value)}
                placeholder="e.g. 85000 (bids above this are rejected)"
                helperText="If specified, transporters cannot bid above this budget ceiling"
                icon={IndianRupee}
              />
            </div>
          </div>
        </Card>

        {/* Route Locations */}
        <Card title="2. Route & Facility Locations" subtitle="Origin dispatch yard and destination receiving bay">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pickup Location */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-indigo-700 font-semibold text-xs uppercase tracking-wide">
                <MapPin className="w-4 h-4" />
                Pickup Location (Origin)
              </div>
              <Input
                label="Facility Address / Gate No"
                required
                value={formData.pickupLocation.address}
                onChange={(e) => handleLocationChange('pickupLocation', 'address', e.target.value)}
                placeholder="Gate 4, MIDC Industrial Area"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="City"
                  required
                  value={formData.pickupLocation.city}
                  onChange={(e) => handleLocationChange('pickupLocation', 'city', e.target.value)}
                  placeholder="Mumbai"
                />
                <Input
                  label="State"
                  required
                  value={formData.pickupLocation.state}
                  onChange={(e) => handleLocationChange('pickupLocation', 'state', e.target.value)}
                  placeholder="Maharashtra"
                />
              </div>
              <Input
                label="Pincode"
                required
                value={formData.pickupLocation.pincode}
                onChange={(e) => handleLocationChange('pickupLocation', 'pincode', e.target.value)}
                placeholder="400001"
              />
              <Input
                label="Scheduled Pickup Date"
                type="date"
                required
                value={formData.pickupDate}
                onChange={(e) => handleFieldChange('pickupDate', e.target.value)}
              />
            </div>

            {/* Drop Location */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-indigo-700 font-semibold text-xs uppercase tracking-wide">
                <MapPin className="w-4 h-4" />
                Delivery Location (Destination)
              </div>
              <Input
                label="Receiving Facility Address"
                required
                value={formData.dropLocation.address}
                onChange={(e) => handleLocationChange('dropLocation', 'address', e.target.value)}
                placeholder="Plot 18, Peenya 2nd Phase"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="City"
                  required
                  value={formData.dropLocation.city}
                  onChange={(e) => handleLocationChange('dropLocation', 'city', e.target.value)}
                  placeholder="Bengaluru"
                />
                <Input
                  label="State"
                  required
                  value={formData.dropLocation.state}
                  onChange={(e) => handleLocationChange('dropLocation', 'state', e.target.value)}
                  placeholder="Karnataka"
                />
              </div>
              <Input
                label="Pincode"
                required
                value={formData.dropLocation.pincode}
                onChange={(e) => handleLocationChange('dropLocation', 'pincode', e.target.value)}
                placeholder="560058"
              />
              <Input
                label="Delivery Deadline Date"
                type="date"
                required
                value={formData.deliveryDeadline}
                onChange={(e) => handleFieldChange('deliveryDeadline', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Reverse Bidding Window & Instructions */}
        <Card
          title="3. Live Reverse Bidding Window"
          subtitle="Strict server-enforced auction window (no extensions after close)"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Bidding Starts At (IST)"
                type="datetime-local"
                required
                value={formData.biddingStart}
                onChange={(e) => handleFieldChange('biddingStart', e.target.value)}
                icon={Calendar}
                helperText="Indian Standard Time (IST)"
              />

              <Input
                label="Bidding Hard-Closes At (IST)"
                type="datetime-local"
                required
                value={formData.biddingEnd}
                onChange={(e) => handleFieldChange('biddingEnd', e.target.value)}
                icon={Clock}
                helperText="Indian Standard Time (IST) • Carriers can only bid while this window is active"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Special Handling Instructions & Consignment Terms
              </label>
              <textarea
                rows={3}
                value={formData.specialInstructions}
                onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
                placeholder="e.g. Tarpaulin waterproofing required. Driver PPE mandatory at gate. No transshipment permitted..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
              />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link to="/supplier/shipments">
            <Button variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
          >
            {mode === 'repost' ? 'Publish Reposted Auction' : mode === 'edit' ? 'Save Changes' : 'Publish Freight Consignment'}
            <CheckCircle2 className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ShipmentFormPage;
