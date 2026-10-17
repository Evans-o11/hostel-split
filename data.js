function readItem(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const store = {
  loadBills: function () {
    return readItem("hostelBills", []);
  },
  saveBills: function (list) {
    writeItem("hostelBills", list);
  },
  loadRoommates: function () {
    return readItem("hostelRoommates", []);
  },
  saveRoommates: function (list) {
    writeItem("hostelRoommates", list);
  },
  loadSettings: function () {
    return readItem("hostelSettings", null);
  },
  saveSettings: function (settings) {
    writeItem("hostelSettings", settings);
  },
  clearAll: function () {
    localStorage.removeItem("hostelBills");
    localStorage.removeItem("hostelRoommates");
    localStorage.removeItem("hostelSettings");
  },
};
