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

let billToCancel = null;

function openCancelDialog(bill) {
  billToCancel = bill.id;
  document.getElementById("cancelBillName").textContent = bill.title;
  document.getElementById("cancelReason").value = "";
  document.getElementById("cancelMessage").textContent = "";
  if (bill.payments && bill.payments.length > 0) {
    showToast("Can't cancel", "This bill  already has payments");
    return;
  }
  document.getElementById("cancelDialog").showModal();
}
document
  .getElementById("keepButton")
  .addEventListener("click", function () {
    document.getElementById("cancelDialog").close();
  });


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
    status: "active",
    payments: [],
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

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "cancel-button";
    cancelButton.textContent = "Cancel bill";
    cancelButton.addEventListener("click", function () {
      openCancelDialog(bill);
    });

    if (bill.note !== "") {
      const noteText = document.createElement("p");
      noteText.className = "bill-note";
      noteText.textContent = bill.note;
      card.appendChild(noteText);
    }

    if (bill.createdAt) {
      added.textContent =
        "Added " +
        new Date(bill.createdAt).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      card.appendChild(added);
    }
    if (bill.status === "canceled") {
        card.classList.add("bill-card-canceled");
        const pill = document.createElement("span");
        pill.className = "status status-canceled";
        pill.textContent = "Canceled";
        const why = document.createElement("p");
        why.className = "bill-note";
        why.textContent = "Reason: " + bill.cancelReason;
        card.appendChild(pill);
        card.appendChild(why);
    } else {
        card.appendChild(cancelButton);
    }
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

document
  .getElementById("confirmCancelButton")
  .addEventListener("click", function () {
    const reason = document.getElementById("cancelReason").value.trim();
    const message = document.getElementById("cancelMessage");
    if (reason === "") {
      message.textContent = "Please give a reason.";
      return;
    }
    const bill = bills.find(function (item) {
      return item.id === billToCancel;
    });
    bill.status = "canceled";
    bill.cancelReason = reason;
    bill.cancelledAt = new Date().toISOString();
    saveBills();
    document.getElementById("cancelDialog").close();
    renderBills();
    showToast("Bill canceled", bill.title);
  });

