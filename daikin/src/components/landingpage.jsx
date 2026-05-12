import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      <header className="bg-white shadow">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-semibold text-blue-600">
            Daikin
          </div>

          <ul className="hidden md:flex space-x-6 text-gray-700">
            <li>
              <a href="#home" className="hover:text-blue-600">
                Home
              </a>
            </li>

            <li>
              <a href="#about" className="hover:text-blue-600">
                About
              </a>
            </li>

            <li>
              <a href="#services" className="hover:text-blue-600">
                Services
              </a>
            </li>

            <li>
              <a href="#contact" className="hover:text-blue-600">
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-grow bg-gradient-to-b from-white to-gray-100">
        <div className="container mx-auto px-6 py-20 flex items-center justify-center">
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Welcome to Daikin
            </h1>

            <p className="mt-4 text-gray-600 text-lg">
              Premium HVAC Solutions for Your Business
            </p>

            <button
              onClick={() => navigate('/dashboard')}
              className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Get Started
            </button>
          </div>

        </div>
      </section>

      {/* Services */}
      <section id="services" className="container mx-auto px-6 py-16">
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">
          Our Services
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-xl font-medium mb-2">
              Installation
            </h3>

            <p className="text-gray-600">
              Professional HVAC installation services
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-xl font-medium mb-2">
              Maintenance
            </h3>

            <p className="text-gray-600">
              Regular maintenance and support
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-xl font-medium mb-2">
              Repair
            </h3>

            <p className="text-gray-600">
              Expert repair and troubleshooting
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container mx-auto px-6 py-6 text-center text-gray-600">
          © 2024 Daikin. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;