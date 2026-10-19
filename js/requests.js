(function () {
  const REQUESTS_KEY = "muranga.requests";
  const CATEGORIES = ["Water Supply", "Roads", "Streetlights", "Garbage Collection", "Drainage", "Other"];
  const SUB_COUNTIES = ["Gatanga", "Kandara", "Kangema", "Kigumo", "Kiharu", "Mathioya", "Maragua"];

  function readAll() {
    try { return JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]"); }
    catch { return []; }
  }

  function saveAll(requests) {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  }

  function referenceNumber() {
    const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    return `MPS-${day}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 5).toUpperCase()}`;
  }

  function seedDemoRequests() {
    if (localStorage.getItem(REQUESTS_KEY)) return;
    const citizen = "citizen@example.com";
    const today = new Date();
    const date = (daysAgo, hours) => {
      const value = new Date(today);
      value.setDate(value.getDate() - daysAgo);
      value.setHours(hours, 20, 0, 0);
      return value.toISOString();
    };
    const requests = [
      { reference: "MPS-20261014-A17KD", owner: citizen, category: "Streetlights", county: "Murang'a", subCounty: "Kiharu", location: "Kenyatta Road, near Murang'a Level 5 Hospital", description: "The streetlight outside the hospital entrance has not been working for several nights. The area is difficult for pedestrians to use after dark.", status: "In Progress", createdAt: date(5, 9), updatedAt: date(2, 14), image: null, history: [{ status: "Pending", changedAt: date(5, 9), note: "Request submitted" }, { status: "In Progress", changedAt: date(2, 14), note: "Assigned to the county roads and lighting team" }] },
      { reference: "MPS-20261009-F2M8Q", owner: citizen, category: "Water Supply", county: "Murang'a", subCounty: "Kandara", location: "Ng'araria, near the chief's camp", description: "Several homes on this stretch have had an interrupted water supply since Monday morning. Please inspect the distribution line.", status: "Pending", createdAt: date(10, 10), updatedAt: date(10, 10), image: null, history: [{ status: "Pending", changedAt: date(10, 10), note: "Request submitted" }] },
      { reference: "MPS-20261002-J8P4S", owner: citizen, category: "Garbage Collection", county: "Murang'a", subCounty: "Kigumo", location: "Kangari market, eastern collection point", description: "The public collection point is overflowing and needs a scheduled pickup.", status: "Resolved", createdAt: date(17, 8), updatedAt: date(12, 11), image: null, history: [{ status: "Pending", changedAt: date(17, 8), note: "Request submitted" }, { status: "In Progress", changedAt: date(15, 15), note: "Collection crew assigned" }, { status: "Resolved", changedAt: date(12, 11), note: "Waste collected from the reported site" }] }
    ];
    saveAll(requests);
  }

  window.Requests = {
    categories: CATEGORIES,
    subCounties: SUB_COUNTIES,
    init: seedDemoRequests,
    all() { return readAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); },
    byOwner(email) { return this.all().filter(request => request.owner === email); },
    find(reference) { return this.all().find(request => request.reference === reference); },

    create(data, owner) {
      const requests = readAll();
      const now = new Date().toISOString();
      const request = {
        reference: referenceNumber(), owner, category: data.category, county: "Murang'a", subCounty: data.subCounty,
        location: data.location.trim(), description: data.description.trim(), image: data.image || null,
        status: "Pending", createdAt: now, updatedAt: now,
        history: [{ status: "Pending", changedAt: now, note: "Request submitted" }]
      };
      requests.push(request);
      saveAll(requests);
      return request;
    },

    updateStatus(reference, status, note) {
      if (!["Pending", "In Progress", "Resolved"].includes(status)) return false;
      const requests = readAll();
      const request = requests.find(item => item.reference === reference);
      if (!request) return false;
      if (request.status !== status) {
        const changedAt = new Date().toISOString();
        request.status = status;
        request.updatedAt = changedAt;
        request.history.push({ status, changedAt, note: note.trim() || `Status updated to ${status}` });
        saveAll(requests);
      }
      return true;
    }
  };
})();