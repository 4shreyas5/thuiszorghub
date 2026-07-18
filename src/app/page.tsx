"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  Users,
  Calendar,
  FileText,
  DollarSign,
  BarChart3,
  Bell,
  Lock,
  Globe,
  CheckCircle,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TZ</span>
              </div>
              <span className="font-bold text-lg text-gray-900">ThuisZorgHub</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">
                Features
              </a>
              <a href="#solutions" className="text-gray-600 hover:text-gray-900 transition">
                Solutions
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">
                Pricing
              </a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition">
                About
              </a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition">
                Contact
              </a>
            </div>

            {/* Auth & CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 transition font-medium"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <a
                href="#features"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
              >
                Features
              </a>
              <a
                href="#solutions"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
              >
                Solutions
              </a>
              <a href="#pricing" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded">
                Pricing
              </a>
              <a href="#about" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded">
                About
              </a>
              <a href="#contact" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded">
                Contact
              </a>
              <div className="flex flex-col gap-2 px-4 pt-2">
                <Link
                  href="/auth/login"
                  className="text-center text-gray-600 hover:text-gray-900 py-2"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                  Manage Your Entire Homecare Organization From One Platform
                </h1>
                <p className="text-xl text-gray-600">
                  Helping homecare organizations manage employees, clients, visits, billing, care
                  plans, reporting and compliance from one secure platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center sm:justify-start gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="border-2 border-gray-300 text-gray-900 px-8 py-3 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition font-semibold">
                  Book Demo
                </button>
              </div>
            </div>

            {/* Right - Dashboard Mockup */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <div className="space-y-4">
                {/* Dashboard Header */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Today&apos;s Visits</h3>
                  <div className="text-3xl font-bold text-blue-600">24</div>
                  <p className="text-sm text-gray-600 mt-1">+3 from yesterday</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-green-600">€12,450</div>
                    <p className="text-xs text-gray-600 mt-1">This Month Revenue</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-purple-600">18</div>
                    <p className="text-xs text-gray-600 mt-1">Active Employees</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-orange-600">47</div>
                    <p className="text-xs text-gray-600 mt-1">Clients</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-cyan-600">92%</div>
                    <p className="text-xs text-gray-600 mt-1">Completion Rate</p>
                  </div>
                </div>

                {/* Upcoming Section */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Schedule</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Morning visits</span>
                      <span className="font-medium text-gray-900">8:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Afternoon visits</span>
                      <span className="font-medium text-gray-900">2:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Complete Homecare Management Suite
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to run a modern homecare organization efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: "Employee Management",
                description:
                  "Streamline hiring, scheduling, and performance tracking for your care team",
              },
              {
                icon: FileText,
                title: "Client Management",
                description:
                  "Centralized client profiles with medical history, preferences, and documentation",
              },
              {
                icon: Calendar,
                title: "Visit Scheduling",
                description:
                  "Intelligent scheduling engine that optimizes routes and resource allocation",
              },
              {
                icon: FileText,
                title: "Care Plans",
                description:
                  "Create, monitor and update care plans with integrated compliance tracking",
              },
              {
                icon: DollarSign,
                title: "Billing & Invoicing",
                description:
                  "Automated billing, expense tracking, and multi-currency financial reporting",
              },
              {
                icon: BarChart3,
                title: "Reporting & Analytics",
                description:
                  "Real-time dashboards and comprehensive reports for data-driven decisions",
              },
              {
                icon: FileText,
                title: "Document Management",
                description:
                  "Secure storage and management of contracts, certifications, and compliance docs",
              },
              {
                icon: Bell,
                title: "Notifications",
                description:
                  "Real-time alerts for schedule changes, urgent issues, and important updates",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition group"
              >
                <feature.icon className="w-10 h-10 text-blue-600 mb-4 group-hover:scale-110 transition" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why ThuisZorgHub Section */}
      <section id="solutions" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Why ThuisZorgHub?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for European homecare organizations with healthcare-first
              principles
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "Healthcare-First Design",
                description: "Purpose-built for homecare workflows, not generic business tools",
              },
              {
                icon: Users,
                title: "Multi-Location Support",
                description:
                  "Manage multiple branches and locations from a single centralized platform",
              },
              {
                icon: Lock,
                title: "Role-Based Permissions",
                description:
                  "Granular access control ensuring data security and compliance at all levels",
              },
              {
                icon: Lock,
                title: "GDPR-Ready Architecture",
                description:
                  "Built with European privacy regulations in mind, EU data hosting available",
              },
              {
                icon: CheckCircle,
                title: "Audit Logging",
                description:
                  "Complete audit trails for compliance, accountability, and transparency",
              },
              {
                icon: Lock,
                title: "Secure Cloud Platform",
                description:
                  "Enterprise-grade security with encryption, backups, and disaster recovery",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-8 border border-gray-200">
                <item.icon className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Get Started in Minutes</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A simple 4-step process to start managing your homecare organization
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "1", title: "Create Organization", icon: Globe },
              { number: "2", title: "Invite Employees", icon: Users },
              { number: "3", title: "Manage Care", icon: Calendar },
              { number: "4", title: "Grow Your Business", icon: BarChart3 },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-xl p-8 border border-gray-200 text-center h-full">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                </div>
                {idx < 3 && (
                  <ArrowRight className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Built for Homecare Organizations
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Trusted by leading organizations across Europe
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              "Homecare Agencies",
              "Nursing Organizations",
              "Private Care Providers",
              "Community Healthcare",
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-8 border border-gray-200 text-center hover:border-blue-300 hover:shadow-lg transition"
              >
                <CheckCircle className="w-10 h-10 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your organization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "€49",
                users: "Up to 5 employees",
                features: [
                  "Basic employee management",
                  "Visit scheduling",
                  "Client profiles",
                  "Basic reporting",
                  "Email support",
                ],
              },
              {
                name: "Professional",
                price: "€149",
                users: "Up to 50 employees",
                features: [
                  "All Starter features",
                  "Advanced scheduling",
                  "Care plan management",
                  "Billing & invoicing",
                  "Advanced analytics",
                  "Priority support",
                ],
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                users: "Unlimited employees",
                features: [
                  "All Professional features",
                  "Multi-location support",
                  "API access",
                  "Custom integrations",
                  "Dedicated account manager",
                  "24/7 support",
                ],
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-8 border-2 transition ${
                  plan.highlighted
                    ? "border-blue-600 bg-blue-50 shadow-lg"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <div className="mb-4">
                    <span className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <p className="text-gray-600 mb-6 text-sm">{plan.users}</p>
                <button
                  className={`w-full py-3 rounded-lg font-semibold transition mb-6 ${
                    plan.highlighted
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border-2 border-gray-300 text-gray-900 hover:border-gray-400"
                  }`}
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </button>
                <ul className="space-y-3">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Loved by Homecare Leaders
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what organizations are saying about ThuisZorgHub
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "ThuisZorgHub transformed how we manage our operations. We saved 10 hours per week just on scheduling alone.",
                author: "Marie van den Berg",
                role: "Director, Amsterdam Care Services",
                org: "Amsterdam Care Services",
              },
              {
                quote:
                  "The billing integration has been a game-changer. Invoicing is now automated and accurate.",
                author: "Erik Jansen",
                role: "Financial Manager, Rotterdam Homecare",
                org: "Rotterdam Homecare",
              },
              {
                quote:
                  "Our compliance team loves the audit logging. It gives us complete transparency and confidence.",
                author: "Sophie de Vries",
                role: "Compliance Officer, Utrecht Medical",
                org: "Utrecht Medical Services",
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-xl p-8 border border-gray-200">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6">&quot;{testimonial.quote}&quot;</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">Have questions? We&apos;ve got answers</p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Can multiple employees log in?",
                answer:
                  "Yes, absolutely. Each team member gets their own secure login with role-based permissions. You can add as many employees as your plan allows.",
              },
              {
                question: "Is my data secure?",
                answer:
                  "Your data is protected with enterprise-grade encryption, regular backups, and disaster recovery. We comply with GDPR and other major privacy regulations.",
              },
              {
                question: "Can I manage multiple branches?",
                answer:
                  "Yes! Our Professional and Enterprise plans support multiple locations. You can manage all branches from one centralized dashboard.",
              },
              {
                question: "Does it support billing?",
                answer:
                  "Yes. ThuisZorgHub includes automated billing, invoice generation, payment tracking, and multi-currency support for all plans.",
              },
              {
                question: "Can I export reports?",
                answer:
                  "Absolutely. Export reports in PDF, Excel, and CSV formats. Our advanced analytics dashboard also allows real-time data visualization.",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full px-8 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900 text-left">{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition ${openFAQ === idx ? "rotate-180" : ""}`}
                  />
                </button>
                {openFAQ === idx && (
                  <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to modernize your homecare organization?
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Join leading homecare organizations that have transformed their operations with
            ThuisZorgHub. Start your free trial today, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition font-semibold">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TZ</span>
                </div>
                <span className="font-bold text-white">ThuisZorgHub</span>
              </div>
              <p className="text-sm">Smart Homecare Management Platform</p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Security
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#about" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    GDPR
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@thuiszorghub.nl" className="hover:text-white transition">
                    Email
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm">&copy; 2024 ThuisZorgHub. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0 text-sm">
                <a href="#" className="hover:text-white transition">
                  Privacy
                </a>
                <a href="#" className="hover:text-white transition">
                  Terms
                </a>
                <a href="#" className="hover:text-white transition">
                  GDPR
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
