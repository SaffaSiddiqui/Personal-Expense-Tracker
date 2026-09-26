/**
 * Personal Expense Tracker
 * Core JavaScript: Add, Edit, Delete, Form Validation, Dynamic Totals & Category Filtering
 */

// ============================================================================
// 1. Initial State & Sample Data
// ============================================================================

// Sample initial data so the application is immediately visual and ready for testing
let expenses = [
  {
    id: "1",
    title: "Grocery Supermarket",
    amount: 68.50,
    category: "Food & Dining"
  },
  {
    id: "2",
    title: "Monthly Subway Pass",
    amount: 45.00,
    category: "Transportation"
  },
  {
    id: "3",
    title: "High-Speed Internet Bill",
    amount: 59.99,
    category: "Bills & Utilities"
  }
];

// Tracking edit mode state
let editingExpenseId = null;

// Tracking active category filter
let currentFilterCategory = "All";

// ============================================================================
// 2. DOM Element Selectors
// ============================================================================

// Form Elements
const expenseForm = document.getElementById("expense-form");
const expenseIdInput = document.getElementById("expense-id");
const titleInput = document.getElementById("expense-title");
const amountInput = document.getElementById("expense-amount");
const categorySelect = document.getElementById("expense-category");
const submitBtn = document.getElementById("submit-btn");
const submitBtnText = document.getElementById("submit-btn-text");
const cancelBtn = document.getElementById("cancel-btn");
const formHeading = document.getElementById("form-heading");
const formModeBadge = document.getElementById("form-mode-badge");
const formCard = document.querySelector(".form-card");
const formAlert = document.getElementById("form-alert");

// Error Display Elements
const titleError = document.getElementById("title-error");
const amountError = document.getElementById("amount-error");
const categoryError = document.getElementById("category-error");

// Overview / Summary Elements
const totalAmountDisplay = document.getElementById("total-amount");
const totalLabelDisplay = document.getElementById("total-label");
const expenseCountDisplay = document.getElementById("expense-count");

// List & Filter Elements
const expenseTable = document.getElementById("expense-table");
const expenseList = document.getElementById("expense-list");
const categoryFilter = document.getElementById("category-filter");
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptySubtitle = document.getElementById("empty-subtitle");

// ============================================================================
// 3. Helper Functions
// ============================================================================

/**
 * Format numbers into currency format ($XX.XX)
 * @param {number} num 
 * @returns {string} Formatted currency
 */
function formatCurrency(num) {
  return "$" + Number(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Escape HTML to prevent cross-site scripting (XSS)
 * @param {string} str 
 * @returns {string} Sanitized string
 */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Get CSS badge class name based on category
 * @param {string} category 
 * @returns {string} CSS class
 */
function getCategoryBadgeClass(category) {
  switch (category) {
    case "Food & Dining":
      return "badge-food";
    case "Transportation":
      return "badge-transportation";
    case "Shopping":
      return "badge-shopping";
    case "Entertainment":
      return "badge-entertainment";
    case "Bills & Utilities":
      return "badge-bills";
    case "Health & Fitness":
      return "badge-health";
    case "Education":
      return "badge-education";
    default:
      return "badge-other";
  }
}

/**
 * Show temporary feedback alert message
 * @param {string} message 
 * @param {string} type ('success' | 'danger')
 */
let alertTimeout;
function showAlert(message, type = "success") {
  clearTimeout(alertTimeout);
  formAlert.textContent = message;
  formAlert.className = `alert alert-${type}`;
  formAlert.style.display = "flex";

  alertTimeout = setTimeout(() => {
    formAlert.style.display = "none";
  }, 3500);
}

// ============================================================================
// 4. Form Validation
// ============================================================================

/**
 * Clear validation errors for a specific field
 * @param {HTMLElement} inputElement 
 * @param {HTMLElement} errorElement 
 */
function clearFieldError(inputElement, errorElement) {
  const formGroup = inputElement.closest(".form-group");
  if (formGroup) {
    formGroup.classList.remove("has-error");
  }
  if (errorElement) {
    errorElement.textContent = "";
  }
}

/**
 * Display validation error for a specific field
 * @param {HTMLElement} inputElement 
 * @param {HTMLElement} errorElement 
 * @param {string} message 
 */
function setFieldError(inputElement, errorElement, message) {
  const formGroup = inputElement.closest(".form-group");
  if (formGroup) {
    formGroup.classList.add("has-error");
  }
  if (errorElement) {
    errorElement.textContent = message;
  }
}

/**
 * Validate all form fields
 * Requirements:
 * 1. Title cannot be empty
 * 2. Amount must be a positive number (> 0)
 * 3. Category cannot be empty
 * @returns {boolean} True if all valid, false otherwise
 */
function validateForm() {
  let isValid = true;

  const titleVal = titleInput.value.trim();
  const amountVal = amountInput.value.trim();
  const amountNum = parseFloat(amountVal);
  const categoryVal = categorySelect.value;

  // 1. Title Validation
  if (titleVal === "") {
    setFieldError(titleInput, titleError, "Expense title is required.");
    isValid = false;
  } else {
    clearFieldError(titleInput, titleError);
  }

  // 2. Amount Validation
  if (amountVal === "") {
    setFieldError(amountInput, amountError, "Amount is required.");
    isValid = false;
  } else if (isNaN(amountNum) || amountNum <= 0) {
    setFieldError(amountInput, amountError, "Amount must be a positive number greater than 0.");
    isValid = false;
  } else {
    clearFieldError(amountInput, amountError);
  }

  // 3. Category Validation
  if (!categoryVal || categoryVal.trim() === "") {
    setFieldError(categorySelect, categoryError, "Please select an expense category.");
    isValid = false;
  } else {
    clearFieldError(categorySelect, categoryError);
  }

  return isValid;
}

// Clear errors dynamically on input
titleInput.addEventListener("input", () => clearFieldError(titleInput, titleError));
amountInput.addEventListener("input", () => clearFieldError(amountInput, amountError));
categorySelect.addEventListener("change", () => clearFieldError(categorySelect, categoryError));

// ============================================================================
// 5. CRUD Operations (Add, Edit, Delete)
// ============================================================================

/**
 * Handle form submission for both Adding and Editing expenses
 */
function handleFormSubmit(e) {
  e.preventDefault();

  // Validate form inputs
  if (!validateForm()) {
    return;
  }

  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (editingExpenseId !== null) {
    // ---- EDIT EXISTING EXPENSE ----
    const index = expenses.findIndex(item => item.id === editingExpenseId);
    if (index !== -1) {
      expenses[index].title = title;
      expenses[index].amount = amount;
      expenses[index].category = category;
      showAlert("Expense updated successfully!", "success");
    }
    // If current filter would hide the edited item, switch filter to All
    if (currentFilterCategory !== "All" && category !== currentFilterCategory) {
      currentFilterCategory = "All";
      categoryFilter.value = "All";
    }
    resetFormMode();
  } else {
    // ---- ADD NEW EXPENSE ----
    const newExpense = {
      id: Date.now().toString(),
      title: title,
      amount: amount,
      category: category
    };
    expenses.unshift(newExpense);
    showAlert("Expense added successfully!", "success");
    // If current filter would hide the new item, switch filter to All
    if (currentFilterCategory !== "All" && category !== currentFilterCategory) {
      currentFilterCategory = "All";
      categoryFilter.value = "All";
    }
    resetFormFields();
  }

  // Re-render table and update total amount
  renderExpenses();
}

/**
 * Switch form into Edit Mode with the selected expense's details
 * @param {string} id 
 */
function startEditExpense(id) {
  const expense = expenses.find(item => item.id === id);
  if (!expense) return;

  editingExpenseId = id;

  // Populate form fields
  expenseIdInput.value = expense.id;
  titleInput.value = expense.title;
  amountInput.value = expense.amount;
  categorySelect.value = expense.category;

  // Clear any existing errors
  clearFieldError(titleInput, titleError);
  clearFieldError(amountInput, amountError);
  clearFieldError(categorySelect, categoryError);

  // Update UI to indicate Edit Mode
  formHeading.textContent = "Edit Expense";
  formModeBadge.style.display = "inline-block";
  submitBtnText.textContent = "Update Expense";
  cancelBtn.style.display = "inline-flex";
  formCard.classList.add("edit-active");

  // Focus title input and scroll to form smoothly on smaller devices
  titleInput.focus();
  formCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Cancel Edit Mode and reset form to Add Mode
 */
function cancelEdit() {
  resetFormMode();
  showAlert("Edit canceled.", "danger");
}

/**
 * Reset form fields only
 */
function resetFormFields() {
  expenseIdInput.value = "";
  titleInput.value = "";
  amountInput.value = "";
  categorySelect.value = "";

  clearFieldError(titleInput, titleError);
  clearFieldError(amountInput, amountError);
  clearFieldError(categorySelect, categoryError);
}

/**
 * Reset form back to Add New Expense mode
 */
function resetFormMode() {
  editingExpenseId = null;
  resetFormFields();

  formHeading.textContent = "Add New Expense";
  formModeBadge.style.display = "none";
  submitBtnText.textContent = "Add Expense";
  cancelBtn.style.display = "none";
  formCard.classList.remove("edit-active");
}

/**
 * Delete an expense by ID
 * @param {string} id 
 */
function deleteExpense(id) {
  const expense = expenses.find(item => item.id === id);
  if (!expense) return;

  // If user is currently editing the expense being deleted, reset form
  if (editingExpenseId === id) {
    resetFormMode();
  }

  // Remove expense from array
  expenses = expenses.filter(item => item.id !== id);

  showAlert(`Deleted "${expense.title}"`, "danger");

  // Re-render table and update total amount
  renderExpenses();
}

// ============================================================================
// 6. Category Filtering (Improvement 2)
// ============================================================================

/**
 * Get filtered expenses based on currently selected filter
 * @returns {Array} Filtered expenses
 */
function getFilteredExpenses() {
  if (currentFilterCategory === "All") {
    return expenses;
  }
  return expenses.filter(item => item.category === currentFilterCategory);
}

/**
 * Handle category filter dropdown change
 */
function handleCategoryFilterChange(e) {
  currentFilterCategory = e.target.value;
  renderExpenses();
}

// ============================================================================
// 7. Rendering & Dynamic Total Calculation
// ============================================================================

/**
 * Calculate dynamic total and render the table view
 * Automatically updates total whenever an expense is added, edited, or deleted,
 * or when a category filter is selected.
 */
function renderExpenses() {
  const filteredList = getFilteredExpenses();

  // 1. Calculate dynamic total of displayed expenses
  const displayedTotal = filteredList.reduce((sum, item) => sum + item.amount, 0);

  // Update dynamic total text
  totalAmountDisplay.textContent = formatCurrency(displayedTotal);

  // Update dynamic count
  expenseCountDisplay.textContent = filteredList.length;

  // Update summary card label to reflect filter state
  if (currentFilterCategory === "All") {
    totalLabelDisplay.textContent = "Total Expenses";
  } else {
    totalLabelDisplay.textContent = `Total (${currentFilterCategory})`;
  }

  // 2. Render table rows or show empty state
  if (filteredList.length === 0) {
    expenseTable.style.display = "none";
    emptyState.style.display = "flex";

    if (expenses.length === 0) {
      emptyTitle.textContent = "No expenses recorded yet";
      emptySubtitle.textContent = "Use the form on the left to add your first expense.";
    } else {
      emptyTitle.textContent = `No expenses in "${currentFilterCategory}"`;
      emptySubtitle.textContent = "Try selecting \"All Categories\" or a different category filter.";
    }

    expenseList.innerHTML = "";
    return;
  }

  // Show table and hide empty state
  expenseTable.style.display = "table";
  emptyState.style.display = "none";

  // Build table rows
  let rowsHtml = "";

  filteredList.forEach(item => {
    const badgeClass = getCategoryBadgeClass(item.category);
    const escapedTitle = escapeHTML(item.title);
    const formattedAmount = formatCurrency(item.amount);

    rowsHtml += `
      <tr data-id="${item.id}">
        <td>
          <span class="expense-title-text">${escapedTitle}</span>
        </td>
        <td>
          <span class="badge ${badgeClass}">${escapeHTML(item.category)}</span>
        </td>
        <td class="td-amount">
          ${formattedAmount}
        </td>
        <td class="td-actions">
          <div class="action-buttons">
            <!-- Edit Button with SVG Pencil Icon -->
            <button 
              type="button" 
              class="btn-action btn-edit" 
              data-action="edit" 
              data-id="${item.id}"
              title="Edit expense"
              aria-label="Edit ${escapedTitle}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>

            <!-- Delete Button with SVG Trash Icon -->
            <button 
              type="button" 
              class="btn-action btn-delete" 
              data-action="delete" 
              data-id="${item.id}"
              title="Delete expense"
              aria-label="Delete ${escapedTitle}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  expenseList.innerHTML = rowsHtml;
}

// ============================================================================
// 8. Event Delegation for Action Buttons
// ============================================================================

/**
 * Handle clicks on Edit and Delete buttons in the table
 */
function handleTableActionClick(e) {
  const actionBtn = e.target.closest(".btn-action");
  if (!actionBtn) return;

  const action = actionBtn.getAttribute("data-action");
  const id = actionBtn.getAttribute("data-id");

  if (action === "edit") {
    startEditExpense(id);
  } else if (action === "delete") {
    deleteExpense(id);
  }
}

// ============================================================================
// 9. Application Initialization
// ============================================================================

function initApp() {
  // Form submission listener
  expenseForm.addEventListener("submit", handleFormSubmit);

  // Cancel edit button listener
  cancelBtn.addEventListener("click", cancelEdit);

  // Category filter dropdown listener (Improvement 2)
  categoryFilter.addEventListener("change", handleCategoryFilterChange);

  // Table action buttons listener (Edit/Delete via delegation)
  expenseList.addEventListener("click", handleTableActionClick);

  // Initial render
  renderExpenses();
}

// Run application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", initApp);
