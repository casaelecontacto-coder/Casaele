import React from 'react';

// Accept props for state and handlers from CartCheckout
function BillingDetails({ billingInfo, setBillingInfo, errors }) {

  // Handle input changes and update parent state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold border-b pb-3 mb-4">Billing Details</h3>
      <form className="space-y-4">
        {/* Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name *</label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              value={billingInfo.firstName}
              onChange={handleChange}
              required
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 ${errors?.firstName ? 'border-red-500' : 'border-gray-300'}`}
            />
             {errors?.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name *</label>
            <input
              type="text"
              name="lastName"
              id="lastName"
               value={billingInfo.lastName}
               onChange={handleChange}
              required
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 ${errors?.lastName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors?.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
          </div>
        </div>

        {/* Email & Phone */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</label>
          <input
            type="email"
            name="email"
            id="email"
            value={billingInfo.email}
            onChange={handleChange}
            required
            className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 ${errors?.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors?.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
           <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone *</label>
           <input
             type="tel"
             name="phone"
             id="phone"
             value={billingInfo.phone}
             onChange={handleChange}
             required
             className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 ${errors?.phone ? 'border-red-500' : 'border-gray-300'}`}
           />
           {errors?.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Street Address *</label>
          <input
            type="text"
            name="address"
            id="address"
            value={billingInfo.address}
            onChange={handleChange}
            required
            className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 ${errors?.address ? 'border-red-500' : 'border-gray-300'}`}
          />
           {errors?.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
        </div>

        {/* City, State, Zip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City *</label>
            <input type="text" name="city" id="city" value={billingInfo.city} onChange={handleChange} required className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 ${errors?.city ? 'border-red-500' : 'border-gray-300'}`} />
            {errors?.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State *</label>
            <input type="text" name="state" id="state" value={billingInfo.state} onChange={handleChange} required className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 ${errors?.state ? 'border-red-500' : 'border-gray-300'}`} />
             {errors?.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">ZIP / Postal *</label>
            <input type="text" name="postalCode" id="postalCode" value={billingInfo.postalCode} onChange={handleChange} required className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 ${errors?.postalCode ? 'border-red-500' : 'border-gray-300'}`} />
             {errors?.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>}
          </div>
        </div>
        {/* Country (Assuming India for now, make dynamic if needed) */}
        <div>
           <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
           <input type="text" name="country" id="country" value={billingInfo.country} onChange={handleChange} readOnly className="mt-1 block w-full border rounded-md shadow-sm bg-gray-100 sm:text-sm p-2 border-gray-300" />
        </div>
      </form>
    </div>
  );
}

export default BillingDetails;