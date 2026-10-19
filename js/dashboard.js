(function () {
  const app = document.getElementById("app");
  const navigation = document.getElementById("navigationLinks");
  const toastContainer = document.getElementById("toastContainer");
  const statuses = ["Pending", "In Progress", "Resolved"];
  let citizenQuery = "";
  let citizenStatus = "All statuses";
  let adminFilters = { query: "", category: "All categories", status: "All statuses" };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function dateTime(value) {
    return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }

  function dateOnly(value) {
    return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(value));
  }

  function statusClass(status) {
    return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
  }

  function statusBadge(status) {
    return `<span class="status-badge ${statusClass(status)}">${escapeHtml(status)}</span>`;
  }

  function showToast(message, title = "Service Desk") {
    const toastId = `toast-${Date.now()}`;
    toastContainer.insertAdjacentHTML("beforeend", `<div id="${toastId}" class="toast" role="status" data-bs-delay="4200"><div class="toast-header"><span class="toast-mark" aria-hidden="true">M</span><strong class="me-auto">${escapeHtml(title)}</strong><button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button></div><div class="toast-body">${escapeHtml(message)}</div></div>`);
    const toast = document.getElementById(toastId);
    const instance = new bootstrap.Toast(toast);
    toast.addEventListener("hidden.bs.toast", () => toast.remove());
    instance.show();
  }

  function navigate(route) {
    location.hash = route;
  }

  function currentRoute() {
    return decodeURIComponent(location.hash.slice(1) || "home");
  }

  function renderNavigation(user) {
    let links = "";
    if (!user) {
      links = '<a class="nav-link" href="#home">Home</a><a class="nav-link" href="#login">Sign in</a><a class="nav-link nav-action" href="#register">Create account</a>';
    } else if (user.role === "admin") {
      links = '<a class="nav-link" href="#admin">Request dashboard</a><span class="nav-link text-muted">Administrator</span><a class="nav-link nav-action" href="#logout">Sign out</a>';
    } else {
      links = '<a class="nav-link" href="#dashboard">My requests</a><a class="nav-link" href="#new-request">Report an issue</a><span class="nav-link text-muted">' + escapeHtml(user.name.split(" ")[0]) + '</span><a class="nav-link nav-action" href="#logout">Sign out</a>';
    }
    navigation.innerHTML = links;
  }

  function statCard(label, value, note, type) {
    return `<div class="stat-card stat-${type}"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-foot">${note}</div></div>`;
  }

  function emptyState(title, description, action = "") {
    return `<div class="empty-state"><span class="empty-mark" aria-hidden="true">M</span><h3>${title}</h3><p>${description}</p>${action}</div>`;
  }

  function renderHome() {
    app.innerHTML = `
      <section class="masthead" aria-labelledby="welcomeTitle">
        <div class="masthead-content">
          <div class="eyebrow">Murang'a County Government</div>
          <h1 id="welcomeTitle">A better way to get things moving.</h1>
          <p>Report a public service issue, receive a reference number, and follow its progress with the county team.</p>
          <div class="d-flex flex-wrap gap-2"><a class="btn btn-light-outline" href="#register">Create an account</a><a class="btn btn-light-outline" href="#login">Sign in to continue</a></div>
        </div>
      </section>
      <section aria-labelledby="servicesTitle">
        <div class="d-flex flex-wrap justify-content-between align-items-end gap-2"><div><div class="eyebrow text-success-emphasis mt-4">County services</div><h2 id="servicesTitle" class="section-heading mt-1 mb-0">What can we help you report?</h2></div><a href="#new-request" class="btn btn-county">Report a service issue</a></div>
        <div class="service-grid mt-3">
          <article class="service-item"><span class="service-symbol" aria-hidden="true">WS</span><div><h3>Water supply</h3><p>Leaks, interruptions, or public water points.</p></div></article>
          <article class="service-item"><span class="service-symbol" aria-hidden="true">RD</span><div><h3>Roads</h3><p>Potholes, damaged surfaces, or access issues.</p></div></article>
          <article class="service-item"><span class="service-symbol" aria-hidden="true">SL</span><div><h3>Streetlights</h3><p>Faulty or non-functioning public lighting.</p></div></article>
          <article class="service-item"><span class="service-symbol" aria-hidden="true">GC</span><div><h3>Garbage collection</h3><p>Missed collection or overflowing public sites.</p></div></article>
          <article class="service-item"><span class="service-symbol" aria-hidden="true">DR</span><div><h3>Drainage</h3><p>Blocked drains, flooding, and damaged channels.</p></div></article>
          <article class="service-item"><span class="service-symbol" aria-hidden="true">OT</span><div><h3>Other public services</h3><p>Tell us about another county service concern.</p></div></article>
        </div>
        <div class="trust-strip"><span>Reference number for every report</span><span>Progress updates you can follow</span><span>One place for your service requests</span></div>
      </section>`;
  }

  function authError(form, message) {
    const target = form.querySelector("[data-form-error]");
    target.innerHTML = `<div class="alert alert-danger py-2 mb-3" role="alert">${escapeHtml(message)}</div>`;
  }

  function renderLogin() {
    app.innerHTML = `
      <section class="auth-wrap">
        <div class="auth-header"><div class="eyebrow text-success-emphasis">Welcome back</div><h1>Sign in</h1><p>Access your service requests or county dashboard.</p></div>
        <div class="surface auth-surface">
          <form id="loginForm" novalidate>
            <div data-form-error></div>
            <div class="mb-3"><label class="form-label" for="loginEmail">Email address</label><input class="form-control" id="loginEmail" name="email" type="email" autocomplete="username" required></div>
            <div class="mb-3"><label class="form-label" for="loginPassword">Password</label><input class="form-control" id="loginPassword" name="password" type="password" autocomplete="current-password" required></div>
            <button class="btn btn-county w-100" type="submit">Sign in securely</button>
          </form>
          <div class="demo-note"><strong>Evaluation accounts</strong><br>Citizen: <code>citizen@example.com</code> / <code>Citizen123!</code><br>Administrator: <code>admin@muranga.go.ke</code> / <code>Admin123!</code></div>
          <p class="privacy-note">This demonstration stores data in this browser only. Do not use real personal or sensitive information.</p>
        </div>
        <p class="text-center mt-3 mb-0">New to the service? <a href="#register">Create a citizen account</a></p>
      </section>`;
    document.getElementById("loginForm").addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;
      const result = await Auth.login(form.email.value, form.password.value);
      if (!result.ok) return authError(form, result.message);
      showToast(`Signed in as ${result.user.name}.`);
      navigate(result.user.role === "admin" ? "admin" : "dashboard");
    });
  }

  function renderRegister() {
    app.innerHTML = `
      <section class="auth-wrap">
        <div class="auth-header"><div class="eyebrow text-success-emphasis">Citizen services</div><h1>Create an account</h1><p>Use your account to submit and follow county service requests.</p></div>
        <div class="surface auth-surface">
          <form id="registerForm" novalidate>
            <div data-form-error></div>
            <div class="mb-3"><label class="form-label" for="fullName">Full name</label><input class="form-control" id="fullName" name="name" autocomplete="name" minlength="2" maxlength="80" required></div>
            <div class="mb-3"><label class="form-label" for="registerEmail">Email address</label><input class="form-control" id="registerEmail" name="email" type="email" autocomplete="email" maxlength="120" required></div>
            <div class="mb-3"><label class="form-label" for="registerPassword">Password</label><input class="form-control" id="registerPassword" name="password" type="password" autocomplete="new-password" minlength="8" required><div class="form-text">Use at least 8 characters.</div></div>
            <div class="mb-3"><label class="form-label" for="confirmPassword">Confirm password</label><input class="form-control" id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required></div>
            <button class="btn btn-county w-100" type="submit">Create citizen account</button>
          </form>
          <p class="privacy-note">This demonstration stores data in this browser only. Do not use real personal or sensitive information.</p>
        </div>
        <p class="text-center mt-3 mb-0">Already registered? <a href="#login">Sign in</a></p>
      </section>`;
    document.getElementById("registerForm").addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;
      if (form.password.value !== form.confirmPassword.value) return authError(form, "The passwords do not match. Please check both fields.");
      const result = await Auth.register(form.name.value, form.email.value, form.password.value);
      if (!result.ok) return authError(form, result.message);
      showToast("Your citizen account is ready.");
      navigate("dashboard");
    });
  }

  function requestRows(requests) {
    if (!requests.length) return `<tr><td colspan="5">${emptyState("No requests match", "Try another search or submit a new service request.")}</td></tr>`;
    return requests.map(request => `<tr>
      <td><a class="ref-link" href="#request/${encodeURIComponent(request.reference)}">${escapeHtml(request.reference)}</a></td>
      <td>${escapeHtml(request.category)}</td><td>${escapeHtml(request.subCounty)}<br><span class="text-muted">${escapeHtml(request.location)}</span></td>
      <td>${dateOnly(request.createdAt)}</td><td>${statusBadge(request.status)}</td>
    </tr>`).join("");
  }

  function renderCitizenRows() {
    const user = Auth.current();
    if (!user) return;
    const filtered = Requests.byOwner(user.email).filter(request => {
      const term = citizenQuery.toLowerCase();
      const matchesTerm = !term || [request.reference, request.category, request.location, request.subCounty].some(value => value.toLowerCase().includes(term));
      return matchesTerm && (citizenStatus === "All statuses" || request.status === citizenStatus);
    });
    const body = document.getElementById("citizenRequestRows");
    if (body) body.innerHTML = requestRows(filtered);
    const count = document.getElementById("citizenResultCount");
    if (count) count.textContent = `${filtered.length} ${filtered.length === 1 ? "request" : "requests"}`;
  }

  function renderCitizenDashboard() {
    const user = Auth.current();
    const requests = Requests.byOwner(user.email);
    const count = status => requests.filter(request => request.status === status).length;
    app.innerHTML = `
      <header class="page-heading"><div><div class="eyebrow text-success-emphasis">Citizen account</div><h1>My service requests</h1><p>Welcome, ${escapeHtml(user.name)}. Follow each report from submission to resolution.</p></div><div class="heading-actions"><a class="btn btn-county" href="#new-request">Report an issue</a></div></header>
      <section class="stat-grid" aria-label="Your request summary">${statCard("Total requests", requests.length, "Submitted by you", "total")}${statCard("Pending", count("Pending"), "Awaiting review", "pending")}${statCard("In progress", count("In Progress"), "Being attended to", "progress")}${statCard("Resolved", count("Resolved"), "Completed requests", "resolved")}</section>
      <section class="panel" aria-labelledby="myRequestsTitle"><div class="panel-heading"><h2 id="myRequestsTitle">Your reports</h2><span id="citizenResultCount" class="text-muted small"></span></div>
        ${requests.length ? `<div class="filter-row" style="grid-template-columns:minmax(200px,2fr) minmax(150px,1fr)"><div class="filter-search"><label class="visually-hidden" for="citizenSearch">Search your requests</label><input id="citizenSearch" class="form-control" type="search" placeholder="Search reference, category, or location"></div><div><label class="visually-hidden" for="citizenStatus">Filter by status</label><select id="citizenStatus" class="form-select"><option>All statuses</option>${statuses.map(status => `<option>${status}</option>`).join("")}</select></div></div><div class="table-responsive"><table class="table"><thead><tr><th>Reference</th><th>Category</th><th>Location</th><th>Submitted</th><th>Status</th></tr></thead><tbody id="citizenRequestRows"></tbody></table></div>` : emptyState("Your reports will appear here", "Submit a county service issue to start tracking it.", '<a class="btn btn-county" href="#new-request">Submit a request</a>')}
      </section>`;
    if (requests.length) {
      renderCitizenRows();
      document.getElementById("citizenSearch").addEventListener("input", event => { citizenQuery = event.target.value; renderCitizenRows(); });
      document.getElementById("citizenStatus").addEventListener("change", event => { citizenStatus = event.target.value; renderCitizenRows(); });
    }
  }

  function renderNewRequest() {
    const categoryOptions = Requests.categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
    const subCountyOptions = Requests.subCounties.map(subCounty => `<option value="${escapeHtml(subCounty)}">${escapeHtml(subCounty)}</option>`).join("");
    app.innerHTML = `
      <header class="page-heading"><div><div class="eyebrow text-success-emphasis">New service request</div><h1>Report an issue</h1><p>Give us enough detail to identify the location and understand what needs attention.</p></div></header>
      <div class="row g-4"><div class="col-lg-8"><section class="surface auth-surface">
        <form id="requestForm" novalidate>
          <div data-form-error></div>
          <div class="row g-3"><div class="col-md-6"><label class="form-label" for="category">Service category</label><select class="form-select" id="category" name="category" required><option value="">Choose a category</option>${categoryOptions}</select></div>
          <div class="col-md-6"><label class="form-label" for="county">County</label><input class="form-control" id="county" value="Murang'a" readonly aria-readonly="true"></div>
          <div class="col-md-6"><label class="form-label" for="subCounty">Sub-county</label><select class="form-select" id="subCounty" name="subCounty" required><option value="">Choose a sub-county</option>${subCountyOptions}</select></div>
          <div class="col-md-6"><label class="form-label" for="location">Specific location</label><input class="form-control" id="location" name="location" maxlength="160" placeholder="Estate, road, market, landmark" required></div>
          <div class="col-12"><label class="form-label" for="description">Describe the issue</label><textarea class="form-control" id="description" name="description" minlength="20" maxlength="1500" placeholder="What happened, when did you notice it, and who is affected?" required></textarea><div class="form-text">Include useful details, but do not include passwords, identity numbers, or other sensitive personal information.</div></div>
          <div class="col-12"><label class="form-label" for="attachment">Photo (optional)</label><input class="form-control image-field" id="attachment" name="attachment" type="file" accept="image/jpeg,image/png,image/webp"><div class="form-text">One JPG, PNG, or WebP image up to 1.5 MB.</div></div>
          <div class="col-12 d-flex flex-wrap gap-2 pt-2"><button class="btn btn-county" type="submit">Submit service request</button><a class="btn btn-outline-county" href="#dashboard">Cancel</a></div>
        </form>
      </section></div><aside class="col-lg-4"><section class="panel"><div class="eyebrow text-success-emphasis">What happens next</div><h2 class="mt-2" style="font-family:var(--font-display);font-size:1.45rem">Your report, step by step</h2><ol class="history-list"><li><strong>Reference assigned</strong>Your report is recorded with a unique reference number.</li><li><strong>County review</strong>The relevant service team reviews the location and details.</li><li><strong>Progress updates</strong>Track changes from your account using the reference.</li></ol></section><p class="privacy-note">Do not use this portal to report urgent emergencies. Contact the appropriate emergency service directly.</p></aside></div>`;
    document.getElementById("requestForm").addEventListener("submit", submitRequest);
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("The selected image could not be read."));
      reader.readAsDataURL(file);
    });
  }

  async function submitRequest(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const file = form.attachment.files[0];
    if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return authError(form, "Choose a JPG, PNG, or WebP image.");
    if (file && file.size > 1.5 * 1024 * 1024) return authError(form, "The image must be 1.5 MB or smaller.");
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const image = file ? await readImage(file) : null;
      const request = Requests.create({ category: form.category.value, subCounty: form.subCounty.value, location: form.location.value, description: form.description.value, image }, Auth.current().email);
      showToast(`Your reference number is ${request.reference}.`, "Request submitted");
      navigate(`request/${encodeURIComponent(request.reference)}`);
    } catch (error) {
      authError(form, error.message || "Your request could not be saved. Please try again.");
      button.disabled = false;
    }
  }

  function renderRequestDetail(reference) {
    const user = Auth.current();
    const request = Requests.find(reference);
    if (!request || (user.role !== "admin" && request.owner !== user.email)) {
      app.innerHTML = `<section class="surface panel">${emptyState("Request not available", "This request may not exist, or you may not have permission to view it.", '<a class="btn btn-outline-county" href="#dashboard">Return to my requests</a>')}</section>`;
      return;
    }
    const owner = user.role === "admin" ? `<div class="detail-row"><span class="detail-label">Submitted by</span><span class="detail-value">${escapeHtml(request.owner)}</span></div>` : "";
    const image = request.image ? `<div class="detail-row"><span class="detail-label">Attachment</span><span class="detail-value"><a href="${request.image}" target="_blank" rel="noopener">Open attached image</a><img class="attachment-preview" src="${request.image}" alt="Image attached to request ${escapeHtml(request.reference)}"></span></div>` : "";
    const history = [...request.history].reverse().map(item => `<li><strong>${escapeHtml(item.status)}</strong>${escapeHtml(item.note)}<br><span>${dateTime(item.changedAt)}</span></li>`).join("");
    const backRoute = user.role === "admin" ? "admin" : "dashboard";
    app.innerHTML = `
      <header class="page-heading"><div><div class="eyebrow text-success-emphasis">Request tracking</div><h1 class="font-monospace" style="font-size:1.55rem">${escapeHtml(request.reference)}</h1><p>Submitted ${dateTime(request.createdAt)}</p></div><div class="heading-actions d-flex gap-2 no-print"><button class="btn btn-outline-county" id="printRequest" type="button">Print summary</button><a class="btn btn-outline-county" href="#${backRoute}">Back</a></div></header>
      <div class="detail-grid"><section class="surface detail-panel"><div class="d-flex justify-content-between align-items-start gap-2"><h2 class="detail-title">${escapeHtml(request.category)}</h2>${statusBadge(request.status)}</div>
        <div class="detail-row"><span class="detail-label">County</span><span class="detail-value">${escapeHtml(request.county)}</span></div><div class="detail-row"><span class="detail-label">Sub-county</span><span class="detail-value">${escapeHtml(request.subCounty)}</span></div><div class="detail-row"><span class="detail-label">Specific location</span><span class="detail-value">${escapeHtml(request.location)}</span></div><div class="detail-row"><span class="detail-label">Issue description</span><span class="detail-value fw-normal">${escapeHtml(request.description).replaceAll("\n", "<br>")}</span></div>${owner}${image}
      </section><aside class="surface detail-panel"><h2 class="panel-heading mb-0"><span>Progress history</span></h2><ol class="history-list">${history}</ol></aside></div>`;
    document.getElementById("printRequest").addEventListener("click", () => window.print());
  }

  function adminRows(requests) {
    if (!requests.length) return `<tr><td colspan="7">${emptyState("No matching requests", "Try adjusting the filters to see more results.")}</td></tr>`;
    return requests.map(request => `<tr>
      <td><a class="ref-link" href="#request/${encodeURIComponent(request.reference)}">${escapeHtml(request.reference)}</a><div class="text-muted small mt-1">${escapeHtml(request.owner)}</div></td>
      <td>${escapeHtml(request.category)}</td><td>${escapeHtml(request.subCounty)}<br><span class="text-muted">${escapeHtml(request.location)}</span></td><td>${dateOnly(request.createdAt)}</td>
      <td>${statusBadge(request.status)}</td><td><label class="visually-hidden" for="status-${escapeHtml(request.reference)}">New status for ${escapeHtml(request.reference)}</label><select id="status-${escapeHtml(request.reference)}" class="form-select status-edit">${statuses.map(status => `<option${status === request.status ? " selected" : ""}>${status}</option>`).join("")}</select><input class="form-control status-edit status-note mt-1" type="text" maxlength="120" aria-label="Update note for ${escapeHtml(request.reference)}" placeholder="Update note (optional)"></td>
      <td><button class="btn btn-outline-county btn-sm save-status" type="button" data-reference="${escapeHtml(request.reference)}">Save</button></td>
    </tr>`).join("");
  }

  function filteredAdminRequests() {
    const term = adminFilters.query.toLowerCase();
    return Requests.all().filter(request => {
      const searchable = [request.reference, request.category, request.county, request.subCounty, request.location, request.description, request.owner].join(" ").toLowerCase();
      return (!term || searchable.includes(term)) && (adminFilters.category === "All categories" || request.category === adminFilters.category) && (adminFilters.status === "All statuses" || request.status === adminFilters.status);
    });
  }

  function refreshAdminRows() {
    const rows = filteredAdminRequests();
    const body = document.getElementById("adminRequestRows");
    if (body) body.innerHTML = adminRows(rows);
    const count = document.getElementById("adminResultCount");
    if (count) count.textContent = `${rows.length} of ${Requests.all().length} requests`;
  }

  function renderAdminDashboard() {
    const requests = Requests.all();
    const count = status => requests.filter(request => request.status === status).length;
    const total = requests.length || 1;
    const pct = status => Math.round((count(status) / total) * 100);
    const categoryOptions = Requests.categories.map(category => `<option>${escapeHtml(category)}</option>`).join("");
    app.innerHTML = `
      <header class="page-heading"><div><div class="eyebrow text-success-emphasis">County operations <span class="admin-label ms-2">Admin</span></div><h1>Request dashboard</h1><p>Review public service reports and keep residents informed.</p></div></header>
      <section class="stat-grid" aria-label="All request statistics">${statCard("Total requests", requests.length, "Across all categories", "total")}${statCard("Pending", count("Pending"), "Awaiting review", "pending")}${statCard("In progress", count("In Progress"), "Assigned or under action", "progress")}${statCard("Resolved", count("Resolved"), "Completed requests", "resolved")}</section>
      <section class="panel" aria-labelledby="analyticsTitle"><div class="panel-heading"><h2 id="analyticsTitle">Request status overview</h2><span class="text-muted small">${requests.length} recorded</span></div><div class="row g-3">${statuses.map(status => `<div class="col-md-4"><div class="d-flex justify-content-between mb-2"><span class="small fw-semibold">${status}</span><span class="small text-muted">${count(status)} · ${pct(status)}%</span></div><div class="progress" role="progressbar" aria-label="${status} requests" aria-valuenow="${pct(status)}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${pct(status)}%"></div></div></div>`).join("")}</div></section>
      <section class="panel" aria-labelledby="allRequestsTitle"><div class="panel-heading"><h2 id="allRequestsTitle">All service requests</h2><span id="adminResultCount" class="text-muted small"></span></div>
        <div class="filter-row"><div class="filter-search"><label class="visually-hidden" for="adminSearch">Search requests</label><input id="adminSearch" class="form-control" type="search" placeholder="Reference, location, reporter..."></div><div><label class="visually-hidden" for="adminCategory">Filter by category</label><select id="adminCategory" class="form-select"><option>All categories</option>${categoryOptions}</select></div><div><label class="visually-hidden" for="adminStatus">Filter by status</label><select id="adminStatus" class="form-select"><option>All statuses</option>${statuses.map(status => `<option>${status}</option>`).join("")}</select></div><button class="btn btn-outline-county" id="clearFilters" type="button">Clear</button></div>
        <div class="table-responsive"><table class="table"><thead><tr><th>Reference / citizen</th><th>Category</th><th>Location</th><th>Submitted</th><th>Status</th><th>Update status</th><th>Action</th></tr></thead><tbody id="adminRequestRows"></tbody></table></div>
      </section>`;
    refreshAdminRows();
    document.getElementById("adminSearch").addEventListener("input", event => { adminFilters.query = event.target.value; refreshAdminRows(); });
    document.getElementById("adminCategory").addEventListener("change", event => { adminFilters.category = event.target.value; refreshAdminRows(); });
    document.getElementById("adminStatus").addEventListener("change", event => { adminFilters.status = event.target.value; refreshAdminRows(); });
    document.getElementById("clearFilters").addEventListener("click", () => {
      adminFilters = { query: "", category: "All categories", status: "All statuses" };
      document.getElementById("adminSearch").value = "";
      document.getElementById("adminCategory").value = "All categories";
      document.getElementById("adminStatus").value = "All statuses";
      refreshAdminRows();
    });
  }

  function handleAdminSave(button) {
    const row = button.closest("tr");
    const reference = button.dataset.reference;
    const status = row.querySelector("select").value;
    const note = row.querySelector(".status-note").value;
    if (!Requests.updateStatus(reference, status, note)) return showToast("The request status could not be updated.", "Update failed");
    showToast(`${reference} is now ${status}.`, "Status updated");
    renderAdminDashboard();
  }

  function render() {
    const user = Auth.current();
    const route = currentRoute();
    renderNavigation(user);
    if (route === "logout") {
      Auth.logout();
      showToast("You have signed out.");
      return navigate("home");
    }
    if (route === "home") return renderHome();
    if (route === "login") return user ? navigate(user.role === "admin" ? "admin" : "dashboard") : renderLogin();
    if (route === "register") return user ? navigate(user.role === "admin" ? "admin" : "dashboard") : renderRegister();
    if (["dashboard", "new-request", "admin"].includes(route) && !user) return navigate("login");
    if (route === "admin") return user.role === "admin" ? renderAdminDashboard() : navigate("dashboard");
    if (["dashboard", "new-request"].includes(route) && user.role !== "citizen") return navigate("admin");
    if (route === "dashboard") return renderCitizenDashboard();
    if (route === "new-request") return renderNewRequest();
    if (route.startsWith("request/")) return user ? renderRequestDetail(route.slice("request/".length)) : navigate("login");
    app.innerHTML = `<section class="surface panel">${emptyState("Page not found", "The page you requested could not be found.", '<a class="btn btn-outline-county" href="#home">Go to home</a>')}</section>`;
  }

  navigation.addEventListener("click", event => {
    if (event.target.closest("a")) {
      const collapse = document.getElementById("mainNavigation");
      if (collapse.classList.contains("show")) bootstrap.Collapse.getOrCreateInstance(collapse).hide();
    }
  });

  app.addEventListener("click", event => {
    const button = event.target.closest(".save-status");
    if (button) handleAdminSave(button);
  });

  window.addEventListener("hashchange", render);
  Promise.resolve(Auth.init()).then(() => {
    Requests.init();
    render();
  }).catch(error => {
    app.innerHTML = `<div class="alert alert-danger" role="alert">The service desk could not start. Open this project through a local web server and check that browser storage is enabled. ${escapeHtml(error.message)}</div>`;
  });
})();