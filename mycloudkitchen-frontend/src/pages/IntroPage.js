import React, { useState, useEffect } from 'react';
import { Star, Calendar, MapPin, Phone, Mail, Camera, Users, Award } from 'lucide-react';
import { reviewService }  from '../services/review';
import { inquiryService }  from '../services/inquiry';

const IntroPage = () => {
  const [reviewForm, setReviewForm] = useState({
    name: '',
    rating: 5,
    review_text: '',
    email: ''
  });
  
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    event_date: '',
    event_type: '',
    guest_count: '',
    message: ''
  });

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [customerReviews, setCustomerReviews] = useState([]);

  // Sample customer reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviews = await reviewService.getApprovedReviews();
        setCustomerReviews(Array.isArray(reviews) ? reviews : []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setCustomerReviews([]);
      }
    };
    
    fetchReviews();
  }, []);

  // Sample event photos
  const eventPhotos = [
    {
      id: 1,
      url: `${window.location.origin}/img1.png`,
      title: "Wedding Reception",
      description: "Beautiful wedding catering for 150 guests"
    },
    {
      id: 2,
      url: `${window.location.origin}/food_img2.png`,
      title: "Corporate Event",
      description: "Professional catering for business conference"
    },
    {
      id: 3,
      url: `${window.location.origin}/food_img3.png`,
      title: "Birthday Celebration",
      description: "Special birthday party catering"
    },
    {
      id: 4,
      url: `${window.location.origin}/food_img4.png`,
      title: "Festival Catering",
      description: "Community festival food service"
    }
  ];

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.review_text || !reviewForm.email) {
        alert('Please fill in all required fields.');
        return;
    }
    const response =reviewService.createReview(reviewForm);
    console.log('Review submitted:', reviewForm);
    // Handle review submission
    setShowReviewForm(false);
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
 

        const response = Promise <inquiryService.createInquiry(enquiryForm) ;
   
        alert('Enquiry submitted successfully!');
      
    
    // Handle enquiry submission
    setShowEnquiryForm(false);
    setEnquiryForm({ name: '', email: '', phone: '', event_date: '', event_type: '', guest_count: '', message: '' });
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-4 py-2 lg:py-4">
          <div className="max-w-lg">
            <h1 className="text-xl md:text-xl font-bold mb-1 leading-tight">
              Delicious Meals,<br />
              <span className="text-yellow-300">Delivered Fresh</span>
            </h1>
            <p className="text-sm md:text-base mb-2 opacity-90 max-w-md">
              We are passionate local caterers. Enjoy restaurant-quality meals prepared with love and delivered to your door.
            </p>
            <div className="flex space-x-3 mt-4">
              <button 
                onClick={() => setShowReviewForm(true)}
                className="bg-yellow-400 text-gray-900 px-4 py-2 rounded text-sm font-semibold hover:bg-yellow-300 transition-colors"
              >
                Write Review
              </button>
              <button 
                onClick={() => setShowEnquiryForm(true)}
                className="border border-white text-white px-4 py-2 rounded text-sm font-semibold hover:bg-white hover:text-gray-900 transition-colors"
              >
                Catering Enquiry
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What Our Customers Say</h2>
            <p className="text-gray-600">Real reviews from real customers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {customerReviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <div className="flex mr-2">
                    {renderStars(review.rating)}
                  </div>
                  {review.verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-4 text-sm leading-relaxed">"{review.review_text}"</p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">{review.name}</span>
                  <span className="text-gray-500 text-xs">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <button 
              onClick={() => setShowReviewForm(true)}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Share Your Experience
            </button>
          </div>
        </div>
      </section>

      {/* Event Photos Gallery */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Event Gallery</h2>
            <p className="text-gray-600">Memorable moments from our catering events</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {eventPhotos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img 
                  src={photo.url} 
                  alt={photo.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{photo.title}</h3>
                  <p className="text-gray-600 text-sm">{photo.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">500+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">50+</div>
              <div className="text-gray-600">Events Catered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">4.9</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">3+</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Write a Review</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={reviewForm.name}
                  onChange={(e) => setReviewForm({...reviewForm, name: e.target.value})}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={reviewForm.email}
                  onChange={(e) => setReviewForm({...reviewForm, email: e.target.value})}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex space-x-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 cursor-pointer ${
                        star <= reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                      onClick={() => setReviewForm({...reviewForm, rating: star})}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                <textarea
                  required
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={reviewForm.review_text}
                  onChange={(e) => setReviewForm({...reviewForm, review_text: e.target.value})}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition-colors"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Catering Enquiry Form Modal */}
    {showEnquiryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Catering Enquiry</h3>
            <form onSubmit={handleEnquirySubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm({...enquiryForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={enquiryForm.email}
                    onChange={(e) => setEnquiryForm({...enquiryForm, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm({...enquiryForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={enquiryForm.eventDate}
                    onChange={(e) => setEnquiryForm({...enquiryForm, event_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={enquiryForm.eventType}
                    onChange={(e) => setEnquiryForm({...enquiryForm, event_type: e.target.value})}
                  >
                    <option value="">Select event type</option>
                    <option value="wedding">Wedding</option>
                    <option value="corporate">Corporate Event</option>
                    <option value="birthday">Birthday Party</option>
                    <option value="festival">Festival</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={enquiryForm.guestCount}
                    onChange={(e) => setEnquiryForm({...enquiryForm, guest_count: e.target.value})}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Tell us about your event requirements..."
                  value={enquiryForm.message}
                  onChange={(e) => setEnquiryForm({...enquiryForm, message: e.target.value})}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition-colors"
                >
                  Send Enquiry
                </button>
                <button
                  type="button"
                  onClick={() => setShowEnquiryForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroPage;