import { Tab } from '@headlessui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
    FaAmbulance,
    FaBandAid,
    FaBox,
    FaBoxes,
    FaCalendar,
    FaCalendarAlt,
    FaChartBar,
    FaCheck,
    FaCheckCircle,
    FaClock,
    FaCog,
    FaEdit,
    FaExclamationCircle,
    FaExclamationTriangle,
    FaFileInvoiceDollar,
    FaFilter,
    FaFlask,
    FaHeartbeat,
    FaPills,
    FaPlus,
    FaSearch,
    FaStethoscope,
    FaSyringe,
    FaTimes,
    FaTimesCircle,
    FaTrash,
    FaUserCheck,
    FaUserEdit,
    FaUserInjured,
    FaUserMd,
    FaUserPlus,
    FaUsers,
    FaUserSlash,
    FaXRay
} from 'react-icons/fa';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    role: 'doctor',
    department: '',
    degree: '',
    specialization: '',
    availability: 'full-time',
    experience: '',
    // Common fields
    name: '',
    email: '',
    phone: '',
    // Patient specific fields
    age: '',
    address: '',
    bloodGroup: '',
    medicalHistory: '',
    // Counselor specific fields
    designation: '',
    expertise: '',
    education: '',
    yearsOfExperience: '',
    // Staff specific fields
    position: '',
    joiningDate: '',
    salary: '',
    shift: '',
    branch: '',
    batch: '',
    decision: ''
  });
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [token, setToken] = useState(localStorage.getItem('token'));

  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffStats, setStaffStats] = useState([]);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add these state variables after the existing useState declarations
  const [newStaff, setNewStaff] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    shift: '',
    joiningDate: '',
    salary: '',
    isActive: true
  });
  const [editingStaff, setEditingStaff] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'department', 'shift'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  const [appointments, setAppointments] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    byStatus: {},
    byDepartment: [],
    byType: []
  });
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    type: 'consultation',
    department: '',
    notes: '',
    symptoms: ''
  });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointmentError, setAppointmentError] = useState('');
  const [appointmentSuccess, setAppointmentSuccess] = useState('');

  // Add these state variables after the existing useState declarations
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Add billing state variables
  const [bills, setBills] = useState([]);
  const [billingStats, setBillingStats] = useState(null);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState('');
  const [billingItems, setBillingItems] = useState([]);
  const [additionalFees, setAdditionalFees] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Add billing summary state
  const [billingSummary, setBillingSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    cancelled: 0
  });

  // Predefined charges with icons
  const predefinedCharges = [
    { name: 'Consultation Fee', price: 500, icon: FaStethoscope },
    { name: 'Follow-up Visit', price: 300, icon: FaUserMd },
    { name: 'Emergency Visit', price: 1000, icon: FaAmbulance },
    { name: 'Routine Checkup', price: 400, icon: FaHeartbeat },
    { name: 'Laboratory Tests', price: 800, icon: FaFlask },
    { name: 'X-Ray', price: 600, icon: FaXRay },
    { name: 'Medicines', price: 200, icon: FaPills },
    { name: 'Injection', price: 150, icon: FaSyringe },
    { name: 'Dressing', price: 100, icon: FaBandAid },
    { name: 'ECG', price: 400, icon: FaHeartbeat }
  ];

  // Add payment status tracking
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentDate, setPaymentDate] = useState('');

  // Add state for selected invoice
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Add inventory state
  const [inventory, setInventory] = useState([]);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Medical Supplies',
    description: '',
    quantity: 0,
    unit: 'pieces',
    price: 0,
    reorderLevel: 0,
    supplier: {
      name: '',
      contact: '',
      email: ''
    },
    location: '',
    expiryDate: '',
    notes: ''
  });

  // Add dispatch state
  const [dispatches, setDispatches] = useState([]);
  const [dispatchStats, setDispatchStats] = useState(null);
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [newDispatch, setNewDispatch] = useState({
    item: '',
    quantity: 1,
    department: 'Emergency',
    issuedTo: '',
    purpose: '',
    notes: ''
  });

  // Add inventory useEffect with polling
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const [inventoryRes, statsRes] = await Promise.all([
          axios.get('http://localhost:3000/api/inventory', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/inventory/stats', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setInventory(inventoryRes.data);
        setInventoryStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      }
    };

    if (token) {
      fetchInventoryData();
      // Set up polling every 5 seconds
      const interval = setInterval(fetchInventoryData, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Add dispatch useEffect with polling
  useEffect(() => {
    const fetchDispatchData = async () => {
      try {
        const [dispatchesRes, statsRes] = await Promise.all([
          axios.get('http://localhost:3000/api/dispatch', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/dispatch/stats', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setDispatches(dispatchesRes.data);
        setDispatchStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching dispatch data:', error);
      }
    };

    if (token) {
      fetchDispatchData();
      const interval = setInterval(fetchDispatchData, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Add inventory functions with optimistic updates
  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      // Optimistic update
      const optimisticItem = {
        ...newItem,
        _id: Date.now().toString(), // Temporary ID
        status: newItem.quantity > newItem.reorderLevel ? 'In Stock' : 'Low Stock',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setInventory(prev => [optimisticItem, ...prev]);
      setShowInventoryForm(false);
      setNewItem({
        name: '',
        category: 'Medical Supplies',
        description: '',
        quantity: 0,
        unit: 'pieces',
        price: 0,
        reorderLevel: 0,
        supplier: {
          name: '',
          contact: '',
          email: ''
        },
        location: '',
        expiryDate: '',
        notes: ''
      });

      // Actual API call
      const response = await axios.post('http://localhost:3000/api/inventory', newItem, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update with real data
      setInventory(prev => prev.map(item => 
        item._id === optimisticItem._id ? response.data : item
      ));
    } catch (error) {
      console.error('Error adding inventory item:', error);
      // Revert optimistic update on error
      setInventory(prev => prev.filter(item => item._id !== Date.now().toString()));
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem(item);
    setShowInventoryForm(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      // Optimistic update
      const optimisticUpdate = {
        ...newItem,
        updatedAt: new Date()
      };
      
      setInventory(prev => prev.map(item => 
        item._id === editingItem._id ? optimisticUpdate : item
      ));
      setShowInventoryForm(false);
      setEditingItem(null);
      setNewItem({
        name: '',
        category: 'Medical Supplies',
        description: '',
        quantity: 0,
        unit: 'pieces',
        price: 0,
        reorderLevel: 0,
        supplier: {
          name: '',
          contact: '',
          email: ''
        },
        location: '',
        expiryDate: '',
        notes: ''
      });

      // Actual API call
      const response = await axios.patch(
        `http://localhost:3000/api/inventory/${editingItem._id}`,
        newItem,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update with real data
      setInventory(prev => prev.map(item => 
        item._id === editingItem._id ? response.data : item
      ));
    } catch (error) {
      console.error('Error updating inventory item:', error);
      // Revert optimistic update on error
      setInventory(prev => prev.map(item => 
        item._id === editingItem._id ? editingItem : item
      ));
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      // Optimistic update
      setInventory(prev => prev.filter(item => item._id !== itemId));

      // Actual API call
      await axios.delete(`http://localhost:3000/api/inventory/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      // Revert optimistic update on error
      const deletedItem = inventory.find(item => item._id === itemId);
      if (deletedItem) {
        setInventory(prev => [...prev, deletedItem]);
      }
    }
  };

  const handleUpdateStock = async (itemId, quantity, type) => {
    try {
      // Find the item to update
      const itemToUpdate = inventory.find(item => item._id === itemId);
      if (!itemToUpdate) return;

      // Optimistic update
      const optimisticUpdate = {
        ...itemToUpdate,
        quantity: type === 'add' 
          ? itemToUpdate.quantity + quantity 
          : itemToUpdate.quantity - quantity,
        status: type === 'add' 
          ? (itemToUpdate.quantity + quantity > itemToUpdate.reorderLevel ? 'In Stock' : 'Low Stock')
          : (itemToUpdate.quantity - quantity > itemToUpdate.reorderLevel ? 'In Stock' : 'Low Stock'),
        updatedAt: new Date()
      };

      setInventory(prev => prev.map(item => 
        item._id === itemId ? optimisticUpdate : item
      ));

      // Actual API call
      const response = await axios.patch(
        `http://localhost:3000/api/inventory/${itemId}/stock`,
        { quantity, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update with real data
      setInventory(prev => prev.map(item => 
        item._id === itemId ? response.data : item
      ));
    } catch (error) {
      console.error('Error updating stock:', error);
      // Revert optimistic update on error
      const originalItem = inventory.find(item => item._id === itemId);
      if (originalItem) {
        setInventory(prev => prev.map(item => 
          item._id === itemId ? originalItem : item
        ));
      }
    }
  };

  // Add billing useEffect
  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const [billsRes, statsRes] = await Promise.all([
          axios.get('http://localhost:3000/api/billing', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/billing/stats', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setBills(billsRes.data);
        setBillingStats(statsRes.data);

        // Calculate billing summary
        const summary = billsRes.data.reduce((acc, bill) => {
          acc.total += bill.amount;
          if (bill.status === 'paid') acc.paid += bill.amount;
          if (bill.status === 'pending') acc.pending += bill.amount;
          if (bill.status === 'cancelled') acc.cancelled += bill.amount;
          return acc;
        }, { total: 0, paid: 0, pending: 0, cancelled: 0 });
        setBillingSummary(summary);
      } catch (error) {
        console.error('Error fetching billing data:', error);
      }
    };

    if (token) {
      fetchBillingData();
    }
  }, [token]);

  // Add billing functions
  const handleCreateBill = async () => {
    try {
      const items = billingItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const totalAmount = items.reduce((total, item) => total + (item.quantity * item.price), 0) + additionalFees;

      const response = await axios.post('http://localhost:3000/api/billing', {
        patientId: selectedPatient,
        appointmentId: selectedAppointment,
        items,
        paymentMethod,
        status: paymentStatus,
        paymentDate: paymentStatus === 'paid' ? new Date() : null,
        notes: `Additional fees: ${additionalFees}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBills([response.data, ...bills]);
      setShowBillingForm(false);
      setBillingItems([]);
      setAdditionalFees(0);
      setSelectedPatient('');
      setSelectedAppointment('');
      setPaymentMethod('cash');
      setPaymentStatus('pending');
      setPaymentDate('');
    } catch (error) {
      console.error('Error creating bill:', error);
    }
  };

  const handleAddPredefinedItem = (item) => {
    setBillingItems([...billingItems, { ...item, quantity: 1 }]);
  };

  const handleUpdateItemQuantity = (index, quantity) => {
    const updatedItems = [...billingItems];
    updatedItems[index].quantity = Math.max(1, quantity);
    setBillingItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    setBillingItems(billingItems.filter((_, i) => i !== index));
  };

  const handleUpdateBillStatus = async (billId, status) => {
    try {
      await axios.patch(`http://localhost:3000/api/billing/${billId}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBills(bills.map(bill => 
        bill._id === billId ? { ...bill, status } : bill
      ));
    } catch (error) {
      console.error('Error updating bill status:', error);
    }
  };

  // Add this function to handle sorting
  const sortStaffMembers = (staff) => {
    return [...staff].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'department':
          comparison = a.department.localeCompare(b.department);
          break;
        case 'shift':
          comparison = a.shift.localeCompare(b.shift);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Add this function to filter staff members
  const filterStaffMembers = (staff) => {
    return staff.filter(member => 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.position.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        // Redirect to login if no token
        window.location.href = '/login';
        return;
      }
      setToken(storedToken);
    };
    checkAuth();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!newUser.username || !newUser.password || !newUser.name || !newUser.email || !newUser.phone) {
        setError('Please fill in all required fields');
        return;
      }

      // Create a user object with all fields
      const userData = {
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
        // Common fields (required)
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        // Role-specific fields
        ...(newUser.role === 'doctor' && {
          department: newUser.department,
          degree: newUser.degree,
          specialization: newUser.specialization,
          availability: newUser.availability,
          experience: newUser.experience
        }),
        ...(newUser.role === 'patient' && {
          age: newUser.age,
          address: newUser.address,
          bloodGroup: newUser.bloodGroup,
          medicalHistory: newUser.medicalHistory
        }),
        ...(newUser.role === 'counselor' && {
          designation: newUser.designation,
          department: newUser.department,
          expertise: newUser.expertise,
          education: newUser.education,
          yearsOfExperience: newUser.yearsOfExperience,
          specialization: newUser.specialization,
          branch: newUser.branch,
          batch: newUser.batch,
          decision: newUser.decision
        }),
        ...(newUser.role === 'staff' && {
          position: newUser.position,
          department: newUser.department,
          shift: newUser.shift,
          joiningDate: newUser.joiningDate,
          salary: newUser.salary
        })
      };

      // Remove any undefined or null values
      Object.keys(userData).forEach(key => {
        if (userData[key] === undefined || userData[key] === null || userData[key] === '') {
          delete userData[key];
        }
      });

      const response = await axios.post('http://localhost:3000/api/users/register', userData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setUsers([...users, response.data]);
      setNewUser({ 
        username: '', 
        password: '', 
        role: 'doctor',
        department: '',
        degree: '',
        specialization: '',
        availability: 'full-time',
        experience: '',
        name: '',
        email: '',
        phone: '',
        age: '',
        address: '',
        bloodGroup: '',
        medicalHistory: '',
        designation: '',
        expertise: '',
        education: '',
        yearsOfExperience: '',
        position: '',
        joiningDate: '',
        salary: '',
        shift: '',
        branch: '',
        batch: '',
        decision: ''
      });
      setSuccess('User added successfully');
    } catch (error) {
      console.error('Add user error:', error);
      setError(error.response?.data?.error || 'Error adding user');
    }
  };

  const handleEditUser = async (id) => {
    const user = users.find(u => u._id === id);
    if (!user) {
      setError('User not found');
      return;
    }
    
    setEditingUser(user);
    setNewUser({
      username: user.username,
      role: user.role,
      department: user.department || '',
      degree: user.degree || '',
      specialization: user.specialization || '',
      availability: user.availability || 'full-time',
      experience: user.experience || '',
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      age: user.age || '',
      address: user.address || '',
      bloodGroup: user.bloodGroup || '',
      medicalHistory: user.medicalHistory || '',
      designation: user.designation || '',
      expertise: user.expertise || '',
      education: user.education || '',
      yearsOfExperience: user.yearsOfExperience || '',
      position: user.position || '',
      joiningDate: user.joiningDate || '',
      salary: user.salary || '',
      shift: user.shift || '',
      branch: user.branch || '',
      batch: user.batch || '',
      decision: user.decision || ''
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const updateData = {};
      
      // Only include fields that have changed from the original user data
      if (newUser.username !== editingUser.username) updateData.username = newUser.username;
      if (newUser.role !== editingUser.role) updateData.role = newUser.role;
      if (newUser.name !== editingUser.name) updateData.name = newUser.name;
      if (newUser.email !== editingUser.email) updateData.email = newUser.email;
      if (newUser.phone !== editingUser.phone) updateData.phone = newUser.phone;

      // Add role-specific fields only if they've changed
      if (newUser.role === 'doctor') {
        if (newUser.department !== editingUser.department) updateData.department = newUser.department;
        if (newUser.degree !== editingUser.degree) updateData.degree = newUser.degree;
        if (newUser.specialization !== editingUser.specialization) updateData.specialization = newUser.specialization;
        if (newUser.availability !== editingUser.availability) updateData.availability = newUser.availability;
        if (newUser.experience !== editingUser.experience) updateData.experience = newUser.experience;
      } else if (newUser.role === 'patient') {
        if (newUser.age !== editingUser.age) updateData.age = newUser.age;
        if (newUser.address !== editingUser.address) updateData.address = newUser.address;
        if (newUser.bloodGroup !== editingUser.bloodGroup) updateData.bloodGroup = newUser.bloodGroup;
        if (newUser.medicalHistory !== editingUser.medicalHistory) updateData.medicalHistory = newUser.medicalHistory;
      } else if (newUser.role === 'counselor') {
        if (newUser.designation !== editingUser.designation) updateData.designation = newUser.designation;
        if (newUser.department !== editingUser.department) updateData.department = newUser.department;
        if (newUser.expertise !== editingUser.expertise) updateData.expertise = newUser.expertise;
        if (newUser.education !== editingUser.education) updateData.education = newUser.education;
        if (newUser.yearsOfExperience !== editingUser.yearsOfExperience) updateData.yearsOfExperience = newUser.yearsOfExperience;
        if (newUser.specialization !== editingUser.specialization) updateData.specialization = newUser.specialization;
        if (newUser.branch !== editingUser.branch) updateData.branch = newUser.branch;
        if (newUser.batch !== editingUser.batch) updateData.batch = newUser.batch;
        if (newUser.decision !== editingUser.decision) updateData.decision = newUser.decision;
      } else if (newUser.role === 'staff') {
        if (newUser.position !== editingUser.position) updateData.position = newUser.position;
        if (newUser.department !== editingUser.department) updateData.department = newUser.department;
        if (newUser.shift !== editingUser.shift) updateData.shift = newUser.shift;
        if (newUser.joiningDate !== editingUser.joiningDate) updateData.joiningDate = newUser.joiningDate;
        if (newUser.salary !== editingUser.salary) updateData.salary = newUser.salary;
      }

      // Remove any undefined or null values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null || updateData[key] === '') {
          delete updateData[key];
        }
      });

      const response = await axios.patch(`http://localhost:3000/api/users/${editingUser._id}`, updateData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setUsers(users.map(user => 
        user._id === editingUser._id ? response.data : user
      ));
      
      setEditingUser(null);
      setNewUser({ 
        username: '', 
        password: '', 
        role: 'doctor',
        department: '',
        degree: '',
        specialization: '',
        availability: 'full-time',
        experience: '',
        name: '',
        email: '',
        phone: '',
        age: '',
        address: '',
        bloodGroup: '',
        medicalHistory: '',
        designation: '',
        expertise: '',
        education: '',
        yearsOfExperience: '',
        position: '',
        joiningDate: '',
        salary: '',
        shift: '',
        branch: '',
        batch: '',
        decision: ''
      });
      
      setSuccess('User updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.error || 'Error updating user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      try {
        console.log('Attempting to delete user:', id);
        console.log('Token:', token);
        
        const response = await axios.delete(`http://localhost:3000/api/users/${id}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Delete response:', response.data);
        
        if (response.data.message) {
          // Update both users and filteredUsers lists
          setUsers(prevUsers => prevUsers.filter(user => user._id !== id));
          setFilteredUsers(prevFiltered => prevFiltered.filter(user => user._id !== id));
        setSuccess('User deleted successfully');
        } else {
          setError('Failed to delete user');
        }
      } catch (error) {
        console.error('Delete error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Error headers:', error.response?.headers);
        
        if (error.response?.status === 403) {
          setError('Cannot delete admin user');
        } else if (error.response?.status === 404) {
          setError('User not found');
        } else if (error.response?.status === 401) {
          setError('Please authenticate');
        } else {
        setError(error.response?.data?.error || 'Error deleting user');
        }
      }
    }
  };

  const handleToggleUserStatus = async (id, currentStatus) => {
    try {
      const endpoint = currentStatus ? 'deactivate' : 'activate';
      await axios.patch(`http://localhost:3000/api/users/${id}/${endpoint}`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setUsers(users.map(user => 
        user._id === id ? { ...user, isActive: !currentStatus } : user
      ));
      setSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      setError(error.response?.data?.error || `Error ${currentStatus ? 'deactivating' : 'activating'} user`);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:3000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        setError(error.response?.data?.error || 'Error fetching users');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token) {
    fetchUsers();
    }
  }, [token]);

  useEffect(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        // Basic information search
        const basicInfoMatch = 
          user.username?.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.phone?.includes(searchTerm) ||
          user.role?.toLowerCase().includes(searchLower);

        // Role-specific search
        let roleSpecificMatch = false;
        if (user.role === 'doctor') {
          roleSpecificMatch = 
            user.department?.toLowerCase().includes(searchLower) ||
            user.degree?.toLowerCase().includes(searchLower) ||
            user.specialization?.toLowerCase().includes(searchLower);
        } else if (user.role === 'patient') {
          roleSpecificMatch = 
            user.age?.toString().includes(searchTerm) ||
            user.bloodGroup?.toLowerCase().includes(searchLower) ||
            user.address?.toLowerCase().includes(searchLower);
        } else if (user.role === 'counselor') {
          roleSpecificMatch = 
            user.designation?.toLowerCase().includes(searchLower) ||
            user.expertise?.toLowerCase().includes(searchLower) ||
            user.education?.toLowerCase().includes(searchLower);
        } else if (user.role === 'staff') {
          roleSpecificMatch = 
            user.position?.toLowerCase().includes(searchLower) ||
            user.department?.toLowerCase().includes(searchLower) ||
            user.shift?.toLowerCase().includes(searchLower);
        }

        return basicInfoMatch || roleSpecificMatch;
      });
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  // Add debounce to search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const [staff] = useState([
    { id: 1, name: "Jane Doe", role: "Nurse", department: "Emergency" },
    { id: 2, name: "John Smith", role: "Receptionist", department: "Front Desk" }
  ]);

  useEffect(() => {
    const fetchStaffData = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        const [staffResponse, statsResponse] = await Promise.all([
          axios.get('http://localhost:3000/api/staff', {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          axios.get('http://localhost:3000/api/staff/stats', {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);
        
        setStaffMembers(staffResponse.data);
        setStaffStats(statsResponse.data);
        setScheduleSuccess('Staff data loaded successfully');
      } catch (error) {
        console.error('Error fetching staff data:', error);
        setScheduleError(error.response?.data?.error || 'Error fetching staff data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStaffData();
  }, [token]);

  const handleUpdateSchedule = async (staffId, newShift) => {
    if (!token) return;
    
    setIsLoading(true);
    setScheduleError('');
    
    try {
      await axios.patch(
        `http://localhost:3000/api/staff/schedule/${staffId}`,
        { shift: newShift },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setStaffMembers(prevStaff => 
        prevStaff.map(staff => 
          staff._id === staffId ? { ...staff, shift: newShift } : staff
        )
      );
      setScheduleSuccess('Schedule updated successfully');
    } catch (error) {
      console.error('Error updating schedule:', error);
      setScheduleError(error.response?.data?.error || 'Error updating schedule');
    } finally {
      setIsLoading(false);
    }
  };

  // Add these functions after the existing function declarations
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/staff', newStaff, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setStaffMembers([...staffMembers, response.data]);
      setNewStaff({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        shift: '',
        joiningDate: '',
        salary: '',
        isActive: true
      });
      setSuccess('Staff member added successfully');
    } catch (error) {
      console.error('Add staff error:', error);
      setError(error.response?.data?.error || 'Error adding staff member');
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setNewStaff({
      username: staff.username,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      position: staff.position,
      department: staff.department,
      shift: staff.shift,
      joiningDate: staff.joiningDate,
      salary: staff.salary,
      isActive: staff.isActive
    });
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.patch(
        `http://localhost:3000/api/staff/${editingStaff._id}`,
        newStaff,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setStaffMembers(staffMembers.map(staff => 
        staff._id === editingStaff._id ? response.data : staff
      ));
      setEditingStaff(null);
      setNewStaff({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        shift: '',
        joiningDate: '',
        salary: '',
        isActive: true
      });
      setSuccess('Staff member updated successfully');
    } catch (error) {
      console.error('Update staff error:', error);
      setError(error.response?.data?.error || 'Error updating staff member');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await axios.delete(`http://localhost:3000/api/staff/${staffId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setStaffMembers(staffMembers.filter(staff => staff._id !== staffId));
        setSuccess('Staff member deleted successfully');
      } catch (error) {
        console.error('Delete staff error:', error);
        setError(error.response?.data?.error || 'Error deleting staff member');
      }
    }
  };

  const handleAddMultipleStaff = async () => {
    const staffData = [
      // Nursing Department
      {
        username: "priya.nurse",
        password: "password123",
        name: "Priya Sharma",
        email: "priya.sharma@hospital.com",
        phone: "9876543210",
        position: "nurse",
        department: "nursing",
        shift: "morning",
        joiningDate: "2023-01-15",
        salary: "35000",
        isActive: true
      },
      {
        username: "rajesh.nurse",
        password: "password123",
        name: "Rajesh Kumar",
        email: "rajesh.kumar@hospital.com",
        phone: "9876543211",
        position: "nurse",
        department: "nursing",
        shift: "afternoon",
        joiningDate: "2023-02-20",
        salary: "35000",
        isActive: true
      },
      {
        username: "anita.nurse",
        password: "password123",
        name: "Anita Patel",
        email: "anita.patel@hospital.com",
        phone: "9876543212",
        position: "nurse",
        department: "nursing",
        shift: "night",
        joiningDate: "2023-03-10",
        salary: "35000",
        isActive: true
      },
      // Laboratory Department
      {
        username: "amit.lab",
        password: "password123",
        name: "Amit Singh",
        email: "amit.singh@hospital.com",
        phone: "9876543213",
        position: "lab_technician",
        department: "laboratory",
        shift: "morning",
        joiningDate: "2023-01-20",
        salary: "30000",
        isActive: true
      },
      {
        username: "neha.lab",
        password: "password123",
        name: "Neha Gupta",
        email: "neha.gupta@hospital.com",
        phone: "9876543214",
        position: "lab_technician",
        department: "laboratory",
        shift: "afternoon",
        joiningDate: "2023-02-25",
        salary: "30000",
        isActive: true
      },
      // Pharmacy Department
      {
        username: "vikram.pharma",
        password: "password123",
        name: "Vikram Verma",
        email: "vikram.verma@hospital.com",
        phone: "9876543215",
        position: "pharmacist",
        department: "pharmacy",
        shift: "morning",
        joiningDate: "2023-01-30",
        salary: "40000",
        isActive: true
      },
      {
        username: "meera.pharma",
        password: "password123",
        name: "Meera Reddy",
        email: "meera.reddy@hospital.com",
        phone: "9876543216",
        position: "pharmacist",
        department: "pharmacy",
        shift: "afternoon",
        joiningDate: "2023-02-15",
        salary: "40000",
        isActive: true
      },
      // Housekeeping Department
      {
        username: "ramesh.house",
        password: "password123",
        name: "Ramesh Yadav",
        email: "ramesh.yadav@hospital.com",
        phone: "9876543217",
        position: "housekeeping",
        department: "housekeeping",
        shift: "morning",
        joiningDate: "2023-01-10",
        salary: "20000",
        isActive: true
      },
      {
        username: "laxmi.house",
        password: "password123",
        name: "Laxmi Devi",
        email: "laxmi.devi@hospital.com",
        phone: "9876543218",
        position: "housekeeping",
        department: "housekeeping",
        shift: "afternoon",
        joiningDate: "2023-02-05",
        salary: "20000",
        isActive: true
      },
      // Security Department
      {
        username: "suresh.security",
        password: "password123",
        name: "Suresh Kumar",
        email: "suresh.kumar@hospital.com",
        phone: "9876543219",
        position: "security",
        department: "security",
        shift: "morning",
        joiningDate: "2023-01-25",
        salary: "25000",
        isActive: true
      },
      {
        username: "mohan.security",
        password: "password123",
        name: "Mohan Singh",
        email: "mohan.singh@hospital.com",
        phone: "9876543220",
        position: "security",
        department: "security",
        shift: "night",
        joiningDate: "2023-02-30",
        salary: "25000",
        isActive: true
      },
      // Additional Staff
      {
        username: "arun.admin",
        password: "password123",
        name: "Arun Kumar",
        email: "arun.kumar@hospital.com",
        phone: "9876543221",
        position: "admin_assistant",
        department: "administration",
        shift: "morning",
        joiningDate: "2023-01-05",
        salary: "30000",
        isActive: true
      },
      {
        username: "pallavi.it",
        password: "password123",
        name: "Pallavi Sharma",
        email: "pallavi.sharma@hospital.com",
        phone: "9876543222",
        position: "it_staff",
        department: "administration",
        shift: "morning",
        joiningDate: "2023-02-10",
        salary: "45000",
        isActive: true
      }
    ];

    try {
      for (const staff of staffData) {
        await axios.post('http://localhost:3000/api/staff', staff, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Refresh staff list
      const response = await axios.get('http://localhost:3000/api/staff', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setStaffMembers(response.data);
      setSuccess('Staff members added successfully');
    } catch (error) {
      console.error('Add staff error:', error);
      setError(error.response?.data?.error || 'Error adding staff members');
    }
  };

  // Add this useEffect to fetch appointments and stats
  useEffect(() => {
    const fetchAppointmentsData = async () => {
      try {
        const [appointmentsRes, statsRes] = await Promise.all([
          axios.get('http://localhost:3000/api/appointments', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/appointments/stats', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Log the appointments data to check the structure
        console.log('Fetched appointments:', appointmentsRes.data);

        // Ensure we have the populated data
        const appointmentsWithNames = appointmentsRes.data.map(apt => ({
          ...apt,
          patientName: apt.patient?.name || 'Patient Name Not Available',
          doctorName: apt.doctor?.name || 'Doctor Name Not Available'
        }));

        setAppointments(appointmentsWithNames);
        setAppointmentStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setAppointmentError(error.response?.data?.error || 'Error fetching appointments');
      }
    };

    const fetchUsersData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter users by role
        const doctors = response.data.filter(user => user.role === 'doctor');
        const patients = response.data.filter(user => user.role === 'patient');
        
        setDoctors(doctors);
        setPatients(patients);
      } catch (error) {
        console.error('Error fetching users:', error);
        setAppointmentError('Error fetching users data');
      }
    };

    if (token) {
      fetchAppointmentsData();
      fetchUsersData();
    }
  }, [token]);

  // Add this function to handle appointment creation
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!newAppointment.patientId || !newAppointment.doctorId || !newAppointment.date || !newAppointment.time) {
        setAppointmentError('Please fill in all required fields');
        return;
      }

      // Get the selected doctor's department
      const selectedDoctor = doctors.find(d => d._id === newAppointment.doctorId);
      if (!selectedDoctor) {
        setAppointmentError('Selected doctor not found');
        return;
      }

      // Create appointment data with proper field names
      const appointmentData = {
        patientId: newAppointment.patientId,
        doctorId: newAppointment.doctorId,
        date: newAppointment.date,
        time: newAppointment.time,
        department: selectedDoctor.department,
        type: newAppointment.type || 'consultation',
        symptoms: newAppointment.symptoms || '',
        notes: newAppointment.notes || ''
      };

      console.log('Sending appointment data:', appointmentData); // Debug log

      const response = await axios.post('http://localhost:3000/api/appointments', appointmentData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        // Update appointments list
        setAppointments([...appointments, response.data]);
        
        // Reset form
        setNewAppointment({
          patientId: '',
          doctorId: '',
          date: '',
          time: '',
          type: 'consultation',
          department: '',
          notes: '',
          symptoms: ''
        });
        setPatientSearchTerm('');
        setAppointmentSuccess('Appointment scheduled successfully');
      } else {
        setAppointmentError('Failed to create appointment');
      }
    } catch (error) {
      console.error('Create appointment error:', error);
      console.error('Error response:', error.response?.data); // Debug log
      setAppointmentError(error.response?.data?.error || 'Error scheduling appointment');
    }
  };

  // Add this function to handle appointment status updates
  const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:3000/api/appointments/${appointmentId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAppointments(appointments.map(apt => 
        apt._id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
      setAppointmentSuccess('Appointment status updated successfully');
    } catch (error) {
      setAppointmentError(error.response?.data?.error || 'Error updating appointment status');
    }
  };

  // Add this function to filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesDate = !selectedAppointmentDate || apt.date.split('T')[0] === selectedAppointmentDate;
    const matchesDepartment = !selectedDepartment || apt.department === selectedDepartment;
    return matchesDate && matchesDepartment;
  });

  // Add this useEffect to filter patients based on search term
  useEffect(() => {
    if (patientSearchTerm.trim()) {
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
      setShowPatientDropdown(true);
    } else {
      setFilteredPatients([]);
      setShowPatientDropdown(false);
    }
  }, [patientSearchTerm, patients]);

  // Add this function to handle patient selection
  const handlePatientSelect = (patient) => {
    setNewAppointment({ ...newAppointment, patientId: patient._id });
    setPatientSearchTerm(patient.name);
    setShowPatientDropdown(false);
  };

  // Add dispatch functions with optimistic updates
  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    try {
      // Optimistic update
      const optimisticDispatch = {
        ...newDispatch,
        _id: Date.now().toString(),
        status: 'Pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        item: inventory.find(item => item._id === newDispatch.item)
      };
      
      setDispatches(prev => [optimisticDispatch, ...prev]);
      setShowDispatchForm(false);
      setNewDispatch({
        item: '',
        quantity: 1,
        department: 'Emergency',
        issuedTo: '',
        purpose: '',
        notes: ''
      });

      // Actual API call
      const response = await axios.post('http://localhost:3000/api/dispatch', newDispatch, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update with real data
      setDispatches(prev => prev.map(dispatch => 
        dispatch._id === optimisticDispatch._id ? response.data : dispatch
      ));
    } catch (error) {
      console.error('Error creating dispatch:', error);
      // Revert optimistic update on error
      setDispatches(prev => prev.filter(dispatch => dispatch._id !== Date.now().toString()));
    }
  };

  const handleUpdateDispatchStatus = async (dispatchId, status) => {
    try {
      // Optimistic update
      setDispatches(prev => prev.map(dispatch => 
        dispatch._id === dispatchId ? { ...dispatch, status } : dispatch
      ));

      // Actual API call
      const response = await axios.patch(
        `http://localhost:3000/api/dispatch/${dispatchId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update with real data
      setDispatches(prev => prev.map(dispatch => 
        dispatch._id === dispatchId ? response.data : dispatch
      ));
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      // Revert optimistic update on error
      const originalDispatch = dispatches.find(dispatch => dispatch._id === dispatchId);
      if (originalDispatch) {
        setDispatches(prev => prev.map(dispatch => 
          dispatch._id === dispatchId ? originalDispatch : dispatch
        ));
      }
    }
  };

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen max-w-[3000px] mx-auto">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent)]"></div>
        </div>
      ) : (
        <>
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
        <div className="flex items-center space-x-4">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <FaUserPlus className="text-[var(--accent)] text-xl" />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm animate-fade-in">
          <div className="flex items-center">
            <FaExclamationCircle className="text-red-500 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm animate-fade-in">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-3" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      <Tab.Group>
        <Tab.List className="flex space-x-4 bg-white p-2 rounded-xl shadow-sm overflow-x-auto">
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              selected 
                ? 'bg-[var(--accent)] text-white shadow-md transform scale-105' 
                : 'text-gray-600 hover:text-[var(--accent)] hover:bg-gray-50'
            }`
          }>
            <FaUsers className="text-lg" />
            <span>User Management</span>
          </Tab>
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              selected 
                ? 'bg-[var(--accent)] text-white shadow-md transform scale-105' 
                : 'text-gray-600 hover:text-[var(--accent)] hover:bg-gray-50'
            }`
          }>
            <FaCalendar className="text-lg" />
            <span>Appointments</span>
          </Tab>
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              selected 
                ? 'bg-[var(--accent)] text-white shadow-md transform scale-105' 
                : 'text-gray-600 hover:text-[var(--accent)] hover:bg-gray-50'
            }`
          }>
            <FaUserMd className="text-lg" />
            <span>Staff Management</span>
          </Tab>
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              selected 
                ? 'bg-[var(--accent)] text-white shadow-md transform scale-105' 
                : 'text-gray-600 hover:text-[var(--accent)] hover:bg-gray-50'
            }`
          }>
            <FaFileInvoiceDollar className="text-lg" />
            <span>Billing</span>
          </Tab>
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              selected 
                ? 'bg-[var(--accent)] text-white shadow-md transform scale-105' 
                : 'text-gray-600 hover:text-[var(--accent)] hover:bg-gray-50'
            }`
          }>
            <FaBoxes className="text-lg" />
            <span>Inventory</span>
          </Tab>
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              selected 
                ? 'bg-[var(--accent)] text-white shadow-md transform scale-105' 
                : 'text-gray-600 hover:text-[var(--accent)] hover:bg-gray-50'
            }`
          }>
            <FaChartBar className="text-lg" />
            <span>Reports</span>
          </Tab>
          <Tab className={({ selected }) =>
            `flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
              selected 
                ? 'bg-[var(--accent)] text-white shadow-md transform scale-105' 
                : 'text-gray-600 hover:text-[var(--accent)] hover:bg-gray-50'
            }`
          }>
            <FaCog className="text-lg" />
            <span>Settings</span>
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-6">
          {/* User Management Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Add/Edit User Form */}
              <div className="bg-white shadow-lg rounded-xl p-8 transform hover:scale-[1.02] transition-transform duration-200">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-[var(--accent)]/10 p-2 rounded-lg">
                    {editingUser ? (
                      <FaUserEdit className="text-[var(--accent)] text-xl" />
                    ) : (
                      <FaUserPlus className="text-[var(--accent)] text-xl" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                </div>
                <form className="space-y-6" onSubmit={editingUser ? handleUpdateUser : handleAddUser}>
                      {/* Basic Information */}
                      <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-gray-50" 
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  {!editingUser && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-gray-50" 
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Enter password"
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-gray-50"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      required
                    >
                      <option value="doctor">Doctor</option>
                      <option value="counselor">Counselor</option>
                      <option value="patient">Patient</option>
                            <option value="staff">Staff</option>
                    </select>
                        </div>
                  </div>
                  
                      {/* Personal Information */}
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-700">Personal Information</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                              value={newUser.name}
                              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                              placeholder="Enter full name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input 
                              type="email" 
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                              value={newUser.email}
                              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                              placeholder="Enter email address"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input 
                              type="tel" 
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                              value={newUser.phone}
                              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                              placeholder="Enter phone number"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Role-specific fields */}
                  {newUser.role === 'doctor' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-700">Doctor Details</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Department</label>
                          <select 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                            value={newUser.department}
                            onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                            required
                          >
                            <option value="">Select Department</option>
                            <option value="cardiology">Cardiology</option>
                            <option value="neurology">Neurology</option>
                            <option value="pediatrics">Pediatrics</option>
                            <option value="orthopedics">Orthopedics</option>
                            <option value="dental">Dental</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Degree</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                            value={newUser.degree}
                            onChange={(e) => setNewUser({ ...newUser, degree: e.target.value })}
                            placeholder="Enter degree"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Specialization</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                            value={newUser.specialization}
                            onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })}
                            placeholder="Enter specialization"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Availability</label>
                          <select 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white"
                            value={newUser.availability}
                            onChange={(e) => setNewUser({ ...newUser, availability: e.target.value })}
                            required
                          >
                            <option value="full-time">Full Time</option>
                            <option value="part-time">Part Time</option>
                            <option value="visiting">Visiting</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
                          <input 
                            type="number" 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                            value={newUser.experience}
                            onChange={(e) => setNewUser({ ...newUser, experience: e.target.value })}
                            placeholder="Enter years of experience"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                      {/* Patient-specific fields */}
                      {newUser.role === 'patient' && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-700">Patient Details</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Age</label>
                              <input 
                                type="number" 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                                value={newUser.age}
                                onChange={(e) => setNewUser({ ...newUser, age: e.target.value })}
                                placeholder="Enter age"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Address</label>
                              <textarea 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                                value={newUser.address}
                                onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                                placeholder="Enter address"
                                rows="3"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                              <select 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white"
                                value={newUser.bloodGroup}
                                onChange={(e) => setNewUser({ ...newUser, bloodGroup: e.target.value })}
                                required
                              >
                                <option value="">Select Blood Group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Medical History</label>
                              <textarea 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                                value={newUser.medicalHistory}
                                onChange={(e) => setNewUser({ ...newUser, medicalHistory: e.target.value })}
                                placeholder="Enter medical history"
                                rows="3"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Counselor-specific fields */}
                      {newUser.role === 'counselor' && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-700">Counselor Details</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Institute</label>
                              <input 
                                type="text" 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                                value="CHARUSAT"
                                disabled
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Branch</label>
                              <select 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                                value={newUser.branch}
                                onChange={(e) => setNewUser({ ...newUser, branch: e.target.value })}
                                required
                              >
                                <option value="">Select Branch</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Information Technology">Information Technology</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Mechanical">Mechanical</option>
                                <option value="Civil">Civil</option>
                                <option value="Chemical">Chemical</option>
                                <option value="Biotechnology">Biotechnology</option>
                                <option value="Pharmacy">Pharmacy</option>
                                <option value="Business">Business</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Batch</label>
                              <input 
                                type="text" 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                                value={newUser.batch}
                                onChange={(e) => setNewUser({ ...newUser, batch: e.target.value })}
                                placeholder="Enter batch (e.g., 2023-24)"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Decision</label>
                              <select 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                                value={newUser.decision}
                                onChange={(e) => setNewUser({ ...newUser, decision: e.target.value })}
                                required
                              >
                                <option value="">Select Decision</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Staff-specific fields */}
                      {newUser.role === 'staff' && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-700">Staff Details</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Position</label>
                              <select 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                                value={newUser.position}
                                onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                                required
                              >
                                <option value="">Select Position</option>
                                <option value="nurse">Nurse</option>
                                <option value="receptionist">Receptionist</option>
                                <option value="pharmacist">Pharmacist</option>
                                <option value="lab_technician">Lab Technician</option>
                                <option value="radiologist">Radiologist</option>
                                <option value="housekeeping">Housekeeping Staff</option>
                                <option value="security">Security Guard</option>
                                <option value="maintenance">Maintenance Staff</option>
                                <option value="cafeteria">Cafeteria Staff</option>
                                <option value="ward_boy">Ward Boy</option>
                                <option value="ambulance_driver">Ambulance Driver</option>
                                <option value="data_entry">Data Entry Operator</option>
                                <option value="billing_staff">Billing Staff</option>
                                <option value="inventory_manager">Inventory Manager</option>
                                <option value="hr_staff">HR Staff</option>
                                <option value="it_staff">IT Staff</option>
                                <option value="admin_assistant">Administrative Assistant</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Department</label>
                              <select 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                                value={newUser.department}
                                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                required
                              >
                                <option value="">Select Department</option>
                                <option value="administration">Administration</option>
                                <option value="nursing">Nursing</option>
                                <option value="laboratory">Laboratory</option>
                                <option value="pharmacy">Pharmacy</option>
                                <option value="housekeeping">Housekeeping</option>
                                <option value="security">Security</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Shift</label>
                              <select 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white"
                                value={newUser.shift}
                                onChange={(e) => setNewUser({ ...newUser, shift: e.target.value })}
                                required
                              >
                                <option value="">Select Shift</option>
                                <option value="morning">Morning (8 AM - 4 PM)</option>
                                <option value="afternoon">Afternoon (4 PM - 12 AM)</option>
                                <option value="night">Night (12 AM - 8 AM)</option>
                                <option value="flexible">Flexible</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                              <input 
                                type="date" 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                                value={newUser.joiningDate}
                                onChange={(e) => setNewUser({ ...newUser, joiningDate: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Salary</label>
                              <input 
                                type="number" 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-white" 
                                value={newUser.salary}
                                onChange={(e) => setNewUser({ ...newUser, salary: e.target.value })}
                                placeholder="Enter salary"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="submit" 
                      className="flex-1 bg-[var(--accent)] text-white py-3 px-6 rounded-lg hover:bg-[var(--accent)]/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      {editingUser ? 'Update User' : 'Add User'}
                    </button>
                    {editingUser && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingUser(null);
                          setNewUser({ 
                            username: '', 
                            password: '', 
                            role: 'doctor',
                            department: '',
                            degree: '',
                            specialization: '',
                            availability: 'full-time',
                                experience: '',
                                name: '',
                                email: '',
                                phone: '',
                                age: '',
                                address: '',
                                designation: '',
                                expertise: '',
                                education: '',
                                yearsOfExperience: '',
                                position: '',
                                joiningDate: '',
                                salary: '',
                                shift: ''
                          });
                        }}
                        className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* User List */}
              <div className="bg-white shadow-lg rounded-xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[var(--accent)]/10 p-2 rounded-lg">
                      <FaUsers className="text-[var(--accent)] text-xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Manage Users</h3>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-gray-50"
                        value={searchTerm}
                            onChange={handleSearchChange}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <FaFilter className="h-5 w-5 text-gray-400" />
                      <select
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all bg-gray-50"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <option value="all">All Roles</option>
                        <option value="doctor">Doctor</option>
                        <option value="counselor">Counselor</option>
                        <option value="patient">Patient</option>
                            <option value="staff">Staff</option>
                      </select>
                    </div>
                  </div>
                </div>
                    <div className="space-y-4 h-[1200px] overflow-y-auto pr-2">
                  {filteredUsers.map(user => (
                    <div 
                      key={user._id} 
                          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                        >
                          {/* User Details Card */}
                          <div className="bg-white rounded-lg shadow-sm p-4">
                            {/* Header Section */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                                  <span className="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                  </span>
                              </div>
                                <div className="text-gray-600 text-sm">{user.email}</div>
                                <div className="text-gray-600 text-sm">{user.phone}</div>
                              </div>
                              
                              <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditUser(user._id)}
                                  className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1"
                          >
                                  <FaUserEdit className="text-xs" />
                            <span>Edit</span>
                          </button>
                                {user.role !== 'admin' && (
                          <button 
                            onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                                    className={`px-3 py-1.5 rounded text-white text-sm flex items-center gap-1 ${
                                      user.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                                    }`}
                          >
                            {user.isActive ? (
                              <>
                                        <FaUserSlash className="text-xs" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                        <FaUserCheck className="text-xs" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                                )}
                          <button 
                            onClick={() => handleDeleteUser(user._id)}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-sm flex items-center gap-1"
                          >
                                  <FaTrash className="text-xs" />
                            <span>Delete</span>
                          </button>
                              </div>
                            </div>

                            {/* Role-specific Information */}
                            <div className="mt-4 border-t pt-4">
                              {user.role === 'staff' && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Position</div>
                                    <div className="text-gray-900">{user.position.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Department</div>
                                    <div className="text-gray-900">{user.department.charAt(0).toUpperCase() + user.department.slice(1)}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Shift</div>
                                    <div className="text-gray-900">{user.shift.charAt(0).toUpperCase() + user.shift.slice(1)}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Joining Date</div>
                                    <div className="text-gray-900">{new Date(user.joiningDate).toLocaleDateString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Salary</div>
                                    <div className="text-gray-900">₹{user.salary}</div>
                                  </div>
                                </div>
                              )}

                              {user.role === 'doctor' && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Department</div>
                                    <div className="text-gray-900">{user.department.charAt(0).toUpperCase() + user.department.slice(1)}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Specialization</div>
                                    <div className="text-gray-900">{user.specialization}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Degree</div>
                                    <div className="text-gray-900">{user.degree}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Experience</div>
                                    <div className="text-gray-900">{user.experience} years</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Availability</div>
                                    <div className="text-gray-900">{user.availability}</div>
                                  </div>
                                </div>
                              )}

                              {user.role === 'counselor' && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Designation</div>
                                    <div className="text-gray-900">{user.designation}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Department</div>
                                    <div className="text-gray-900">{user.department}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Expertise</div>
                                    <div className="text-gray-900">{user.expertise}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Education</div>
                                    <div className="text-gray-900">{user.education}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Experience</div>
                                    <div className="text-gray-900">{user.yearsOfExperience} years</div>
                                  </div>
                                </div>
                              )}

                              {user.role === 'patient' && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Age</div>
                                    <div className="text-gray-900">{user.age} years</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Blood Group</div>
                                    <div className="text-gray-900">{user.bloodGroup}</div>
                                  </div>
                                  <div className="col-span-2">
                                    <div className="text-sm font-medium text-gray-500">Address</div>
                                    <div className="text-gray-900">{user.address}</div>
                                  </div>
                                  <div className="col-span-2">
                                    <div className="text-sm font-medium text-gray-500">Medical History</div>
                                    <div className="text-gray-900">{user.medicalHistory}</div>
                                  </div>
                                </div>
                              )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Appointments Panel */}
          <Tab.Panel>
            <div className="space-y-6">
              {/* Appointment Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Appointments</p>
                      <p className="text-2xl font-bold mt-1">{appointmentStats.total || 0}</p>
                  </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FaCalendarAlt className="text-blue-500 text-xl" />
                  </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Pending</p>
                      <p className="text-2xl font-bold mt-1">{appointmentStats.byStatus?.scheduled || 0}</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <FaClock className="text-yellow-500 text-xl" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Completed</p>
                      <p className="text-2xl font-bold mt-1">{appointmentStats.byStatus?.completed || 0}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <FaCheckCircle className="text-green-500 text-xl" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Cancelled</p>
                      <p className="text-2xl font-bold mt-1">{appointmentStats.byStatus?.cancelled || 0}</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-full">
                      <FaTimesCircle className="text-red-500 text-xl" />
                    </div>
                  </div>
                  </div>
                </div>

                {/* Department-wise Statistics */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold mb-4">Department-wise Distribution</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appointmentStats.byDepartment?.map((dept, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-800">{dept.department}</h5>
                        <span className="text-sm text-gray-500">Total: {dept.total}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Pending</span>
                          <span className="font-medium text-yellow-500">{dept.pending}</span>
                </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Completed</span>
                          <span className="font-medium text-green-500">{dept.completed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Cancelled</span>
                          <span className="font-medium text-red-500">{dept.cancelled}</span>
                        </div>
                      </div>
                      </div>
                    ))}
                  </div>
                </div>

              {/* Appointment List with Filters */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h4 className="text-lg font-semibold">Appointment Schedule</h4>
                  <div className="flex gap-4">
                      <select 
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                      >
                        <option value="">All Departments</option>
                        {[...new Set(appointments.map(apt => apt.department))].map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <input 
                        type="date" 
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedAppointmentDate}
                        onChange={(e) => setSelectedAppointmentDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {appointmentError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
                      <div className="flex items-center">
                        <FaExclamationCircle className="text-red-500 mr-3" />
                        <span className="text-red-700">{appointmentError}</span>
                      </div>
                    </div>
                  )}

                  {appointmentSuccess && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4">
                      <div className="flex items-center">
                        <FaCheckCircle className="text-green-500 mr-3" />
                        <span className="text-green-700">{appointmentSuccess}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Morning Appointments */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-600 mb-2">Morning (9:00 AM - 12:00 PM)</h5>
                      <div className="space-y-2">
                        {filteredAppointments
                          .filter(apt => {
                            const time = apt.time.split(':')[0];
                            return time >= 9 && time < 12;
                          })
                          .map(apt => (
                          <div key={apt._id} className="bg-blue-50 p-4 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                <div className="flex items-center gap-2">
                                  <FaUserInjured className="text-blue-500" />
                                  <p className="font-medium">{apt.patientName}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <FaUserMd className="text-blue-500" />
                                  <p className="text-sm text-gray-600">Dr. {apt.doctorName} - {apt.department}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <FaClock className="text-blue-500" />
                                  <p className="text-sm text-gray-600">{apt.time}</p>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">Type: {apt.type}</p>
                                  {apt.symptoms && (
                                  <p className="text-sm text-gray-600 mt-1">Symptoms: {apt.symptoms}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {apt.status === 'scheduled' && (
                                    <>
                                      <button 
                                        onClick={() => handleUpdateAppointmentStatus(apt._id, 'completed')}
                                      className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center gap-1"
                                      >
                                      <FaCheckCircle />
                                        Complete
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateAppointmentStatus(apt._id, 'cancelled')}
                                      className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center gap-1"
                                      >
                                      <FaTimesCircle />
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                  {apt.status === 'completed' && (
                                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm flex items-center gap-1">
                                    <FaCheckCircle />
                                      Completed
                                    </span>
                                  )}
                                  {apt.status === 'cancelled' && (
                                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm flex items-center gap-1">
                                    <FaTimesCircle />
                                      Cancelled
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Afternoon Appointments */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-600 mb-2">Afternoon (1:00 PM - 5:00 PM)</h5>
                      <div className="space-y-2">
                        {filteredAppointments
                          .filter(apt => {
                            const time = apt.time.split(':')[0];
                            return time >= 13 && time < 17;
                          })
                          .map(apt => (
                          <div key={apt._id} className="bg-green-50 p-4 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                <div className="flex items-center gap-2">
                                  <FaUserInjured className="text-green-500" />
                                  <p className="font-medium">{apt.patientName}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <FaUserMd className="text-green-500" />
                                  <p className="text-sm text-gray-600">Dr. {apt.doctorName} - {apt.department}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <FaClock className="text-green-500" />
                                  <p className="text-sm text-gray-600">{apt.time}</p>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">Type: {apt.type}</p>
                                  {apt.symptoms && (
                                  <p className="text-sm text-gray-600 mt-1">Symptoms: {apt.symptoms}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {apt.status === 'scheduled' && (
                                    <>
                                      <button 
                                        onClick={() => handleUpdateAppointmentStatus(apt._id, 'completed')}
                                      className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center gap-1"
                                      >
                                      <FaCheckCircle />
                                        Complete
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateAppointmentStatus(apt._id, 'cancelled')}
                                      className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center gap-1"
                                      >
                                      <FaTimesCircle />
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                  {apt.status === 'completed' && (
                                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm flex items-center gap-1">
                                    <FaCheckCircle />
                                      Completed
                                    </span>
                                  )}
                                  {apt.status === 'cancelled' && (
                                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm flex items-center gap-1">
                                    <FaTimesCircle />
                                      Cancelled
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

              {/* Add New Appointment Form */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h4 className="text-lg font-semibold mb-4">Schedule New Appointment</h4>
                  <form onSubmit={handleCreateAppointment} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                        <div className="relative">
                          <input
                            type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Search patient by name..."
                            value={patientSearchTerm}
                            onChange={(e) => setPatientSearchTerm(e.target.value)}
                            onFocus={() => setShowPatientDropdown(true)}
                            required
                          />
                          {showPatientDropdown && filteredPatients.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredPatients.map(patient => (
                                <div
                                  key={patient._id}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handlePatientSelect(patient)}
                                >
                                  <div className="font-medium">{patient.name}</div>
                                  <div className="text-sm text-gray-600">{patient.email}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                        <select 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newAppointment.doctorId}
                          onChange={(e) => setNewAppointment({ ...newAppointment, doctorId: e.target.value })}
                          required
                        >
                          <option value="">Select Doctor</option>
                          {doctors.map(doctor => (
                            <option key={doctor._id} value={doctor._id}>
                              Dr. {doctor.name} - {doctor.department}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input 
                          type="date" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newAppointment.date}
                          onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                        <select 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newAppointment.time}
                          onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                          required
                        >
                          <option value="">Select Time</option>
                          {Array.from({ length: 17 }, (_, i) => i + 9).map(hour => (
                            <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                              {hour.toString().padStart(2, '0')}:00
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newAppointment.type}
                          onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                          required
                        >
                          <option value="consultation">Consultation</option>
                          <option value="follow-up">Follow-up</option>
                          <option value="emergency">Emergency</option>
                          <option value="routine-checkup">Routine Checkup</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newAppointment.department}
                          onChange={(e) => setNewAppointment({ ...newAppointment, department: e.target.value })}
                          required
                        >
                          <option value="">Select Department</option>
                          {[...new Set(doctors.map(d => d.department))].map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                      <textarea 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        value={newAppointment.symptoms}
                        onChange={(e) => setNewAppointment({ ...newAppointment, symptoms: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        value={newAppointment.notes}
                        onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                      />
                    </div>
                    <button 
                      type="submit" 
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Schedule Appointment
                    </button>
                  </form>
              </div>
            </div>
          </Tab.Panel>

          {/* Staff Management Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Staff Directory */}
              <div className="bg-white shadow-lg rounded-xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[var(--accent)]/10 p-2 rounded-lg">
                      <FaUsers className="text-[var(--accent)] text-xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Staff Directory</h3>
                  </div>
                  <button
                    onClick={() => {
                      // Switch to User Management tab and set role filter to staff
                      const userManagementTab = document.querySelector('[data-tab="User Management"]');
                      if (userManagementTab) {
                        userManagementTab.click();
                        setRoleFilter('staff');
                      }
                    }}
                    className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-all duration-200 flex items-center gap-2"
                  >
                    <FaUserPlus className="text-lg" />
                    <span>Add Staff</span>
                  </button>
                </div>

                {/* Search and Sort Controls */}
                <div className="mb-6 space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search staff by name, department, or position..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    />
                    <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                  <div className="flex gap-4">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="department">Sort by Department</option>
                      <option value="shift">Sort by Shift</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </button>
                  </div>
                </div>

                {scheduleError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm mb-4">
                    <div className="flex items-center">
                      <FaExclamationCircle className="text-red-500 mr-3" />
                      <span className="text-red-700">{scheduleError}</span>
                    </div>
                  </div>
                )}

                {scheduleSuccess && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm mb-4">
                    <div className="flex items-center">
                      <FaCheckCircle className="text-green-500 mr-3" />
                      <span className="text-green-700">{scheduleSuccess}</span>
                    </div>
                  </div>
                )}

                {/* Staff List with Scroll */}
                <div className="h-[1200px] overflow-y-auto pr-2">
                <div className="space-y-4">
                    {filterStaffMembers(sortStaffMembers(staffMembers)).map(member => (
                      <div key={member._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-800">{member.name}</h4>
                            <p className="text-sm text-gray-600">{member.position}</p>
                            <p className="text-sm text-gray-600">{member.department}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={member.shift || ''}
                              onChange={(e) => handleUpdateSchedule(member._id, e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                            >
                              <option value="">Select Shift</option>
                              <option value="morning">Morning (8 AM - 4 PM)</option>
                              <option value="afternoon">Afternoon (4 PM - 12 AM)</option>
                              <option value="night">Night (12 AM - 8 AM)</option>
                              <option value="flexible">Flexible</option>
                            </select>
                          </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>

              {/* Staff Schedule */}
              <div className="bg-white shadow-lg rounded-xl p-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="bg-[var(--accent)]/10 p-2 rounded-lg">
                    <FaCalendar className="text-[var(--accent)] text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Staff Schedule</h3>
                </div>

                <div className="space-y-6">
                  {/* Department Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    >
                      <option value="">All Departments</option>
                      {[...new Set(staffMembers.map(s => s.department))].map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    />
                  </div>

                  {/* Schedule View */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Schedule for {selectedDate}</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-2">Morning Shift</h5>
                        <ul className="space-y-2">
                          {staffMembers
                            .filter(member => member.shift === 'morning' && 
                              (!selectedDepartment || member.department === selectedDepartment))
                            .map(member => (
                              <li key={member._id} className="text-sm text-blue-700">
                                {member.name} - {member.department}
                              </li>
                            ))}
                        </ul>
                </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-2">Afternoon Shift</h5>
                        <ul className="space-y-2">
                          {staffMembers
                            .filter(member => member.shift === 'afternoon' && 
                              (!selectedDepartment || member.department === selectedDepartment))
                            .map(member => (
                              <li key={member._id} className="text-sm text-green-700">
                                {member.name} - {member.department}
                              </li>
                            ))}
                        </ul>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-medium text-purple-800 mb-2">Night Shift</h5>
                        <ul className="space-y-2">
                          {staffMembers
                            .filter(member => member.shift === 'night' && 
                              (!selectedDepartment || member.department === selectedDepartment))
                            .map(member => (
                              <li key={member._id} className="text-sm text-purple-700">
                                {member.name} - {member.department}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Department Statistics */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-4">Department Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...new Set(staffMembers.map(s => s.department))].map(dept => {
                        const deptStaff = staffMembers.filter(s => s.department === dept);
                        const shifts = {
                          morning: deptStaff.filter(s => s.shift === 'morning').length,
                          afternoon: deptStaff.filter(s => s.shift === 'afternoon').length,
                          night: deptStaff.filter(s => s.shift === 'night').length,
                          flexible: deptStaff.filter(s => s.shift === 'flexible').length
                        };
                        const minStaff = dept === 'security' ? 4 : 3;
                        const isWellStaffed = deptStaff.length >= minStaff;

                        return (
                          <div key={dept} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-800 text-lg">{dept}</h5>
                              <span className="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                                {deptStaff.length} Staff
                              </span>
                            </div>
                            
                            {/* Shift Distribution */}
                            <div className="space-y-2 mb-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Morning Shift</span>
                                <span className="font-medium">{shifts.morning}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Afternoon Shift</span>
                                <span className="font-medium">{shifts.afternoon}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Night Shift</span>
                                <span className="font-medium">{shifts.night}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Flexible</span>
                                <span className="font-medium">{shifts.flexible}</span>
                              </div>
                            </div>

                            {/* Department Status */}
                            <div className="border-t pt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Department Status</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  isWellStaffed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {isWellStaffed ? 'Well Staffed' : 'Understaffed'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Overall Statistics */}
                  <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                    <h5 className="font-medium text-gray-800 mb-3">Overall Statistics</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {staffMembers.length}
                        </div>
                        <div className="text-sm text-gray-600">Total Staff</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {staffMembers.filter(s => s.shift === 'morning').length}
                        </div>
                        <div className="text-sm text-gray-600">Morning Shift</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {staffMembers.filter(s => s.shift === 'afternoon').length}
                        </div>
                        <div className="text-sm text-gray-600">Afternoon Shift</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {staffMembers.filter(s => s.shift === 'night').length}
                        </div>
                        <div className="text-sm text-gray-600">Night Shift</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Billing Panel */}
          <Tab.Panel>
            <div className="space-y-6">
              {/* Billing Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Total Revenue</h3>
                    <FaFileInvoiceDollar className="text-blue-500 text-2xl" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">₹{billingSummary.total}</p>
                  </div>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Paid</h3>
                    <FaCheckCircle className="text-green-500 text-2xl" />
                </div>
                  <p className="text-2xl font-bold text-green-600">₹{billingSummary.paid}</p>
              </div>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Pending</h3>
                    <FaClock className="text-yellow-500 text-2xl" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">₹{billingSummary.pending}</p>
                  </div>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Cancelled</h3>
                    <FaTimesCircle className="text-red-500 text-2xl" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">₹{billingSummary.cancelled}</p>
              </div>
            </div>

              {/* Billing Section */}
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Billing Management</h2>
                    <p className="text-gray-600">Manage patient bills and transactions</p>
                      </div>
                  <button
                    onClick={() => setShowBillingForm(!showBillingForm)}
                    className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-md"
                  >
                    {showBillingForm ? 'Cancel' : '+ Create New Bill'}
                  </button>
              </div>

                {/* Recent Transactions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {bills.slice(0, 6).map(bill => (
                    <div 
                      key={bill._id} 
                      className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedInvoice(bill);
                        setShowInvoiceModal(true);
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                  <div>
                          <h4 className="text-lg font-semibold text-gray-800">Invoice #{bill._id.slice(-4)}</h4>
                          <p className="text-sm text-gray-600 mt-1">{bill.patient?.name}</p>
                  </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                          bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                  </div>
                  </div>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-xl font-bold text-blue-600">₹{bill.amount}</p>
                        <p className="text-sm text-gray-600">{new Date(bill.createdAt).toLocaleDateString()}</p>
                  </div>
                      {bill.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateBillStatus(bill._id, 'paid');
                            }}
                            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Mark as Paid
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateBillStatus(bill._id, 'cancelled');
                            }}
                            className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Cancel
                          </button>
              </div>
                      )}
                      {bill.status === 'paid' && (
                        <div className="text-sm text-gray-600">
                          Paid on: {new Date(bill.paymentDate).toLocaleDateString()}
            </div>
                      )}
                  </div>
                  ))}
                  </div>

                {/* Invoice Details Modal */}
                {showInvoiceModal && selectedInvoice && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Invoice Details</h3>
                          <p className="text-gray-600">Invoice #{selectedInvoice._id?.slice(-4) || 'N/A'}</p>
                  </div>
                        <button
                          onClick={() => setShowInvoiceModal(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FaTimes size={24} />
                        </button>
              </div>

                      {/* Patient Information */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <h4 className="font-semibold text-gray-800 mb-2">Patient Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                  <div>
                            <p className="text-sm text-gray-600">Name</p>
                            <p className="font-medium">{selectedInvoice.patient?.name || 'N/A'}</p>
                  </div>
                  <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{selectedInvoice.patient?.email || 'N/A'}</p>
                    </div>
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium">{selectedInvoice.patient?.phone || 'N/A'}</p>
                  </div>
                  <div>
                            <p className="text-sm text-gray-600">Appointment Date</p>
                            <p className="font-medium">
                              {selectedInvoice.appointment?.date ? 
                                new Date(selectedInvoice.appointment.date).toLocaleDateString() : 
                                'N/A'}
                            </p>
                  </div>
              </div>
            </div>

                      {/* Bill Items */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 mb-4">Bill Items</h4>
                        <div className="space-y-3">
                          {selectedInvoice.items?.map((item, index) => {
                            const serviceIcon = predefinedCharges.find(charge => charge.name === item.name)?.icon;
                            const Icon = serviceIcon || FaFileInvoiceDollar;
                            return (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="text-blue-500">
                                    <Icon size={20} />
                  </div>
                  <div>
                                    <p className="font-medium text-gray-800">{item.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">Quantity: {item.quantity || 0}</p>
                  </div>
                    </div>
                                <div className="text-right">
                                  <p className="font-medium text-gray-800">₹{(item.price || 0) * (item.quantity || 0)}</p>
                                  <p className="text-sm text-gray-600">₹{item.price || 0} per unit</p>
                  </div>
              </div>
                            );
                          })}
                          {selectedInvoice.notes && (
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium text-gray-800">Additional Fees</p>
                              <p className="font-medium text-gray-800">
                                ₹{parseInt(selectedInvoice.notes.split(':')[1]) || 0}
                              </p>
                  </div>
                          )}
                  </div>
                  </div>

                      {/* Payment Information */}
                      <div className="bg-blue-50 rounded-xl p-6 mb-6">
                        <h4 className="font-semibold text-gray-800 mb-4">Payment Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <p className="text-xl font-bold text-blue-600">₹{selectedInvoice.amount || 0}</p>
                </div>
                          <div>
                            <p className="text-sm text-gray-600">Payment Method</p>
                            <p className="font-medium capitalize">{selectedInvoice.paymentMethod || 'N/A'}</p>
              </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <p className={`font-medium ${
                              selectedInvoice.status === 'paid' ? 'text-green-600' :
                              selectedInvoice.status === 'pending' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {(selectedInvoice.status || 'N/A').charAt(0).toUpperCase() + (selectedInvoice.status || '').slice(1)}
                            </p>
            </div>
          <div>
                            <p className="text-sm text-gray-600">Date</p>
                            <p className="font-medium">
                              {selectedInvoice.createdAt ? 
                                new Date(selectedInvoice.createdAt).toLocaleDateString() : 
                                'N/A'}
                            </p>
          </div>
                          {selectedInvoice.paymentDate && (
                <div>
                              <p className="text-sm text-gray-600">Payment Date</p>
                              <p className="font-medium">
                                {new Date(selectedInvoice.paymentDate).toLocaleDateString()}
                              </p>
                </div>
                          )}
                </div>
              </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => setShowInvoiceModal(false)}
                          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Close
                        </button>
                        {selectedInvoice.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                handleUpdateBillStatus(selectedInvoice._id, 'paid');
                                setShowInvoiceModal(false);
                              }}
                              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                              Mark as Paid
                            </button>
                            <button
                              onClick={() => {
                                handleUpdateBillStatus(selectedInvoice._id, 'cancelled');
                                setShowInvoiceModal(false);
                              }}
                              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
              </div>
            </div>
        </div>
                )}

        {/* Create Bill Form */}
        {showBillingForm && (
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Create New Bill</h3>
            
            {/* Patient and Appointment Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>{patient.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Appointment</label>
                <select
                  value={selectedAppointment}
                  onChange={(e) => setSelectedAppointment(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an appointment</option>
                  {appointments
                    .filter(apt => apt.patient._id === selectedPatient)
                    .map(apt => (
                      <option key={apt._id} value={apt._id}>
                        {new Date(apt.date).toLocaleDateString()} - {apt.time}
                      </option>
                    ))}
              </select>
              </div>
            </div>

            {/* Predefined Charges */}
            <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Add Services</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {predefinedCharges.map((item, index) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={index}
                              onClick={() => handleAddPredefinedItem(item)}
                              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left flex items-center space-x-3"
                            >
                              <Icon className="text-blue-500 text-xl" />
                              <div>
                                <p className="font-medium text-gray-800">{item.name}</p>
                                <p className="text-sm text-gray-600">₹{item.price}</p>
                  </div>
                            </button>
                          );
                        })}
              </div>
            </div>

            {/* Selected Items */}
            {billingItems.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Selected Services</h4>
                <div className="space-y-3">
                  {billingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center">
                        <div className="mr-4">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-600">₹{item.price} per unit</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white rounded-lg border">
                          <button
                            onClick={() => handleUpdateItemQuantity(index, item.quantity - 1)}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value))}
                            className="w-16 p-1 text-center border-x"
                          />
                          <button
                            onClick={() => handleUpdateItemQuantity(index, item.quantity + 1)}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Fees and Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Fees</label>
                <input
                  type="number"
                  value={additionalFees}
                  onChange={(e) => setAdditionalFees(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter additional fees"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
            </div>

                    {/* Payment Status and Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                        <select
                          value={paymentStatus}
                          onChange={(e) => {
                            setPaymentStatus(e.target.value);
                            if (e.target.value === 'paid') {
                              setPaymentDate(new Date().toISOString().split('T')[0]);
                            }
                          }}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      {paymentStatus === 'paid' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                          <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Bill Summary with Icons */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Bill Summary</h4>
                      <div className="space-y-4">
                        {billingItems.map((item, index) => {
                          const serviceIcon = predefinedCharges.find(charge => charge.name === item.name)?.icon;
                          const Icon = serviceIcon || FaFileInvoiceDollar;
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="text-blue-500">
                                  <Icon size={20} />
                  </div>
                                <div>
                                  <p className="font-medium text-gray-800">{item.name}</p>
                                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-800">₹{item.price * item.quantity}</p>
                                <p className="text-sm text-gray-600">₹{item.price} per unit</p>
                              </div>
                            </div>
                          );
                        })}
                {additionalFees > 0 && (
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="text-blue-500">
                                <FaPlus size={20} />
                              </div>
                              <p className="font-medium text-gray-800">Additional Fees</p>
                            </div>
                            <p className="font-medium text-gray-800">₹{additionalFees}</p>
                  </div>
                )}
                        <div className="border-t pt-4 mt-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <div className="text-blue-500">
                                <FaFileInvoiceDollar size={24} />
                  </div>
                              <p className="text-lg font-bold text-blue-800">Total Amount</p>
                </div>
                            <p className="text-lg font-bold text-blue-800">
                              ₹{billingItems.reduce((total, item) => total + (item.quantity * item.price), 0) + additionalFees}
                            </p>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Payment Method: {paymentMethod}</p>
                            <p>Status: {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}</p>
                            {paymentStatus === 'paid' && <p>Payment Date: {paymentDate}</p>}
                          </div>
                        </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCreateBill}
              disabled={!selectedPatient || !selectedAppointment || billingItems.length === 0}
              className="w-full bg-blue-500 text-white py-4 rounded-xl hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg shadow-md"
            >
              Generate Bill
            </button>
          </div>
        )}
      </div>
            </div>
          </Tab.Panel>

          {/* Inventory Panel */}
          <Tab.Panel>
            <div className="space-y-6">
              {/* Inventory Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Total Items</h3>
                    <FaBox className="text-blue-500 text-2xl" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{inventoryStats?.totalItems || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Low Stock</h3>
                    <FaExclamationTriangle className="text-yellow-500 text-2xl" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{inventoryStats?.lowStockItems || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Out of Stock</h3>
                    <FaTimesCircle className="text-red-500 text-2xl" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{inventoryStats?.outOfStockItems || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Total Value</h3>
                    <FaBoxes className="text-green-500 text-2xl" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{inventoryStats?.byStatus?.reduce((total, status) => total + status.totalValue, 0) || 0}
                  </p>
                </div>
              </div>

              {/* Inventory Management Section */}
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Inventory Management</h2>
                    <p className="text-gray-600">Manage hospital supplies and equipment</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowInventoryForm(!showInventoryForm);
                      if (!showInventoryForm) {
                        setEditingItem(null);
                        setNewItem({
                          name: '',
                          category: 'Medical Supplies',
                          description: '',
                          quantity: 0,
                          unit: 'pieces',
                          price: 0,
                          reorderLevel: 0,
                          supplier: {
                            name: '',
                            contact: '',
                            email: ''
                          },
                          location: '',
                          expiryDate: '',
                          notes: ''
                        });
                      }
                    }}
                    className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-md"
                  >
                    {showInventoryForm ? 'Cancel' : '+ Add New Item'}
                  </button>
                </div>

                {/* Add/Edit Item Form */}
                {showInventoryForm && (
                  <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">
                      {editingItem ? 'Edit Item' : 'Add New Item'}
                    </h3>
                    <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                          <input
                            type="text"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                          <select
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="Medical Supplies">Medical Supplies</option>
                            <option value="Medications">Medications</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Consumables">Consumables</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                          <input
                            type="number"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                          <select
                            value={newItem.unit}
                            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="pieces">Pieces</option>
                            <option value="boxes">Boxes</option>
                            <option value="bottles">Bottles</option>
                            <option value="vials">Vials</option>
                            <option value="packs">Packs</option>
                            <option value="units">Units</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                          <input
                            type="number"
                            value={newItem.price}
                            onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level</label>
                          <input
                            type="number"
                            value={newItem.reorderLevel}
                            onChange={(e) => setNewItem({ ...newItem, reorderLevel: parseInt(e.target.value) })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                          <input
                            type="text"
                            value={newItem.location}
                            onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                          <input
                            type="date"
                            value={newItem.expiryDate}
                            onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={newItem.description}
                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="3"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Information</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            placeholder="Supplier Name"
                            value={newItem.supplier.name}
                            onChange={(e) => setNewItem({
                              ...newItem,
                              supplier: { ...newItem.supplier, name: e.target.value }
                            })}
                            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Contact Number"
                            value={newItem.supplier.contact}
                            onChange={(e) => setNewItem({
                              ...newItem,
                              supplier: { ...newItem.supplier, contact: e.target.value }
                            })}
                            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={newItem.supplier.email}
                            onChange={(e) => setNewItem({
                              ...newItem,
                              supplier: { ...newItem.supplier, email: e.target.value }
                            })}
                            className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                          value={newItem.notes}
                          onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="2"
                        />
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => setShowInventoryForm(false)}
                          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          {editingItem ? 'Update Item' : 'Add Item'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Inventory List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inventory.map(item => (
                    <div key={item._id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.category}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                          item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} {item.unit}
                        </p>
                        <p className="text-sm text-gray-600">
                          Price: ₹{item.price} per {item.unit}
                        </p>
                        <p className="text-sm text-gray-600">
                          Location: {item.location}
                        </p>
                        {item.expiryDate && (
                          <p className="text-sm text-gray-600">
                            Expiry: {new Date(item.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FaEdit size={20} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash size={20} />
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateStock(item._id, 1, 'add')}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleUpdateStock(item._id, 1, 'remove')}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            -1
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Dispatch Section */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Dispatch Management</h3>
                    <p className="text-gray-600">Track and manage inventory dispatches</p>
                  </div>
                  <button
                    onClick={() => setShowDispatchForm(!showDispatchForm)}
                    className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-md"
                  >
                    {showDispatchForm ? 'Cancel' : '+ New Dispatch'}
                  </button>
                </div>

                {/* Dispatch Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Total Dispatches</h3>
                      <FaBox className="text-blue-500 text-2xl" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{dispatchStats?.totalDispatches || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Pending</h3>
                      <FaClock className="text-yellow-500 text-2xl" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{dispatchStats?.pendingDispatches || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Approved</h3>
                      <FaCheck className="text-green-500 text-2xl" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{dispatchStats?.approvedDispatches || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Completed</h3>
                      <FaCheckCircle className="text-purple-500 text-2xl" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{dispatchStats?.completedDispatches || 0}</p>
                  </div>
                </div>

                {/* Dispatch Form */}
                {showDispatchForm && (
                  <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">New Dispatch Request</h3>
                    <form onSubmit={handleCreateDispatch} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                          <select
                            value={newDispatch.item}
                            onChange={(e) => setNewDispatch({ ...newDispatch, item: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select an item</option>
                            {inventory.map(item => (
                              <option key={item._id} value={item._id}>
                                {item.name} ({item.quantity} {item.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                          <input
                            type="number"
                            value={newDispatch.quantity}
                            onChange={(e) => setNewDispatch({ ...newDispatch, quantity: parseInt(e.target.value) })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                          <select
                            value={newDispatch.department}
                            onChange={(e) => setNewDispatch({ ...newDispatch, department: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="Emergency">Emergency</option>
                            <option value="OPD">OPD</option>
                            <option value="Ward">Ward</option>
                            <option value="Operation Theater">Operation Theater</option>
                            <option value="Laboratory">Laboratory</option>
                            <option value="Pharmacy">Pharmacy</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Issued To</label>
                          <input
                            type="text"
                            value={newDispatch.issuedTo}
                            onChange={(e) => setNewDispatch({ ...newDispatch, issuedTo: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                          <input
                            type="text"
                            value={newDispatch.purpose}
                            onChange={(e) => setNewDispatch({ ...newDispatch, purpose: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                          <textarea
                            value={newDispatch.notes}
                            onChange={(e) => setNewDispatch({ ...newDispatch, notes: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => setShowDispatchForm(false)}
                          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Create Dispatch
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Dispatch List */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued To</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dispatches.map(dispatch => (
                          <tr key={dispatch._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{dispatch.item.name}</div>
                              <div className="text-sm text-gray-500">{dispatch.item.category}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{dispatch.quantity} {dispatch.item.unit}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{dispatch.department}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{dispatch.issuedTo}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                dispatch.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                dispatch.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                dispatch.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {dispatch.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {dispatch.status === 'Pending' && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleUpdateDispatchStatus(dispatch._id, 'Approved')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateDispatchStatus(dispatch._id, 'Rejected')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {dispatch.status === 'Approved' && (
                                <button
                                  onClick={() => handleUpdateDispatchStatus(dispatch._id, 'Completed')}
                                  className="text-purple-600 hover:text-purple-900"
                                >
                                  Complete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Reports Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Generate Reports</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-[var(--accent)] rounded-lg cursor-pointer">
                    <p className="font-semibold">Patient Statistics</p>
                    <p className="text-sm">View patient admission and discharge trends</p>
                  </div>
                  <div className="p-4 bg-[var(--accent)] rounded-lg cursor-pointer">
                    <p className="font-semibold">Financial Reports</p>
                    <p className="text-sm">Revenue and expense analysis</p>
                  </div>
                  <div className="p-4 bg-[var(--accent)] rounded-lg cursor-pointer">
                    <p className="font-semibold">Inventory Reports</p>
                    <p className="text-sm">Stock levels and usage patterns</p>
                  </div>
                  <div className="p-4 bg-[var(--accent)] rounded-lg cursor-pointer">
                    <p className="font-semibold">Staff Performance</p>
                    <p className="text-sm">Attendance and productivity metrics</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Custom Report</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block mb-2">Report Type</label>
                    <select className="input w-full">
                      <option>Patient Statistics</option>
                      <option>Financial Summary</option>
                      <option>Inventory Status</option>
                      <option>Staff Performance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2">Date Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" className="input" placeholder="Start Date" />
                      <input type="date" className="input" placeholder="End Date" />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2">Format</label>
                    <select className="input w-full">
                      <option>PDF</option>
                      <option>Excel</option>
                      <option>CSV</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary w-full">Generate Report</button>
                </form>
              </div>
            </div>
          </Tab.Panel>

          {/* Settings Panel */}
          <Tab.Panel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">System Settings</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block mb-2">Hospital Name</label>
                    <input type="text" className="input w-full" value="City General Hospital" />
                  </div>
                  <div>
                    <label className="block mb-2">Contact Email</label>
                    <input type="email" className="input w-full" value="contact@hospital.com" />
                  </div>
                  <div>
                    <label className="block mb-2">Working Hours</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="time" className="input" />
                      <input type="time" className="input" />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary w-full">Save Settings</button>
                </form>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[var(--accent)] rounded-lg">
                    <span>Email Notifications</span>
                    <input type="checkbox" checked className="form-checkbox" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[var(--accent)] rounded-lg">
                    <span>SMS Alerts</span>
                    <input type="checkbox" checked className="form-checkbox" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[var(--accent)] rounded-lg">
                    <span>System Updates</span>
                    <input type="checkbox" checked className="form-checkbox" />
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;