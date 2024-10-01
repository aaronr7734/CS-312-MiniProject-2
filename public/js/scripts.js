document.addEventListener("DOMContentLoaded", () => {
  const filterForm = document.getElementById("filterForm");
  const setSelect = document.getElementById("setSelect");
  const typeSelect = document.getElementById("typeSelect");
  const classSelect = document.getElementById("classSelect");
  const costSelect = document.getElementById("costSelect");
  const resultsDiv = document.getElementById("results");

  // Fetch card info to populate filter options
  fetch("/api/cards/info")
    .then((response) => response.json())
    .then((data) => {
      populateFilterOptions(data);
    })
    .catch((error) => {
      console.error("Error fetching card info:", error);
    });

  // Handle filter form submission
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const queryString = new URLSearchParams(
      new FormData(filterForm)
    ).toString();
    fetch(`/cards/filter?${queryString}`)
      .then((response) => response.json())
      .then((cards) => {
        displayResults(cards);
      })
      .catch((error) => {
        console.error("Error fetching filtered cards:", error);
        resultsDiv.innerHTML = `<div class="alert alert-danger">An error occurred while fetching cards.</div>`;
      });
  });

  function populateFilterOptions(data) {
    // Populate sets
    data.sets.forEach((set) => {
      const option = document.createElement("option");
      option.value = set;
      option.textContent = set;
      setSelect.appendChild(option);
    });

    // Populate types
    data.types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      typeSelect.appendChild(option);
    });

    // Populate classes
    data.classes.forEach((cls) => {
      const option = document.createElement("option");
      option.value = cls;
      option.textContent = cls;
      classSelect.appendChild(option);
    });

    // Populate costs (0 to 10+)
    for (let i = 0; i <= 10; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      costSelect.appendChild(option);
    }
    const overTenOption = document.createElement("option");
    overTenOption.value = "10+";
    overTenOption.textContent = "10+";
    costSelect.appendChild(overTenOption);
  }

  function displayResults(cards) {
    resultsDiv.innerHTML = "";
    if (cards.length === 0) {
      resultsDiv.innerHTML = "<p>No cards found matching the criteria.</p>";
      return;
    }

    cards.forEach((card) => {
      const cardHtml = `
        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">${card.name}</h5>
            <p class="card-text">
              <strong>Set:</strong> ${card.set}<br />
              <strong>Type:</strong> ${card.type}<br />
              <strong>Class:</strong> ${card.cardClass}<br />
              <strong>Cost:</strong> ${card.cost}<br />
              <strong>Rarity:</strong> ${card.rarity}<br />
              ${card.text ? `<strong>Text:</strong> ${card.text}<br />` : ""}
              ${card.flavor ? `<strong>Flavor:</strong> ${card.flavor}` : ""}
            </p>
          </div>
        </div>
      `;
      resultsDiv.insertAdjacentHTML("beforeend", cardHtml);
    });
  }
});
