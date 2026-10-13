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
  updateHomeStats();
  renderHome();
  renderOverdue();
  renderHistory();
}

let billToCancel = null;

function openCancelDialog(bill) {
  billToCancel = bill.id;
  document.getElementById("cancelBillName").textContent = bill.title;
  document.getElementById("cancelReason").value = "";
  document.getElementById("cancelMessage").textContent = "";
  if (bill.payments && bill.payments.length > 0) {
    showToast("Can't cancel", "This bill already has payments");
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
  if (!Number.isInteger(billAmount)) {
    formMessage.textContent = "Enter a whole amount in naira.";
    return;
  }
  if (billDue === "") {
    formMessage.textContent = "Please choose a date.";
    return;
  }

  if (billDue < todayString()) {
    formMessage.textContent =
      "The due date can't be in the past. If the bill is late, say so in the note.";
    return;
  }
  const recipients = chosenRecipients();
 if (recipients.length === 0) {
   formMessage.textContent =
     "Choose at least one joined roommate for this bill.";
   return;
 }
formMessage.textContent = "";

  const amounts = splitAmount(billAmount, recipients.length);
  const shares =recipients.map(function (roommate, index) {
    return { roommateId: roommate.id, name: roommate.name, amount: amounts[index] };
  });






  const newBill = {
    id: Date.now(),
    title: billTitle,
    amount: billAmount,
    dueDate: billDue,
    note: billNote,
    createdAt: new Date().toISOString(),
    status: "active",
    payments: [],
    shares: shares,
  };
  bills.push(newBill);
  saveBills();
  renderBills();
  billForm.reset();
  showBillsView("List");
showToast("Bill added", billTitle);
 
});

function formatNaira(number) {
   return "₦" + number.toLocaleString("en-NG");
 }
function splitAmount(total, people) {
     const base = Math.floor(total / people);
     const extra = total - base * people;
     const parts = [];
     for (let i = 0; i < people; i++) {
       parts.push(i < extra ? base + 1 : base);
     }
     return parts;
}
function todayString(){
  return new Date().toLocaleDateString("en-CA");
}
function isPastDue(bill) {
  return bill.dueDate < todayString();
}



function totalPaid(bill) {
  return (bill.payments || [])
    .filter(function (payment) {
      return payment.status === "confirmed";
    })
    .reduce(function (sum, payment) {
      return sum + payment.amount;
    }, 0);
}

function paidBy(bill, roommateId) {
  return (bill.payments || [])
    .filter(function (payment) {
      return payment.roommateId === roommateId && payment.status === "confirmed";
    })
    .reduce(function (sum, payment) {
      return sum + payment.amount;
    }, 0);
}

function shareState(bill, share) {
  const paid = paidBy(bill, share.roommateId);
  if (paid >= share.amount) {
    return "paid";
  }

  if (isPastDue(bill)) {
    return "overdue";
  }
  if (paid > 0) {
    return "part";
  }
  return "unpaid";
}




function updateHomeStats() {
  let collected = 0;
  let outstanding = 0;
  let overdue = 0;

  bills.forEach(function (bill) {
    if (bill.status === "canceled") {
      return;
    }
    const paid = totalPaid(bill);
    const left = bill.amount - paid;
    collected += paid;
    outstanding += left;
    if (isPastDue(bill)) {
      overdue += left;
    }
  })
  document.getElementById("statCollected").textContent = formatNaira(collected);
    document.getElementById("statOutstanding").textContent = formatNaira(outstanding);
    document.getElementById("statOverdue").textContent = formatNaira(overdue);

}


let openBillId = null;
let detailFrom = "List";
function openBillDetail(bill, from) {
  openBillId = bill.id;
  detailFrom = from || "List";
  renderBillDetail();
  showBillsView("Detail");
}


function renderBillDetail (){
  const bill = bills.find(function (item) {
    return item.id === openBillId;
  });
  const box = document.getElementById("billDetail");
  box.innerHTML = "";
  if (!bill) {
    return;
  }
  drawBill(bill, box);
}

function drawBill(bill, box)  {
  const card = document.createElement("div");
  card.className = "bill-card";

  const top = document.createElement("div");
  top.className = "bill-top";
  const title = document.createElement("p");
  title.className = "bill-title";
  title.textContent = bill.title;
  const amount = document.createElement("p");
  amount.className = "bill-amount";
  amount.textContent = formatNaira(bill.amount);
  top.appendChild(title);
  top.appendChild(amount);
const due = document.createElement("p");
due.className = "bill-note";
  due.textContent = "Due " + bill.dueDate;
  

  const collected = totalPaid(bill);
  const summary = document.createElement("p");
  summary.className = "bill-note";
  summary.textContent =
    "Collected " + formatNaira(collected) + " of " + formatNaira(bill.amount);

  const bar = document.createElement("div");
  bar.className = "progress";
  const fill = document.createElement("div");
  fill.className = "progress-fill";
  fill.style.width =
    Math.min(100, Math.round((collected / bill.amount) * 100)) + "%";
  bar.appendChild(fill);

const paidCount = (bill.shares || []).filter(function (share) {
  return shareState(bill, share) === "paid";
}).length;
const people = document.createElement("p");
people.className = "bill-note";
  people.textContent = paidCount + " of " + (bill.shares || []).length + " paid";
  
card.appendChild(top);
card.appendChild(due);
card.appendChild(summary);
card.appendChild(bar);
card.appendChild(people);
box.appendChild(card);



  const label = document.createElement("p");
  label.className = "section-label";
  label.textContent = "Payments";
  box.appendChild(label);

  if (!bill.shares || bill.shares.length === 0) {
    const none = document.createElement("p");
    none.className = "bill-note";
    none.textContent = "No split was saved for this bill.";
    box.appendChild(none);
    return;
  }

  const list = document.createElement("div");
  list.className = "person-list";
  bill.shares.forEach(function (share) {
    const row = document.createElement("div");
    row.className = "person-row";
    const paid = paidBy(bill, share.roommateId);

    const left = document.createElement("div");
    const name = document.createElement("p");
    name.className = "person-name";
    name.textContent = share.name;
    const owes = document.createElement("p");
    owes.className = "person-meta";
   owes.textContent =
     paid > 0
       ? "Paid " + formatNaira(paid) + " of " + formatNaira(share.amount)
       : formatNaira(share.amount);

    left.appendChild(name);
    left.appendChild(owes);

    const state = shareState(bill, share);
if (state !== "paid") {
  const payButton = document.createElement("button");
  payButton.type = "button";
  payButton.className = "mark-button";
  payButton.textContent = "Record payment";
  payButton.addEventListener("click", function () {
    openPaymentDialog(bill, share);
  });
  left.appendChild(payButton);
}


    const pill = document.createElement("span");
    if (state === "paid") {
      pill.className = "status status-paid";
      pill.textContent = "Paid";
    } else if (state === "overdue") {
      pill.className = "status status-overdue";
      pill.textContent = "Overdue";
    } else if (state === "part") {
      pill.className = "status status-part";
      pill.textContent = "Part-paid";
    } else {
      pill.className = "status status-unpaid";
      pill.textContent = "Unpaid";
    }

    row.appendChild(left);
    row.appendChild(pill);
    list.appendChild(row);
  });
  box.appendChild(list);
}





let paymentFor = null;
function openPaymentDialog(bill, share) {
   const remaining = share.amount - paidBy(bill, share.roommateId);
   paymentFor = { billId: bill.id, roommateId: share.roommateId };
   document.getElementById("paymentWho").textContent =
     share.name + " · " + bill.title;
   document.getElementById("paymentLeft").textContent =
     "Still to pay: " + formatNaira(remaining);
   document.getElementById("paymentAmount").value = remaining;
   document.getElementById("paymentMessage").textContent = "";
   document.getElementById("paymentDialog").showModal();
}

function currentBill() {
  const active = bills.filter(function (bill) {
    return bill.status !== "canceled";
  });
  return active[active.length - 1];
}
function renderHome() {
  const box = document.getElementById("homeBill");
  box.innerHTML = "";

  const label = document.createElement("p");
  label.className = "section-label";
  label.textContent = "Current bill";
  box.appendChild(label);

  const bill = currentBill();
  if (!bill) {
    const none = document.createElement("p");
    none.className = "bill-note";
    none.textContent = "No bills yet. Add one in the Bills tab.";
    box.appendChild(none);
    return;
  }
  drawBill(bill, box);
}

function daysLate(bill) {
   const ms = new Date(todayString()) - new Date(bill.dueDate);
   return Math.floor(ms / 86400000);
}
function overdueByRoommate() {
     const groups = {};
     bills.forEach(function (bill) {
       if (bill.status === "canceled" || !isPastDue(bill)) {
         return;
       }
       (bill.shares || []).forEach(function (share) {
         const left = share.amount - paidBy(bill, share.roommateId);
         if (left <= 0) {
           return;
         }
         if (!groups[share.roommateId]) {
           groups[share.roommateId] = { name: share.name, total: 0, items: [] };
         }
         groups[share.roommateId].total += left;
         groups[share.roommateId].items.push({
           bill: bill,
           share: share,
           left: left,
         });
       });
     });
     return Object.values(groups).sort(function (a, b) {
       return b.total - a.total;
     });
}
function renderOverdue() {
  const box = document.getElementById("overdueList");
    box.innerHTML = "";
    const groups = overdueByRoommate();

    if (groups.length === 0) {
        const none = document.createElement("p");
        none.className = "bill-note";
        none.textContent = "Nothing is overdue. Everyone is up to date.";
        box.appendChild(none);
        return;
    }

    const all = groups.reduce(function (sum, group) {
        return sum + group.total;
    }, 0);
    const summary = document.createElement("p");
    summary.className = "bill-note";
    summary.textContent =
        formatNaira(all) + " overdue from " + groups.length +
        (groups.length === 1 ? " roommate" : " roommates");
    box.appendChild(summary);

    groups.forEach(function (group) {
        const card = document.createElement("div");
        card.className = "bill-card";

        const top = document.createElement("div");
        top.className = "bill-top";
        const name = document.createElement("p");
        name.className = "bill-title";
        name.textContent = group.name;
        const total = document.createElement("p");
        total.className = "bill-amount overdue-amount";
        total.textContent = formatNaira(group.total);
        top.appendChild(name);
        top.appendChild(total);
        card.appendChild(top);

        group.items.forEach(function (item) {
            const row = document.createElement("div");
            row.className = "overdue-row";

            const left = document.createElement("div");
            const title = document.createElement("p");
            title.className = "person-name";
            title.textContent = item.bill.title;

            const days = daysLate(item.bill);
            const meta = document.createElement("p");
            meta.className = "person-meta";
            meta.textContent =
                "Due " + item.bill.dueDate + " · " + days +
                (days === 1 ? " day" : " days") + " overdue";

            const payButton = document.createElement("button");
            payButton.type = "button";
            payButton.className = "mark-button";
            payButton.textContent = "Record payment";
            payButton.addEventListener("click", function () {
                openPaymentDialog(item.bill, item.share);
            });

            left.appendChild(title);
            left.appendChild(meta);
            left.appendChild(payButton);

            const amount = document.createElement("p");
            amount.className = "overdue-amount";
            amount.textContent = formatNaira(item.left);

            row.appendChild(left);
            row.appendChild(amount);
            card.appendChild(row);
        });
        box.appendChild(card);
    });
}

function monthKey(bill) {
  if (bill.createdAt) {
    return new Date(bill.createdAt).toLocaleDateString("en-CA").slice(0, 7);
  }
  return (bill.dueDate || "").slice(0, 7);
}

function monthLabel(key) {
  return new Date(key + "-15").toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function billStatus(bill) {
  if (bill.status === "canceled") {
    return "canceled";
  }
  if (totalPaid(bill) >= bill.amount) {
    return "settled";
  }
  if (isPastDue(bill)) {
    return "overdue";
  }
  return "open";
}

function billsByMonth() {
    const groups = {};
    bills.forEach(function (bill) {
        const key = monthKey(bill);
        if (!groups[key]) {
            groups[key] = { key: key, bills: [] };
        }
        groups[key].bills.push(bill);
    });
    return Object.values(groups).sort(function (a, b) {
        return a.key < b.key ? 1 : -1;
    });
}






function statCard(label, value) {
  const card = document.createElement("div");
  card.className = "stat-card";
  const small = document.createElement("p");
  small.className = "stat-label";
  small.textContent = label;
  const big = document.createElement("p");
  big.className = "stat-value";
  big.textContent = value;
  card.appendChild(small);
  card.appendChild(big);
  return card;
}

let historyFilter = "all";
let historySearch = "";
function matchesFilter(bill) {
    const statusOk =
      historyFilter === "all" || billStatus(bill) === historyFilter;
    const textOk = bill.title.toLowerCase().includes(historySearch);
    return statusOk && textOk;
}




function renderHistory() {
  const select = document.getElementById("historyMonth");
  const chosen = select.value || "all";
  const groups = billsByMonth();

  select.innerHTML = "";
  const everything = document.createElement("option");
  everything.value = "all";
  everything.textContent = "All months";
  select.appendChild(everything);
  groups.forEach(function (group) {
    const option = document.createElement("option");
    option.value = group.key;
    option.textContent = monthLabel(group.key);
    select.appendChild(option);
  });
  select.value = chosen;
  if (select.value === "") {
    select.value = "all";
  }

  const box = document.getElementById("historyList");
  box.innerHTML = "";
  const shown = groups.filter(function (group) {
   const monthOk = select.value === "all" || group.key === select.value;
   return monthOk && group.bills.some(matchesFilter);
  });
  if (shown.length === 0) {
    const none = document.createElement("p");
    none.className = "bill-note";
   none.textContent = bills.length === 0 ? "No bills yet." : "No bills match your search or filter.";
    box.appendChild(none);
    return;
  }

  const looks = {
    settled: ["status status-paid", "Settled"],
    open: ["status status-unpaid", "Open"],
    overdue: ["status status-overdue", "Overdue"],
    canceled: ["status status-canceled", "Canceled"],
  };

  shown.forEach(function (group) {
    const visible = group.bills.filter(matchesFilter);
    const label = document.createElement("p");
    label.className = "section-label";
    label.textContent =
      monthLabel(group.key) +
      " · " +
      visible.length +
      (visible.length === 1 ? " bill" : " bills");
    box.appendChild(label);

    let billed = 0;
    let collected = 0;
    visible.forEach(function (bill) {
      if (bill.status === "canceled") {
        return;
      }
      billed += bill.amount;
      collected += totalPaid(bill);
    });
    const stats = document.createElement("div");
    stats.className = "stat-row";
    stats.appendChild(statCard("Billed", formatNaira(billed)));
    stats.appendChild(statCard("Collected", formatNaira(collected)));
    stats.appendChild(statCard("Outstanding", formatNaira(billed - collected)));
    box.appendChild(stats);

    const list = document.createElement("div");
    list.className = "person-list";
    list.style.marginTop = "16px";
    visible
      .slice()
      .reverse()
      .forEach(function (bill) {
        const row = document.createElement("div");
        row.className = "person-row history-row";

        const left = document.createElement("div");
        const title = document.createElement("p");
        title.className = "person-name";
        title.textContent = bill.title;
        const meta = document.createElement("p");
        meta.className = "person-meta";
        meta.textContent =
          "Due " + bill.dueDate + " · " + formatNaira(bill.amount);
        left.appendChild(title);
        left.appendChild(meta);

        const look = looks[billStatus(bill)];
        const pill = document.createElement("span");
        pill.className = look[0];
        pill.textContent = look[1];

        row.appendChild(left);
        row.appendChild(pill);
        row.addEventListener("click", function () {
          openBillDetail(bill, "History");
        });
        list.appendChild(row);
      });
    box.appendChild(list);
  });
}









function renderBills() {
  const billList = document.getElementById("billList");
  billList.innerHTML = "";
const current = bills.filter(function (bill) {
  return monthKey(bill) === todayString().slice(0, 7);
});
  if (current.length === 0) {
    const none = document.createElement("p");
    none.className = "bill-note";
    none.textContent = "No bills this month yet.";
    billList.appendChild(none);
    return;
  }

  current.forEach(function (bill) {
    const card = document.createElement("div");
    card.className = "bill-card";

    const top = document.createElement("div");
    top.className = "bill-top";

    const title = document.createElement("p");
    title.textContent = bill.title;
    title.className = "bill-title";

    const amount = document.createElement("p");
    amount.className = "bill-amount";
    amount.textContent = formatNaira(bill.amount);

    const note = document.createElement("p");
    note.className = "bill-note";
    note.textContent = "Due " + bill.dueDate;

    const added = document.createElement("p");
    added.className = "bill-note";

    top.appendChild(title);
    top.appendChild(amount);
    card.appendChild(top);
    card.appendChild(note);

    if (bill.shares && bill.shares.length > 0) {
      const highest = bill.shares[0].amount;
      const lowest = bill.shares[bill.shares.length - 1].amount;
      let eachText = formatNaira(lowest) + " each";
      if (highest !== lowest) {
        eachText =
          formatNaira(lowest) + " to " + formatNaira(highest) + " each";
      }

      const split = document.createElement("p");
      split.className = "bill-note";
      split.textContent =
        "Split between " + bill.shares.length + " roommates, " + eachText;
      card.appendChild(split);
    }


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
        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "view-button";
        viewButton.textContent = "View payments";
        viewButton.addEventListener("click", function () {
          openBillDetail(bill);
        });
const actions = document.createElement("div");
actions.className = "row-actions";
actions.appendChild(viewButton);
actions.appendChild(cancelButton);
card.appendChild(actions);
    }
    billList.appendChild(card);
  });
}

function makeEl(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) {
    el.textContent = text;
  }
  if (className) {
    el.className = className;
  }
  return el;
}

function niceDate(iso) {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function makeTable(headings, rows) {
  const table = makeEl("table");
  const head = makeEl("tr");
  headings.forEach(function (heading) {
    head.appendChild(makeEl("th", heading));
  });
  table.appendChild(head);
  rows.forEach(function (cells) {
    const row = makeEl("tr");
    cells.forEach(function (cell) {
      row.appendChild(makeEl("td", cell));
    });
    table.appendChild(row);
  });
  return table;
}






function buildReport() {
   const box = document.getElementById("printReport");
    box.innerHTML = "";
    const stateLabels = { paid: "Paid", part: "Part-paid", overdue: "Overdue", unpaid: "Unpaid" };

   box.appendChild(makeEl("h2", "Hostel Split backup"));
    box.appendChild(makeEl("p", "Hostel: " + settings.hostelName + " · Head: " + settings.headName));
    box.appendChild(makeEl("p", "Saved on " + new Date().toLocaleString("en-GB")));

let billed = 0;
    let collected = 0;
    bills.forEach(function (bill) {
        if (bill.status === "canceled") {
          return;
        }
        billed += bill.amount;
        collected += totalPaid(bill);
    });
    box.appendChild(makeEl("p",
        bills.length + (bills.length === 1 ? " bill" : " bills") +
        " · Billed " + formatNaira(billed) +
        " · Collected " + formatNaira(collected) +
        " · Outstanding " + formatNaira(billed - collected)
    ));

  
  box.appendChild(makeEl("h3", "Roommates (" + roommates.length + ")"));
  box.appendChild(
    makeTable(
      ["Name", "WhatsApp", "Status", "Added"],
      roommates.map(function (roommate) {
        return [
          roommate.name,
          roommate.phone ? "+" + roommate.phone : "—",
          roommate.status === "joined" ? "Joined" : "Invited",
          niceDate(roommate.createdAt),
        ];
      }),
    ),
  );

   box.appendChild(makeEl("h3", "Bills"));
    billsByMonth().forEach(function (group) {
      box.appendChild(makeEl("h3", monthLabel(group.key)));
      group.bills.forEach(function (bill) {
        const block = makeEl("div", undefined, "report-block");
        block.appendChild(
          makeEl("h4", bill.title + " · " + formatNaira(bill.amount)),
        );
        block.appendChild(
          makeEl(
            "p",
            "Status: " +
              billStatus(bill).toUpperCase() +
              " · Due " +
              bill.dueDate +
              " · Added " +
              niceDate(bill.createdAt),
          ),
        );

        if (bill.note) {
          block.appendChild(makeEl("p", "Note: " + bill.note));
        }
        if (bill.status === "canceled") {
          block.appendChild(
            makeEl(
              "p",
              "Canceled on " +
                niceDate(bill.cancelledAt) +
                " · Reason: " +
                bill.cancelReason,
            ),
          );
        } else {
          const shares = bill.shares || [];
          const payments = bill.payments || [];
          const paidCount = shares.filter(function (share) {
            return shareState(bill, share) === "paid";
          }).length;
          block.appendChild(
            makeEl(
              "p",
              "Collected " +
                formatNaira(totalPaid(bill)) +
                " of " +
                formatNaira(bill.amount) +
                " · " +
                paidCount +
                " of " +
                shares.length +
                " paid",
            ),
          );
          block.appendChild(
            makeTable(
              ["Roommate", "Share", "Paid", "Status"],
              shares.map(function (share) {
                return [
                  share.name,
                  formatNaira(share.amount),
                  formatNaira(paidBy(bill, share.roommateId)),
                  stateLabels[shareState(bill, share)],
                ];
              }),
            ),
          );
          if (payments.length === 0) {
            block.appendChild(makeEl("p", "No payments yet."));
          } else {
            block.appendChild(makeEl("p", "Payments received"));
            block.appendChild(
              makeTable(
                ["Date", "Roommate", "Amount"],
                payments.map(function (payment) {
                  const share = shares.find(function (item) {
                    return item.roommateId === payment.roommateId;
                  });
                  return [
                    niceDate(payment.paidAt),
                    share ? share.name : "Unknown",
                    formatNaira(payment.amount),
                  ];
                }),
              ),
            );
          }
        }

        box.appendChild(block);
      });
    });

}








// 5. JS: the





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
  document.getElementById("billDue").min = todayString();
  renderRecipientChoices();
  showBillsView("Form");
});
document.querySelectorAll('input[name="billFor"]').forEach(function (radio) {
  radio.addEventListener("change", renderRecipientChoices);
});



document.getElementById("backButton").addEventListener("click", function () {
  showBillsView("List");
});

document.getElementById("detailBackButton").addEventListener("click", function () {
 showBillsView(detailFrom);
});
document.getElementById("historyButton").addEventListener("click", function () {
  renderHistory();
  showBillsView("History");
});
document.getElementById("historyBackButton").addEventListener("click", function () {
    showBillsView("List");
});
document.getElementById("historyMonth").addEventListener("change", renderHistory);
document.querySelectorAll("#historyFilters .chip").forEach(function (chip) {
  chip.addEventListener("click", function () {
    historyFilter = chip.dataset.filter;
    document.querySelectorAll("#historyFilters .chip").forEach(function (other) {
      other.classList.toggle("chip-active", other === chip);
    });
    renderHistory();
    
  });
});
document
  .getElementById("historySearch")
  .addEventListener("input", function (event) {
    historySearch = event.target.value.trim().toLowerCase();
     renderHistory();
  });


  const searchToggle = document.getElementById("searchToggle");
  searchToggle.addEventListener("click", function () {
    const panel = document.getElementById("searchPanel");
    const box = document.getElementById("historySearch");
    const isOpen = panel.classList.toggle("open");
    searchToggle.classList.toggle("icon-button-active", isOpen);
    if (isOpen) {
      box.focus();
    } else {
      box.value = "";
      historySearch = "";
      renderHistory();
    }
  });

  document.getElementById("backupButton").addEventListener("click", function () {
    buildReport();
    window.print();
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
updateHomeStats();
renderHome();
renderOverdue();
renderHistory();

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

const savedRoommates = localStorage.getItem("hostelRoommates");
let roommates = savedRoommates ? JSON.parse(savedRoommates) : [];

function saveRoommates() {
  localStorage.setItem("hostelRoommates", JSON.stringify(roommates));
}

function cleanPhone(text) {
  let digits = text.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    digits = "234" + digits.slice(1);
  }
  return digits;
}




const roommateForm = document.getElementById("roommateForm");
roommateForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = document.getElementById("roommateName").value.trim();
  const message = document.getElementById("roommateMessage");

  if (name === "") {
    message.textContent = "Please enter a name.";
    return;
  }
  const exists = roommates.some(function (roommate) {
    return roommate.name.toLowerCase() === name.toLowerCase();
  });
  if (exists) {
    message.textContent = "That name is already on the list.";
    return;
  }
  const phone = cleanPhone(document.getElementById("roommatePhone").value);
  if (phone.length !== 13 || !phone.startsWith("234")) {
    message.textContent = "Enter an 11-digit Nigerian number, like 08012345678.";
    return;
  } 
  const phoneUsed = roommates.some(function (roommate) {
    return roommate.phone === phone;
  });
  if (phoneUsed) {
    message.textContent = "That number is already on the list.";
    return
  }



  message.textContent = "";
  roommates.push({
    id: Date.now(),
    name: name,
    phone: phone,
    status:"invited",
    createdAt: new Date().toISOString(),



  });
  saveRoommates();
  renderRoommates();
  roommateForm.reset();
  showToast("Roommate added", name);
});

function markJoined(id) {
  const roommate = roommates.find(function (item) {
    return item.id === id;
  })
  roommate.status = "joined";
  roommate.joinedAt = new Date().toISOString();
  saveRoommates();
  renderRoommates();
  showToast("Roommate joined", roommate.name);
}

function updateRecipientNote() {
  const count = chosenRecipients().length;
  const note = document.getElementById("recipientNote");
  const button = document.getElementById("billSubmitButton");

  if (count === 0) {
    note.textContent =
      joinedRoommates().length === 0
        ? "No roommate has joined yet."
        : "Select at least one roommate.";
  } else {
    note.textContent = "This bill will be shared with " + count + " roommates.";
  }
  if (selectedMode() === "all") {
    button.textContent = "Add bill to all roommates";
  } else {
    button.textContent =
      "Add bill to " + count + (count === 1 ? " roommate" : " roommates");
  }
 }

function joinedRoommates() {
   return roommates.filter(function (roommate) {
     return roommate.status === "joined";
   });
}
function selectedMode() {
    return document.querySelector('input[name="billFor"]:checked').value;
}

function chosenRecipients() {
  const joined = joinedRoommates();
  if (selectedMode() === "all") {
    return joined;
  }
  const boxes = document.querySelectorAll("#recipientChoices input:checked");
  const ids = Array.from(boxes).map(function (box) {
    return Number(box.value);
  });
  return joined.filter(function (roommate) {
    return ids.includes(roommate.id);
  });
}
  




  function renderRecipientChoices() {
  const list = document.getElementById("recipientChoices");
  list.innerHTML = "";
  list.hidden = selectedMode() === "all";

  joinedRoommates().forEach(function (roommate) {
    const row = document.createElement("label");
    row.className = "choice";

    const box = document.createElement("input");
    box.type = "checkbox";
    box.value = roommate.id;
    box.checked = true;
    box.addEventListener("change", updateRecipientNote);

    const name = document.createElement("span");
    name.textContent = roommate.name;

    row.appendChild(box);
    row.appendChild(name);
    list.appendChild(row);
  });
  updateRecipientNote()
}




function updateRoommateStats() {
  const joined = roommates.filter(function (roommate) {
    return roommate.status === "joined";
  }).length;
  document.getElementById("roommateTotal").textContent = roommates.length;
  document.getElementById("roommateJoined").textContent = joined;
  document.getElementById("roommateInvited").textContent =
    roommates.length - joined;
}





function renderRoommates() {
  updateRoommateStats();
  const roommateList = document.getElementById("roommateList");
  roommateList.innerHTML = "";
  document.getElementById("roommateCount").textContent =
    "Roommates (" + roommates.length + ")";

  if (roommates.length === 0) {
    const empty = document.createElement("p");
    empty.className = "bill-note";
    empty.textContent = "No roommates yet. Add the first one above.";
    roommateList.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "person-list";
  roommates.forEach(function (roommate) {
    const row = document.createElement("div");
    row.className = "person-row";
    const isJoined = roommate.status === "joined";

    const left = document.createElement("div");
    const name = document.createElement("p");
    name.className = "person-name";
    name.textContent = roommate.name;
    left.appendChild(name);
    const actions = document.createElement("div");
    actions.className = "row-actions";
    
    if (roommate.phone) {
      const phoneText = document.createElement("p");
      phoneText.className = "person-meta";
      phoneText.textContent = "+" + roommate.phone;
      left.appendChild(phoneText);
      if (!isJoined) {
        const inviteText =
          "Hi " +
          roommate.name +
          ", I've added you to Hostel Split, where I will post our hostel bills and each person's share. I'll send you the join link as soon as it is ready.";
        const invite = document.createElement("a");
        invite.className = "invite-link";
        invite.textContent = "Invite on WhatsApp";
        invite.href =
          "https://wa.me/" +
          roommate.phone +
          "?text=" +
          encodeURIComponent(inviteText);
        invite.target = "_blank";
        invite.rel = "noopener";
        actions.appendChild(invite);
      }
    }

    if (!isJoined) {
      const markButton = document.createElement("button");
      markButton.type = "button";
      markButton.className = "mark-button";
      markButton.textContent = "Mark as joined";
      markButton.addEventListener("click", function () {
        if (confirm("Has " + roommate.name + " confirmed on WhatsApp that they joined?")) {
          markJoined(roommate.id);
        }
      });
      actions.appendChild(markButton);
      left.appendChild(actions);
    }




      const pill = document.createElement("span");
      pill.className = isJoined ? "status status-paid" : "status status-unpaid";
      pill.textContent = isJoined ? "Joined" : "Invited";
      row.appendChild(left);
    row.appendChild(pill);
    list.appendChild(row);
    
   
  });
  roommateList.appendChild(list);
}

renderRoommates();

document
  .getElementById("paymentCancelButton")
  .addEventListener("click", function () {
    document.getElementById("paymentDialog").close();
  });
 document.getElementById("paymentSaveButton").addEventListener("click", function () {
    const bill = bills.find(function (item) {
        return item.id === paymentFor.billId;
    });
   
const share = bill.shares.find(function (item) {
        return item.roommateId === paymentFor.roommateId;
    });
  const remaining = share.amount - paidBy(bill, share.roommateId);
    const amount = Number(document.getElementById("paymentAmount").value);
    const message = document.getElementById("paymentMessage");

    if (!Number.isInteger(amount) || amount <= 0) {
        message.textContent = "Enter a whole amount more than 0.";
        return;
    }
    if (amount > remaining) {
        message.textContent = "That is more than the " + formatNaira(remaining) + " still to pay.";
        return;
    }
    if (!bill.payments) {
        bill.payments = [];
    }
    bill.payments.push({
        id: Date.now(),
        roommateId: share.roommateId,
        amount: amount,
        paidAt: new Date().toISOString(),
        status: "confirmed",
        recordedBy: "head",
    });
    saveBills();
    document.getElementById("paymentDialog").close();
    renderBillDetail();
    showToast("Payment recorded", share.name + " paid " + formatNaira(amount));
 });

const savedSettings = localStorage.getItem("hostelSettings");
let settings = savedSettings ? JSON.parse(savedSettings) : null;

function saveSettings() {
  localStorage.setItem("hostelSettings", JSON.stringify(settings));
}
function applySettings() {
  const nav = document.querySelector("nav");
  const button = document.getElementById("setupButton");
  document.getElementById("editHostelButton").hidden = !settings;
  document.getElementById("deleteHostelButton").hidden = !settings;
  if (!settings) {
    nav.hidden = true;
    button.textContent = "Start";
    showScreen("Welcome");
    return;
  }
  nav.hidden = false;
  button.textContent = "Save changes";
  document.getElementById("hostelName").textContent = settings.hostelName;
}

const setupForm = document.getElementById("setupForm");
setupForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const hostelName = document.getElementById("setupHostel").value.trim();
  const headName = document.getElementById("setupHead").value.trim();
  const message = document.getElementById("setupMessage");

  if (hostelName === "") {
    message.textContent = "Please enter your hostel's name.";
    return;
  }
  if (headName === "") {
    message.textContent = "Please enter your name.";
    return;
  }
  message.textContent = "";
  settings = {
    hostelName: hostelName,
    headName: headName,
    createdAt: settings ? settings.createdAt : new Date().toISOString(),
  };
  saveSettings();
  applySettings();
  showScreen("Home");
  showToast("Hostel saved", hostelName);
});
document
  .getElementById("editHostelButton")
  .addEventListener("click", function () {
    document.getElementById("setupHostel").value = settings.hostelName;
    document.getElementById("setupHead").value = settings.headName;
    showScreen("Welcome");
  }); 
applySettings();


let backupDone = false

function openDeleteDialog() {
    backupDone = false;
    document.getElementById("deleteSavedBox").checked = false;
    document.getElementById("deleteSavedBox").disabled = true;
    document.getElementById("deleteConfirmName").value = "";
    document.getElementById("deleteBackupNote").textContent = "Step 1: download your backup first.";
    updateDeleteButton();
    document.getElementById("deleteDialog").showModal();
}

function updateDeleteButton() {
    const saved = document.getElementById("deleteSavedBox").checked;
    const typed = document.getElementById("deleteConfirmName").value.trim().toLowerCase();
    const right = typed === settings.hostelName.toLowerCase();
    document.getElementById("deleteConfirmButton").disabled = !(backupDone && saved && right);
}

document.getElementById("deleteHostelButton").addEventListener("click", openDeleteDialog);

document.getElementById("deleteCancelButton").addEventListener("click", function () {
    document.getElementById("deleteDialog").close();
});

document.getElementById("deleteBackupButton").addEventListener("click", function () {
    buildReport();
    window.print();
    backupDone = true;
    document.getElementById("deleteSavedBox").disabled = false;
    document.getElementById("deleteBackupNote").textContent = "Backup opened. Save it as a PDF, then tick the box below.";
    updateDeleteButton();
});

document.getElementById("deleteSavedBox").addEventListener("change", updateDeleteButton);
document.getElementById("deleteConfirmName").addEventListener("input", updateDeleteButton);

document.getElementById("deleteConfirmButton").addEventListener("click", function () {
    localStorage.removeItem("hostelBills");
    localStorage.removeItem("hostelRoommates");
    localStorage.removeItem("hostelSettings");
    location.reload();
});
