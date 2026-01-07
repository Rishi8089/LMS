import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center gap-4 text-center">

        {/* Brand */}
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide 
          bg-gradient-to-r from-orange-400 to-orange-600 
          bg-clip-text text-transparent">
          Strategy Boolean
        </h2>

        {/* Tagline */}
        <p className="text-gray-300 text-sm md:text-base max-w-xl">
          Learn with passion and achieve success faster through clarity,
          consistency, and smart strategy.
        </p>

        {/* Divider */}
        <div className="w-24 h-1 rounded-full 
          bg-gradient-to-r from-orange-500 to-orange-600 my-2" />

        {/* Copyright */}
        <p className="text-xs md:text-sm text-gray-400">
          © 2024–2026 Strategy Boolean. All rights reserved.
        </p>

      </div>
    </footer>
  );
};

export default Footer;
