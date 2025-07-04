import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaBriefcase, FaClock, FaEdit, FaEnvelope, FaGraduationCap, FaPhone, FaSave, FaTimes, FaUser } from 'react-icons/fa';

function DoctorProfile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    degree: '',
    specialization: '',
    availability: '',
    experience: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get doctor ID from token
        let doctorId;
        if (token) {
          try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            doctorId = tokenData.id;
          } catch (error) {
            console.error('Error decoding token:', error);
            setError('Error getting doctor information');
            return;
          }
        }

        if (!doctorId) {
          setError('Doctor ID not found');
          return;
        }

        const response = await axios.get(`http://localhost:3000/api/users/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data);
        setFormData({
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          department: response.data.department,
          degree: response.data.degree,
          specialization: response.data.specialization,
          availability: response.data.availability,
          experience: response.data.experience
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get doctor ID from token
      let doctorId;
      if (token) {
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          doctorId = tokenData.id;
        } catch (error) {
          console.error('Error decoding token:', error);
          toast.error('Error getting doctor information');
          return;
        }
      }

      if (!doctorId) {
        toast.error('Doctor ID not found');
        return;
      }

      const response = await axios.patch(`http://localhost:3000/api/users/${doctorId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Doctor Profile</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 text-[var(--accent)] bg-[var(--accent)]/10 rounded-lg hover:bg-[var(--accent)]/20 transition-all duration-200"
            >
              <FaEdit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSubmit}
                className="flex items-center space-x-2 px-4 py-2 text-white bg-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/90 transition-all duration-200"
              >
                <FaSave className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    department: profile.department,
                    degree: profile.degree,
                    specialization: profile.specialization,
                    availability: profile.availability,
                    experience: profile.experience
                  });
                }}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
              >
                <FaTimes className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-800">
                  <FaUser className="w-5 h-5 text-gray-400" />
                  <span>{profile.name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-800">
                  <FaEnvelope className="w-5 h-5 text-gray-400" />
                  <span>{profile.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-800">
                  <FaPhone className="w-5 h-5 text-gray-400" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
              {isEditing ? (
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="neurology">Neurology</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="dental">Dental</option>
                </select>
              ) : (
                <div className="flex items-center space-x-2 text-gray-800">
                  <FaBriefcase className="w-5 h-5 text-gray-400" />
                  <span>{profile.department.charAt(0).toUpperCase() + profile.department.slice(1)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Degree</label>
              {isEditing ? (
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-800">
                  <FaGraduationCap className="w-5 h-5 text-gray-400" />
                  <span>{profile.degree}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Specialization</label>
              {isEditing ? (
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-800">
                  <FaBriefcase className="w-5 h-5 text-gray-400" />
                  <span>{profile.specialization}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Availability</label>
              {isEditing ? (
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="visiting">Visiting</option>
                </select>
              ) : (
                <div className="flex items-center space-x-2 text-gray-800">
                  <FaClock className="w-5 h-5 text-gray-400" />
                  <span>{profile.availability.charAt(0).toUpperCase() + profile.availability.slice(1)}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Experience (years)</label>
              {isEditing ? (
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-800">
                  <FaBriefcase className="w-5 h-5 text-gray-400" />
                  <span>{profile.experience} years</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorProfile; 