# Hospital Management System

A comprehensive web-based Hospital Management System built with React.js frontend and Node.js/Express backend. This system provides complete management solutions for hospitals including patient management, appointment scheduling, billing, inventory management, and more.

## 🏥 Features

### Patient Management
- Patient registration and profile management
- Medical history tracking
- Lab test reports management
- Prescription management
- Bill generation and tracking

### Doctor Management
- Doctor profile management
- Appointment scheduling
- Prescription creation
- Patient consultation tracking
- Schedule management

### Admin Features
- User management (Doctors, Counselors, Patients, Staff)
- System-wide reporting
- Billing oversight
- Inventory management
- Staff scheduling

### Counselor Features
- Patient counseling management
- Appointment scheduling
- Report generation

### Additional Features
- Authentication and authorization
- File upload for reports and documents
- PDF generation for reports and bills
- Real-time dashboard with charts
- Responsive design with Tailwind CSS

## 🛠️ Technology Stack

### Frontend
- **React.js** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Chart.js** - Data visualization
- **React Icons** - Icon library
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token for authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload middleware
- **PDFKit** - PDF generation
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
hospital-management-system/
├── backend/                 # Backend server
│   ├── config/             # Database configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Authentication middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── scripts/            # Utility scripts
│   ├── uploads/            # File uploads
│   └── utils/              # Helper utilities
├── project/                # Frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context
│   │   ├── utils/          # Utility functions
│   │   └── assets/         # Static assets
│   └── public/             # Public assets
└── README.md
```

## 🚀 Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Environment Variables
Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The backend server will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the project directory:
```bash
cd project
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend application will start on `http://localhost:5173`

## 📊 Database Models

### User Model
- Supports multiple roles: admin, doctor, counselor, patient, staff
- Role-based field validation
- Secure password hashing

### Appointment Model
- Patient-doctor appointment scheduling
- Status tracking (pending, confirmed, completed, cancelled)
- Date and time management

### Billing Model
- Invoice generation and management
- Payment tracking
- Multiple payment methods support

### Inventory Model
- Medical supplies and equipment tracking
- Stock level monitoring
- Supplier management

### Lab Test Model
- Test ordering and result management
- Report file uploads
- Test status tracking

## 🔐 Authentication & Authorization

The system implements JWT-based authentication with role-based access control:

- **Admin**: Full system access
- **Doctor**: Patient management, appointments, prescriptions
- **Counselor**: Patient counseling, limited reporting
- **Patient**: Personal profile, appointments, test results
- **Staff**: Department-specific access

## 📱 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Billing
- `GET /api/billing` - Get bills
- `POST /api/billing` - Create bill
- `PUT /api/billing/:id` - Update bill

### Inventory
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Add inventory item
- `PUT /api/inventory/:id` - Update inventory item

## 🎨 UI Components

### Dashboards
- **AdminDashboard**: System overview, user management
- **DoctorDashboard**: Appointments, patient management
- **PatientDashboard**: Personal health information
- **CounselorDashboard**: Counseling management

### Forms
- **Login**: Authentication form
- **PrescriptionForm**: Prescription creation
- **AppointmentForm**: Appointment scheduling

## 📄 Scripts

The backend includes several utility scripts:

- `createAdmin.js` - Create admin user
- `createDoctors.js` - Create sample doctors
- `checkUsers.js` - Verify user data
- `testCounselorRoutes.js` - Test counselor endpoints

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd project
npm run dev
```

### Build for Production
```bash
# Frontend
cd project
npm run build

# Backend
cd backend
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🔄 Version History

- **v1.0.0** - Initial release with core features
  - User authentication and authorization
  - Patient and doctor management
  - Appointment scheduling
  - Basic billing system
  - Inventory management
  - Lab test management

## 🎯 Future Enhancements

- [ ] Mobile application
- [ ] Telemedicine integration
- [ ] Advanced reporting and analytics
- [ ] Integration with external lab systems
- [ ] Automated appointment reminders
- [ ] Multi-language support
- [ ] Payment gateway integration
- [ ] Real-time notifications
