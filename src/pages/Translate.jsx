// import React, { useState, useEffect } from "react";
// import { AiOutlineClose } from "react-icons/ai"; // ✅ React Icon import

// function Translate() {
//   const [showPopup, setShowPopup] = useState(false);

//   useEffect(() => {
//     // Har refresh par popup show hoga
//     setShowPopup(true);
//   }, []);

//   if (!showPopup) return null;

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//       <div className="bg-white rounded-2xl shadow-lg p-6 w-[300px] text-center relative">
//         {/* Close Button */}
//         <button
//           onClick={() => setShowPopup(false)}
//           className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
//         >
//           <AiOutlineClose size={22} />
//         </button>

//         <h2 className="text-xl font-semibold mb-4">Choose Your Language</h2>
//         <select className="w-full border rounded-lg p-2 mb-4">
//           <option value="en">English</option>

//           <option value="es">Spanish</option>
//         </select>
//         <button
//           onClick={() => setShowPopup(false)}
//           className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//         >
//           Continue
//         </button>
//       </div>
//     </div>
//   );
// }

// export default Translate;
