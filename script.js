const landing = document.querySelector("#landing");
const auth = document.querySelector("#auth");
const workspace = document.querySelector("#workspace");
const navActions = document.querySelector("#navActions");
const loginContent = document.querySelector("#loginContent");
const signupContent = document.querySelector("#signupContent");
const toast = document.querySelector("#toast");
const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const editor = document.querySelector("#editor");
const preview = document.querySelector("#imagePreview");
const processing = document.querySelector("#processing");
const removeBg = document.querySelector("#removeBg");
const download = document.querySelector("#download");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

function showScreen(name) {
  [landing, auth, workspace].forEach((screen) => {
    screen.classList.remove("active");
  });

  if (name === "home") {
    landing.classList.add("active");
    navActions.hidden = false;
    return;
  }

  if (name === "workspace") {
    workspace.classList.add("active");
    navActions.hidden = true;
    return;
  }

  auth.classList.add("active");
  navActions.hidden = false;

  loginContent.hidden = name !== "login";
  signupContent.hidden = name !== "signup";
}

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => {
    showScreen(button.dataset.screen);
  });
});

document.querySelector("#backToLanding").addEventListener("click", () => {
  showScreen("home");
});

document.querySelectorAll("[data-auth]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.querySelector('input[type="text"]')?.value.trim();

    if (name) {
      document.querySelector("#profileName").textContent = name;
      document.querySelector("#welcomeName").textContent = name.split(" ")[0];
      document.querySelector(".profile-pic").textContent = name[0].toUpperCase();
    }

    showScreen("workspace");

    showToast(
      form.dataset.auth === "signup"
        ? "Your free account is ready!"
        : "Welcome back!"
    );
  });
});

document.querySelector("#chooseFile").addEventListener("click", () => {
  fileInput.click();
});

document.querySelector("#newImage").addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (event) => {
  processFile(event.target.files[0]);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
});

dropZone.addEventListener("drop", (event) => {
  processFile(event.dataTransfer.files[0]);
});

function processFile(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please choose a JPG, PNG, or WEBP image.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast("That file is over the 10 MB limit.");
    return;
  }

  preview.src = URL.createObjectURL(file);

  dropZone.hidden = true;
  editor.hidden = false;

  removeBg.disabled = false;
  download.disabled = true;

  document.querySelector(
    "#editorMessage"
  ).textContent = `${file.name} is ready for editing.`;
}

removeBg.addEventListener("click", () => {
  processing.hidden = false;
  removeBg.disabled = true;

  setTimeout(() => {
    processing.hidden = true;
    removeBg.disabled = false;
    download.disabled = false;

    document.querySelector("#editorMessage").textContent =
      "Background removal is complete. Download your HD image.";

    showToast("Background removed successfully!");
  }, 1800);
});

download.addEventListener("click", () => {
  showToast(
    "Your HD image download will begin when the AI service is connected."
  );
});