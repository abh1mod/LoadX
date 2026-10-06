import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Building2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { VEHICLE_TYPES } from '../../utils/formatters';

export const RegisterPage = () => {
  const { register } = useAuth();

  const [role, setRole] = useState('TRANSPORTER'); // SUPPLIER or TRANSPORTER
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    licenseNumber: '',
    fleetSize: '',
    vehicleTypes: []
  });

  // Files
  const [files, setFiles] = useState({
    gstDoc: null,
    panDoc: null,
    licenseDoc: null
  });

  const [previews, setPreviews] = useState({});

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleVehicleToggle = (vType) => {
    setFormData((prev) => {
      const exists = prev.vehicleTypes.includes(vType);
      const updated = exists
        ? prev.vehicleTypes.filter((v) => v !== vType)
        : [...prev.vehicleTypes, vType];
      return { ...prev, vehicleTypes: updated };
    });
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(`File ${file.name} exceeds the 5MB size limit.`);
      return;
    }

    setFiles((prev) => ({ ...prev, [field]: file }));

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (re) => {
        setPreviews((p) => ({ ...p, [field]: re.target.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreviews((p) => ({ ...p, [field]: 'PDF_DOC' }));
    }
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.companyName) {
      setError('Please fill in all required company contact details.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (role === 'TRANSPORTER') {
      if (!formData.licenseNumber || !formData.fleetSize) {
        setError('Please enter your transport operator license and fleet size.');
        return false;
      }
      if (formData.vehicleTypes.length === 0) {
        setError('Please select at least one vehicle type in your operating fleet.');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === 'vehicleTypes') {
          formData.vehicleTypes.forEach((vt) => payload.append('vehicleTypes', vt));
        } else {
          payload.append(key, formData[key]);
        }
      });
      payload.append('role', role);

      if (files.gstDoc) payload.append('gstDoc', files.gstDoc);
      if (files.panDoc) payload.append('panDoc', files.panDoc);
      if (files.licenseDoc) payload.append('licenseDoc', files.licenseDoc);

      await register(payload);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Application Submitted!</h2>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Your enterprise account for <strong className="text-slate-900">{formData.companyName}</strong> has been registered with status <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">PENDING VERIFICATION</span>.
          </p>
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-left text-xs text-slate-500 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Platform administrators are reviewing your submitted tax documents & licenses.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>You will be granted full bidding access once verification is approved.</span>
            </div>
          </div>
          <div className="mt-8">
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Proceed to Login Page
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Truck className="w-5 h-5" />
            </div>
          </Link>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
            Register for LoadX
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Join the enterprise network for reverse freight auctions
          </p>
        </div>

        {/* Role Selector Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Select Enterprise Role
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => { setRole('TRANSPORTER'); setStep(1); }}
              className={`p-4 rounded-xl border text-left transition-all ${
                role === 'TRANSPORTER'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Truck className={`w-5 h-5 ${role === 'TRANSPORTER' ? 'text-indigo-600' : 'text-slate-400'}`} />
                {role === 'TRANSPORTER' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Transporter / Carrier</h3>
              <p className="text-[11px] text-slate-500 mt-1">Fleet operators placing reverse bids on freight loads</p>
            </button>

            <button
              type="button"
              onClick={() => { setRole('SUPPLIER'); setStep(1); }}
              className={`p-4 rounded-xl border text-left transition-all ${
                role === 'SUPPLIER'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Building2 className={`w-5 h-5 ${role === 'SUPPLIER' ? 'text-indigo-600' : 'text-slate-400'}`} />
                {role === 'SUPPLIER' && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Shipper / Supplier</h3>
              <p className="text-[11px] text-slate-500 mt-1">Manufacturers posting full-truckload consignments</p>
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between mb-6 px-2 text-xs font-medium text-slate-400">
          <span className={step >= 1 ? 'text-indigo-600 font-bold' : ''}>1. Company Info</span>
          <span className="w-8 h-0.5 bg-slate-200" />
          {role === 'TRANSPORTER' && (
            <>
              <span className={step >= 2 ? 'text-indigo-600 font-bold' : ''}>2. Fleet Profile</span>
              <span className="w-8 h-0.5 bg-slate-200" />
            </>
          )}
          <span className={(role === 'TRANSPORTER' ? step >= 3 : step >= 2) ? 'text-indigo-600 font-bold' : ''}>
            {role === 'TRANSPORTER' ? '3. Verification Docs' : '2. Verification Docs'}
          </span>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* STEP 1: Company Profile */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100">
                  Company & Contact Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Authorized Contact Person"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                  />
                  <Input
                    label="Company / Enterprise Name"
                    required
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="e.g. Apex Cargo Lines Ltd"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Business Email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="dispatch@company.com"
                  />
                  <Input
                    label="Mobile Phone"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <Input
                  label="Password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Min 6 characters"
                  helperText="Choose a secure password for portal sign-in"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="GST Number"
                    value={formData.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                    placeholder="27AABCA1234F1Z8"
                  />
                  <Input
                    label="PAN Card Number"
                    value={formData.panNumber}
                    onChange={(e) => handleInputChange('panNumber', e.target.value)}
                    placeholder="AABCA1234F"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <Input
                      label="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="e.g. Mumbai"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Input
                      label="State"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="e.g. Maharashtra"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Input
                      label="Registered Address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Street / Area"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) {
                        setStep(role === 'TRANSPORTER' ? 2 : 2);
                      }
                    }}
                  >
                    Proceed to Next Step
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2 for TRANSPORTER: Fleet Details */}
            {role === 'TRANSPORTER' && step === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100">
                  Fleet & Transporter Credentials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Transport License / Permit No"
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    placeholder="MH-TR-2022-09412"
                  />
                  <Input
                    label="Fleet Size (Vehicles Owned/Managed)"
                    type="number"
                    min="1"
                    required
                    value={formData.fleetSize}
                    onChange={(e) => handleInputChange('fleetSize', e.target.value)}
                    placeholder="e.g. 25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    Available Vehicle Types in Fleet <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {VEHICLE_TYPES.map((v) => {
                      const isSelected = formData.vehicleTypes.includes(v);
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleVehicleToggle(v)}
                          className={`p-2.5 rounded-lg border text-xs text-left font-medium transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              readOnly
                              checked={isSelected}
                              className="rounded text-indigo-600"
                            />
                            <span>{v}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (validateStep2()) setStep(3);
                    }}
                  >
                    Proceed to Documents
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3 (or Step 2 for Supplier): Document Uploads */}
            {((role === 'TRANSPORTER' && step === 3) || (role === 'SUPPLIER' && step === 2)) && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-100">
                  Verification Documents Upload (PDF or Images, max 5MB)
                </h3>

                <div className="space-y-4">
                  {/* GST Document */}
                  <div className="p-4 border rounded-xl bg-slate-50/50 border-slate-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-slate-700">GST Registration Certificate</h4>
                        <p className="text-[11px] text-slate-500">Attach Certificate of Incorporation or GST document</p>
                      </div>
                      <input
                        type="file"
                        id="gstDoc"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleFileChange('gstDoc', e)}
                        className="hidden"
                      />
                      <label htmlFor="gstDoc">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm">
                          <UploadCloud className="w-3.5 h-3.5" />
                          {files.gstDoc ? 'Replace File' : 'Choose File'}
                        </span>
                      </label>
                    </div>
                    {files.gstDoc && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-indigo-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{files.gstDoc.name}</span>
                      </div>
                    )}
                  </div>

                  {/* PAN Document */}
                  <div className="p-4 border rounded-xl bg-slate-50/50 border-slate-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-slate-700">Company PAN Card</h4>
                        <p className="text-[11px] text-slate-500">Government issued PAN card copy</p>
                      </div>
                      <input
                        type="file"
                        id="panDoc"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleFileChange('panDoc', e)}
                        className="hidden"
                      />
                      <label htmlFor="panDoc">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm">
                          <UploadCloud className="w-3.5 h-3.5" />
                          {files.panDoc ? 'Replace File' : 'Choose File'}
                        </span>
                      </label>
                    </div>
                    {files.panDoc && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-indigo-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{files.panDoc.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Transport License (if transporter) */}
                  {role === 'TRANSPORTER' && (
                    <div className="p-4 border rounded-xl bg-slate-50/50 border-slate-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-semibold uppercase text-slate-700">National Carriage Permit / License</h4>
                          <p className="text-[11px] text-slate-500">Goods carriage vehicle permit document</p>
                        </div>
                        <input
                          type="file"
                          id="licenseDoc"
                          accept="image/jpeg,image/png,application/pdf"
                          onChange={(e) => handleFileChange('licenseDoc', e)}
                          className="hidden"
                        />
                        <label htmlFor="licenseDoc">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm">
                            <UploadCloud className="w-3.5 h-3.5" />
                            {files.licenseDoc ? 'Replace File' : 'Choose File'}
                          </span>
                        </label>
                      </div>
                      {files.licenseDoc && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-indigo-700 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{files.licenseDoc.name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(role === 'TRANSPORTER' ? 2 : 1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                  >
                    Submit for Administrator Review
                    <CheckCircle2 className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
