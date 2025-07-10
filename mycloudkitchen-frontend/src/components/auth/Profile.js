import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, MapPin, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || '',
      specialties: user?.specialties ? JSON.stringify(user.specialties, null, 2) : ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let specialties = null;
      if (data.specialties) {
        try {
          specialties = JSON.parse(data.specialties);
        } catch (e) {
          // If JSON parsing fails, treat as a simple string
          specialties = { description: data.specialties };
        }
      }

      const updateData = {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        bio: data.bio || null,
        specialties: specialties
      };

      await updateProfile(updateData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || '',
      specialties: user?.specialties ? JSON.stringify(user.specialties, null, 2) : ''
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-full p-3">
                  <User className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                  <p className="text-gray-600 capitalize">{user?.role}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    user?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user?.status}
                  </span>
                </div>
              </div>
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        {...register('name', { required: 'Name is required' })}
                        type="text"
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                          isEditing 
                            ? 'focus:outline-none focus:ring-orange-500 focus:border-orange-500' 
                            : 'bg-gray-50 text-gray-500'
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Phone Number
                      </label>
                      <input
                        {...register('phone')}
                        type="tel"
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                          isEditing 
                            ? 'focus:outline-none focus:ring-orange-500 focus:border-orange-500' 
                            : 'bg-gray-50 text-gray-500'
                        }`}
                        placeholder="+44 123 456 7890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Address
                      </label>
                      <input
                        {...register('address')}
                        type="text"
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                          isEditing 
                            ? 'focus:outline-none focus:ring-orange-500 focus:border-orange-500' 
                            : 'bg-gray-50 text-gray-500'
                        }`}
                        placeholder="Your address"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={4}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-orange-500 focus:border-orange-500' 
                        : 'bg-gray-50 text-gray-500'
                    }`}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Specialties (for caterers) */}
                {user?.role === 'caterer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialties
                    </label>
                    <textarea
                      {...register('specialties')}
                      rows={4}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm ${
                        isEditing 
                          ? 'focus:outline-none focus:ring-orange-500 focus:border-orange-500' 
                          : 'bg-gray-50 text-gray-500'
                      }`}
                      placeholder='{"cuisine": ["Italian", "Mediterranean"], "dietary": ["Vegetarian", "Gluten-free"]}'
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      JSON format for specialties (cuisine types, dietary options, etc.)
                    </p>
                  </div>
                )}

                {/* Account Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type
                      </label>
                      <input
                        type="text"
                        value={user?.role || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 capitalize"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member Since
                      </label>
                      <input
                        type="text"
                        value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              {isEditing && (
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;