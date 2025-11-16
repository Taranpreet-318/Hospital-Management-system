// In-memory data storage (replaces localStorage due to sandbox restrictions)
let appData = {
  users: [],
  currentUser: null,
  appointments: []
};

// Utility Functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');

  toast.textContent = message;
  
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function switchView(viewId) {
  const views = ['loginView', 'registerView', 'dashboardView', 'bookAppointmentView', 'myAppointmentsView'];
  
  views.forEach(view => {
    document.getElementById(view).style.display = 'none';
  });
  
  document.getElementById(viewId).style.display = 'block';
  
  // Update user name displays when switching to authenticated views
  if (appData.currentUser && ['dashboardView', 'bookAppointmentView', 'myAppointmentsView'].includes(viewId)) {
    updateUserDisplays();
  }
}

function updateUserDisplays() {
  
  if (appData.currentUser) {
    
    const firstName = appData.currentUser.fullName.split(' ')[0];
  
    document.getElementById('userNameDisplay').textContent = firstName;
  
    document.getElementById('userNameDisplay2').textContent = firstName;
  
    document.getElementById('userNameDisplay3').textContent = firstName;
  
    document.getElementById('welcomeUserName').textContent = firstName;
  }
}

function isAuthenticated() {
  return appData.currentUser !== null;
}

function logout() {
  
  appData.currentUser = null;
 
  switchView('loginView');
 
  showToast('Logged out successfully', 'success');
}

// Authentication Functions
function handleLogin(e) {
 
  e.preventDefault();
 
  const email = document.getElementById('loginEmail').value.trim();
 
  const password = document.getElementById('loginPassword').value;

  const user = appData.users.find(u => u.email === email && u.password === btoa(password));
  
  if (user) {
    appData.currentUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone
    };
   
    showToast(`Welcome back, ${user.fullName.split(' ')[0]}!`, 'success');
   
    switchView('dashboardView');
   
    updateDashboardStats();
  } else {
    showToast('Invalid email or password', 'error');
  }
}

function handleRegister(e) {
 
  e.preventDefault();
 
  const fullName = document.getElementById('registerName').value.trim();
 
  const email = document.getElementById('registerEmail').value.trim();
 
  const phone = document.getElementById('registerPhone').value.trim();
 
  const password = document.getElementById('registerPassword').value;
 
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

  // Validation
  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }

  // Check if email already exists
  if (appData.users.find(u => u.email === email)) {
    showToast('Email already registered', 'error');
    return;
  }

  // Create new user
  const newUser = {
    id: generateId(),
    fullName,
    email,
    phone,
    password: btoa(password), // Basic encoding
    createdAt: new Date().toISOString()
  };

  appData.users.push(newUser);
  
  // Auto-login
  appData.currentUser = {
    id: newUser.id,
    fullName: newUser.fullName,
    email: newUser.email,
    phone: newUser.phone
  };

  showToast('Account created successfully!', 'success');
  
  document.getElementById('registerForm').reset();
  
  switchView('dashboardView');
  
  updateDashboardStats();
}

// Dashboard Functions
function updateDashboardStats() {
  if (!appData.currentUser) return;

  const userAppointments = appData.appointments.filter(apt => apt.userId === appData.currentUser.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = userAppointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return apt.status === 'Scheduled' && aptDate >= today;
  }).length;

  const completed = userAppointments.filter(apt => apt.status === 'Completed').length;

  document.getElementById('totalAppointments').textContent = userAppointments.length;
  document.getElementById('upcomingAppointments').textContent = upcoming;
  document.getElementById('completedAppointments').textContent = completed;
}

// Appointment Booking
function initializeBookingForm() {
  if (!appData.currentUser) return;

  document.getElementById('patientName').value = appData.currentUser.fullName;
  document.getElementById('patientEmail').value = appData.currentUser.email;
  document.getElementById('patientPhone').value = appData.currentUser.phone;

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appointmentDate').setAttribute('min', today);
}

function handleBookAppointment(e) {
  e.preventDefault();
  
  if (!appData.currentUser) {
    showToast('Please login first', 'error');
    return;
  }

  const department = document.getElementById('department').value;
  const date = document.getElementById('appointmentDate').value;
  const time = document.getElementById('appointmentTime').value;
  const reason = document.getElementById('reason').value.trim();

  // Create appointment
  const appointment = {
    id: generateId(),
    userId: appData.currentUser.id,
    patientName: appData.currentUser.fullName,
    email: appData.currentUser.email,
    phone: appData.currentUser.phone,
    department,
    date,
    time,
    reason,
    status: 'Scheduled',
    bookedAt: new Date().toISOString()
  };

  appData.appointments.push(appointment);
  
  showToast('Appointment booked successfully!', 'success');
  document.getElementById('bookAppointmentForm').reset();
  
  // Redirect to My Appointments
  setTimeout(() => {
    switchView('myAppointmentsView');
    loadAppointments('all');
  }, 1000);
}

// My Appointments
let currentFilter = 'all';

function loadAppointments(filter = 'all') {
  currentFilter = filter;
  
  if (!appData.currentUser) return;

  const appointmentsList = document.getElementById('appointmentsList');
  const emptyState = document.getElementById('emptyState');
  
  let userAppointments = appData.appointments.filter(apt => apt.userId === appData.currentUser.id);
  
  // Apply filter
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (filter === 'upcoming') {
    userAppointments = userAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return apt.status === 'Scheduled' && aptDate >= today;
    });
  } else if (filter === 'past') {
    userAppointments = userAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return apt.status !== 'Scheduled' || aptDate < today;
    });
  }

  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    }
  });

  if (userAppointments.length === 0) {
    appointmentsList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  
  // Sort by date (newest first)
  userAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  appointmentsList.innerHTML = userAppointments.map(apt => {
    const aptDate = new Date(apt.date);
    const isPast = aptDate < today || apt.status !== 'Scheduled';
    const formattedDate = aptDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    return `
      <div class="appointment-card ${isPast ? 'past' : ''}">
        <div class="appointment-header">
          <div class="appointment-department">
            <div class="department-icon">
              ${getDepartmentIcon(apt.department)}
            </div>
            <h3>${apt.department}</h3>
          </div>
          <span class="status-badge ${apt.status.toLowerCase()}">${apt.status}</span>
        </div>
        
        <div class="appointment-details">
          <div class="detail-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${formattedDate}</span>
          </div>
          <div class="detail-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${apt.time}</span>
          </div>
        </div>
        
        <div class="appointment-reason">
          <h4>Reason for Visit</h4>
          <p>${apt.reason}</p>
        </div>
        
        ${apt.status === 'Scheduled' && !isPast ? `
          <div class="appointment-actions">
            <button class="btn-cancel" onclick="cancelAppointment('${apt.id}')">Cancel Appointment</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function getDepartmentIcon(department) {
  const icons = {
    'General Medicine': '🏥',
    'Cardiology': '❤️',
    'Dermatology': '🧴',
    'Orthopedics': '🦴',
    'Pediatrics': '👶',
    'Neurology': '🧠',
    'ENT (Ear, Nose, Throat)': '👂',
    'Gynecology': '👩',
    'Ophthalmology': '👁️',
    'Dental': '🦷'
  };
  return icons[department] || '🏥';
}

function cancelAppointment(appointmentId) {
  const appointment = appData.appointments.find(apt => apt.id === appointmentId);
  if (appointment) {
    appointment.status = 'Cancelled';
    showToast('Appointment cancelled', 'success');
    loadAppointments(currentFilter);
    updateDashboardStats();
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Auth form handlers
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  
  // View switching
  document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('registerView');
  });
  
  document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('loginView');
  });

  // Navbar navigation
  document.getElementById('navBookAppointment').addEventListener('click', () => {
    initializeBookingForm();
    switchView('bookAppointmentView');
  });
  
  document.getElementById('navMyAppointments').addEventListener('click', () => {
    switchView('myAppointmentsView');
    loadAppointments('all');
  });

  document.getElementById('navDashboard').addEventListener('click', () => {
    switchView('dashboardView');
    updateDashboardStats();
  });

  document.getElementById('navMyAppointments2').addEventListener('click', () => {
    switchView('myAppointmentsView');
    loadAppointments('all');
  });

  document.getElementById('navDashboard2').addEventListener('click', () => {
    switchView('dashboardView');
    updateDashboardStats();
  });

  document.getElementById('navBookAppointment2').addEventListener('click', () => {
    initializeBookingForm();
    switchView('bookAppointmentView');
  });

  // CTA buttons
  document.getElementById('bookAppointmentCTA').addEventListener('click', () => {
    initializeBookingForm();
    switchView('bookAppointmentView');
  });

  document.getElementById('bookFirstAppointment').addEventListener('click', () => {
    initializeBookingForm();
    switchView('bookAppointmentView');
  });

  // User menu dropdowns
  const userMenuButtons = ['userMenuButton', 'userMenuButton2', 'userMenuButton3'];
  const userMenuDropdowns = ['userMenuDropdown', 'userMenuDropdown2', 'userMenuDropdown3'];
  
  userMenuButtons.forEach((buttonId, index) => {
    const button = document.getElementById(buttonId);
    const dropdown = document.getElementById(userMenuDropdowns[index]);
    
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    userMenuDropdowns.forEach(dropdownId => {
      document.getElementById(dropdownId).classList.remove('show');
    });
  });

  // Logout buttons
  document.getElementById('logoutButton').addEventListener('click', logout);
  document.getElementById('logoutButton2').addEventListener('click', logout);
  document.getElementById('logoutButton3').addEventListener('click', logout);

  // Appointment form
  document.getElementById('bookAppointmentForm').addEventListener('submit', handleBookAppointment);
  
  document.getElementById('cancelBooking').addEventListener('click', () => {
    switchView('dashboardView');
    updateDashboardStats();
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      loadAppointments(btn.dataset.filter);
    });
  });

  // Initialize with login view
  switchView('loginView');
  
  // Add demo user for testing
  appData.users.push({
    id: 'demo-user',
    fullName: 'John Doe',
    email: 'demo@medicare.com',
    phone: '+1234567890',
    password: btoa('demo123'),
    createdAt: new Date().toISOString()
  });
});

// Make cancelAppointment available globally
window.cancelAppointment