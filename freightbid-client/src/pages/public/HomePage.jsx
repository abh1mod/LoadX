import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  ShieldCheck,
  TrendingDown,
  Clock,
  ArrowRight,
  Star,
  Users,
  CheckCircle,
  Building,
  Quote
} from 'lucide-react';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import RatingStars from '../../components/common/RatingStars';
import { formatDateTime } from '../../utils/formatters';

export const HomePage = () => {
  const [data, setData] = useState({
    stats: { suppliersCount: 0, transportersCount: 0, totalShipments: 0, deliveredShipments: 0 },
    topRatedTransporters: [],
    recentReviews: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get('/public/home');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-white border-b border-slate-200/80 py-16 sm:py-24 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/60 pointer-events-none overflow-hidden" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Verified Indian B2B Freight Bidding Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-normal sm:leading-tight pb-2">
              Real-Time Freight Auctions for <span className="text-indigo-600">Enterprise Shippers</span> & <span className="text-slate-800">Carriers</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Eliminate freight broker commissions. Suppliers publish full truckload consignments with strict hard-close windows; verified transporters bid live with sub-second ranking transparency.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="px-8 shadow-md shadow-indigo-200">
                  Register as Shipper / Carrier
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg" className="px-6">
                  Sign in to Workspace
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stat Highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur border border-slate-200/80 rounded-xl p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-indigo-600">
                {data.stats.deliveredShipments || 0}+
              </p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Delivered Shipments</p>
            </div>
            <div className="bg-white/80 backdrop-blur border border-slate-200/80 rounded-xl p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-slate-900">
                {data.stats.transportersCount || 0}
              </p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Verified Carriers</p>
            </div>
            <div className="bg-white/80 backdrop-blur border border-slate-200/80 rounded-xl p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-indigo-600">
                {data.stats.suppliersCount || 0}
              </p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Industrial Shippers</p>
            </div>
            <div className="bg-white/80 backdrop-blur border border-slate-200/80 rounded-xl p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-slate-900">1s</p>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Auction Polling</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 bg-slate-50 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">End-to-End Workflow</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">How LoadX Operates</h3>
            <p className="text-sm text-slate-500 mt-2">Transparent, contract-grade digital logistics procurement in three clear roles.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Shippers */}
            <Card className="border-t-4 border-t-indigo-600">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4">
                1
              </div>
              <h4 className="text-lg font-bold text-slate-900">1. Shippers Post Loads</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Verified manufacturers specify pickup/drop locations, cargo weight, vehicle category, and exact bidding start and hard-close timestamps.
              </p>
            </Card>

            {/* Step 2: Transporters */}
            <Card className="border-t-4 border-t-emerald-600">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                2
              </div>
              <h4 className="text-lg font-bold text-slate-900">2. Live Reverse Bidding</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Carriers compete live via 1-second short polling. Transporters see ranks and competitors updated instantaneously, adjusting rates freely before the window closes.
              </p>
            </Card>

            {/* Step 3: Award & Delivery */}
            <Card className="border-t-4 border-t-amber-600">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-4">
                3
              </div>
              <h4 className="text-lg font-bold text-slate-900">3. Award & Milestone Tracking</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Shippers award to any bidder upon auction close. The awarded carrier logs sequential transit milestones until final delivery, followed by star rating reviews.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Top Rated Transporters */}
      <section className="py-16 bg-white border-t border-slate-200/80 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Network Reliability</h2>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Top-Rated Transporters</h3>
              <p className="text-sm text-slate-500 mt-1">Vetted fleet operators ranked by on-time delivery ratings and verified reviews.</p>
            </div>
            <Link to="/register">
              <Button variant="outline" size="sm">
                Join Transporter Network
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.topRatedTransporters.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Transporter performance rankings are being aggregated.
              </div>
            ) : (
              data.topRatedTransporters.map((t) => (
                <div key={t._id} className="p-5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-white shadow-sm hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{t.companyName || t.name}</h4>
                        <p className="text-xs text-slate-500">{t.city}, {t.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-200/70">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-amber-800">{t.avgRating}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Fleet: <strong className="text-slate-900">{t.fleetSize} Trucks</strong></span>
                    <span>Reviews: <strong className="text-slate-900">{t.reviewCount}</strong></span>
                  </div>

                  {t.vehicleTypes?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {t.vehicleTypes.map((v) => (
                        <span key={v} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Recent Reviews Section */}
      <section className="py-16 bg-slate-50 border-t border-slate-200/80 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Verified Testimonials</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Shipper Reviews & Feedback</h3>
            <p className="text-sm text-slate-500 mt-1">Genuine post-delivery reviews recorded on completed consignment contracts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.recentReviews.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                Completed delivery reviews will appear here.
              </div>
            ) : (
              data.recentReviews.map((rev) => (
                <div key={rev._id} className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <RatingStars rating={rev.rating} size="sm" />
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(rev.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                    <p className="font-semibold text-slate-900">{rev.supplierName}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Carrier: <span className="font-medium text-indigo-600">{rev.transporterName}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      Cargo: {rev.shipmentTitle}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="bg-indigo-900 text-white py-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ready to Modernize Your Freight Procurement?</h2>
          <p className="mt-3 text-indigo-200 text-sm max-w-xl mx-auto">
            Join India's most dependable digital freight auction platform today. Fast onboarding with administrator verification.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 shadow-none font-semibold">
                Register Your Fleet or Factory
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 LoadX Platform. All rights reserved. Built for B2B Logistics.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
