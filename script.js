const buttons = document.querySelectorAll("nav button");
buttons.forEach(function (button) {
  button.addEventListener("click", function () {
    showScreen(button.dataset.screen);
  });
});

const screens = document.querySelectorAll(".screen");
function showScreen(name) {
  screens.forEach(function (screen) {
    screen.classList.remove("screen-active");
  });
  const shownScreen = document.getElementById("screen" + name);
  shownScreen.classList.add("screen-active");
  buttons.forEach(function (button) {
    button.dataset.screen === name
      ? button.classList.add("active")
      : button.classList.remove("active");
  });
}
// . top of the file: read what was saved, or start empty
const saved = localStorage.getItem("hostelBills");
let bills = saved ? JSON.parse(saved) : [];

function saveBills() {
  localStorage.setItem("hostelBills", JSON.stringify(bills));
}

function deleteBill(id) {
  bills = bills.filter(function (bill) {
    return bill.id !== id;
  });
  saveBills();
  renderBills();
}

const billForm = document.getElementById("billForm");
billForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const billTitleInput = document.getElementById("billTitle");
  const billTitle = billTitleInput.value.trim();
  const billAmount = Number(document.getElementById("billAmount").value);
  const billDue = document.getElementById("billDue").value;
  const billNote = document.getElementById("billNote").value.trim();
  const formMessage = document.getElementById("formMessage");

  if (billTitle === "") {
    formMessage.textContent = "Please enter a bill title.";
    return;
  }

  if (billAmount <= 0) {
    formMessage.textContent = "Amount must be more than 0.";
    return;
  }
  formMessage.textContent = "";
  const newBill = {
    id: Date.now(),
    title: billTitle,
    amount: billAmount,
    dueDate: billDue,
    note: billNote,
    createdAt: new Date().toISOString(),
  };
  bills.push(newBill);
  saveBills();
  renderBills();
  billForm.reset();
  showBillsView("List");
showToast("Bill added", billTitle);
 
});

function renderBills() {
  const billList = document.getElementById("billList");
  billList.innerHTML = "";
  bills.forEach(function (bill) {
    const card = document.createElement("div");
    card.className = "bill-card";

    const top = document.createElement("div");
    top.className = "bill-top";

    const title = document.createElement("p");
    title.textContent = bill.title;
    title.className = "bill-title";

    const amount = document.createElement("p");
    amount.textContent = "₦" + bill.amount;
    amount.className = "bill-amount";

    const note = document.createElement("p");
    note.className = "bill-note";
    note.textContent = "Due " + bill.dueDate;

    const added = document.createElement("p");
    added.className = "bill-note";


    top.appendChild(title);
    top.appendChild(amount);
    card.appendChild(top);
    card.appendChild(note);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
      deleteBill(bill.id);
    });

    if (bill.note !== "") {
      const noteText = document.createElement("p");
      noteText.className = "bill-note";
      noteText.textContent = bill.note;
      card.appendChild(noteText);
    }

    if (bill.createdAt) {
      added.textContent = "Added "+new Date(bill.createdAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      card.appendChild(added);
    }

    card.appendChild(deleteButton);
    billList.appendChild(card);
  });
}

function showBillsView(name) {
  const views = document.querySelectorAll(".bills-view");
  views.forEach(function (view) {
    view.classList.remove("bills-view-active")
  });
document
  .getElementById("bills" + name + "View")
  .classList.add("bills-view-active");
}
document.getElementById("addBillButton").addEventListener("click", function () {
  showBillsView("Form");
});
document.getElementById("backButton").addEventListener("click", function () {
  showBillsView("List");
});

function showToast(title, text) {
  document.getElementById("toastTitle").textContent = title;
  document.getElementById("toastText").textContent = text;
  const toast = document.getElementById("toast");
  toast.classList.add("toast-show");
  setTimeout(function () {
    toast.classList.remove("toast-show");
  }, 2500);
}

function showCurrentMonth() {
  document.getElementById("currentMonth").textContent =
    new Date().toLocaleString("en-GB", { month: "long", year: "numeric" });
}

renderBills();
showCurrentMonth();

