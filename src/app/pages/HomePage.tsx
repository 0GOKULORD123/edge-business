import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, Shield, Trash2, Store, Bot } from 'lucide-react';
import { motion } from 'motion/react';
import edgeLogo from '../../assets/66374a2ff9f02213db2cda3bff0d1c000bf7c136.png';

export function HomePage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter Access',
      price: '$300',
      edgeAmount: '30 EDGE',
      credits: 30,
      features: ['30 EDGE Credits', 'Basic Features', 'Telegram Support', '7-day response time'],
    },
    {
      id: 'pro',
      name: 'Pro Access',
      price: '$1,200',
      edgeAmount: '120 EDGE',
      credits: 120,
      features: ['120 EDGE Credits', 'All Premium Features', 'Telegram Priority Support', 'Marketplace Access'],
      popular: true,
    },
    {
      id: 'firsttimer',
      name: 'First Timer',
      price: '$99',
      edgeAmount: '10 EDGE',
      credits: 10,
      features: ['10 EDGE Credits', 'Essential Features', 'Telegram Support', 'Perfect for trying EDGE'],
    },
  ];

  const handleGetStarted = (planId: string) => {
    setSelectedPlan(planId);
    navigate('/signup', { state: { selectedPlan: planId } });
  };

  return (
    <div className="min-h-screen">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <img src={edgeLogo} alt="EDGE" className="h-10 w-auto" />
            </motion.div>

            {/* Sign In Button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/signin')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 max-w-4xl mx-auto">
            {/* Video */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12 rounded-2xl overflow-hidden shadow-2xl neon-glow max-w-3xl mx-auto"
            >
              <div className="aspect-video bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 flex items-center justify-center">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/HVJ7uDCv5qw"
                  title="EDGE Platform"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 neon-text"
            >
              The Edge Your Business Needs
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-muted-foreground mb-8"
            >
              Control perception. Scale authority. Operate at EDGE.
            </motion.p>
          </div>

          {/* Plans Section */}
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-3">Choose Your Entry Point</h2>
              <p className="text-muted-foreground">Select a plan to get started</p>
              <p className="text-lg font-semibold text-[#0ea5e9] mt-2">1 Review Costs 2 EDGE</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className={`glass-card rounded-2xl p-8 relative transition-all duration-300 ${
                    plan.popular ? 'ring-2 ring-[#0ea5e9] neon-glow' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] rounded-full text-xs font-semibold">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold neon-text">{plan.price}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-2xl font-semibold text-[#0ea5e9]">{plan.edgeAmount}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">one-time payment</span>
                  </div>

                  <div className="mb-6 p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Includes</p>
                    <p className="text-2xl font-bold text-[#0ea5e9]">{plan.credits} EDGE Credits</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-[#0ea5e9]/20 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGetStarted(plan.id)}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 neon-glow'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Get Started
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Services Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-20 max-w-6xl mx-auto"
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Service 1: Permanent Reviews */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card rounded-xl p-6 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Permanent Reviews</h3>
                <p className="text-sm text-muted-foreground">
                  Authentic, lasting reviews that build trust and authority
                </p>
              </motion.div>

              {/* Service 2: Review Removal */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card rounded-xl p-6 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center">
                  <Trash2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Review Removal Tool</h3>
                <p className="text-sm text-muted-foreground">
                  Clean your reputation by removing negative feedback
                </p>
              </motion.div>

              {/* Service 3: Marketplace */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card rounded-xl p-6 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center">
                  <Store className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Marketplace + Store</h3>
                <p className="text-sm text-muted-foreground">
                  Premium products and services for business growth
                </p>
              </motion.div>

              {/* Service 4: AI Auto Responder */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card rounded-xl p-6 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">A.I Review Responder</h3>
                <p className="text-sm text-muted-foreground">
                  Automated intelligent responses to customer reviews
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Trust Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16 text-center"
          >
            <div className="flex justify-center mb-4">
              <img src={edgeLogo} alt="EDGE" className="h-12 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">🔒 Invite-Only Platform</p>
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
              EDGE is a private platform for businesses ready to operate at the highest level. All transactions are secure and anonymous.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}