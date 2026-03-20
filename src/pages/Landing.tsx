import { Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import { motion } from 'motion/react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex items-center relative overflow-hidden pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <h1 className="text-6xl lg:text-8xl font-bold text-zinc-900 tracking-tight mb-8 leading-[0.9]">
                  Streamline your <span className="text-indigo-600">accreditation</span> process.
                </h1>
                <p className="text-xl text-zinc-500 mb-12 leading-relaxed max-w-xl">
                  A centralized platform for managing documents, reviews, and compliance workflows in one clean interface.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <Link
                    to="/register"
                    className="px-8 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all flex items-center gap-2 group"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-4 bg-white text-zinc-900 font-bold rounded-2xl border border-zinc-200 hover:bg-zinc-50 transition-all"
                  >
                    Sign In
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Minimal Background Graphic */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full -z-10 hidden lg:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] opacity-40"></div>
          </div>
        </section>

        {/* Simple Footer */}
        <footer className="py-12 border-t border-zinc-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <Shield className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-zinc-900">WCC PACUCOA</span>
            </div>
            <p className="text-zinc-400 text-sm">© 2026 WCC PACUCOA Documentation and Compliance System. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors text-sm font-medium">Privacy</a>
              <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors text-sm font-medium">Terms</a>
              <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors text-sm font-medium">Support</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
