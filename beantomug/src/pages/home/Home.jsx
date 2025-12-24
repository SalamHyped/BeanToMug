import React from 'react';
import { Link } from 'react-router-dom';
import { FaCoffee, FaArrowRight, FaGithub, FaLinkedin, FaEnvelope, FaCode, FaPalette, FaHeart } from 'react-icons/fa';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Hero Section with Background Image */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Image with Overlay - Your Bean To Mug Photo */}
        <div className="absolute inset-0">
          <img 
            src="http://localhost:8801/uploads/home/bean-to-mug-hero.png"
            alt="Bean To Mug Coffee Shop"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex h-full items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white max-w-4xl mx-auto">
            {/* Coffee Icon */}
            <div className="mb-6 flex justify-center">
              <FaCoffee className="h-16 w-16 text-amber-300 animate-pulse" />
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold mb-6 leading-tight">
              Welcome to{' '}
              <span className="text-amber-300 italic">Bean To Mug</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto leading-relaxed">
              Your perfect coffee companion - from bean selection to your favorite mug
            </p>
            
            {/* Call to Action Button */}
            <Link 
              to="/menu" 
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              Explore My Work
              <FaArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        
        {/* Floating Coffee Accents */}
        <div className="absolute top-20 left-10 text-amber-300/30 text-2xl animate-bounce">
          ☕
        </div>
        <div className="absolute top-40 right-16 text-amber-300/30 text-xl animate-pulse">
          🫘
        </div>
        <div className="absolute bottom-32 left-20 text-amber-300/30 text-3xl animate-bounce delay-1000">
          ☕
        </div>
      </section>

      {/* About Me Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-amber-900 mb-4">
              About Me
            </h2>
            <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Profile Image Placeholder */}
              <div className="flex justify-center lg:justify-start">
                <div className="w-64 h-64 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full flex items-center justify-center shadow-xl">
                  <FaCode className="h-32 w-32 text-amber-800" />
                </div>
              </div>
              
              {/* About Text */}
              <div className="space-y-6">
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-900">
                  About Bean To Mug
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Bean To Mug is a comprehensive coffee shop management system that brings 
                  the warmth and efficiency of a specialty café to the digital world. 
                  From order processing to real-time analytics, every feature is crafted 
                  with the same attention to detail as a perfect cup of coffee.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Built with modern web technologies, this full-stack application provides 
                  everything needed to run a successful coffee business - from inventory 
                  management to customer satisfaction tracking.
                </p>
                
                {/* Skills Tags */}
                <div className="flex flex-wrap gap-3">
                  {['React', 'Node.js', 'MySQL', 'PayPal', 'Real-time Analytics', 'Task Management'].map((skill) => (
                    <span 
                      key={skill}
                      className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-amber-900 mb-4">
-             Bean To Mug Features
            </h2>
            <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center">
                <FaCoffee className="h-20 w-20 text-amber-800" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-serif font-bold text-amber-900 mb-3">Order Management</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Complete order processing system with real-time updates, 
                  payment integration, and order tracking for seamless operations.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['PayPal', 'Real-time', 'Tracking'].map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Feature Card 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center">
                <FaCode className="h-20 w-20 text-amber-800" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-serif font-bold text-amber-900 mb-3">Analytics Dashboard</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Comprehensive analytics with financial KPIs, customer satisfaction 
                  tracking, and real-time business insights.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Charts', 'KPIs', 'Insights'].map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Feature Card 3 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center">
                <FaPalette className="h-20 w-20 text-amber-800" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-serif font-bold text-amber-900 mb-3">Task Management</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Staff task assignment and tracking system with role-based permissions 
                  and real-time collaboration features.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Tasks', 'Staff', 'Collaboration'].map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-amber-900 mb-4">
              Let's Brew Something Together
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Like a good coffee conversation, great projects start with great connections
            </p>
            <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full mt-4"></div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-amber-900 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-amber-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-amber-900 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Tell me about your project..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  Send Message
                  <FaCoffee className="h-4 w-4" />
                </button>
              </form>
              
              {/* Contact Info */}
              <div className="space-y-8">
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl font-serif font-bold text-amber-900 mb-6">
                    Get In Touch
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <FaEnvelope className="h-6 w-6 text-amber-600" />
                    </div>
                    <span className="text-gray-700">hello@yourname.com</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <FaGithub className="h-6 w-6 text-amber-600" />
                    </div>
                    <span className="text-gray-700">github.com/yourusername</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <FaLinkedin className="h-6 w-6 text-amber-600" />
                    </div>
                    <span className="text-gray-700">linkedin.com/in/yourprofile</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <FaCoffee className="h-6 w-6 text-amber-600" />
                    </div>
                    <span className="text-gray-700">Always up for coffee chat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-900 text-amber-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FaCoffee className="h-6 w-6 text-amber-300" />
            <span className="text-xl font-serif font-bold">Bean To Mug</span>
          </div>
          <p className="text-amber-200 mb-6">
            Crafted with <FaHeart className="inline h-4 w-4 text-red-400 mx-1" /> and lots of coffee
          </p>
          <p className="text-sm text-amber-300">
            © 2024 Bean To Mug. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 