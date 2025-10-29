import React, { useState } from 'react'
import { apiSend } from '../../utils/api'

const ContactContent = () => {

  // State to manage form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [reason, setReason] = useState('');

  // State to manage selected user type
  const [selectedUser, setSelectedUser] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the page from reloading

    // Check if all fields are filled
    if (!name || !email || !country || !reason) {
      alert("Please fill in all fields before sending.");
      return;
    }

    try {
      await apiSend('/api/forms', 'POST', {
        name,
        email,
        message: `${country}${selectedUser ? ` (${selectedUser})` : ''} - ${reason}`
      })
      alert("¡Gracias! Your message has been received. We'll respond within 2-3 business days. In the meantime, feel free to explore Ele’s house and the magic in each room!");
      setName('');
      setEmail('');
      setCountry('');
      setReason('');
      setSelectedUser(null); // Clear selected user as well
    } catch (err) {
      alert('Submission failed. Please try again later.')
    }
  };

  // Function to handle button click
  const handleUserSelect = (userType) => {
    setSelectedUser(userType);
  };

  return (
    <div className="font-sans text-gray-800 pb-24">
      {/* Contact Section */}
      <section className="bg-white px-4 sm:px-6 lg:px-12 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-black mb-10 sm:mb-12">
          Contact Us
        </h1>

        <div className="bg-white shadow-lg border border-gray-300 rounded-2xl p-6 sm:p-10 max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Side */}
          <div className="lg:w-1/2 flex flex-col justify-center text-center lg:text-left">
            <p className="text-gray-600 mb-6 leading-relaxed text-sm sm:text-base">
              ¡Hola! We're here to help you on your Spanish learning journey. Whether you're a future student ready to discover the beauty of Spanish, an educator interested in our methodology, or a potential collaborator looking to connect, we'd love to hear from you. Vamos a conversar!
            </p>
            <img
              src="/Contact/image 53.svg"
              alt="Alien Teacher"
              className="w-48 sm:w-56 md:w-72 h-auto mx-auto lg:mx-8"
            />
          </div>

          {/* Right Side */}
          <div className="lg:w-1/2 w-full">
            {/* Tabs */}
            <label className="block text-gray-700 font-medium mb-3 text-center lg:text-left">
              You are a:
            </label>
            <div className="flex justify-center md:justify-center my-6">
              <div className="inline-flex flex-wrap justify-center gap-3 sm:gap-4 border border-red-200 rounded-full px-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => handleUserSelect('Teacher')}
                  className={`px-6 sm:px-8 py-2 text-sm sm:text-base font-medium rounded-full transition-all ${selectedUser === 'Teacher' ? 'bg-[rgba(173,21,24,1)] text-white' : 'text-gray-600 '}`}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => handleUserSelect('Student')}
                  className={`px-6 sm:px-8 py-2 text-sm sm:text-base font-medium rounded-full transition-all ${selectedUser === 'Student' ? 'bg-[rgba(173,21,24,1)] text-white' : 'text-gray-600  '}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => handleUserSelect('Collaborator')}
                  className={`px-6 sm:px-8 py-2 text-sm sm:text-base font-medium rounded-full transition-all ${selectedUser === 'Collaborator' ? 'bg-[rgba(173,21,24,1)] text-white' : 'text-gray-600 '}`}
                >
                  Collaborator
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <textarea
                placeholder="Reason to contact"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 h-28 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500"
              ></textarea>

              <button
                type="submit"
                className="bg-[rgba(173,21,24,1)] text-white px-5 sm:px-6 py-3 rounded-full w-full hover:bg-red-700 transition text-sm sm:text-base font-medium"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactContent