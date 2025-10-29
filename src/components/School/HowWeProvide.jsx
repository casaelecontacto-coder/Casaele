import React from "react";
import services from "./Service";

function HowWeProvide() {
  return (
    <div className="mt-20 px-4 text-center py-8">
      <h1 className="text-4xl md:text-5xl font-semibold mb-12">What We Provide</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {services.map((service, index) => (
          <div key={index} className="flex items-start gap-4 p-6 text-left border rounded-2xl shadow-sm bg-white">
            <div>{service.icon}</div>
            <div>
              <h3 className="text-lg font-semibold mb-1">{service.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HowWeProvide;
