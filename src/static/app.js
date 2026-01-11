document.addEventListener("DOMContentLoaded", () => {
  // Configuration constants
  const MODAL_AUTO_CLOSE_DELAY = 2500; // Time in ms to auto-close modal after successful registration
  const MESSAGE_AUTO_HIDE_DELAY = 5000; // Time in ms to auto-hide success/error messages

  const activitiesList = document.getElementById("activities-list");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  
  // Toolbar elements
  const categoryFilter = document.getElementById("category-filter");
  const sortBy = document.getElementById("sort-by");
  const searchInput = document.getElementById("search-input");
  
  // Store all activities for filtering/sorting
  let allActivities = {};
  const userIcon = document.getElementById("user-icon");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const closeModal = document.querySelector(".close");
  const userInfo = document.getElementById("user-info");
  const usernameDisplay = document.getElementById("username-display");
  const logoutBtn = document.getElementById("logout-btn");
  const signupContainer = document.getElementById("signup-container");

  let authToken = localStorage.getItem("authToken");
  let isAuthenticated = false;

  // Check authentication status on load
  checkAuthStatus();

  // User icon click - show login modal or user info
  userIcon.addEventListener("click", () => {
    if (!isAuthenticated) {
      loginModal.classList.remove("hidden");
    }
  });

  // Close modal
  closeModal.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginForm.reset();
    loginMessage.classList.add("hidden");
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      loginModal.classList.add("hidden");
      loginForm.reset();
      loginMessage.classList.add("hidden");
    }
  });

  // Handle login
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        authToken = result.token;
        localStorage.setItem("authToken", authToken);
        isAuthenticated = true;
        updateUIForAuth(result.username);
        loginModal.classList.add("hidden");
        loginForm.reset();
        fetchActivities();
      } else {
        loginMessage.textContent = result.detail || "Login failed";
        loginMessage.className = "error";
        loginMessage.classList.remove("hidden");
      }
    } catch (error) {
      loginMessage.textContent = "Login failed. Please try again.";
      loginMessage.className = "error";
      loginMessage.classList.remove("hidden");
      console.error("Error logging in:", error);
    }
  });

  // Handle logout
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        headers: {
          Authorization: authToken,
        },
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }

    localStorage.removeItem("authToken");
    authToken = null;
    isAuthenticated = false;
    updateUIForAuth(null);
    fetchActivities();
  });

  // Check authentication status
  async function checkAuthStatus() {
    if (!authToken) {
      updateUIForAuth(null);
      return;
    }

    try {
      const response = await fetch("/auth/status", {
        headers: {
          Authorization: authToken,
        },
      });

      const result = await response.json();

      if (result.authenticated) {
        isAuthenticated = true;
        updateUIForAuth(result.username);
      } else {
        localStorage.removeItem("authToken");
        authToken = null;
        isAuthenticated = false;
        updateUIForAuth(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      updateUIForAuth(null);
    }
  }

  // Update UI based on authentication
  function updateUIForAuth(username) {
    if (username) {
      userIcon.classList.add("hidden");
      userInfo.classList.remove("hidden");
      usernameDisplay.textContent = `Welcome, ${username}`;
      signupContainer.classList.remove("hidden");
    } else {
      userIcon.classList.remove("hidden");
      userInfo.classList.add("hidden");
      signupContainer.classList.add("hidden");
    }
  }
  const modal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const activityInput = document.getElementById("activity");
  const closeModalBtn = document.querySelector(".close-modal");

  // Function to open registration modal
  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    messageDiv.classList.add("hidden");
    document.getElementById("email").value = "";
    modal.classList.remove("hidden");
  }

  // Function to close registration modal
  function closeRegistrationModal() {
    modal.classList.add("hidden");
  }

  // Close modal when clicking the X
  closeModalBtn.addEventListener("click", closeRegistrationModal);

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeRegistrationModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeRegistrationModal();
    }
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      
      renderActivities();
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      
      // Clear activity dropdown except the first option
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        isAuthenticated
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <button class="register-btn" data-activity="${name}">Register Student</button>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
          const activityName = event.target.getAttribute("data-activity");
          openRegistrationModal(activityName);
        });
      });

      // Add event listeners to delete buttons (only if authenticated)
      if (isAuthenticated) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
      }
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }
  
  // Function to render activities based on current filters
  function renderActivities() {
    // Clear existing content
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    
    // Get filter values with null checks
    const selectedCategory = categoryFilter ? categoryFilter.value : "all";
    const selectedSort = sortBy ? sortBy.value : "name-asc";
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    
    // Helper function to parse dates with fallback
    const parseDate = (dateString) => {
      if (!dateString) {
        // Return a far future date so activities without dates appear last
        return new Date('9999-12-31');
      }
      return new Date(dateString);
    };
    
    // Filter activities
    let filteredActivities = Object.entries(allActivities).filter(([name, details]) => {
      // Category filter
      if (selectedCategory !== "all" && details.category !== selectedCategory) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchableText = `${name} ${details.description} ${details.schedule} ${details.category}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort activities
    filteredActivities.sort(([nameA, detailsA], [nameB, detailsB]) => {
      switch (selectedSort) {
        case "name-asc":
          return nameA.localeCompare(nameB);
        case "name-desc":
          return nameB.localeCompare(nameA);
        case "date-newest": {
          const dateA = parseDate(detailsA.created_date);
          const dateB = parseDate(detailsB.created_date);
          return dateB - dateA;
        }
        case "date-oldest": {
          const dateA = parseDate(detailsA.created_date);
          const dateB = parseDate(detailsB.created_date);
          return dateA - dateB;
        }
        default:
          return 0;
      }
    });
    
    // Render filtered and sorted activities
    if (filteredActivities.length === 0) {
      activitiesList.innerHTML = "<p><em>No activities match your criteria.</em></p>";
      return;
    }
    
    filteredActivities.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      // Create participants HTML with delete icons instead of bullet points
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
            <h5>Participants:</h5>
            <ul class="participants-list">
              ${details.participants
                .map(
                  (email) =>
                    `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                )
                .join("")}
            </ul>
          </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Category:</strong> ${details.category || 'Uncategorized'}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authToken,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after configured delay
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, MESSAGE_AUTO_HIDE_DELAY);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            Authorization: authToken,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
        
        // Close modal after successful registration
        setTimeout(() => {
          closeRegistrationModal();
        }, MODAL_AUTO_CLOSE_DELAY);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after configured delay
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, MESSAGE_AUTO_HIDE_DELAY);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Add event listeners for toolbar controls
  if (categoryFilter) {
    categoryFilter.addEventListener("change", renderActivities);
  }
  if (sortBy) {
    sortBy.addEventListener("change", renderActivities);
  }
  if (searchInput) {
    searchInput.addEventListener("input", renderActivities);
  }

  // Initialize app
  fetchActivities();
});
